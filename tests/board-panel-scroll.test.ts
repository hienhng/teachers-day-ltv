import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {startBoardPanelScroll} from '../lib/board-panel-scroll';

describe('board panel auto-scroll',()=>{
 let viewport:HTMLElement,board:HTMLElement,stop:()=>void,clock:number;
 beforeEach(()=>{
  vi.useFakeTimers();clock=0;
  vi.stubGlobal('performance',{now:()=>clock});
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>setTimeout(()=>{clock+=16;callback(clock)},16));
  vi.stubGlobal('cancelAnimationFrame',clearTimeout);
  vi.stubGlobal('window',{matchMedia:()=>({matches:false})});
  const doc=new EventTarget();Object.assign(doc,{hidden:false});vi.stubGlobal('document',doc);
  viewport=Object.assign(new EventTarget(),{scrollTop:0,clientTop:0,clientHeight:500,scrollHeight:2000,classList:{add:vi.fn(),remove:vi.fn()},getBoundingClientRect:()=>({top:30})}) as unknown as HTMLElement;
  board={querySelectorAll:()=>[0,500,1000,1500].map(top=>({getBoundingClientRect:()=>({top:30+top-viewport.scrollTop}),hasAttribute:(name:string)=>name==='data-board-loop-clone'&&top===1500}))} as unknown as HTMLElement;
  stop=startBoardPanelScroll(viewport,board);
 });
 afterEach(()=>{stop();vi.useRealTimers();vi.unstubAllGlobals()});
 it('waits 60 seconds, then eases down and lands exactly on the next panel',()=>{
  vi.advanceTimersByTime(59_999);expect(viewport.scrollTop).toBe(0);
  vi.advanceTimersByTime(1+256);expect(viewport.scrollTop).toBeGreaterThan(250);expect(viewport.scrollTop).toBeLessThan(500);
  vi.advanceTimersByTime(800);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(61_100);expect(viewport.scrollTop).toBe(1000);
 });
 it('continues downward through the duplicate, resets invisibly, and repeats',()=>{
  viewport.scrollTop=1000;
  vi.advanceTimersByTime(60_256);expect(viewport.scrollTop).toBeGreaterThan(1250);expect(viewport.scrollTop).toBeLessThan(1500);
  vi.advanceTimersByTime(800);expect(viewport.scrollTop).toBe(0);
  vi.advanceTimersByTime(61_000);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(61_000);expect(viewport.scrollTop).toBe(1000);
  vi.advanceTimersByTime(61_000);expect(viewport.scrollTop).toBe(0);
 });
 it('continues from the first panel if manually scrolled onto its duplicate',()=>{
  viewport.scrollTop=1500;
  vi.advanceTimersByTime(61_100);expect(viewport.scrollTop).toBe(500);
 });
 it('restarts the countdown after manual navigation and follows the current panel',()=>{
  vi.advanceTimersByTime(3_000);viewport.scrollTop=500;viewport.dispatchEvent(new Event('wheel'));
  vi.advanceTimersByTime(59_999);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(1100);expect(viewport.scrollTop).toBe(1000);
 });
 it('cancels an animation and its timer when paused or unmounted',()=>{
  vi.advanceTimersByTime(60_250);const position=viewport.scrollTop;stop();
  vi.advanceTimersByTime(60_000);expect(viewport.scrollTop).toBe(position);
 });
 it('changes panels without animation when reduced motion is requested',()=>{
  window.matchMedia=vi.fn(()=>({matches:true})) as unknown as typeof window.matchMedia;
  vi.advanceTimersByTime(60_000);expect(viewport.scrollTop).toBe(500);
  vi.advanceTimersByTime(60_000);expect(viewport.scrollTop).toBe(1000);
  vi.advanceTimersByTime(60_000);expect(viewport.scrollTop).toBe(0);
 });
 it('does not advance while the tab is hidden',()=>{
  Object.assign(document,{hidden:true});vi.advanceTimersByTime(60_000);expect(viewport.scrollTop).toBe(0);
  Object.assign(document,{hidden:false});document.dispatchEvent(new Event('visibilitychange'));
  vi.advanceTimersByTime(61_100);expect(viewport.scrollTop).toBe(500);
 });
 it('continues auto-scrolling when notes have expanded to fit their content',()=>{
  board.querySelectorAll=(()=>[0,500,1000,1500].map(top=>({getBoundingClientRect:()=>({top:30+top-viewport.scrollTop}),hasAttribute:(name:string)=>name==='data-expanded'||name==='data-board-loop-clone'&&top===1500}))) as unknown as typeof board.querySelectorAll;
  vi.advanceTimersByTime(61_100);expect(viewport.scrollTop).toBe(500);
 });
});
