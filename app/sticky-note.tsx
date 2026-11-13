'use client';
import {useId,useLayoutEffect,useRef,type CSSProperties} from 'react';
import {messageCharacterLimit,type Card} from '../lib/card-validation';
import {noteDesign,noteShape,noteStickers,noteContentInsets,noteStickerSize} from '../lib/note-design';
import {notePen,noteDoodleMarks,noteTapePath,noteTapeMarks} from '../lib/note-doodle';
import {NoteSticker} from './note-sticker';

export function NoteIcon({className=''}:{className?:string}){
 return <svg className={`note-icon ${className}`} viewBox="0 0 40 44" fill="none" aria-hidden="true"><path d="M5 5h30v27L25 42H5V5Z" fill="currentColor"/><path d="M25 32h10L25 42V32Z" fill="#796244" opacity=".3"/><path d="M12 15h15M12 21h12M12 27h7" stroke="#43594e" strokeWidth="2" strokeLinecap="round"/><path d="m15 2 13 2-1 6-13-2 1-6Z" fill="#e4bd86" opacity=".8"/></svg>;
}
export function NotePaper({theme,stretch=false}:{theme:string;stretch?:boolean}){
 const id=useId(),shape=noteShape(theme);
 return <svg className="note-paper-shape" viewBox="0 0 100 100" preserveAspectRatio={stretch?'none':'xMidYMid meet'} aria-hidden="true" focusable="false">
  <defs>
   <clipPath id={`${id}-cut`}><path d={shape.path}/></clipPath>
  </defs>
  <path d={shape.path} fill="var(--note-paper, #fff0a8)" stroke={notePen} strokeWidth=".8" strokeLinejoin="round"/>
  <g clipPath={`url(#${id}-cut)`}>
   <path d={shape.path} fill="none" stroke={notePen} strokeOpacity=".35" strokeWidth=".25" transform="translate(.8 .9) scale(.98)"/>
   <path d={noteDoodleMarks[shape.shape]} fill="none" stroke={notePen} strokeWidth=".55" strokeLinecap="round" strokeLinejoin="round"/>
   {shape.shape==='leaf'&&<path d="M18 83Q49 62 86 17M24 78l-8-9m21 1-7-15m22 3-7-18m7 18 17 2" fill="none" stroke={notePen} strokeOpacity=".16" strokeWidth=".4"/>}
  </g>
 </svg>;
}
export function StickyNote({card,id,compact=false,readablePreview=false,onChange}:{card:Card;id?:string;compact?:boolean;readablePreview?:boolean;onChange?:(key: keyof Card,value:string)=>void}){
 const editable=Boolean(onChange);
 const theme=readablePreview?'meadow':card.theme;
 const paper=useRef<HTMLElement>(null),writing=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const note=paper.current,text=writing.current;
  if(!note||!text)return;
  const insets=noteContentInsets(theme,(card.decorations||[]).length,compact?4:2);
  const contentFraction=1-(insets.top+insets.bottom)/100;
  let active=true;
  const fit=()=>{
   if(!active||!note.clientWidth)return;
   if(compact&&!editable){
    if(readablePreview){
     text.style.fontSize='14px';text.style.height='max-content';
     const height=`${Math.max(note.clientWidth,Math.ceil((text.scrollHeight+12)/contentFraction))}px`;
     if(note.style.height!==height)note.style.height=height;
     return;
    }
    note.style.height='';text.style.height='';
    // Fit the actual writing box, which already reserves the shape and stickers.
    note.style.minWidth='0px';
    const content=text.parentElement!;
    const measure=(size:number)=>{
     text.style.fontSize=`${size}px`;
     return text.scrollHeight<=content.clientHeight&&text.scrollWidth<=content.clientWidth;
    };
    let low=.1,high=Math.max(1,content.clientWidth,content.clientHeight);
    if(!measure(high)){
     for(let iteration=0;iteration<12;iteration++){
      const middle=(low+high)/2;
      if(measure(middle))low=middle;else high=middle;
     }
     measure(low);
    }
    // Leave a little breathing room below the maximum fitted text size.
    measure(parseFloat(text.style.fontSize)*.92);
    return;
   }
   if(editable){
    // Use the larger paper first, then fit the writing uniformly on narrow screens.
    // The paper itself always keeps its original square view box.
    const fields=text.querySelectorAll('textarea');
    const measure=(size:number)=>{
     text.style.fontSize=`${size}px`;
     fields.forEach(field=>{field.style.height='0px';field.style.height=`${field.scrollHeight}px`});
     return text.scrollHeight+12<=note.clientWidth*contentFraction;
    };
    let low=1,high=19;
    if(!measure(high)){
     for(let iteration=0;iteration<9;iteration++){
      const middle=(low+high)/2;
      if(measure(middle))low=middle;else high=middle;
     }
     measure(low);
    }
    return;
   }
   // Keep the silhouette square and enlarge both dimensions around the writing.
   note.style.minWidth='0px';
   const base=note.clientWidth;
   const fits=()=>text.scrollHeight+2<=note.clientWidth*contentFraction;
   if(fits())return;
   let low=base,high=base;
   while(!fits()){
    high=Math.ceil(high*Math.max(1.05,Math.sqrt((text.scrollHeight+2)/(high*contentFraction))));
    note.style.minWidth=`${high}px`;
   }
   while(high-low>1){
    const middle=Math.floor((low+high)/2);
    note.style.minWidth=`${middle}px`;
    if(fits())high=middle;else low=middle;
   }
   note.style.minWidth=`${high}px`;
  };
  fit();const observer=new ResizeObserver(fit);observer.observe(note);if(!compact)observer.observe(text);
  void document.fonts.ready.then(fit);
  return ()=>{active=false;observer.disconnect()};
 },[card.recipient,card.message,card.sender,card.anonymous,theme,card.decorations,compact,readablePreview,editable]);
 const stickers=(card.decorations||[]).slice(0,2);
 const design=noteDesign(card.flower);
 const shape=noteShape(theme);
 const insets=noteContentInsets(theme,stickers.length,compact?4:2);
 const style={
  '--note-paper':design.paper,'--note-edge':design.edge,'--note-ink':design.ink,
  '--shape-top':`${insets.top}%`,'--shape-bottom':`${insets.bottom}%`,'--shape-left':`${insets.left}%`,'--shape-right':`${insets.right}%`,
  '--note-sticker-size':`${noteStickerSize}%`,
  '--tape-x':`${shape.tape.x}%`,'--tape-y':`${shape.tape.y}%`,'--tape-rotation':`${shape.tape.rotation}deg`,
  '--sticker-1-x':`${shape.stickers[0].x}%`,'--sticker-1-y':`${shape.stickers[0].y}%`,'--sticker-1-rotation':`${shape.stickers[0].rotation}deg`,
  '--sticker-2-x':`${shape.stickers[1].x}%`,'--sticker-2-y':`${shape.stickers[1].y}%`,'--sticker-2-rotation':`${shape.stickers[1].rotation}deg`,
 } as CSSProperties;
 return <article id={id} ref={paper} className={`sticky-note note-shape-${shape.shape}${compact?' note-compact':''}${readablePreview?' note-readable-preview':''}${editable?' note-editable':''}`} style={style}>
  <NotePaper theme={theme} stretch={readablePreview}/>
  <svg className="note-tape" viewBox="0 0 100 30" aria-hidden="true" focusable="false"><path d={noteTapePath} fill="#f5e6be" stroke={notePen} strokeWidth="1.2" strokeLinejoin="round"/><path d={noteTapeMarks} fill="none" stroke="#a38c61" strokeWidth=".8" opacity=".5"/></svg>
  {!!stickers.length&&<div className="note-stickers" role="img" aria-label={`Nhãn trang trí: ${stickers.map(key=>noteStickers[key].name).join(', ')}`}>{stickers.map(key=><NoteSticker key={key} type={key}/>)}</div>}
  <div className="note-content"><div className="note-writing" ref={writing}>
  {onChange?<>
   <label className="sr-only" htmlFor="letter-recipient">Gửi đến</label>
   <textarea id="letter-recipient" className="letter-recipient" rows={1} required maxLength={60} value={card.recipient} onChange={event=>onChange('recipient',event.target.value)} placeholder="Gửi thầy cô…"/>
   <label className="sr-only" htmlFor="letter-message">Lời tri ân của bạn</label>
   <textarea id="letter-message" className="letter-message" rows={4} required minLength={5} maxLength={messageCharacterLimit} value={card.message} onChange={event=>onChange('message',event.target.value)} placeholder="Một lời chúc 20/11, lời cảm ơn hay kỷ niệm cùng thầy cô…"/>
   <div className="letter-signature"><span>Với lòng biết ơn,</span>
    {card.anonymous?<strong>Một người gửi yêu thương</strong>:<><label className="sr-only" htmlFor="letter-sender">Người gửi</label><textarea id="letter-sender" rows={1} required maxLength={40} value={card.sender} onChange={event=>onChange('sender',event.target.value)} placeholder="Tên hoặc biệt danh của bạn"/></>}
   </div>
  </>:<>
  <h2>{card.recipient||'Gửi thầy cô…'}</h2>
  <p className="note-message">{card.message||'Một lời chúc 20/11, lời cảm ơn hay kỷ niệm cùng thầy cô…'}</p>
  <p className="note-signature">{!compact&&<>Với lòng biết ơn,<br/></>}<strong>{card.anonymous?'Một người gửi yêu thương':card.sender||(card.id?'Một người gửi yêu thương':'Tên của bạn')}</strong></p>
  </>}
  </div></div>
 </article>;
}
