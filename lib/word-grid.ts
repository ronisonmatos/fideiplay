// Posiciona palavras em linha reta (8 direções) numa grade N×N, sem reuso de
// célula dentro da mesma palavra. Usado por qualquer jogo de "caça-palavras"
// (palavras-fe, latim-boggle) para gerar a grade em tempo real a partir de uma
// lista de palavras — isso permite adicionar níveis/temas via banco de dados
// sem precisar posicionar as letras manualmente.
const STRAIGHT_DIRS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const DIAGONAL_DIRS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const FILL = 'ABCDEFGHIJKLMNOPRSTUVWX';

interface Candidate { dr: number; dc: number; rS: number; cS: number }

// Todas as posições válidas (direção + início) para uma palavra numa grade de
// determinado tamanho, dentro de um subconjunto de direções — sem olhar ainda
// para o que já está ocupado.
function collectCandidates(dirs: [number, number][], len: number, size: number): Candidate[] {
  const candidates: Candidate[] = [];
  for (const [dr, dc] of dirs) {
    const rMin = dr < 0 ? len - 1 : 0;
    const rMax = dr > 0 ? size - len : size - 1;
    const cMin = dc < 0 ? len - 1 : 0;
    const cMax = dc > 0 ? size - len : size - 1;
    if (rMax < rMin || cMax < cMin) continue;
    for (let rS = rMin; rS <= rMax; rS++) {
      for (let cS = cMin; cS <= cMax; cS++) candidates.push({ dr, dc, rS, cS });
    }
  }
  return candidates;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tenta cada candidato (já embaralhado) em ordem e coloca a palavra no
// primeiro que não colide com letras já presentes. Retorna se conseguiu.
function tryPlace(grid: (string | null)[][], word: string, candidates: Candidate[]): boolean {
  for (const { dr, dc, rS, cS } of candidates) {
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const r = rS + dr * i;
      const c = cS + dc * i;
      if (grid[r][c] !== null && grid[r][c] !== word[i]) { ok = false; break; }
    }
    if (!ok) continue;
    for (let i = 0; i < word.length; i++) grid[rS + dr * i][cS + dc * i] = word[i];
    return true;
  }
  return false;
}

export function placeWords(words: string[], size: number): { grid: string[][] } | null {
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  for (const word of words) {
    // Numa grade quadrada, palavras retas (horizontal/vertical) têm MUITO mais
    // posições válidas do que diagonais — quanto mais a palavra se aproxima do
    // tamanho da grade, menos espaço sobra pra diagonal (no limite, só 1 posição
    // diagonal contra 8 retas). Sortear entre todas as posições de uma vez só
    // deixava as diagonais praticamente inexistentes no tabuleiro final. Por
    // isso sorteamos primeiro a FAMÍLIA de direção (reta vs diagonal, 50/50) e
    // só caímos para a outra família se a preferida não tiver onde encaixar.
    const preferDiagonal = Math.random() < 0.5;
    const primary = preferDiagonal ? DIAGONAL_DIRS : STRAIGHT_DIRS;
    const secondary = preferDiagonal ? STRAIGHT_DIRS : DIAGONAL_DIRS;

    let placed = tryPlace(grid, word, shuffle(collectCandidates(primary, word.length, size)));
    if (!placed) placed = tryPlace(grid, word, shuffle(collectCandidates(secondary, word.length, size)));
    if (!placed) return null;
  }

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c] === null) grid[r][c] = FILL[Math.floor(Math.random() * FILL.length)];

  return { grid: grid as string[][] };
}

// Tenta algumas vezes (a posição de cada palavra é aleatória, então uma
// tentativa isolada pode falhar por acaso) e retorna as linhas já concatenadas
// em string, formato usado pela grade do Latim Sagrado.
export function placeWordsAsRows(words: string[], size: number, retries = 8): string[] | null {
  for (let i = 0; i < retries; i++) {
    const result = placeWords(words, size);
    if (result) return result.grid.map(row => row.join(''));
  }
  return null;
}
