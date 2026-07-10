import {
  ALL_LETTERS,
  ALL_STOP_CATEGORIES,
  computeAvailableLetters,
  randomDefaultKeys,
  type StopCategory,
} from '@/constants/stop-categories';

const cat = (key: string, validLetters: string[]): StopCategory => ({
  key,
  label: key,
  emoji: '',
  validLetters,
});

describe('computeAvailableLetters', () => {
  it('retorna todas as letras quando nenhuma categoria é selecionada', () => {
    expect(computeAvailableLetters([])).toEqual(ALL_LETTERS);
  });

  it('retorna a interseção estrita quando existe letra válida para todas as categorias', () => {
    const cats = [cat('a', ['A', 'B', 'C']), cat('b', ['B', 'C', 'D'])];
    expect(computeAvailableLetters(cats)).toEqual(['B', 'C']);
  });

  it('cai para a letra de melhor cobertura quando não há interseção perfeita', () => {
    const cats = [cat('a', ['A', 'B']), cat('b', ['B', 'C']), cat('c', ['C'])];
    // Nenhuma letra está nas 3 categorias; 'B' e 'C' cobrem 2 categorias cada (máximo).
    expect(computeAvailableLetters(cats)).toEqual(['B', 'C']);
  });

  it('usa categorias reais do jogo e sempre retorna ao menos uma letra', () => {
    const result = computeAvailableLetters(ALL_STOP_CATEGORIES);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(l => ALL_LETTERS.includes(l))).toBe(true);
  });
});

describe('randomDefaultKeys', () => {
  it('retorna a quantidade padrão de 6 chaves únicas', () => {
    const keys = randomDefaultKeys();
    expect(keys.size).toBe(6);
  });

  it('respeita a quantidade customizada', () => {
    const keys = randomDefaultKeys(3);
    expect(keys.size).toBe(3);
  });

  it('só retorna chaves que existem em ALL_STOP_CATEGORIES', () => {
    const validKeys = new Set(ALL_STOP_CATEGORIES.map(c => c.key));
    const keys = randomDefaultKeys();
    keys.forEach(k => expect(validKeys.has(k)).toBe(true));
  });
});
