import type {CSSProperties} from 'react';
import type {Decoration} from '../lib/card-validation';
import {FlowerPixels} from './pixel-art';
import {BeePixels as Bee,ButterflyPixels} from './insect-art';
import {noteStickers} from '../lib/note-design';
import {noteStickerImages} from '../lib/note-sticker-art';

export const decorationNames:Record<Decoration,string>={
 ...Object.fromEntries(Object.entries(noteStickers).map(([key,{name}])=>[key,name])) as Record<Decoration,string>,
 ribbon:'Nơ dịu dàng',butterflies:'Bươm bướm',hearts:'Trái tim',
 sparkles:'Sao lấp lánh',fireflies:'Đom đóm',petals:'Cánh hoa bay',
 bees:'Ong nhỏ',cranes:'Hạc giấy',music:'Nốt nhạc',
};

const motion=(values:Record<string,string>):CSSProperties=>values as CSSProperties;

function PixelBurst({kind='heart'}:{kind?:'heart'|'star'|'butterfly'}){
 const color=kind==='heart'?'#d997b3':kind==='star'?'#d8b775':'#c2afd5';
 return <g aria-hidden="true">{[[-7,-7],[8,-6],[-8,6],[7,8]].map(([dx,dy],i)=><rect
  key={i} className={kind==='heart'?'heart-pixel':kind==='star'?'star-spark':'butterfly-dust'}
  x={kind==='butterfly'?7:5} y={kind==='butterfly'?7:5} width={i%2?1:2} height={i%2?2:1} fill={color} opacity="0"
  style={motion({'--dx':`${dx}px`,'--dy':`${dy}px`,'--speck':`${i*.13}s`})}
 />)}</g>;
}

function Heart(){return <>
 <PixelBurst/>
 <g className="heart-body">
  <path d="M2 0h3v1h2V0h3v1h2v5h-1v2H9v2H7v2H5v-2H3V8H1V6H0V1h2z" fill="#b96f8b"/>
  <path d="M2 1h3v2h2V1h3v1h1v4H9v2H7v2H5V8H3V6H1V2h1z" fill="#e8a0b8"/>
  <path d="M2 2h2v1H3v2H2zM5 8h2v2H5z" fill="#ffd5df"/>
  <path d="M9 3h1v3H9v2H7V7h1V5h1z" fill="#d789a5"/>
  <path className="heart-shine" d="M2 2h2v1H2zm0 1h1v1H2z" fill="#fff7e8" opacity="0"/>
 </g>
 </>}

function Star(){return <>
 <PixelBurst kind="star"/>
 <g className="star-body">
  <path d="M5 0h2v3h1v1h1v1h3v2H9v1H8v1H7v3H5V9H4V8H3V7H0V5h3V4h1V3h1z" fill="#bf9958"/>
  <path d="M5 2h1v3H4v1H2v1h3v2h1v1h1V7h2V6H7V4H6V2z" fill="#f2cf7e"/>
  <path d="M5 5h2v2H5z" fill="#fff7d5"/>
  <path d="M10 0h1v1h-1zM0 10h1v1H0z" fill="#d5b574" opacity=".7"/>
 </g>
 </>}

function Moth(){return <><PixelBurst kind="butterfly"/><ButterflyPixels/></>}

function Ribbon(){return <>
 <g className="bow-tail-left">
  <path d="M5 5h2v4H6v3H5v3H2v-1H1v-2h1V9h2V7h1z" fill="#b6718f"/>
  <path d="M4 8h2v2H5v3H3v-2h1z" fill="#e9a5be"/>
 </g>
 <g className="bow-tail-right">
  <path d="M6 5h2v2h1v2h2v3h1v2h-1v1H8v-3H7V9H6z" fill="#b6718f"/>
  <path d="M7 8h2v3h1v2H8v-3H7z" fill="#e9a5be"/>
 </g>
 <g className="bow-loop-left">
  <path d="M1 0h3v1h1v1h1v4H2V5H0V1h1z" fill="#b6718f"/>
  <path d="M1 1h3v2h1v2H2V4H1z" fill="#f0b4cd"/>
  <path d="M1 1h2v1H1zM3 3h2v1H3z" fill="#ffdae5"/>
 </g>
 <g className="bow-loop-right">
  <path d="M9 0h3v1h1v4h-2v1H7V2h1V1h1z" fill="#b6718f"/>
  <path d="M9 1h3v3h-1v1H8V3h1z" fill="#f0b4cd"/>
  <path d="M10 1h2v1h-2zM8 3h2v1H8z" fill="#ffdae5"/>
 </g>
 <path d="M5 2h3v4H5z" fill="#d88ead"/>
 <path d="M5 2h2v1H5zm2 2h1v2H7z" fill="#f7c8d8"/>
 <path className="bow-stitch" d="M1 2h3v2h5V2h3" stroke="#ffe3e9" strokeWidth=".65" strokeDasharray="16" opacity=".45"/>
 </>}

function Firefly(){return <g className="firefly-hover">
 <g className="fly-halo" opacity=".18">
  <path d="M1 -2h7v2h3v9H8v2H1V9h-3V0h3z" fill="#e4dba0"/>
  <path d="M2 0h5v2h2v5H7v2H2V7H0V2h2z" fill="#fff2a8"/>
 </g>
 <g className="fly-wing"><path d="M0 1h2v1h1v3H0V4h-1V2h1zm6 1h1V1h2v1h1v2H9v1H6z" fill="#bbccba"/><path d="M0 2h2v1H0zm7 0h2v1H7z" fill="#edf3da"/></g>
 <path d="M3 0h3v3H3zM2 3h5v5H2z" fill="#71815c"/>
 <path className="fly-lantern" d="M3 4h3v4H3V7H2V5h1z" fill="#e5c977"/>
 <path d="M3 4h2v1H3z" fill="#fff4bd"/>
 <path d="M2 -1h1v1H2zm4 0h1v1H6z" fill="#71815c"/>
 <rect className="fly-trail" x="-2" y="10" width="1" height="1" fill="#cabb7f" opacity="0" style={motion({'--speck':'.15s'})}/>
 <rect className="fly-trail" x="-5" y="14" width="1" height="1" fill="#cabb7f" opacity="0" style={motion({'--speck':'.55s'})}/>
 </g>}

function Petal(){return <>
 <g className="petal-fall">
  <g className="petal-front">
   <path d="M4 0h3v1h2v3H8v2H6v1H3v1H0V4h1V2h3z" fill="#c982a0"/>
   <path d="M4 1h3v1h1v2H6v2H3v1H1V4h1V3h2z" fill="#edb2c9"/>
   <path d="M4 2h2v1H4v1H2V3h2z" fill="#ffe0e7"/>
   <path d="M3 5h2v1H3v1H1V6h2z" fill="#dc98b5"/>
  </g>
  <path className="petal-edge" d="M4 0h1v2h1v4H4v2H3V3h1z" fill="#c784a2" opacity="0"/>
  <rect className="petal-glint" x="-2" y="-3" width="1" height="1" fill="#e4bdc7" opacity="0"/>
 </g>
 </>}


function Crane(){return <>
 <g className="crane-glide">
  <g className="crane-wing-back"><path d="M8 11 3 1 12 8 11 12Z" fill="#b7a2cc"/><path d="M4 3 9 10 11 9Z" fill="#e1d3ed"/></g>
  <path d="M8 10 0 7 5 13 10 15 14 11Z" fill="#c8b5da"/>
  <path d="M1 8 8 11 6 12Z" fill="#f7edf9"/>
  <path d="M9 12 13 9 15 3 18 3 20 6 17 5 16 10 12 14 10 15Z" fill="#e8dbef"/>
  <path d="M13 10 16 4 17 5 15 11 11 14Z" fill="#b39ac9"/>
  <path d="m17 3 3 3-3-1Z" fill="#a88bba"/>
  <g className="crane-wing-front"><path d="M7 12 16 0 13 12 10 15Z" fill="#c7aedc"/><path d="m7 12 9-12-5 11-1 4Z" fill="#f3e8f8"/><path d="m11 11 5-11-3 12-3 3Z" fill="#ad91c4"/></g>
  <path className="crane-crease" d="m5 12 5 2 3-2-3 3Z" fill="#fff8f0"/>
  <path d="m9 12 2-2-1 4Z" fill="#dfcce9"/>
 </g>
 </>}

function Music(){return <>
 <g className="music-note note-one">
  {/* A stepped beam connects two upright stems and rounded pixel noteheads. */}
  <path d="M4 3h4V2h5v10h-2V5H8v1H6v8H4z" fill="#9273aa"/>
  <path d="M2 11h4v3H5v1H1v-1H0v-2h2zm7-2h4v3h-1v1H8v-1H7v-2h2z" fill="#9273aa"/>
  <path d="M4 3h4V2h5v1H9v1H4z" fill="#d5bfdf"/>
  <path d="M2 12h2v1H2zm7-2h2v1H9z" fill="#ead8ef"/>
 </g>
 <g className="music-note note-two">
  <path d="M16 6h2v1h1v1h1v3h-1V9h-1v8h-2z" fill="#b28d50"/>
  <path d="M14 15h3v3h-1v1h-3v-1h-1v-2h2z" fill="#b28d50"/>
  <path d="M17 7h1v1h1v1h-2zM14 16h2v1h-2z" fill="#f6d994"/>
 </g>
 <path className="music-chime chime-one" d="M14 0h1v1h1v1h-1v1h-1V2h-1V1h1z" fill="#ceb2d8" opacity=".55"/>
 <path className="music-chime chime-two" d="M3 18h1v1H3zm6-2h1v1H9z" fill="#d6b56e" opacity=".5"/>
 <path className="music-chime chime-three" d="M21 13h1v1h-1z" fill="#d5bfdf" opacity=".4"/>
 </>}

export function DecorationPixels({type}:{type:Decoration}){
 if(type==='ribbon')return <Ribbon/>;
 if(type==='butterflies')return <Moth/>;
 if(type==='hearts')return <Heart/>;
 if(type==='sparkles')return <Star/>;
 if(type==='fireflies')return <Firefly/>;
 if(type==='bees')return <Bee/>;
 if(type==='cranes')return <Crane/>;
 if(type==='music')return <Music/>;
 if(type!=='petals')return <image href={noteStickerImages[type]} width="64" height="64"/>;
 return <Petal/>;
}

const decorationViewBoxes:Partial<Record<Decoration,string>>={
 ribbon:'-3 -2 19 19',butterflies:'-3 -4 22 22',hearts:'-4 -4 20 20',
 sparkles:'-4 -4 20 20',fireflies:'-6 -5 21 23',petals:'-5 -5 19 19',
 bees:'-3 -2 22 22',cranes:'-2 -4 24 24',music:'-2 -2 26 26',
};

export function DecorationIcon({type}:{type:Decoration}){
 return <svg viewBox={decorationViewBoxes[type]||'0 0 64 64'} width="32" height="32" fill="none" shapeRendering="crispEdges" aria-hidden="true"><DecorationPixels type={type}/></svg>;
}

// Sprite geometry is self-contained; CSS animates its parts only in the page.
// Without that stylesheet, PNG export retains the complete static composition.
// Garden flowers and full letters share the same decoration animations.
export function CardArtwork({flower,decorations=[],small=false,animationPaused=false,celebrate=false,motionOverride=true}:{
 flower:string;decorations?:Decoration[];small?:boolean;animationPaused?:boolean;celebrate?:boolean;motionOverride?:boolean;
}){
 return <svg xmlns="http://www.w3.org/2000/svg" className={`card-art${small?' card-art-small':''}`}
  data-animate={true} data-paused={animationPaused} data-celebrate={celebrate} data-motion-override={motionOverride}
  viewBox="0 0 160 112" width="160" height="112" fill="none" shapeRendering="crispEdges" aria-hidden="true">
  {decorations.includes('bees')&&<g data-decoration="bees">
   <g transform="translate(27 37)" className="animated-sprite" style={motion({'--beat':'-.4s'})}><g className="bee-flight bee-flight-first"><Bee/></g></g>
   <g transform="translate(115 59) scale(.8)" className="animated-sprite" style={motion({'--beat':'-1.7s'})}><g className="bee-flight bee-flight-second"><Bee/></g></g>
  </g>}
  {decorations.includes('cranes')&&<g data-decoration="cranes">
   <g transform="translate(32 12)" className="animated-sprite" style={motion({'--beat':'-.2s'})}><Crane/></g>
   <g transform="translate(128 80) scale(-.8 .8)" className="animated-sprite" style={motion({'--beat':'-1.8s'})}><Crane/></g>
  </g>}
  {decorations.includes('music')&&<g data-decoration="music">
   <g transform="translate(111 8)" className="animated-sprite" style={motion({'--beat':'-.5s'})}><Music/></g>
   <g transform="translate(23 81) scale(.8)" className="animated-sprite" style={motion({'--beat':'-1.9s'})}><Music/></g>
  </g>}
  {decorations.includes('petals')&&<g data-decoration="petals">
   <g transform="translate(37 22)" className="animated-sprite" style={motion({'--beat':'-1.5s','--cycle':'8.2s'})}><Petal/></g>
   <g transform="translate(111 67) rotate(90)" className="animated-sprite" style={motion({'--beat':'-4s','--cycle':'9.4s'})}><Petal/></g>
   <g transform="translate(28 75)" className="animated-sprite" style={motion({'--beat':'-5.5s','--cycle':'8.7s'})}><Petal/></g>
   <g transform="translate(117 15) rotate(90)" className="animated-sprite" style={motion({'--beat':'-2.8s','--cycle':'10s'})}><Petal/></g>
  </g>}
  {decorations.includes('sparkles')&&<g data-decoration="sparkles">
   <g transform="translate(24 46)" className="animated-sprite" style={motion({'--beat':'-1.3s','--cycle':'5.8s'})}><Star/></g>
   <g transform="translate(116 32) scale(.8)" className="animated-sprite" style={motion({'--beat':'-3.4s','--cycle':'6.4s'})}><Star/></g>
   <g transform="translate(96 8) scale(.6)" className="animated-sprite" style={motion({'--beat':'-.3s','--cycle':'7s'})}><Star/></g>
  </g>}
  {decorations.includes('fireflies')&&<g data-decoration="fireflies">
   <g transform="translate(39 58)" className="animated-sprite" style={motion({'--beat':'-2.1s','--cycle':'6s'})}><Firefly/></g>
   <g transform="translate(111 48)" className="animated-sprite" style={motion({'--beat':'-4.4s','--cycle':'7.2s'})}><Firefly/></g>
   <g transform="translate(96 87)" className="animated-sprite" style={motion({'--beat':'-.3s','--cycle':'6.6s'})}><Firefly/></g>
  </g>}
  {decorations.includes('butterflies')&&<g data-decoration="butterflies">
   <g transform="translate(33 23) rotate(-12)" className="animated-sprite" style={motion({'--beat':'-.3s'})}><Moth/></g>
   <g transform="translate(109 70) rotate(12)" className="animated-sprite" style={motion({'--beat':'-4.5s'})}><Moth/></g>
  </g>}
  {decorations.includes('hearts')&&<g data-decoration="hearts">
   <g transform="translate(27 68)" className="animated-sprite" style={motion({'--beat':'-1.4s','--cycle':'7s'})}><Heart/></g>
   <g transform="translate(111 20)" className="animated-sprite" style={motion({'--beat':'-3s','--cycle':'8.2s'})}><Heart/></g>
   <g transform="translate(43 8) scale(.6)" className="animated-sprite" style={motion({'--beat':'-5.3s','--cycle':'7.6s'})}><Heart/></g>
  </g>}
  <g className="flower-aura" opacity="0" style={{transformBox:'fill-box',transformOrigin:'center'}}>
   <path d="M78 16h4v6h-4zm0 61h4v6h-4zM48 46h6v4h-6zm58 0h6v4h-6zM57 23h4v4h-4zm43 43h4v4h-4zM57 66h4v4h-4zm43-43h4v4h-4z" fill="#d8b775"/>
  </g>
  <g className="garden-flower-main" transform="translate(55 24) scale(1.5)"><FlowerPixels type={flower}/></g>
  {/* Tie the knot just below the bloom: x=55 + 16.5*1.5, y=24 + 28*1.5.
      Keep this anchor outside the animated loops and tails. */}
  {decorations.includes('ribbon')&&<g data-decoration="ribbon" transform="translate(79.75 66)"><g transform="scale(1.3) translate(-6.5 -4)"><Ribbon/></g></g>}
 </svg>;
}
