import { mkdir, copyFile, rm } from 'node:fs/promises';
// Publish only explicitly selected assets; never copy research CSVs or repository metadata.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
await mkdir(new URL('../dist/', import.meta.url));
for (const [source, target] of [['index.html','index.html'], ['static/_headers','_headers'], ['static/404.html','404.html']]) {
  await copyFile(new URL('../' + source, import.meta.url), new URL('../dist/' + target, import.meta.url));
}
