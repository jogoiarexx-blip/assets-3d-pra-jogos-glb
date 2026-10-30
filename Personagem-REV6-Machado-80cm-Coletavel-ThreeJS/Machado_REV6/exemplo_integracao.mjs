// Integre estas funções ao loop e ao input que seu jogo já utiliza.
import { criarSistemaMachado } from './sistema_machado.mjs';

export async function prepararMachado({ THREE, loader, scene, caminho = './Machado_REV6/' }) {
  const [personagemGLTF, machadoGLTF, resposta] = await Promise.all([
    loader.loadAsync(caminho + 'personagem_REV6_coleta_machado.glb'),
    loader.loadAsync(caminho + 'machado_coletavel_80cm.glb'),
    fetch(caminho + 'config_machado.json')
  ]);
  if (!resposta.ok) throw new Error('Não foi possível carregar config_machado.json.');
  const config = await resposta.json();
  const personagem = personagemGLTF.scene;
  const coleta = machadoGLTF.scene;
  // Exemplo: coloque aqui a posição real do chão e a posição inicial do jogador.
  personagem.position.set(0, 0, 0);
  coleta.position.set(2, 0, -2);
  scene.add(personagem, coleta);
  const mixer = new THREE.AnimationMixer(personagem);
  const sistema = criarSistemaMachado({
    THREE, personagem, mixer, clipes: personagemGLTF.animations, config
  });
  // Não dispara caminhada sozinho: seu controlador chama sistema.tocar('Walking')
  // somente quando o jogador estiver andando; 'Running' quando estiver correndo.
  return {
    personagem, coleta, mixer, sistema,
    interagir() { return sistema.tentarColetar(coleta, 1.5); },
    atualizar(dt) { mixer.update(dt); },
    salvar() { return sistema.serializar(); },
    carregar(estado) {
      sistema.restaurar(estado);
      coleta.visible = !sistema.possuiMachado;
      coleta.userData.coletado = sistema.possuiMachado;
    }
  };
}
