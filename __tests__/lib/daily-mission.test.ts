import { getDailyMission, getLast7DaysStars, todayKey } from '@/lib/daily-mission';
import { GAMES } from '@/constants/games';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('todayKey', () => {
  it('formata a data local como YYYY-MM-DD com zero à esquerda', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('usa o fuso local, não UTC (23h59 local continua sendo o mesmo dia)', () => {
    const quaseMeiaNoite = new Date(2026, 6, 10, 23, 59, 59);
    expect(todayKey(quaseMeiaNoite)).toBe('2026-07-10');
  });
});

describe('getDailyMission', () => {
  afterEach(() => jest.restoreAllMocks());

  it('gira pelos jogos na ordem de GAMES conforme o dia', () => {
    for (let day = 0; day < GAMES.length * 2; day++) {
      jest.spyOn(Date, 'now').mockReturnValue(day * DAY_MS);
      expect(getDailyMission().gameId).toBe(GAMES[day % GAMES.length].gameId);
    }
  });

  it('devolve o mesmo jogo durante o mesmo dia inteiro', () => {
    const base = 20_000 * DAY_MS;
    jest.spyOn(Date, 'now').mockReturnValue(base + 60_000); // logo após a virada
    const cedo = getDailyMission().gameId;
    jest.spyOn(Date, 'now').mockReturnValue(base + DAY_MS - 60_000); // fim do dia
    expect(getDailyMission().gameId).toBe(cedo);
  });
});

describe('getLast7DaysStars', () => {
  it('devolve 7 posições, todas apagadas quando nada foi jogado', () => {
    const stars = getLast7DaysStars([]);
    expect(stars).toHaveLength(7);
    expect(stars.every(s => s === false)).toBe(true);
  });

  it('acende só a última posição quando apenas hoje foi jogado', () => {
    const stars = getLast7DaysStars([todayKey()]);
    expect(stars[6]).toBe(true);
    expect(stars.slice(0, 6).every(s => s === false)).toBe(true);
  });

  it('acende a posição correta para um dia jogado no meio da semana', () => {
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);
    const stars = getLast7DaysStars([todayKey(tresDiasAtras)]);
    expect(stars[3]).toBe(true); // índice 0 = 6 dias atrás, então 3 dias atrás = índice 3
    expect(stars.filter(Boolean)).toHaveLength(1);
  });

  it('ignora dias fora da janela de 7 dias', () => {
    const dezDiasAtras = new Date();
    dezDiasAtras.setDate(dezDiasAtras.getDate() - 10);
    const stars = getLast7DaysStars([todayKey(dezDiasAtras)]);
    expect(stars.every(s => s === false)).toBe(true);
  });
});
