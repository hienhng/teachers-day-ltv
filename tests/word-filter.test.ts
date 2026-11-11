import {describe,it,expect} from 'vitest';
import {blockedTerms,containsBlockedTerm} from '../lib/word-filter';

describe('automatic blocked term filter',()=>{
 it.each(blockedTerms)('rejects the whole term %s',term=>{
  expect(containsBlockedTerm(`Cảm ơn cô ${term}!`)).toBe(true);
  expect(containsBlockedTerm(term.toUpperCase())).toBe(true);
 });
 it.each(['d.c.m','v c l','ĐCM','ｄｃｍ','d\u200bcm','DCMM!','v-c-c','c_m_m','b.t.s','c l m'])('detects normalized and separated terms: %s',text=>{
  expect(containsBlockedTerm(text)).toBe(true);
 });
 it.each(['ＦＵＣＫ','f.u.c.k','sh\u200bit','MÍERDA','SCHEIẞE','foda se','Б.Л.Я.Т.Ь','傻 逼','ク ソ','씨\u200b발','كُس أُمّك','बहनचोद'])('detects multilingual normalization and obfuscation: %s',text=>{
  expect(containsBlockedTerm(text)).toBe(true);
 });
 it.each(['Gracias por todo, profesora.','Merci beaucoup !','Danke schön!','Obrigado, professora!','Спасибо за уроки!',
  '老师，谢谢您！','先生、ありがとうございます！','선생님 감사합니다!','شكراً يا معلمتي','शिक्षक जी धन्यवाद',
  'Scunthorpe','classical','assignment','shitake','Merdeka','computadora','señorita','Arschlochkuchen',
 ])('preserves multilingual gratitude and longer words: %s',text=>{
  expect(containsBlockedTerm(text)).toBe(false);
 });
 it.each(['Em cảm ơn cô rất nhiều!','Cô Lan','Nguyễn Văn Lâm','BTSchool','avclub','adcmx','lovely','abcdcm','vcl123'])('preserves ordinary text and longer words: %s',text=>{
  expect(containsBlockedTerm(text)).toBe(false);
 });
});
