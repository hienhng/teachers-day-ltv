import type {Decoration} from '../lib/card-validation';
import {noteStickerImages} from '../lib/note-sticker-art';

export function NoteSticker({type}:{type:Decoration}){
 return <span className={`note-sticker sticker-${type}`} aria-hidden="true"><img src={noteStickerImages[type]} width={64} height={64} alt="" draggable={false}/></span>;
}
