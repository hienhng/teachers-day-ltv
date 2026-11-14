import {DoodleArt} from './doodle-art';

function DoodleArrow({back=false}:{back?:boolean}){
 return <svg className={`board-nav-arrow${back?' board-nav-arrow-back':''}`} viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M4 23c6 5 15 3 13-3-3-7-12-3-7 2 6 6 16-2 30-7M29 6l12 8-10 11"/><path d="m34 4 4 2M43 22l-2 4" strokeWidth="1.5"/></svg>;
}

export function BoardHomeButton({onClick}:{onClick:()=>void}){
 return <button type="button" className="board-exit board-doodle-button" onClick={onClick} aria-label="Trở về trang chủ" title="Trở về trang chủ"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m6 20 14-13 14 12M10 18l1 15 19-1 1-14M17 32l-1-10 8 1v9M28 10V6l4 1v7"/><path d="m4 8 2 3m30 16 2 1M4 30l3-1"/></svg></button>;
}

export function BoardPagination({page,hasMore,loading,onPage}:{page:number;hasMore:boolean;loading:boolean;onPage:(page:number)=>void}){
 return <nav className="board-pagination board-doodle-pagination" aria-label="Các trang bảng tri ân">
  <button type="button" className="board-doodle-button board-page-previous" disabled={page<=0||loading} onClick={()=>onPage(Math.max(0,page-1))}><DoodleArrow back/><span>Trang trước</span><DoodleArt kind="flower" className="board-nav-flourish"/></button>
  <span className="board-page-stamp" aria-live="polite" aria-atomic="true"><span>Trang</span><strong>{page+1}</strong><svg viewBox="0 0 48 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M3 5q19-6 41-2M9 8l28-2"/></svg></span>
  <button type="button" className="board-doodle-button board-page-next" disabled={!hasMore||loading} onClick={()=>onPage(page+1)}><DoodleArt kind="sparkles" className="board-nav-flourish"/><span>Trang tiếp</span><DoodleArrow/></button>
 </nav>;
}
