'use strict';
// Copy only genuine, SHA-addressed, small WebP previews into the Pages artifact.
const fs=require('node:fs');
const path=require('node:path');
const source='previews';
const target='_site/previews';
fs.mkdirSync(target,{recursive:true});
const hashes=[];
for(const entry of fs.existsSync(source)?fs.readdirSync(source):[]){
  if(!/^[a-f0-9]{20}\.webp$/.test(entry))continue;
  const data=fs.readFileSync(path.join(source,entry));
  if(data.length<24||data.length>81920||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP'){
    console.warn('Ignorando miniatura inválida: '+entry);
    continue;
  }
  fs.writeFileSync(path.join(target,entry),data);
  hashes.push(entry.slice(0,20));
}
hashes.sort();
fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify({version:1,hashes},null,2)+'\n');
console.log('Miniaturas WebP publicadas: '+hashes.length);