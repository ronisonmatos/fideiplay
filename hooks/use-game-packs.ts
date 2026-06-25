import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export type GameType = 'quiz' | 'versiculo' | 'peregrinacao' | 'palavras' | 'liturgico' | 'stop';

export interface GamePack {
  id: string;
  game_type: GameType;
  titulo: string;
  descricao?: string;
  categoria?: string;
  gratuito: boolean;
  coins_price: number;
  conteudo: Record<string, unknown>;
  owned: boolean;
}

interface UseGamePacksResult {
  packs: GamePack[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useGamePacks(gameType: GameType): UseGamePacksResult {
  const { user } = useAuth();
  const [packs, setPacks]   = useState<GamePack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPacks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: packRows, error } = await supabase
        .from('game_packs')
        .select('id, game_type, titulo, descricao, categoria, gratuito, coins_price, conteudo, ordem')
        .eq('game_type', gameType)
        .eq('ativo', true)
        .eq('visivel', true)
        .order('ordem', { ascending: true });

      if (error || !packRows?.length) {
        setPacks([]);
        return;
      }

      // fetch which packs this user already owns
      let ownedIds = new Set<string>();
      if (user?.id) {
        const { data: owned } = await supabase
          .from('user_game_packs')
          .select('pack_id')
          .eq('user_id', user.id);
        if (owned) ownedIds = new Set(owned.map((r) => r.pack_id));
      }

      const mapped: GamePack[] = packRows.map((row) => ({
        id: row.id,
        game_type: row.game_type,
        titulo: row.titulo,
        descricao: row.descricao,
        categoria: row.categoria,
        gratuito: row.gratuito,
        coins_price: row.coins_price,
        conteudo: row.conteudo,
        owned: row.gratuito || ownedIds.has(row.id),
      }));

      setPacks(mapped);
    } catch {
      setPacks([]);
    } finally {
      setLoading(false);
    }
  }, [gameType, user?.id]);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  return { packs, loading, refresh: fetchPacks };
}

// ── Content merge helpers — one per game type ─────────────────────────────────

export interface QuizQuestion {
  topic: string;
  question: string;
  options: string[];
  correct: number;
  difficulty: 'facil' | 'medio' | 'dificil';
}

export function mergeQuizQuestions(
  hardcoded: QuizQuestion[],
  packs: GamePack[],
): QuizQuestion[] {
  const extra: QuizQuestion[] = [];
  for (const pack of packs) {
    if (!pack.owned) continue;
    const perguntas = (pack.conteudo as { perguntas?: QuizQuestion[] }).perguntas;
    if (Array.isArray(perguntas)) extra.push(...perguntas);
  }
  return [...hardcoded, ...extra];
}

export interface FraseSagrada {
  words: string[];
  reference: string;
  options: string[];
  type: 'versículo' | 'santo' | 'papa' | 'documento';
  difficulty: 'facil' | 'medio' | 'dificil';
}

export function mergeVersiculo(
  hardcoded: FraseSagrada[],
  packs: GamePack[],
): FraseSagrada[] {
  const extra: FraseSagrada[] = [];
  for (const pack of packs) {
    if (!pack.owned) continue;
    const frases = (pack.conteudo as { frases?: FraseSagrada[] }).frases;
    if (Array.isArray(frases)) extra.push(...frases);
  }
  return [...hardcoded, ...extra];
}

export interface Sanctuary {
  emoji: string;
  name: string;
  country: string;
  description: string;
  questions: { question: string; options: string[]; correct: number }[];
}

export function mergeSanctuaries(
  hardcoded: Sanctuary[],
  packs: GamePack[],
): Sanctuary[] {
  const extra: Sanctuary[] = [];
  for (const pack of packs) {
    if (!pack.owned) continue;
    const santuarios = (pack.conteudo as { santuarios?: Sanctuary[] }).santuarios;
    if (Array.isArray(santuarios)) extra.push(...santuarios);
  }
  return [...hardcoded, ...extra];
}

export interface PuzzleTheme {
  title: string;
  subtitle: string;
  words: string[];
  difficulty: 'facil' | 'medio' | 'dificil';
  gridSize: number;
}

export function mergePuzzleThemes(
  hardcoded: PuzzleTheme[],
  packs: GamePack[],
): PuzzleTheme[] {
  const extra: PuzzleTheme[] = [];
  for (const pack of packs) {
    if (!pack.owned) continue;
    const temas = (pack.conteudo as { temas?: PuzzleTheme[] }).temas;
    if (Array.isArray(temas)) extra.push(...temas);
  }
  return [...hardcoded, ...extra];
}

export interface LiturgQuestion {
  question: string;
  options: string[];
  correct: number;
  hint: string;
  difficulty: 'facil' | 'medio' | 'dificil';
}

export function mergeLiturgQuestions(
  hardcoded: LiturgQuestion[],
  packs: GamePack[],
): LiturgQuestion[] {
  const extra: LiturgQuestion[] = [];
  for (const pack of packs) {
    if (!pack.owned) continue;
    const perguntas = (pack.conteudo as { perguntas?: LiturgQuestion[] }).perguntas;
    if (Array.isArray(perguntas)) extra.push(...perguntas);
  }
  return [...hardcoded, ...extra];
}

export interface StopCategoryDB {
  key: string;
  label: string;
  emoji: string;
}

export function mergeStopCategories(
  hardcoded: StopCategoryDB[],
  packs: GamePack[],
): StopCategoryDB[] {
  const existingKeys = new Set(hardcoded.map((c) => c.key));
  const extra: StopCategoryDB[] = [];
  for (const pack of packs) {
    if (!pack.owned) continue;
    const cats = (pack.conteudo as { categorias?: StopCategoryDB[] }).categorias;
    if (Array.isArray(cats)) {
      for (const c of cats) {
        if (!existingKeys.has(c.key)) {
          existingKeys.add(c.key);
          extra.push(c);
        }
      }
    }
  }
  return [...hardcoded, ...extra];
}
