import { ECONOMY } from '@/constants/economy';

export interface CartaSolitario {
  id: string;
  nome: string;
  imagemUrl: string | null;
  categoriaId: string | null; // no coringa, é a categoria que ele substituiu no baralho (única que ele pode fechar)
  isWildcard: boolean;
  isCategoria: boolean; // Carta Categoria: âncora de UMA categoria específica — grupo dela precisa de 5 cartas, não 4
  icone: string;
  cor: string;
}

export interface NivelSolitario {
  id: string;
  numero: number;
  colunas: number;
  categorias: number;
  totalCartas: number;
  movimentos: number;
  temCoringa: boolean;
  usaImagem: boolean; // a partir do nível 6 — CardView prefere imagemUrl quando existir
}

export interface CategoriaComCartas {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  cartas: { id: string; nome: string; imagemUrl: string | null }[];
}

export const MAX_LEVEL = 20;

export const SOLITARIO_NIVEIS_FIXOS: NivelSolitario[] = [
  { id: 'nivel-1', numero: 1, colunas: 3, categorias: 2, totalCartas: 8,  movimentos: 100, temCoringa: true, usaImagem: false },
  { id: 'nivel-2', numero: 2, colunas: 3, categorias: 3, totalCartas: 12, movimentos: 80,  temCoringa: true, usaImagem: false },
  { id: 'nivel-3', numero: 3, colunas: 4, categorias: 3, totalCartas: 16, movimentos: 70,  temCoringa: true, usaImagem: false },
  { id: 'nivel-4', numero: 4, colunas: 4, categorias: 4, totalCartas: 20, movimentos: 60,  temCoringa: true, usaImagem: false },
  { id: 'nivel-5', numero: 5, colunas: 5, categorias: 4, totalCartas: 24, movimentos: 50,  temCoringa: true, usaImagem: false },
];

// Níveis 6-20: colunas ficam em 5, cartas crescem até o nível 11 e depois estabilizam
// (44 cartas), e daí em diante só os movimentos continuam ficando mais apertados —
// evita exigir uma quantidade de conteúdo cadastrado no banco sem limite.
function generateLevel(n: number): NivelSolitario {
  const colunas = 5;
  const categorias = n % 2 === 0 ? 4 : 5;
  const growth = Math.min(n, 11) - 6;
  const totalCartas = 24 + growth * 4;
  const movimentos = Math.max(26, 50 - (n - 6) * 2);
  return {
    id: `nivel-${n}`,
    numero: n,
    colunas,
    categorias,
    totalCartas,
    movimentos,
    temCoringa: true,
    usaImagem: true,
  };
}

// Sem pelo menos 1 coluna "livre" (colunas > categorias), o tabuleiro trava: cada
// pilha não-vazia fica presa numa categoria, e uma vez que todas as colunas estejam
// ocupadas por categorias diferentes não sobra destino válido pra manobra — mesmo
// com movimentos sobrando. Confirmado por simulação: colunas <= categorias trava
// ~72-81% das partidas; colunas = categorias + 1 elimina esse travamento.
function comBufferGarantido(nivel: NivelSolitario): NivelSolitario {
  const colunas = Math.max(nivel.colunas, nivel.categorias + 1);
  return colunas === nivel.colunas ? nivel : { ...nivel, colunas };
}

export function getNivel(n: number): NivelSolitario | null {
  if (n < 1 || n > MAX_LEVEL) return null;
  const nivel = n <= SOLITARIO_NIVEIS_FIXOS.length ? SOLITARIO_NIVEIS_FIXOS[n - 1] : generateLevel(n);
  return comBufferGarantido(nivel);
}

function xpDoNivel(numero: number): number {
  if (numero <= 2) return ECONOMY.XP_FACIL;
  if (numero <= 4) return ECONOMY.XP_MEDIO;
  return ECONOMY.XP_DIFICIL;
}

export const SOLITARIO_XP_TOTAL = Array.from({ length: MAX_LEVEL }, (_, i) => xpDoNivel(i + 1))
  .reduce((sum, xp) => sum + xp, 0);

export function xpDoNivelAtual(numero: number): number {
  return xpDoNivel(numero);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const CORINGA_ID = 'coringa';

function criarCoringa(categoriaAlvo: string | null): CartaSolitario {
  return {
    id: CORINGA_ID,
    nome: 'Coringa',
    imagemUrl: null,
    categoriaId: categoriaAlvo,
    isWildcard: true,
    isCategoria: false,
    icone: '⭐',
    cor: '#EF9F27',
  };
}

// Carta Categoria: define/ancora a categoria (ex.: "Categoria Orações") — as demais
// cartas da MESMA categoria devem se juntar a ela. Ao contrário do coringa, não é
// substituída no baralho: é somada por cima, então o grupo que a contém precisa de
// 5 cartas (ela + 4 reais) pra fechar em vez de 4 (ver grupoValido no hook).
function criarCartaCategoria(cat: CategoriaComCartas): CartaSolitario {
  return {
    id: `categoria-${cat.id}`,
    nome: `Categoria ${cat.nome}`,
    imagemUrl: null,
    categoriaId: cat.id,
    isWildcard: false,
    isCategoria: true,
    icone: cat.icone,
    cor: cat.cor,
  };
}

export interface BaralhoMontado {
  baralho: CartaSolitario[];
  totalCartasReal: number;
  categoriasUsadas: number;
}

// Distribui cartas do banco entre as categorias escolhidas para o nível, em unidades
// de 4 (tamanho de um grupo completo), round-robin entre as categorias disponíveis.
// Nunca falha por "não ter cartas suficientes" — encolhe o total silenciosamente.
// Retorna null só quando o banco não tem nem 2 categorias jogáveis (ativas com ≥4 cartas).
export function montarBaralho(nivel: NivelSolitario, categoriasDisponiveis: CategoriaComCartas[]): BaralhoMontado | null {
  const usaveis = categoriasDisponiveis.filter(c => c.cartas.length >= 4);
  if (usaveis.length < 2) return null;

  const selecionadas = shuffle(usaveis).slice(0, Math.min(nivel.categorias, usaveis.length));
  const capsPorCategoria = selecionadas.map(c => Math.floor(c.cartas.length / 4));
  const unidadesAlvo = Math.floor(nivel.totalCartas / 4);
  const unidadesAtribuidas = selecionadas.map(() => 0);

  let restantes = unidadesAlvo;
  let progrediu = true;
  while (restantes > 0 && progrediu) {
    progrediu = false;
    for (let i = 0; i < selecionadas.length && restantes > 0; i++) {
      if (unidadesAtribuidas[i] < capsPorCategoria[i]) {
        unidadesAtribuidas[i] += 1;
        restantes -= 1;
        progrediu = true;
      }
    }
  }

  const baralho: CartaSolitario[] = [];
  selecionadas.forEach((cat, i) => {
    const quantidade = unidadesAtribuidas[i] * 4;
    if (quantidade === 0) return;
    const escolhidas = shuffle(cat.cartas).slice(0, quantidade);
    for (const carta of escolhidas) {
      baralho.push({
        id: carta.id,
        nome: carta.nome,
        imagemUrl: carta.imagemUrl,
        categoriaId: cat.id,
        isWildcard: false,
        isCategoria: false,
        icone: cat.icone,
        cor: cat.cor,
      });
    }
  });

  // O coringa SUBSTITUI uma carta real (não é somado ao baralho) — o total de
  // cartas do nível é sempre múltiplo de 4 (unidades de grupo completo), então
  // adicionar o coringa por cima deixava sempre 1 carta impossível de agrupar,
  // travando o tabuleiro para sempre com uma carta sobrando. Ele guarda a categoria
  // da carta que substituiu (`categoriaAlvo`) porque é a ÚNICA categoria que fica
  // com uma carta a menos — fechar um grupo do coringa em qualquer outra categoria
  // (que já tinha as 4 cartas completas por conta própria) gastaria 3 cartas reais
  // dela à toa, sobrando 1 carta sem par bem ali (ver `grupoValido` no hook).
  if (nivel.temCoringa && baralho.length > 0) {
    const idx = Math.floor(Math.random() * baralho.length);
    const categoriaAlvo = baralho[idx].categoriaId;
    baralho[idx] = criarCoringa(categoriaAlvo);
  }

  // Uma Carta Categoria por categoria efetivamente usada no nível (unidade > 0) —
  // depois da substituição do coringa, pra nunca sortear o índice dela por engano.
  selecionadas.forEach((cat, i) => {
    if (unidadesAtribuidas[i] > 0) baralho.push(criarCartaCategoria(cat));
  });

  return {
    baralho: shuffle(baralho),
    totalCartasReal: baralho.length,
    categoriasUsadas: unidadesAtribuidas.filter(u => u > 0).length,
  };
}
