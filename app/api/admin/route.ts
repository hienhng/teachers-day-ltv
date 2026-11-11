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
 const settings=await sql.query('SELECT rejection_enabled AS "rejectionEnabled",reject_after AS "rejectAfter" FROM submission_settings WHERE id=TRUE');
 return json({cards:rows.slice(0,25),hasMore:rows.length>25,automation:{enabled,configured},settings:settings[0]||{rejectionEnabled:false,rejectAfter:null}});
}catch(e){return failure(e)}}
export async function PATCH(req:Request){try{
 requireOrigin(req);requireAdmin(req);
 const v=await readBody(req,1000) as {rejectionEnabled?:unknown;rejectAfter?:unknown};
 if(!v||typeof v.rejectionEnabled!=='boolean'||!(v.rejectAfter===null||typeof v.rejectAfter==='string'))throw new ApiError('Cài đặt không hợp lệ.');
 const timestamp=typeof v.rejectAfter==='string'?Date.parse(v.rejectAfter):NaN;
 if(v.rejectAfter!==null&&(!Number.isFinite(timestamp)||new Date(timestamp).toISOString()!==v.rejectAfter))throw new ApiError('Ngày giờ không hợp lệ.');
 if(v.rejectionEnabled&&v.rejectAfter===null)throw new ApiError('Vui lòng chọn thời hạn trước khi bật tự động từ chối.');
 const rows=await database().query(`INSERT INTO submission_settings(id,rejection_enabled,reject_after) VALUES(TRUE,$1,$2)
  ON CONFLICT(id) DO UPDATE SET rejection_enabled=EXCLUDED.rejection_enabled,reject_after=EXCLUDED.reject_after
  RETURNING rejection_enabled AS "rejectionEnabled",reject_after AS "rejectAfter"`,[v.rejectionEnabled,v.rejectAfter]);
 return json({settings:rows[0]});
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
