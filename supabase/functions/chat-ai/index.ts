// Deploy:  supabase functions deploy chat-ai
// Secrets: MAGISTERIUM_API_KEY (já configurado para validate-stop-answer)
//          AI_DISABLED=true   (para desativar temporariamente)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const SYSTEM_PROMPT =
  'Você é um assistente católico do app SantosPlay, usado no chat da comunidade. ' +
  'Responda SOMENTE perguntas sobre a fé católica: doutrina, catecismo, santos, Bíblia, liturgia, moral e história da Igreja. ' +
  'Se a pergunta não for sobre a fé católica, recuse educadamente e explique que só pode ajudar com temas católicos — não tente responder o assunto fora do tema. ' +
  'Não invente datas, nomes ou citações — se não tiver certeza de um dado específico, diga isso em vez de arriscar uma informação errada. ' +
  'IMPORTANTE: responda SEMPRE em português do Brasil, em qualquer situação — inclusive ao recusar um tema fora do escopo — mesmo que a pergunta tenha sido feita em outro idioma. Nunca responda em inglês ou qualquer outro idioma. ' +
  'Seja objetivo e resumido (no máximo 4-5 frases curtas).';

async function askMagisterium(question: string): Promise<string> {
  const res = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('MAGISTERIUM_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'magisterium-1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Magisterium ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const { question } = await req.json() as { question?: string };
    const trimmed = question?.trim() ?? '';
    if (!trimmed) return json({ error: 'empty_question' }, 400);
    if (trimmed.length > 300) return json({ error: 'question_too_long' }, 400);

    if (Deno.env.get('AI_DISABLED') === 'true') {
      return json({ error: 'ai_disabled' }, 503);
    }

    const answer = await askMagisterium(trimmed);
    return json({ answer });
  } catch (err) {
    console.error('chat-ai:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
