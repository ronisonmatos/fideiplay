import {
  NIVEIS,
  NIVEIS_TEMA,
  nivelGeralPorMedia,
  nivelTemaPorPct,
  QUESTOES_POR_TEMA,
  TEMAS,
  TOTAL_QUESTOES,
  TRILHA_SUGERIDA_POR_TEMA,
} from '@/constants/teste-conhecimento';

describe('nivelGeralPorMedia', () => {
  it('classifica os limites de cada faixa corretamente', () => {
    expect(nivelGeralPorMedia(0).id).toBe('iniciante');
    expect(nivelGeralPorMedia(39).id).toBe('iniciante');
    expect(nivelGeralPorMedia(40).id).toBe('basico');
    expect(nivelGeralPorMedia(54).id).toBe('basico');
    expect(nivelGeralPorMedia(55).id).toBe('intermediario');
    expect(nivelGeralPorMedia(74).id).toBe('intermediario');
    expect(nivelGeralPorMedia(75).id).toBe('avancado');
    expect(nivelGeralPorMedia(89).id).toBe('avancado');
    expect(nivelGeralPorMedia(90).id).toBe('doutor');
    expect(nivelGeralPorMedia(100).id).toBe('doutor');
  });

  it('cai no primeiro nível para valores fora da faixa (defensivo)', () => {
    expect(nivelGeralPorMedia(-5).id).toBe(NIVEIS[0].id);
    expect(nivelGeralPorMedia(150).id).toBe(NIVEIS[0].id);
  });

  it('as faixas de NIVEIS cobrem 0–100 sem buracos nem sobreposição', () => {
    const ordenados = [...NIVEIS].sort((a, b) => a.min - b.min);
    expect(ordenados[0].min).toBe(0);
    expect(ordenados[ordenados.length - 1].max).toBe(100);
    for (let i = 1; i < ordenados.length; i++) {
      expect(ordenados[i].min).toBe(ordenados[i - 1].max + 1);
    }
  });
});

describe('nivelTemaPorPct', () => {
  it('classifica os limites de cada faixa corretamente', () => {
    expect(nivelTemaPorPct(0).label).toBe('Iniciante');
    expect(nivelTemaPorPct(49).label).toBe('Iniciante');
    expect(nivelTemaPorPct(50).label).toBe('Médio');
    expect(nivelTemaPorPct(74).label).toBe('Médio');
    expect(nivelTemaPorPct(75).label).toBe('Avançado');
    expect(nivelTemaPorPct(100).label).toBe('Avançado');
  });

  it('as faixas de NIVEIS_TEMA cobrem 0–100 sem buracos nem sobreposição', () => {
    const ordenados = [...NIVEIS_TEMA].sort((a, b) => a.min - b.min);
    expect(ordenados[0].min).toBe(0);
    expect(ordenados[ordenados.length - 1].max).toBe(100);
    for (let i = 1; i < ordenados.length; i++) {
      expect(ordenados[i].min).toBe(ordenados[i - 1].max + 1);
    }
  });
});

describe('consistência das constantes do teste', () => {
  it('TOTAL_QUESTOES bate com TEMAS × QUESTOES_POR_TEMA', () => {
    expect(TOTAL_QUESTOES).toBe(TEMAS.length * QUESTOES_POR_TEMA);
  });

  it('todo tema tem trilha sugerida para o resultado "Iniciante"', () => {
    for (const tema of TEMAS) {
      expect(TRILHA_SUGERIDA_POR_TEMA[tema.id]).toBeDefined();
    }
  });
});
