import {
  calcularValorEvento,
  descontoPorPeriodo,
  PERIODO_MAX,
  PERIODO_MIN,
  PRECO_POR_DIA,
} from '@/constants/eventos-precos';

describe('descontoPorPeriodo', () => {
  it('período mínimo (7 a 14 dias) não tem desconto', () => {
    expect(descontoPorPeriodo(PERIODO_MIN)).toBe(0);
    expect(descontoPorPeriodo(14)).toBe(0);
  });

  it('15 a 29 dias têm 10% de desconto', () => {
    expect(descontoPorPeriodo(15)).toBe(0.10);
    expect(descontoPorPeriodo(29)).toBe(0.10);
  });

  it('30 dias ou mais têm 20% de desconto', () => {
    expect(descontoPorPeriodo(30)).toBe(0.20);
    expect(descontoPorPeriodo(PERIODO_MAX)).toBe(0.20);
  });

  it('abaixo do mínimo não aplica desconto (defensivo)', () => {
    expect(descontoPorPeriodo(1)).toBe(0);
  });
});

describe('calcularValorEvento', () => {
  it('calcula o valor cheio sem desconto', () => {
    expect(calcularValorEvento('cidade', 7)).toBeCloseTo(2.90 * 7, 2);
    expect(calcularValorEvento('nacional', 10)).toBeCloseTo(11.90 * 10, 2);
  });

  it('aplica 10% de desconto entre 15 e 29 dias', () => {
    expect(calcularValorEvento('estado', 15)).toBeCloseTo(5.90 * 15 * 0.9, 2);
  });

  it('aplica 20% de desconto a partir de 30 dias', () => {
    expect(calcularValorEvento('nacional', 30)).toBeCloseTo(11.90 * 30 * 0.8, 2);
  });

  it('arredonda para 2 casas decimais', () => {
    for (const alcance of ['cidade', 'estado', 'nacional'] as const) {
      for (const dias of [7, 15, 30, 45, 60]) {
        const valor = calcularValorEvento(alcance, dias);
        expect(valor).toBe(Math.round(valor * 100) / 100);
      }
    }
  });

  it('quanto maior o alcance, maior o preço para o mesmo período', () => {
    expect(PRECO_POR_DIA.cidade).toBeLessThan(PRECO_POR_DIA.estado);
    expect(PRECO_POR_DIA.estado).toBeLessThan(PRECO_POR_DIA.nacional);
    expect(calcularValorEvento('cidade', 10)).toBeLessThan(calcularValorEvento('estado', 10));
    expect(calcularValorEvento('estado', 10)).toBeLessThan(calcularValorEvento('nacional', 10));
  });
});
