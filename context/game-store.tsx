import { createContext, useCallback, useContext, useState } from 'react';

export interface GameResult {
  gameId: string;
  score: number;
  perfectQuiz?: boolean;
  allVersesCorrect?: boolean;
  pilgrimComplete?: boolean;
  allStopFilled?: boolean;
  liturgyTimeLeft?: number;
}

interface GameStore {
  totalScore: number;
  gamesPlayed: number;
  unlockedAchievements: string[];
  reportResult: (result: GameResult) => void;
}

const GameStoreContext = createContext<GameStore>({
  totalScore: 0,
  gamesPlayed: 0,
  unlockedAchievements: [],
  reportResult: () => {},
});

export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const [totalScore, setTotalScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  const reportResult = useCallback((result: GameResult) => {
    setTotalScore(s => s + result.score);
    setGamesPlayed(n => n + 1);

    setUnlockedAchievements(prev => {
      const next = new Set(prev);

      next.add('primeiroPasso');

      if (result.perfectQuiz) next.add('conhecedor');
      if (result.allVersesCorrect) next.add('biblista');
      if (result.pilgrimComplete) next.add('apostolo');
      if (result.allStopFilled) next.add('stopMestre');
      if ((result.liturgyTimeLeft ?? 0) >= 30) next.add('relampago');

      if (next.size === prev.length) return prev;
      return [...next];
    });
  }, []);

  return (
    <GameStoreContext.Provider value={{ totalScore, gamesPlayed, unlockedAchievements, reportResult }}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  return useContext(GameStoreContext);
}
