import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {boardRefreshInterval,startBoardLiveUpdates,type BoardPage} from '../lib/board-live-updates';
import type {Card} from '../lib/card-validation';

const note={id:'00000000-0000-4000-8000-000000000001',flower:'tulip',theme:'meadow',recipient:'Cô Lan',message:'Cảm ơn cô rất nhiều!',sender:'',anonymous:true,shareSender:false} satisfies Card;
const snapshot=(cards:Card[]=[note],page=0,hasMore=false):BoardPage=>({cards,page,hasMore});
const response=(data:BoardPage)=>Response.json(data);

describe('live board updates',()=>{
 let stop:(()=>void)|undefined;
 const onUpdate=vi.fn(),onError=vi.fn(),onSettled=vi.fn();
 const begin=(options:{page?:number;pageSize?:number;target?:string}={})=>{
  stop=startBoardLiveUpdates({page:0,pageSize:20,onUpdate,onError,onSettled,...options});
 };
 beforeEach(()=>{
  vi.useFakeTimers();vi.clearAllMocks();
  vi.stubGlobal('document',Object.assign(new EventTarget(),{hidden:false}));
  vi.stubGlobal('window',new EventTarget());
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response(snapshot([]))));
 });
 afterEach(()=>{stop?.();vi.useRealTimers();vi.unstubAllGlobals()});
 it('loads immediately and automatically adds approved notes and removes hidden ones',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(response(snapshot([]))).mockResolvedValueOnce(response(snapshot())).mockResolvedValueOnce(response(snapshot([])));
  begin();await vi.advanceTimersByTimeAsync(0);
  expect(onUpdate).toHaveBeenLastCalledWith(snapshot([]));
  await vi.advanceTimersByTimeAsync(boardRefreshInterval-1);expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);expect(onUpdate).toHaveBeenLastCalledWith(snapshot());
  await vi.advanceTimersByTimeAsync(boardRefreshInterval);expect(onUpdate).toHaveBeenLastCalledWith(snapshot([]));
  expect(vi.mocked(fetch).mock.calls[1][1]?.cache).toBe('no-store');
 });
 it('keeps polling the current mobile page and updates pagination',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(response(snapshot([note],2,true))).mockResolvedValueOnce(response(snapshot([note],2,false)));
  begin({page:2,pageSize:10});await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval);
  expect(fetch).toHaveBeenLastCalledWith('/api/cards?limit=10&offset=20',expect.anything());
  expect(onUpdate).toHaveBeenLastCalledWith(snapshot([note],2,false));
 });
 it('resolves a shared note once and then refreshes its resolved page',async()=>{
  vi.mocked(fetch).mockResolvedValue(response(snapshot([note],3)));
  begin({target:note.id});await vi.advanceTimersByTimeAsync(0);
  expect(fetch).toHaveBeenLastCalledWith(`/api/cards?limit=20&offset=0&note=${note.id}`,expect.anything());
  await vi.advanceTimersByTimeAsync(boardRefreshInterval);
  expect(fetch).toHaveBeenLastCalledWith('/api/cards?limit=20&offset=60',expect.anything());
 });
 it('pauses in a hidden tab and refreshes immediately when visible or focused',async()=>{
  begin();await vi.advanceTimersByTimeAsync(0);
  Object.assign(document,{hidden:true});document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(boardRefreshInterval*4);expect(fetch).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event('focus'));await vi.advanceTimersByTimeAsync(0);expect(fetch).toHaveBeenCalledTimes(1);
  Object.assign(document,{hidden:false});document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(0);expect(fetch).toHaveBeenCalledTimes(2);
  window.dispatchEvent(new Event('focus'));await vi.advanceTimersByTimeAsync(0);expect(fetch).toHaveBeenCalledTimes(3);
 });
 it('deduplicates focus and visibility events during an active request',async()=>{
  let finish!:(value:Response)=>void;
  vi.mocked(fetch).mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
  begin();window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));
  expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval*2);expect(fetch).toHaveBeenCalledTimes(1);
  finish(response(snapshot()));await vi.advanceTimersByTimeAsync(0);
  expect(onUpdate).toHaveBeenCalledTimes(1);
 });
 it('retains the last good snapshot during failures, backs off, and recovers',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(response(snapshot())).mockRejectedValueOnce(Error('offline')).mockResolvedValue(response(snapshot([])));
  begin();await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval);
  expect(onError).not.toHaveBeenCalled();expect(onUpdate).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval);expect(fetch).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval);expect(onUpdate).toHaveBeenLastCalledWith(snapshot([]));
 });
 it('reports an initial server failure and retries automatically',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({error:'Tạm thời không kết nối được.'},{status:503})).mockResolvedValue(response(snapshot()));
  begin();await vi.advanceTimersByTimeAsync(0);
  expect(onError).toHaveBeenCalledWith('Tạm thời không kết nối được.');expect(onSettled).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval*2);expect(onUpdate).toHaveBeenCalledWith(snapshot());
 });
 it('times out a stalled fetch and retries',async()=>{
  vi.mocked(fetch).mockImplementationOnce((_url,options)=>new Promise((_resolve,reject)=>{
   options?.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));
  })).mockResolvedValue(response(snapshot()));
  begin();await vi.advanceTimersByTimeAsync(15_000);
  expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true);
  expect(onSettled).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(boardRefreshInterval*2);expect(onUpdate).toHaveBeenCalledWith(snapshot());
 });
 it('aborts abandoned requests and ignores late responses after page changes',async()=>{
  let finish!:(value:Response)=>void;
  vi.mocked(fetch).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
  begin();const signal=vi.mocked(fetch).mock.calls[0][1]?.signal;
  stop?.();expect(signal?.aborted).toBe(true);
  begin({page:1});await vi.advanceTimersByTimeAsync(0);
  finish(response(snapshot()));await vi.advanceTimersByTimeAsync(0);
  expect(onUpdate).toHaveBeenCalledTimes(1);expect(onUpdate).toHaveBeenCalledWith(snapshot([]));
 });
 it('removes timers and event listeners when leaving the board',async()=>{
  begin();await vi.advanceTimersByTimeAsync(0);stop?.();
  window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(60_000);expect(fetch).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
 });
});
