'use client';
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import type {Card} from '../lib/card-validation';
import {noteShape} from '../lib/note-design';
import {boardPanelNoteSize,boardPanelCapacity,growBoardPapers,layoutBoardPanel,sectionBoardNotes,type BoardReservedArea} from '../lib/board-note-layout';
import {startBoardPanelScroll} from '../lib/board-panel-scroll';
import {StickyNote} from './sticky-note';
import './scattered-notes.css';

type ScatteredNotesProps={cards:Card[];page?:number;onSelect:(card:Card,source:HTMLButtonElement)=>void;showGreeting?:boolean;openedCardId?:string;targetCardId?:string;paused?:boolean;onPageEnd?:()=>void};

export function ScatteredNotes({cards,page=0,onSelect,showGreeting=false,openedCardId,targetCardId,paused=false,onPageEnd}:ScatteredNotesProps){
 const container=useRef<HTMLDivElement>(null);
 const revealedTarget=useRef<string|undefined>(undefined);
 const greeting=useRef<HTMLDivElement>(null);
 const [bounds,setBounds]=useState({width:0,height:0});
 const [greetingSize,setGreetingSize]=useState({width:0,height:0});
 const [panelWidths,setPanelWidths]=useState<Record<string,number>>({});
 const pageKey=cards.map(card=>card.id||card.recipient).join('|');
 const widthScope=`${pageKey}:${bounds.width}:${bounds.height}:`;
 const boardWidth=Math.max(bounds.width,...Object.entries(panelWidths).filter(([key])=>key.startsWith(widthScope)).map(([,width])=>width));
 const reportWidth=useCallback((key:string,width:number)=>{
  const scopedKey=widthScope+key;
  setPanelWidths(previous=>previous[scopedKey]===width?previous:{...previous,[scopedKey]:width});
 },[widthScope]);
 const greetingTop=bounds.width<1100?0:Math.max(12,(bounds.height-greetingSize.height)/2);
 const reservedGreeting=useMemo(()=>showGreeting?{x:(bounds.width-greetingSize.width)/2-12,y:greetingTop-12,width:greetingSize.width+24,height:greetingSize.height+24}:undefined,[showGreeting,bounds.width,greetingSize,greetingTop]);
 const capacity=boardPanelCapacity(bounds.width,bounds.height,reservedGreeting);
 const panels=useMemo(()=>sectionBoardNotes(cards,capacity),[cards,capacity]);
 const noteSize=boardPanelNoteSize(Math.max(1,...panels.map(panel=>panel.length)),bounds.width,bounds.height,reservedGreeting);
 useLayoutEffect(()=>{const viewport=container.current?.parentElement;if(viewport)viewport.scrollLeft=Math.max(0,(boardWidth-bounds.width)/2)},[boardWidth,bounds.width]);
 useLayoutEffect(()=>{
  const viewport=container.current?.parentElement;
  if(!viewport)return;
  const measure=()=>{
   const style=getComputedStyle(viewport);
   const width=Math.max(1,viewport.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
   const height=Math.max(1,viewport.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom));
   setBounds(previous=>previous.width===width&&previous.height===height?previous:{width,height});
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(viewport);
  return()=>observer.disconnect();
 },[]);
 useLayoutEffect(()=>{
  const inscription=greeting.current;
  if(!showGreeting||!inscription)return;
  const measure=()=>{
   const width=inscription.offsetWidth,height=inscription.offsetHeight;
   setGreetingSize(previous=>previous.width===width&&previous.height===height?previous:{width,height});
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(inscription);
  return()=>observer.disconnect();
 },[showGreeting]);
 useLayoutEffect(()=>{const viewport=container.current?.parentElement;if(viewport)viewport.scrollTop=0},[page,capacity]);
 useLayoutEffect(()=>{
  if(!targetCardId){revealedTarget.current=undefined;return}
  if(revealedTarget.current===targetCardId||paused||!bounds.width)return;
  // Wait for the panels' measured paper sizes before revealing the original note.
  const frame=requestAnimationFrame(()=>{
   const note=container.current?.querySelector<HTMLButtonElement>('.board-note-panel:not([data-board-loop-clone]) [data-targeted="true"]');
   if(!note)return;
   revealedTarget.current=targetCardId;
   note?.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
   note?.focus({preventScroll:true});
  });
  return()=>cancelAnimationFrame(frame);
 },[targetCardId,paused,pageKey,capacity,boardWidth,bounds.width,bounds.height]);
 useEffect(()=>{
  const board=container.current,viewport=board?.parentElement;
  if(!board||!viewport||paused||openedCardId||!bounds.width)return;
  if(!onPageEnd&&(panels.length<2||bounds.width<1100))return;
  return startBoardPanelScroll(viewport,board,onPageEnd);
 },[pageKey,capacity,panels.length,paused,openedCardId,bounds.width,onPageEnd]);
 const sections=panels.length?panels:showGreeting?[[]]:[];
 return <div ref={container} className="sectioned-notes" style={{'--board-viewport-width':`${bounds.width}px`} as CSSProperties}>
  {showGreeting&&<div className="board-fixed-title"><ChalkGreeting inscriptionRef={greeting} left={boardWidth/2} top={greetingTop}/></div>}
  {sections.map((notes,index)=><ScatteredNotePanel key={index} cards={notes} onSelect={onSelect} openedCardId={openedCardId} targetCardId={targetCardId} reservedGreeting={reservedGreeting} bounds={bounds} noteSize={noteSize} index={index} count={sections.length} reportWidth={reportWidth} boardWidth={boardWidth}/>)}
  {panels.length>1&&<ScatteredNotePanel cards={panels[0]} onSelect={onSelect} reservedGreeting={reservedGreeting} bounds={bounds} noteSize={noteSize} index={0} count={sections.length} boardWidth={boardWidth} loopClone/>}
 </div>;
}

function ScatteredNotePanel({cards,onSelect,openedCardId,targetCardId,bounds,noteSize,index,count,loopClone=false,reservedGreeting,reportWidth,boardWidth}:ScatteredNotesProps&{bounds:{width:number;height:number};noteSize:number;index:number;count:number;loopClone?:boolean;reservedGreeting?:BoardReservedArea;reportWidth?:(key:string,width:number)=>void;boardWidth?:number}){
 const panelRef=useRef<HTMLDivElement>(null);
 const layout=useMemo(()=>layoutBoardPanel(cards.map(card=>card.id||card.recipient),bounds.width,bounds.height,cards.map(card=>noteSize*(bounds.width>=760&&noteShape(card.theme).shape==='square'?.92:1)),reservedGreeting,undefined,true),[cards,bounds,noteSize,reservedGreeting]);
 useLayoutEffect(()=>{reportWidth?.(String(index),layout.width)},[reportWidth,index,layout.width]);
 useLayoutEffect(()=>{
  const panel=panelRef.current;
  if(!panel)return;
  const papers=[...panel.querySelectorAll<HTMLElement>('.board-note-paper')];
  if(bounds.width<760){
   const placeReadableNotes=()=>{
    let top=Math.max(12,reservedGreeting?reservedGreeting.y+reservedGreeting.height+24:12);
    papers.forEach(paper=>{
     const note=paper.querySelector<HTMLElement>('.sticky-note')!,button=paper.parentElement!;
     const height=note.offsetHeight,width=note.offsetWidth,inset=Math.max(20,width*.12);
     button.style.left=`${((boardWidth||layout.width)-width)/2}px`;
     button.style.top=`${top+inset}px`;button.style.height=`${height}px`;
     top+=height+inset*2+24;
    });
    panel.style.height=`${Math.max(bounds.height,top)}px`;
   };
   placeReadableNotes();
   const observer=new ResizeObserver(placeReadableNotes);
   papers.forEach(paper=>observer.observe(paper.querySelector('.sticky-note')!));
   return()=>observer.disconnect();
  }
  if(!matchMedia('(min-width: 2200px) and (min-height: 1000px)').matches)return;
  const centerOffset=((boardWidth||layout.width)-layout.width)/2;
  papers.forEach((paper,index)=>{
   paper.style.setProperty('--board-paper-scale','1');
   paper.parentElement!.style.left=`${layout.positions[index].left+centerOffset}px`;
   paper.parentElement!.style.top=`${layout.positions[index].top}px`;
  });
  const frame=panel.getBoundingClientRect();
  const measured=papers.map(paper=>{
   const button=paper.parentElement!.getBoundingClientRect();
   const pieces=[...paper.querySelectorAll('.sticky-note,.note-tape,.note-sticker')].map(piece=>piece.getBoundingClientRect());
   const left=Math.min(...pieces.map(piece=>piece.left)),top=Math.min(...pieces.map(piece=>piece.top));
   return {x:left-frame.left,y:top-frame.top,width:Math.max(...pieces.map(piece=>piece.right))-left,height:Math.max(...pieces.map(piece=>piece.bottom))-top,centerX:button.left+button.width/2-frame.left,centerY:button.top+button.height/2-frame.top};
  });
  const title=reservedGreeting?{...reservedGreeting,x:reservedGreeting.x+((boardWidth||layout.width)-bounds.width)/2}:undefined;
  const placements=growBoardPapers(measured,frame.width,layout.height,title);
  papers.forEach((paper,index)=>{
   const placement=placements[index];
   paper.style.setProperty('--board-paper-scale',String(placement.scale));
   paper.parentElement!.style.left=`${layout.positions[index].left+centerOffset+placement.offsetX}px`;
   paper.parentElement!.style.top=`${layout.positions[index].top+placement.offsetY}px`;
  });
 },[layout,boardWidth,reservedGreeting,bounds.width,bounds.height]);
 return <div ref={panelRef} className="board-notes scattered-notes board-note-panel" data-expanded={layout.height>bounds.height||layout.width>bounds.width||undefined} data-board-loop-clone={loopClone||undefined} inert={loopClone||undefined} aria-hidden={loopClone||undefined} role="group" aria-label={`Phần ${index+1} / ${count}`} style={{width:boardWidth||layout.width,height:layout.height,visibility:bounds.width?'visible':'hidden','--board-note-size':`${noteSize}px`,'--board-viewport-width':`${bounds.width}px`} as CSSProperties}>
  {cards.map((card,index)=>{
   const originalPosition=layout.positions[index];
   const position={...originalPosition,left:originalPosition.left+((boardWidth||layout.width)-layout.width)/2};
   const size=layout.sizes[index];
   const targeted=Boolean(targetCardId&&card.id===targetCardId);
   return <button className="board-note-button" data-targeted={targeted||undefined} data-opened={Boolean(openedCardId&&card.id===openedCardId)||undefined} key={card.id} onClick={event=>onSelect(card,event.currentTarget)} aria-label={`${targeted?'Lời nhắn của bạn. ':''}Đọc lời nhắn gửi ${card.recipient}`} style={{left:position.left,top:position.top,width:size,height:size,'--note-rotation':`${position.rotation}deg`} as CSSProperties}><span className="board-note-paper"><StickyNote card={card} compact readablePreview={bounds.width<760}/></span></button>;
  })}
 </div>;
}

function ChalkGreeting({inscriptionRef,left,top}:{inscriptionRef:React.RefObject<HTMLDivElement|null>;left:number;top:number}){
 return <div ref={inscriptionRef} className="board-chalk-greeting" style={{left,top}}>
   <svg className="greeting-hanging-sign" viewBox="0 0 360 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M64 79 180 9 296 79" fill="none" stroke="#573c27" strokeWidth="7" strokeLinejoin="round"/>
    <path d="M64 79 180 9 296 79" fill="none" stroke="#e1c899" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M64 79 180 9 296 79" fill="none" stroke="#a48656" strokeWidth="4" strokeDasharray="2 5"/>
    <circle cx="180" cy="9" r="6" fill="#192b25"/>
    <circle cx="179" cy="8" r="3.5" fill="#bcac86"/>
    <path d="m5 66 12-6 329 2 10 9-2 179-11 8-328-2-12-9Z" fill="#765034" stroke="#493725" strokeWidth="2"/>
    <path d="m5 62 12-6 329 2 10 9-2 177-11 8-328-2-12-9Z" fill="#dfb77a" stroke="#785331" strokeWidth="2"/>
    <path d="m16 66 326 2M15 240l326 2" stroke="#f6d69c" strokeWidth="2" fill="none"/>
    <g fill="none" stroke="#a97c46" strokeWidth="1" opacity=".4">
     <path d="M22 82q56-8 101-2m111 1q52-6 103 1M14 125q23-4 42-2m249 4 42-2M18 193q22-7 49-3m227 6q20-6 51-4M22 224q65-6 101-1m101 4q60-5 111-1"/>
     <path d="M29 209q15-9 29-1-14 10-29 1Zm7 0q7-4 14 0m263-107q13-9 24-1-11 9-24 1Z"/>
    </g>
    <g fill="#4e3927" stroke="#f1d29b" strokeWidth="2">
     <circle cx="64" cy="76" r="6"/><circle cx="296" cy="76" r="6"/>
    </g>
    <path d="M64 70v9m232-9v9" stroke="#e1c899" strokeWidth="3" strokeLinecap="round"/>
   </svg>
   <div className="greeting-margin-doodles" aria-hidden="true">
    <svg className="greeting-doodle greeting-doodle-heart" viewBox="0 0 24 24" focusable="false"><path d="M12 20 4 12C-2 5 8 0 12 7c5-7 14-1 8 6Z"/></svg>
    <svg className="greeting-doodle greeting-doodle-flower" viewBox="0 0 24 24" focusable="false"><path d="M9 8C3 0 0 11 6 12c-8 5 2 12 5 5 2 9 13 3 7-3 9 0 4-11-2-7 2-8-8-8-7 1Z"/><circle cx="12" cy="11" r="2.5"/></svg>
    <svg className="greeting-doodle greeting-doodle-star" viewBox="0 0 24 24" focusable="false"><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/></svg>
    <svg className="greeting-doodle greeting-doodle-sparks" viewBox="0 0 24 24" focusable="false"><path d="m9 3 1 13m-7-7 13-1m3 10 1 4m-3-2 5-1"/></svg>
    <svg className="greeting-doodle greeting-doodle-plane" viewBox="0 0 24 24" focusable="false"><path d="m2 9 20-7-7 20-4-9-9-4Zm9 4L22 2m-11 11-1 7 4-4"/></svg>
    <svg className="greeting-doodle greeting-doodle-sprout" viewBox="0 0 24 24" focusable="false"><path d="M12 22c-2-7-1-13 3-19m-3 12C3 16 1 10 2 7c6 0 10 3 10 8Zm1-5c0-7 5-9 9-8 0 5-3 9-9 8Z"/></svg>
    <svg className="greeting-doodle greeting-doodle-loop" viewBox="0 0 24 24" focusable="false"><path d="M2 17C-1 6 14 1 16 9c2 7-10 10-9 3 1-6 16-7 15 8m-3-3 3 3 1-4"/></svg>
   </div>
   <svg className="greeting-chalk-emblem" viewBox="0 0 80 38" fill="none" aria-hidden="true" focusable="false">
    <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
     <path className="greeting-emblem-heart" d="M40 30 29 19c-8-9 5-18 11-9 7-9 19 0 11 9Z"/>
     <path d="M20 12q-5 6 0 12m-7-17q-9 11 0 22m47-17q5 6 0 12m7-17q9 11 0 22"/>
     <path className="greeting-emblem-rays" d="m34 2 1 2m11-2-1 2M3 17v3m74-3v3"/>
    </g>
   </svg>
   <h1 aria-label="TRẠM PHÁT SÓNG YÊU THƯƠNG 20/11"><span className="greeting-chalk-kicker">TRẠM</span><span className="greeting-chalk-main">PHÁT SÓNG</span><span className="greeting-chalk-love">YÊU THƯƠNG</span><strong className="greeting-chalk-date">20/11</strong></h1>
  </div>;
}
