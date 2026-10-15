#!/usr/bin/env node
// A local copy of the host for development, on port 8807 (the text hosts use 8801-8806). Run `pnpm build`/`npm run build` first.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const port = Number(process.env.PORT ?? 8807);
createServer((req, res) => {
  const name = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '');
  const file = join(site, name);
  if (!name || name.includes('..') || name === '_headers' || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { 'Access-Control-Allow-Origin': '*' }); res.end('not published'); return; }
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`http://localhost:${port}/ExternalPurpose1Code`));
