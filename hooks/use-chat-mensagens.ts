import { useCallback, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 30;
const DIAS_HISTORICO = 90;

export interface MensagemChat {
  id: string;
  user_id: string;
  user_name: string;
  avatar_emoji: string | null;
  content: string;
  created_at: string;
}

const SELECT_COLS = 'id, user_id, user_name, avatar_emoji, content, created_at';

function dataLimite90Dias(): string {
  return new Date(Date.now() - DIAS_HISTORICO * 24 * 60 * 60 * 1000).toISOString();
}

// Paginação do chat da comunidade — mantém `mensagens` sempre em ordem
// ascendente (mais antiga → mais recente); quem consome pra uma FlatList
// `inverted` precisa inverter esse array antes de passar pro `data`.
export function useChatMensagens() {
  const [mensagens,      setMensagens]      = useState<MensagemChat[]>([]);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais,        setTemMais]        = useState(true);
  const [blockedIds,     setBlockedIds]     = useState<Set<string>>(new Set());

  const mensagensRef   = useRef<MensagemChat[]>([]);
  mensagensRef.current = mensagens;
  const carregandoRef  = useRef(false);
  const blockedRef     = useRef<Set<string>>(new Set());

  // Carrega quem o usuário atual bloqueou — chamado uma vez junto com
  // carregarInicial() no mount da tela de chat.
  const carregarBloqueios = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', userId);
    if (error || !data) return;
    const ids = new Set(data.map(b => b.blocked_id));
    blockedRef.current = ids;
    setBlockedIds(ids);
  }, []);

  const carregarInicial = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(SELECT_COLS)
        .is('deleted_at', null)
        .gte('created_at', dataLimite90Dias())
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error || !data) return;
      setMensagens([...data].reverse().filter(m => !blockedRef.current.has(m.user_id)));
      setTemMais(data.length === PAGE_SIZE);
    } catch { /* mantém lista vazia — usuário pode tentar de novo ao focar a tela */ }
  }, []);

  const carregarMais = useCallback(async () => {
    if (carregandoRef.current || !temMais) return;
    const maisAntiga = mensagensRef.current[0];
    if (!maisAntiga) return;

    carregandoRef.current = true;
    setCarregandoMais(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(SELECT_COLS)
        .is('deleted_at', null)
        .gte('created_at', dataLimite90Dias())
        .lt('created_at', maisAntiga.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error || !data) { setTemMais(false); return; }
      setTemMais(data.length === PAGE_SIZE);
      if (data.length > 0) {
        const filtradas = [...data].reverse().filter(m => !blockedRef.current.has(m.user_id));
        setMensagens(prev => [...filtradas, ...prev]);
      }
    } catch {
      setTemMais(false);
    } finally {
      carregandoRef.current = false;
      setCarregandoMais(false);
    }
  }, [temMais]);

  // Nova mensagem chegada em tempo real — adiciona no final sem recarregar tudo
  const novaMensagem = useCallback((msg: MensagemChat) => {
    if (blockedRef.current.has(msg.user_id)) return;
    setMensagens(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  const removerMensagem = useCallback((id: string) => {
    setMensagens(prev => prev.filter(m => m.id !== id));
  }, []);

  const bloquearUsuario = useCallback(async (blockerId: string, blockedId: string) => {
    const { error } = await supabase
      .from('blocked_users')
      .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });
    if (error) return false;
    blockedRef.current = new Set(blockedRef.current).add(blockedId);
    setBlockedIds(new Set(blockedRef.current));
    setMensagens(prev => prev.filter(m => m.user_id !== blockedId));
    return true;
  }, []);

  const desbloquearUsuario = useCallback(async (blockerId: string, blockedId: string) => {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    if (error) return false;
    const novo = new Set(blockedRef.current);
    novo.delete(blockedId);
    blockedRef.current = novo;
    setBlockedIds(novo);
    return true;
  }, []);

  return {
    mensagens, carregandoMais, temMais, blockedIds,
    carregarInicial, carregarMais, novaMensagem, removerMensagem,
    carregarBloqueios, bloquearUsuario, desbloquearUsuario,
  };
}
