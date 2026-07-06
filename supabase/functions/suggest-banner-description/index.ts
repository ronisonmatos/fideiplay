// Deploy:  supabase functions deploy suggest-banner-description
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//          supabase secrets set AI_DISABLED=true   (para desativar temporariamente)

import Anthropic from 'npm:@anthropic-ai/sdk';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const SYSTEM_PROMPT =
  'Você escreve a descrição curta de banners de anúncio dentro do app católico SantosPlay. ' +
  'Esse campo aparece em uma única linha, pequena, embaixo do título do anúncio — por isso a descrição precisa ter no máximo 80 caracteres. ' +
  'Tom: objetivo, convidativo, adequado ao público católico brasileiro. ' +
  'Nunca invente dados factuais sobre o anunciante que não foram fornecidos (endereço, telefone, preços, promoções específicas) — mantenha a descrição genérica, focada em convidar o usuário a saber mais. ' +
  'Responda SOMENTE com o texto final da descrição, sem aspas, sem explicações, sem markdown.';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const { anunciante, titulo, descricaoAtual } = await req.json() as {
      anunciante?: string; titulo?: string; descricaoAtual?: string;
    };
    const anunciante_ = anunciante?.trim() ?? '';
    if (!anunciante_) return json({ error: 'anunciante_obrigatorio' }, 400);

    if (Deno.env.get('AI_DISABLED') === 'true') {
      return json({ error: 'ai_disabled' }, 503);
    }

    const titulo_ = titulo?.trim() ?? '';
    const descricaoAtual_ = descricaoAtual?.trim() ?? '';

    const userContent = descricaoAtual_
      ? `Anunciante: ${anunciante_}\nTítulo do anúncio: ${titulo_ || '(sem título ainda)'}\nDescrição atual escrita pelo admin: "${descricaoAtual_}"\n\nMelhore essa descrição mantendo a ideia original, respeitando o limite de até 80 caracteres e o tom do app.`
      : `Anunciante: ${anunciante_}\nTítulo do anúncio: ${titulo_ || '(sem título ainda)'}\n\nEscreva uma sugestão de descrição curta (até 80 caracteres), com base apenas no nome do anunciante e no título.`;

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 100,
      output_config: { effort: 'low' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'refusal' }, 503);
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const descricao = textBlock?.text.trim().replace(/^"|"$/g, '') ?? '';
    if (!descricao) return json({ error: 'empty_response' }, 502);

    return json({ descricao });
  } catch (err) {
    console.error('suggest-banner-description:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
