jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));
jest.mock('@/context/auth-context', () => ({
  useAuth: jest.fn(),
}));

import {
  MAX_XP_STOP,
  maxXpLatim,
  maxXpPalavras,
  maxXpPeregrinacao,
  maxXpQuiz,
} from '@/lib/game-xp';
import { ECONOMY } from '@/constants/economy';
import { WORDS_PER_ROUND } from '@/constants/puzzle-themes';
import type { GamePack, PuzzleTheme, QuizQuestion, Sanctuary } from '@/hooks/use-game-packs';
import type { LatimBoggleLevel } from '@/constants/latim-boggle-levels';

function pack(conteudo: Record<string, unknown>, owned = true): GamePack {
  return {
    id: 'p1',
    game_type: 'quiz',
    titulo: 'Pack',
    gratuito: false,
    coins_price: 100,
    conteudo,
    owned,
  };
}

const q = (difficulty: QuizQuestion['difficulty']): QuizQuestion => ({
  topic: 't', question: 'q', options: ['a'], correct: 0, difficulty,
});

describe('maxXpQuiz', () => {
  it('devolve o XP total da dificuldade mais valiosa', () => {
    // 3 fáceis = 15, 2 médias = 14, 1 difícil = 9 → máximo é o fácil (15)
    const base = [q('facil'), q('facil'), q('facil'), q('medio'), q('medio'), q('dificil')];
    expect(maxXpQuiz(base, [])).toBe(3 * ECONOMY.XP_FACIL);
  });

  it('a dificuldade difícil vence quando tem mais XP total', () => {
    const base = [q('facil'), q('dificil'), q('dificil')];
    expect(maxXpQuiz(base, [])).toBe(2 * ECONOMY.XP_DIFICIL);
  });

  it('conta perguntas de packs possuídos', () => {
    const base = [q('facil')];
    const packs = [pack({ perguntas: [q('facil'), q('facil')] })];
    expect(maxXpQuiz(base, packs)).toBe(3 * ECONOMY.XP_FACIL);
  });

  it('ignora perguntas de packs não possuídos', () => {
    const base = [q('facil')];
    const packs = [pack({ perguntas: [q('facil'), q('facil')] }, false)];
    expect(maxXpQuiz(base, packs)).toBe(1 * ECONOMY.XP_FACIL);
  });
});

describe('maxXpPalavras', () => {
  const theme = (difficulty: PuzzleTheme['difficulty'], nWords: number): PuzzleTheme => ({
    title: 't', subtitle: 's', difficulty, gridSize: 8,
    words: Array.from({ length: nWords }, (_, i) => `PALAVRA${i}`),
  });

  it('usa a amostra fixa por rodada (WORDS_PER_ROUND), não o tamanho do banco do tema', () => {
    const base = [theme('facil', 3), theme('facil', 20)];
    expect(maxXpPalavras(base, [])).toBe(WORDS_PER_ROUND.facil * ECONOMY.XP_FACIL);
  });

  it('compara dificuldades pelo XP total da amostra de cada uma', () => {
    const base = [theme('facil', 8), theme('dificil', 5)];
    const expected = Math.max(
      WORDS_PER_ROUND.facil * ECONOMY.XP_FACIL,
      WORDS_PER_ROUND.dificil * ECONOMY.XP_DIFICIL,
    );
    expect(maxXpPalavras(base, [])).toBe(expected);
  });

  it('dificuldade sem temas conta como zero em vez de quebrar', () => {
    const base = [theme('medio', 4)];
    expect(maxXpPalavras(base, [])).toBe(WORDS_PER_ROUND.medio * ECONOMY.XP_MEDIO);
  });
});

describe('maxXpLatim', () => {
  const level = (difficulty: LatimBoggleLevel['difficulty'], nWords: number): LatimBoggleLevel => ({
    id: 'l', title: 't', difficulty, gridSize: 6,
    words: Array.from({ length: nWords }, (_, i) => ({ word: `VERBUM${i}`, meaning: 'x' })),
  });

  it('soma as palavras de TODOS os níveis da dificuldade', () => {
    const base = [level('facil', 4), level('facil', 3), level('medio', 2)];
    // fácil: 7×5=35; médio: 2×7=14
    expect(maxXpLatim(base, [])).toBe(7 * ECONOMY.XP_FACIL);
  });
});

describe('maxXpPeregrinacao', () => {
  const sanctuary = (nQuestions: number): Sanctuary => ({
    emoji: '⛪', name: 's', country: 'BR', description: 'd',
    questions: Array.from({ length: nQuestions }, () => ({ question: 'q', options: ['a'], correct: 0 })),
  });

  it('vale o total de perguntas de todos os santuários em XP médio', () => {
    const base = [sanctuary(3), sanctuary(2)];
    expect(maxXpPeregrinacao(base, [])).toBe(5 * ECONOMY.XP_MEDIO);
  });
});

describe('MAX_XP_STOP', () => {
  it('é fixo em 6 categorias × XP médio', () => {
    expect(MAX_XP_STOP).toBe(6 * ECONOMY.XP_MEDIO);
  });
});
