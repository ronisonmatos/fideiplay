import type { Href } from 'expo-router';
import { C } from '@/constants/theme';

export interface GameInfo {
  gameId: string;
  image: number;
  title: string;
  tag: string;
  tagColor: string;
  desc: string;
  route: Href;
}

// gameId deve bater com o GAME_ID usado por cada tela ao chamar reportResult()
// — é assim que sabemos se o jogo concluído era o da Missão do Dia.
export const GAMES: GameInfo[] = [
  {
    gameId: 'quiz-santos',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/quiz.png') as number,
    title: 'Quiz Católico',
    tag: 'Quiz',
    tagColor: C.gold,
    desc: '45 perguntas · 3 níveis de dificuldade',
    route: '/quiz-santos',
  },
  {
    gameId: 'versiculo',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/frase_misteriosa.png') as number,
    title: 'Sabedoria Católica',
    tag: 'Bíblia',
    tagColor: C.purple,
    desc: '45 frases · Versículos, santos e papas',
    route: '/versiculo-misterioso',
  },
  {
    gameId: 'peregrinacao',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/peregrinacao.png') as number,
    title: 'Peregrinação Virtual',
    tag: 'Aventura',
    tagColor: C.green,
    desc: '10 santuários · Perguntas por etapa',
    route: '/peregrinacao',
  },
  {
    gameId: 'palavras-fe',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/palavra_cruzada.png') as number,
    title: 'Cruzada Católica',
    tag: 'Vocabulário',
    tagColor: '#3B82F6',
    desc: '9 temas · 3 níveis de dificuldade',
    route: '/palavras-fe',
  },
  {
    gameId: 'desafio-liturgico',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/desafio_calendário_liturgico.png') as number,
    title: 'Desafio Litúrgico',
    tag: 'Liturgia',
    tagColor: C.red,
    desc: '45 questões · 3 níveis de dificuldade',
    route: '/desafio-liturgico',
  },
  {
    gameId: 'stop-solo',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/stop.png') as number,
    title: 'Stop Católico',
    tag: 'Vocabulário',
    tagColor: C.gold,
    desc: '6 categorias · Letra sorteada',
    route: '/stop-catolico',
  },
  {
    gameId: 'latim-boggle',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/latim_boggle.png') as number,
    title: 'Boggle Latim',
    tag: 'Vocabulário',
    tagColor: '#3B82F6',
    desc: '7 níveis · Vocabulário litúrgico em latim',
    route: '/latim-boggle',
  },
  {
    gameId: 'solitario-catolico',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/solitario_catolico.png') as number,
    title: 'Solitário Católico',
    tag: 'Cartas',
    tagColor: C.green,
    desc: '20 níveis · Agrupe cartas por categoria',
    route: '/solitario-catolico',
  },
];
