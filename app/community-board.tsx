import type {Card} from '../lib/card-validation';
import {DoodleArt} from './doodle-art';
import {NoteIcon} from './sticky-note';
import {ScatteredNotes} from './scattered-notes';
import './chalkboard-hero.css';

type CommunityBoardProps = {
 cards: Card[];
 loading: boolean;
 error: string;
 page: number;
 hasMore: boolean;
 showIntro: boolean;
 onCreate: () => void;
 onSelect: (card: Card) => void;
 onPage: (page: number) => void;
 onRetry: () => void;
};

export function CommunityBoard({cards,loading,error,page,hasMore,showIntro,onCreate,onSelect,onPage,onRetry}:CommunityBoardProps){
 return <section className="community-chalkboard fullscreen-board" aria-labelledby="live-board-title">
  <div className="board-page-heading">
   <div><p className="edition-label">20/11 · NHỮNG LỜI CẢM ƠN Ở LẠI</p><h1 id="live-board-title">Bảng tri ân</h1><p>Chạm vào một tờ note, đọc một tấm lòng.</p></div>
   <div className="live-board-inscription" aria-hidden="true"><DoodleArt kind="plane"/><span>Mỗi tờ note,<br/>một lời thương.</span></div>
   <button className="classroom-button" onClick={onCreate}><NoteIcon/><span aria-hidden="true">+</span></button>
  </div>
  <div className="board-chalk-heading"><span>Gửi thầy cô, với tất cả biết ơn.</span><span>20.11.2026 ♡</span></div>
  <div className="board-note-scroll" role="region" aria-label="Những lời tri ân đã được duyệt" aria-busy={loading} tabIndex={0}>
   {cards.length>0&&<ScatteredNotes cards={cards} onSelect={onSelect}/>}
   {!cards.length&&!loading&&!error&&<div className="empty-board"><NoteIcon/><h2>Chiếc bảng đang đợi lời cảm ơn đầu tiên.</h2><p>Lời nhắn được LTPC duyệt sẽ được dán tại đây.</p><button className="classroom-button" onClick={onCreate}>Viết lời tri ân đầu tiên →</button></div>}
   {loading&&<p className="board-loading" role="status">Đang mở bảng tri ân…</p>}
   {error&&!loading&&<div className="board-unavailable" role="status"><p>Chưa thể tải lời nhắn. Bạn có thể thử mở lại bảng sau.</p><button className="board-link" onClick={onRetry}>Thử tải lại ↻</button></div>}
  </div>
  <div className="live-board-footer">
   <p className="privacy-note board-privacy">Chỉ hiển thị lời nhắn đã được duyệt và có sự đồng ý của người gửi.</p>
   {(page>0||hasMore)&&<nav className="board-pagination" aria-label="Các trang bảng tri ân"><button className="board-link" disabled={page<=0||loading} onClick={()=>onPage(Math.max(0,page-1))}>← Trang trước</button><span aria-live="polite">Trang {page+1}</span><button className="board-link" disabled={!hasMore||loading} onClick={()=>onPage(page+1)}>Trang tiếp →</button></nav>}
   {showIntro&&<a className="live-board-about" href="#how">Cùng gửi một lời cảm ơn <span aria-hidden="true">↓</span></a>}
  </div>
  <div className="community-tray" aria-hidden="true"><i/><i/><b/></div>
 </section>;
}
