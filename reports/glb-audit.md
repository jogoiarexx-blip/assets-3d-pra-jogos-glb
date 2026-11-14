# Auditoria de GLBs pesados (somente leitura)

Os arquivos originais não foram alterados. Triângulos e vértices são estimativas baseadas em accessors.

| Modelo | MiB | Triângulos aprox. | Texturas embutidas (MiB) | Skins | Animações | Morphs |
|---|---:|---:|---:|---:|---:|---:|
| assets/veiculos/utilitarios/caminhonete velha.glb | 24.74 | 611368 | 7.35 | 0 | 0 | 0 |
| mulher de vestido.glb | 23.14 | 527172 | 7.74 | 0 | 0 | 0 |
| dra-medica-otimizada.glb | 22.84 | 1008748 | 1.75 | 0 | 0 | 0 |
| assets/criaturas/monstros/Meshy_AI_Clown_Cream_Carnage_1022153923_texture.glb | 22.66 | 449824 | 9.33 | 0 | 0 | 0 |
| glock-otimizada.glb | 22.53 | 866323 | 3.16 | 0 | 0 | 0 |
| assets/veiculos/utilitarios/Van_Rustica_Otimizada_23MB.glb | 21.91 | 383582 | 8.61 | 0 | 0 | 0 |
| zombie.glb | 21.57 | 477737 | 7.82 | 0 | 0 | 0 |
| MP5.glb | 21.38 | 458305 | 8.23 | 0 | 0 | 0 |
| assets/veiculos/carros/fusca.glb | 19.75 | 473766 | 6.62 | 0 | 0 | 0 |
| assets/personagens/outros/velho 2.glb | 17.92 | 312554 | 5.6 | 1 | 2 | 0 |
| assets/veiculos/carros/Meshy_AI_Vintage_Drive_1102074902_texture.glb | 17.85 | 353532 | 6.37 | 0 | 0 | 0 |
| assets/natureza/plantas/Meshy_AI_Vallisneria_1101183850_texture.glb | 17.37 | 314294 | 8.05 | 0 | 0 | 0 |

## Regras para uma otimização futura

1. Preservar a cópia original, SHA e caminho de download até os testes serem aprovados.
2. Medir redução de tamanho, qualidade visual, UVs, materiais, morph targets, rig e animações.
3. Testar arquivos candidatos isoladamente em navegadores desktop e celular.
4. Nunca substituir modelos automaticamente: exigir comparação e aprovação antes de publicar.

## Prioridades de análise por modelo

Esta é uma lista de oportunidades de estudo, não uma previsão garantida de economia.

### assets/veiculos/utilitarios/caminhonete velha.glb
- Tamanho original: 24.74 MiB; triângulos aproximados: 611368.
- Participação de imagens embutidas: 29.7%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### mulher de vestido.glb
- Tamanho original: 23.14 MiB; triângulos aproximados: 527172.
- Participação de imagens embutidas: 33.5%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### dra-medica-otimizada.glb
- Tamanho original: 22.84 MiB; triângulos aproximados: 1008748.
- Participação de imagens embutidas: 7.7%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### assets/criaturas/monstros/Meshy_AI_Clown_Cream_Carnage_1022153923_texture.glb
- Tamanho original: 22.66 MiB; triângulos aproximados: 449824.
- Participação de imagens embutidas: 41.2%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Texturas embutidas dominam o peso: conferir dimensões, compressão e UVs antes de mexer na geometria. Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### glock-otimizada.glb
- Tamanho original: 22.53 MiB; triângulos aproximados: 866323.
- Participação de imagens embutidas: 14.0%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### assets/veiculos/utilitarios/Van_Rustica_Otimizada_23MB.glb
- Tamanho original: 21.91 MiB; triângulos aproximados: 383582.
- Participação de imagens embutidas: 39.3%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### zombie.glb
- Tamanho original: 21.57 MiB; triângulos aproximados: 477737.
- Participação de imagens embutidas: 36.3%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### MP5.glb
- Tamanho original: 21.38 MiB; triângulos aproximados: 458305.
- Participação de imagens embutidas: 38.5%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### assets/veiculos/carros/fusca.glb
- Tamanho original: 19.75 MiB; triângulos aproximados: 473766.
- Participação de imagens embutidas: 33.5%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### assets/personagens/outros/velho 2.glb
- Tamanho original: 17.92 MiB; triângulos aproximados: 312554.
- Participação de imagens embutidas: 31.3%; cuidados: 1 skin(s)/rig, 2 animação(ões).
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### assets/veiculos/carros/Meshy_AI_Vintage_Drive_1102074902_texture.glb
- Tamanho original: 17.85 MiB; triângulos aproximados: 353532.
- Participação de imagens embutidas: 35.7%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

### assets/natureza/plantas/Meshy_AI_Vallisneria_1101183850_texture.glb
- Tamanho original: 17.37 MiB; triângulos aproximados: 314294.
- Participação de imagens embutidas: 46.4%; cuidados: sem rig/animação detectados.
- Próximo teste seguro: Texturas embutidas dominam o peso: conferir dimensões, compressão e UVs antes de mexer na geometria. Geometria densa: comparar uma cópia com simplificação gradual e verificar deformações nas animações.

**Proibição de substituição automática:** os GLBs originais, texturas, UVs, rig e animações permanecem intactos.
O pipeline faz somente leitura e publica este relatório, sem gerar GLBs substitutos.
