export type SubmissionSettings = {rejectionEnabled:boolean; rejectAfter:string|null};

// Admin inputs always use Vietnam time, regardless of the browser's timezone.
export function deadlineInput(iso:string|null):string {
 if (!iso) return '';
 const timestamp=Date.parse(iso);
 return Number.isFinite(timestamp) ? new Date(timestamp+7*3600000).toISOString().slice(0,16) : '';
}

export function deadlineIso(input:string):string|null {
 if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
 const timestamp=Date.parse(`${input}:00+07:00`);
 if (!Number.isFinite(timestamp)) return null;
 const iso=new Date(timestamp).toISOString();
 return deadlineInput(iso)===input ? iso : null;
}
