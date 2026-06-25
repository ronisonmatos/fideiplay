import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { pushGameProgress } from '@/lib/progress-sync';

const STORE_KEY = '@fideiplay:game_store';

export interface GameResult {
  gameId?: string;
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
  reset:                () => void;
}

const GameStoreContext = createContext<GameStore>({
  totalScore: 0,
  gamesPlayed: 0,
  unlockedAchievements: [],
  reportResult: () => {},
  hydrate: () => {},
  reset: () => {},
});

export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [totalScore,           setTotalScore]           = useState(0);
  const [gamesPlayed,          setGamesPlayed]          = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [loaded,               setLoaded]               = useState(false);

  // Refs espelham o estado atual para que reportResult possa calcular valores novos
  // de forma síncrona (setState é assíncrono e não retorna o novo valor)
  const totalScoreRef    = useRef(0);
  const gamesPlayedRef   = useRef(0);
  const achievementsRef  = useRef<string[]>([]);
  const userIdRef        = useRef<string | undefined>(undefined);

  useEffect(() => { totalScoreRef.current   = totalScore;   }, [totalScore]);
  useEffect(() => { gamesPlayedRef.current  = gamesPlayed;  }, [gamesPlayed]);
  useEffect(() => { achievementsRef.current = unlockedAchievements; }, [unlockedAchievements]);
  useEffect(() => { userIdRef.current       = user?.id;     }, [user?.id]);

  useEffect(() => { setLoaded(true); }, []);

  // Persiste no AsyncStorage (para ProgressSyncBridge e pushProgress lerem)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORE_KEY,
      JSON.stringify({ totalScore, gamesPlayed, unlockedAchievements }),
    ).catch(() => {});
  }, [loaded, totalScore, gamesPlayed, unlockedAchievements]);

  const hydrate = useCallback((data: {
    totalScore: number; gamesPlayed: number; unlockedAchievements: string[];
  }) => {
    setTotalScore(data.totalScore);
    setGamesPlayed(data.gamesPlayed);
    setUnlockedAchievements(data.unlockedAchievements);
  }, []);

  const reset = useCallback(() => {
    setTotalScore(0);
    setGamesPlayed(0);
    setUnlockedAchievements([]);
    AsyncStorage.removeItem(STORE_KEY).catch(() => {});
  }, []);

  const reportResult = useCallback((result: GameResult) => {
    // Calcula valores novos de forma síncrona usando refs
    const newScore        = totalScoreRef.current  + result.score;
    const newGamesPlayed  = gamesPlayedRef.current + 1;

    const next = new Set(achievementsRef.current);
    next.add('primeiroPasso');
    if (result.perfectQuiz)                  next.add('conhecedor');
    if (result.allVersesCorrect)             next.add('biblista');
    if (result.pilgrimComplete)              next.add('apostolo');
    if (result.allStopFilled)               next.add('stopMestre');
    if ((result.liturgyTimeLeft ?? 0) >= 30) next.add('relampago');
    const newAchievements = [...next];

    // Atualiza estado React
    setTotalScore(newScore);
    setGamesPlayed(newGamesPlayed);
    setUnlockedAchievements(newAchievements);

    // Grava no banco imediatamente — igual à gravação de moedas nos jogos
    const uid = userIdRef.current;
    if (uid) {
      pushGameProgress(uid, newScore, newGamesPlayed, newAchievements).catch(() => {});
    }
  }, []);

  return (
    <GameStoreContext.Provider value={{ totalScore, gamesPlayed, unlockedAchievements, reportResult, hydrate, reset }}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  return useContext(GameStoreContext);
}
