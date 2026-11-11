import {describe,it,expect} from 'vitest';
import {deadlineInput,deadlineIso} from '../lib/submission-deadline';

describe('Vietnam submission deadline input',()=>{
 it('converts Vietnam midnight across UTC date boundaries',()=>{
  expect(deadlineIso('2026-11-21T00:00')).toBe('2026-11-20T17:00:00.000Z');
  expect(deadlineInput('2026-11-20T17:00:00.000Z')).toBe('2026-11-21T00:00');
 });
 it('handles clearing and rejects impossible or malformed dates',()=>{
  expect(deadlineInput(null)).toBe('');
  for(const value of ['', '2026-02-30T12:00', '2026-11-21', '2026-11-21T25:00', 'invalid'])expect(deadlineIso(value)).toBeNull();
 });
});
