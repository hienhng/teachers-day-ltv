export function HomepageEvent({onCreate}:{onCreate:()=>void}){
 return <section className="teachers-event" id="event" aria-labelledby="event-title">
  <div className="event-calendar" aria-label="Ngày Nhà giáo Việt Nam, 20 tháng 11 năm 2026"><div>THÁNG MƯỜI MỘT</div><strong>20</strong><span>2026 · NGÀY NHÀ GIÁO VIỆT NAM</span><p>Gửi một lời cảm ơn,<br/>giữ một điều thật đẹp.</p></div>
  <div className="teachers-event-story"><p className="edition-label">TỪ NHỮNG DÒNG CODE, GỬI NGƯỜI GIEO CHỮ</p><h2 id="event-title">Bụi phấn có thể phai.<br/>Lòng biết ơn thì ở lại.</h2><p>Có những bài giảng đã quên đôi chút, nhưng sự kiên nhẫn, lời động viên và ánh mắt tin tưởng của thầy cô thì vẫn luôn ở đó.</p><p><strong>Trạm phát sóng yêu thương</strong> là món quà nhỏ từ Lương Thế Vinh Tân Triều Programming Club dành tặng thầy cô <strong>THCS&THPT Lương Thế Vinh</strong> nhân ngày Nhà giáo Việt Nam 20/11.</p><button className="board-link" onClick={onCreate}>Viết lời cảm ơn của bạn <span aria-hidden="true">→</span></button></div>
 </section>;
}
