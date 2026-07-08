// Edge Function: reembolsar-evento
// Deploy: supabase functions deploy reembolsar-evento
//
// Chamada pelo admin ao rejeitar um evento patrocinado (aba Eventos do painel
// admin). Reembolsa via Mercado Pago usando o payment_id salvo no evento,
// marca o evento como 'rejeitado' e notifica o usuário. Se o reembolso falhar,
// grava o erro em `erro_reembolso` e notifica os admins — sem travar a rejeição.

import { createClient } from 'npm:@supabase/supabase-js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? '');
    if (authError || !user) return json({ error: 'Não autorizado' }, 401);

    const { data: caller } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!caller?.is_admin) return json({ error: 'Apenas admins podem rejeitar eventos' }, 403);

    const { evento_id, motivo } = await req.json() as { evento_id: string; motivo: string };
    if (!evento_id || !motivo?.trim()) return json({ error: 'evento_id e motivo são obrigatórios' }, 400);

    const { data: evento, error: eventoError } = await supabase
      .from('eventos_patrocinados')
      .select('titulo, usuario_id, payment_id')
      .eq('id', evento_id)
      .single();
    if (eventoError || !evento) return json({ error: 'Evento não encontrado' }, 404);

    let erroReembolso: string | null = null;

    if (evento.payment_id) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${evento.payment_id}/refunds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': crypto.randomUUID(),
          },
        });
        if (!mpRes.ok) {
          const mpData = await mpRes.json().catch(() => ({}));
          erroReembolso = mpData.message ?? `Reembolso falhou (HTTP ${mpRes.status})`;
        }
      } catch (err) {
        erroReembolso = String(err);
      }
    } else {
      erroReembolso = 'Evento sem payment_id — reembolso manual necessário';
    }

    await supabase.from('eventos_patrocinados').update({
      status:          'rejeitado',
      motivo_rejeicao: motivo.trim(),
      erro_reembolso:  erroReembolso,
    }).eq('id', evento_id);

    const now = new Date().toISOString();
    const notificacoes = [{
      user_id:      evento.usuario_id,
      title:        '❌ Evento não aprovado',
      body:         `Seu evento "${evento.titulo}" não foi aprovado. Motivo: ${motivo.trim()}`,
      scheduled_at: now,
    }];

    if (erroReembolso) {
      const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true);
      for (const admin of admins ?? []) {
        notificacoes.push({
          user_id:      admin.id,
          title:        '⚠️ Reembolso manual necessário',
          body:         `Reembolso de "${evento.titulo}" falhou: ${erroReembolso}`,
          scheduled_at: now,
        });
      }
    }

    await supabase.from('notifications').insert(notificacoes);
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/dispatch-notifications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    }).catch(() => {});

    return json({ ok: true, refunded: !erroReembolso, erro: erroReembolso });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
