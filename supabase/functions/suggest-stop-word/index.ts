// Deploy:  supabase functions deploy suggest-stop-word
// Secrets: supabase secrets set MAGISTERIUM_API_KEY=sk_ronima_...
//          supabase secrets set AI_DISABLED=true   (para desativar temporariamente)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const VALID_CATEGORIES = new Set([
  'fundador','igrejafe','missa','objetolit','partesigrj','titulo_maria',
  'simbolo','oracao','virtude','pecado','livro_biblia','lugar_sagrado',
  'santo','papa','personagem_biblico','padre',
  'atributo_deus','animal_biblico','dogma','festa_liturgica','mulher_biblia',
]);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { letter, categoryKey, categoryLabel } = await req.json() as {
      letter: string; categoryKey: string; categoryLabel: string;
    };
    if (!letter || !categoryKey || !VALID_CATEGORIES.has(categoryKey)) return json({ word: null });

    // Modo desativado: não sugere palavras
    if (Deno.env.get('AI_DISABLED') === 'true') {
      return json({ word: null });
    }

    const res = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('MAGISTERIUM_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'magisterium-1',
        messages: [{
          role: 'user',
          content: `Jogo "Stop Católico". Sugira UMA palavra em português que comece com a letra "${letter.toUpperCase()}" e pertença à categoria "${categoryLabel}" no catolicismo brasileiro. Responda SOMENTE com a palavra, sem explicações.`,
        }],
      }),
    });

    if (!res.ok) throw new Error(`Magisterium ${res.status}: ${await res.text()}`);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const word = data.choices[0].message.content.trim().split(/\s+/)[0] ?? null;
    return json({ word });
  } catch (err) {
    console.error('suggest-stop-word:', err);
    return json({ word: null }, 500);
  }
});
