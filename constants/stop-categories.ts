export interface StopCategory {
  key:   string;
  label: string;
  emoji: string;
}

export const ALL_STOP_CATEGORIES: StopCategory[] = [
  { key: 'fundador',          label: 'Fundador de ordem religiosa', emoji: '⛪' },
  { key: 'igrejafe',          label: 'Igreja e fé',                 emoji: '✝️' },
  { key: 'missa',             label: 'Coisas da Santa Missa',       emoji: '🍷' },
  { key: 'objetolit',         label: 'Objeto litúrgico',            emoji: '🕯️' },
  { key: 'partesigrj',        label: 'Partes da igreja',            emoji: '🏛️' },
  { key: 'titulo_maria',      label: 'Título de Nossa Senhora',     emoji: '🌹' },
  { key: 'simbolo',           label: 'Símbolo católico',            emoji: '🔱' },
  { key: 'oracao',            label: 'Oração',                      emoji: '🤲' },
  { key: 'virtude',           label: 'Virtude cristã',              emoji: '✨' },
  { key: 'pecado',            label: 'Pecado',                      emoji: '🍎' },
  { key: 'livro_biblia',      label: 'Livro da Bíblia',             emoji: '📖' },
  { key: 'lugar_sagrado',     label: 'Lugar sagrado / Cidade bíblica', emoji: '🗺️' },
  { key: 'santo',             label: 'Santo que começa com...',     emoji: '👼' },
  { key: 'papa',              label: 'Papa que começa com...',      emoji: '👑' },
  { key: 'personagem_biblico',label: 'Personagem bíblico',          emoji: '📜' },
  { key: 'padre',             label: 'Meu padre é...',              emoji: '🙏' },
];

// Returns a random set of keys picked fresh each time (used to init selectedKeys state)
export function randomDefaultKeys(count = 6): Set<string> {
  const shuffled = [...ALL_STOP_CATEGORIES].sort(() => Math.random() - 0.5);
  return new Set(shuffled.slice(0, count).map(c => c.key));
}
