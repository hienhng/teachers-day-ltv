export type ModerationStatus='pending'|'approved'|'rejected';
export const moderationCategories=['appropriate','spam','abuse','sexual','threat','hate','personal_info','uncertain'] as const;
export type ModerationCategory=typeof moderationCategories[number];
export type ModelVerdict={decision:'approve'|'reject'|'review';category:ModerationCategory;confidence:number};
export type ModerationRecord={
 source?:'ai'|'manual'|'filter';state?:'running'|'done';reason?:string;model?:string;
 confidence?:number;category?:ModerationCategory;decision?:ModelVerdict['decision'];
 attemptId?:string;startedAt?:string;reviewedAt?:string;policyVersion?:number;
};
export const moderationReasons:Record<string,string>={
 appropriate:'Lời tri ân phù hợp với bảng công khai.',
 spam:'Có nội dung quảng cáo hoặc spam.',
 abuse:'Có nội dung xúc phạm hoặc bắt nạt.',
 blocked_term:'Có từ ngữ nằm trong danh sách tự động từ chối.',
 sexual:'Có nội dung tình dục không phù hợp.',
 threat:'Có lời đe dọa hoặc cổ vũ bạo lực.',
 hate:'Có nội dung thù ghét hoặc kỳ thị.',
 personal_info:'Có thể tiết lộ thông tin cá nhân nhạy cảm.',
 uncertain:'Cần người quản trị xem xét ngữ cảnh.',
 low_confidence:'AI chưa đủ chắc chắn; cần duyệt thủ công.',
 unavailable:'Chưa thể đánh giá tự động; cần duyệt thủ công hoặc thử lại.',
 not_configured:'Chưa cấu hình AI; cần duyệt thủ công.',
 disabled:'Đang tắt duyệt tự động; cần duyệt thủ công.',
 manual_approved:'Quản trị viên đã duyệt.',
 manual_rejected:'Quản trị viên đã từ chối.',
 reviewing:'Đang đánh giá tự động.',
};

export function validVerdict(value:unknown):value is ModelVerdict{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).length===3&&['approve','reject','review'].includes(v.decision as string)
  &&moderationCategories.includes(v.category as ModerationCategory)
  &&typeof v.confidence==='number'&&Number.isFinite(v.confidence)&&v.confidence>=0&&v.confidence<=1;
}

export function verdictDecision(verdict:ModelVerdict):{status:ModerationStatus;reason:string}{
 // Confidence is a model estimate, not a calibrated probability. Ambiguity always goes to a human.
 if(verdict.decision==='approve'&&verdict.category==='appropriate'&&verdict.confidence>=.95)return {status:'approved',reason:'appropriate'};
 const rejectable=['spam','abuse','sexual','threat','hate'];
 if(verdict.decision==='reject'&&rejectable.includes(verdict.category)&&verdict.confidence>=.98)return {status:'rejected',reason:verdict.category};
 return {status:'pending',reason:verdict.category==='personal_info'?'personal_info':verdict.decision==='review'?'uncertain':'low_confidence'};
}
