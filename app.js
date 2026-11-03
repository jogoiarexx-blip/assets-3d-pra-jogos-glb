'use strict';

/* REXX Assets: live GLB thumbnail rendering + IndexedDB preview cache.
 * Only one model is rendered for a thumbnail at a time.
 * No thumbnail is fabricated from a filename or stock image.
 */
const CATEGORIES={
  veiculos:{label:'Veículos',icon:'🚗'},
  chaves:{label:'Turma do Chaves',icon:'🏠'},
  dragoes:{label:'Dragões',icon:'🐉'},
  dinossauros:{label:'Dino Crisis / Dinossauros',icon:'🦖'},
  personagens:{label:'Personagens e NPCs',icon:'🧍'},
  criaturas:{label:'Criaturas e animais',icon:'🐾'},
  cenarios:{label:'Cenários e mapas',icon:'🏙️'},
  natureza:{label:'Natureza',icon:'🌿'},
  armas:{label:'Armas e itens',icon:'🪓'}
};
const SUBNAMES={
  carros:'Carros',utilitarios:'Utilitários',pacotes:'Pacotes',
  personagens:'Personagens',dragoes:'Dragões',dinossauros:'Dinossauros',
  regina:'Regina',animais:'Animais',monstros:'Monstros',
  mapas:'Mapas',objetos:'Objetos',plantas:'Plantas',machados:'Machados',
  'driver-2':'Driver 2',outros:'Outros personagens'
};
const $=id=>document.getElementById(id);
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Keep initial page light; heavy GLBs are previewed only on explicit request.
const PAGE_SIZE=24;
const AUTO_PREVIEW_MAX_BYTES=18*1024*1024;
let visibleLimit=PAGE_SIZE;
let all=[],category='all',sub='all',kind='all',sort='name',search='',current=null;
let enabled=true,observer=null,previewQueue=[],working=false,previewFinished=0,previewErrors=0;
const awaiting=new Set();
let dbPromise;
function formatSize(bytes){return bytes>=1e6?(bytes/1e6).toFixed(1)+' MB':bytes>=1e3?Math.round(bytes/1000)+' KB':bytes+' B';}
function isImage(a){return /^(png|jpg|jpeg|webp|gif|avif|svg)$/i.test(a.ext);}
function isArchive(a){return /^(zip|rar|7z)$/i.test(a.ext);}
function typeFor(a){return isImage(a)?'image':isArchive(a)?'archive':'glb';}
function urlFor(a){return new URL(a.path.split('/').map(encodeURIComponent).join('/'),document.baseURI).href;}
function previewKey(a){return a.sha||a.legacyPath||a.path;}
function titleFor(a){return a.title||a.name.replace(/\.[^.]+$/,'').replace(/^Meshy_AI_/i,'').replace(/_texture$/i,'').replace(/_\d{10}$/,'').replace(/_/g,' ');}
function subLabel(k){return SUBNAMES[k]||k;}
function categoryLabel(k){return CATEGORIES[k]?.label||k;}
function archiveIcon(a){return isArchive(a)?'📦':isImage(a)?'🖼️':'⬡';}

function openDB(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise(resolve=>{
    if(!('indexedDB' in window)){resolve(null);return;}
    try{
      const req=indexedDB.open('rexx-assets-real-previews',1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('images'))db.createObjectStore('images');};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>resolve(null);
      req.onblocked=()=>resolve(null);
    }catch{resolve(null);}
  });
  return dbPromise;
}
async function getCached(key){
  const db=await openDB();if(!db)return null;
  return new Promise(resolve=>{
    try{const tx=db.transaction('images','readonly');const r=tx.objectStore('images').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);}
    catch{resolve(null);}
  });
}
async function putCached(key,data){
  const db=await openDB();if(!db)return;
  return new Promise(resolve=>{
    try{const tx=db.transaction('images','readwrite');tx.objectStore('images').put(data,key);tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();tx.onabort=()=>resolve();}
    catch{resolve();}
  });
}
function updateUrl(){
  const u=new URL(location.href);
  if(category==='all')u.searchParams.delete('pasta');else u.searchParams.set('pasta',category);
  if(sub==='all')u.searchParams.delete('sub');else u.searchParams.set('sub',sub);
  history.replaceState(null,'',u);
}
function readUrl(){
  const p=new URLSearchParams(location.search);
  category=p.has('pasta')&&CATEGORIES[p.get('pasta')]?p.get('pasta'):'all';
  sub=p.get('sub')||'all';
}
function chooseCategory(k){category=k;sub='all';visibleLimit=PAGE_SIZE;updateUrl();render();document.getElementById('biblioteca').scrollIntoView({behavior:'smooth',block:'start'});}
function chooseSub(k){sub=k;visibleLimit=PAGE_SIZE;updateUrl();render();}
function matching(){
  const arr=all.filter(a=>{
    if(category!=='all'&&a.category!==category)return false;
    if(sub!=='all'&&a.subCategory!==sub)return false;
    if(kind!=='all'&&typeFor(a)!==kind)return false;
    if(!search)return true;
    return normalize([titleFor(a),a.name,a.category,a.subCategory,categoryLabel(a.category),subLabel(a.subCategory),...(a.tags||[])].join(' ')).includes(search);
  });
  arr.sort((a,b)=>{
    if(sort==='size-small')return a.bytes-b.bytes||titleFor(a).localeCompare(titleFor(b),'pt-BR');
    if(sort==='size-large')return b.bytes-a.bytes||titleFor(a).localeCompare(titleFor(b),'pt-BR');
    if(sort==='format')return a.ext.localeCompare(b.ext)||titleFor(a).localeCompare(titleFor(b),'pt-BR');
    return titleFor(a).localeCompare(titleFor(b),'pt-BR',{numeric:true});
  });
  return arr;
}
function makeButton(label,cls,fn){
  const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.addEventListener('click',fn);return b;
}
function renderFolders(){
  const nav=$('folderNav');nav.replaceChildren();
  const items=[['all',{label:'Todos os assets',icon:'🗂️'}],...Object.entries(CATEGORIES)];
  for(const [key,info] of items){
    const count=key==='all'?all.length:all.filter(a=>a.category===key).length;if(!count)continue;
    const b=makeButton('', 'folderitem'+(category===key?' active':''),()=>chooseCategory(key));
    b.setAttribute('aria-pressed',String(category===key));
    const ico=document.createElement('span');ico.className='foldericon';ico.textContent=info.icon;
    const name=document.createElement('span');name.className='foldername';name.textContent=info.label;
    const number=document.createElement('span');number.className='foldercount';number.textContent=count;
    b.append(ico,name,number);nav.append(b);
  }
}
function renderSubs(){
  const area=$('subcategories');area.replaceChildren();
  if(category==='all'){const s=document.createElement('span');s.className='breadcrumbs';s.textContent='Selecione uma pasta para ver suas subpastas.';area.append(s);return;}
  const catAssets=all.filter(a=>a.category===category);
  const keys=[...new Set(catAssets.map(a=>a.subCategory))].sort((a,b)=>subLabel(a).localeCompare(subLabel(b),'pt-BR'));
  if(sub!=='all'&&!keys.includes(sub))sub='all';
  const items=[['all','Todos',catAssets.length],...keys.map(k=>[k,subLabel(k),catAssets.filter(a=>a.subCategory===k).length])];
  for(const [key,label,count] of items){
    const b=makeButton(label,'subcat'+(key===sub?' active':''),()=>chooseSub(key));
    b.setAttribute('aria-pressed',String(key===sub));
    const n=document.createElement('span');n.textContent=count;b.append(n);area.append(b);
  }
}
function statusText(){
  if(!enabled){$('previewStatus').textContent='Prévias automáticas desativadas. Ative para gerar imagens reais dos GLBs.';return;}
  if(working||previewQueue.length){
    $('previewStatus').textContent='Gerando prévias reais, uma por vez • '+previewFinished+' concluídas'+(previewErrors?' • '+previewErrors+' sem prévia':'')+'.';
  }else if(previewFinished){
    $('previewStatus').textContent=previewFinished+' prévias reais carregadas ou geradas neste acesso'+(previewErrors?' • '+previewErrors+' não carregadas':'')+'.';
  }else $('previewStatus').textContent='Miniaturas reais serão criadas ao aparecerem na tela; o primeiro acesso carrega os GLBs.';
}
function makeCard(a){
  const card=document.createElement('article');card.className='asset';
  const thumb=document.createElement('div');thumb.className='thumb';
  const stage=document.createElement('div');stage.className='thumb-stage';
  if(isImage(a)){const img=document.createElement('img');img.src=urlFor(a);img.loading='lazy';img.alt='Imagem real de '+titleFor(a);stage.append(img);}
  else if(isArchive(a)){
    const p=document.createElement('div');p.className='symbol archive-symbol';p.textContent='📦';stage.append(p);
  }else if(a.broken){
    const p=document.createElement('div');p.className='unavailable';p.textContent='⚠ Arquivo incompleto';stage.append(p);
  }else{
    const automatic=enabled&&a.bytes<=AUTO_PREVIEW_MAX_BYTES;
    if(automatic){
      const p=document.createElement('div');p.className='preview-pending';p.textContent='Preparando prévia 3D...';stage.append(p);
      queueObserve(thumb,a,stage);
    }else{
      const holder=document.createElement('div');holder.className='preview-manual';
      const info=document.createElement('span');
      info.textContent=a.bytes>AUTO_PREVIEW_MAX_BYTES?'Prévia sob demanda • arquivo grande':'Prévia automática desligada';
      const manual=makeButton('Gerar prévia','preview-on-demand',event=>{});
      manual.removeEventListener('click',()=>{});
      manual.addEventListener('click',event=>{
        event.stopPropagation();
        stage.replaceChildren(document.createTextNode('Carregando prévia real...'));
        preparePreview(a,stage,true);
      });
      holder.append(info,manual);stage.append(holder);
    }
  }
  const badge=document.createElement('span');badge.className='typepill'+(a.broken?' invalid':'');badge.textContent=a.broken?'ARQUIVO INVÁLIDO':a.ext.toUpperCase();
  const caption=document.createElement('span');caption.className='previewcaption';caption.textContent=isArchive(a)?'Pacote compactado':a.broken?'Reenvie este arquivo':isImage(a)?'Imagem original':(enabled&&a.bytes<=AUTO_PREVIEW_MAX_BYTES)?'Prévia do modelo real':'Modelo 3D • sob demanda';
  thumb.append(stage,badge,caption);
  if(!a.broken)thumb.addEventListener('click',()=>openAsset(a));
  if(!a.broken){thumb.style.cursor='pointer';thumb.title='Abrir '+titleFor(a);}
  const body=document.createElement('div');body.className='assetbody';
  const folder=document.createElement('div');folder.className='foldertag';folder.textContent=categoryLabel(a.category)+' / '+subLabel(a.subCategory);
  const name=document.createElement('h3');name.textContent=titleFor(a);
  const filename=document.createElement('p');filename.className='filename';filename.title=a.name;filename.textContent=a.name;
  const meta=document.createElement('div');meta.className='meta';
  const type=document.createElement('span');type.textContent=isArchive(a)?'Pacote':isImage(a)?'Imagem':'Modelo 3D';
  const size=document.createElement('span');size.textContent=formatSize(a.bytes);meta.append(type,size);
  const actions=document.createElement('div');actions.className='assetbuttons';
  const view=makeButton(isArchive(a)?'Detalhes':isImage(a)?'Ver imagem':'Visualizar 3D','',()=>openAsset(a));view.disabled=!!a.broken;
  const download=document.createElement('a');
  if(a.broken){download.textContent='Indisponível';download.className='download-disabled';download.setAttribute('aria-disabled','true');download.title='O arquivo está incompleto no repositório';}
  else{download.href=urlFor(a);download.download=a.name;download.textContent='Baixar ↓';download.setAttribute('aria-label','Baixar '+a.name);}
  actions.append(view,download);body.append(folder,name,filename,meta,actions);card.append(thumb,body);return card;
}
function render(){
  if(observer)observer.disconnect();
  previewQueue=[];awaiting.clear();
  const catInfo=CATEGORIES[category];
  $('listTitle').textContent=catInfo?catInfo.label:'Todos os assets';
  $('breadcrumbs').textContent='Biblioteca / '+(catInfo?catInfo.label:'Todos')+(sub==='all'?'':' / '+subLabel(sub));
  renderFolders();renderSubs();
  const data=matching(),visible=data.slice(0,visibleLimit);
  $('results').textContent=data.length+' arquivo'+(data.length===1?'':'s')+' encontrado'+(data.length===1?'':'s')+' • exibindo '+visible.length;
  const root=$('grid');root.replaceChildren();const frag=document.createDocumentFragment();
  for(const a of visible)frag.append(makeCard(a));
  if(!data.length){const p=document.createElement('p');p.className='empty';p.textContent='Nenhum asset encontrado. Tente outra pasta ou palavra-chave.';frag.append(p);}
  if(data.length>visible.length){
    const more=makeButton('Carregar mais '+Math.min(PAGE_SIZE,data.length-visible.length)+' assets','grid-more',()=>{
      visibleLimit+=PAGE_SIZE;render();
    });
    more.setAttribute('aria-label','Exibir mais arquivos do catálogo');
    frag.append(more);
  }
  root.append(frag);
  statusText();
}
function queueObserve(thumb,a,stage){
  if(!observer)observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){
      observer.unobserve(entry.target);
      const asset=entry.target._asset;
      const holder=entry.target._stage;
      preparePreview(asset,holder);
    }
  },{rootMargin:'180px'});
  thumb._asset=a;thumb._stage=stage;
  // The element can be observed before it is attached to the document.
  observer.observe(thumb);
}
async function preparePreview(a,stage,force=false){
  if((!enabled&&!force)||!stage.isConnected)return;
  const cached=await getCached(previewKey(a));
  if(!stage.isConnected)return;
  if(cached){showThumbnail(stage,cached,a);previewFinished++;statusText();return;}
  if(!enabled&&!force)return;
  const key=previewKey(a);
  if(awaiting.has(key))return;
  awaiting.add(key);previewQueue.push({a,stage,key,force});
  statusText();runQueue();
}
function showThumbnail(stage,data,a){
  if(!stage.isConnected)return;
  const img=document.createElement('img');
  img.src=data;img.alt='Prévia real com texturas de '+titleFor(a);
  stage.replaceChildren(img);
}
function failThumb(stage,reason,a){
  if(!stage.isConnected)return;
  const p=document.createElement('div');p.className='unavailable';
  p.textContent='Prévia indisponível';
  p.title=reason||'Não foi possível carregar o modelo';
  const retry=makeButton('Tentar novamente','preview-on-demand',event=>{
    event.stopPropagation();
    stage.replaceChildren(document.createTextNode('Tentando novamente...'));
    preparePreview(a,stage,true);
  });
  p.append(document.createElement('br'),retry);
  stage.replaceChildren(p);
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitForModelViewer(){
  if(customElements.get('model-viewer'))return;
  await Promise.race([
    customElements.whenDefined('model-viewer'),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('Visualizador 3D não carregou')),12000))
  ]);
}
function makeModelViewer(a,interactive){
  const m=document.createElement('model-viewer');
  m.setAttribute('alt','Modelo real de '+titleFor(a));
  m.setAttribute('shadow-intensity',interactive?'1':'0.65');
  m.setAttribute('environment-image','neutral');
  m.setAttribute('exposure','1');
  m.setAttribute('loading','eager');
  m.setAttribute('reveal','auto');
  m.setAttribute('tone-mapping','neutral');
  if(interactive)m.setAttribute('camera-controls','');
  return m;
}
function untilLoaded(model){
  return new Promise((resolve,reject)=>{
    let timer,checkTimer,settled=false;
    const done=(error)=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);clearInterval(checkTimer);
      model.removeEventListener('load',loaded);model.removeEventListener('error',failed);
      error?reject(error):resolve();
    };
    const loaded=()=>done();
    const failed=()=>done(new Error('Erro de importação GLB'));
    timer=setTimeout(()=>done(new Error('Tempo limite excedido')),85000);
    checkTimer=setInterval(()=>{if(!model.isConnected)done(new Error('Prévia cancelada ao trocar de pasta'));},750);
    model.addEventListener('load',loaded,{once:true});model.addEventListener('error',failed,{once:true});
  });
}
async function compactScreenshot(data){
  const image=new Image();image.src=data;await image.decode();
  const w=360,h=260;const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
  ctx.fillStyle='#18273b';ctx.fillRect(0,0,w,h);
  const scale=Math.min(w/image.width,h/image.height);const dw=image.width*scale,dh=image.height*scale;
  ctx.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);
  return canvas.toDataURL('image/webp',0.75);
}
async function createScreenshot(model){
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  await sleep(320);
  const shot=model.toDataURL('image/webp',0.82);
  if(!shot||shot.length<300||!shot.startsWith('data:image/'))throw Error('Captura de imagem vazia');
  return compactScreenshot(shot);
}
async function runQueue(){
  if(working)return;
  working=true;
  try{
    while(previewQueue.length){
      const job=previewQueue.shift();
      if((!enabled&&!job.force)||!job.stage.isConnected){awaiting.delete(job.key);continue;}
      try{
        await waitForModelViewer();
        if((!enabled&&!job.force)||!job.stage.isConnected){awaiting.delete(job.key);continue;}
        const m=makeModelViewer(job.a,false);
        job.stage.replaceChildren(m);
        const wait=untilLoaded(m);
        m.src=urlFor(job.a);
        await wait;
        const screenshot=await createScreenshot(m);
        await putCached(job.key,screenshot);
        showThumbnail(job.stage,screenshot,job.a);
        previewFinished++;
      }catch(error){
        previewErrors++;failThumb(job.stage,String(error),job.a);
      }finally{
        awaiting.delete(job.key);
        statusText();
      }
    }
  }finally{working=false;statusText();if(previewQueue.length)runQueue();}
}
let modalModel=null;
function setHint(message){$('viewHint').textContent=message;}
function openAsset(a){
  current=a;modalModel=null;
  $('viewCategory').textContent=categoryLabel(a.category)+' / '+subLabel(a.subCategory);
  $('viewName').textContent=titleFor(a);$('viewFilename').textContent=a.name;
  $('viewInfo').textContent=a.ext.toUpperCase()+' · '+formatSize(a.bytes);
  $('download').href=urlFor(a);$('download').download=a.name;
  $('rotate').hidden=true;$('snapshot').hidden=true;
  const vp=$('viewport');vp.replaceChildren();
  $('viewer').showModal();
  if(isArchive(a)){
    const msg=document.createElement('div');msg.className='archive-note';msg.textContent='📦 Este arquivo contém um pacote ZIP/RAR. Baixe o pacote para acessar os modelos e imagens internos.';
    vp.append(msg);setHint('Pacotes compactados não possuem prévia 3D direta.');
    return;
  }
  if(isImage(a)){
    const img=document.createElement('img');img.src=urlFor(a);img.alt=titleFor(a);vp.append(img);
    setHint('Imagem original do repositório.');return;
  }
  setHint('Carregando o modelo GLB original e suas texturas…'+(a.bytes>AUTO_PREVIEW_MAX_BYTES?' Arquivo grande: o download pode consumir muitos dados.':''));
  waitForModelViewer().then(async()=>{
    if(current!==a||!vp.isConnected||!$('viewer').open)return;
    const m=makeModelViewer(a,true);modalModel=m;
    m.setAttribute('auto-rotate','');$('rotate').textContent='Ⅱ Parar giro';vp.append(m);
    const wait=untilLoaded(m);m.src=urlFor(a);
    await wait;
    if(current!==a||!$('viewer').open)return;
    $('rotate').hidden=false;$('snapshot').hidden=false;
    if(m.availableAnimations?.length){
      const picker=document.createElement('select');picker.setAttribute('aria-label','Selecionar animação');
      const initial=document.createElement('option');initial.value='';initial.textContent='Sem animação';picker.append(initial);
      for(const animation of m.availableAnimations){const opt=document.createElement('option');opt.value=animation;opt.textContent=animation;picker.append(opt);}
      picker.addEventListener('change',()=>{m.animationName=picker.value||undefined;if(picker.value)m.play();else m.pause();});
      $('viewHint').replaceChildren(document.createTextNode('Arraste para girar • zoom com scroll/pinça • Animação: '),picker);
    }else setHint('Arraste para girar • scroll/pinça para zoom • Modelo com texturas originais.');
    try{const shot=await createScreenshot(m);await putCached(previewKey(a),shot);}catch{}
  }).catch(error=>{if(current===a)setHint('Não foi possível abrir este modelo: '+error.message);});
}
function closeViewer(){
  if($('viewer').open)$('viewer').close();
  modalModel=null;current=null;$('viewport').replaceChildren();
}
$('close').addEventListener('click',closeViewer);
$('viewer').addEventListener('click',event=>{if(event.target===$('viewer'))closeViewer();});
$('viewer').addEventListener('close',()=>{modalModel=null;current=null;$('viewport').replaceChildren();});
$('rotate').addEventListener('click',()=>{
  if(!modalModel)return;
  if(modalModel.hasAttribute('auto-rotate')){modalModel.removeAttribute('auto-rotate');$('rotate').textContent='⟳ Girar';}
  else{modalModel.setAttribute('auto-rotate','');$('rotate').textContent='Ⅱ Parar giro';}
});
$('snapshot').addEventListener('click',()=>{
  if(!modalModel||!current)return;
  try{
    const data=modalModel.toDataURL('image/png');
    const a=document.createElement('a');
    a.href=data;a.download=titleFor(current).replace(/[^a-z0-9_-]+/gi,'-')+'.png';
    document.body.append(a);a.click();a.remove();
  }catch{setHint('Não foi possível capturar esta imagem.');}
});
$('copy').addEventListener('click',async()=>{
  if(!current)return;
  try{await navigator.clipboard.writeText(urlFor(current));$('copy').textContent='Copiado!';setTimeout(()=>$('copy').textContent='Copiar link',1800);}
  catch{window.prompt('Copie o link:',urlFor(current));}
});
$('search').addEventListener('input',event=>{search=normalize(event.target.value.trim());visibleLimit=PAGE_SIZE;render();});
$('kind').addEventListener('change',event=>{kind=event.target.value;visibleLimit=PAGE_SIZE;render();});
$('sort').addEventListener('change',event=>{sort=event.target.value;visibleLimit=PAGE_SIZE;render();});
$('autoPreview').addEventListener('change',event=>{enabled=event.target.checked;try{localStorage.setItem('rexx-auto-preview',String(enabled));}catch{}render();});
window.addEventListener('popstate',()=>{readUrl();visibleLimit=PAGE_SIZE;render();});
(async()=>{
  try{const saved=localStorage.getItem('rexx-auto-preview');if(saved!==null)enabled=saved==='true';}
  catch{}
  if(navigator.connection?.saveData)enabled=false;
  $('autoPreview').checked=enabled;
  readUrl();
  try{
    const response=await fetch('./catalogo.json?v=2',{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    all=await response.json();
    if(!Array.isArray(all))throw Error('Catálogo inválido');
    $('countAll').textContent=all.length;
    $('countGlb').textContent=all.filter(a=>a.ext==='glb').length;
    $('countCat').textContent=new Set(all.map(a=>a.category)).size;
    render();
  }catch(error){
    $('results').textContent='Não foi possível carregar o catálogo.';
    const p=document.createElement('p');p.className='empty';p.textContent='Erro: '+error.message;
    $('grid').replaceChildren(p);
  }
})();
