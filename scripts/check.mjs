import { access, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { stories } from '../src/stories.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(`${root}index.html`, 'utf8');
const paths = [...html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)].map((match) => match[1]);
for (const relative of paths) await access(`${root}${relative.startsWith('src/') ? '' : 'public/'}${relative}`);
for (const story of stories) {
  if (!story.photos.length) throw new Error(`Empty story: ${story.id}`);
  for (const image of story.images) await access(`${root}public/photos/${image}.webp`);
}
const css = await readFile(`${root}src/fonts.css`, 'utf8');
for (const match of css.matchAll(/url\(\.\.\/([^\)]+)\)/g)) await access(`${root}public/${match[1]}`);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(match[1])) throw new Error(`Broken anchor ${match[1]}`);
const photos = await readdir(`${root}public/photos`);
console.log(`Checked ${stories.length} stories, ${photos.length} image files, local fonts and all HTML anchors.`);
