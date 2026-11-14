import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {boardPanelInterval,startBoardPanelScroll} from '../lib/board-panel-scroll';

describe('board panel auto-scroll',()=>{
 let viewport:HTMLElement,board:HTMLElement,stop:()=>void,clock:number,boardClasses:Set<string>;
 beforeEach(()=>{
  vi.useFakeTimers();clock=0;
  vi.stubGlobal('performance',{now:()=>clock});
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>setTimeout(()=>{clock+=16;callback(clock)},16));
  vi.stubGlobal('cancelAnimationFrame',clearTimeout);
  vi.stubGlobal('window',{matchMedia:()=>({matches:false})});
  const doc=new EventTarget();Object.assign(doc,{hidden:false});vi.stubGlobal('document',doc);
  boardClasses=new Set();
  viewport=Object.assign(new EventTarget(),{scrollTop:0,clientTop:0,clientHeight:500,classList:{add:vi.fn(),remove:vi.fn()},getBoundingClientRect:()=>({top:30})}) as unknown as HTMLElement;
  Object.defineProperty(viewport,'scrollHeight',{get:()=>boardClasses.has('board-is-looping')?2000:1500});
  board={classList:{add:(name:string)=>boardClasses.add(name),remove:(name:string)=>boardClasses.delete(name)},querySelectorAll:()=>[0,500,1000,1500].map(top=>({getBoundingClientRect:()=>({top:30+(top===1500&&!boardClasses.has('board-is-looping')?0:top)-viewport.scrollTop}),hasAttribute:(name:string)=>name==='data-board-loop-clone'&&top===1500}))} as unknown as HTMLElement;
  stop=startBoardPanelScroll(viewport,board);
 });
 afterEach(()=>{stop();vi.useRealTimers();vi.unstubAllGlobals()});
 it('waits 5 seconds, then eases down and lands exactly on the next panel',()=>{
  vi.advanceTimersByTime(4_999);expect(viewport.scrollTop).toBe(0);
  vi.advanceTimersByTime(1+256);expect(viewport.scrollTop).toBeGreaterThan(250);expect(viewport.scrollTop).toBeLessThan(500);
  vi.advanceTimersByTime(800);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(6_100);expect(viewport.scrollTop).toBe(1000);
 });
 it('continues downward through the duplicate, resets invisibly, and repeats',()=>{
  viewport.scrollTop=1000;
  expect(boardClasses.has('board-is-looping')).toBe(false);
  vi.advanceTimersByTime(5_256);expect(viewport.scrollTop).toBeGreaterThan(1250);expect(viewport.scrollTop).toBeLessThan(1500);
  expect(boardClasses.has('board-is-looping')).toBe(true);
  vi.advanceTimersByTime(800);expect(viewport.scrollTop).toBe(0);
  expect(boardClasses.has('board-is-looping')).toBe(false);
  vi.advanceTimersByTime(6_000);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(6_000);expect(viewport.scrollTop).toBe(1000);
  vi.advanceTimersByTime(6_000);expect(viewport.scrollTop).toBe(0);
 });
 it.each(['wheel','pointerdown','touchstart','keydown'])('hides the clone and returns to the first real panel when %s interrupts a wrap',event=>{
  viewport.scrollTop=1000;
  vi.advanceTimersByTime(5_256);
  viewport.dispatchEvent(new Event(event));
  expect(viewport.scrollTop).toBe(0);
  expect(boardClasses.has('board-is-looping')).toBe(false);
  expect(viewport.scrollHeight).toBe(1500);
  vi.advanceTimersByTime(4_999);expect(viewport.scrollTop).toBe(0);
  vi.advanceTimersByTime(1100);expect(viewport.scrollTop).toBe(500);
 });
 it('returns to the last real panel when a wrap is interrupted near its start',()=>{
  viewport.scrollTop=1000;
  vi.advanceTimersByTime(5_016);
  viewport.dispatchEvent(new Event('wheel'));
  expect(viewport.scrollTop).toBe(1000);
  expect(boardClasses.has('board-is-looping')).toBe(false);
 });
 it('removes the temporary clone from scrolling when unmounted mid-wrap',()=>{
  viewport.scrollTop=1000;
  vi.advanceTimersByTime(5_256);stop();
  expect(boardClasses.has('board-is-looping')).toBe(false);
  expect(viewport.scrollTop).toBe(0);
  vi.advanceTimersByTime(6_100);expect(viewport.scrollTop).toBe(0);
 });
 it('restarts the countdown after manual navigation and follows the current panel',()=>{
  vi.advanceTimersByTime(3_000);viewport.scrollTop=500;viewport.dispatchEvent(new Event('wheel'));
  vi.advanceTimersByTime(4_999);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(1100);expect(viewport.scrollTop).toBe(1000);
 });
 it('cancels an animation and its timer when paused or unmounted',()=>{
  vi.advanceTimersByTime(5_250);const position=viewport.scrollTop;stop();
  vi.advanceTimersByTime(5_000);expect(viewport.scrollTop).toBe(position);
 });
 it('changes panels without animation when reduced motion is requested',()=>{
  window.matchMedia=vi.fn(()=>({matches:true})) as unknown as typeof window.matchMedia;
  vi.advanceTimersByTime(5_000);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(5_000);expect(viewport.scrollTop).toBe(1000);
  vi.advanceTimersByTime(5_000);expect(viewport.scrollTop).toBe(0);
  expect(boardClasses.has('board-is-looping')).toBe(false);
 });
 it('does not advance while the tab is hidden',()=>{
  Object.assign(document,{hidden:true});vi.advanceTimersByTime(5_000);expect(viewport.scrollTop).toBe(0);
  Object.assign(document,{hidden:false});document.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(6_100);expect(viewport.scrollTop).toBe(500);
 });
 it('continues auto-scrolling when notes have expanded to fit their content',()=>{
  board.querySelectorAll=(()=>[0,500,1000,1500].map(top=>({getBoundingClientRect:()=>({top:30+top-viewport.scrollTop}),hasAttribute:(name:string)=>name==='data-expanded'||name==='data-board-loop-clone'&&top===1500}))) as unknown as typeof board.querySelectorAll;
  vi.advanceTimersByTime(6_100);expect(viewport.scrollTop).toBe(500);
 });
 it('loads the next page after showing every panel instead of looping the same notes',()=>{
  stop();const nextPage=vi.fn();stop=startBoardPanelScroll(viewport,board,nextPage);
  vi.advanceTimersByTime(boardPanelInterval+1100);expect(viewport.scrollTop).toBe(500);
  expect(nextPage).not.toHaveBeenCalled();
  vi.advanceTimersByTime(boardPanelInterval+1100);expect(viewport.scrollTop).toBe(1000);
  expect(nextPage).not.toHaveBeenCalled();
  vi.advanceTimersByTime(boardPanelInterval);expect(nextPage).toHaveBeenCalledTimes(1);
  expect(boardClasses.has('board-is-looping')).toBe(false);
  vi.advanceTimersByTime(boardPanelInterval*2);expect(nextPage).toHaveBeenCalledTimes(1);
 });
 it('advances a single-panel page after the interval',()=>{
  stop();const nextPage=vi.fn();
  board.querySelectorAll=(()=>[{getBoundingClientRect:()=>({top:30}),hasAttribute:()=>false}]) as unknown as typeof board.querySelectorAll;
  stop=startBoardPanelScroll(viewport,board,nextPage);
  vi.advanceTimersByTime(boardPanelInterval-1);expect(nextPage).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);expect(nextPage).toHaveBeenCalledTimes(1);
 });
 it('defers page changes while hidden, resets after interaction, and cancels when paused',()=>{
  stop();const nextPage=vi.fn();viewport.scrollTop=1000;
  stop=startBoardPanelScroll(viewport,board,nextPage);
  Object.assign(document,{hidden:true});vi.advanceTimersByTime(boardPanelInterval*2);
  expect(nextPage).not.toHaveBeenCalled();
  Object.assign(document,{hidden:false});document.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(boardPanelInterval-1);viewport.dispatchEvent(new Event('pointerdown'));
  vi.advanceTimersByTime(boardPanelInterval-1);expect(nextPage).not.toHaveBeenCalled();
  stop();vi.advanceTimersByTime(boardPanelInterval*2);expect(nextPage).not.toHaveBeenCalled();
  stop=startBoardPanelScroll(viewport,board,nextPage);
  vi.advanceTimersByTime(boardPanelInterval);expect(nextPage).toHaveBeenCalledTimes(1);
 });
});
