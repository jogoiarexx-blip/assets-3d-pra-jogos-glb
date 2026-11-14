"""WebP preview quality/coverage audit; never modifies GLBs."""
import json
from pathlib import Path
from PIL import Image, ImageStat
from datetime import datetime, timezone

src=Path('previews')
catalog=json.loads(Path('_site/catalogo.json').read_text('utf8'))
models=[a for a in catalog if a.get('ext')=='glb']
items=[]
for a in models:
    sha=a.get('sha','')[:20]
    thumb=src/(sha+'.webp')
    entry={'path':a['path'],'sha':sha,'sourceMiB':round(a['bytes']/1048576,2)}
    if a.get('broken') or a['bytes']<20:
        entry['status']='original_invalid'
    elif not thumb.is_file():
        entry['status']='missing'
    else:
        entry['bytes']=thumb.stat().st_size
        try:
            with Image.open(thumb) as img:
                img.verify()
            with Image.open(thumb) as img:
                entry['dimensions']=[img.width,img.height]
                entry['contrastStdDev']=round(ImageStat.Stat(img.convert('L')).stddev[0],2)
            entry['status']='review' if entry['bytes']<550 or entry['contrastStdDev']<1.5 else 'usable'
        except Exception as exc:
            entry['status']='invalid_webp'
            entry['error']=str(exc)[:150]
    items.append(entry)

totals={key:sum(1 for x in items if x['status']==key) for key in
        ('usable','review','missing','invalid_webp','original_invalid')}
result={
    'createdUTC':datetime.now(timezone.utc).isoformat(timespec='seconds'),
    'note':'Conferência automática de tamanho, estrutura WebP e contraste. Não substitui revisão visual por uma pessoa.',
    'totalGLBs':len(models),
    'webpBytesTotal':sum(x.get('bytes',0) for x in items),
    'counts':totals,
    'items':items
}
Path('reports').mkdir(exist_ok=True)
Path('reports/preview-quality.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
lines=['# Saúde das miniaturas WebP','',
    'Gerado automaticamente. Verificação heurística de formato e contraste; não substitui inspeção visual.',
    '',
    '| Estado | Quantidade |','|---|---:|']+[f'| {k} | {v} |' for k,v in totals.items()]
lines+=['',f'Peso somado das imagens presentes: {result["webpBytesTotal"]/1024:.1f} KiB.','',
        '## Arquivos que exigem atenção','','| GLB | Estado | Tamanho WebP | Motivo |',
        '|---|---|---:|---|']
for entry in items:
    if entry['status']=='usable':continue
    path=entry['path'].replace('|','/')
    reason=('Arquivo original incompleto' if entry['status']=='original_invalid'
            else 'Miniatura suspeita: baixo contraste ou muito pequena' if entry['status']=='review'
            else 'Arquivo não gerado ou importador incompatível' if entry['status']=='missing'
            else entry.get('error','Formato inválido'))
    lines.append(f'| {path} | {entry["status"]} | {entry.get("bytes",0)} B | {reason} |')
lines+=['','Quando faltante ou suspeita, a interface oferece prévia 3D manual em vez de exibir uma imagem incorreta.',
        'Nenhum modelo ou arquivo ZIP/RAR foi modificado por esta auditoria.']
Path('reports/preview-quality.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print('Preview health:',totals,'Total WebP KiB:',round(result['webpBytesTotal']/1024,1),flush=True)
