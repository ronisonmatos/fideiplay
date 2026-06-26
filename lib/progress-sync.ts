import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const GAME_KEY   = '@fideiplay:game_store';
const TRILHA_KEY = '@santosplay:trilhas_progresso';

export interface ProgressSnapshot {
  gamesXp:              number;
  gamesPlayed:          number;
  unlockedAchievements: string[];
  licoesConcluidas:     string[];
  trilhasXp:            number;
}

// ── Leitura local (usada pelo pushProgress) ──────────────────────────────────

async function readLocalProgress(): Promise<ProgressSnapshot> {
  const [gameRaw, trilhaRaw] = await Promise.all([
    AsyncStorage.getItem(GAME_KEY),
    AsyncStorage.getItem(TRILHA_KEY),
  ]);
  const game   = gameRaw   ? (JSON.parse(gameRaw)   as Record<string, unknown>) : {};
  const trilha = trilhaRaw ? (JSON.parse(trilhaRaw) as Record<string, unknown>) : {};
  return {
    gamesXp:              typeof game.totalScore === 'number'                ? game.totalScore              : 0,
    gamesPlayed:          typeof game.gamesPlayed === 'number'               ? game.gamesPlayed             : 0,
    unlockedAchievements: Array.isArray(game.unlockedAchievements)           ? (game.unlockedAchievements as string[])  : [],
    licoesConcluidas:     Array.isArray(trilha.licoesConcluidas)             ? (trilha.licoesConcluidas as string[])    : [],
    trilhasXp:            typeof trilha.xpTotal === 'number'                 ? trilha.xpTotal               : 0,
  };
}

// ── Push → Supabase ──────────────────────────────────────────────────────────

export async function pushProgress(userId: string): Promise<void> {
  const local = await readLocalProgress();
  // Não envia se não há nada significativo — evita enviar arrays vazios ao banco
  if (local.gamesXp === 0 && local.gamesPlayed === 0 && local.licoesConcluidas.length === 0 && local.trilhasXp === 0) return;
  const { error } = await supabase.rpc('merge_user_progress', {
    p_user_id:               userId,
    p_games_played:          local.gamesPlayed,
    p_games_xp:              local.gamesXp,
    p_unlocked_achievements: local.unlockedAchievements,
    p_licoes_concluidas:     local.licoesConcluidas,
    p_trilhas_xp:            local.trilhasXp,
  });
  if (error) console.warn('[progressSync] push error:', error.message);
}

// Versão que recebe os valores de jogo diretamente (sem ler AsyncStorage),
// evitando race condition quando o push é chamado logo após a escrita no AS.
export async function pushGameProgress(
  userId:               string,
  gamesXp:              number,
  gamesPlayed:          number,
  unlockedAchievements: string[],
): Promise<void> {
  const trilhaRaw = await AsyncStorage.getItem(TRILHA_KEY);
  const trilha    = trilhaRaw ? (JSON.parse(trilhaRaw) as Record<string, unknown>) : {};
  const { error } = await supabase.rpc('merge_user_progress', {
    p_user_id:               userId,
    p_games_played:          gamesPlayed,
    p_games_xp:              gamesXp,
    p_unlocked_achievements: unlockedAchievements,
    p_licoes_concluidas:     Array.isArray(trilha.licoesConcluidas) ? trilha.licoesConcluidas : [],
    p_trilhas_xp:            typeof trilha.xpTotal === 'number'     ? trilha.xpTotal          : 0,
  });
  if (error) console.warn('[progressSync] pushGame error:', error.message);
}

// ── Pull ← Supabase (sem merge com dados offline) ────────────────────────────

export async function pullProgress(userId: string): Promise<ProgressSnapshot | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('games_xp, games_played, unlocked_achievements, licoes_concluidas, trilhas_xp')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    gamesXp:              typeof data.games_xp    === 'number' ? data.games_xp    : 0,
    gamesPlayed:          typeof data.games_played === 'number' ? data.games_played : 0,
    unlockedAchievements: Array.isArray(data.unlocked_achievements) ? data.unlocked_achievements : [],
    licoesConcluidas:     Array.isArray(data.licoes_concluidas)     ? data.licoes_concluidas     : [],
    trilhasXp:            typeof data.trilhas_xp  === 'number' ? data.trilhas_xp  : 0,
  };
}
