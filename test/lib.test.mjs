import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { diff } from '../tools/diff.mjs';
import { codeSet, codeSets, releaseOf } from '../tools/lib.mjs';

const real = JSON.parse(readFileSync(new URL('../source/ExternalCodeSets.json', import.meta.url), 'utf8'));

test('the release is read from ISO\'s file name', () => {
  assert.equal(releaseOf('2Q2026_externalcodesets_v3.json'), '2Q2026 v3');
  assert.equal(releaseOf('something_else.json'), 'something_else');
});

test('a code set: codes, verbatim text, a name only where the text says "Name - definition"', () => {
  const s = codeSet('ExternalDemo1Code', {
    type: 'string', minLength: 1, maxLength: 4, enum: ['AAAA', 'BBBB', 'CCCC'],
    description: 'Specifies the demo code.\r\nThe list of valid codes is an external code list published separately.\n*`AAAA`-Alpha Code (AC) - the first one.\n*`BBBB`-Bank Branch code used in Austria.\n*`CCCC`-Third one\n  continues on a second line.',
  });
  assert.equal(s.definition, 'Specifies the demo code.');
  assert.deepEqual(s.length, { min: 1, max: 4 });
  assert.deepEqual(s.values, [
    { value: 'AAAA', text: 'Alpha Code (AC) - the first one.', name: 'Alpha Code (AC)' },
    { value: 'BBBB', text: 'Bank Branch code used in Austria.' },
    { value: 'CCCC', text: 'Third one\ncontinues on a second line.' },
  ]);
});

test('a code set without values stays a code set with none', () => {
  const s = codeSet('ExternalNone1Code', { type: 'string', minLength: 1, maxLength: 35, description: 'Specifies something. External code sets can be downloaded from www.iso20022.org.' });
  assert.deepEqual(s.values, []);
});

test('codes in the text that differ from enum are refused', () => {
  assert.throws(() => codeSet('X', { enum: ['A'], description: '*`B`-b' }), /not the codes in enum/);
});

test('ISO\'s real file: every set reads, the codes match enum, and the numbers are in the expected range', () => {
  const sets = codeSets(real);
  assert.ok(sets.length >= 150, `${sets.length} code sets`);
  assert.ok(sets.reduce((n, s) => n + s.values.length, 0) >= 3000);
  assert.ok(sets.find((s) => s.type === 'ExternalPurpose1Code').values.some((v) => v.value === 'SALA'));
  for (const s of sets) for (const v of s.values) assert.ok(v.text.length > 0, `${s.type}/${v.value} has no text`);
});

test('the diff names added, removed and reworded codes', () => {
  const a = { definitions: { ExternalA1Code: { enum: ['X', 'Y'], description: '*`X`-x one\n*`Y`-y one' } } };
  const b = { definitions: { ExternalA1Code: { enum: ['X', 'Z'], description: '*`X`-x reworded\n*`Z`-z new' }, ExternalB1Code: { enum: ['Q'], description: '*`Q`-q' } } };
  const md = diff(a, b);
  assert.match(md, /New code sets \(1\):\*\* `ExternalB1Code`/);
  assert.match(md, /### ExternalA1Code/);
  assert.match(md, /added `Z`/);
  assert.match(md, /removed `Y`/);
  assert.match(md, /reworded `X`/);
  assert.match(diff(a, a), /No code or text differs/);
});
