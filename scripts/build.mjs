import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const output = `${projectRoot}dist`;
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(`${projectRoot}index.html`, `${output}/index.html`);
await cp(`${projectRoot}src`, `${output}/src`, { recursive: true });
await cp(`${projectRoot}public`, output, { recursive: true });
console.log('Built dist/ — HTML, CSS, JavaScript, local photographs and fonts.');
