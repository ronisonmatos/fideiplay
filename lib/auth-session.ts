import type { Session } from '@supabase/supabase-js';

// Subconjunto de supabase.auth que a recuperação usa — receber como parâmetro
// (em vez de importar o client) permite testar a lógica sem módulos nativos.
export interface AuthClientLike {
  getSession: () => Promise<{ data: { session: Session | null } }>;
  refreshSession: () => Promise<{
    data: { session: Session | null };
    error: { message?: string } | null;
  }>;
}

export interface RecoverOptions {
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

// Recupera a sessão com tentativas + backoff. Ao voltar do background (ou
// logo após atualizar o app), a rede pode levar vários segundos pra ficar
// pronta — uma única tentativa falha e deixava o usuário "deslogado" até
// fechar e reabrir o app. Retorna null só quando o refresh token é realmente
// inválido/revogado ou não há sessão armazenada (visitante) — casos em que
// insistir não adianta.
export async function recoverSessionWithRetry(
  auth: AuthClientLike,
  {
    attempts = 4,
    baseDelayMs = 1500,
    sleep = ms => new Promise<void>(r => setTimeout(r, ms)),
  }: RecoverOptions = {},
): Promise<Session | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { data: { session: s } } = await auth.getSession();
    if (s) return s;
    const { data: refreshed, error } = await auth.refreshSession();
    if (refreshed?.session) return refreshed.session;
    const msg = (error?.message ?? '').toLowerCase();
    if (msg.includes('refresh token') || msg.includes('session missing')) return null;
    console.warn(`[auth] recoverSession falhou (tentativa ${attempt + 1}/${attempts}):`, error);
    if (attempt < attempts - 1) await sleep(baseDelayMs * (attempt + 1));
  }
  return null;
}
