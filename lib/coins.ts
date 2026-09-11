import { supabase } from './supabase';

// Débito de moedas por um recurso pago (dica, trocar/sortear categoria, etc.).
//
// Usa a forma de 3 argumentos de add_coins (com p_motivo) de propósito: ela é
// inequívoca no PostgREST mesmo enquanto a versão antiga de 2 argumentos ainda
// existir no banco, então não sofre o PGRST203 que quebrava a dica.
//
// Retorna true só quando o débito foi confirmado. Chame ANTES de conceder o
// benefício e não conceda nada se retornar false — evita dar item de graça
// quando o RPC falha (que era o comportamento silencioso de vários handlers).
export async function spendCoins(userId: string, cost: number, motivo: string): Promise<boolean> {
  const { error } = await supabase.rpc('add_coins', {
    p_user_id: userId,
    p_amount:  -Math.abs(cost),
    p_motivo:  motivo,
  });
  return !error;
}
