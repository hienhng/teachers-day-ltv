import {ApiError,database,failure,isUuid,json,pageOffset,rateLimit,readBody,requireAdmin,requireOrigin} from '../../../lib/server';
import {moderateCard,moderationConfiguration} from '../../../lib/moderation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 requireAdmin(req);const sql=database();
 const status=new URL(req.url).searchParams.get('status')||'all';
 if(!['all','pending','approved','rejected'].includes(status))throw new ApiError('Trạng thái không hợp lệ.');
 const rows=await sql.query(`SELECT id,recipient,message,sender,status,created_at,moderation FROM cards
 WHERE public_opt_in AND status IN ('pending','approved','rejected') AND ($2='all' OR status=$2)
 ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET $1`,[pageOffset(req),status]);
 const {enabled,configured}=moderationConfiguration();
 return json({cards:rows.slice(0,25),hasMore:rows.length>25,automation:{enabled,configured}});
}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 requireOrigin(req);requireAdmin(req);const v=await readBody(req,1000) as {id?:unknown;status?:unknown;action?:unknown};
 if(!v||!isUuid(v.id))throw new ApiError('Yêu cầu không hợp lệ.');
 if(v.action==='automate'){
  const config=moderationConfiguration();
  if(!config.enabled||!config.configured)throw new ApiError('Chưa bật hoặc chưa cấu hình duyệt tự động.',503);
  await rateLimit(req,'moderation',30,3600000);
  const status=await moderateCard(v.id);
  return json({ok:true,status});
 }
 if(v.action!==undefined||!['approved','rejected'].includes(v.status as string))throw new ApiError('Yêu cầu không hợp lệ.');
 const moderation={source:'manual',state:'done',reason:v.status==='approved'?'manual_approved':'manual_rejected',reviewedAt:new Date().toISOString()};
 const sql=database(),rows=await sql.query(`UPDATE cards SET status=$1,moderation=$3::jsonb WHERE id=$2 AND public_opt_in
 AND status IN ('pending','approved','rejected') RETURNING id`,[v.status,v.id,JSON.stringify(moderation)]);
 if(!rows.length)throw new ApiError('Không tìm thấy lời chúc cần duyệt.',404);
 return json({ok:true});
}catch(e){return failure(e)}}
