import type {Decoration} from './card-validation';

// Retain persisted design keys to keep existing saved links and API clients compatible.
export const noteDesigns = [
 {key:'tulip',name:'Vàng nắng',paper:'#fff0a8',edge:'#e0c764',ink:'#493e25'},
 {key:'rose',name:'Hồng phấn',paper:'#f8cdd5',edge:'#dba1af',ink:'#593844'},
 {key:'sunflower',name:'Cam đào',paper:'#ffdab5',edge:'#deaf7e',ink:'#553d2a'},
 {key:'cherry',name:'Tím mơ',paper:'#e0d5f3',edge:'#b7a3d3',ink:'#49395d'},
 {key:'lavender',name:'Xanh trời',paper:'#d2e9f5',edge:'#9fc5d9',ink:'#304c5c'},
 {key:'daisy',name:'Xanh lá',paper:'#dce8bd',edge:'#b2c58d',ink:'#3b5033'},
] as const;
export function noteDesign(key:string){return noteDesigns.find(design=>design.key===key)||noteDesigns[0]}
export const noteShapes={
 meadow:{name:'Vuông cổ điển',shape:'square',path:'M2 2Q27 .5 52 1.7T98 2.3Q99 27 98 51T98 94Q97 98 92 98Q66 99 43 98T2 98Q.8 73 1.8 49T2 2Z',top:10,bottom:8,side:7,tape:{x:50,y:2,rotation:-5},stickers:[{x:3,y:3,rotation:-10},{x:99,y:84,rotation:8}]},
 heart:{name:'Trái tim',shape:'heart',path:'M50 17C26-9-6 11 3 39C10 61 31 82 50 98C69 82 90 61 97 39C106 11 74-9 50 17Z',top:24,bottom:34,side:24,tape:{x:28,y:5,rotation:-14},stickers:[{x:10,y:29,rotation:-18},{x:84,y:60,rotation:18}]},
 blossom:{name:'Ngôi sao',shape:'star',path:'M50 2Q53 2 56 9L68 28L93 32Q100 33 95 40L78 59L82 87Q83 96 74 92L50 80L26 92Q17 96 18 87L22 59L5 40Q0 33 7 32L32 28L44 9Q47 2 50 2Z',top:34,bottom:28,side:27,tape:{x:50,y:8,rotation:8},stickers:[{x:12,y:37,rotation:-18},{x:76,y:85,rotation:15}]},
 night:{name:'Chiếc lá',shape:'leaf',path:'M96 4C100 43 85 83 53 94C23 105-2 82 6 51C13 19 46 0 96 4Z',top:26,bottom:28,side:23,tape:{x:83,y:6,rotation:20},stickers:[{x:19,y:29,rotation:-27},{x:63,y:88,rotation:19}]},
} as const;
export function noteShape(theme:string){return noteShapes[theme as keyof typeof noteShapes]||noteShapes.meadow}
// Use the same proportional sticker size and writing margins on screen and in exports.
export const noteStickerSize=14;
export function noteContentInsets(theme:string,stickerCount:number){
 const shape=noteShape(theme);
 let left:number=shape.side,right:number=shape.side;
 for(const sticker of shape.stickers.slice(0,Math.max(0,Math.min(2,stickerCount)))){
  const angle=sticker.rotation*Math.PI/180;
  const radius=noteStickerSize/2*(Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle)));
  const gap=2;
  if(sticker.y+radius+gap<=shape.top||sticker.y-radius-gap>=100-shape.bottom)continue;
  if(sticker.x<50)left=Math.max(left,sticker.x+radius+gap);
  else right=Math.max(right,100-sticker.x+radius+gap);
 }
 return {top:shape.top,bottom:shape.bottom,left,right};
}
export const noteCurlPath='M92 91Q94 95 91 99Q98 97 99 91Z';
export const noteCurlShadowPath='M90 99Q95 96 92 91L99 91Q98 97 91 99Z';
export const noteStickers:Record<Decoration,{name:string;symbol:string}>={
 ribbon:{name:'Nơ nhỏ',symbol:'୨୧'},butterflies:{name:'Cánh bướm',symbol:'ʚɞ'},
 hearts:{name:'Trái tim',symbol:'♡'},sparkles:{name:'Ngôi sao',symbol:'✦'},
 fireflies:{name:'Ánh sáng',symbol:'☼'},petals:{name:'Nét cười',symbol:'☺'},
 bees:{name:'Điểm mười',symbol:'10+'},cranes:{name:'Máy bay giấy',symbol:'➤'},
 music:{name:'Nốt nhạc',symbol:'♫'},
 math:{name:'Toán học',symbol:'π'},physics:{name:'Vật lý',symbol:'⚛'},
 english:{name:'Tiếng Anh',symbol:'ABC'},history:{name:'Lịch sử',symbol:'⌛'},
 geography:{name:'Địa lý',symbol:'◎'},chemistry:{name:'Hóa học',symbol:'⚗'},
 books:{name:'Chồng sách',symbol:'▤'},pencil:{name:'Bút chì',symbol:'✎'},
 graduation:{name:'Mũ tốt nghiệp',symbol:'◇'},
 literature:{name:'Ngữ văn',symbol:'✒'},
};
