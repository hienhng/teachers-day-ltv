'use client';
import {useCallback,useEffect,useState} from 'react';
import {moderationReasons,type ModerationRecord} from '../../lib/moderation-policy';

type Submission={id:string;recipient:string;message:string;sender:string;status:string;moderation?:ModerationRecord};
const statusLabels:Record<string,string>={pending:'Chờ duyệt',approved:'Đã duyệt',rejected:'Đã từ chối'};
export default function Admin(){
 const[cards,setCards]=useState<Submission[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(''),[offset,setOffset]=useState(0),[hasMore,setHasMore]=useState(false),[signedIn,setSignedIn]=useState(false),[password,setPassword]=useState('');
 const[filter,setFilter]=useState('pending'),[automation,setAutomation]=useState({enabled:false,configured:false});
 const load=useCallback(async(signal?:AbortSignal)=>{
  try{
   const r=await fetch(`/api/admin?offset=${offset}&status=${filter}`,{signal}),d=await r.json();
   if(r.status===401){setSignedIn(false);return}
   if(!r.ok)throw Error(d.error);
   setError('');setSignedIn(true);setCards(d.cards);setHasMore(d.hasMore);setAutomation(d.automation);
  }catch(e){if(!signal?.aborted)setError((e as Error).message)}
 },[offset,filter]);
 useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
 async function login(e:React.FormEvent){e.preventDefault();setBusy('login');setError('');try{const r=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}),d=await r.json();if(!r.ok)throw Error(d.error);setPassword('');await load()}catch(e){setError((e as Error).message)}finally{setBusy('')}}
 async function logout(){setError('');try{const r=await fetch('/api/admin/session',{method:'DELETE'});if(!r.ok)throw Error('Không thể đăng xuất.');setSignedIn(false);setCards([])}catch(e){setError((e as Error).message)}}
 async function act(id:string,action:{status:string}|{action:'automate'}){
  setBusy(id);setError('');
  try{const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...action})}),d=await r.json();if(!r.ok)throw Error(d.error);await load()}
  catch(e){setError((e as Error).message)}finally{setBusy('')}
 }
 return <main className="admin">
  <a href="/">← Về trạm tri ân</a><h1>Duyệt lời tri ân</h1>
  <p>Lời nhắn rõ ràng, phù hợp sẽ được AI duyệt tự động. Những trường hợp chưa chắc chắn cần LTPC xem xét.</p>
  {error&&<p role="alert">{error}</p>}
  {!signedIn?<form className="panel" onSubmit={login}>
   <h2>Đăng nhập quản trị LTPC</h2><label>Mật khẩu quản trị<input type="password" autoComplete="current-password" required maxLength={200} value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <button className="pixel-button primary" style={{marginTop:20}} disabled={!!busy}>{busy?'Đang đăng nhập…':'Đăng nhập'}</button>
  </form>:<>
   <button className="text-link" disabled={!!busy} onClick={logout}>Đăng xuất</button>
   <p role="status">{!automation.enabled?'Duyệt tự động đang tắt. Các lời nhắn mới sẽ chờ duyệt thủ công.':!automation.configured?'Chưa cấu hình kết nối AI. Các lời nhắn mới sẽ chờ duyệt thủ công.':'Duyệt tự động đang bật. Bạn có thể thay đổi mọi quyết định bên dưới.'}</p>
   <label>Lọc lời nhắn<select value={filter} disabled={!!busy} onChange={e=>{setFilter(e.target.value);setOffset(0);setError('')}}>
    <option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Đã từ chối</option><option value="all">Tất cả</option>
   </select></label>
   <button className="text-link" disabled={!!busy} onClick={()=>void load()}>Làm mới</button>
   {!cards.length&&<p>Không có lời nhắn ở trang này.</p>}
   {cards.map(c=><article className="panel" key={c.id} aria-busy={busy===c.id}>
    <small>{statusLabels[c.status]||c.status} · {c.moderation?.source==='filter'?'Bộ lọc từ ngữ':c.moderation?.source==='ai'?'Tự động':c.moderation?.source==='manual'?'Quản trị viên':'Chưa đánh giá'}</small>
    <h2>Gửi {c.recipient}</h2><p style={{whiteSpace:'pre-wrap'}}>{c.message}</p><p>Từ: {c.sender||'Ẩn danh'}</p>
    {c.moderation?.reason&&<p>{moderationReasons[c.moderation.reason]||'Cần xem xét thủ công.'}</p>}
    {c.moderation?.model&&<small>{c.moderation.model}{typeof c.moderation.confidence==='number'?` · Độ chắc chắn AI tự đánh giá: ${Math.round(c.moderation.confidence*100)}%`:''}</small>}
    <div className="form-actions">
     <button disabled={!!busy||c.status==='approved'} onClick={()=>act(c.id,{status:'approved'})}>{c.status==='rejected'?'Khôi phục / duyệt':'Duyệt'}</button>
     <button disabled={!!busy||c.status==='rejected'} onClick={()=>act(c.id,{status:'rejected'})}>Ẩn / từ chối</button>
     {c.status==='pending'&&<button disabled={!!busy||!automation.enabled||!automation.configured} onClick={()=>act(c.id,{action:'automate'})}>{busy===c.id?'Đang xử lý…':'Thử duyệt tự động'}</button>}
    </div>
   </article>)}
   <div className="garden-controls"><button disabled={!offset||!!busy} onClick={()=>setOffset(Math.max(0,offset-25))}>← Trước</button><span>Trang {offset/25+1}</span><button disabled={!hasMore||!!busy} onClick={()=>setOffset(offset+25)}>Tiếp →</button></div>
  </>}
 </main>;
}
