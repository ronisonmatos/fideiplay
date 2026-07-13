import type { PuzzleTheme } from '@/hooks/use-game-packs';

// Cada tema guarda um BANCO de palavras maior do que o necessário por rodada —
// startDifficulty() (app/palavras-fe.tsx) sorteia um subconjunto a cada jogada,
// então o mesmo tema nunca gera exatamente o mesmo caça-palavras duas vezes.
// Ver WORDS_PER_ROUND para quantas palavras cada dificuldade sorteia por vez.
export const WORDS_PER_ROUND: Record<'facil' | 'medio' | 'dificil', number> = {
  facil: 5,
  medio: 6,
  dificil: 7,
};

export const PUZZLE_THEMES: PuzzleTheme[] = [
  // FÁCIL — 8×8 — 5 palavras por rodada (banco maior, latim + português)
  {
    difficulty: 'facil', gridSize: 8,
    title: 'Fundamentos', subtitle: 'O essencial da fé',
    words: ['JESUS', 'DEUS', 'AMOR', 'CRUZ', 'MARIA', 'PAZ', 'LUZ', 'SANTO', 'REZAR', 'IGREJA', 'BIBLIA', 'AVE', 'PAX', 'LUX', 'SPES'],
  },
  {
    difficulty: 'facil', gridSize: 8,
    title: 'Latim: Oração', subtitle: 'Palavras sagradas',
    words: ['GLORIA', 'CREDO', 'FIDES', 'LUMEN', 'AMEN', 'PATER', 'AGNUS', 'SANCTUS', 'DOMINUS'],
  },
  {
    difficulty: 'facil', gridSize: 8,
    title: 'A Igreja', subtitle: 'Vida da comunidade',
    words: ['MISSA', 'BISPO', 'NATAL', 'ALTAR', 'PADRE', 'HOSTIA', 'VELA', 'SINO', 'PASCOA', 'ECCLESIA'],
  },
  // MÉDIO — 9×9 — 6 palavras por rodada
  {
    difficulty: 'medio', gridSize: 9,
    title: 'Sacramentos', subtitle: '7 sinais de graça',
    words: ['BATISMO', 'CRISMA', 'NOVENA', 'CORPUS', 'PATER', 'ORDEM', 'UNCAO', 'CONFISSAO', 'GRACA'],
  },
  {
    difficulty: 'medio', gridSize: 9,
    title: 'Latim Litúrgico', subtitle: 'A língua da Igreja',
    words: ['DOMINUS', 'GRATIA', 'SANCTUS', 'AGNUS', 'MATER', 'KYRIE', 'SPIRITUS', 'VERBUM', 'REGINA'],
  },
  {
    difficulty: 'medio', gridSize: 9,
    title: 'Devoção', subtitle: 'Práticas e virtudes',
    words: ['ROSARIO', 'VIRGEM', 'MILAGRE', 'RELIQUIA', 'PROFETA', 'PROMESSA', 'PEREGRINO', 'VIGILIA', 'ADORACAO'],
  },
  // DIFÍCIL — 10×10 — 7 palavras por rodada
  {
    difficulty: 'dificil', gridSize: 10,
    title: 'Latim Avançado', subtitle: 'Dogmas e credos',
    words: ['FILIOQUE', 'ALLELUIA', 'VERITAS', 'SANCTUS', 'GLORIA', 'KYRIE', 'DOMINUS', 'MAGNIFICAT', 'REDEMPTOR', 'TRINITAS'],
  },
  {
    difficulty: 'dificil', gridSize: 10,
    title: 'Liturgia', subtitle: 'A celebração eucarística',
    words: ['LITURGIA', 'HOMILIA', 'PREFACIO', 'SALTERIO', 'CANTICO', 'INCENSO', 'LEITOR', 'OFERTORIO', 'BENCAO', 'CELEBRANTE'],
  },
  {
    difficulty: 'dificil', gridSize: 10,
    title: 'Doutrina', subtitle: 'O ensinamento da Igreja',
    words: ['DOUTRINA', 'ENCICLICA', 'DOGMA', 'CATECISMO', 'HERESIA', 'CONCILIO', 'MAGISTER', 'TEOLOGIA', 'EXCOMUNHAO'],
  },
];
