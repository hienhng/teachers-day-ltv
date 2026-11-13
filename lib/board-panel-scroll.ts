export const boardPanelInterval=120_000;

/** Keep the loop duplicate outside manual scrolling; reveal it only while wrapping. */
export function startBoardPanelScroll(viewport:HTMLElement,board:HTMLElement){
 let timer:ReturnType<typeof setTimeout>,frame=0,animating=false;
 let loop:{first:number;last:number;clone:number}|undefined;
 const cancelAnimation=()=>{
  cancelAnimationFrame(frame);frame=0;animating=false;
  if(loop){
   // An interrupted wrap must settle on a real, interactive panel.
   const nearerFirst=Math.abs(viewport.scrollTop-loop.clone)<Math.abs(viewport.scrollTop-loop.last);
   viewport.scrollTop=nearerFirst?loop.first:loop.last;
   loop=undefined;
  }
  board.classList.remove('board-is-looping');
  viewport.classList.remove('board-is-advancing');
 };
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(advance,boardPanelInterval)};
 const advance=()=>{
  if(document.hidden){schedule();return}
  const allPanels=Array.from(board.querySelectorAll<HTMLElement>('.board-note-panel'));
  const clone=allPanels.find(panel=>panel.hasAttribute('data-board-loop-clone'));
  const panels=allPanels.filter(panel=>panel!==clone);
  if(panels.length<2)return;
  const viewportTop=viewport.getBoundingClientRect().top+viewport.clientTop;
  const offsets=panels.map(panel=>panel.getBoundingClientRect().top-viewportTop+viewport.scrollTop);
  const current=offsets.reduce((nearest,offset,index)=>Math.abs(offset-viewport.scrollTop)<Math.abs(offsets[nearest]-viewport.scrollTop)?index:nearest,0);
  const next=(current+1)%offsets.length;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){viewport.scrollTop=offsets[next];schedule();return}
  animating=true;viewport.classList.add('board-is-advancing');
  let target=offsets[next];
  if(clone&&next===0){
   board.classList.add('board-is-looping');
   target=clone.getBoundingClientRect().top-viewportTop+viewport.scrollTop;
   loop={first:offsets[0],last:offsets[current],clone:target};
  }
  const from=viewport.scrollTop,to=Math.min(target,viewport.scrollHeight-viewport.clientHeight);
  const finish=()=>{
   // The duplicate and original look identical; reset while snapping is disabled.
   if(loop){viewport.scrollTop=loop.first;loop=undefined}
   cancelAnimation();schedule();
  };
  const start=performance.now();
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
