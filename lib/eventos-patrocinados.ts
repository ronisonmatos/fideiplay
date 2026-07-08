import { supabase } from '@/lib/supabase';
import { triggerDispatchNow } from '@/lib/admin-notifications';
import type { AlcanceEvento, PeriodoEvento } from '@/constants/eventos-precos';

export interface EventoPatrocinado {
  id:                       string;
  usuario_id:               string;
  titulo:                   string;
  descricao:                string;
  imagem_url:               string | null;
  link_externo:             string | null;
  data_inicio:              string;
  data_fim:                 string;
  local_evento:             string | null;
  alcance:                  AlcanceEvento;
  estados:                  string[];
  cidades:                  string[];
  periodo:                  PeriodoEvento;
  exibicao_inicio:          string | null;
  exibicao_fim:             string | null;
  status:                   'aguardando_pagamento' | 'aguardando_aprovacao' | 'aprovado' | 'ativo' | 'rejeitado' | 'encerrado';
  motivo_rejeicao:          string | null;
  erro_reembolso:           string | null;
  valor_pago:               number | null;
  payment_id:               string | null;
  aprovado_por:             string | null;
  aprovado_em:              string | null;
  criado_em:                string;
  impressoes:               number;
  cliques:                  number;
}

export interface NovoEventoInput {
  usuarioId:     string;
  titulo:        string;
  descricao:     string;
  imagemUrl:     string | null;
  linkExterno:   string | null;
  dataInicio:    string; // YYYY-MM-DD
  dataFim:       string; // YYYY-MM-DD
  localEvento:   string;
  alcance:       AlcanceEvento;
  estados:       string[];
  cidades:       string[];
  periodo:       PeriodoEvento;
}

// Lê o liga/desliga de eventos_patrocinados_ativo em app_config (mesmo padrão de fetchBannerAtivo)
export async function fetchEventosPatrocinadosAtivo(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'eventos_patrocinados_ativo')
      .maybeSingle();
    if (error || !data) return true;
    return data.value !== 'false';
  } catch {
    return true;
  }
}

// Cria a linha em status 'aguardando_pagamento' — deve existir ANTES de chamar
// create-payment, pra ter um evento_id pra vincular ao pagamento.
export async function criarEvento(input: NovoEventoInput): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from('eventos_patrocinados')
    .insert({
      usuario_id:   input.usuarioId,
      titulo:       input.titulo,
      descricao:    input.descricao,
      imagem_url:   input.imagemUrl,
      link_externo: input.linkExterno,
      data_inicio:  input.dataInicio,
      data_fim:     input.dataFim,
      local_evento: input.localEvento,
      alcance:      input.alcance,
      estados:      input.estados,
      cidades:      input.cidades,
      periodo:      input.periodo,
      status:       'aguardando_pagamento',
    })
    .select('id')
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data.id as string };
}

export async function listMeusEventos(userId: string): Promise<EventoPatrocinado[]> {
  const { data, error } = await supabase
    .from('eventos_patrocinados')
    .select('*')
    .eq('usuario_id', userId)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data ?? []) as EventoPatrocinado[];
}

// Notifica o dono do evento (insert em `notifications`, mesmo padrão de admin-notifications.ts)
export async function notificarUsuario(userId: string, title: string, body: string): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId, title, body, scheduled_at: new Date().toISOString(),
  });
  triggerDispatchNow();
}
