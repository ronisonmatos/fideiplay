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

    const { payment_id, trilha_id } = await req.json() as {
      payment_id: number;
      trilha_id: number;
    };

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { 'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` },
    });

    const mpData = await mpRes.json();
    const status: string = mpData.status ?? 'pending';

    if (status === 'approved') {
      await supabase.from('user_trilhas').upsert(
        { user_id: user.id, trilha_id, origem: 'compra' },
        { onConflict: 'user_id,trilha_id' },
      );
      await supabase.from('payments')
        .update({ status: 'approved' })
        .eq('mp_id', payment_id);
    }

    return json({ status });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
