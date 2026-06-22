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

    const { trilha_id, method, trilha_titulo, preco } = await req.json() as {
      trilha_id: number;
      method: 'pix' | 'card';
      trilha_titulo: string;
      preco: number;
    };

    const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;
    const idempotencyKey = crypto.randomUUID();

    if (method === 'pix') {
      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          transaction_amount: preco,
          description: `SantosPlay — Trilha: ${trilha_titulo}`,
          payment_method_id: 'pix',
          payer: { email: user.email },
        }),
      });

      const mpData = await mpRes.json();
      if (!mpRes.ok) return json({ error: mpData.message ?? 'Erro ao criar PIX', mp_error: mpData });

      await supabase.from('payments').insert({
        user_id: user.id,
        trilha_id,
        mp_id: mpData.id,
        status: 'pending',
        method: 'pix',
        amount: preco,
      });

      return json({
        payment_id: mpData.id,
        qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      });
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        items: [{
          title: `SantosPlay — Trilha: ${trilha_titulo}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: preco,
        }],
        payer: { email: user.email },
        external_reference: `${user.id}|${trilha_id}`,
        back_urls: {
          success: 'santosplay://payment-success',
          failure: 'santosplay://payment-failure',
          pending: 'santosplay://payment-pending',
        },
        auto_return: 'approved',
      }),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) return json({ error: mpData.message ?? 'Erro ao criar preferência' }, 400);

    await supabase.from('payments').insert({
      user_id: user.id,
      trilha_id,
      status: 'pending',
      method: 'credit_card',
      amount: preco,
    });

    const isSandbox = MP_TOKEN.startsWith('TEST-');
    return json({
      checkout_url: isSandbox ? mpData.sandbox_init_point : mpData.init_point,
      preference_id: mpData.id,
    });

  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
