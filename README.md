# REXX Assets — biblioteca 3D

[**Abrir o visualizador e a biblioteca**](https://jogoiarexx-blip.github.io/assets-3d-pra-jogos-glb/)

## Organização

Os modelos e pacotes estão distribuídos em 9 categorias e 16 subpastas dentro de `assets/`. Os arquivos antigos na raiz e em `assets/<categoria>/<arquivo>` permanecem disponíveis, de modo que jogos existentes não perdem seus links. Os arquivos em novas pastas compartilham os mesmos objetos Git, sem duplicar conteúdo binário no histórico.

- `assets/armas/machados/` — 1 arquivos
- `assets/cenarios/mapas/` — 2 arquivos
- `assets/cenarios/objetos/` — 1 arquivos
- `assets/chaves/personagens/` — 4 arquivos
- `assets/criaturas/monstros/` — 5 arquivos
- `assets/criaturas/animais/` — 2 arquivos
- `assets/dinossauros/dinossauros/` — 3 arquivos
- `assets/dinossauros/regina/` — 3 arquivos
- `assets/dragoes/personagens/` — 3 arquivos
- `assets/dragoes/dragoes/` — 3 arquivos
- `assets/natureza/plantas/` — 1 arquivos
- `assets/personagens/outros/` — 11 arquivos
- `assets/personagens/driver-2/` — 5 arquivos
- `assets/veiculos/utilitarios/` — 2 arquivos
- `assets/veiculos/carros/` — 5 arquivos
- `assets/veiculos/pacotes/` — 1 arquivos

## Prévia verdadeira

Os cards mostram **imagens reais renderizadas a partir dos GLBs**, usando `model-viewer`. Como os arquivos são grandes, as miniaturas são geradas uma por vez quando aparecem na tela e ficam guardadas no **IndexedDB do navegador**. A primeira visita exige baixar e renderizar o GLB. Clique em **Visualizar 3D** para examinar os modelos, girar, ampliar, controlar animações e **Salvar imagem**. Imagens WebP são exibidas diretamente. ZIP/RAR são identificados como pacotes e não têm prévia interna.

A opção **Prévias reais** pode ser desligada. Em conexões com economia de dados, o carregamento automático é desligado.

## Adicionando um novo asset

Adicione o arquivo à pasta apropriada e registre-o em `catalogo.json`, incluindo `name`, `title`, `path`, `category`, `subCategory`, `ext`, `sha`, `bytes` e `broken`. O campo SHA garante a atualização do cache quando o modelo muda.

## Notas

- `car police.glb` tem somente 2 bytes e está sinalizado como danificado.
- Site estático GitHub Pages: branch `main`, diretório `/(root)`.
- Renderização real requer WebGL e acesso ao script do model-viewer. Alguns arquivos muito grandes podem levar tempo para aparecer.
