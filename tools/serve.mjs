import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server = createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const relative = (pathname.endsWith('/') ? pathname + 'index.html' : pathname).slice(1);
    const file = resolve(root,relative);
    const allowed = relative === 'index.html' || relative === 'tools/responsive-check.html' || /^landings\/[^/]+\/(index\.html|styles\.css|script\.js|robots\.txt|sitemap\.xml|assets\/.+|images\/.+)$/.test(relative);
    if (!file.startsWith(root + sep) || !allowed || !(await stat(file)).isFile()) throw new Error('Not found');
    const type=mime[extname(file)] || 'application/octet-stream';
    const body=await readFile(file);
    const compressed=body.length>1024 && /text|xml/.test(type) && /gzip/.test(req.headers['accept-encoding']||'');
    res.writeHead(200, {'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Vary':'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});
    res.end(req.method==='HEAD'?undefined:compressed?gzipSync(body):body);
  } catch {
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    res.end('Страница не найдена');
  }
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
