import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const production = process.argv.includes('--dist');
const root = production ? path.join(projectRoot, 'dist') : projectRoot;
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };

const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); return response.end(); }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let allowedRoot;
    let relativePath;
    if (production) { allowedRoot = root; relativePath = pathname === '/' ? 'index.html' : pathname.slice(1); }
    else if (pathname === '/' || pathname === '/index.html') { allowedRoot = root; relativePath = 'index.html'; }
    else if (pathname.startsWith('/src/')) { allowedRoot = path.join(root, 'src'); relativePath = pathname.slice(5); }
    else { allowedRoot = path.join(root, 'public'); relativePath = pathname.slice(1); }
    const file = path.resolve(allowedRoot, relativePath);
    if (file !== allowedRoot && !file.startsWith(allowedRoot + path.sep)) throw new Error('Invalid path');
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    try { response.end(await readFile(path.join(root, production ? '404.html' : 'public/404.html'))); }
    catch { response.end('Страница не найдена'); }
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
