import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORE_KEY = '@fideiplay:game_store';

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
  totalScore:           number;
  gamesPlayed:          number;
  unlockedAchievements: string[];
  reportResult:         (result: GameResult) => void;
  hydrate:              (data: { totalScore: number; gamesPlayed: number; unlockedAchievements: string[] }) => void;
}

const GameStoreContext = createContext<GameStore>({
  totalScore: 0,
  gamesPlayed: 0,
  unlockedAchievements: [],
  reportResult: () => {},
  hydrate: () => {},
});

export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const [totalScore,           setTotalScore]           = useState(0);
  const [gamesPlayed,          setGamesPlayed]          = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [loaded,               setLoaded]               = useState(false);

  // Carrega do AsyncStorage ao iniciar
  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<{
            totalScore: number; gamesPlayed: number; unlockedAchievements: string[];
          }>;
          if (typeof saved.totalScore           === 'number') setTotalScore(saved.totalScore);
          if (typeof saved.gamesPlayed          === 'number') setGamesPlayed(saved.gamesPlayed);
          if (Array.isArray(saved.unlockedAchievements))      setUnlockedAchievements(saved.unlockedAchievements);
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  // Salva no AsyncStorage sempre que o estado mudar (após carregamento inicial)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORE_KEY,
      JSON.stringify({ totalScore, gamesPlayed, unlockedAchievements }),
    ).catch(() => {});
  }, [loaded, totalScore, gamesPlayed, unlockedAchievements]);

  // Carrega dados vindos do banco (chamado pelo ProgressSyncBridge)
  const hydrate = useCallback((data: {
    totalScore: number; gamesPlayed: number; unlockedAchievements: string[];
  }) => {
    setTotalScore(data.totalScore);
    setGamesPlayed(data.gamesPlayed);
    setUnlockedAchievements(data.unlockedAchievements);
  }, []);

  const reportResult = useCallback((result: GameResult) => {
    setTotalScore(s => s + result.score);
    setGamesPlayed(n => n + 1);

    setUnlockedAchievements(prev => {
      const next = new Set(prev);
      next.add('primeiroPasso');
      if (result.perfectQuiz)                        next.add('conhecedor');
      if (result.allVersesCorrect)                   next.add('biblista');
      if (result.pilgrimComplete)                    next.add('apostolo');
      if (result.allStopFilled)                      next.add('stopMestre');
      if ((result.liturgyTimeLeft ?? 0) >= 30)       next.add('relampago');
      if (next.size === prev.length) return prev;
      return [...next];
    });
  }, []);

  return (
    <GameStoreContext.Provider value={{ totalScore, gamesPlayed, unlockedAchievements, reportResult, hydrate }}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  return useContext(GameStoreContext);
}
