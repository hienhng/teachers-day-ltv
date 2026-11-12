'use client';
import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import './received-letter.css';

function TeacherFlowers(){
 return <div className="letter-edge-flowers" aria-hidden="true">
  <svg className="letter-flowers-left" viewBox="0 0 180 420" fill="none" focusable="false">
   <g stroke="#627c58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M71 103C79 170 76 241 58 308C49 341 36 363 18 376S-20 396-40 400M123 215C102 270 76 315 58 350S1 399-40 408M29 170C25 225 28 282 34 330S10 374-40 385"/>
    <path d="M58 308Q17 292 16 259q39 5 42 49ZM68 260q46-9 57-42-42-2-57 42ZM75 210Q37 194 41 167q34 8 34 43ZM44 351q41-1 60-31-38-9-60 31Z" fill="#b0c39a"/>
   </g>
   {[{x:72,y:99,s:1},{x:29,y:165,s:.78}].map(({x,y,s})=><g key={x} transform={`translate(${x} ${y}) scale(${s})`} stroke="#a76164" strokeWidth="1.8" strokeLinejoin="round">
    <path d="m-12 24 12 15 14-16" fill="#90a77c" stroke="#627c58"/>
    <path d="M-32 2-40-8l13-7-1-15 15 4 9-13 9 12 15-6 1 16 15 3-7 14 8 13-16 4-4 14-16-5-12 7-9-12-15 1 3-15Z" fill="#e9a6aa"/>
    <path d="m-26-2 11-8-2-10 12 6 8-11 7 12 12-3-4 13 11 7-14 6-2 12-12-8-13 8-2-14-12-2 9-10ZM-10 0l10-8 10 9-7 10-12-3" fill="none"/>
   </g>)}
   <g transform="translate(124 207)" stroke="#ac8442" strokeWidth="1.5">
    {Array.from({length:12},(_,i)=><ellipse key={i} cy="-17" rx="6" ry="17" fill={i%2?'#f2d38b':'#f8dfa1'} transform={`rotate(${i*30})`}/>)}
    <circle r="9" fill="#bd8c4b"/><path d="m-3-2 5 4m-5 0 5-4"/>
   </g>
  </svg>
  <svg className="letter-flowers-right" viewBox="0 0 180 420" fill="none" focusable="false">
   <g stroke="#627c58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M113 110C101 176 100 239 118 305C127 338 142 360 160 374S200 396 220 400M49 223C76 272 104 314 122 349S179 399 220 408M159 174C167 228 159 283 146 330S170 375 220 385"/>
    <path d="M118 305q43-12 47-45-39 3-47 45ZM108 254q-42-2-58-34 40-7 58 34ZM105 206q39-14 36-42-35 5-36 42ZM136 348q-43 2-64-27 39-12 64 27Z" fill="#b0c39a"/>
   </g>
   <g transform="translate(113 99)" stroke="#ad6e69" strokeWidth="1.8" strokeLinejoin="round">
    <path d="m-14 23 14 16 15-16" fill="#90a77c" stroke="#627c58"/>
    <path d="M-30 10q-17-30 11-35 11-23 32-8 30-2 26 24 13 21-10 32-16 18-35 4-18 5-24-17Z" fill="#edb6ae"/>
    <path d="M-19-24q-7 27 20 38 24-7 12-46M-31 2q17-6 32 12-4 13-7 15M1 14q17-20 37-16M-11-9q7-16 19-5 9 15-7 20-14-1-12-15Zm4 0 8-4 4 8-7 4Z"/>
   </g>
   {[{x:159,y:167,s:.8},{x:49,y:218,s:.9}].map(({x,y,s})=><g key={x} transform={`translate(${x} ${y}) scale(${s})`} stroke="#ac8442" strokeWidth="1.5">
    {Array.from({length:12},(_,i)=><ellipse key={i} cy="-17" rx="6" ry="17" fill={i%2?'#f2d38b':'#f8dfa1'} transform={`rotate(${i*30})`}/>)}
    <circle r="9" fill="#bd8c4b"/>
   </g>)}
  </svg>
 </div>;
}

export function ReceivedLetter({recipient,note,actions}:{recipient:string;note:ReactNode;actions:ReactNode}){
 const [phase,setPhase]=useState<'sealed'|'opening'|'open'>('sealed');
 const noteId=useId(),paper=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(phase==='open')paper.current?.focus({preventScroll:true});
  if(phase!=='opening')return;
  // Also finish if animations are disabled or interrupted by a preference change.
  const timer=window.setTimeout(()=>setPhase('open'),2400);
  return()=>window.clearTimeout(timer);
 },[phase]);
 function open(){
  if(phase!=='sealed')return;
  setPhase(window.matchMedia('(prefers-reduced-motion: reduce)').matches?'open':'opening');
 }
 return <section className="received-letter" data-phase={phase} aria-label="Phong thư tri ân">
  <p className="envelope-invitation" role="status">{phase==='sealed'?'Có một lời cảm ơn đang chờ thầy cô mở…':phase==='opening'?'Lời nhắn đang được mở…':'Một lời nhắn nhỏ, gửi trọn lòng biết ơn.'}</p>
  <div className="envelope-stage">
   {phase!=='sealed'&&<TeacherFlowers/>}
   <div className="envelope-back" aria-hidden="true">
    <svg viewBox="0 0 400 250" preserveAspectRatio="none"><rect x="2" y="2" width="396" height="246" rx="8" fill="#d6bc90" stroke="#80694b" strokeWidth="2"/><path d="M5 5 200 145 395 5" fill="#c4a579" stroke="#a48a64" strokeWidth="2"/></svg>
   </div>
   <div id={noteId} ref={paper} className="envelope-note" role="region" aria-label="Lời nhắn dành cho thầy cô" tabIndex={-1} aria-hidden={phase!=='open'} inert={phase!=='open'} onAnimationEnd={event=>{if(event.target===event.currentTarget&&event.animationName==='envelope-note-emerge')setPhase('open')}}>
    {note}
   </div>
   <div className="envelope-pocket" aria-hidden="true">
    <svg viewBox="0 0 400 250" preserveAspectRatio="none"><path d="M2 5 200 143 398 5v237q0 6-6 6H8q-6 0-6-6Z" fill="#ead6b0" stroke="#80694b" strokeWidth="2"/><path d="M3 246 160 126q40-27 80 0l157 120" fill="#f1dfbd" stroke="#baa07b" strokeWidth="1.5"/><path d="m17 230 143-106M383 230 243 124" stroke="#fff5db" strokeWidth="2" opacity=".6"/></svg>
   </div>
   <div className="envelope-flap" aria-hidden="true">
    <svg viewBox="0 0 400 145" preserveAspectRatio="none"><path d="M2 2h396L211 138q-11 8-22 0Z" fill="#f5e5c6" stroke="#997d57" strokeWidth="2" strokeLinejoin="round"/><path d="M13 7 193 132q7 5 14 0L387 7" fill="none" stroke="#fff8e8" strokeWidth="2"/></svg>
   </div>
   <button type="button" className="envelope-trigger" onClick={open} aria-controls={noteId} aria-expanded={phase==='open'} disabled={phase!=='sealed'} tabIndex={phase==='sealed'?0:-1} aria-hidden={phase!=='sealed'}>
    <span className="envelope-seal" aria-hidden="true">♡</span>
    <span className="envelope-address"><strong>{recipient||'Thầy cô kính mến'}</strong></span>
    <span className="envelope-open-label">Chạm để mở thư <span aria-hidden="true">↗</span></span>
   </button>
  </div>
  <div className="received-letter-actions" hidden={phase!=='open'}>{actions}</div>
 </section>;
}
