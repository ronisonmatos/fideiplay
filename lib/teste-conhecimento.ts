import { supabase } from '@/lib/supabase';
import { QUESTOES_POR_TEMA, TEMAS } from '@/constants/teste-conhecimento';

export interface QuestaoTeste {
  id:          string;
  tema:        string;
  pergunta:    string;
  opcoes:      string[];
  correta:     number;
  explicacao:  string | null;
  dificuldade: string;
}

export interface ResultadoTemaSalvo {
  tema:    string;
  acertos: number;
  total:   number;
  pct:     number;
}

export interface TesteConhecimentoRow {
  id:             string;
  usuario_id:     string;
  nivel_geral:    string;
  temas:          ResultadoTemaSalvo[];
  concluido_em:   string;
  total_questoes: number;
  total_acertos:  number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Embaralha também as alternativas de cada questão, pra não fixar a posição
// da resposta certa entre uma tentativa e outra.
function embaralharOpcoes(q: QuestaoTeste): QuestaoTeste {
  const respostaCerta = q.opcoes[q.correta];
  const opcoes = shuffle(q.opcoes);
  return { ...q, opcoes, correta: opcoes.indexOf(respostaCerta) };
}

export async function fetchQuestoesTeste(): Promise<QuestaoTeste[]> {
  const { data, error } = await supabase
    .from('questoes_teste')
    .select('id, tema, pergunta, opcoes, correta, explicacao, dificuldade')
    .eq('ativo', true);
  if (error) return [];
  return (data ?? []) as QuestaoTeste[];
}

// Quantas questões de cada dificuldade compõem o bloco de um tema (soma = QUESTOES_POR_TEMA).
const MIX_DIFICULDADE: Record<string, number> = { facil: 2, medio: 2, dificil: 1 };

// Sorteia o bloco de um tema respeitando a mistura de dificuldade acima. Se o
// banco não tiver questões suficientes de algum nível (banco pequeno demais),
// completa com o que sobrar de qualquer dificuldade até fechar QUESTOES_POR_TEMA.
function selecionarComMix(doTema: QuestaoTeste[]): QuestaoTeste[] {
  const porNivel: Record<string, QuestaoTeste[]> = { facil: [], medio: [], dificil: [] };
  for (const q of doTema) (porNivel[q.dificuldade] ?? porNivel.medio).push(q);

  const escolhidas: QuestaoTeste[] = [];
  const usadas = new Set<string>();
  for (const [nivel, qtd] of Object.entries(MIX_DIFICULDADE)) {
    for (const q of shuffle(porNivel[nivel] ?? []).slice(0, qtd)) {
      escolhidas.push(q);
      usadas.add(q.id);
    }
  }
  if (escolhidas.length < QUESTOES_POR_TEMA) {
    const restantes = shuffle(doTema.filter(q => !usadas.has(q.id)));
    escolhidas.push(...restantes.slice(0, QUESTOES_POR_TEMA - escolhidas.length));
  }
  return shuffle(escolhidas);
}

// Monta uma prova de TEMAS.length * QUESTOES_POR_TEMA questões: sorteia o
// bloco de cada tema com mistura de dificuldade, embaralha a ordem dos temas
// (em blocos) e as alternativas de cada questão — nunca sai a mesma sequência duas vezes.
export function montarProvaAleatoria(banco: QuestaoTeste[]): QuestaoTeste[] {
  const blocos = shuffle(TEMAS).map(tema => {
    const doTema = banco.filter(q => q.tema === tema.id);
    return selecionarComMix(doTema).slice(0, QUESTOES_POR_TEMA).map(embaralharOpcoes);
  });
  return blocos.flat();
}

export async function salvarResultadoTeste(input: {
  usuarioId:     string;
  nivelGeral:    string;
  temas:         ResultadoTemaSalvo[];
  totalQuestoes: number;
  totalAcertos:  number;
}): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from('testes_conhecimento')
    .insert({
      usuario_id:     input.usuarioId,
      nivel_geral:    input.nivelGeral,
      temas:          input.temas,
      total_questoes: input.totalQuestoes,
      total_acertos:  input.totalAcertos,
    })
    .select('id')
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data.id as string };
}

export async function fetchPercentilTeste(testeId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('calcular_percentil_teste', { p_teste_id: testeId });
    if (error) return null;
    return typeof data === 'number' ? data : null;
  } catch {
    return null;
  }
}

export async function fetchUltimoResultado(userId: string): Promise<TesteConhecimentoRow | null> {
  const { data, error } = await supabase
    .from('testes_conhecimento')
    .select('*')
    .eq('usuario_id', userId)
    .order('concluido_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as TesteConhecimentoRow;
}
