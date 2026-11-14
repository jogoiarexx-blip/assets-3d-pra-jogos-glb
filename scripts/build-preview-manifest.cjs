'use strict';
// Copy only genuine, SHA-addressed, small WebP previews into the Pages artifact.
const fs=require('node:fs');
const path=require('node:path');
const source='previews';
const target='_site/previews';
fs.mkdirSync(target,{recursive:true});
const hashes=[];
const qualityFile='reports/preview-quality.json';
const excluded=new Set();
if(fs.existsSync(qualityFile)){
  const health=JSON.parse(fs.readFileSync(qualityFile,'utf8'));
  for(const item of health.items||[]){
    if(item.status!=='usable' && /^[a-f0-9]{20}$/.test(item.sha||'')) excluded.add(item.sha);
  }
}
for(const entry of fs.existsSync(source)?fs.readdirSync(source):[]){
  if(!/^[a-f0-9]{20}\.webp$/.test(entry))continue;
  if(excluded.has(entry.slice(0,20))){console.warn('Miniatura reprovada pelo relatório: '+entry);continue;}
  const data=fs.readFileSync(path.join(source,entry));
  if(data.length<550||data.length>81920||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP'){
    console.warn('Ignorando miniatura inválida: '+entry);
    continue;
  }
  fs.writeFileSync(path.join(target,entry),data);
  hashes.push(entry.slice(0,20));
}
hashes.sort();
const payload=JSON.stringify({version:1,hashes},null,2)+'\n';
fs.writeFileSync(path.join(target,'manifest.json'),payload);
// Persist the same manifest beside WebPs for repositories using branch-based Pages.
if(fs.existsSync(source))fs.writeFileSync(path.join(source,'manifest.json'),payload);
console.log('Miniaturas WebP publicadas: '+hashes.length);