import { ECONOMY } from '@/constants/economy';
import type { LatimBoggleLevel } from '@/constants/latim-boggle-levels';
import {
  mergeLatimLevels,
  mergeLiturgQuestions,
  mergePuzzleThemes,
  mergeQuizQuestions,
  mergeSanctuaries,
  mergeVersiculo,
  type FraseSagrada,
  type GamePack,
  type LiturgQuestion,
  type PuzzleTheme,
  type QuizQuestion,
  type Sanctuary,
} from '@/hooks/use-game-packs';

const DIFFS = ['facil', 'medio', 'dificil'] as const;
const XP_BY_DIFF: Record<(typeof DIFFS)[number], number> = {
  facil: ECONOMY.XP_FACIL,
  medio: ECONOMY.XP_MEDIO,
  dificil: ECONOMY.XP_DIFICIL,
};

// Quiz, Sabedoria Católica e Desafio Litúrgico: uma rodada usa TODAS as
// perguntas daquela dificuldade — o máximo é a dificuldade com mais XP total.
function maxByDifficultyCount(items: { difficulty: string }[]): number {
  return Math.max(
    ...DIFFS.map(d => items.filter(i => i.difficulty === d).length * XP_BY_DIFF[d]),
  );
}

export function maxXpQuiz(base: QuizQuestion[], packs: GamePack[]): number {
  return maxByDifficultyCount(mergeQuizQuestions(base, packs));
}

export function maxXpVersiculo(base: FraseSagrada[], packs: GamePack[]): number {
  return maxByDifficultyCount(mergeVersiculo(base, packs));
}

export function maxXpLiturgico(base: LiturgQuestion[], packs: GamePack[]): number {
  return maxByDifficultyCount(mergeLiturgQuestions(base, packs));
}

// Palavras da Fé: cada rodada joga só UM tema sorteado daquela dificuldade —
// o máximo é o tema com mais palavras, não a soma de todos os temas.
export function maxXpPalavras(base: PuzzleTheme[], packs: GamePack[]): number {
  const all = mergePuzzleThemes(base, packs);
  return Math.max(
    ...DIFFS.map(d => {
      const themes = all.filter(t => t.difficulty === d);
      const maxWords = themes.length ? Math.max(...themes.map(t => t.words.length)) : 0;
      return maxWords * XP_BY_DIFF[d];
    }),
  );
}

// Boggle Latim: uma rodada percorre TODOS os níveis daquela dificuldade,
// ganhando XP por palavra encontrada em cada um.
export function maxXpLatim(base: LatimBoggleLevel[], packs: GamePack[]): number {
  const all = mergeLatimLevels(base, packs);
  return Math.max(
    ...DIFFS.map(d => {
      const words = all.filter(l => l.difficulty === d).reduce((sum, l) => sum + l.words.length, 0);
      return words * XP_BY_DIFF[d];
    }),
  );
}

// Peregrinação não tem dificuldade — é uma jornada contínua por todos os
// santuários. O "máximo" aqui é completar a jornada inteira com tudo certo.
export function maxXpPeregrinacao(base: Sanctuary[], packs: GamePack[]): number {
  const all = mergeSanctuaries(base, packs);
  const totalQuestions = all.reduce((sum, s) => sum + s.questions.length, 0);
  return totalQuestions * ECONOMY.XP_MEDIO;
}

// Stop Católico sempre sorteia exatamente 6 categorias por rodada — o máximo
// não cresce com mais categorias no banco, então não precisa consultar packs.
export const MAX_XP_STOP = 6 * ECONOMY.XP_MEDIO;
