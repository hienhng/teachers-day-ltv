'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {moderationReasons, type ModerationRecord} from '../../lib/moderation-policy';
import {deadlineInput,deadlineIso,type SubmissionSettings} from '../../lib/submission-deadline';
import './admin.css';

type Submission = {id:string; recipient:string; message:string; sender:string; status:string; created_at?:string; moderation?:ModerationRecord};
const statusLabels:Record<string,string> = {pending:'Chờ duyệt', approved:'Đã duyệt', rejected:'Đã từ chối', all:'Tất cả'};
const sources = {filter:'Bộ lọc từ ngữ', ai:'Duyệt tự động', manual:'Quản trị viên', deadline:'Thời hạn nhận lời nhắn'};
const dateFormat = new Intl.DateTimeFormat('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});

export default function Admin() {
 const [cards,setCards] = useState<Submission[]>([]);
 const [error,setError] = useState('');
 const [notice,setNotice] = useState('');
 const [busy,setBusy] = useState('');
 const [loading,setLoading] = useState(true);
 const [offset,setOffset] = useState(0);
 const [hasMore,setHasMore] = useState(false);
 const [signedIn,setSignedIn] = useState(false);
 const [checkedSession,setCheckedSession] = useState(false);
 const [password,setPassword] = useState('');
 const [showPassword,setShowPassword] = useState(false);
 const [filter,setFilter] = useState('pending');
 const [search,setSearch] = useState('');
 const [automation,setAutomation] = useState({enabled:false,configured:false});
 const [settings,setSettings] = useState<SubmissionSettings>({rejectionEnabled:false,rejectAfter:null});
 const [rejectionEnabled,setRejectionEnabled] = useState(false);
 const [rejectAfter,setRejectAfter] = useState('');
 const settingsInitialized = useRef(false);
 const requestId = useRef(0);

 const load = useCallback(async(signal?:AbortSignal) => {
  const current = ++requestId.current;
  setLoading(true);
  try {
   const r = await fetch(`/api/admin?offset=${offset}&status=${filter}`, {signal});
   const d = await r.json();
   if (signal?.aborted || current !== requestId.current) return;
   if (r.status === 401) {setSignedIn(false); setCards([]); settingsInitialized.current=false; return;}
   if (!r.ok) throw Error(d.error || 'Không thể tải lời nhắn. Vui lòng thử lại.');
   setError(''); setSignedIn(true); setCards(d.cards); setHasMore(d.hasMore); setAutomation(d.automation);
   if (!settingsInitialized.current && d.settings) {
    setSettings(d.settings); setRejectionEnabled(d.settings.rejectionEnabled); setRejectAfter(deadlineInput(d.settings.rejectAfter)); settingsInitialized.current=true;
   }
   if (!d.cards.length && offset > 0) setOffset(Math.max(0,offset-25));
  } catch(e) {
   if (!signal?.aborted && current === requestId.current) setError((e as Error).message);
  } finally {
   if (!signal?.aborted && current === requestId.current) {setLoading(false); setCheckedSession(true);}
  }
 }, [offset,filter]);
 useEffect(() => {const controller = new AbortController(); void load(controller.signal); return () => controller.abort();}, [load]);

 async function login(e:React.FormEvent) {
  e.preventDefault(); setBusy('login'); setError(''); setNotice('');
  try {
   const r = await fetch('/api/admin/session', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
   const d = await r.json();
   if (!r.ok) throw Error(d.error || 'Không thể đăng nhập. Vui lòng thử lại.');
   setPassword(''); await load();
  } catch(e) {setError((e as Error).message);} finally {setBusy('');}
 }
 async function logout() {
  setBusy('logout'); setError('');
  try {
   const r = await fetch('/api/admin/session', {method:'DELETE'});
   if (!r.ok) throw Error('Không thể đăng xuất.');
   setSignedIn(false); setCards([]); setNotice(''); setSearch(''); setFilter('pending'); setOffset(0); settingsInitialized.current=false;
  } catch(e) {setError((e as Error).message);} finally {setBusy('');}
 }
 async function act(id:string, action:{status:string}|{action:'automate'}) {
  setBusy(id); setError(''); setNotice('');
  try {
   const r = await fetch('/api/admin', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...action})});
   const d = await r.json();
   if (r.status === 401) {setSignedIn(false); setCards([]); settingsInitialized.current=false; throw Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');}
   if (!r.ok) throw Error(d.error || 'Không thể cập nhật lời nhắn. Vui lòng thử lại.');
   setNotice('status' in action ? action.status === 'approved' ? 'Đã duyệt lời nhắn và hiển thị trên bảng chung.' : 'Đã từ chối lời nhắn và ẩn khỏi bảng chung.' : 'Đã đánh giá lại lời nhắn.');
   await load();
  } catch(e) {setError((e as Error).message);} finally {setBusy('');}
 }
 async function saveSettings(e:React.FormEvent) {
  e.preventDefault(); setError(''); setNotice('');
  const iso=rejectAfter ? deadlineIso(rejectAfter) : null;
  if ((rejectAfter && !iso) || (rejectionEnabled && !iso)) {setError('Vui lòng chọn ngày giờ hợp lệ (giờ Việt Nam).'); return;}
  setBusy('settings');
  try {
   const r=await fetch('/api/admin',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({rejectionEnabled,rejectAfter:iso})});
   const d=await r.json();
   if (r.status===401) {setSignedIn(false); setCards([]); settingsInitialized.current=false; throw Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');}
   if (!r.ok) throw Error(d.error || 'Không thể lưu cài đặt. Vui lòng thử lại.');
   setSettings(d.settings); setRejectionEnabled(d.settings.rejectionEnabled); setRejectAfter(deadlineInput(d.settings.rejectAfter));
   setNotice('Đã lưu cài đặt thời hạn nhận lời nhắn.');
  } catch(e) {setError((e as Error).message);} finally {setBusy('');}
 }
 const locked = !!busy || loading;
 const query = search.trim().toLocaleLowerCase('vi');
 const visibleCards = cards.filter(c => [c.recipient,c.sender,c.message].some(value => value.toLocaleLowerCase('vi').includes(query)));
 const autoReady = automation.enabled && automation.configured;

 return <main className="admin-shell">
  <header className="admin-topbar">
   <a className="admin-brand" href="/"><span className="admin-brand-mark" aria-hidden="true">✿</span><span>Trạm phát sóng yêu thương<small>KHÔNG GIAN QUẢN TRỊ · LTPC</small></span></a>
   {signedIn ? <button className="admin-button admin-quiet" disabled={locked} onClick={logout}>{busy === 'logout' ? 'Đang đăng xuất…' : 'Đăng xuất ↗'}</button> : <a className="admin-back" href="/">← Về trạm tri ân</a>}
  </header>
  <div className={`admin-content ${signedIn ? '' : 'admin-content-login'}`}>
   <div className="admin-heading"><div><span className="admin-eyebrow">GỬI NGƯỜI GIEO CHỮ · 20/11</span><h1>{signedIn ? 'Duyệt lời tri ân' : 'Gìn giữ những lời yêu thương.'}</h1><p>{signedIn ? 'Một chút quan tâm, để mỗi lời nhắn trên bảng chung đều thật đẹp.' : 'Chăm sóc và duyệt những lời nhắn gửi đến thầy cô.'}</p></div>{signedIn && <a className="admin-board-link" href="/">Ghé thăm trạm tri ân ↗</a>}</div>
   {error && <div className="admin-feedback admin-feedback-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Đóng thông báo lỗi">×</button></div>}
   {notice && signedIn && <div className="admin-feedback admin-feedback-success" role="status"><span>✓ {notice}</span><button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
   {!checkedSession ? <div className="admin-empty" role="status"><span className="admin-loader"/>Đang kiểm tra phiên đăng nhập…</div> : !signedIn ? <div className="admin-login-layout">
    <form className="admin-login" onSubmit={login} aria-busy={busy === 'login'}>
     <h2>Chào bạn, quản trị viên</h2><p>Đăng nhập để bắt đầu duyệt lời tri ân.</p>
     <label htmlFor="admin-password">Mật khẩu quản trị</label><div className="admin-password"><input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu của bạn" required maxLength={200} value={password} disabled={!!busy} onChange={e => setPassword(e.target.value)}/><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></div>
     <button className="admin-button admin-primary admin-login-submit" disabled={locked}>{busy === 'login' ? 'Đang đăng nhập…' : 'Vào không gian quản trị →'}</button>
     <small>Chỉ dành cho quản trị viên.</small>
    </form>
    <aside className="admin-login-note"><span className="admin-eyebrow">MỖI LỜI NHẮN LÀ MỘT MÓN QUÀ</span><div className="admin-note-flower" aria-hidden="true">✿</div><h2>Trạm phát sóng<br/>yêu thương</h2><span className="admin-note-signature">Một dự án của LTPC</span></aside>
   </div> : <>
    <section className={`admin-automation ${autoReady ? 'is-ready' : ''}`} aria-label="Trạng thái duyệt tự động"><div><h2>Duyệt tự động<span className="admin-auto-pill">{autoReady ? 'Đang hoạt động' : 'Duyệt thủ công'}</span></h2><p>{!automation.enabled ? 'Duyệt tự động đang tắt. Lời nhắn mới sẽ chờ bạn xem xét.' : !automation.configured ? 'Chưa cấu hình kết nối AI. Lời nhắn mới sẽ chờ bạn xem xét.' : 'AI hỗ trợ duyệt nội dung phù hợp. Bạn luôn có thể thay đổi quyết định.'}</p></div></section>
    <section className="admin-settings" aria-labelledby="admin-settings-title">
     <div className="admin-settings-heading"><div><span className="admin-eyebrow">CÀI ĐẶT NHẬN LỜI NHẮN</span><h2 id="admin-settings-title">Thời hạn nhận lời tri ân</h2></div><span className="admin-auto-pill">{settings.rejectionEnabled?'Đã bật':'Đang tắt'}</span></div>
     <p>Lời nhắn mới được gửi từ thời hạn đã chọn sẽ tự động bị từ chối, trước khi AI đánh giá. Các lời nhắn đã có giữ nguyên trạng thái; bạn vẫn có thể duyệt lại thủ công.</p>
     <form onSubmit={saveSettings}>
      <label className="admin-settings-toggle"><input type="checkbox" checked={rejectionEnabled} disabled={locked} onChange={e=>setRejectionEnabled(e.target.checked)}/><span>Tự động từ chối sau thời hạn</span></label>
      <div className="admin-settings-fields"><label htmlFor="admin-deadline">Từ ngày và giờ (Việt Nam · UTC+7)<input id="admin-deadline" type="datetime-local" value={rejectAfter} required={rejectionEnabled} disabled={locked} onChange={e=>setRejectAfter(e.target.value)} aria-describedby="admin-deadline-help"/></label><button className="admin-button admin-primary" disabled={locked}>{busy==='settings'?'Đang lưu…':'Lưu cài đặt'}</button></div>
      <p id="admin-deadline-help" className="admin-settings-help">{settings.rejectionEnabled&&settings.rejectAfter?`Đã lưu: tự động từ chối từ ${new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(settings.rejectAfter))} (UTC+7).`:'Đã lưu: không áp dụng thời hạn tự động từ chối.'} Thay đổi chỉ có hiệu lực sau khi lưu.</p>
     </form>
    </section>
    <section className="admin-queue" aria-label="Danh sách lời tri ân">
     <div className="admin-toolbar"><div className="admin-filters" role="group" aria-label="Lọc theo trạng thái">{Object.entries(statusLabels).map(([value,label]) => <button key={value} aria-pressed={filter === value} disabled={locked} onClick={() => {setFilter(value); setOffset(0); setSearch(''); setNotice(''); setError('');}}>{label}</button>)}</div><button className="admin-button admin-refresh" disabled={locked} onClick={() => void load()}><span aria-hidden="true">↻</span> {loading ? 'Đang tải…' : 'Làm mới'}</button></div>
     <div className="admin-list-heading"><div><h2>{statusLabels[filter]}</h2><p>{loading ? 'Đang tải lời nhắn…' : `${visibleCards.length}${query ? ` / ${cards.length}` : ''} lời nhắn trên trang ${offset/25+1}`}</p></div><label className="admin-search"><span className="admin-sr-only">Tìm lời nhắn trên trang hiện tại</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Tìm trong trang này…" value={search} onChange={e => setSearch(e.target.value)} disabled={locked}/></label></div>
     <div className="admin-card-list" aria-busy={loading}>
      {loading ? <div className="admin-empty" role="status"><span className="admin-loader"/>Đang tải những lời yêu thương…</div> : !visibleCards.length ? <div className="admin-empty"><span className="admin-empty-icon" aria-hidden="true">{query ? '⌕' : '✿'}</span><h3>{query ? 'Chưa tìm thấy lời nhắn' : filter === 'pending' ? 'Bạn đã xem hết lời nhắn rồi!' : 'Chưa có lời nhắn ở đây'}</h3><p>{query ? 'Thử tên người gửi, người nhận hoặc một từ trong lời nhắn.' : filter === 'pending' ? 'Những lời tri ân mới cần duyệt sẽ xuất hiện tại đây.' : 'Chọn trạng thái khác hoặc làm mới để kiểm tra lại.'}</p>{query && <button className="admin-button" onClick={() => setSearch('')}>Xóa tìm kiếm</button>}</div> : visibleCards.map(c => <article className="admin-card" key={c.id} aria-busy={busy === c.id}>
       <div className="admin-card-top"><span className={`admin-status admin-status-${c.status}`}><span aria-hidden="true"/>{statusLabels[c.status] || c.status}</span>{c.created_at && !Number.isNaN(Date.parse(c.created_at)) && <time dateTime={c.created_at}>{dateFormat.format(new Date(c.created_at))}</time>}</div>
       <div className="admin-letter"><span className="admin-letter-label">LỜI NHẮN GỬI ĐẾN</span><h3>{c.recipient}</h3><p className="admin-message">{c.message}</p><p className="admin-sender"><span aria-hidden="true">↳</span> Từ <strong>{c.sender || 'Ẩn danh'}</strong></p></div>
       <div className="admin-review"><span className="admin-review-label">{c.moderation?.source ? sources[c.moderation.source] : 'Chưa đánh giá'}</span><p>{c.moderation?.reason ? moderationReasons[c.moderation.reason] || 'Cần xem xét thủ công.' : 'Hãy đọc lời nhắn và chọn quyết định phù hợp.'}</p>{c.moderation?.model && <details><summary>Chi tiết đánh giá AI</summary><small>{c.moderation.model}{typeof c.moderation.confidence === 'number' ? ` · Độ chắc chắn AI tự đánh giá: ${Math.round(c.moderation.confidence*100)}%` : ''}</small></details>}</div>
       <div className="admin-card-actions"><span className="admin-processing" role="status">{busy === c.id ? 'Đang xử lý lời nhắn…' : ''}</span><div>{c.status === 'pending' && <button className="admin-button admin-ai-button" disabled={locked || !autoReady} title={!autoReady ? 'Cần bật và cấu hình AI để sử dụng' : undefined} onClick={() => act(c.id,{action:'automate'})}>Thử duyệt tự động</button>}<button className="admin-button admin-reject" disabled={locked || c.status === 'rejected'} onClick={() => act(c.id,{status:'rejected'})}>Ẩn / từ chối</button><button className="admin-button admin-primary" disabled={locked || c.status === 'approved'} onClick={() => act(c.id,{status:'approved'})}>✓ {c.status === 'rejected' ? 'Khôi phục / duyệt' : 'Duyệt lời nhắn'}</button></div></div>
      </article>)}
     </div>
     <div className="admin-pagination"><span>Mỗi trang tối đa 25 lời nhắn</span><div><button className="admin-button" disabled={!offset || locked} onClick={() => {setOffset(Math.max(0,offset-25)); setSearch(''); setNotice('');}}>← Trước</button><span>Trang {offset/25+1}</span><button className="admin-button" disabled={!hasMore || locked} onClick={() => {setOffset(offset+25); setSearch(''); setNotice('');}}>Tiếp →</button></div></div>
    </section>
   </>}
   <div className="admin-footer"><span>Được phát triển bởi LTV Programming Club.</span></div>
  </div>
 </main>;
}
