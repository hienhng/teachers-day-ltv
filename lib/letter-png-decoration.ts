// A generous stationery frame keeps every sticker clear of the export edges.
export const letterPNGInsets={left:160,top:240,right:160,bottom:240} as const;

export function drawLetterPNGStationery(context:CanvasRenderingContext2D,width:number,height:number,paperColor:string){
 context.save();
 context.fillStyle='#fbf7ed';context.fillRect(0,0,width,height);
 // Quiet graph-paper dots and translucent washes keep the note in focus.
 context.fillStyle='#8d9b7a26';
 for(let y=48;y<height-40;y+=28)for(let x=48;x<width-40;x+=28)context.fillRect(x,y,1.5,1.5);
 context.fillStyle=paperColor;context.globalAlpha=.28;
 context.fill(new Path2D(`M0 0H${width*.43}Q${width*.32} 125 120 310L0 370Z`));
 context.fill(new Path2D(`M${width} ${height}H${width*.57}Q${width*.68} ${height-125} ${width-120} ${height-310}L${width} ${height-370}Z`));
 context.globalAlpha=1;
 context.strokeStyle='#b5bea0';context.lineWidth=1.5;
 context.stroke(new Path2D(`M92 29H${width-92}Q${width-29} 29 ${width-29} 92V${height-92}Q${width-29} ${height-29} ${width-92} ${height-29}H92Q29 ${height-29} 29 ${height-92}V92Q29 29 92 29Z`));
 context.strokeStyle='#cbbd9b';context.lineWidth=1;
 context.stroke(new Path2D(`M96 41H${width-96}M96 ${height-41}H${width-96}M41 96V${height-96}M${width-41} 96V${height-96}`));

 const sprig=(x:number,y:number,flip=1)=>{
  context.save();context.translate(x,y);context.scale(flip,1);
  context.lineWidth=2.5;context.lineCap='round';context.lineJoin='round';
  context.strokeStyle='#789077';context.fillStyle='#c4d1ad';
  context.stroke(new Path2D('M0 0Q22-48 8-112M5-22Q-18-44-22-70M10-48Q37-70 33-92'));
  const leaves=new Path2D('M4-20Q-29-21-28-43Q-5-46 4-20ZM9-43Q43-45 43-64Q19-67 9-43ZM12-69Q-10-76-8-94Q15-91 12-69Z');
  context.fill(leaves);context.stroke(leaves);
  context.translate(8,-120);context.strokeStyle='#b78385';context.fillStyle='#edc7c4';context.lineWidth=1.7;
  const flower=new Path2D('M0-6C-21-26-35-4-18 7C-30 25-3 33 2 15C20 30 36 7 18 0C30-17 6-30 0-6Z');
  context.fill(flower);context.stroke(flower);
  context.fillStyle='#e7c680';context.strokeStyle='#b99b58';
  const center=new Path2D('M-6-1a7 7 0 1 0 14 0a7 7 0 1 0-14 0');context.fill(center);context.stroke(center);
  context.restore();
 };
 sprig(86,374);sprig(width-86,height-248,-1);
 sprig(80,height-76);sprig(width-80,220,-1);

 context.save();context.translate(width/2-40,50);
 context.lineCap='round';context.lineJoin='round';context.lineWidth=2;
 context.strokeStyle='#b97e85';context.fillStyle='#e9bdc04d';
 const heart=new Path2D('M40 30 29 19c-8-9 5-18 11-9 7-9 19 0 11 9Z');context.fill(heart);context.stroke(heart);
 context.strokeStyle='#8d9d78';context.stroke(new Path2D('M20 12q-5 6 0 12m-7-17q-9 11 0 22m47-17q5 6 0 12m7-17q9 11 0 22'));
 context.restore();
 context.fillStyle='#526a55';context.textAlign='center';
 context.font='600 30px "Grandstander"';context.fillText('TRẠM PHÁT SÓNG YÊU THƯƠNG',width/2,133);
 context.fillStyle='#95856e';context.font='18px "Grandstander"';
 context.fillText('MỘT LỜI NHẮN NHỎ, GỬI TRỌN LÒNG BIẾT ƠN',width/2,171);

 // A small commemorative seal and handwritten closing balance the header.
 context.save();context.translate(width/2,height-133);
 context.strokeStyle='#b78385';context.lineWidth=2;
 context.stroke(new Path2D('M-65 0a65 34 0 1 0 130 0a65 34 0 1 0-130 0M-59 0a59 28 0 1 0 118 0a59 28 0 1 0-118 0'));
 context.fillStyle='#956a6a';context.font='600 26px "Grandstander"';context.fillText('20 / 11',0,9);
 context.strokeStyle='#b7bf9d';context.lineWidth=1.5;
 context.stroke(new Path2D('M-190 0h96m188 0h96M-208 0l6-6 6 6-6 6ZM196 0l6-6 6 6-6 6Z'));
 context.restore();
 context.fillStyle='#7c846d';context.textAlign='center';context.font='22px "Grandstander"';
 context.fillText('Gửi người gieo những mùa hoa.',width/2,height-65);
 context.restore();
}
