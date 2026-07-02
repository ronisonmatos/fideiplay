// Edge Function: dispatch-notifications
// Deploy: supabase functions deploy dispatch-notifications
//
// Chamada pelo pg_cron a cada 2 minutos (e também sob demanda, pelo admin, pra
// envio imediato) — manda push via Expo de tudo em `notifications` que já
// venceu (scheduled_at <= now()) e ainda não foi marcado como enviado.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE     = 90; // limite seguro por chamada da API da Expo

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: due, error } = await supabase
      .from('notifications')
      .select('id, user_id, title, body')
      .eq('sent', false)
      .lte('scheduled_at', new Date().toISOString())
      .limit(500);

    if (error) return json({ ok: false, error: error.message }, 500);
    if (!due?.length) return json({ ok: true, sent: 0 });

    const userIds = [...new Set(due.map(n => n.user_id).filter(Boolean))] as string[];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_token')
      .in('id', userIds);

    const tokenByUser = new Map((profiles ?? []).map(p => [p.id, p.push_token as string | null]));

    let sentCount = 0;
    const processedIds: string[] = [];

    for (let i = 0; i < due.length; i += BATCH_SIZE) {
      const chunk = due.slice(i, i + BATCH_SIZE);
      processedIds.push(...chunk.map(n => n.id));

      const messages = chunk
        .filter(n => n.user_id && tokenByUser.get(n.user_id))
        .map(n => ({
          to:        tokenByUser.get(n.user_id!),
          title:     n.title,
          body:      n.body,
          sound:     'default',
          channelId: 'santosplay',
        }));

      if (messages.length === 0) continue;

      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(messages),
      });
      sentCount += messages.length;
    }

    // Marca como processado mesmo sem push_token (evita retentar pra sempre —
    // já fica salvo em `notifications` pro usuário ver no sino do app).
    if (processedIds.length) {
      await supabase.from('notifications').update({ sent: true }).in('id', processedIds);
    }

    return json({ ok: true, sent: sentCount, processed: processedIds.length });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
});
