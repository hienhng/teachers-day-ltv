import type {Card} from './card-validation';

export const boardRefreshInterval=5_000;
export type BoardPage={cards:Card[];hasMore:boolean;page:number};

/** Refresh one board page without overlapping requests or updating an abandoned view. */
export function startBoardLiveUpdates({page,pageSize,target,onUpdate,onError,onSettled}:{
 page:number;pageSize:number;target?:string|null;
 onUpdate:(data:BoardPage)=>void;onError:(message:string)=>void;onSettled:()=>void;
}){
 let stopped=false,hasData=false,failures=0;
 let timer:ReturnType<typeof setTimeout>|undefined,active:AbortController|undefined;
 const refresh=async()=>{
  if(stopped||active)return;
  clearTimeout(timer);
  const controller=new AbortController();active=controller;
  const timeout=setTimeout(()=>controller.abort(),15_000);
  try{
   const query=new URLSearchParams({limit:String(pageSize),offset:String(page*pageSize)});
   if(target&&!hasData)query.set('note',target);
   const response=await fetch(`/api/cards?${query}`,{signal:controller.signal,cache:'no-store'});
   const data=await response.json() as BoardPage&{error?:string};
   if(stopped)return;
   if(!response.ok)throw Error(data.error||'Chưa thể kết nối bảng tri ân. Vui lòng thử lại sau.');
   page=data.page;hasData=true;failures=0;
   onUpdate(data);
  }catch(error){
   if(stopped)return;
   failures++;
   // A temporary outage must leave the last successful board visible.
   if(!hasData)onError(error instanceof Error?error.message:'Chưa thể kết nối bảng tri ân.');
  }finally{
   clearTimeout(timeout);active=undefined;
   if(!stopped){
    onSettled();
    if(!document.hidden)timer=setTimeout(refresh,Math.min(60_000,boardRefreshInterval*2**Math.min(failures,4)));
   }
  }
 };
 const resume=()=>{
  clearTimeout(timer);
  if(!document.hidden)void refresh();
 };
 document.addEventListener('visibilitychange',resume);
 window.addEventListener('focus',resume);
 void refresh();
 return()=>{
  stopped=true;clearTimeout(timer);active?.abort();
  document.removeEventListener('visibilitychange',resume);
  window.removeEventListener('focus',resume);
 };
}
