import {NoteIcon} from './sticky-note';
import {HomepageEvent} from './homepage-event';
import {DoodleArt} from './doodle-art';
import './chalkboard-hero.css';

const steps=[
 {number:'01',symbol:'▧',title:'Chọn một tờ giấy nhỏ',text:'Một màu bạn thích, vài nét trang trí. Một tờ note mang dấu ấn của riêng bạn.'},
 {number:'02',symbol:'✎',title:'Viết điều chưa kịp nói',text:'Một kỷ niệm trong lớp, một lời cảm ơn, hay lời chúc bạn muốn dành tặng thầy cô.'},
 {number:'03',symbol:'↗',title:'Gửi đến người gieo chữ',text:'Gửi riêng bằng đường dẫn, hoặc góp lời nhắn lên bảng tri ân của trường.'},
];
export function Homepage({onCreate,onGarden,onButterfly}:{onCreate:()=>void;onGarden:()=>void;onButterfly:()=>void}){
 return <main className="teachers-home">
  <section className="chalkboard-hero" aria-labelledby="home-title">
   <div className="chalk-hero-topline">
    <p className="school-kicker"><span/> THCS&THPT LƯƠNG THẾ VINH</p>
    <div className="chalk-hero-topright">
     <p className="chalk-hero-date">Thứ sáu, ngày 20 tháng 11 <span>2026</span></p>
     <span className="chalk-hero-logo" role="img" aria-label="Logo LTPC"/>
    </div>
   </div>
   <div className="chalk-hero-stage">
    <aside className="chalk-hero-margin chalk-hero-margin-left" aria-label="Lời nhắn gợi ý">
     <div className="chalk-margin-caption" aria-hidden="true">Một chút thương,<br/>gửi thầy cô ♡<svg viewBox="0 0 90 55"><path d="M8 4Q80 2 67 45m-10-9 10 10 10-11"/></svg></div>
     <div className="sample-note sample-yellow"><span className="sample-tape" aria-hidden="true"/><small>LỜI NHẮN GỢI Ý</small><p>Cảm ơn thầy cô<br/>vì đã tin vào em,<br/>cả khi em chưa<br/>tin vào chính mình.</p><span className="sample-sign">Một người học trò ♡</span></div>
     <svg className="chalk-book" viewBox="0 0 160 110" fill="none" aria-hidden="true"><path d="M79 93C57 76 33 79 10 79L16 15C43 12 62 21 81 35c21-16 43-18 66-12l-3 65c-26-7-44-6-65 5Zm2-58-2 58M25 31c15 0 29 5 42 13M25 45c15 0 27 5 39 12m-40 2c13 0 24 5 37 11m36-25c13-7 25-8 38-6m-39 19c13-6 25-7 38-5m-39 18c13-5 25-5 38-3M10 85l-2 7c29-1 50 2 71 12 21-9 41-11 66-7l2-7"/></svg>
    </aside>
    <div className="chalk-hero-copy">
     <p className="chalk-hero-edition"><span aria-hidden="true"></span> MÙA TRI ÂN · 20 / 11 <span aria-hidden="true"></span></p>
     <h1 id="home-title">Có những bài học<br/>ở lại <em>trong tim.<svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path d="M4 10Q92 1 169 9T295 6M27 17Q155 8 272 15"/></svg></em></h1>
     <p className="teachers-lead">Một tờ giấy nhỏ. Một lời cảm ơn lớn.</p>
     <p className="teachers-description">Gửi thầy cô một lời nhắn từ trái tim. Cùng LTPC lấp đầy chiếc bảng xanh bằng những kỷ niệm, lời chúc và lòng biết ơn.</p>
     <div className="teachers-actions"><button className="classroom-button" onClick={onCreate}><NoteIcon/>Viết lời tri ân <span aria-hidden="true">↗</span></button><button className="board-link" onClick={onGarden}>Ghé bảng tri ân <span aria-hidden="true">→</span></button></div>
     <p className="hero-postscript"><span aria-hidden="true">✎</span> Dành cho thầy cô, từ những người học trò.</p>
    </div>
    <aside className="chalk-hero-margin chalk-hero-margin-right" aria-label="Lời chúc ngày Nhà giáo Việt Nam">
     <DoodleArt kind="sun" className="chalk-hero-sun"/>
     <div className="sample-note sample-pink"><span className="sample-tape" aria-hidden="true"/><small>GỬI NGƯỜI GIEO CHỮ</small><p>Thầy cô là<br/>một phần thật đẹp<br/>của thanh xuân.</p><span className="sample-heart" aria-hidden="true">♡</span></div>
     <div className="chalk-hero-flower" aria-hidden="true"><svg viewBox="0 0 100 130" fill="none"><path d="M51 123c6-30 8-55 2-75m2 51c-22-1-31-13-29-23 15 0 25 9 29 23Zm1-18c21-1 29-15 26-23-14 1-23 10-26 23Z"/><path d="M43 24C20 5 18 43 35 44 14 58 45 76 51 54c5 23 36 5 21-9 24 0 12-33-5-21C76 1 40 1 43 24Z"/><circle cx="52" cy="36" r="10"/></svg><span>Merci, thầy cô!</span></div>
    </aside>
    <span className="chalk-hero-star chalk-hero-star-one" aria-hidden="true"></span><span className="chalk-hero-star chalk-hero-star-two" aria-hidden="true">✳</span>
    <DoodleArt kind="plane" className="chalk-hero-plane"/>
   </div>
   <div className="chalk-hero-footer">
    <button className="chalk-doodle" onClick={onButterfly} aria-label="Đọc một lời nhắn nhỏ">A+ <span aria-hidden="true">✦</span></button>
    <a className="chalk-hero-scroll" href="#how">Lời cảm ơn bắt đầu từ đây <span aria-hidden="true">↓</span></a>
    <span className="chalk-hero-wish">Chúc mừng ngày Nhà giáo Việt Nam <strong>20.11</strong></span>
   </div>
   <div className="chalk-hero-tray" aria-hidden="true"><b/><i/><i/><i/></div>
  </section>
  <div className="gratitude-ribbon" aria-hidden="true"><span>CẢM ƠN VÌ ĐÃ DẠY CHÚNG EM</span><i>✦</i><span>KIẾN THỨC · LÒNG TỐT · NHỮNG ƯỚC MƠ</span><i>✦</i><span>HAPPY VIETNAMESE TEACHERS’ DAY</span></div>
  <section className="teachers-how" id="how" aria-labelledby="how-title">
   <div className="teachers-section-heading"><DoodleArt kind="sparkles" className="how-sparkles"/><p className="edition-label">NHỎ THÔI, NHƯNG THẬT LÒNG</p><h2 id="how-title">Lời cảm ơn của bạn bắt đầu từ đây.</h2><p>Không cần viết thật hay. Chỉ cần viết bằng chính mình.</p></div>
   <ol className="teachers-steps">{steps.map(step=><li key={step.number}><div className="step-number">{step.number}<span aria-hidden="true">{step.symbol}</span></div><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
  </section>
  <HomepageEvent onCreate={onCreate}/>
  <section className="teachers-board-invite"><div><p className="edition-label">CHIẾC BẢNG CHUNG CỦA CHÚNG MÌNH</p><h2>Mỗi tờ note, một điều đáng nhớ.</h2><p>Những lời tri ân dành cho thầy cô Lương Thế Vinh, được gìn giữ trên cùng một chiếc bảng.</p></div><button className="classroom-button" onClick={onGarden}>Mở bảng tri ân <span aria-hidden="true">↗</span></button></section>
 </main>;
}
