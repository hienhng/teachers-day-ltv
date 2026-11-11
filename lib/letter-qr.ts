import QRCode from 'qrcode';
import type {Card} from './card-validation';

import {noteDesign} from './note-design';
function paletteFor(card:Card){const design=noteDesign(card.flower);return {ink:design.ink,paper:design.paper,border:design.edge,petal:design.edge}}

/** Plain, theme-colored QR for embedding in the letter. */
export async function createLetterQRCode(card:Card,shareUrl:string,size=600,transparentBackground=false):Promise<HTMLCanvasElement>{
 const palette=paletteFor(card);
 const canvas=document.createElement('canvas');
 await QRCode.toCanvas(canvas,shareUrl,{width:size,margin:4,errorCorrectionLevel:'M',color:{dark:palette.ink,light:transparentBackground?'#00000000':palette.paper}});
 return canvas;
}

/** The embedded QR and the separate download share the letter's visual style. */
export async function createLetterQR(card:Card,shareUrl:string):Promise<HTMLCanvasElement>{
 await document.fonts.load('32px "Grandstander"', 'Gửi người gieo chữ');
 const palette=paletteFor(card);
 const canvas=document.createElement('canvas');canvas.width=600;canvas.height=700;
 const context=canvas.getContext('2d');if(!context)throw Error('Canvas unavailable');
 context.imageSmoothingEnabled=false;
 context.fillStyle=palette.paper;context.fillRect(0,0,600,700);
 context.strokeStyle=palette.border;context.lineWidth=3;context.strokeRect(12,12,576,676);
 // Keep the complete four-module quiet zone and high-contrast data modules.
 const code=await createLetterQRCode(card,shareUrl,520);
 context.drawImage(code,40,32,520,520);
 // Small paper corners sit outside the QR's quiet zone.
 context.fillStyle=palette.border;
 for(const [x,y] of [[14,14],[562,14],[14,662],[562,662]])context.fillRect(x,y,24,16);
 context.textAlign='center';context.fillStyle=palette.ink;
 // Fit even a maximum-length recipient into two lines without clipping.
 let fontSize=32,rows:string[]=[];
 do{
  context.font=`${fontSize}px "Grandstander"`;rows=[];let row='';
  for(const word of `Gửi ${card.recipient}`.split(/\s+/)){
   const next=row?`${row} ${word}`:word;
   if(row&&context.measureText(next).width>512){rows.push(row);row=word}else row=next;
  }
  if(row)rows.push(row);
  if(rows.length<=2)break;
  fontSize-=2;
 }while(fontSize>=20);
 // Canvas maxWidth is a final safeguard for unusually wide names.
 const label=rows.length>2?[`Gửi ${card.recipient}`]:rows;
 label.forEach((text,i)=>context.fillText(text,300,(label.length===1?604:586)+i*38,512));
 context.font='28px "Grandstander"';context.fillStyle=palette.ink;
 context.fillText('Quét mã để đọc lời tri ân',300,658);
 return canvas;
}
