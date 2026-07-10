import { placeWords, placeWordsAsRows } from '@/lib/word-grid';

// Procura a palavra na grade em linha reta nas 8 direções — mesma regra usada
// pelos jogos (palavras-fe/latim) para considerar uma palavra "encontrável".
function findWord(grid: string[][], word: string): boolean {
  const size = grid.length;
  const dirs: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
  ];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of dirs) {
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size || grid[rr][cc] !== word[i]) {
            ok = false;
            break;
          }
        }
        if (ok) return true;
      }
    }
  }
  return false;
}

describe('placeWords', () => {
  it('sem palavras, devolve grade completa só de letras de preenchimento', () => {
    const result = placeWords([], 5);
    expect(result).not.toBeNull();
    const grid = result!.grid;
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
      for (const cell of row) expect(cell).toMatch(/^[A-Z]$/);
    }
  });

  it('posiciona uma única palavra de forma encontrável em linha reta', () => {
    const result = placeWords(['FIDES'], 6);
    expect(result).not.toBeNull();
    expect(findWord(result!.grid, 'FIDES')).toBe(true);
  });

  it('posiciona várias palavras, todas encontráveis', () => {
    const words = ['AMOR', 'CRUZ', 'PAZ', 'MISSA', 'SANTO'];
    const result = placeWords(words, 8);
    expect(result).not.toBeNull();
    for (const w of words) expect(findWord(result!.grid, w)).toBe(true);
  });

  it('devolve null quando a palavra não cabe na grade', () => {
    expect(placeWords(['SACRAMENTO'], 5)).toBeNull(); // 10 letras numa grade 5×5
  });

  it('nunca sobrescreve letra de outra palavra (posicionamento consistente)', () => {
    // Repetimos várias vezes porque o posicionamento é aleatório.
    const words = ['GLORIA', 'CREDO', 'AGNUS', 'PATER'];
    for (let i = 0; i < 20; i++) {
      const result = placeWords(words, 8);
      expect(result).not.toBeNull();
      for (const w of words) expect(findWord(result!.grid, w)).toBe(true);
    }
  });

  it('preenche todas as células (nenhuma fica vazia/nula)', () => {
    const result = placeWords(['DEUS'], 6);
    expect(result).not.toBeNull();
    for (const row of result!.grid) {
      for (const cell of row) {
        expect(typeof cell).toBe('string');
        expect(cell).toHaveLength(1);
      }
    }
  });
});

describe('placeWordsAsRows', () => {
  it('devolve as linhas concatenadas como strings do tamanho da grade', () => {
    const rows = placeWordsAsRows(['LUMEN'], 6);
    expect(rows).not.toBeNull();
    expect(rows).toHaveLength(6);
    for (const row of rows!) expect(row).toHaveLength(6);
  });

  it('devolve null quando não há como posicionar mesmo com retries', () => {
    expect(placeWordsAsRows(['IMPOSSIVELMENTE'], 4)).toBeNull();
  });

  it('a palavra permanece encontrável no formato de linhas', () => {
    const rows = placeWordsAsRows(['VERITAS'], 8);
    expect(rows).not.toBeNull();
    const grid = rows!.map(r => r.split(''));
    expect(findWord(grid, 'VERITAS')).toBe(true);
  });
});
