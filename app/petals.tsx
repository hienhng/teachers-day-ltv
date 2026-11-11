'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {createLetterQR} from '../lib/letter-qr';
import {NoteIcon,StickyNote} from './sticky-note';
import {ScatteredNotes} from './scattered-notes';
import {Homepage} from './homepage';
import './community-board.css';
import {SiteNavigation} from './site-navigation';
import {ReceivedLetter} from './received-letter';
import {MakerPanel} from './maker-panel';
import {DoodleArt} from './doodle-art';
import {type Decoration,type Card} from '../lib/card-validation';
import {type ModerationStatus} from '../lib/moderation-policy';
const blank:Card={flower:'tulip',theme:'meadow',recipient:'',message:'',sender:'',anonymous:false,shareSender:true,decorations:[]};
type NoteOpenOrigin={left:number;top:number;width:number;height:number;rotation:number};
function boardNoteOrigin(source:HTMLButtonElement):NoteOpenOrigin{
 const rect=(source.querySelector<HTMLElement>('.sticky-note')||source).getBoundingClientRect();
 return {left:rect.left,top:rect.top,width:rect.width,height:rect.height,rotation:parseFloat(source.style.getPropertyValue('--note-rotation'))||0};
}
function boardNoteTransform(note:HTMLElement,origin:NoteOpenOrigin){
 const frame=note.parentElement!.getBoundingClientRect();
 const dx=origin.left+origin.width/2-frame.left-frame.width/2;
 const dy=origin.top+origin.height/2-frame.top-frame.height/2;
 const scale=Math.min(origin.width/note.offsetWidth,origin.height/note.offsetHeight);
 return `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(${scale}) rotate(${origin.rotation}deg)`;
}
function CardPreview({card,id,fitToViewport=false,fitToFrame=!fitToViewport,origin}:{card:Card;id?:string;fitToViewport?:boolean;fitToFrame?:boolean;origin?:NoteOpenOrigin|null}){
 const viewport=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const frame=viewport.current,note=frame?.querySelector<HTMLElement>('.sticky-note');
  if(!(fitToViewport||fitToFrame)||!frame||!note)return;
  let opened=false,previousScale=0;
  let opening:Animation|undefined;
  const fit=()=>{
   if(!note.offsetWidth||!note.offsetHeight||!frame.clientWidth||!frame.clientHeight)return;
   // Leave room around the paper for its tape, stickers and shadow.
   const scale=Math.min(1,frame.clientWidth/(note.offsetWidth*1.2),frame.clientHeight/(note.offsetHeight*1.2));
   frame.style.setProperty(fitToFrame?'--note-preview-scale':'--note-dialog-scale',String(scale));
   if(opening&&scale!==previousScale)opening.cancel();
   previousScale=scale;
   if(opened||!note.closest('dialog')?.open)return;
   opened=true;
   if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   opening=note.animate([
    {transform:origin?boardNoteTransform(note,origin):`translate(-50%,-50%) scale(${scale*.82}) rotate(0deg)`,opacity:1},
    {transform:`translate(-50%,-50%) scale(${scale}) rotate(0deg)`,opacity:1},
   ],{duration:420,easing:'cubic-bezier(.2,.75,.25,1)'});
  };
  fit();
  const observer=new ResizeObserver(fit);
  observer.observe(frame);observer.observe(note);
  return()=>{observer.disconnect();opening?.cancel()};
 },[fitToViewport,fitToFrame,origin]);
 return <div ref={viewport} className={`note-viewport${fitToFrame?' note-viewport-fitted':''}`}><StickyNote card={card} id={id}/></div>;
}
export default function Petals({initialView='home'}:{initialView?:'home'|'garden'}){
 const router=useRouter();
 const[view,setView]=useState<string>(initialView),[step,setStep]=useState(1),[card,setCard]=useState<Card>(blank),[saved,setSaved]=useState<Card|null>(null),[busy,setBusy]=useState(false),[bloom,setBloom]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[garden,setGarden]=useState<Card[]>([]),[gardenPage,setGardenPage]=useState(0),[gardenPageSize,setGardenPageSize]=useState(20),[gardenHasMore,setGardenHasMore]=useState(false),[loading,setLoading]=useState(false),[selected,setSelected]=useState<Card|null>(null),[qr,setQr]=useState(''),[png,setPng]=useState('');
 const[moderationStatus,setModerationStatus]=useState<ModerationStatus>('pending');
 const[deadlineRejected,setDeadlineRejected]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),preview=useRef<HTMLDivElement>(null),resultHeading=useRef<HTMLHeadingElement>(null),audio=useRef<AudioContext|null>(null);
 const selectedOrigin=useRef<NoteOpenOrigin|null>(null);
 const selectedSource=useRef<HTMLButtonElement|null>(null),returning=useRef<Animation|null>(null);
 const [closing,setClosing]=useState(false);
 function openBoardNote(note:Card,source:HTMLButtonElement){
  selectedOrigin.current=boardNoteOrigin(source);
  selectedSource.current=source;
  setSelected(note);
 }
 function closeBoardNote(){
  if(returning.current)return;
  const paper=dialog.current?.querySelector<HTMLElement>('.sticky-note'),source=selectedSource.current;
  const finish=()=>{returning.current=null;setSelected(null);setClosing(false);selectedSource.current=null;selectedOrigin.current=null};
  if(!paper||!source?.isConnected||window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return}
  const currentTransform=getComputedStyle(paper).transform;
  paper.getAnimations().forEach(animation=>animation.cancel());
  const animation=paper.animate([
   {transform:currentTransform,opacity:1},
   {transform:boardNoteTransform(paper,boardNoteOrigin(source)),opacity:1},
  ],{duration:340,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'});
  returning.current=animation;
  setClosing(true);
  void animation.finished.then(finish,finish);
 }
 function ping(){try{audio.current??=new AudioContext();const a=audio.current;if(a.state==='suspended')void a.resume().catch(()=>{});const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(660,a.currentTime);o.frequency.exponentialRampToValueAtTime(880,a.currentTime+.12);g.gain.setValueAtTime(.035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.2);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.2)}catch{}}
 function clearMakerDraft(){
  setCard(blank);setSaved(null);setStep(1);setModerationStatus('pending');
  setQr('');setPng('');setBloom(false);
 }
 function navigate(v:string){if(view==='maker'&&v!=='maker')clearMakerDraft();ping();if(v==='garden'){router.push('/board');return}if(initialView==='garden'){router.push('/');return}if(location.search)history.replaceState(null,'','/');setView(v);setError('');setNotice('');window.scrollTo({top:0,behavior:'instant'});}
 function go(v:string){navigate(v)}
 function showEvent(){ping();if(view!=='home'){navigate('home');window.setTimeout(()=>document.getElementById('event')?.scrollIntoView({behavior:'smooth',block:'start'}),0);return}document.getElementById('event')?.scrollIntoView({behavior:'smooth',block:'start'});}
 function create(){clearMakerDraft();navigate('maker')}
 useEffect(()=>{if(initialView!=='home')return;const id=new URLSearchParams(location.search).get('card');if(id){setView('received');setLoading(true);fetch(`/api/cards?id=${encodeURIComponent(id)}`).then(async r=>{const d=await r.json() as {error:string;card:Card;cards:Card[];hasMore:boolean;editToken:string};if(!r.ok)throw Error(d.error);setSaved(d.card)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))}},[initialView]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(t)},[notice]);
 useEffect(()=>{if(selected)dialog.current?.showModal();else dialog.current?.close()},[selected]);
 useEffect(()=>{if(step>=5&&!bloom)resultHeading.current?.focus({preventScroll:true})},[step,bloom]);
 useEffect(()=>{const media=window.matchMedia('(max-width: 700px)');const updatePageSize=()=>{setGardenPageSize(media.matches?10:20);setGardenPage(0)};updatePageSize();media.addEventListener('change',updatePageSize);return()=>media.removeEventListener('change',updatePageSize)},[]);
 useEffect(()=>{if(view!=='garden')return;const controller=new AbortController();setLoading(true);setError('');fetch(`/api/cards?limit=${gardenPageSize}&offset=${gardenPage*gardenPageSize}`,{signal:controller.signal}).then(async r=>{const d=await r.json() as {error:string;cards:Card[];hasMore:boolean};if(!r.ok)throw Error(d.error);setGarden(d.cards);setGardenHasMore(d.hasMore)}).catch(e=>{if(!controller.signal.aborted)setError((e as Error).message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[view,gardenPage,gardenPageSize]);
 const update=(key:keyof Card,value:string|boolean|Decoration[])=>setCard(c=>({...c,[key]:value}));
 function changeStep(nextStep:number){setError('');setStep(nextStep);window.scrollTo({top:0,behavior:'instant'});}
 async function makeBloom(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...card,shareSender:!card.anonymous})}),d=await r.json() as {error:string;card:Card;cards:Card[];hasMore:boolean;editToken:string;moderationStatus:ModerationStatus;moderationReason?:string};if(!r.ok)throw Error(d.error||'Không thể lưu thiệp. Vui lòng thử lại.');setSaved(d.card);setModerationStatus(d.moderationStatus||'pending');setDeadlineRejected(d.moderationReason==='submission_deadline');changeStep(5);ping()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const canShare=Boolean(saved)&&moderationStatus!=='rejected';
 function finishGarden(){if(!canShare)return;setBloom(true);changeStep(6);ping();setTimeout(()=>setBloom(false),matchMedia('(prefers-reduced-motion: reduce)').matches?0:900)}
 const shareUrl=()=>`${location.origin}/?card=${saved?.id}`;
 async function copy(){if(!canShare)return;try{await navigator.clipboard.writeText(shareUrl());setNotice('Đã sao chép đường dẫn. Gửi lời cảm ơn đến thầy cô nhé!')}catch{setNotice('Hãy sao chép đường dẫn trong ô bên dưới.')}}
 function download(url:string,name:string){const a=document.createElement('a');a.href=url;a.download=name;a.click()}
 async function getQR(){if(!saved||!canShare)return;try{const canvas=await createLetterQR(saved,shareUrl()),url=canvas.toDataURL('image/png');setQr(url);download(url,'tram-tri-an-qr.png')}catch{setError('Chưa tạo được mã QR. Vui lòng thử lại.')}}
 async function exportPNG(){
  if(!saved||!canShare||!preview.current)return;
  setBusy(true);try{
   const {createLetterPNG}=await import('../lib/export-letter');
   const pngUrl=await createLetterPNG(saved,preview.current);
   setPng(pngUrl);download(pngUrl,'tram-tri-an-20-11.png');setNotice('Thiệp đã sẵn sàng trong tệp tải xuống.');
  }catch{setError('Không thể tải ảnh. Vui lòng thử lại.')}finally{setBusy(false)}
 }
 return <>
 {view!=='garden'&&view!=='received'&&<SiteNavigation view={view} onNavigate={go} onCreate={create} onEvent={showEvent}/>}
 {view==='home'?<Homepage onCreate={create} onGarden={()=>go('garden')} onButterfly={()=>setNotice('Có những người lặng lẽ viết nên tương lai của chúng mình. Cảm ơn thầy cô! ♡')}/>:view==='maker'?<main className="maker page-wrap inline-maker">
  {step<5?<MakerPanel card={card} busy={busy} onChange={update} onSubmit={makeBloom} onSelect={ping}/>
  :bloom?<div className="bloom-stage" role="status"><NoteIcon/><h2>Đang chuẩn bị tấm thiệp của bạn…</h2></div>
  :saved&&<div className={`result-columns${moderationStatus==='rejected'?' result-rejected':''}`}>{moderationStatus!=='rejected'&&<div ref={preview}><CardPreview card={saved}/></div>}
   {step===5||!canShare?<section className="panel garden-step" aria-labelledby="garden-step-title">
    <h2 id="garden-step-title" ref={resultHeading} tabIndex={-1}>Cảm ơn bạn đã gửi yêu thương!</h2>
    <p className="success" role="status">{deadlineRejected?'Thời hạn nhận lời tri ân đã kết thúc. Lời nhắn của bạn không được đăng lên bảng chung.':moderationStatus==='approved'?'Lời nhắn đã được duyệt và hiển thị trên bảng tri ân.':moderationStatus==='rejected'?'Lời nhắn chưa được chấp nhận lên bảng tri ân. Bạn có thể viết lại lời nhắn phù hợp.':'Lời nhắn đã được gửi và đang chờ LTPC xem xét.'}</p>
    <p>{deadlineRejected?'Cảm ơn bạn đã quan tâm và gửi yêu thương đến thầy cô.':moderationStatus==='rejected'?'Cảm ơn bạn đã cùng giữ bảng tri ân thân thiện với mọi người.':'Chỉ lời nhắn đã được duyệt mới hiển thị công khai trên bảng tri ân.'}</p>
    <div className="form-actions">{deadlineRejected?<button type="button" className="pixel-button primary" onClick={()=>go('home')}>Về trạm tri ân →</button>:canShare?<button type="button" className="pixel-button primary" onClick={finishGarden}>Tiếp tục chia sẻ tấm thiệp →</button>:<button type="button" className="pixel-button primary" onClick={()=>{setCard(c=>({...c,message:''}));setSaved(null);setQr('');setPng('');setModerationStatus('pending');changeStep(1)}}>Viết lại lời nhắn →</button>}</div>
   </section>:<section className="panel" aria-labelledby="send-step-title">
    <h2 id="send-step-title" ref={resultHeading} tabIndex={-1}>Mang lời cảm ơn đến thầy cô.</h2><p>Gửi đường dẫn, chia sẻ mã QR, hoặc lưu lại tấm thiệp của bạn.</p>
    <div className="share-actions"><button className="pixel-button primary" onClick={copy}>Sao chép đường dẫn ↗</button><button className="pixel-button secondary" onClick={getQR}>Tải mã QR</button><button className="pixel-button secondary" disabled={busy} onClick={exportPNG}>Tải thiệp PNG ↓</button></div><label className="share-url">Đường dẫn thiệp<input readOnly value={shareUrl()} onFocus={e=>e.target.select()}/></label>
    {qr&&<a href={qr} download="tram-tri-an-qr.png" className="export-preview"><img className="qr" src={qr} alt="Mã QR mở tấm thiệp"/><span>Lưu ảnh QR ↓</span></a>}{png&&<a href={png} download="tram-tri-an-20-11.png" className="export-preview"><img src={png} alt="Ảnh thiệp đã xuất"/><span>Lưu ảnh thiệp ↓</span></a>}
    <div className="form-actions"><button type="button" className="text-link" disabled={busy} onClick={()=>changeStep(5)}>← Xem xác nhận gửi lời nhắn</button><button className="text-link" disabled={busy} onClick={create}>+ Viết thêm một lời nhắn</button></div>
   </section>}
  </div>}
 </main>:view==='garden'?<main className="classroom-community">
  <section className="community-chalkboard" aria-label="Bảng những lời tri ân đã được duyệt" aria-busy={loading}>
   <span className="chalk-hero-logo board-logo" role="img" aria-label="Logo LTPC"/>
   <div className="board-chalk-decorations" aria-hidden="true">
    <svg className="board-chalk-garland" viewBox="0 0 540 85" fill="none" focusable="false">
     <path d="M4 7Q255 104 536 9"/>
     <g className="chalk-butter"><path d="m40 20 9 34 25-23Z"/><path d="m247 55 17 28 18-28Z"/><path d="m464 30 25 23 9-34Z"/></g>
     <g className="chalk-rose"><path d="m106 40 13 31 22-24Z"/><path d="m320 51 21 25 14-30Z"/></g>
     <g className="chalk-sage"><path d="m176 52 15 30 21-27Z"/><path d="m392 43 22 24 13-32Z"/></g>
     <path d="m14 38 2 10m-7-4 12-2m496-1 2 12m-7-5 12-2"/>
    </svg>
    <svg className="board-chalk-stars" viewBox="0 0 200 65" fill="none" focusable="false">
     <path className="chalk-butter" d="m23 8 5 17 17 5-17 6-5 18-5-18-16-6 16-5 5-17Zm122 8 3 10 11 4-11 4-3 11-4-11-11-4 11-4 4-10Z"/>
     <path className="chalk-rose" d="M69 32c6-13 18-13 24-1 7-13 21-9 21 3 0 13-21 23-21 23S66 46 69 32Z"/>
     <path d="m177 13 1 9m-5-5 10-1M49 51l7 2m109 1 4-4"/>
    </svg>
    <svg className="board-chalk-sprig" viewBox="0 0 84 240" fill="none" focusable="false">
     <path d="M30 230C14 159 65 94 43 12M29 197C4 185 7 163 10 157c19 9 24 24 19 40Zm1-30c29-5 40-23 38-36-23 5-34 18-38 36Zm7-35C11 123 9 103 13 92c20 6 27 21 24 40Zm7-31c26-9 32-27 27-38-20 8-28 22-27 38Zm1-36C24 57 21 40 26 30c17 7 22 19 19 35Z"/>
     <path className="chalk-butter" d="m17 16 1 10m-6-5 10-1m48 175 1 9m-5-4 9-1"/>
    </svg>
    <svg className="board-chalk-sketch" viewBox="0 0 270 180" fill="none" focusable="false">
     <g className="chalk-sage"><path d="M90 147c-22-15-47-15-72-12l5-69c25-3 48 4 69 18 21-15 45-18 70-12l-3 68c-25-5-47-5-69 7Zm2-63-2 63M34 82c14 0 28 4 42 11m-43 4c15 0 28 4 42 11m-43 4c14 0 28 4 41 10m34-27c13-7 26-9 40-6m-40 21c13-7 26-8 39-5m-40 20c13-6 24-7 39-4M18 141l-2 7c29-2 53 2 74 11 23-9 46-11 70-6l2-7M215 153c-5-27-4-53 2-77m-3 47c-17 1-29-12-27-22 16 0 23 10 27 22Zm2-20c18 0 29-12 26-22-14 1-22 10-26 22Z"/></g>
     <path className="chalk-rose" d="M206 42c-18-17-27 13-10 18-22 3-7 30 9 16 0 23 29 13 21-4 19 14 34-13 14-20 23-6 4-29-11-15 7-22-22-26-23 5Z"/>
     <path className="chalk-butter" d="M208 53c-1-14 18-17 21-4 4 16-19 19-21 4Zm-31-34 1 10m-6-5 11-1m-16 144 6-6m62-16 7 5m-3-13 8-2"/>
    </svg>
   </div>
   <div className="board-content" role="region" aria-label="Những lời nhắn trên bảng" tabIndex={0}>
      {!garden.length&&!loading&&!error&&<p className="board-empty-message">Chiếc bảng đang đợi lời cảm ơn đầu tiên.</p>}
      {loading&&<p className="board-loading" role="status">Đang mở bảng tri ân…</p>}
      {error&&<p className="board-unavailable" role="status">Chưa thể tải lời nhắn. Bạn có thể thử mở lại bảng sau.</p>}
    <ScatteredNotes cards={garden} onSelect={openBoardNote} openedCardId={selected?.id} paused={loading||Boolean(error)} showGreeting/>
   </div>
   <div className="board-footer">
    <button className="board-exit" onClick={()=>go('home')} aria-label="Trở về trang chủ" title="Trở về trang chủ">←</button>
    {(gardenPage>0||gardenHasMore)&&<nav className="board-pagination" aria-label="Các trang bảng tri ân"><button className="board-link" disabled={gardenPage<=0||loading} onClick={()=>setGardenPage(page=>Math.max(0,page-1))}>← Trang trước</button><span aria-live="polite">Trang {gardenPage+1}</span><button className="board-link" disabled={!gardenHasMore||loading} onClick={()=>setGardenPage(page=>page+1)}>Trang tiếp →</button></nav>}
    <p className="privacy-note board-privacy">Chỉ hiển thị lời nhắn đã được LTPC duyệt.</p>
   </div>
   <div className="community-tray" aria-hidden="true"><i/><i/><i/><b/></div>
  </section>
 </main>:<main className="received page-wrap"><div className="section-heading"><span className="eyebrow">MỘT LỜI TRI ÂN DÀNH RIÊNG CHO THẦY CÔ</span><h1>Một tờ note, từ một tấm lòng.</h1></div>{loading?<p role="status">Đang mở tấm thiệp…</p>:saved&&<ReceivedLetter key={saved.id} recipient={saved.recipient} note={<div ref={preview}><CardPreview card={saved}/></div>} actions={<><button className="pixel-button secondary" disabled={busy} onClick={exportPNG}>Lưu ảnh tấm thiệp</button>{png&&<a href={png} download="tram-tri-an-20-11.png" className="export-preview"><img src={png} alt="Ảnh thiệp đã xuất"/><span>Lưu ảnh thiệp ↓</span></a>}<button className="text-link" onClick={create}>Viết một lời tri ân khác →</button></>}/>}</main>}
 {error&&<div className="error" role="alert">{error}<button aria-label="Đóng thông báo" onClick={()=>setError('')}>×</button></div>}{notice&&<div className="toast" role="status">✎ {notice}</div>}<dialog ref={dialog} aria-label="Lời nhắn trên bảng tri ân" className="card-dialog" data-closing={closing||undefined} onCancel={event=>{event.preventDefault();closeBoardNote()}} onClick={e=>{if(e.target===dialog.current)closeBoardNote()}}><button className="close-modal" onClick={closeBoardNote} aria-label="Đóng lời chúc">×</button>{selected&&<CardPreview fitToViewport origin={selectedOrigin.current} card={{...selected,sender:selected.sender||'Một người học trò'}}/>}</dialog></>
}
