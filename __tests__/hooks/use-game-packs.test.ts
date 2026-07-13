jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(),
}));

import {
  mergeLatimLevels,
  mergeLiturgQuestions,
  mergeQuizQuestions,
  mergeStopCategories,
  mergeTrilhas,
  type GamePack,
  type QuizQuestion,
} from '@/hooks/use-game-packs';
import type { Trilha } from '@/data/trilhas';

function pack(overrides: Partial<GamePack>): GamePack {
  return {
    id: 'p1',
    game_type: 'quiz',
    titulo: 'Pack',
    gratuito: false,
    coins_price: 100,
    conteudo: {},
    owned: true,
    ...overrides,
  };
}

const q = (question: string): QuizQuestion => ({
  topic: 't',
  question,
  options: ['a', 'b'],
  correct: 0,
  difficulty: 'facil',
});

describe('mergeQuizQuestions', () => {
  const base = [q('base 1')];

  it('sem packs, devolve só o conteúdo hardcoded', () => {
    expect(mergeQuizQuestions(base, [])).toEqual(base);
  });

  it('adiciona perguntas de packs possuídos', () => {
    const packs = [pack({ conteudo: { perguntas: [q('extra 1'), q('extra 2')] } })];
    const merged = mergeQuizQuestions(base, packs);
    expect(merged).toHaveLength(3);
    expect(merged[0].question).toBe('base 1'); // hardcoded vem primeiro
  });

  it('ignora packs não possuídos', () => {
    const packs = [pack({ owned: false, conteudo: { perguntas: [q('extra')] } })];
    expect(mergeQuizQuestions(base, packs)).toEqual(base);
  });

  it('ignora conteúdo malformado sem quebrar', () => {
    const packs = [
      pack({ conteudo: {} }),
      pack({ conteudo: { perguntas: 'não é array' as unknown as QuizQuestion[] } }),
    ];
    expect(mergeQuizQuestions(base, packs)).toEqual(base);
  });
});

describe('mergeLiturgQuestions / mergeLatimLevels', () => {
  it('usam a chave certa dentro de conteudo', () => {
    const lq = { question: 'x', options: ['a'], correct: 0, hint: '', difficulty: 'facil' as const };
    const nivel = { id: 'n1', title: 'N1', difficulty: 'facil' as const, gridSize: 6, words: [] };

    expect(mergeLiturgQuestions([], [pack({ conteudo: { perguntas: [lq] } })])).toHaveLength(1);
    expect(mergeLatimLevels([], [pack({ conteudo: { niveis: [nivel] } })])).toHaveLength(1);
    // chave errada não vaza para o merge
    expect(mergeLiturgQuestions([], [pack({ conteudo: { niveis: [lq] } })])).toHaveLength(0);
  });
});

describe('mergeStopCategories', () => {
  const LETTERS = ['A', 'B', 'C'];
  const hardcoded = [{ key: 'santo', label: 'Santo', emoji: '✝️', validLetters: ['A'] }];

  it('adiciona categorias novas de packs possuídos', () => {
    const packs = [pack({ conteudo: { categorias: [{ key: 'papa', label: 'Papa', emoji: '🙏' }] } })];
    const merged = mergeStopCategories(hardcoded, packs, LETTERS);
    expect(merged.map(c => c.key)).toEqual(['santo', 'papa']);
  });

  it('não duplica categoria com key já existente no hardcoded', () => {
    const packs = [pack({ conteudo: { categorias: [{ key: 'santo', label: 'Duplicada', emoji: '' }] } })];
    const merged = mergeStopCategories(hardcoded, packs, LETTERS);
    expect(merged).toHaveLength(1);
    expect(merged[0].label).toBe('Santo');
  });

  it('não duplica categoria repetida entre dois packs', () => {
    const packs = [
      pack({ id: 'p1', conteudo: { categorias: [{ key: 'papa', label: 'Papa', emoji: '' }] } }),
      pack({ id: 'p2', conteudo: { categorias: [{ key: 'papa', label: 'Papa de novo', emoji: '' }] } }),
    ];
    const merged = mergeStopCategories(hardcoded, packs, LETTERS);
    expect(merged.filter(c => c.key === 'papa')).toHaveLength(1);
  });

  it('preenche validLetters com todas as letras quando o pack não define', () => {
    const packs = [pack({ conteudo: { categorias: [{ key: 'papa', label: 'Papa', emoji: '' }] } })];
    const merged = mergeStopCategories(hardcoded, packs, LETTERS);
    expect(merged.find(c => c.key === 'papa')?.validLetters).toEqual(LETTERS);
  });

  it('preserva validLetters quando o pack define', () => {
    const packs = [pack({ conteudo: { categorias: [{ key: 'papa', label: 'Papa', emoji: '', validLetters: ['B'] }] } })];
    const merged = mergeStopCategories(hardcoded, packs, LETTERS);
    expect(merged.find(c => c.key === 'papa')?.validLetters).toEqual(['B']);
  });
});

describe('mergeTrilhas', () => {
  const trilha = (id: number, overrides: Partial<Trilha> = {}): Trilha => ({
    id, titulo: `Trilha ${id}`, descricao: 'd', icone: '📿', nivel: 'Iniciante',
    totalLicoes: 1, xpTotal: 30, gratis: true, licoes: [], ...overrides,
  });
  const hardcoded = [trilha(1), trilha(2)];

  it('adiciona trilhas novas de packs possuídos', () => {
    const packs = [pack({ conteudo: { trilhas: [trilha(1000)] } })];
    const merged = mergeTrilhas(hardcoded, packs);
    expect(merged.map(t => t.id)).toEqual([1, 2, 1000]);
  });

  it('não duplica trilha com id já existente no hardcoded', () => {
    const packs = [pack({ conteudo: { trilhas: [trilha(1, { titulo: 'Duplicada' })] } })];
    const merged = mergeTrilhas(hardcoded, packs);
    expect(merged).toHaveLength(2);
    expect(merged.find(t => t.id === 1)?.titulo).toBe('Trilha 1');
  });

  it('não duplica trilha com id repetido entre dois packs', () => {
    const packs = [
      pack({ id: 'p1', conteudo: { trilhas: [trilha(1000)] } }),
      pack({ id: 'p2', conteudo: { trilhas: [trilha(1000, { titulo: 'De novo' })] } }),
    ];
    const merged = mergeTrilhas(hardcoded, packs);
    expect(merged.filter(t => t.id === 1000)).toHaveLength(1);
  });

  it('inclui trilhas mesmo de pack não possuído (diferente dos outros game_types)', () => {
    // Trilha não é comprada "por pacote inteiro" — cada trilha resolve seu
    // próprio free/premium via o campo "gratis", não via GamePack.owned.
    const packs = [pack({ owned: false, gratuito: false, conteudo: { trilhas: [trilha(1000, { gratis: false })] } })];
    const merged = mergeTrilhas(hardcoded, packs);
    expect(merged.find(t => t.id === 1000)?.gratis).toBe(false);
  });
});
