#!/usr/bin/env node
// What changed between two copies of ISO's file, as Markdown (for the body of the nightly pull request).
//   node tools/diff.mjs <old.json> <new.json>
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { codeSets } from './lib.mjs';

export function diff(oldJson, newJson) {
  const a = new Map(codeSets(oldJson).map((s) => [s.type, s]));
  const b = new Map(codeSets(newJson).map((s) => [s.type, s]));
  const out = [];
  const addedSets = [...b.keys()].filter((t) => !a.has(t));
  const removedSets = [...a.keys()].filter((t) => !b.has(t));
  if (addedSets.length) out.push(`**New code sets (${addedSets.length}):** ${addedSets.map((t) => `\`${t}\` (${b.get(t).values.length} codes)`).join(', ')}`);
  if (removedSets.length) out.push(`**Removed code sets (${removedSets.length}):** ${removedSets.map((t) => `\`${t}\``).join(', ')}`);
  for (const [type, s] of b) {
    const o = a.get(type);
    if (!o) continue;
    const before = new Map(o.values.map((v) => [v.value, v]));
    const after = new Map(s.values.map((v) => [v.value, v]));
    const added = s.values.filter((v) => !before.has(v.value));
    const removed = o.values.filter((v) => !after.has(v.value));
    const changed = s.values.filter((v) => before.has(v.value) && before.get(v.value).text !== v.text);
    if (!added.length && !removed.length && !changed.length) continue;
    out.push(`### ${type}`);
    for (const v of added) out.push(`- added \`${v.value}\`: ${v.text.split('\n')[0].slice(0, 160)}`);
    for (const v of removed) out.push(`- removed \`${v.value}\`: ${v.text.split('\n')[0].slice(0, 160)}`);
    for (const v of changed) out.push(`- reworded \`${v.value}\``);
  }
  return out.length ? out.join('\n') : 'No code or text differs; ISO changed something else in the file (for example the schema).';
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [oldFile, newFile] = process.argv.slice(2);
  if (!oldFile || !newFile) { console.error('usage: node tools/diff.mjs <old.json> <new.json>'); process.exit(1); }
  console.log(diff(JSON.parse(readFileSync(oldFile, 'utf8')), JSON.parse(readFileSync(newFile, 'utf8'))));
}
