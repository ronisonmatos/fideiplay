import Anthropic from 'npm:@anthropic-ai/sdk';

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
    const { letter, categoryKey: _ck, categoryLabel } = await req.json() as {
      letter: string; categoryKey: string; categoryLabel: string;
    };
    if (!letter || !categoryLabel) return json({ word: null });

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `Jogo "Stop Católico". Sugira UMA palavra em português que comece com a letra "${letter.toUpperCase()}" e pertença à categoria "${categoryLabel}" no catolicismo brasileiro. Responda SOMENTE com a palavra.`,
      }],
    });
    const word = (msg.content[0] as { type: string; text: string }).text.trim().split(/\s+/)[0] ?? null;
    return json({ word });
  } catch (err) {
    console.error('suggest-stop-word:', err);
    return json({ word: null }, 500);
  }
});
