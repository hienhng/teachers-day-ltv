import {neon} from '@neondatabase/serverless';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';

export class ApiError extends Error {constructor(message:string,public status=400){super(message)}}
export const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export function failure(error:unknown){
 if(error instanceof ApiError)return json({error:error.message},error.status);
 // Do not log connection strings, card content, passwords, or database errors.
 return json({error:'Chưa thể kết nối bảng tri ân. Vui lòng thử lại sau.'},503);
}
export function database(){
 const url=process.env.DATABASE_URL;
 if(!url)throw new ApiError('Chưa kết nối Neon. Quản trị viên cần hoàn tất cấu hình theo README trước khi lưu và chia sẻ thiệp.',503);
 return neon(url);
}
export function requireOrigin(req:Request){
 const url=new URL(req.url),host=req.headers.get('host')||url.host;
 const protocol=process.env.VERCEL==='1'?'https:':url.protocol;
 if(req.headers.get('origin')!==`${protocol}//${host}`)throw new ApiError('Yêu cầu không hợp lệ.',403);
}
export async function readBody(req:Request,limit=10000):Promise<unknown>{
 if(!req.headers.get('content-type')?.includes('application/json'))throw new ApiError('Nội dung không hợp lệ.',415);
 if(Number(req.headers.get('content-length'))>limit)throw new ApiError('Nội dung quá dài.',413);
 const reader=req.body?.getReader();if(!reader)throw new ApiError('Thiếu nội dung.');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new ApiError('Nội dung quá dài.',413)}chunks.push(value)}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new ApiError('Nội dung không hợp lệ.')}
}
export const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
export const isUuid=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id);
export function pageOffset(req:Request){const n=Number(new URL(req.url).searchParams.get('offset'));return Number.isFinite(n)?Math.min(100000,Math.max(0,Math.floor(n))):0}
export async function rateLimit(req:Request,kind:string,max:number,period:number){
 const sql=database(),bucket=Math.floor(Date.now()/period);
 // Vercel replaces x-forwarded-for at its trusted edge. Outside Vercel,
 // all callers share a local bucket rather than trusting spoofable headers.
 const ip=process.env.VERCEL==='1'?req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown':'local';
 const key=createHmac('sha256',process.env.ADMIN_SESSION_SECRET||process.env.DATABASE_URL!).update(`${kind}:${bucket}:${ip}`).digest('hex');
 const rows=await sql.query('INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1 RETURNING count',[key,new Date((bucket+2)*period).toISOString()]);
 if(Number(rows[0].count)>max)throw new ApiError(kind==='login'?'Tạm khóa đăng nhập. Hãy thử lại sau 15 phút.':'Bạn đã tạo nhiều thiệp. Hãy quay lại trong một giờ nhé.',429);
 await sql.query('DELETE FROM rate_limits WHERE expires_at < NOW()');
}
export function adminConfigured(){return (process.env.ADMIN_PASSWORD?.length||0)>=16&&(process.env.ADMIN_SESSION_SECRET?.length||0)>=32}
function sessionKey(){if(!adminConfigured())throw new ApiError('Chưa cấu hình tài khoản quản trị LTPC.',503);return process.env.ADMIN_SESSION_SECRET!}
export function signSession(expiry:number){const text=String(expiry);return `${text}.${createHmac('sha256',sessionKey()).update(`${text}:${sha(process.env.ADMIN_PASSWORD!)}`).digest('hex')}`}
export function safeEqual(a:string,b:string){return timingSafeEqual(Buffer.from(sha(a),'hex'),Buffer.from(sha(b),'hex'))}
export function requireAdmin(req:Request){
 if(!adminConfigured())throw new ApiError('Chưa cấu hình tài khoản quản trị LTPC.',503);
 const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('petals_admin='))?.slice(13)||'';
 const[expiry]=token.split('.'),n=Number(expiry);
 if(!Number.isFinite(n)||n<Date.now()||n>Date.now()+3600000||!safeEqual(token,signSession(n)))throw new ApiError('Vui lòng đăng nhập quản trị.',401);
}
export function sessionCookie(value:string,seconds:number){return `petals_admin=${value}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${seconds}${process.env.NODE_ENV==='production'?'; Secure':''}`}
