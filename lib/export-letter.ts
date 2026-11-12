import type {Card} from './card-validation';
import {noteDesign,noteShape,noteContentInsets,noteStickerSize} from './note-design';
import {notePen,noteDoodleMarks,noteTapePath,noteTapeMarks} from './note-doodle';
import {noteStickerImages} from './note-sticker-art';
import {drawLetterPNGStationery,letterPNGInsets} from './letter-png-decoration';

function textLines(context:CanvasRenderingContext2D,text:string,maxWidth:number):string[]{
 const rows:string[]=[];
 for(const paragraph of text.split('\n')){
  let line='';
  for(const word of paragraph.split(/\s+/)){
   if(!word)continue;
   if(context.measureText((line?line+' ':'')+word).width<=maxWidth){line+=(line?' ':'')+word;continue}
   if(line){rows.push(line);line=''}
   for(const character of word){if(context.measureText(line+character).width>maxWidth&&line){rows.push(line);line=''}line+=character}
  }
  rows.push(line);
 }
 return rows;
}

async function letterLayout(card:Card){
 await document.fonts.load('32px "Grandstander"', 'Gửi người gieo chữ');
 await document.fonts.ready;
 const context=document.createElement('canvas').getContext('2d');if(!context)throw Error('Canvas unavailable');
 const design=noteDesign(card.flower),shape=noteShape(card.theme);
 const insets=noteContentInsets(card.theme,(card.decorations||[]).length);
 const scale=1;
 const layout=(size:number)=>{
  const textWidth=size*(1-(insets.left+insets.right)/100);
  context.font=`${32*scale}px "Grandstander"`;
  const message=textLines(context,card.message,textWidth);
  context.font=`600 ${42*scale}px "Grandstander"`;
  const recipient=textLines(context,card.recipient,textWidth);
  context.font=`${28*scale}px "Grandstander"`;
  const sender=textLines(context,card.anonymous?'Một người gửi yêu thương':card.sender||'Một người gửi yêu thương',textWidth);
  return {message,recipient,sender,height:(50+recipient.length*58+message.length*53+sender.length*43+70)*scale};
 };
 const contentFraction=1-(insets.top+insets.bottom)/100;
 let paperHeight=984;
 while(layout(paperHeight).height>paperHeight*contentFraction){
  paperHeight=Math.ceil(paperHeight*Math.max(1.05,Math.sqrt(layout(paperHeight).height/(paperHeight*contentFraction))));
 }
 const {message,recipient,sender,height:contentHeight}=layout(paperHeight);
 const availableHeight=paperHeight*contentFraction,left=40+paperHeight*insets.left/100;
 const contentTop=52+paperHeight*insets.top/100+(availableHeight-contentHeight)/2;
 const messageTop=contentTop+(50+recipient.length*58)*scale;
 const signatureTop=messageTop+(message.length*53+50)*scale;
 return {design,shape,paperHeight,left,contentTop,messageTop,signatureTop,recipient,message,sender};
}

export async function createLetterPNG(card:Card,_container?:HTMLElement):Promise<string>{
 const {design,shape,paperHeight,left,contentTop,messageTop,signatureTop,recipient,message,sender}=await letterLayout(card);
 const scale=1,canvas=document.createElement('canvas');
 const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');
 canvas.width=letterPNGInsets.left+paperHeight+letterPNGInsets.right;
 canvas.height=letterPNGInsets.top+paperHeight+letterPNGInsets.bottom;
 context.imageSmoothingEnabled=true;
 drawLetterPNGStationery(context,canvas.width,canvas.height,design.paper);
 context.save();context.translate(letterPNGInsets.left-40,letterPNGInsets.top-52);
 const paper=new Path2D(shape.path);
 context.save();context.translate(40,52);context.scale(paperHeight/100,paperHeight/100);
 context.shadowColor='#65563c30';context.shadowOffsetX=5;context.shadowOffsetY=10;context.shadowBlur=3;
 context.fillStyle=design.paper;context.fill(paper);
 context.shadowColor='transparent';context.strokeStyle=notePen;context.lineWidth=.8;context.lineJoin='round';context.stroke(paper);
 context.clip(paper);
 context.save();context.translate(.8,.9);context.scale(.98,.98);context.globalAlpha=.35;context.lineWidth=.25;context.stroke(paper);context.restore();
 context.lineWidth=.55;context.lineCap='round';context.stroke(new Path2D(noteDoodleMarks[shape.shape]));
 if(shape.shape==='leaf'){context.globalAlpha=.16;context.lineWidth=.4;context.stroke(new Path2D('M18 83Q49 62 86 17M24 78l-8-9m21 1-7-15m22 3-7-18m7 18 17 2'))}
 context.restore();
 const tapeWidth=paperHeight*.18,tapeHeight=tapeWidth/2.8;
 context.save();context.translate(40+paperHeight*shape.tape.x/100,52+paperHeight*shape.tape.y/100);context.rotate(shape.tape.rotation*Math.PI/180);
 context.translate(-tapeWidth/2,-tapeHeight/2);context.scale(tapeWidth/100,tapeHeight/30);
 context.fillStyle='#f5e6be';context.strokeStyle=notePen;context.lineWidth=1.2;context.lineJoin='round';context.fill(new Path2D(noteTapePath));context.stroke(new Path2D(noteTapePath));
 context.strokeStyle='#a38c61';context.lineWidth=.8;context.globalAlpha=.5;context.stroke(new Path2D(noteTapeMarks));context.restore();
 context.fillStyle=design.ink;context.textAlign='left';
 context.textAlign='left';context.font=`600 ${42*scale}px "Grandstander"`;
 recipient.forEach((line,index)=>context.fillText(line,left,contentTop+(40+index*58)*scale));
 const stickers=await Promise.all((card.decorations||[]).slice(0,2).map(key=>new Promise<HTMLImageElement>((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Sticker image unavailable'));image.src=noteStickerImages[key];
 })));
 context.font=`${32*scale}px "Grandstander"`;message.forEach((line,index)=>context.fillText(line,left,messageTop+(30+index*53)*scale));
 context.font=`${25*scale}px "Grandstander"`;context.fillText('Với lòng biết ơn,',left,signatureTop);
 context.font=`${28*scale}px "Grandstander"`;sender.forEach((line,index)=>context.fillText(line,left,signatureTop+(45+index*43)*scale));
 stickers.forEach((image,index)=>{
  context.save();context.imageSmoothingEnabled=true;
  const anchor=shape.stickers[index],size=paperHeight*noteStickerSize/100;
  context.translate(40+paperHeight*anchor.x/100,52+paperHeight*anchor.y/100);context.rotate(anchor.rotation*Math.PI/180);
  context.drawImage(image,-size/2,-size/2,size,size);context.restore();
 });
 context.restore();
 return canvas.toDataURL('image/png');
}

function xml(text:string):string{
 return text.replace(/[<>&"']/g,character=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[character]!));
}

// Embed the same local fonts so the downloaded SVG also works offline.
async function svgFonts():Promise<string>{
 const subsets=[
  ['latin','U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
  ['latin-ext','U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF'],
  ['vietnamese','U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'],
 ];
 return (await Promise.all(subsets.map(async([subset,range])=>{
  const response=await fetch(`/fonts/grandstander/${subset}-normal.woff2`);
  if(!response.ok)throw Error('Export font unavailable');
  const bytes=new Uint8Array(await response.arrayBuffer());
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return `@font-face{font-family:Grandstander;font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2');unicode-range:${range}}`;
 }))).join('\n');
}

export async function createLetterSVG(card:Card):Promise<string>{
 const [layout,fonts]=await Promise.all([letterLayout(card),svgFonts()]);
 const {design,shape,paperHeight,left,contentTop,messageTop,signatureTop,recipient,message,sender}=layout;
 const width=paperHeight+96,height=paperHeight+104;
 const text=(lines:string[],top:number,size:number,lineHeight:number,weight=400)=>lines.map((line,index)=>`<text x="${left}" y="${top+index*lineHeight}" font-size="${size}" font-weight="${weight}" xml:space="preserve">${xml(line)}</text>`).join('');
 const tapeWidth=paperHeight*.18,tapeHeight=tapeWidth/2.8;
 const stickers=(card.decorations||[]).slice(0,2).map((key,index)=>{
  const anchor=shape.stickers[index],size=paperHeight*noteStickerSize/100;
  return `<image href="${xml(noteStickerImages[key])}" x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" transform="translate(${40+paperHeight*anchor.x/100} ${52+paperHeight*anchor.y/100}) rotate(${anchor.rotation})"/>`;
 }).join('');
 return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
 <title id="title">${xml(`Lời tri ân gửi ${card.recipient}`)}</title>
 <defs><style>${fonts}</style><clipPath id="paper"><path d="${shape.path}"/></clipPath></defs>
 <rect width="${width}" height="${height}" fill="#f8f5eb"/>
 <path d="${shape.path}" fill="#343b37" opacity=".2" transform="translate(48 62) scale(${paperHeight/100})"/>
 <g transform="translate(40 52) scale(${paperHeight/100})" stroke="${notePen}" stroke-linejoin="round">
  <path d="${shape.path}" fill="${design.paper}" stroke-width=".8"/>
  <g clip-path="url(#paper)" fill="none">
   <path d="${shape.path}" stroke-opacity=".35" stroke-width=".25" transform="translate(.8 .9) scale(.98)"/>
   <path d="${noteDoodleMarks[shape.shape]}" stroke-width=".55" stroke-linecap="round"/>
   ${shape.shape==='leaf'?'<path d="M18 83Q49 62 86 17M24 78l-8-9m21 1-7-15m22 3-7-18m7 18 17 2" stroke-opacity=".16" stroke-width=".4"/>':''}
  </g>
 </g>
 <g transform="translate(${40+paperHeight*shape.tape.x/100} ${52+paperHeight*shape.tape.y/100}) rotate(${shape.tape.rotation}) translate(${-tapeWidth/2} ${-tapeHeight/2}) scale(${tapeWidth/100} ${tapeHeight/30})">
  <path d="${noteTapePath}" fill="#f5e6be" stroke="${notePen}" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="${noteTapeMarks}" fill="none" stroke="#a38c61" stroke-width=".8" opacity=".5"/>
 </g>
 <g fill="${design.ink}" font-family="Grandstander, cursive">
  ${text(recipient,contentTop+40,42,58,600)}
  ${text(message,messageTop+30,32,53)}
  ${text(['Với lòng biết ơn,'],signatureTop,25,0)}
  ${text(sender,signatureTop+45,28,43)}
 </g>
 ${stickers}
</svg>`;
}
