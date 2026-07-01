// Edge Function: enviar-notificacao
// Deploy: supabase functions deploy enviar-notificacao
//
// Body: { user_id: string, title: string, body: string, data?: object }
// Busca o push_token do usuário, chama a API do Expo Push e trata erros.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { user_id, title, body, data = {} } = await req.json();

    if (!user_id || !title || !body) {
      return json({ ok: false, error: 'user_id, title e body são obrigatórios' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Busca o push token do usuário
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', user_id)
      .single();

    if (error || !profile?.push_token) {
      return json({ ok: false, error: 'Usuário sem push token cadastrado' });
    }

    // Chama a API do Expo Push
    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to:        profile.push_token,
        title,
        body,
        data,
        sound:     'default',
        channelId: 'santosplay',
      }),
    });

    const pushData = await pushRes.json();
    const ticket   = pushData?.data;

    // Token inválido (dispositivo desregistrado) → limpa para não tentar de novo
    if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
      await supabase.from('profiles').update({ push_token: null }).eq('id', user_id);
      return json({ ok: false, error: 'Token inválido — removido' });
    }

    return json({ ok: true, ticket });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
});
