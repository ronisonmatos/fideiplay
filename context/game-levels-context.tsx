import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const STORE_KEY = '@santosplay:niveis_concluidos';

function levelKey(gameId: string, levelId: string) {
  return `${gameId}:${levelId}`;
}

interface GameLevelsCtx {
  isLevelComplete:   (gameId: string, levelId: string) => boolean;
  markLevelComplete: (gameId: string, levelId: string) => void;
}

const Ctx = createContext<GameLevelsCtx>({
  isLevelComplete:   () => false,
  markLevelComplete: () => {},
});

export function GameLevelsProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const completedRef = useRef(completed);
  useEffect(() => { completedRef.current = completed; }, [completed]);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY)
      .then(raw => {
        if (!raw) return;
        const arr = JSON.parse(raw) as string[];
        if (Array.isArray(arr)) setCompleted(new Set(arr));
      })
      .catch(() => {});
  }, []);

  const isLevelComplete = useCallback(
    (gameId: string, levelId: string) => completedRef.current.has(levelKey(gameId, levelId)),
    [],
  );

  const markLevelComplete = useCallback((gameId: string, levelId: string) => {
    const key = levelKey(gameId, levelId);
    if (completedRef.current.has(key)) return;
    const next = new Set(completedRef.current);
    next.add(key);
    setCompleted(next);
    AsyncStorage.setItem(STORE_KEY, JSON.stringify([...next])).catch(() => {});
  }, []);

  return (
    <Ctx.Provider value={{ isLevelComplete, markLevelComplete }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGameLevels() {
  return useContext(Ctx);
}
