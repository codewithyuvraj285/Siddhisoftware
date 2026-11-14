/* Optional tiny static server for local preview:  node server.js  ->  http://localhost:4000
   On live hosting you can upload this folder as plain static files instead. */
const http=require('http'),fs=require('fs'),path=require('path');
const M={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm','.json':'application/json'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(__dirname,path.normalize(p));
if(!f.startsWith(__dirname)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('Not found')}
r.writeHead(200,{'Content-Type':M[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)}).listen(process.env.PORT||4000,()=>console.log('Site: http://localhost:4000'));
