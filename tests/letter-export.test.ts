import {afterEach,describe,expect,it,vi} from 'vitest';
import {createLetterPNG,createLetterSVG} from '../lib/export-letter';
import {noteContentInsets,noteShapes} from '../lib/note-design';
import {letterPNGInsets} from '../lib/letter-png-decoration';
import type {Card} from '../lib/card-validation';

afterEach(()=>vi.unstubAllGlobals());

function canvasHarness(){
 const draws:{text:string;x:number;y:number;font:string}[]=[];
 let origin={x:0,y:0};
 const stack:Array<{x:number;y:number}>=[];
 const context={
  font:'',
  measureText(text:string){return {width:Array.from(text).length*parseFloat(this.font.replace('600 ',''))*.6}},
  fillText(text:string,x:number,y:number){draws.push({text,x:x+origin.x,y:y+origin.y,font:this.font})},
  save(){stack.push({...origin})},restore(){origin=stack.pop()!},translate(x:number,y:number){origin={x:origin.x+x,y:origin.y+y}},scale(){},rotate(){},fill(){},stroke(){},clip(){},fillRect(){},
 };
 const canvas={width:0,height:0,getContext:()=>context,toDataURL:()=> 'data:image/png;base64,test'};
 vi.stubGlobal('document',{fonts:{load:async()=>{},ready:Promise.resolve()},createElement:()=>canvas});
 vi.stubGlobal('Path2D',class{});
 return {canvas,draws};
}

describe('letter PNG sizing',()=>{
 for(const theme of Object.keys(noteShapes)){
  it(`grows the ${theme} paper equally in both dimensions and draws the entire letter`,async()=>{
   const {canvas,draws}=canvasHarness();
   const card:Card={theme,flower:'tulip',recipient:'Thầy cô kính mến',message:Array.from({length:30},(_,index)=>`Dòng cảm ơn ${index+1}`).join('\n'),sender:'Người viết cuối thư',anonymous:false,shareSender:false};
   await createLetterPNG(card,{} as HTMLElement);
   const paperSize=canvas.width-letterPNGInsets.left-letterPNGInsets.right;
   expect(paperSize).toBe(canvas.height-letterPNGInsets.top-letterPNGInsets.bottom);
   expect(paperSize).toBeGreaterThan(984);
   expect(draws.filter(draw=>draw.font==='32px "Grandstander"').map(draw=>draw.text)).toEqual(card.message.split('\n'));
   expect(draws.at(-1)?.text).toBe(card.sender);
   const insets=noteContentInsets(theme,0);
   const letterDraws=draws.filter(draw=>/^(600 42|32|25|28)px/.test(draw.font));
   for(const draw of letterDraws){
    expect(draw.x).toBeGreaterThanOrEqual(letterPNGInsets.left+paperSize*insets.left/100);
    expect(draw.y).toBeGreaterThan(letterPNGInsets.top+paperSize*insets.top/100);
    expect(draw.y).toBeLessThan(letterPNGInsets.top+paperSize*(1-insets.bottom/100));
   }
   expect(draws.find(draw=>draw.text==='TRẠM PHÁT SÓNG YÊU THƯƠNG')?.y).toBeLessThan(letterPNGInsets.top);
   expect(draws.find(draw=>draw.text==='20 / 11')?.y).toBeGreaterThan(letterPNGInsets.top+paperSize);
  });
 }
});

describe('standalone letter SVG',()=>{
 function svgHarness(){
  canvasHarness();
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,arrayBuffer:async()=>new Uint8Array([102,111,110,116]).buffer})));
 }
 const card:Card={id:'public-note',theme:'heart',flower:'rose',recipient:'Cô <Lan> & "lớp"',message:'Cảm ơn cô!\n<script>alert("hi")</script>',sender:'Tên riêng',anonymous:false,shareSender:true,decorations:['books','music']};

 it('escapes user writing and embeds fonts and sticker artwork without external assets',async()=>{
  svgHarness();
  const svg=await createLetterSVG(card);
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('Cô &lt;Lan&gt; &amp; &quot;lớp&quot;');
  const writing=Array.from(svg.matchAll(/<text[^>]*>(.*?)<\/text>/g),match=>match[1]).join('');
  expect(writing).toContain('&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;');
  expect(svg).not.toContain('<script>');
  expect(svg.match(/data:font\/woff2;base64,/g)).toHaveLength(3);
  expect(svg.match(/<image href="data:image\/svg\+xml/g)).toHaveLength(2);
  expect(svg).not.toContain('foreignObject');
  expect(svg).toContain('Tên riêng');
 });

 it('hides anonymous names and tolerates a board note with a redacted sender',async()=>{
  svgHarness();
  for(const note of [{...card,anonymous:true},{...card,sender:''}]){
   const svg=await createLetterSVG(note);
   expect(svg).not.toContain('Tên riêng');
   expect(svg).toContain('Một người gửi yêu thương');
  }
 });

 for(const theme of Object.keys(noteShapes)){
  it(`keeps every line inside the ${theme} silhouette for long notes`,async()=>{
   svgHarness();
   const message=Array.from({length:30},(_,index)=>`Dòng cảm ơn ${index+1}`).join('\n');
   const svg=await createLetterSVG({...card,theme,message});
   const [,width,height]=svg.match(/<svg[^>]*width="([\d.]+)" height="([\d.]+)"/)!;
   const paperSize=Number(width)-96;
   expect(paperSize).toBe(Number(height)-104);
   expect(paperSize).toBeGreaterThan(984);
   for(const line of message.split('\n'))expect(svg).toContain(`>${line}</text>`);
   const insets=noteContentInsets(theme,2);
   for(const match of svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"/g)){
    expect(Number(match[1])).toBeGreaterThanOrEqual(40+paperSize*insets.left/100);
    expect(Number(match[2])).toBeLessThan(52+paperSize*(1-insets.bottom/100));
   }
  });
 }

 it('reports missing font assets rather than exporting an incomplete file',async()=>{
  svgHarness();
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false})));
  await expect(createLetterSVG(card)).rejects.toThrow('Export font unavailable');
 });
});
