'use strict';
// Read-only structural GLB analysis. Never modifies or re-encodes the asset.
const fs=require('node:fs');
const p=process.argv[2];
if(!p){console.error('Uso: node scripts/audit-glb.cjs modelo.glb');process.exit(2);}
const b=fs.readFileSync(p);
if(b.length<20||b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.toString('ascii',16,20)!=='JSON'){
  throw Error('GLB v2 inválido ou truncado: '+p);
}
const n=b.readUInt32LE(12);
if(n> b.length-20)throw Error('JSON GLB truncado');
const doc=JSON.parse(b.subarray(20,20+n).toString('utf8'));
let primitives=0,estimatedTriangles=0,vertices=0,morphTargets=0;
for(const mesh of doc.meshes||[])for(const prim of mesh.primitives||[]){
  primitives++;
  const positions=doc.accessors?.[prim.attributes?.POSITION];
  const indices=doc.accessors?.[prim.indices];
  const count=Number(indices?.count??positions?.count??0);
  const mode=prim.mode??4;
  if(mode===4)estimatedTriangles+=Math.floor(count/3);
  else if(mode===5||mode===6)estimatedTriangles+=Math.max(0,count-2);
  vertices+=Number(positions?.count||0);
  morphTargets+=prim.targets?.length||0;
}
let embeddedTextureBytes=0;
const images=(doc.images||[]).map(img=>{
  const size=img.bufferView===undefined?0:doc.bufferViews?.[img.bufferView]?.byteLength||0;
  embeddedTextureBytes+=size;
  return {mimeType:img.mimeType||null,bytes:size,external:!!img.uri};
});
const result={
  path:p,bytes:b.length,meshes:doc.meshes?.length||0,primitives,
  estimatedTriangles,positionAccessorVertices:vertices,morphTargets,
  skins:doc.skins?.length||0,animations:doc.animations?.length||0,
  animationChannels:(doc.animations||[]).reduce((a,x)=>a+(x.channels?.length||0),0),
  materials:doc.materials?.length||0,textures:doc.textures?.length||0,
  images,embeddedTextureBytes,
  extensionsUsed:doc.extensionsUsed||[],extensionsRequired:doc.extensionsRequired||[],
  safety:{
    keepOriginalUntilVisualAndAnimationComparison:true,
    preserveSkinsAnimationsAndMorphTargets:true,
    preserveTextureAppearanceAndUVs:true,
    note:'Números geométricos são aproximações; análise não modifica o GLB.'
  }
};
console.log(JSON.stringify(result));