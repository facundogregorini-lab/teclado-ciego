// Local server that mimics Vercel: serves index.html and runs api/*.js with an in-memory database.
// Usage: npm run dev  →  http://127.0.0.1:3000
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
process.env.TECLADO_MEMORY_DB ??= '1';

function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const match = /^\/api\/([a-z]+)$/.exec(url.pathname);
    if (!match) {
      const publicFiles = new Set(['/scenery.css', '/scenery.js', '/typists.css', '/typists.js', ...['beach', 'mountains', 'forest'].flatMap(name => ['/assets/' + name + '.jpg', '/assets/' + name + '-thumb.jpg'])]);
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      if (pathname !== '/index.html' && !publicFiles.has(pathname)) { res.statusCode = 404; return res.end('Not found'); }
      const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg' };
      res.setHeader('Content-Type', types[path.extname(pathname)]);
      return res.end(fs.readFileSync(path.join(root, pathname)));
    }
    const file = path.join(root, 'api', match[1] + '.js');
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('{}'); }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); return res; };
    await require(file)(req, res);
  });
}

module.exports = { createServer };
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, '127.0.0.1', () => console.log('Teclado Ciego en http://127.0.0.1:' + port));
}
