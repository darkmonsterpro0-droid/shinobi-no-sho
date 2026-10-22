import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{
  let requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(requestPath.startsWith('/systems/shinobi-no-sho/'))requestPath=requestPath.slice('/systems/shinobi-no-sho'.length);if(requestPath==='/')requestPath='/preview/index.html';
  const file=path.resolve(root,'.'+requestPath);if(!file.startsWith(root+path.sep))throw Error('Forbidden');if(!(await stat(file)).isFile())throw Error('Not found');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
}catch{res.writeHead(404);res.end('Not found');}});
server.listen(Number(process.env.PORT??4173),'127.0.0.1',()=>console.log('Prévia local: http://127.0.0.1:'+server.address().port));
