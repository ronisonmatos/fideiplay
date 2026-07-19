import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { ECONOMY } from '@/constants/economy';
import {
  type CartaSolitario,
  type CategoriaComCartas,
  type NivelSolitario,
  getNivel,
  montarBaralho,
} from '@/constants/solitario-niveis';
import { useMoedas } from '@/hooks/use-moedas';
import { supabase } from '@/lib/supabase';

const GAME_ID = 'solitario-catolico';

export type FaseSolitario = 'idle' | 'carregando' | 'jogando' | 'vitoria' | 'derrota' | 'indisponivel' | 'erro';

interface Coluna {
  monte: CartaSolitario[];
  pilha: CartaSolitario[];
}

interface HistoricoEntrada {
  colunas: Coluna[];
  movimentosRestantes: number;
}

interface Mesa {
  colunas: Coluna[];
  selecionada: number | null;
  movimentosRestantes: number;
  historico: HistoricoEntrada[];
}

export interface JogadaSugerida {
  origem: number;
  destino: number;
}

function clonarColunas(colunas: Coluna[]): Coluna[] {
  return colunas.map(c => ({ monte: [...c.monte], pilha: [...c.pilha] }));
}

// Sempre que a pilha visível de uma coluna esvazia (carta única movida embora, ou
// grupo de 4 removido) e o monte ainda tem cartas, a próxima vira automaticamente —
// sem isso, colunas cujo pilha esvazia sem nunca fechar um grupo ali ficariam com
// cartas do monte presas para sempre.
function revelarSeVazio(colunas: Coluna[], colunaIndex: number) {
  const col = colunas[colunaIndex];
  if (col.pilha.length === 0 && col.monte.length > 0) {
    col.pilha.push(col.monte.pop()!);
  }
}

// Tamanho de grupo necessário pra fechar: 4 normalmente, mas 5 quando a Carta
// Categoria está envolvida (ela é somada ao baralho, não substitui uma carta real —
// ver criarCartaCategoria em constants/solitario-niveis.ts).
function tamanhoNecessario(cartas: CartaSolitario[]): number {
  return cartas.some(c => c.isCategoria) ? 5 : 4;
}

// Um grupo com coringa só é válido se as cartas reais forem da MESMA categoria que
// o coringa substituiu no baralho (coringa.categoriaId, ver montarBaralho) — essa é a
// ÚNICA categoria que ficou com uma carta a menos. Fechar com qualquer outra categoria
// (que já tinha as cartas completas por conta própria) gastaria cartas reais dela à
// toa, sobrando 1 carta sem par ali, enquanto a categoria certa fica travada pra
// sempre — daí SOLITARIO_DESFAZER existir, mas o ideal é nunca deixar acontecer.
// A Carta Categoria participa como uma carta real normal (categoriaId = a dela mesma),
// só muda quantas cartas o grupo precisa (ver tamanhoNecessario).
function grupoValido(cartas: CartaSolitario[]): boolean {
  if (cartas.length !== tamanhoNecessario(cartas)) return false;
  const coringa = cartas.find(c => c.isWildcard);
  const reais = cartas.filter(c => !c.isWildcard);
  if (reais.length === 0) return false;
  const categoria = coringa ? coringa.categoriaId : reais[0].categoriaId;
  return reais.every(c => c.categoriaId === categoria);
}

function grupoCompletoEm(pilha: CartaSolitario[]): boolean {
  return grupoValido(pilha);
}

// Fecha o grupo da coluna se as cartas do topo já baterem (4 ou 5, conforme a Carta
// Categoria estar presente) — muta em lugar (a coluna já é uma cópia isolada dentro
// do updater de estado). Retorna se fechou algo.
function fecharGrupoSeCompleto(colunas: Coluna[], colunaIndex: number): boolean {
  const col = colunas[colunaIndex];
  if (!grupoCompletoEm(col.pilha)) return false;
  col.pilha.splice(0, col.pilha.length);
  return true;
}

// Categoria "travada" da pilha é a da primeira carta real (não-coringa) — null se a
// pilha só tem coringa(s) até agora, caso em que a categoria ainda está em aberto.
// A Carta Categoria conta como carta real aqui (trava a pilha na hora que entra).
function categoriaDaPilha(pilha: CartaSolitario[]): string | null {
  const real = pilha.find(c => !c.isWildcard);
  return real ? real.categoriaId : null;
}

function movimentoLegal(cartaMovida: CartaSolitario, destino: Coluna): boolean {
  if (destino.pilha.length === 0) return true;
  // Olhar só o topo (em vez da categoria real da pilha) deixava empilhar qualquer
  // carta sobre um coringa que estivesse no topo, formando grupos com categorias
  // misturadas que nunca fechavam — travando o tabuleiro com sobra. A Carta Categoria
  // segue essa mesma regra (não tem a flexibilidade do coringa).
  const categoriaDestino = categoriaDaPilha(destino.pilha);
  if (!cartaMovida.isWildcard && categoriaDestino !== null && cartaMovida.categoriaId !== categoriaDestino) {
    return false;
  }
  const resultante = [...destino.pilha, cartaMovida];
  if (resultante.length === tamanhoNecessario(resultante)) {
    // A jogada fecharia o grupo — barra se o coringa estiver envolvido (já na pilha
    // ou sendo movido agora) numa categoria que não é a dele, pra nunca deixar o
    // coringa se "gastar" na categoria errada (ver grupoValido).
    return grupoValido(resultante);
  }
  return true;
}

function existeMovimentoLegal(colunas: Coluna[]): boolean {
  for (let i = 0; i < colunas.length; i++) {
    const topoOrigem = colunas[i].pilha[colunas[i].pilha.length - 1];
    if (!topoOrigem) continue;
    for (let j = 0; j < colunas.length; j++) {
      if (i === j) continue;
      if (movimentoLegal(topoOrigem, colunas[j])) return true;
    }
  }
  return false;
}

// Heurística gulosa, sem busca em profundidade (mesmo nível de sofisticação das dicas
// dos outros jogos do app): prioriza jogada que fecha grupo, depois a que mais
// aproxima de fechar, depois qualquer jogada válida para coluna vazia.
function encontrarMelhorJogada(colunas: Coluna[]): JogadaSugerida | null {
  let melhor: (JogadaSugerida & { score: number }) | null = null;
  for (let i = 0; i < colunas.length; i++) {
    const topoOrigem = colunas[i].pilha[colunas[i].pilha.length - 1];
    if (!topoOrigem) continue;
    for (let j = 0; j < colunas.length; j++) {
      if (i === j) continue;
      const destino = colunas[j];
      if (!movimentoLegal(topoOrigem, destino)) continue;
      const resultante = destino.pilha.length + 1;
      const score = destino.pilha.length === 0 ? 1 : (resultante === 4 ? 100 : resultante * 10);
      if (!melhor || score > melhor.score) melhor = { origem: i, destino: j, score };
    }
  }
  return melhor ? { origem: melhor.origem, destino: melhor.destino } : null;
}

export function useSolitario() {
  const { saldo: saldoMoedas, ganhar, gastar } = useMoedas();

  const [fase, setFase] = useState<FaseSolitario>('idle');
  const [nivelAtual, setNivelAtual] = useState<NivelSolitario | null>(null);
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [dicaAtual, setDicaAtual] = useState<JogadaSugerida | null>(null);
  const [dicasUsadas, setDicasUsadas] = useState(0);
  const [ultimoGrupo, setUltimoGrupo] = useState<{ colunaIndex: number; cor: string } | null>(null);
  const [tempoGastoMs, setTempoGastoMs] = useState(0);

  const inicioRef = useRef(0);
  const dicaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grupoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (dicaTimeoutRef.current) clearTimeout(dicaTimeoutRef.current);
    if (grupoTimeoutRef.current) clearTimeout(grupoTimeoutRef.current);
  }, []);

  // Transição automática de fase — roda toda vez que a mesa muda, então cobre tanto
  // "esgotou os movimentos" quanto "não há mais jogada legal" quanto vitória, sem
  // precisar espalhar essa checagem em cada lugar que muta a mesa.
  useEffect(() => {
    if (fase !== 'jogando' || !mesa) return;
    const tabuleiroVazio = mesa.colunas.every(c => c.monte.length === 0 && c.pilha.length === 0);
    if (tabuleiroVazio) {
      setTempoGastoMs(Date.now() - inicioRef.current);
      setFase('vitoria');
      return;
    }
    if (mesa.movimentosRestantes <= 0 || !existeMovimentoLegal(mesa.colunas)) {
      setFase('derrota');
    }
  }, [mesa, fase]);

  // Sai da partida atual e volta pro estado inicial do hook — usado pelo botão
  // "voltar"/"menu", já que nenhuma das outras fases (carregando/jogando/vitoria/
  // derrota/indisponivel/erro) volta pra 'idle' sozinha.
  const sair = useCallback(() => {
    if (dicaTimeoutRef.current) clearTimeout(dicaTimeoutRef.current);
    if (grupoTimeoutRef.current) clearTimeout(grupoTimeoutRef.current);
    setFase('idle');
    setNivelAtual(null);
    setMesa(null);
    setDicaAtual(null);
    setUltimoGrupo(null);
    setDicasUsadas(0);
  }, []);

  const iniciarNivel = useCallback(async (numero: number) => {
    const nivel = getNivel(numero);
    if (!nivel) return;

    setFase('carregando');
    setNivelAtual(nivel);
    setMesa(null);
    setDicaAtual(null);
    setUltimoGrupo(null);
    setDicasUsadas(0);

    try {
      const { data: categoriasRaw, error: errCat } = await supabase
        .from('solitario_categorias')
        .select('id, nome, icone, cor')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      if (errCat) throw errCat;

      const categoriaIds = (categoriasRaw ?? []).map(c => c.id);
      const { data: cartasRaw, error: errCartas } = categoriaIds.length
        ? await supabase
            .from('solitario_cartas')
            .select('id, categoria_id, nome, imagem_url')
            .eq('ativo', true)
            .in('categoria_id', categoriaIds)
        : { data: [], error: null };
      if (errCartas) throw errCartas;

      const categoriasComCartas: CategoriaComCartas[] = (categoriasRaw ?? []).map(cat => ({
        id: cat.id,
        nome: cat.nome,
        icone: cat.icone,
        cor: cat.cor,
        cartas: (cartasRaw ?? [])
          .filter(cr => cr.categoria_id === cat.id)
          .map(cr => ({ id: cr.id, nome: cr.nome, imagemUrl: cr.imagem_url })),
      }));

      const montado = montarBaralho(nivel, categoriasComCartas);
      if (!montado) {
        setFase('indisponivel');
        return;
      }

      const colunasIniciais: Coluna[] = Array.from({ length: nivel.colunas }, () => ({ monte: [], pilha: [] }));
      montado.baralho.forEach((carta, idx) => {
        colunasIniciais[idx % nivel.colunas].monte.push(carta);
      });
      colunasIniciais.forEach((_, idx) => revelarSeVazio(colunasIniciais, idx));

      setMesa({
        colunas: colunasIniciais,
        selecionada: null,
        movimentosRestantes: nivel.movimentos,
        historico: [],
      });
      inicioRef.current = Date.now();
      setFase('jogando');
    } catch {
      setFase('erro');
    }
  }, []);

  // Aplica uma movida já validada (mutação em lugar — `colunas` já deve ser uma
  // cópia isolada). Compartilhado entre o fluxo de toque em duas etapas
  // (selecionarCarta) e o arrastar direto (moverCarta), pra não duplicar a lógica
  // de revelar carta/fechar grupo entre os dois jeitos de mover uma carta.
  const aplicarMovimento = useCallback((colunas: Coluna[], origemIdx: number, destinoIdx: number, cartaMovida: CartaSolitario) => {
    colunas[origemIdx].pilha.pop();
    colunas[destinoIdx].pilha.push(cartaMovida);
    revelarSeVazio(colunas, origemIdx);

    const fechou = fecharGrupoSeCompleto(colunas, destinoIdx);
    if (fechou) {
      revelarSeVazio(colunas, destinoIdx);
      setUltimoGrupo({ colunaIndex: destinoIdx, cor: cartaMovida.cor });
      if (grupoTimeoutRef.current) clearTimeout(grupoTimeoutRef.current);
      grupoTimeoutRef.current = setTimeout(() => setUltimoGrupo(null), 700);
    }
  }, []);

  const selecionarCarta = useCallback((colunaIndex: number) => {
    if (fase !== 'jogando') return;
    setMesa(prev => {
      if (!prev) return prev;
      const { colunas, selecionada } = prev;

      if (selecionada === null) {
        if (colunas[colunaIndex].pilha.length === 0) return prev;
        return { ...prev, selecionada: colunaIndex };
      }
      if (selecionada === colunaIndex) {
        return { ...prev, selecionada: null };
      }

      const origem = colunas[selecionada];
      const destino = colunas[colunaIndex];
      const cartaMovida = origem.pilha[origem.pilha.length - 1];

      if (!movimentoLegal(cartaMovida, destino)) {
        // Destino inválido — se a coluna tocada tiver carta própria, troca a seleção
        // para ela (mais amigável do que simplesmente ignorar o toque).
        return destino.pilha.length > 0 ? { ...prev, selecionada: colunaIndex } : { ...prev, selecionada: null };
      }

      const snapshot: HistoricoEntrada = { colunas: clonarColunas(colunas), movimentosRestantes: prev.movimentosRestantes };
      const novasColunas = clonarColunas(colunas);
      aplicarMovimento(novasColunas, selecionada, colunaIndex, cartaMovida);

      return {
        colunas: novasColunas,
        selecionada: null,
        movimentosRestantes: prev.movimentosRestantes - 1,
        historico: [...prev.historico, snapshot],
      };
    });
  }, [fase, aplicarMovimento]);

  // Move direto de uma coluna pra outra sem passar pela seleção em duas etapas —
  // usado pelo arrastar (drag and drop). Retorna se a jogada foi aceita, pra quem
  // chamou saber se deixa a carta no lugar (drop válido) ou anima ela de volta
  // (drop inválido). A checagem de legalidade roda contra `mesa` (closure) pra
  // devolver a resposta na hora — a mutação de fato usa o `prev` do updater.
  const moverCarta = useCallback((origemIdx: number, destinoIdx: number): boolean => {
    if (fase !== 'jogando' || !mesa || origemIdx === destinoIdx) return false;
    const origem = mesa.colunas[origemIdx];
    if (origem.pilha.length === 0) return false;
    const cartaMovida = origem.pilha[origem.pilha.length - 1];
    if (!movimentoLegal(cartaMovida, mesa.colunas[destinoIdx])) return false;

    setMesa(prev => {
      if (!prev) return prev;
      const snapshot: HistoricoEntrada = { colunas: clonarColunas(prev.colunas), movimentosRestantes: prev.movimentosRestantes };
      const novasColunas = clonarColunas(prev.colunas);
      aplicarMovimento(novasColunas, origemIdx, destinoIdx, cartaMovida);

      return {
        colunas: novasColunas,
        selecionada: null,
        movimentosRestantes: prev.movimentosRestantes - 1,
        historico: [...prev.historico, snapshot],
      };
    });
    return true;
  }, [fase, mesa, aplicarMovimento]);

  const desfazer = useCallback(async () => {
    if (fase !== 'jogando' || !mesa || mesa.historico.length === 0) return;
    const ok = await gastar(ECONOMY.SOLITARIO_DESFAZER, 'Desfazer jogada — Paciência Católica');
    if (!ok) {
      Alert.alert('Moedas insuficientes', `Você precisa de ${ECONOMY.SOLITARIO_DESFAZER} 🪙 para desfazer a última jogada.`);
      return;
    }
    setMesa(prev => {
      if (!prev || prev.historico.length === 0) return prev;
      const ultimo = prev.historico[prev.historico.length - 1];
      return {
        colunas: ultimo.colunas,
        selecionada: null,
        movimentosRestantes: ultimo.movimentosRestantes,
        historico: prev.historico.slice(0, -1),
      };
    });
  }, [fase, mesa, gastar]);

  const dica = useCallback(async () => {
    if (fase !== 'jogando' || !mesa) return;
    const jogada = encontrarMelhorJogada(mesa.colunas);
    if (!jogada) return;
    const ok = await gastar(ECONOMY.SOLITARIO_DICA, 'Dica — Paciência Católica');
    if (!ok) {
      Alert.alert('Moedas insuficientes', `Você precisa de ${ECONOMY.SOLITARIO_DICA} 🪙 para usar uma dica.`);
      return;
    }
    setDicasUsadas(d => d + 1);
    setDicaAtual(jogada);
    if (dicaTimeoutRef.current) clearTimeout(dicaTimeoutRef.current);
    dicaTimeoutRef.current = setTimeout(() => setDicaAtual(null), 1500);
  }, [fase, mesa, gastar]);

  const verificarGrupoCompleto = useCallback(() => {
    return !!mesa && mesa.colunas.some(c => grupoCompletoEm(c.pilha));
  }, [mesa]);

  const verificarDerrota = useCallback(() => {
    if (!mesa) return false;
    return mesa.movimentosRestantes <= 0 || !existeMovimentoLegal(mesa.colunas);
  }, [mesa]);

  const verificarVitoria = useCallback(() => {
    return !!mesa && mesa.colunas.every(c => c.monte.length === 0 && c.pilha.length === 0);
  }, [mesa]);

  return {
    GAME_ID,
    fase,
    nivelAtual,
    colunas: mesa?.colunas ?? [],
    selecionada: mesa?.selecionada ?? null,
    movimentosRestantes: mesa?.movimentosRestantes ?? 0,
    movimentosIniciais: nivelAtual?.movimentos ?? 0,
    podeDesfazer: !!mesa && mesa.historico.length > 0,
    dicaAtual,
    dicasUsadas,
    ultimoGrupo,
    tempoGastoMs,
    saldoMoedas,
    ganhar,
    iniciarNivel,
    sair,
    selecionarCarta,
    moverCarta,
    desfazer,
    dica,
    verificarGrupoCompleto,
    verificarDerrota,
    verificarVitoria,
  };
}
