# REXX Assets — biblioteca 3D

[**Abrir a biblioteca**](https://jogoiarexx-blip.github.io/assets-3d-pra-jogos-glb/)

## Publicação leve

O código do catálogo é publicado no GitHub Pages sem incluir nenhum GLB, ZIP ou RAR no artefato do site. Cada modelo original continua **em seu caminho canônico do repositório** `main`; prévias e downloads consultam o GitHub apenas quando solicitados. A publicação é feita pelo workflow [pages-light.yml](.github/workflows/pages-light.yml).

O fluxo:
1. Checkout esparso dos HTML, CSS, JS, JSON e script de geração (sem baixar binários).
2. Verificação de sintaxe JS e consistência de nome, caminho, tamanho e SHA de cada item curado via `git ls-tree`.
3. Descoberta automática de novos GLB, imagens e pacotes que ainda não estejam no catálogo. Arquivos da raiz novos aparecem na categoria **Novos envios / A classificar**.
4. Geração de `_site/` com cinco arquivos estáticos, abaixo de 1 MiB.
5. Deploy com GitHub Actions para Pages.

### Configurar a origem de publicação

No repositório, acesse **Settings → Pages → Build and deployment → Source → GitHub Actions**. Enquanto a origem continuar configurada para `main /(root)`, o build padrão do Pages pode continuar tentando publicar todos os arquivos do repositório. O workflow de site leve exige essa configuração para ser a origem oficial da publicação.

## Compatibilidade dos links antigos

- **Cada arquivo binário possui uma única cópia preservada**, no caminho canônico registrado em `catalogo.json`. Em 6/11/2026 foram removidas 106 cópias SHA-idênticas, mantendo 53 assets distintos. URLs antigas que apontavam para as cópias eliminadas deixam de funcionar; utilize o caminho `path` do catálogo.
- A interface passa a usar arquivos externos em `https://raw.githubusercontent.com/jogoiarexx-blip/assets-3d-pra-jogos-glb/main/<caminho-escapado>`, mantendo as subpastas.
- **Importante:** links diretos antigos sob `https://jogoiarexx-blip.github.io/assets-3d-pra-jogos-glb/<arquivo.glb>` **não serão servidos** pelo Pages leve. Jogos que referenciem esses links devem migrar para as URLs de arquivos no GitHub. Um site estático não consegue preservar a resposta binária de URLs excluídas sem uma camada externa de redirecionamento/proxy apropriada.
- O atributo `download` do HTML não é garantido entre domínios; o botão **Baixar** abre o download do GitHub em outra aba. **Copiar link** fornece a URL raw para integração em projetos.

## Catálogo e prévias

- 64 arquivos registrados manualmente, distribuídos em nove categorias originais, sem cópias binárias duplicadas no estado atual do repositório.
- Novos arquivos são indexados no build sem necessidade de editar JSON. Para títulos/categorias definitivos, registre-os no `catalogo.json` com SHA e tamanho correspondentes.
- Miniaturas GLB são renderizadas pelo `model-viewer`, uma por vez, e guardadas no IndexedDB do navegador.
- GLBs acima de 18 MiB só recebem miniatura sob demanda; imagens WebP aparecem como imagem.
- `car police.glb` tem 2 bytes, permanece marcado como danificado e não deve ser usado.

## Limitações e próximos passos

O GitHub Pages tem limite documentado de 1 GB para o **site publicado** e o repositório de origem tem recomendação de 1 GB. Esta estratégia reduz o artefato publicado, mas **não reduz o tamanho do repositório Git nem seu histórico**. Para produção de alta demanda, considere armazenamento/CDN próprio para GLBs, com CORS e cache configurados, ou migrar arquivos para GitHub Releases (com testes de CORS e downloads). A renderização no navegador depende de WebGL, rede e acesso a `model-viewer`.
