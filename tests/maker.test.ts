import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {MakerPanel} from '../app/maker-panel';
import {StickyNote} from '../app/sticky-note';
import {decorationOptions,type Card} from '../lib/card-validation';
import {gardenPosition,gardenDisplayPosition,clampGardenPosition,gardenPositionOverlapsFlower} from '../lib/garden-position';
const card:Card={flower:'tulip',theme:'meadow',recipient:'Thầy Minh',message:'Cảm ơn thầy vì những bài học đáng nhớ!',sender:'Học trò 12A',anonymous:false,shareSender:false,decorations:['bees','cranes']};
const panel=()=>renderToStaticMarkup(createElement(MakerPanel,{card,busy:false,onChange:()=>{},onSubmit:()=>{},onSelect:()=>{}}));

describe('direct letter composer',()=>{
 it('limits selection to two while keeping selected stickers removable',()=>{
  const html=panel();
  const availableOptions=decorationOptions.filter(key=>key!=='butterflies');
  const choices=html.slice(html.indexOf('class="decoration-options"')).match(/<button[^>]*aria-pressed="[^"]+"[^>]*>/g)||[];
  expect(choices).toHaveLength(availableOptions.length);
  expect(choices.filter(button=>button.includes('disabled'))).toHaveLength(availableOptions.length-2);
  expect(choices.filter(button=>button.includes('aria-pressed="true"')).every(button=>!button.includes('disabled'))).toBe(true);
  expect(html).toContain('2/2 nhãn dán');
 });
 it('renders only two decorative stickers on older three-sticker notes',()=>{
  const legacy={...card,decorations:['bees','cranes','music'] as Card['decorations']};
  for(const compact of [false,true]){
   const html=renderToStaticMarkup(createElement(StickyNote,{card:legacy,compact}));
   expect(html.match(/<img /g)).toHaveLength(2);
   expect(html).not.toContain('<button');
  }
 });
 it('keeps all customization controls beside the editable letter without dialogs or wizard steps',()=>{
  const html=panel();
  expect(html).toContain('note-color-options');
  expect(html).toContain('note-paper-options');
  expect(html).toContain('decoration-options');
  expect(html).toContain('note-editable');
  expect(html).not.toContain('<dialog');
  expect(html).not.toContain('Tiếp tục');
  for(const name of ['recipient','message','sender'])expect(html).toContain(`id="letter-${name}"`);
  expect(html).toContain(card.recipient);expect(html).toContain(card.message);expect(html).toContain(card.sender);
 });
 it('preserves every editable paper silhouette at its original aspect ratio',()=>{
  for(const theme of ['meadow','heart','blossom','night']){
   const html=renderToStaticMarkup(createElement(StickyNote,{card:{...card,theme,message:'a'.repeat(150)},onChange:()=>{}}));
   expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
   expect(html).not.toContain('preserveAspectRatio="none"');
   expect(html).toContain('note-editable');
  }
 });
 it('enforces writing limits on the letter and locks the form during submission',()=>{
  const html=renderToStaticMarkup(createElement(MakerPanel,{card,busy:true,onChange:()=>{},onSubmit:()=>{},onSelect:()=>{}}));
  expect(html).toContain('class="composer-fields" disabled');
  expect(html).toContain('minLength="5"');expect(html).toContain('maxLength="150"');
  expect(html).toContain('maxLength="60"');expect(html).toContain('maxLength="40"');
 });
 it('shares named senders automatically while keeping anonymous sending available',()=>{
  const html=panel();
  expect(html).toContain('Gửi lời nhắn để duyệt');
  expect(html).toContain('hiển thị công khai trên bảng tri ân sau khi được duyệt');
  expect(html).toContain('trừ khi bạn chọn gửi ẩn danh');
  expect(html).not.toContain('Hiển thị cả biệt danh của mình trên bảng tri ân');
  expect(html).toContain('Gửi ẩn danh');
  expect(html.match(/type="checkbox"/g)).toHaveLength(1);
  expect(html).toMatch(/id="letter-sender"[^>]*required/);
  const anonymous=renderToStaticMarkup(createElement(MakerPanel,{card:{...card,anonymous:true},busy:false,onChange:()=>{},onSubmit:()=>{},onSelect:()=>{}}));
  expect(anonymous).not.toContain('id="letter-sender"');
  expect(anonymous).toContain('Một người gửi yêu thương');
  expect(anonymous).toMatch(/type="checkbox"[^>]*checked/);


 });
});
describe('garden placement',()=>{
 it('keeps user coordinates unchanged and bounds pointer and keyboard input',()=>{expect(gardenPosition({...card,id:'saved',gardenX:37.4,gardenY:82.1})).toEqual({x:37.4,y:82.1});expect(clampGardenPosition(-10,150)).toEqual({x:12,y:94});expect(gardenPosition({...card,id:'old'})).toEqual(gardenPosition({...card,id:'old'}))});
 it('spreads displayed flowers into separate mobile and desktop slots',()=>{
  expect(gardenDisplayPosition(0,true)).toEqual({x:24,y:27});
  expect(gardenDisplayPosition(1,true)).toEqual({x:70,y:27});
  expect(gardenDisplayPosition(8,true)).toEqual({x:24,y:91});
  expect(gardenDisplayPosition(0,false)).toEqual({x:12,y:28});
  expect(gardenDisplayPosition(19,false)).toEqual({x:88,y:92});
 });
 it('rejects positions too close in both coordinates',()=>{
  const neighbor={x:50,y:60};
  expect(gardenPositionOverlapsFlower({x:50,y:60},neighbor)).toBe(true);
  expect(gardenPositionOverlapsFlower({x:61.9,y:71.9},neighbor)).toBe(true);
  expect(gardenPositionOverlapsFlower({x:62,y:60},neighbor)).toBe(false);
  expect(gardenPositionOverlapsFlower({x:50,y:72},neighbor)).toBe(false);
  expect(gardenPositionOverlapsFlower({x:62,y:60},neighbor,1.2)).toBe(true);
 });
});
