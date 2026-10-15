#!/usr/bin/env node
// Downloads ISO's external code sets, and if they differ from what source/ holds, replaces source/. Run nightly by .github/workflows/nightly.yml.
//   node tools/fetch.mjs [--zip <file>]       --zip uses a file already downloaded (tests, or a manual look) instead of ISO's address
// Exit 0 whether or not anything changed (it says which, and writes `changed=true|false` to $GITHUB_OUTPUT); exit 1 if what it got is not usable.
// It never writes a file it could not read back with tools/lib.mjs, and it refuses a file that has lost more than a tenth of the code sets.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeSets, releaseOf } from './lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_ZIP = 'https://www.iso20022.org/sites/default/files/media/file/ExternalCodeSets_JSON.zip';
const sourceDir = join(root, 'source');
const jsonFile = join(sourceDir, 'ExternalCodeSets.json');
const infoFile = join(sourceDir, 'source.json');
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const say = (changed) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`); };
const fail = (msg) => { console.error(`fetch: ${msg}`); process.exit(1); };

const work = join(root, '_download');
mkdirSync(work, { recursive: true });
let zip = arg('--zip');
let lastModified;
if (!zip) {
  const res = await fetch(URL_ZIP, { headers: { 'User-Agent': 'iso-20022-external-codesets (+https://github.com/Beneficial-Strategies/iso-20022-external-codesets)' } });
  if (!res.ok) fail(`ISO answered ${res.status}`);
  lastModified = res.headers.get('last-modified') ?? undefined;
  zip = join(work, 'ExternalCodeSets_JSON.zip');
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
}

// the zip holds one JSON file; `unzip` is on every GitHub runner and every developer machine
const names = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).split('\n').filter((n) => /\.json$/i.test(n.trim()));
if (names.length !== 1) fail(`expected one .json file in the zip, found ${names.length}: ${names.join(', ')}`);
const entry = names[0].trim();
const bytes = execFileSync('unzip', ['-p', zip, entry], { maxBuffer: 64 * 1024 * 1024 });
const sha256 = createHash('sha256').update(bytes).digest('hex');

let json;
try { json = JSON.parse(bytes.toString('utf8')); } catch (e) { fail(`the JSON file does not parse: ${e.message}`); }
let sets;
try { sets = codeSets(json); } catch (e) { fail(e.message); }
if (sets.length < 100) fail(`only ${sets.length} code sets in the file; refusing it`);

const old = existsSync(infoFile) ? JSON.parse(readFileSync(infoFile, 'utf8')) : null;
if (old && old.codeSets && sets.length < old.codeSets * 0.9) fail(`the file has ${sets.length} code sets, ${old.codeSets} before; refusing it`);
if (old && old.sha256 === sha256) { console.log(`unchanged (${old.release}, ${sets.length} code sets)`); say(false); process.exit(0); }

mkdirSync(sourceDir, { recursive: true });
writeFileSync(jsonFile, bytes);
const info = { url: URL_ZIP, file: entry, release: releaseOf(entry), sha256, codeSets: sets.length, values: sets.reduce((n, s) => n + s.values.length, 0), lastModified, retrievedAt: new Date().toISOString() };
writeFileSync(infoFile, JSON.stringify(info, null, 2) + '\n');
console.log(`changed: ${old ? `${old.release} -> ` : ''}${info.release}, ${info.codeSets} code sets, ${info.values} codes`);
say(true);
