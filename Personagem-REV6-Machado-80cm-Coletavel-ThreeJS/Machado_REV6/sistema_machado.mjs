/** Three.js: coleta, inventário e troca dos clipes do personagem REV6. */
export function criarSistemaMachado({ THREE, personagem, mixer, clipes, config }) {
  const arma = personagem.getObjectByName('Machado_Equipado');
  if (!arma) throw new Error('Use personagem_REV6_coleta_machado.glb.');
  const itemId = config.itemId;
  const porNome = new Map(clipes.map(clip => [clip.name, clip]));
  const loops = new Set(config.loopClips);
  let possui = false, equipado = false, atual = null, nomeBase = null;
  let opcoesAtuais = {};
  const acoesUsadas = new Set();
  // A escala zero também deixa a arma oculta em visualizadores sem este módulo.
  arma.scale.set(1, 1, 1);
  arma.visible = false;

  function tocar(base, opcoes = {}) {
    const { fade = 0.15, repetir = loops.has(base), velocidade = 1 } = opcoes;
    const nome = equipado ? (config.clipMap[base] ?? base) : base;
    const clip = porNome.get(nome);
    if (!clip) throw new Error(`Animação ausente: ${nome}`);
    const proxima = mixer.clipAction(clip);
    acoesUsadas.add(proxima);
    if (atual === proxima && atual.isRunning()) return proxima;
    const anterior = atual === proxima ? null : atual;
    const fase = anterior && nomeBase === base && anterior.getClip().duration > 0
      ? Math.min(1, anterior.time / anterior.getClip().duration) : 0;
    proxima.reset();
    proxima.setLoop(repetir ? THREE.LoopRepeat : THREE.LoopOnce, repetir ? Infinity : 1);
    proxima.clampWhenFinished = !repetir;
    proxima.setEffectiveTimeScale(velocidade);
    proxima.setEffectiveWeight(1);
    proxima.time = fase * clip.duration;
    proxima.play();
    if (anterior && fade > 0) anterior.crossFadeTo(proxima, fade, false);
    else if (anterior) anterior.stop();
    atual = proxima;
    nomeBase = base;
    opcoesAtuais = { ...opcoes };
    return proxima;
  }

  function equipar(ativar = true) {
    if (ativar && !possui) return false;
    const novo = Boolean(ativar);
    if (novo === equipado) return true;
    equipado = novo;
    arma.visible = equipado;
    if (nomeBase) tocar(nomeBase, opcoesAtuais);
    return true;
  }

  function tentarColetar(objeto, distanciaMaxima = 1.5) {
    if (possui || !objeto || objeto.userData?.coletado || !objeto.visible) return false;
    if (!Number.isFinite(distanciaMaxima) || distanciaMaxima < 0) return false;
    const marcador = objeto.getObjectByName('Machado_Coletavel');
    if (objeto.userData?.itemId !== itemId && !marcador) return false;
    const jogadorPos = new THREE.Vector3();
    const itemPos = new THREE.Vector3();
    personagem.getWorldPosition(jogadorPos);
    (marcador ?? objeto).getWorldPosition(itemPos);
    if (jogadorPos.distanceTo(itemPos) > distanciaMaxima) return false;
    possui = true;
    objeto.userData.coletado = true;
    objeto.visible = false;
    equipar(true);
    return true;
  }

  function serializar() { return { possuiMachado: possui, machadoEquipado: equipado }; }
  function restaurar(salvo) {
    possui = salvo?.possuiMachado === true;
    equipar(possui && salvo?.machadoEquipado === true);
  }
  function dispose() {
    for (const acao of acoesUsadas) acao.stop();
    arma.visible = false;
  }
  return {
    tocar, equipar, tentarColetar, serializar, restaurar, dispose,
    get possuiMachado() { return possui; },
    get equipado() { return equipado; }
  };
}
