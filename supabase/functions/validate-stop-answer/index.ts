// Deploy:  supabase functions deploy validate-stop-answer
// Secrets: supabase secrets set MAGISTERIUM_API_KEY=sk_ronima_...
//          supabase secrets set AI_DISABLED=true   (para desativar temporariamente)

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

async function askMagisterium(prompt: string): Promise<string> {
  const res = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('MAGISTERIUM_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'magisterium-1',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Magisterium ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim().toLowerCase();
}

// Detecta resposta positiva em português ou inglês
function isPositive(text: string): boolean {
  return text.startsWith('sim') || text.startsWith('yes') || text.startsWith('true');
}

function isNegative(text: string): boolean {
  return text.startsWith('não') || text.startsWith('nao') || text.startsWith('no') || text.startsWith('false');
}

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

    // Modo desativado: aceita qualquer resposta não vazia
    if (Deno.env.get('AI_DISABLED') === 'true') {
      return json({ valid: true });
    }

    // Categoria 'padre': apenas verifica se é ofensivo
    if (categoryKey === 'padre') {
      const text = await askMagisterium(
        `A palavra ou expressão "${trimmed}" é um palavrão, xingamento ou conteúdo ofensivo em português brasileiro? ` +
        'Responda apenas Sim ou Não.',
      );
      return json({ valid: !isPositive(text) });
    }

    const text = await askMagisterium(
      `No jogo "Stop Católico", a categoria é "${categoryLabel}". ` +
      `A resposta "${trimmed}" (começando com a letra "${letter.toUpperCase()}") pertence a essa categoria no catolicismo? ` +
      'Seja generoso com variações e abreviações. Responda apenas Sim ou Não.',
    );

    const valid = isPositive(text);
    return json({ valid });
  } catch (err) {
    console.error('validate-stop-answer:', err);
    return json({ valid: null }, 500);
  }
});
