import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getDailyMissionGameId, todayKey } from '@/lib/daily-mission';
import { pushGameProgress } from '@/lib/progress-sync';

const STORE_KEY   = '@santosplay:game_store';
const MISSION_KEY = '@santosplay:missao_dias';

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
  missionDaysPlayed:    string[];
  reportResult:         (result: GameResult) => void;
  hydrate:              (data: { totalScore: number; gamesPlayed: number; unlockedAchievements: string[] }) => void;
  reset:                () => void;
}

const GameStoreContext = createContext<GameStore>({
  totalScore: 0,
  gamesPlayed: 0,
  unlockedAchievements: [],
  missionDaysPlayed: [],
  reportResult: () => {},
  hydrate: () => {},
  reset: () => {},
});

export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [totalScore,           setTotalScore]           = useState(0);
  const [gamesPlayed,          setGamesPlayed]          = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [missionDaysPlayed,    setMissionDaysPlayed]    = useState<string[]>([]);
  const [loaded,               setLoaded]               = useState(false);

  // Refs espelham o estado atual para que reportResult possa calcular valores novos
  // de forma síncrona (setState é assíncrono e não retorna o novo valor)
  const totalScoreRef     = useRef(0);
  const gamesPlayedRef    = useRef(0);
  const achievementsRef   = useRef<string[]>([]);
  const missionDaysRef    = useRef<string[]>([]);
  const userIdRef         = useRef<string | undefined>(undefined);

  useEffect(() => { totalScoreRef.current   = totalScore;   }, [totalScore]);
  useEffect(() => { gamesPlayedRef.current  = gamesPlayed;  }, [gamesPlayed]);
  useEffect(() => { achievementsRef.current = unlockedAchievements; }, [unlockedAchievements]);
  useEffect(() => { missionDaysRef.current  = missionDaysPlayed; }, [missionDaysPlayed]);
  useEffect(() => { userIdRef.current       = user?.id;     }, [user?.id]);

  useEffect(() => { setLoaded(true); }, []);

  // Dias da Missão do Dia jogados — só local (sem Supabase), carregado uma vez
  useEffect(() => {
    AsyncStorage.getItem(MISSION_KEY)
      .then(raw => {
        if (!raw) return;
        const arr = JSON.parse(raw) as unknown;
        if (Array.isArray(arr)) setMissionDaysPlayed(arr);
      })
      .catch(() => {});
  }, []);

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

  // Não mexe em missionDaysPlayed/MISSION_KEY: a sequência da missão do dia é
  // só local (sem Supabase) — chamado a cada cold start com sessão ativa
  // (ver ProgressSyncBridge em app/_layout.tsx), então limpar aqui apagava a
  // sequência do usuário toda vez que ele reabria o app.
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

    // Marca o dia de hoje como jogado se o jogo concluído for o da Missão do
    // Dia — acende a estrela da semana na Home. Só conta a conclusão real,
    // não abrir o jogo (é por isso que isso mora aqui, no fim da partida).
    if (result.gameId && result.gameId === getDailyMissionGameId()) {
      const today = todayKey();
      if (!missionDaysRef.current.includes(today)) {
        const nextDays = [...missionDaysRef.current, today].slice(-30);
        setMissionDaysPlayed(nextDays);
        AsyncStorage.setItem(MISSION_KEY, JSON.stringify(nextDays)).catch(() => {});
      }
    }

    // Grava no banco imediatamente — igual à gravação de moedas nos jogos
    const uid = userIdRef.current;
    if (uid) {
      pushGameProgress(uid, newScore, newGamesPlayed, newAchievements).catch(() => {});
    }
  }, []);

  return (
    <GameStoreContext.Provider
      value={{ totalScore, gamesPlayed, unlockedAchievements, missionDaysPlayed, reportResult, hydrate, reset }}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  return useContext(GameStoreContext);
}
