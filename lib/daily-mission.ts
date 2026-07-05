import { GAMES, type GameInfo } from '@/constants/games';

// Chave local (YYYY-MM-DD) no fuso do aparelho — não usar toISOString() aqui,
// que é UTC e pode "virar o dia" antes/depois da meia-noite local do usuário.
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Mesma conta usada há tempos na Home: um jogo por dia, na ordem de GAMES,
// girando com o calendário — dia 0 (epoch) cai no jogo 0, e assim por diante.
function dailyMissionIndex(): number {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return dayIndex % GAMES.length;
}

export function getDailyMission(): GameInfo {
  return GAMES[dailyMissionIndex()];
}

export function getDailyMissionGameId(): string {
  return getDailyMission().gameId;
}

// 7 booleans, do mais antigo (6 dias atrás) para hoje (índice 6) — usado para
// acender as estrelas da semana na Home.
export function getLast7DaysStars(missionDaysPlayed: string[]): boolean[] {
  const played = new Set(missionDaysPlayed);
  const stars: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    stars.push(played.has(todayKey(d)));
  }
  return stars;
}
