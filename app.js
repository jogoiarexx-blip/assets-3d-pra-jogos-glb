'use strict';
const categories={
  veiculos:{label:'Veículos',icon:'🚗'},
  chaves:{label:'Turma do Chaves',icon:'🏠'},
  dragoes:{label:'Dragões',icon:'🐉'},
  dinossauros:{label:'Dinossauros e Dino Crisis',icon:'🦖'},
  personagens:{label:'Personagens',icon:'🧍'},
  criaturas:{label:'Criaturas e animais',icon:'🐾'},
  cenarios:{label:'Cenários e mapas',icon:'🏙️'},
  natureza:{label:'Natureza',icon:'🌿'},
  armas:{label:'Armas e itens',icon:'🪓'},
};
const $=id=>document.getElementById(id);
let all=[],category='all',kind='all',search='',current=null;
function assetURL(a){return new URL(a.path.split('/').map(encodeURIComponent).join('/'),document.baseURI).href;}
function formatSize(n){return n>=1e6?(n/1e6).toFixed(1)+' MB':n>=1e3?Math.round(n/1e3)+' KB':n+' B';}
function isImage(a){return /^(png|jpe?g|webp|gif|svg|avif)$/i.test(a.ext);}
function isArchive(a){return /^(zip|rar|7z)$/i.test(a.ext);}
function iconFor(a){return isImage(a)?'🖼️':isArchive(a)?'📦':categories[a.category]?.icon||'🧊';}
function typeFor(a){return isImage(a)?'image':isArchive(a)?'archive':'glb';}
function filtered(){return all.filter(a=>(category==='all'||a.category===category)&&(kind==='all'||kind===typeFor(a))&&(!search||[a.name,a.category,categories[a.category]?.label].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(search)));}
function loadFilters(){const q=new URLSearchParams(location.search);const c=q.get('pasta');if(c&&categories[c])category=c;}
function setCategory(c){category=c;const u=new URL(location.href);if(c==='all')u.searchParams.delete('pasta');else u.searchParams.set('pasta',c);history.replaceState(null,'',u);render();}
function renderCategories(){const box=$('categories');box.replaceChildren();let entries=[['all',{label:'Todos',icon:'🗂️'}],...Object.entries(categories)];entries.forEach(([key,v])=>{const total=key==='all'?all.length:all.filter(a=>a.category===key).length;if(!total)return;const b=document.createElement('button');b.type='button';b.className='cat'+(category===key?' active':'');b.setAttribute('aria-pressed',String(category===key));b.textContent=v.icon+' '+v.label+' ';const n=document.createElement('b');n.textContent=total;b.append(n);b.addEventListener('click',()=>setCategory(key));box.append(b);});}
function createCard(a){const article=document.createElement('article');article.className='asset';const thumb=document.createElement('div');thumb.className='thumb';const imageType=isImage(a);if(imageType){const im=document.createElement('img');im.src=assetURL(a);im.alt='Imagem: '+a.name;im.loading='lazy';thumb.append(im);}else{const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=iconFor(a);thumb.append(symbol);}
const tag=document.createElement('span');tag.className='pill'+(a.broken?' broken':'');tag.textContent=a.broken?'ARQUIVO INCOMPLETO':a.ext.toUpperCase();thumb.append(tag);
const body=document.createElement('div');body.className='assetbody';
const fld=document.createElement('div');fld.className='folder';fld.textContent=categories[a.category]?.label||a.category;
const name=document.createElement('h3');name.textContent=a.name;
const meta=document.createElement('div');meta.className='meta';const size=document.createElement('span');size.textContent=formatSize(a.bytes);const typ=document.createElement('span');typ.textContent=imageType?'Imagem':isArchive(a)?'Pacote':'Modelo 3D';meta.append(typ,size);
const buttons=document.createElement('div');buttons.className='assetbuttons';
const view=document.createElement('button');view.type='button';view.textContent=a.broken?'Indisponível':isArchive(a)?'Detalhes':imageType?'Ver imagem':'Visualizar 3D';view.disabled=!!a.broken;view.addEventListener('click',()=>openAsset(a));
const down=document.createElement('a');down.href=assetURL(a);down.setAttribute('download',a.name);down.textContent='Baixar ↓';down.title='Baixar '+a.name;buttons.append(view,down);body.append(fld,name,meta,buttons);article.append(thumb,body);return article;}
function render(){renderCategories();const arr=filtered();$('results').textContent=arr.length+' arquivo'+(arr.length!==1?'s':'')+' encontrado'+(arr.length!==1?'s':'');const grid=$('grid');grid.replaceChildren();if(!arr.length){const p=document.createElement('p');p.className='empty';p.textContent='Nenhum arquivo encontrado. Tente outra busca ou categoria.';grid.append(p);return;}const fragment=document.createDocumentFragment();arr.forEach(a=>fragment.append(createCard(a)));grid.append(fragment);}
function openAsset(a){current=a;$('viewCategory').textContent=categories[a.category]?.label||a.category;$('viewName').textContent=a.name;$('viewInfo').textContent=a.ext.toUpperCase()+' · '+formatSize(a.bytes);$('download').href=assetURL(a);$('download').setAttribute('download',a.name);const vp=$('viewport');vp.replaceChildren();const hint=$('viewHint');
if(isImage(a)){const img=document.createElement('img');img.src=assetURL(a);img.alt=a.name;vp.append(img);hint.textContent='Imagem na resolução original. Use o botão de download para salvar.';}
else if(isArchive(a)){const p=document.createElement('div');p.className='previewerror';p.textContent='📦 Pacote compactado. Baixe para ver os arquivos incluídos.';vp.append(p);hint.textContent='Pacotes ZIP e RAR não têm visualização direta no navegador.';}
else{const m=document.createElement('model-viewer');m.setAttribute('src',assetURL(a));m.setAttribute('alt','Modelo 3D: '+a.name);m.setAttribute('camera-controls','');m.setAttribute('auto-rotate','');m.setAttribute('shadow-intensity','1');m.setAttribute('exposure','1');m.setAttribute('environment-image','neutral');m.setAttribute('interaction-prompt','auto');m.setAttribute('loading','eager');m.setAttribute('reveal','auto');m.addEventListener('error',()=>{hint.textContent='Não foi possível abrir este GLB. O arquivo pode estar danificado ou o navegador pode ter bloqueado o carregamento.';});m.addEventListener('load',()=>{if(m.availableAnimations?.length){const sel=document.createElement('select');sel.setAttribute('aria-label','Escolher animação');const first=document.createElement('option');first.value='';first.textContent='Sem animação';sel.append(first);m.availableAnimations.forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;sel.append(o);});sel.addEventListener('change',()=>{m.animationName=sel.value||undefined;m.paused=!sel.value;if(sel.value)m.play();});hint.replaceChildren(document.createTextNode('Arraste para girar • role para aproximar • Animação: '),sel);}else hint.textContent='Arraste para girar • use o scroll ou gesto de pinça para aproximar.';});vp.append(m);hint.textContent='Carregando modelo 3D… (arquivos maiores podem demorar).';}
$('viewer').showModal();}
function closeViewer(){$('viewer').close();$('viewport').replaceChildren();current=null;}
$('close').addEventListener('click',closeViewer);
$('viewer').addEventListener('click',e=>{if(e.target===$('viewer'))closeViewer();});
$('viewer').addEventListener('close',()=>{$('viewport').replaceChildren();current=null;});
$('copy').addEventListener('click',async()=>{if(!current)return;try{await navigator.clipboard.writeText(assetURL(current));$('copy').textContent='Link copiado!';setTimeout(()=>$('copy').textContent='Copiar link',2000);}catch{window.prompt('Copie o link:',assetURL(current));}});
$('search').addEventListener('input',e=>{search=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();render();});
$('kind').addEventListener('change',e=>{kind=e.target.value;render();});
(async function(){loadFilters();try{const res=await fetch('./catalogo.json',{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);all=await res.json();$('countAll').textContent=all.length;$('countGlb').textContent=all.filter(a=>a.ext==='glb').length;$('countCat').textContent=new Set(all.map(a=>a.category)).size;render();}catch(e){$('results').textContent='Erro ao carregar catálogo';$('grid').textContent='Não foi possível ler catalogo.json: '+e.message;}})();
