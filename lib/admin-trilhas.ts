import { supabase } from '@/lib/supabase';

export interface AdminUserResult {
  id:           string;
  name:         string;
  avatar_emoji: string;
  email:        string;
  coins:        number;
  total_score:  number;
  is_admin:     boolean;
}

export async function searchUsers(query: string): Promise<{ data: AdminUserResult[]; error?: string }> {
  const { data, error } = await supabase.rpc('admin_search_users', { p_query: query.trim() });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AdminUserResult[] };
}

export async function listUserTrilhas(userId: string): Promise<{ trilhaIds: Set<number>; error?: string }> {
  const { data, error } = await supabase.rpc('admin_list_user_trilhas', { p_user_id: userId });
  if (error) return { trilhaIds: new Set(), error: error.message };
  return { trilhaIds: new Set((data ?? []).map((r: { trilha_id: number }) => r.trilha_id)) };
}

export async function unlockTrilha(userId: string, trilhaId: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_unlock_trilha', {
    p_user_id: userId, p_trilha_id: trilhaId, p_origem: 'manual',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function revokeTrilha(userId: string, trilhaId: number): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_revoke_trilha', { p_user_id: userId, p_trilha_id: trilhaId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
