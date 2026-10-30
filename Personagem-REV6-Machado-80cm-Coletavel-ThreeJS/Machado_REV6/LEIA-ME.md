# Personagem REV6 — machado coletável

O personagem começa SEM o machado visível. A arma aparece na mão direita depois que o jogo confirma a coleta. O machado do cenário é um objeto separado e desaparece ao ser coletado.

## Arquivos

- `personagem_REV6_coleta_machado.glb`: personagem REV5 preservado, socket no osso `mixamorig:RightHand`, machado oculto inicialmente e 20 clipes.
- `machado_coletavel_80cm.glb`: arma independente para colocar no cenário, com pivô no chão.
- `sistema_machado.mjs`: controle de coleta por distância, inventário, equipar/guardar, animações e estado de salvamento.
- `exemplo_integracao.mjs`: exemplo para o carregador GLTFLoader e o loop existentes do seu jogo.
- `config_machado.json`: nomes e correspondência dos clipes.

## Escala e encaixe

1 unidade = 1 metro. Machado com 0,80 m de comprimento no eixo original, adequado ao personagem de aproximadamente 1,70 m. O comprimento foi ajustado para 80 cm; a largura e a espessura foram mantidas para preservar a pegada. As normais foram corrigidas para essa alteração de proporção. A lâmina e o cabo mantêm as texturas originais. O pivô interno da arma está na pegada; o socket ajusta orientação e posição na mão. Para mudar a escala geral, escale personagem e arma do cenário pela mesma proporção.

As 10 animações originais continuam com os mesmos nomes. As 10 variantes terminadas em `_Machado` fecham os dedos da mão direita no cabo. A arma acompanha o osso da mão, inclusive durante corrida, caminhada e ataques. A coreografia dos braços é a mesma da REV5; as variantes não são ataques novos de machado. `Run_and_Shoot` continua com a coreografia de tiro, e a ação de porta deve ser adaptada pelo controlador de interação do jogo.

## Integração Three.js

Use a mesma versão de THREE e GLTFLoader já utilizada pelo jogo. Sirva os arquivos por HTTP, como no GitHub Pages.

```js
import { prepararMachado } from './Machado_REV6/exemplo_integracao.mjs';

const equipamento = await prepararMachado({
  THREE, loader, scene, caminho: './Machado_REV6/'
});

// No input de interação (E ou botão do controle):
equipamento.interagir(); // só coleta dentro de 1,5 m

// Ao iniciar movimento, o módulo escolhe original ou variante equipada:
equipamento.sistema.tocar('Walking');
// Ao correr:
equipamento.sistema.tocar('Running');
// Ao atacar, reproduz uma vez:
equipamento.sistema.tocar('Attack', { repetir: false });

// No loop principal, uma vez por frame:
equipamento.atualizar(deltaEmSegundos);

// Para guardar e voltar a equipar depois de já ter coletado:
equipamento.sistema.equipar(false);
equipamento.sistema.equipar(true);

// Salve junto ao restante do estado do jogo:
const estado = equipamento.salvar();
// Ao carregar a partida:
equipamento.carregar(estado);
```

O módulo não adiciona teclas nem movimenta o personagem automaticamente. O jogo decide quando andar, parar, atacar e interagir. A troca entre clipes usa transição de 0,15 s, preservando a fase da caminhada/corrida ao equipar. Ao terminar um ataque, o controlador deve voltar ao estado apropriado.

## Outros motores ou integração manual

- A arma está no nó `Machado_Equipado`, sob `SocketMachado_Direita`.
- Antes da coleta, mantenha sua escala zero ou visibilidade desligada e use os clipes originais.
- Após coletar, restaure escala local `(1, 1, 1)`, ligue a visibilidade, esconda a arma do cenário e use os clipes `_Machado`.
- A visibilidade em glTF foi representada por escala zero, pois não existe uma propriedade de visibilidade universal no formato básico.
- Não anexe uma segunda cópia da arma: ela já está incluída no personagem.

## Verificação

Foram verificados os recursos do GLB, a escala da arma, o vínculo ao osso da mão, as poses de pegada e a preservação dos clipes originais. O controle de coleta foi exercitado por testes de estado e distância. A integração no cenário real do jogo ainda precisa ser feita.
