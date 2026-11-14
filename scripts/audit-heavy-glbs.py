"""Audit biggest GLBs read-only. Nothing is committed or transformed."""
import json
import os
import subprocess
import tempfile
import urllib.request
from pathlib import Path
from urllib.parse import quote

BASE='https://raw.githubusercontent.com/jogoiarexx-blip/assets-3d-pra-jogos-glb/main/'
LIMIT=min(62,max(1,int(os.environ.get('AUDIT_LIMIT','12'))))
catalog=json.loads(Path('_site/catalogo.json').read_text('utf8'))
items=[a for a in catalog if a.get('ext')=='glb' and a.get('bytes',0)>100 and not a.get('broken')]
items.sort(key=lambda a:a['bytes'],reverse=True)
items=items[:LIMIT]
results=[]
for index,asset in enumerate(items,1):
    path=asset['path']
    with tempfile.TemporaryDirectory() as tmp:
        target=Path(tmp)/'model.glb'
        url=BASE+'/'.join(quote(p,safe='') for p in path.split('/'))
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'REXX-Auditoria-GLB/1.0'})
            with urllib.request.urlopen(request,timeout=60) as response,open(target,'wb') as output:
                while True:
                    chunk=response.read(1024*1024)
                    if not chunk:break
                    output.write(chunk)
                    if output.tell()>40*1024*1024:raise ValueError('Acima do limite de inspeção')
            if target.stat().st_size != asset['bytes']:raise ValueError('Arquivo diverge do catálogo')
            scan=subprocess.run(['node','scripts/audit-glb.cjs',str(target)],check=True,text=True,
                                capture_output=True,timeout=50)
            item=json.loads(scan.stdout)
            item['path']=path
            item['sha']=asset['sha']
            item['weightMiB']=round(asset['bytes']/1048576,2)
            results.append(item)
            print(f'Auditado {index}/{len(items)}: {path}',flush=True)
        except Exception as ex:
            results.append({'path':path,'error':str(ex),'weightMiB':round(asset['bytes']/1048576,2)})
            print(f'Falha {index}/{len(items)}: {path}: {ex}',flush=True)
Path('audit-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf8')
lines=['# Auditoria de GLBs pesados (somente leitura)','',
       'Os arquivos originais não foram alterados. Triângulos e vértices são estimativas baseadas em accessors.',
       '',
       '| Modelo | MiB | Triângulos aprox. | Texturas embutidas (MiB) | Skins | Animações | Morphs |',
       '|---|---:|---:|---:|---:|---:|---:|']
for item in results:
    if 'error' in item:
        lines.append('| '+item['path'].replace('|','/')+' | '+str(item['weightMiB'])+' | Erro: '+item['error'][:75].replace('|','/')+' | — | — | — | — |')
    else:
        lines.append('| '+item['path'].replace('|','/')+' | '+str(item['weightMiB'])+' | '+
            str(item['estimatedTriangles'])+' | '+
            str(round(item['embeddedTextureBytes']/1048576,2))+' | '+
            str(item['skins'])+' | '+str(item['animations'])+' | '+str(item['morphTargets'])+' |')
lines += ['','## Regras para uma otimização futura','',
          '1. Preservar a cópia original, SHA e caminho de download até os testes serem aprovados.',
          '2. Medir redução de tamanho, qualidade visual, UVs, materiais, morph targets, rig e animações.',
          '3. Testar arquivos candidatos isoladamente em navegadores desktop e celular.',
          '4. Nunca substituir modelos automaticamente: exigir comparação e aprovação antes de publicar.']
Path('audit-results.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print('Relatório criado: audit-results.md / audit-results.json')
