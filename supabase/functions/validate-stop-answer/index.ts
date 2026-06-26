// Deploy:  supabase functions deploy validate-stop-answer
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import Anthropic from 'npm:@anthropic-ai/sdk';

const VALID_CATEGORIES = new Set([
  'fundador','igrejafe','missa','objetolit','partesigrj','titulo_maria',
  'simbolo','oracao','virtude','pecado','livro_biblia','lugar_sagrado',
  'santo','papa','personagem_biblico','padre',
  'atributo_deus','animal_biblico','dogma','festa_liturgica','mulher_biblia',
]);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { letter, answer, categoryKey, categoryLabel } = await req.json() as {
      letter: string;
      answer: string;
      categoryKey: string;
      categoryLabel: string;
    };

    const trimmed = answer?.trim() ?? '';
    if (!trimmed || !letter || !categoryLabel || !VALID_CATEGORIES.has(categoryKey)) {
      return json({ valid: false });
    }
    if (trimmed.length > 100) return json({ valid: false });

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    // Categoria 'padre': apenas verifica se é palavrão/ofensivo
    if (categoryKey === 'padre') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{
          role: 'user',
          content:
            `A palavra ou expressão "${trimmed}" é um palavrão, xingamento ou conteúdo ofensivo em português brasileiro?\n` +
            'Responda SOMENTE: true   ou   false\n' +
            '(true = é ofensivo/palavrão; false = não é ofensivo)',
        }],
      });
      const text = (msg.content[0] as { type: string; text: string }).text.trim().toLowerCase();
      const isOffensive = text === 'true' || text.startsWith('true');
      return json({ valid: !isOffensive });
    }

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5,
      messages: [{
        role: 'user',
        content:
          'Você valida respostas do jogo "Stop Católico" (vocabulário do catolicismo brasileiro).\n\n' +
          `CATEGORIA: ${categoryLabel}\n` +
          `RESPOSTA DO JOGADOR: "${trimmed}"\n\n` +
          `Esta resposta pertence genuinamente à categoria "${categoryLabel}" no catolicismo?\n` +
          'Seja generoso: aceite variações, abreviações e nomes reconhecíveis.\n\n' +
          'Responda SOMENTE: true   ou   false',
      }],
    });

    const text = (msg.content[0] as { type: string; text: string }).text.trim().toLowerCase();
    const valid = text === 'true' || text.startsWith('true');

    return json({ valid });
  } catch (err) {
    console.error('validate-stop-answer:', err);
    return json({ valid: null }, 500);
  }
});
