import { useCallback, useEffect, useRef, useState } from 'react';

import {
  nivelGeralPorMedia,
  nivelTemaPorPct,
  QUESTOES_POR_TEMA,
  TEMAS,
  type NivelGeral,
  type NivelTema,
} from '@/constants/teste-conhecimento';
import {
  fetchPercentilTeste,
  fetchQuestoesTeste,
  montarProvaAleatoria,
  salvarResultadoTeste,
  type QuestaoTeste,
  type ResultadoTemaSalvo,
} from '@/lib/teste-conhecimento';

export type FaseTeste = 'inicio' | 'jogando' | 'resultado';

export interface ResultadoTemaCalculado extends ResultadoTemaSalvo {
  nivel: NivelTema;
}

export interface ResultadoTeste {
  id:            string | null;
  nivelGeral:    NivelGeral;
  mediaPct:      number;
  totalAcertos:  number;
  totalQuestoes: number;
  porTema:       ResultadoTemaCalculado[];
  percentil:     number | null;
}

interface RespostaRegistrada {
  tema:    string;
  correta: boolean;
}

// Tempo em que a resposta certa fica destacada antes de avançar sozinho.
// Quando o usuário respondeu, dá mais tempo para ler a explicação; quando o
// tempo esgotou sem seleção (sem explicação exibida), avança mais rápido.
const TEMPO_REVELACAO_MS = 2000;
const TEMPO_REVELACAO_COM_RESPOSTA_MS = 12000;

export function useTesteConhecimento() {
  const [fase, setFase]               = useState<FaseTeste>('inicio');
  const [carregando, setCarregando]   = useState(false);
  const [questoes, setQuestoes]       = useState<QuestaoTeste[]>([]);
  const [indice, setIndice]           = useState(0);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [respondida, setRespondida]   = useState(false);
  const [resultado, setResultado]     = useState<ResultadoTeste | null>(null);

  const respostasRef = useRef<RespostaRegistrada[]>([]);
  const avancoRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (avancoRef.current) clearTimeout(avancoRef.current); }, []);

  const calcularResultado = useCallback((respostasFinal: RespostaRegistrada[]): ResultadoTeste => {
    const porTema: ResultadoTemaCalculado[] = TEMAS.map(tema => {
      const doTema  = respostasFinal.filter(r => r.tema === tema.id);
      const acertos = doTema.filter(r => r.correta).length;
      const total   = doTema.length;
      const pct     = total > 0 ? Math.round((acertos / total) * 100) : 0;
      return { tema: tema.id, acertos, total, pct, nivel: nivelTemaPorPct(pct) };
    });
    const totalAcertos  = respostasFinal.filter(r => r.correta).length;
    const totalQuestoes = respostasFinal.length;
    const mediaPct      = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;
    return {
      id: null,
      nivelGeral: nivelGeralPorMedia(mediaPct),
      mediaPct,
      totalAcertos,
      totalQuestoes,
      porTema,
      percentil: null,
    };
  }, []);

  const iniciarTeste = useCallback(async () => {
    if (avancoRef.current) clearTimeout(avancoRef.current);
    setCarregando(true);
    const banco = await fetchQuestoesTeste();
    const prova = montarProvaAleatoria(banco);
    respostasRef.current = [];
    setQuestoes(prova);
    setIndice(0);
    setSelecionado(null);
    setRespondida(false);
    setResultado(null);
    setCarregando(false);
    setFase('jogando');
  }, []);

  // opcaoIndice null = tempo esgotado (conta como errada)
  const responder = useCallback((opcaoIndice: number | null) => {
    if (respondida || questoes.length === 0) return;
    const questaoAtual = questoes[indice];
    const acertou = opcaoIndice !== null && opcaoIndice === questaoAtual.correta;
    setSelecionado(opcaoIndice);
    setRespondida(true);

    avancoRef.current = setTimeout(() => {
      respostasRef.current = [...respostasRef.current, { tema: questaoAtual.tema, correta: acertou }];
      const proximo = indice + 1;
      if (proximo >= questoes.length) {
        setResultado(calcularResultado(respostasRef.current));
        setFase('resultado');
      } else {
        setIndice(proximo);
        setSelecionado(null);
        setRespondida(false);
      }
    }, opcaoIndice !== null ? TEMPO_REVELACAO_COM_RESPOSTA_MS : TEMPO_REVELACAO_MS);
  }, [respondida, questoes, indice, calcularResultado]);

  const salvarResultado = useCallback(async (userId: string) => {
    if (!resultado) return;
    const temasSalvos: ResultadoTemaSalvo[] = resultado.porTema.map(({ tema, acertos, total, pct }) => ({ tema, acertos, total, pct }));
    const { id } = await salvarResultadoTeste({
      usuarioId:     userId,
      nivelGeral:    resultado.nivelGeral.id,
      temas:         temasSalvos,
      totalQuestoes: resultado.totalQuestoes,
      totalAcertos:  resultado.totalAcertos,
    });
    if (!id) return;
    const percentil = await fetchPercentilTeste(id);
    setResultado(prev => (prev ? { ...prev, id, percentil } : prev));
  }, [resultado]);

  const questaoAtual   = questoes[indice] ?? null;
  const temaAtualIndex = questoes.length > 0 ? Math.floor(indice / QUESTOES_POR_TEMA) : 0;
  const posicaoNoTema  = (indice % QUESTOES_POR_TEMA) + 1;

  return {
    fase,
    carregando,
    questoes,
    questaoAtual,
    indice,
    temaAtual: TEMAS[temaAtualIndex] ?? TEMAS[0],
    posicaoNoTema,
    selecionado,
    respondida,
    resultado,
    iniciarTeste,
    responder,
    calcularResultado,
    salvarResultado,
  };
}
