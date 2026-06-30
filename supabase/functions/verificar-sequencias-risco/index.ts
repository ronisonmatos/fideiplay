// Edge Function: verificar-sequencias-risco
// Deploy: supabase functions deploy verificar-sequencias-risco
//
// Chamada pelo pg_cron todo dia às 20h (Brasília).
// Busca usuários com sequência ativa que não jogaram hoje
// e envia push notification personalizada.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Busca usuários em risco via função SQL
    const { data: atRisk, error } = await supabase.rpc('get_streak_at_risk_users');

    if (error) {
      console.error('[verificar-sequencias] Erro ao buscar usuários:', error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!atRisk?.length) {
      return new Response(JSON.stringify({ ok: true, notified: 0, message: 'Nenhum usuário em risco' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let notified = 0;

    for (const user of atRisk as { user_id: string; streak_days: number }[]) {
      const days  = user.streak_days;
      const emoji = days >= 7 ? '🔥🔥' : '🔥';
      const body  = days === 1
        ? 'Você jogou ontem! Jogue hoje para começar uma sequência!'
        : `Sua sequência de ${days} dias está em risco! Jogue antes da meia-noite.`;

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/enviar-notificacao`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            title:   `${emoji} Sequência em risco!`,
            body,
            data:    { type: 'streak_warning', streak_days: days },
          }),
        });

        if (res.ok) notified++;
      } catch (e) {
        console.warn('[verificar-sequencias] Falha ao notificar', user.user_id, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, checked: atRisk.length, notified }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
