import {afterEach,describe,expect,it,vi} from 'vitest';
import {createLetterPNG} from '../lib/export-letter';
import {noteContentInsets,noteShapes} from '../lib/note-design';
import type {Card} from '../lib/card-validation';

afterEach(()=>vi.unstubAllGlobals());

function canvasHarness(){
 const draws:{text:string;x:number;y:number;font:string}[]=[];
 const context={
  font:'',
  measureText(text:string){return {width:Array.from(text).length*parseFloat(this.font.replace('600 ',''))*.6}},
  fillText(text:string,x:number,y:number){draws.push({text,x,y,font:this.font})},
  save(){},restore(){},translate(){},scale(){},rotate(){},fill(){},stroke(){},clip(){},fillRect(){},
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
   const paperSize=canvas.width-96;
   expect(paperSize).toBe(canvas.height-104);
   expect(paperSize).toBeGreaterThan(984);
   expect(draws.filter(draw=>draw.font==='32px "Grandstander"').map(draw=>draw.text)).toEqual(card.message.split('\n'));
   expect(draws.at(-1)?.text).toBe(card.sender);
   const insets=noteContentInsets(theme,0);
   for(const draw of draws){
    expect(draw.x).toBeGreaterThanOrEqual(40+paperSize*insets.left/100);
    expect(draw.y).toBeGreaterThan(52+paperSize*insets.top/100);
    expect(draw.y).toBeLessThan(52+paperSize*(1-insets.bottom/100));
   }
  });
 }
});
