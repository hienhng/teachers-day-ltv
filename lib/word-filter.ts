// Match whole terms, including case, accent, width and separator variations.
// A deliberately limited fallback; AI handles context, inflections, transliteration
// and languages/terms outside this list. Avoid ambiguous short foreign words.
export const blockedTerms=[
 'dcm','vcl','dcmm','vl','vcd','vcc','cmm','bts','clm','db','cc',
 'fuck','fucking','fucker','motherfucker','shit','bullshit','bitch','asshole',
 'mierda','mierdas','joder','pendejo','pendeja', // Spanish
 'putain','merde','connard','connasse', // French
 'scheiße','scheisse','arschloch','ficken', // German
 'caralho','porra','foda-se', // Portuguese
 'блядь','блять','нахуй','пиздец', // Russian
 '操你妈','操你媽','傻逼', // Chinese
 'くそ','クソ','くたばれ', // Japanese
 '씨발','시발','개새끼', // Korean
 'كس امك', // Arabic
 'बहनचोद','मादरचोद', // Hindi
] as const;

function normalizeTerm(text:string):string{
 return text.normalize('NFKD').toLowerCase().replace(/[\p{M}\p{Cf}]/gu,'').replace(/đ/g,'d');
}

const separator='[^\\p{L}\\p{N}]*';
const blockedPattern=new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${blockedTerms.map(term=>
 [...normalizeTerm(term)].filter(char=>/[\p{L}\p{N}]/u.test(char)).join(separator)
).join('|')})(?=$|[^\\p{L}\\p{N}])`,'u');

export function containsBlockedTerm(text:string):boolean{
 return blockedPattern.test(normalizeTerm(text));
}
