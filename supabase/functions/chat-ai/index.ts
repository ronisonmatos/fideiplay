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
  'Você é o Catequista, assistente católico do app SantosPlay, usado no chat da comunidade. ' +
  'Se perguntarem seu nome ou quem/o que você é, responda apenas que é o Catequista, assistente do SantosPlay — nunca mencione "Magisterium" ou qualquer outro nome de modelo/marca/empresa por trás disso. ' +
  'Responda SOMENTE perguntas sobre a fé católica: doutrina, catecismo, santos, Bíblia, liturgia, moral e história da Igreja. ' +
  'Se a pergunta não for sobre a fé católica, recuse educadamente e explique que só pode ajudar com temas católicos — não tente responder o assunto fora do tema. ' +
  'Não invente datas, nomes ou citações — se não tiver certeza de um dado específico, diga isso em vez de arriscar uma informação errada. ' +
  'IMPORTANTE: responda SEMPRE em português do Brasil, em qualquer situação — inclusive ao recusar um tema fora do escopo — mesmo que a pergunta tenha sido feita em outro idioma. Nunca responda em inglês ou qualquer outro idioma. ' +
  'Seja objetivo e resumido (no máximo 4-5 frases curtas).';

// Resposta padrão quando o guarda-corpo interno da API de IA ignora o
// system prompt (acontece em perguntas fora do tema católico) e devolve
// texto em inglês citando o nome do modelo por trás.
const FALLBACK_OFF_TOPIC =
  'Sou o Catequista, assistente do SantosPlay, e só posso ajudar com temas da fé católica ' +
  '(doutrina, catecismo, santos, Bíblia, liturgia, moral e história da Igreja). ' +
  'Tem alguma dúvida sobre um desses assuntos?';

// Recusa do guarda-corpo interno do provedor (sempre em inglês, 1ª pessoa)
function isGuardrailRefusal(text: string): boolean {
  return /^(i am|i'm|i cannot|i can't|sorry|as an ai|this (is|appears))/i.test(text.trim());
}

// Heurística simples de idioma: conta palavras características de
// espanhol/inglês que não existem (ou se escrevem diferente) em português.
function isLikelyNonPortuguese(text: string): boolean {
  if (/ñ/i.test(text)) return true;
  const spanishHits = (text.match(/\b(qué|cómo|dónde|cuándo|usted|también|entonces|muy|mucho|pero|día|días|hoy|sí)\b/gi) || []).length;
  const englishHits = (text.match(/\b(the|and|you|this|that|with|are|have|will|would|from|your)\b/gi) || []).length;
  return spanishHits >= 2 || englishHits >= 3;
}

async function callMagisterium(systemPrompt: string, userContent: string): Promise<string> {
  const res = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('MAGISTERIUM_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'magisterium-1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Magisterium ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

const TRANSLATOR_PROMPT =
  'Você é um tradutor. Traduza o texto do usuário para português do Brasil, mantendo o sentido e o tom. ' +
  'Responda SOMENTE com a tradução, sem comentários, sem aspas, sem citar o idioma original ou qualquer nome de modelo/marca.';

async function askMagisterium(question: string): Promise<string> {
  const answer = await callMagisterium(SYSTEM_PROMPT, question);

  // O provedor por trás do modelo tem um guarda-corpo próprio para temas
  // fora do catolicismo que às vezes ignora o system prompt acima (responde
  // em inglês e se identifica pelo nome do modelo). Nesses casos, troca pela
  // recusa padrão nossa, sempre em português e sem citar o nome do modelo.
  if (/magisterium/i.test(answer) || isGuardrailRefusal(answer)) {
    return FALLBACK_OFF_TOPIC;
  }

  // Às vezes a resposta vem correta no conteúdo, mas em outro idioma
  // (espanhol/inglês), mesmo com a instrução de português no system prompt.
  // Nesse caso, força uma segunda chamada só para traduzir.
  if (isLikelyNonPortuguese(answer)) {
    try {
      const translated = await callMagisterium(TRANSLATOR_PROMPT, answer);
      if (/magisterium/i.test(translated) || isLikelyNonPortuguese(translated)) {
        return FALLBACK_OFF_TOPIC;
      }
      return translated;
    } catch {
      return FALLBACK_OFF_TOPIC;
    }
  }

  return answer;
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
