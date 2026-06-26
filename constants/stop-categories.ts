export const ALL_LETTERS = ['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V'];

export interface StopCategory {
  key:          string;
  label:        string;
  emoji:        string;
  /** Letters that have at least one valid answer — used to filter the draw pool */
  validLetters: string[];
}

export const ALL_STOP_CATEGORIES: StopCategory[] = [
  {
    key: 'igrejafe',
    label: 'Igreja e fé',
    emoji: '✝️',
    validLetters: ALL_LETTERS,
  },
  {
    key: 'santo',
    label: 'Santo(a)',
    emoji: '😇',
    validLetters: ['A','B','C','D','E','F','G','H','I','J','L','M','N','P','R','S','T','U','V'],
  },
  {
    key: 'personagem_biblico',
    label: 'Personagem bíblico',
    emoji: '📜',
    validLetters: ['A','B','C','D','E','F','G','H','I','J','L','M','N','P','R','S','T','U','V'],
  },
  {
    key: 'pecado',
    label: 'Pecado',
    emoji: '🍎',
    validLetters: ['A','B','C','D','E','F','G','H','I','L','M','N','O','P','R','S','T','U','V'],
  },
  {
    key: 'atributo_deus',
    label: 'Atributo de Deus',
    emoji: '🌟',
    validLetters: ALL_LETTERS,
  },
  {
    key: 'animal_biblico',
    label: 'Animal bíblico',
    emoji: '🐑',
    validLetters: ALL_LETTERS,
  },
{
    key: 'dogma',
    label: 'Dogma / Verdade de Fé',
    emoji: '✡️',
    validLetters: ALL_LETTERS,
  },
  {
    key: 'festa_liturgica',
    label: 'Festa litúrgica',
    emoji: '🎉',
    validLetters: ALL_LETTERS,
  },
  {
    key: 'mulher_biblia',
    label: 'Mulher da Bíblia',
    emoji: '👩',
    validLetters: ALL_LETTERS,
  },
  {
    key: 'virtude',
    label: 'Virtude cristã',
    emoji: '✨',
    validLetters: ['A','B','C','D','E','F','G','H','I','L','M','P','R','S','T','U','V'],
  },
  {
    key: 'livro_biblia',
    label: 'Livro da Bíblia',
    emoji: '📖',
    validLetters: ['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T'],
  },
  {
    key: 'lugar_sagrado',
    label: 'Lugar sagrado / Cidade bíblica',
    emoji: '🗺️',
    validLetters: ['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U'],
  },
  {
    key: 'papa',
    label: 'Papa',
    emoji: '👑',
    validLetters: ['A','B','C','D','E','F','G','H','I','J','L','M','N','P','S','T','U','V'],
  },
  {
    key: 'fundador',
    label: 'Fundador de ordem religiosa',
    emoji: '⛪',
    validLetters: ['A','B','C','D','E','F','G','I','J','L','M','N','P','R','S','T','V'],
  },
  {
    key: 'titulo_maria',
    label: 'Título de Nossa Senhora',
    emoji: '🌹',
    validLetters: ['A','B','C','D','E','F','G','J','L','M','N','P','R','S','T','V'],
  },
  {
    key: 'objetolit',
    label: 'Objeto litúrgico',
    emoji: '🕯️',
    validLetters: ['A','B','C','D','E','F','G','H','I','L','M','N','O','P','R','S','T','V'],
  },
  {
    key: 'partesigrj',
    label: 'Parte da igreja',
    emoji: '🏛️',
    validLetters: ['A','B','C','D','E','F','G','H','L','M','O','P','R','S','T','U','V'],
  },
  {
    key: 'missa',
    label: 'Coisa da Santa Missa',
    emoji: '🍷',
    validLetters: ['A','C','D','E','F','G','H','I','L','M','O','P','R','S','T'],
  },
];

/**
 * Returns the letters valid for ALL selected categories (strict intersection).
 * If no such letter exists, returns the letters valid for the most categories
 * (best-coverage fallback) so the drawn letter is always as valid as possible.
 */
export function computeAvailableLetters(cats: StopCategory[]): string[] {
  if (cats.length === 0) return ALL_LETTERS;
  const sets = cats.map(c => new Set(c.validLetters));
  const perfect = ALL_LETTERS.filter(l => sets.every(s => s.has(l)));
  if (perfect.length > 0) return perfect;
  const maxCoverage = Math.max(...ALL_LETTERS.map(l => sets.filter(s => s.has(l)).length));
  return ALL_LETTERS.filter(l => sets.filter(s => s.has(l)).length === maxCoverage);
}

export function randomDefaultKeys(count = 6): Set<string> {
  const shuffled = [...ALL_STOP_CATEGORIES].sort(() => Math.random() - 0.5);
  return new Set(shuffled.slice(0, count).map(c => c.key));
}
