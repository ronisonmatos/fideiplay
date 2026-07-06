import AsyncStorage from '@react-native-async-storage/async-storage';

import { ECONOMY } from '@/constants/economy';
import { supabase } from './supabase';

const PENDING_KEY = '@santosplay:convite_pendente';

function gerarCodigo(userId: string): string {
  const base = `${userId}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  return hash.toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
}

// Cria um convite novo pro usuário (respeita o limite de ECONOMY.LIMITE_CONVITES)
// e devolve o link pronto pra compartilhar. null = limite atingido ou erro.
export async function criarConvite(userId: string): Promise<string | null> {
  try {
    const { count, error: countError } = await supabase
      .from('convites')
      .select('id', { count: 'exact', head: true })
      .eq('convidante_id', userId);
    if (countError) throw countError;
    if ((count ?? 0) >= ECONOMY.LIMITE_CONVITES) return null;

    const codigo = gerarCodigo(userId);
    const { error } = await supabase.from('convites').insert({ codigo, convidante_id: userId });
    if (error) throw error;

    // Esquema customizado do app (ver app.json) — só abre o app se ele já
    // estiver instalado. Um link https:// não funcionaria sem Universal Links
    // configurados num domínio real, que este projeto não tem.
    return `santosplay://convite/${codigo}`;
  } catch {
    return null;
  }
}

// Aplica um código de convite pro usuário que acabou de abrir o link — credita
// bônus pro convidado e pra quem convidou. Idempotente: só credita uma vez
// (guarda atômica via .eq('status', 'pendente') no update).
export async function aplicarConvite(codigo: string, userId: string): Promise<boolean> {
  try {
    const { data: convite, error } = await supabase
      .from('convites')
      .select('id, convidante_id, status')
      .eq('codigo', codigo)
      .maybeSingle();
    if (error || !convite) return false;
    if (convite.status !== 'pendente') return false;
    if (convite.convidante_id === userId) return false; // não pode convidar a si mesmo

    const { data: updated, error: updateError } = await supabase
      .from('convites')
      .update({ convidado_id: userId, status: 'convertido', convertido_em: new Date().toISOString() })
      .eq('id', convite.id)
      .eq('status', 'pendente')
      .select('id')
      .maybeSingle();
    if (updateError || !updated) return false;

    await Promise.all([
      supabase.rpc('add_coins', { p_user_id: userId, p_amount: ECONOMY.BONUS_AMIGO_CONVIDADO }),
      supabase.rpc('add_coins', { p_user_id: convite.convidante_id, p_amount: ECONOMY.BONUS_QUEM_CONVIDOU }),
    ]);
    return true;
  } catch {
    return false;
  }
}

// Guarda o código localmente quando o usuário abre o link sem estar logado —
// aplicado depois que ele completar cadastro/login (ver processarConvitePendente).
export async function salvarConvitePendente(codigo: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_KEY, codigo);
  } catch { /* best-effort */ }
}

// Chamar após login/cadastro — aplica um convite pendente salvo localmente, se houver.
export async function processarConvitePendente(userId: string): Promise<void> {
  try {
    const codigo = await AsyncStorage.getItem(PENDING_KEY);
    if (!codigo) return;
    await AsyncStorage.removeItem(PENDING_KEY);
    await aplicarConvite(codigo, userId);
  } catch { /* best-effort */ }
}
