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
from strip_glb_animations import without_animations

BASE = 'https://raw.githubusercontent.com/jogoiarexx-blip/assets-3d-pra-jogos-glb/main/'
CATALOG = Path('_site/catalogo.json')
PREVIEWS = Path('previews')
MAX_SOURCE_BYTES = 32 * 1024 * 1024
MAX_THUMB_BYTES = 80 * 1024
MIN_THUMB_BYTES = 550
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

def image_looks_usable(output):
    if not Path(output).is_file() or Path(output).stat().st_size < MIN_THUMB_BYTES:
        return False
    try:
        with Image.open(output) as pic:
            return pic.format=='WEBP' and pic.width>=200 and ImageStat.Stat(pic.convert('L')).stddev[0]>=1.5
    except Exception:
        return False

def render_blender(source, output):
    command = ['xvfb-run', '-a', 'blender', '-b', '-t', '2', '--python-exit-code', '1', '--python',
               'scripts/render-preview-blender.py', '--', str(source), str(output)]
    result = subprocess.run(command, capture_output=True, text=True, timeout=130)
    if result.returncode != 0 or not output.is_file():
        raise RuntimeError('Blender falhou (exit='+str(result.returncode)+'):\n'+(result.stdout+'\n'+result.stderr)[-1800:])

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
        if not image_looks_usable(output):
            raise ValueError('Miniatura com pouco detalhe ou sem o objeto; não publicar')

def main():
    items = json.loads(CATALOG.read_text(encoding='utf-8'))
    assets = [a for a in items if a.get('ext') == 'glb' and not a.get('broken')
              and 100 < a.get('bytes', 0) <= MAX_SOURCE_BYTES and len(a.get('sha', '')) >= 20]
    assets.sort(key=lambda a: (a['bytes'], a['path']))
    pending = [a for a in assets if not image_looks_usable(PREVIEWS / (a['sha'][:20]+'.webp'))]
    pending = pending[:LIMIT]
    success = 0
    failed = []
    consecutive_failures = 0
    system_failures = 0
    print(f'{len(assets)} GLBs válidos, {len(pending)} miniaturas pendentes nesta execução.', flush=True)
    for number, asset in enumerate(pending, 1):
        name = asset['path']
        final = PREVIEWS / (asset['sha'][:20]+'.webp')
        try:
            with tempfile.TemporaryDirectory() as temp:
                glb = Path(temp) / 'model.glb'
                png = Path(temp) / 'preview.png'
                download(asset, glb)
                try:
                    render_blender(glb, png)
                except Exception as primary_error:
                    static=Path(temp)/'thumbnail-static.glb'
                    try:
                        removed=without_animations(glb, static)
                        print(f'Importação animada falhou ({name}); tentando cópia estática sem {removed} animações.',flush=True)
                        render_blender(static, png)
                    except Exception as fallback_error:
                        raise RuntimeError(f'{primary_error}; fallback estático: {fallback_error}') from fallback_error
                output=Path(temp)/'render.webp'
                webp_from_png(png, output)
                output.replace(final)
            success += 1
            consecutive_failures = 0
            print(f'[{number}/{len(pending)}] OK {name}: {final.stat().st_size} bytes', flush=True)
        except Exception as ex:
            # Keep any previous thumbnail untouched until a replacement passes validation.
            failed.append({'path': name, 'error': str(ex)[-450:]})
            # A low-detail render is asset-specific: do not block Regina and other assets.
            if 'Miniatura com pouco detalhe' in str(ex) or 'fallback estático:' in str(ex):
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                system_failures += 1
            print(f'[{number}/{len(pending)}] FALHA {name}: {ex}', flush=True)
            if consecutive_failures >= 3:
                print('Parando após três falhas sistêmicas seguidas.', flush=True)
                break
    print(json.dumps({'geradas': success, 'falhas': failed}, ensure_ascii=False, indent=2), flush=True)
    # Individual invalid models are not fatal: their 3D viewer remains usable on demand.
    if pending and success == 0 and system_failures >= 3:
        raise SystemExit('Falha sistêmica do renderizador; conferir ambiente')
    if pending and success == 0:
        print('Aviso: nenhuma miniatura nova passou no controle de qualidade. Publicando diagnóstico.',flush=True)

if __name__ == '__main__':
    main()
