import { supabase } from '@/lib/supabase';
import type { BankResult } from '@/lib/stop-bank';

export type ContestStatus = 'pending' | 'approved' | 'rejected';

export interface StopContest {
  id: string;
  category_key: string;
  answer: string;
  status: ContestStatus;
}

export function isContestable(result: BankResult | undefined, answer: string): boolean {
  if (!answer.trim()) return false;
  return result === 'invalid' || result === 'ai_invalid' || result === 'unverified';
}

export async function submitContest(params: {
  userId: string;
  roomId: string | null;
  categoryKey: string;
  letter: string;
  answer: string;
  originalResult: BankResult;
  gameMode: 'solo' | 'online';
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('stop_contests').insert({
    user_id:         params.userId,
    room_id:         params.roomId,
    category_key:    params.categoryKey,
    letter:          params.letter,
    answer:          params.answer.trim(),
    original_result: params.originalResult,
    game_mode:       params.gameMode,
  });

  if (error) {
    // Unique violation = já contestou essa resposta
    if (error.code === '23505') return { ok: false, error: 'Você já contestou essa resposta.' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Retorna as contestações já enviadas pelo usuário para uma partida específica
export async function fetchMyContests(userId: string, roomId: string | null): Promise<Set<string>> {
  const query = supabase
    .from('stop_contests')
    .select('category_key')
    .eq('user_id', userId);

  if (roomId) query.eq('room_id', roomId);
  else query.is('room_id', null);

  const { data } = await query;
  return new Set((data ?? []).map(r => r.category_key));
}
