import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';

export interface Transacao {
  id: number;
  valor: number;
  tipo: 'ganho' | 'gasto';
  motivo: string | null;
  criado_em: string;
}

export function useMoedas() {
  const { user, profile, refreshProfile } = useAuth();
  const [historico, setHistorico] = useState<Transacao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const saldo = profile?.coins ?? 0;

  const fetchHistorico = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistorico(true);
    const { data } = await supabase
      .from('transacoes_moedas')
      .select('id, valor, tipo, motivo, criado_em')
      .eq('usuario_id', user.id)
      .order('criado_em', { ascending: false })
      .limit(20);
    setHistorico((data as Transacao[]) ?? []);
    setLoadingHistorico(false);
  }, [user?.id]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const ganhar = useCallback(async (valor: number, motivo: string): Promise<boolean> => {
    if (!user?.id || valor <= 0) return false;
    const { error } = await supabase.rpc('add_coins', {
      p_user_id: user.id,
      p_amount:  valor,
      p_motivo:  motivo,
    });
    if (!error) {
      await refreshProfile();
      fetchHistorico();
    }
    return !error;
  }, [user?.id, refreshProfile, fetchHistorico]);

  const gastar = useCallback(async (valor: number, motivo: string): Promise<boolean> => {
    if (!user?.id || valor <= 0 || saldo < valor) return false;
    const { error } = await supabase.rpc('add_coins', {
      p_user_id: user.id,
      p_amount:  -valor,
      p_motivo:  motivo,
    });
    if (!error) {
      await refreshProfile();
      fetchHistorico();
    }
    return !error;
  }, [user?.id, saldo, refreshProfile, fetchHistorico]);

  return { saldo, historico, loadingHistorico, ganhar, gastar, fetchHistorico };
}
