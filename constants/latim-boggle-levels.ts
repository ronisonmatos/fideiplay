export interface LatimWord {
  word: string;
  meaning: string;
  emoji?: string;
}

export type LatimBoggleDifficulty = 'facil' | 'medio' | 'dificil';

export interface LatimBoggleLevel {
  id: string;
  title: string;
  difficulty: LatimBoggleDifficulty;
  gridSize: number;
  words: LatimWord[];
}

// A grade não é mais fixa aqui — é gerada em tempo real (ver lib/word-grid.ts),
// assim como em palavras-fe.tsx. Isso permite adicionar níveis via banco de
// dados (game_packs, game_type 'latim') só com palavras + gridSize, sem precisar
// posicionar as letras manualmente.
export const LATIM_BOGGLE_LEVELS: LatimBoggleLevel[] = [
  {
    id: 'l1',
    title: 'Nível 1 · Fundamentos',
    difficulty: 'facil',
    gridSize: 6,
    words: [
      { word: 'PAX', meaning: 'Paz', emoji: '🕊️' },
      { word: 'AVE', meaning: 'Ave (saudação)', emoji: '🙏' },
      { word: 'DEUS', meaning: 'Deus', emoji: '✝️' },
      { word: 'LUX', meaning: 'Luz', emoji: '💡' },
    ],
  },
  {
    id: 'l2',
    title: 'Nível 2 · Orações',
    difficulty: 'facil',
    gridSize: 6,
    words: [
      { word: 'REX', meaning: 'Rei', emoji: '👑' },
      { word: 'AMEN', meaning: 'Amém', emoji: '🙌' },
      { word: 'CREDO', meaning: 'Creio', emoji: '📜' },
      { word: 'FIDES', meaning: 'Fé', emoji: '❤️' },
    ],
  },
  {
    id: 'l3',
    title: 'Nível 3 · Louvor',
    difficulty: 'medio',
    gridSize: 7,
    words: [
      { word: 'GLORIA', meaning: 'Glória', emoji: '✨' },
      { word: 'SANCTUS', meaning: 'Santo', emoji: '⛪' },
      { word: 'AGNUS', meaning: 'Cordeiro', emoji: '🐑' },
      { word: 'MATER', meaning: 'Mãe', emoji: '👩' },
    ],
  },
  {
    id: 'l4',
    title: 'Nível 4 · Liturgia',
    difficulty: 'medio',
    gridSize: 7,
    words: [
      { word: 'DOMINUS', meaning: 'Senhor', emoji: '📖' },
      { word: 'GRATIA', meaning: 'Graça', emoji: '🎁' },
      { word: 'VERITAS', meaning: 'Verdade', emoji: '⚖️' },
      { word: 'PATER', meaning: 'Pai', emoji: '👨' },
    ],
  },
  {
    id: 'l5',
    title: 'Nível 5 · Celebração',
    difficulty: 'dificil',
    gridSize: 8,
    words: [
      { word: 'ALLELUIA', meaning: 'Aleluia', emoji: '🎉' },
      { word: 'ECCLESIA', meaning: 'Igreja', emoji: '🏛️' },
      { word: 'SALUS', meaning: 'Salvação', emoji: '🙏' },
      { word: 'REGINA', meaning: 'Rainha', emoji: '💐' },
    ],
  },
  {
    id: 'l6',
    title: 'Nível 6 · Espírito',
    difficulty: 'dificil',
    gridSize: 8,
    words: [
      { word: 'SPIRITUS', meaning: 'Espírito', emoji: '🔥' },
      { word: 'ANGELUS', meaning: 'Anjo', emoji: '👼' },
      { word: 'CORPUS', meaning: 'Corpo', emoji: '🍞' },
      { word: 'VIRGO', meaning: 'Virgem', emoji: '🌸' },
    ],
  },
  {
    id: 'l7',
    title: 'Nível 7 · Doutrina',
    difficulty: 'dificil',
    gridSize: 8,
    words: [
      { word: 'FILIOQUE', meaning: 'E do Filho', emoji: '📜' },
      { word: 'CANTICUM', meaning: 'Cântico', emoji: '🎵' },
      { word: 'ORATIO', meaning: 'Oração', emoji: '🕯️' },
      { word: 'DOGMA', meaning: 'Dogma', emoji: '📘' },
    ],
  },
];
