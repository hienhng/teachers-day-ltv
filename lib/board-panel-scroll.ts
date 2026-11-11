export const boardPanelInterval=5_000;

/** Scroll through the panels, using a duplicate first panel for a seamless loop. */
export function startBoardPanelScroll(viewport:HTMLElement,board:HTMLElement){
 let timer:ReturnType<typeof setTimeout>,frame=0,animating=false;
 const cancelAnimation=()=>{
  cancelAnimationFrame(frame);frame=0;animating=false;
  viewport.classList.remove('board-is-advancing');
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(advance,boardPanelInterval)};
 const advance=()=>{
  if(document.hidden){schedule();return}
  const panels=Array.from(board.querySelectorAll<HTMLElement>('.board-note-panel'));
  if(panels.length<2)return;
  const hasLoopPanel=panels[panels.length-1].hasAttribute('data-board-loop-clone');
  const viewportTop=viewport.getBoundingClientRect().top+viewport.clientTop;
  const offsets=panels.map(panel=>panel.getBoundingClientRect().top-viewportTop+viewport.scrollTop);
  let current=offsets.reduce((nearest,offset,index)=>Math.abs(offset-viewport.scrollTop)<Math.abs(offsets[nearest]-viewport.scrollTop)?index:nearest,0);
  if(hasLoopPanel&&current===offsets.length-1){
   viewport.scrollTop=offsets[0]+viewport.scrollTop-offsets[current];current=0;
  }
  const next=(current+1)%offsets.length;
  const from=viewport.scrollTop,to=Math.min(offsets[next],viewport.scrollHeight-viewport.clientHeight);
  const finish=()=>{
   // The duplicate and original look identical; reset while snapping is disabled.
   if(hasLoopPanel&&next===offsets.length-1)viewport.scrollTop=offsets[0];
   cancelAnimation();schedule();
  };
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){viewport.scrollTop=to;finish();return}
  const start=performance.now();
  animating=true;viewport.classList.add('board-is-advancing');
  const step=(now:number)=>{
   const progress=Math.min(1,(now-start)/1000);
   viewport.scrollTop=from+(to-from)*(1-(1-progress)**3);
   if(progress<1)frame=requestAnimationFrame(step);
   else finish();
  };
  frame=requestAnimationFrame(step);
 };
 const interact=()=>{cancelAnimation();schedule()};
 const scroll=()=>{if(!animating)schedule()};
 const events=['wheel','pointerdown','touchstart','keydown'];
 events.forEach(event=>viewport.addEventListener(event,interact,{passive:true}));
 viewport.addEventListener('scroll',scroll,{passive:true});
 document.addEventListener('visibilitychange',interact);
 schedule();
 return()=>{
  clearTimeout(timer);cancelAnimation();
  events.forEach(event=>viewport.removeEventListener(event,interact));
  viewport.removeEventListener('scroll',scroll);
  document.removeEventListener('visibilitychange',interact);
 };
}
