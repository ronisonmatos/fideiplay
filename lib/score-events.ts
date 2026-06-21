import { supabase } from './supabase';

export type ScoreSource = 'stop_solo' | 'stop_online';

export async function recordScoreEvent(
  userId: string,
  points: number,
  source: ScoreSource,
): Promise<void> {
  if (!userId || points <= 0) return;
  await supabase.from('score_events').insert({ user_id: userId, points, source });
}

export type RankingEntry = {
  user_id:      string;
  name:         string;
  avatar_emoji: string;
  weekly_score: number;
};

export async function getWeeklyRanking(): Promise<RankingEntry[]> {
  const { data } = await supabase.rpc('get_weekly_ranking');
  return (data ?? []) as RankingEntry[];
}

