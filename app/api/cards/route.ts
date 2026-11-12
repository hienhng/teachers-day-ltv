import {randomBytes,randomUUID} from 'node:crypto';
import {validateCard,messageCharacterLimit} from '../../../lib/card-validation';
import {validGardenPosition} from '../../../lib/garden-position';
import {moderateCard} from '../../../lib/moderation';
import {ApiError,database,failure,isUuid,json,pageOffset,rateLimit,readBody,requireOrigin,sha} from '../../../lib/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const defaultGardenPageSize=20;

export async function GET(req:Request){try{
 const sql=database(),id=new URL(req.url).searchParams.get('id');
 if(id){
  if(!isUuid(id))throw new ApiError('Không tìm thấy thiệp.',404);
  const rows=await sql.query(`SELECT id,flower,theme,decorations,recipient,message,
    CASE WHEN public_opt_in AND NOT share_sender THEN '' ELSE sender END AS sender,
    anonymous,share_sender AS "shareSender" FROM cards WHERE id=$1 AND status<>'rejected'`,[id]);
  if(!rows.length)throw new ApiError('Không tìm thấy thiệp.',404);
  return json({card:rows[0]});
 }
 if(new URL(req.url).searchParams.has('placement')){
  const rows=await sql.query(`SELECT id,flower,decorations,status,garden_x AS "gardenX",garden_y AS "gardenY"
   FROM cards WHERE status IN ('pending','approved') AND public_opt_in
   ORDER BY created_at DESC,id DESC`);
  return json({cards:rows});
 }
 const query=new URL(req.url).searchParams;
 const gardenPageSize=query.has('limit')?Number(query.get('limit')):defaultGardenPageSize;
 if(gardenPageSize!==10&&gardenPageSize!==defaultGardenPageSize)throw new ApiError('Yêu cầu không hợp lệ.');
 let page=Math.floor(pageOffset(req)/gardenPageSize);
 const note=query.get('note');
 if(note){
  if(!isUuid(note))throw new ApiError('Không tìm thấy lời nhắn trên bảng.',404);
  // Locate the note using the board's ordering and visibility rules, including UUID ties.
  const position=await sql.query(`SELECT (SELECT COUNT(*) FROM cards newer
   WHERE newer.status='approved' AND newer.public_opt_in AND (newer.created_at,newer.id)>(target.created_at,target.id))::int AS position
   FROM cards target WHERE target.id=$1 AND target.status='approved' AND target.public_opt_in`,[note]);
  if(!position.length)throw new ApiError('Không tìm thấy lời nhắn trên bảng.',404);
  page=Math.floor(position[0].position/gardenPageSize);
 }
 const offset=page*gardenPageSize;
 const rows=await sql.query(`SELECT id,flower,theme,decorations,recipient,message,
   CASE WHEN share_sender AND NOT anonymous THEN sender ELSE '' END AS sender,
   anonymous,share_sender AS "shareSender",garden_x AS "gardenX",garden_y AS "gardenY" FROM cards WHERE status='approved' AND public_opt_in
   ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $1`,[offset,gardenPageSize+1]);
 return json({cards:rows.slice(0,gardenPageSize),hasMore:rows.length>gardenPageSize,page});
}catch(e){return failure(e)}}

export async function POST(req:Request){try{
 requireOrigin(req);
 const card=validateCard(await readBody(req));
 if(!card)throw new ApiError(`Vui lòng kiểm tra tên và lời chúc (5–${messageCharacterLimit} ký tự).`);
 const configuredLimit=Number(process.env.CARD_RATE_LIMIT||20);
 await rateLimit(req,'card',Number.isFinite(configuredLimit)?Math.max(1,Math.min(1000,configuredLimit)):20,3600000);
 const id=randomUUID(),editToken=randomBytes(32).toString('hex'),sql=database();
 const shareSender=!card.anonymous&&card.shareSender;
 // Evaluate the cutoff and save the decision in the same statement, before AI review.
 const inserted=await sql.query(`WITH policy AS (
   SELECT EXISTS(SELECT 1 FROM submission_settings WHERE id=TRUE AND rejection_enabled AND reject_after<=statement_timestamp()) AS closed
  ) INSERT INTO cards(id,flower,theme,recipient,message,sender,anonymous,share_sender,edit_hash,decorations,public_opt_in,status,moderation)
   SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[],TRUE,
    CASE WHEN closed THEN 'rejected' ELSE 'pending' END,
    CASE WHEN closed THEN jsonb_build_object('source','deadline','state','done','reason','submission_deadline','reviewedAt',statement_timestamp()) ELSE '{}'::jsonb END
   FROM policy RETURNING status`,[id,card.flower,card.theme,card.recipient,card.message,card.sender,card.anonymous,shareSender,sha(editToken),card.decorations||[]]);
 // The letter is already saved: an unavailable reviewer must not turn a successful submission into a retry/duplicate.
 const moderationStatus=inserted[0].status==='rejected'?'rejected':await moderateCard(id).catch(()=>'pending' as const);
 return json({card:{...card,id,shareSender},editToken,moderationStatus,...(inserted[0].status==='rejected'?{moderationReason:'submission_deadline'}:{})},201);
}catch(e){return failure(e)}}

export async function PATCH(req:Request){try{
 requireOrigin(req);const v=await readBody(req,1000) as {id?:unknown;editToken?:unknown;shareSender?:unknown;gardenX?:unknown;gardenY?:unknown};
 if(!v||!isUuid(v.id)||typeof v.editToken!=='string'||v.editToken.length!==64||typeof v.shareSender!=='boolean')throw new ApiError('Yêu cầu không hợp lệ.');
 const hasGardenPosition=Object.hasOwn(v,'gardenX')||Object.hasOwn(v,'gardenY');
 if(hasGardenPosition&&!validGardenPosition(v.gardenX,v.gardenY))throw new ApiError('Vị trí khu vườn không hợp lệ.');
 const sql=database(),rows=await sql.query(`UPDATE cards SET public_opt_in=TRUE,status='pending',
   share_sender=CASE WHEN anonymous THEN FALSE ELSE $1 END,garden_x=$4,garden_y=$5
   WHERE id=$2 AND edit_hash=$3 AND status IN ('private','pending') RETURNING id`,[v.shareSender,v.id,sha(v.editToken),hasGardenPosition?v.gardenX:null,hasGardenPosition?v.gardenY:null]);
 if(!rows.length)throw new ApiError('Thiệp đã được gửi hoặc bạn không có quyền chỉnh sửa.',403);
 return json({ok:true});
}catch(e){return failure(e)}}
