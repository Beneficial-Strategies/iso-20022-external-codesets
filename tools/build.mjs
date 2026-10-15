#!/usr/bin/env node
// Builds the host from source/: one JSON file per code set, plus /coverage and /manifest. Plain files, no extension (see README.md).
//   node tools/build.mjs [--out site]
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeSets } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--out');
const out = resolve(root, i > 0 ? process.argv[i + 1] : 'site');

const info = JSON.parse(readFileSync(join(root, 'source/source.json'), 'utf8'));
const sets = codeSets(JSON.parse(readFileSync(join(root, 'source/ExternalCodeSets.json'), 'utf8')));
const json = (o) => JSON.stringify(o, null, 1) + '\n';

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const s of sets) writeFileSync(join(out, s.type), json({ ...s, release: info.release }));
writeFileSync(join(out, 'coverage'), json({
  release: info.release,
  codeSets: sets.map((s) => ({ type: s.type, values: s.values.length })),
}));
writeFileSync(join(out, 'manifest'), json({
  release: info.release,
  source: { url: info.url, file: info.file, retrievedAt: info.retrievedAt, sha256: info.sha256 },
  codeSets: info.codeSets,
  values: info.values,
  convention: 'v0',
}));
// every path answers JSON, for any origin; the lists change about quarterly, so a short cache with a long stale window is plenty
writeFileSync(join(out, '_headers'), `/*\n  Content-Type: application/json; charset=utf-8\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=300, stale-while-revalidate=86400\n`);
console.log(`built ${sets.length} code sets (${info.release}) in ${out}`);
