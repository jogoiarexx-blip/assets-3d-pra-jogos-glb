"""Create SHA-addressed WebP previews without changing GLBs or existing URLs."""
import json
import os
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageOps, ImageStat

BASE = 'https://raw.githubusercontent.com/jogoiarexx-blip/assets-3d-pra-jogos-glb/main/'
CATALOG = Path('_site/catalogo.json')
PREVIEWS = Path('previews')
MAX_SOURCE_BYTES = 32 * 1024 * 1024
MAX_THUMB_BYTES = 80 * 1024
LIMIT = min(100, max(1, int(os.environ.get('PREVIEW_LIMIT', '80'))))
PREVIEWS.mkdir(parents=True, exist_ok=True)

def download(asset, output):
    url = BASE + '/'.join(quote(piece, safe='') for piece in asset['path'].split('/'))
    error = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'REXX-Assets-WebP-Builder/1.0'})
            with urllib.request.urlopen(request, timeout=60) as response, open(output, 'wb') as target:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    target.write(chunk)
                    if target.tell() > MAX_SOURCE_BYTES:
                        raise ValueError('Arquivo excede o limite de segurança')
            if Path(output).stat().st_size != asset['bytes']:
                raise ValueError('Tamanho não coincide com o catálogo')
            return
        except Exception as ex:
            error = ex
            time.sleep(attempt + 1)
    raise RuntimeError(str(error))

def webp_from_png(png, output):
    with Image.open(png) as original:
        img = ImageOps.pad(original.convert('RGB'), (320, 232), color='#161e2c')
        stat = ImageStat.Stat(img.convert('L'))
        if stat.stddev[0] < 1.0:
            raise ValueError('Render uniforme; miniatura recusada para não exibir imagem vazia')
        for quality in (76, 66, 56, 46, 36):
            img.save(output, 'WEBP', quality=quality, method=5)
            if Path(output).stat().st_size <= MAX_THUMB_BYTES:
                break
        if Path(output).stat().st_size > MAX_THUMB_BYTES:
            img.thumbnail((256, 188))
            img.save(output, 'WEBP', quality=38, method=6)
        with Image.open(output) as check:
            if check.format != 'WEBP' or check.width < 200:
                raise ValueError('WebP gerado é inválido')
        if Path(output).stat().st_size > MAX_THUMB_BYTES:
            raise ValueError('WebP excede 80 KiB')

def main():
    items = json.loads(CATALOG.read_text(encoding='utf-8'))
    assets = [a for a in items if a.get('ext') == 'glb' and not a.get('broken')
              and 100 < a.get('bytes', 0) <= MAX_SOURCE_BYTES and len(a.get('sha', '')) >= 20]
    assets.sort(key=lambda a: (a['bytes'], a['path']))
    pending = [a for a in assets if not (PREVIEWS / (a['sha'][:20]+'.webp')).exists()]
    pending = pending[:LIMIT]
    success = 0
    failed = []
    print(f'{len(assets)} GLBs válidos, {len(pending)} miniaturas pendentes nesta execução.', flush=True)
    for number, asset in enumerate(pending, 1):
        name = asset['path']
        final = PREVIEWS / (asset['sha'][:20]+'.webp')
        try:
            with tempfile.TemporaryDirectory() as temp:
                glb = Path(temp) / 'model.glb'
                png = Path(temp) / 'preview.png'
                download(asset, glb)
                command = ['xvfb-run', '-a', 'blender', '-b', '-t', '2', '--python',
                           'scripts/render-preview-blender.py', '--', str(glb), str(png)]
                result = subprocess.run(command, capture_output=True, text=True, timeout=130)
                if result.returncode != 0:
                    raise RuntimeError((result.stderr + '\n' + result.stdout)[-1200:])
                webp_from_png(png, final)
            success += 1
            print(f'[{number}/{len(pending)}] OK {name}: {final.stat().st_size} bytes', flush=True)
        except Exception as ex:
            final.unlink(missing_ok=True)
            failed.append({'path': name, 'error': str(ex)[-450:]})
            print(f'[{number}/{len(pending)}] FALHA {name}: {ex}', flush=True)
    print(json.dumps({'geradas': success, 'falhas': failed}, ensure_ascii=False, indent=2), flush=True)
    # Individual invalid models are not fatal: their 3D viewer remains usable on demand.
    if pending and success == 0:
        raise SystemExit('Nenhuma miniatura gerada; verifique o log do Blender')

if __name__ == '__main__':
    main()
