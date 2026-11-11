import type {Card} from './card-validation';
import {noteDesign,noteShape,noteContentInsets,noteStickerSize} from './note-design';
import {notePen,noteDoodleMarks,noteTapePath,noteTapeMarks} from './note-doodle';
import {noteStickerImages} from './note-sticker-art';

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

export async function createLetterPNG(card:Card,_container:HTMLElement):Promise<string>{
 await document.fonts.load('32px "Grandstander"', 'Gửi người gieo chữ');
 await document.fonts.ready;
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');
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
  const sender=textLines(context,card.anonymous?'Một người học trò':card.sender||'Một người học trò',textWidth);
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
 canvas.width=40+paperHeight+56;canvas.height=52+paperHeight+52;
 context.imageSmoothingEnabled=true;
 context.fillStyle='#f8f5eb';context.fillRect(0,0,canvas.width,canvas.height);
 const paper=new Path2D(shape.path);
 context.save();context.translate(40,52);context.scale(paperHeight/100,paperHeight/100);
 context.shadowColor='#343b3733';context.shadowOffsetX=8;context.shadowOffsetY=10;context.shadowBlur=0;
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
 return canvas.toDataURL('image/png');
}
