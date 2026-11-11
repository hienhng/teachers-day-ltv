import {describe,it,expect} from 'vitest';
import {validVerdict,verdictDecision,type ModerationCategory} from '../lib/moderation-policy';

describe('moderation policy boundaries',()=>{
 it('approves only appropriate content at the approval threshold',()=>{
  expect(verdictDecision({decision:'approve',category:'appropriate',confidence:.95}).status).toBe('approved');
  expect(verdictDecision({decision:'approve',category:'appropriate',confidence:.949}).status).toBe('pending');
  expect(verdictDecision({decision:'reject',category:'appropriate',confidence:1}).status).toBe('pending');
 });
 it.each(['spam','abuse','sexual','threat','hate'] as ModerationCategory[])('requires the rejection threshold for %s',category=>{
  expect(verdictDecision({decision:'reject',category,confidence:.98}).status).toBe('rejected');
  expect(verdictDecision({decision:'reject',category,confidence:.979}).status).toBe('pending');
  expect(verdictDecision({decision:'approve',category,confidence:1}).status).toBe('pending');
 });
 it.each(['personal_info','uncertain'] as ModerationCategory[])('always sends %s to a human',category=>{
  for(const decision of ['approve','reject','review'] as const)expect(verdictDecision({decision,category,confidence:1}).status).toBe('pending');
 });
 it.each([undefined,[],{},null,{decision:'approve',category:'appropriate',confidence:'1'},
  {decision:'approve',category:'appropriate',confidence:NaN},
  {decision:'approve',category:'appropriate',confidence:Infinity},
  {decision:'approve',category:'appropriate',confidence:-.1},
  {decision:'approve',category:'appropriate',confidence:1.1},
 ])('validates actual runtime values: %j',value=>expect(validVerdict(value)).toBe(false));
});
