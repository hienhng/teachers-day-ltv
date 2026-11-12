'use client';
import {useState} from 'react';
import type {Card} from '../lib/card-validation';

function ActionPaper(){
 return <svg className="board-note-action-paper" viewBox="0 0 160 58" preserveAspectRatio="none" fill="none" aria-hidden="true">
  <path className="board-note-action-paper-fill" d="M5 5Q42 1 81 4L153 3 157 19 155 50Q115 55 77 52L5 54 3 32Z"/>
  <path d="m8 9 35-2m89 1 17-1 3 13M8 35l1 14 30-1m90 1 20-2" opacity=".35" strokeWidth=".8"/>
  <path d="m143 39 5 4m-9-2 5 5" strokeWidth="1" opacity=".5"/>
 </svg>;
}

export function BoardNoteActions({card}:{card:Card}){
 const [exporting,setExporting]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [shareLink,setShareLink]=useState('');

 async function share(){
  if(!card.id)return;
  setFeedback('');setShareLink('');
  const url=new URL('/',location.origin);
  url.searchParams.set('card',card.id);
  if(navigator.share){
   try{await navigator.share({title:`Lời tri ân gửi ${card.recipient}`,url:url.href});return}
   catch(error){if(error instanceof DOMException&&error.name==='AbortError')return}
  }
  try{
   await navigator.clipboard.writeText(url.href);
   setFeedback('Đã sao chép đường dẫn lời nhắn.');
  }catch{
   setShareLink(url.href);
   setFeedback('Sao chép đường dẫn bên dưới để chia sẻ lời nhắn.');
  }
 }

 async function savePNG(){
  setExporting(true);setFeedback('');
  try{
   const {createLetterPNG}=await import('../lib/export-letter');
   const url=await createLetterPNG(card);
   const anchor=document.createElement('a');
   anchor.href=url;anchor.download=`tram-tri-an-${card.id||'20-11'}.png`;
   document.body.appendChild(anchor);anchor.click();anchor.remove();
   setFeedback('Đã tải lời nhắn dưới dạng PNG.');
  }catch{setFeedback('Chưa thể lưu ảnh PNG. Vui lòng thử lại.')}
  finally{setExporting(false)}
 }

 return <div className="board-note-actions">
  <div className="board-note-action-buttons" role="group" aria-label="Chia sẻ và lưu lời nhắn">
   <svg className="board-note-actions-spark" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="m8 4 4 9M1 17l10 2m-7 12 8-5m10-14 2 5 5 2-5 2-2 5-1-5-5-2 5-2Z"/></svg>
   <button type="button" className="board-note-action board-note-action-share" disabled={!card.id} onClick={share}>
    <ActionPaper/>
    <svg className="board-note-action-icon" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="m5 10 20-7-7 20-5-8-8-5Zm8 5L25 3m-12 12-1 7 4-3M2 17q-3 6 3 8 5 2 5-3"/><path d="m8 10 12-4" opacity=".35"/></svg>
    <span>Chia sẻ</span>
   </button>
   <button type="button" className="board-note-action board-note-action-save" disabled={exporting} aria-busy={exporting} onClick={savePNG}>
    <ActionPaper/>
    <svg className="board-note-action-icon" viewBox="0 0 28 28" fill="none" aria-hidden="true">{exporting?<circle className="board-note-action-spinner" cx="14" cy="14" r="8" strokeDasharray="32 18"/>:<><path d="m5 4 12-1 6 6-1 16-18-1 1-20Zm12-1-1 7 7-1M13 12l1 8m-4-3 4 3 4-4"/><path d="m7 7 5-1M7 22l12 1" opacity=".35"/></>}</svg>
    <span>{exporting?'Đang lưu…':'Lưu ảnh'}</span>
   </button>
  </div>
  <p className="board-note-action-status" role="status">{feedback}</p>
  {shareLink&&<label className="board-note-share-link">Đường dẫn lời nhắn<input readOnly value={shareLink} onFocus={event=>event.target.select()}/></label>}
 </div>;
}
