import {NoteIcon} from './sticky-note';

type NavigationProps = {
  view: string;
  onNavigate: (view: string) => void;
  onCreate: () => void;
  onEvent: () => void;
};

export function SiteNavigation({view,onNavigate,onCreate,onEvent}: NavigationProps) {
  return <header className="site-header">
    <button className="brand" onClick={()=>onNavigate('home')} aria-label="Trạm phát sóng yêu thương — Trang chủ">
      <NoteIcon/><span>Trạm phát sóng yêu thương<small>GỬI NGƯỜI GIEO CHỮ · LTPC</small></span>
    </button>
    <nav aria-label="Điều hướng chính">
      <button aria-current={view==='home'?'page':undefined} onClick={()=>onNavigate('home')}>Trang chủ</button>
      <button aria-current={view==='maker'?'page':undefined} onClick={onCreate}>Viết lời tri ân</button>
      <button aria-current={view==='garden'?'page':undefined} onClick={()=>onNavigate('garden')}>Bảng tri ân</button>
      <button onClick={onEvent}>Về sự kiện</button>
      <a className="admin-nav-link" href="/admin">Quản trị</a>
    </nav>
  </header>;
}
