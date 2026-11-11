import {useEffect,useRef,useState,type FormEvent,type CSSProperties} from 'react';
import {themes,messageCharacterLimit,decorationOptions as supportedDecorations,type Card,type Decoration} from '../lib/card-validation';
import {noteDesign,noteDesigns,noteStickers,noteShapes} from '../lib/note-design';
import {NotePaper,StickyNote} from './sticky-note';
import {NoteSticker} from './note-sticker';

const decorationOptions=supportedDecorations.filter(key=>key!=='butterflies');

const starters=[
 'Nhân ngày 20/11, em kính chúc thầy thật nhiều sức khỏe và niềm vui. Cảm ơn thầy vì những bài học, sự kiên nhẫn và vì đã luôn tin vào chúng em!',
 'Em cảm ơn cô vì đã lắng nghe, động viên và dìu dắt chúng em mỗi ngày. Chúc cô ngày Nhà giáo Việt Nam 20/11 thật hạnh phúc và luôn giữ được niềm vui với nghề!',
 'Cảm ơn thầy cô vì đã làm những năm tháng ở Lương Thế Vinh trở nên đáng nhớ. Chúc thầy cô một ngày 20/11 ấm áp, nhiều sức khỏe và ngập tràn yêu thương!',
];
type Props={card:Card;busy:boolean;onChange:(key:keyof Card,value:string|boolean|Decoration[])=>void;onSubmit:(event:FormEvent)=>void;onSelect:()=>void};
export function MakerPanel({card,busy,onChange,onSubmit,onSelect}:Props){
 const decorations=card.decorations||[];
 const [activeTool,setActiveTool]=useState<'shape'|'stickers'|null>(null);
 const [mobile,setMobile]=useState(false);
 const sheetOpen=mobile&&Boolean(activeTool);
 const toolPanel=useRef<HTMLElement>(null),opener=useRef<HTMLButtonElement|null>(null);
 useEffect(()=>{
  const media=window.matchMedia('(max-width: 800px)');
  const update=()=>{setMobile(media.matches);setActiveTool(null)};
  update();media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  if(!sheetOpen)return;
  const panel=toolPanel.current;
  if(!panel)return;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  panel.querySelector<HTMLButtonElement>('.sheet-close')?.focus({preventScroll:true});
  const handleKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setActiveTool(null);return}
   if(event.key!=='Tab')return;
   const controls=Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')).filter(control=>control.getClientRects().length);
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  };
  document.addEventListener('keydown',handleKey);
  return()=>{
   document.body.style.overflow=overflow;document.removeEventListener('keydown',handleKey);
   if(window.matchMedia('(max-width: 800px)').matches)opener.current?.focus({preventScroll:true});
  };
 },[sheetOpen]);
 return <form className="letter-composer" onSubmit={onSubmit} aria-label="Viết lời tri ân" aria-busy={busy}>
 <fieldset className="composer-fields" disabled={busy}>
 <section inert={mobile&&Boolean(activeTool)} className="letter-workspace" aria-labelledby="letter-editor-title">
  <div className="letter-editor-heading"><h2 id="letter-editor-title">Lời tri ân của bạn</h2><p>Hãy gửi đến các thầy cô những lời chúc tốt đẹp nhất nhé!</p></div>
  <StickyNote card={card} onChange={onChange}/>
  <div className="note-color-options color-circle-options" role="group" aria-label="Chọn màu giấy">{noteDesigns.map(design=><button type="button" key={design.key} aria-label={design.name} title={design.name} aria-pressed={card.flower===design.key} className={card.flower===design.key?'selected':''} style={{'--swatch':design.paper} as CSSProperties} onClick={()=>{onChange('flower',design.key);onSelect()}}><span aria-hidden="true">{card.flower===design.key?'':''}</span></button>)}</div>
  <div className="mobile-note-tools" aria-label="Trang trí tờ note">{([{key:'shape',label:'Dáng note'},{key:'stickers',label:'Nhãn dán'}] as const).map(tool=><button type="button" key={tool.key} aria-controls="note-tool-panel" aria-expanded={activeTool===tool.key} onClick={event=>{opener.current=event.currentTarget;setActiveTool(tool.key)}}>{tool.label}<span aria-hidden="true">＋</span></button>)}</div>
  <div className="count" aria-live="polite">{card.message.length}/{messageCharacterLimit} ký tự</div>
  <fieldset className="inspiration"><legend>Cần một chút cảm hứng?</legend>{['Gửi thầy','Gửi cô','Gửi thầy cô'].map((label,index)=><button key={label} type="button" onClick={()=>onChange('message',starters[index])}>{label} +</button>)}</fieldset>
 </section>
 {mobile&&activeTool&&<button type="button" className="note-sheet-backdrop" aria-label="Đóng bảng trang trí" tabIndex={-1} onClick={()=>setActiveTool(null)}/>}
 <aside id="note-tool-panel" ref={toolPanel} className={`panel maker-panel letter-tools${activeTool?' sheet-open':''}`} data-active-tool={activeTool||undefined} role={mobile&&activeTool?'dialog':undefined} aria-modal={mobile&&activeTool?true:undefined} aria-label="Trang trí tờ note">
  <div className="note-sheet-header"><span className="sheet-handle" aria-hidden="true"/><div><h2>Trang trí tờ note</h2><button type="button" className="sheet-close" aria-label="Đóng bảng trang trí" onClick={()=>setActiveTool(null)}>×</button></div><div className="note-sheet-tabs" role="tablist" aria-label="Trang trí">{([{key:'shape',label:'Dáng note'},{key:'stickers',label:'Nhãn dán'}] as const).map(tool=><button type="button" role="tab" id={`note-tab-${tool.key}`} aria-controls={`note-options-${tool.key}`} aria-selected={activeTool===tool.key} key={tool.key} tabIndex={activeTool===tool.key?0:-1} onKeyDown={event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const next=event.key==='Home'?'shape':event.key==='End'?'stickers':tool.key==='shape'?'stickers':'shape';
   setActiveTool(next);toolPanel.current?.querySelector<HTMLButtonElement>(`#note-tab-${next}`)?.focus();
  }} onClick={()=>setActiveTool(tool.key)}>{tool.label}</button>)}</div></div>
  <section id="note-options-shape" className="tool-shape" role={mobile?'tabpanel':undefined} aria-labelledby={mobile?'note-tab-shape':undefined}><h2>Dáng note</h2><><div className="note-paper-options" role="group" aria-label="Chọn dáng note">{themes.map(theme=><button type="button" key={theme} aria-label={noteShapes[theme].name} title={noteShapes[theme].name} className={card.theme===theme?'selected':''} aria-pressed={card.theme===theme} onClick={()=>{onChange('theme',theme);onSelect()}}><span className={`paper-swatch note-shape-${noteShapes[theme].shape}`} style={{'--note-paper':noteDesign(card.flower).paper,'--note-edge':noteDesign(card.flower).edge} as CSSProperties} aria-hidden="true"><NotePaper theme={theme}/></span></button>)}</div></>
  </section><section id="note-options-stickers" className="tool-stickers" role={mobile?'tabpanel':undefined} aria-labelledby={mobile?'note-tab-stickers':undefined}><h2>Nhãn dán</h2><><p className="muted">Chọn tối đa 2 nhãn dán.</p><fieldset className="decoration-picker maker-decorations"><legend className="sr-only">Chọn nhãn dán cho lời nhắn</legend><div className="decoration-options" tabIndex={0} role="group" aria-label="Nhãn dán — cuộn ngang để xem thêm">{decorationOptions.map(key=>{const selected=decorations.includes(key);return <button type="button" key={key} aria-pressed={selected} className={selected?'selected':''} disabled={!selected&&decorations.length>=2} onClick={()=>{onChange('decorations',selected?decorations.filter(value=>value!==key):[...decorations,key]);onSelect()}}><NoteSticker type={key}/><span>{noteStickers[key].name}</span></button>})}</div><div className="decoration-summary"><span aria-live="polite">{decorations.length}/2 nhãn dán</span><button type="button" className="text-link" disabled={!decorations.length} onClick={()=>onChange('decorations',[])}>Bỏ nhãn dán</button></div></fieldset></>
 </section>
 </aside>
 <section inert={mobile&&Boolean(activeTool)} className="letter-send" aria-label="Gửi lời nhắn">
   <label className="checkbox"><input type="checkbox" checked={card.anonymous} onChange={event=>onChange('anonymous',event.target.checked)}/>Gửi ẩn danh, từ một người học trò</label>
   <p className="privacy-note" id="letter-privacy">Lời nhắn sẽ được đánh giá tự động; trường hợp cần thêm ngữ cảnh sẽ do LTPC duyệt. Lời chúc và tên người nhận sẽ hiển thị công khai trên bảng tri ân sau khi được duyệt. Tên người gửi cũng sẽ hiển thị, trừ khi bạn chọn gửi ẩn danh.</p>
   <button type="submit" disabled={busy} aria-describedby="letter-privacy" className="pixel-button primary">{busy?'Đang gửi lời nhắn…':'Gửi lời nhắn để duyệt →'}</button>
 </section>
 </fieldset>
 </form>;
}
