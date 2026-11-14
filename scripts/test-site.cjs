'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root='_site';
const assets=JSON.parse(fs.readFileSync(path.join(root,'catalogo.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'previews/manifest.json'),'utf8'));
assert(Array.isArray(assets),'catálogo deve ser uma lista');
assert(Array.isArray(manifest.hashes),'manifesto WebP inválido');
const allSHAs=new Set(assets.filter(x=>x.ext==='glb').map(x=>String(x.sha||'').slice(0,20)));
for(const hash of manifest.hashes){
  assert.match(hash,/^[0-9a-f]{20}$/);
  assert(allSHAs.has(hash),'miniatura sem GLB correspondente: '+hash);
  const buf=fs.readFileSync(path.join(root,'previews',hash+'.webp'));
  assert(buf.length>=550 && buf.length<81921 && buf.toString('ascii',0,4)==='RIFF' && buf.toString('ascii',8,12)==='WEBP');
}
assert(manifest.hashes.length===new Set(manifest.hashes).size,'SHA duplicado no manifesto');
const qualityFile='reports/preview-quality.json';
if(fs.existsSync(qualityFile)){
  const report=JSON.parse(fs.readFileSync(qualityFile,'utf8'));
  const bad=new Set((report.items||[]).filter(x=>x.status!=='usable').map(x=>x.sha));
  for(const hash of manifest.hashes) assert(!bad.has(hash),'miniatura reprovada incluída no manifesto');
}
const app=fs.readFileSync('app.js','utf8');
assert(app.includes('staticPreviewHashes.has(previewHash(a))'),'a aplicação deve usar WebP');
assert(app.includes("preparePreview(a,stage,true)"),'prévia sob demanda deve continuar disponível');
assert(app.includes("const REPO_RAW='https://raw.githubusercontent.com/"),'URL original dos modelos preservada');
assert(!app.includes('queueObserve(thumb,a,stage);'),'catálogo não pode iniciar download automático de GLBs');
const page=fs.readFileSync('index.html','utf8');
assert(page.includes('Miniaturas WebP'));
console.log('Teste de catálogo, miniaturas, fallback 3D e links: OK ('+assets.length+' assets; '+manifest.hashes.length+' WebPs).');