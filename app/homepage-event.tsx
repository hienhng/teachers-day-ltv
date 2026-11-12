import './homepage-event.css';
import {DoodleArt} from './doodle-art';

export function HomepageEvent({onCreate}:{onCreate:()=>void}){
 return <section className="event-feature" id="event" aria-labelledby="event-title">
  <div className="event-feature-date">
   <span className="event-feature-binding" aria-hidden="true"><i/><i/><i/></span>
   <div className="event-feature-date-top"><span>MÙA TRI ÂN</span><span>2026</span></div>
   <time dateTime="2026-11-20" aria-label="Ngày 20 tháng 11 năm 2026"><span className="event-feature-day">20<svg viewBox="0 0 210 165" preserveAspectRatio="none" aria-hidden="true"><path d="M183 32C139-8 25 7 14 71S73 160 143 146 224 55 177 27M173 20C124 0 18 16 11 80"/></svg></span><span className="event-feature-month">THÁNG MƯỜI MỘT</span></time>
   <p className="event-feature-day-label">NGÀY NHÀ GIÁO VIỆT NAM</p>
   <div className="event-feature-date-bottom"><span aria-hidden="true">♡</span><p>Gửi một lời cảm ơn,<br/>giữ một điều thật đẹp.</p></div>
  </div>
  <div className="event-feature-story">
   <DoodleArt kind="sparkles" className="event-feature-sparkles"/>
   <p className="event-feature-eyebrow">TỪ NHỮNG DÒNG CODE, GỬI NGƯỜI GIEO CHỮ</p>
   <h2 id="event-title">Bụi phấn có thể phai.<br/><em>Lòng biết ơn thì ở lại.<svg viewBox="0 0 360 18" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10Q118 0 208 9T356 6M26 16Q175 7 328 14"/></svg></em></h2>
   <p className="event-feature-lead">Một bài học còn nhớ mãi, một lời động viên đúng lúc, hay những ngày cùng đồng nghiệp tận tâm với nghề — mỗi kỷ niệm đều có thể trở thành một lời tri ân.</p>
   <p><strong>Trạm phát sóng yêu thương</strong> là món quà nhỏ từ Lương Thế Vinh Tân Triều Programming Club dành tặng thầy cô <strong>THCS&THPT Lương Thế Vinh</strong> nhân ngày Nhà giáo Việt Nam 20/11.</p>
   <button className="event-feature-action" onClick={onCreate}>Viết lời cảm ơn của bạn <span aria-hidden="true">↗</span></button>
   <div className="event-feature-signature"><DoodleArt kind="plane" className="event-feature-plane"/><div><strong>LTV Tân Triều Programming Club</strong><span>Một món quà nhỏ, từ những tấm lòng.</span></div></div>
  </div>
  <DoodleArt kind="flower" className="event-feature-flower"/>
 </section>;
}
