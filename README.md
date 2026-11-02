# Rexx Assets — Biblioteca 3D

A biblioteca agora tem um catálogo de visualização no navegador, filtros e modelos agrupados em pastas.

**[Abrir a galeria e visualizador 3D](https://jogoiarexx-blip.github.io/assets-3d-pra-jogos-glb/)**

## Pastas

| Pasta | Conteúdo |
| --- | --- |
| `assets/veiculos/` | Carros, caminhonete, Fusca, ônibus e kit de veículos |
| `assets/chaves/` | Chaves, Chiquinha, Bruxa do 71, Seu Madruga |
| `assets/dragoes/` | Astrid, Cabeça de Vento, Fúrias e personagem da forja |
| `assets/dinossauros/` | Dinossauros, Regina e pacotes de animações |
| `assets/personagens/` | Tanner, pedestres e outros personagens |
| `assets/criaturas/` | Animais, zumbis, goblins e criaturas |
| `assets/cenarios/` | Mapas, Chicago, caixão e cenários |
| `assets/natureza/` | Plantas e natureza |
| `assets/armas/` | Machado e itens |

Entre em qualquer pasta `assets/categoria/` no GitHub para ver os arquivos. Acesse também `assets/categoria/` no site para abrir a galeria filtrada daquela pasta.

## Visualizador

- Os arquivos **GLB** são abertos em 3D, com rotação, zoom, luz e sombras suaves.
- Se o modelo incluir animações, o visualizador permite escolhê-las.
- **Imagens** abrem em tela grande.
- **ZIP/RAR** podem ser baixados; o navegador não inspeciona o conteúdo desses pacotes.
- Busca, filtro por formato, tamanho e botão para copiar link direto.

## Compatibilidade

Para **não quebrar URLs de jogos existentes**, os arquivos antigos na raiz foram **mantidos** e os mesmos objetos Git foram referenciados nas pastas por categoria. A organização visual e os novos links estão em `assets/`. Isso não duplica o conteúdo binário no armazenamento Git, embora os arquivos apareçam nos dois caminhos.

O arquivo `car police.glb` tem apenas 2 bytes no repositório e foi sinalizado como incompleto; ele precisa ser reenviado corretamente para visualizar.

## Publicação no GitHub Pages

Se o link da galeria mostrar 404, vá em **Settings → Pages → Build and deployment → Deploy from a branch**, escolha **main** e **/(root)** e salve. O site usa apenas HTML, CSS e JavaScript estáticos, sem servidor ou build.

## Manutenção

A listagem é produzida pelo arquivo `catalogo.json`. Ao adicionar novos GLBs nas pastas, acrescente também a entrada correspondente no catálogo para aparecerem na galeria. Não altere nomes e caminhos de assets usados por outros jogos sem revisar seus links.
