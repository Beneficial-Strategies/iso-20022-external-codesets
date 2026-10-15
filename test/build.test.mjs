import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const out = mkdtempSync(join(tmpdir(), 'codesets-'));
execFileSync('node', ['tools/build.mjs', '--out', out], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });
const read = (name) => JSON.parse(readFileSync(join(out, name), 'utf8'));

test('one file per code set, with no extension', () => {
  const names = readdirSync(out);
  const coverage = read('coverage');
  assert.ok(coverage.codeSets.length >= 150);
  for (const c of coverage.codeSets) {
    assert.ok(names.includes(c.type), `${c.type} is not a file`);
    assert.equal(read(c.type).values.length, c.values);
    assert.equal(read(c.type).release, coverage.release);
  }
});

test('/manifest says where the data came from', () => {
  const m = read('manifest');
  assert.match(m.release, /^\dQ\d{4} v\d+$/);
  assert.match(m.source.sha256, /^[0-9a-f]{64}$/);
  assert.equal(m.convention, 'v0');
});

test('/_headers lets any origin read JSON', () => {
  const h = readFileSync(join(out, '_headers'), 'utf8');
  assert.match(h, /Access-Control-Allow-Origin: \*/);
  assert.match(h, /application\/json/);
});
