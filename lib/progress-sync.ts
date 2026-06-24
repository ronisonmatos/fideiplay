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

// ── Leitura local ────────────────────────────────────────────────────────────

export async function readLocalProgress(): Promise<ProgressSnapshot> {
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

// ── Escrita local ────────────────────────────────────────────────────────────

async function writeLocalProgress(snap: ProgressSnapshot): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(GAME_KEY, JSON.stringify({
      totalScore:           snap.gamesXp,
      gamesPlayed:          snap.gamesPlayed,
      unlockedAchievements: snap.unlockedAchievements,
    })),
    AsyncStorage.setItem(TRILHA_KEY, JSON.stringify({
      licoesConcluidas: snap.licoesConcluidas,
      xpTotal:          snap.trilhasXp,
    })),
  ]);
}

// ── Merge (nunca perde dados) ────────────────────────────────────────────────

function mergeSnapshots(a: ProgressSnapshot, b: ProgressSnapshot): ProgressSnapshot {
  return {
    gamesXp:              Math.max(a.gamesXp, b.gamesXp),
    gamesPlayed:          Math.max(a.gamesPlayed, b.gamesPlayed),
    unlockedAchievements: [...new Set([...a.unlockedAchievements, ...b.unlockedAchievements])],
    licoesConcluidas:     [...new Set([...a.licoesConcluidas,     ...b.licoesConcluidas])],
    trilhasXp:            Math.max(a.trilhasXp, b.trilhasXp),
  };
}

// ── Push → Supabase ──────────────────────────────────────────────────────────

export async function pushProgress(userId: string): Promise<void> {
  const local = await readLocalProgress();
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

// ── Pull ← Supabase + merge com local ────────────────────────────────────────

export async function pullProgress(userId: string): Promise<ProgressSnapshot | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('games_xp, games_played, unlocked_achievements, licoes_concluidas, trilhas_xp')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  const remote: ProgressSnapshot = {
    gamesXp:              typeof data.games_xp    === 'number' ? data.games_xp    : 0,
    gamesPlayed:          typeof data.games_played === 'number' ? data.games_played : 0,
    unlockedAchievements: Array.isArray(data.unlocked_achievements) ? data.unlocked_achievements : [],
    licoesConcluidas:     Array.isArray(data.licoes_concluidas)     ? data.licoes_concluidas     : [],
    trilhasXp:            typeof data.trilhas_xp  === 'number' ? data.trilhas_xp  : 0,
  };

  const local  = await readLocalProgress();
  const merged = mergeSnapshots(local, remote);

  // Salva o resultado mesclado localmente
  await writeLocalProgress(merged);

  return merged;
}
