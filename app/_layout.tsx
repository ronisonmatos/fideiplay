import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Appearance } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { GameStoreProvider, useGameStore } from '@/context/game-store';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationsProvider } from '@/context/notifications-context';
import { scheduleDailyReminder, setupNotificationChannel, syncServerNotifications } from '@/lib/notifications';
import { pullProgress, pushProgress } from '@/lib/progress-sync';

// Aplica o tema salvo (padrão: escuro)
AsyncStorage.getItem('@fideiplay:theme').then(saved => {
  Appearance.setColorScheme(saved === 'light' ? 'light' : 'dark');
});

// ── Sincronização de progresso offline-first ─────────────────────────────────
function ProgressSyncBridge() {
  const { user } = useAuth();
  const { totalScore, gamesPlayed, unlockedAchievements, hydrate } = useGameStore();

  const didPullRef   = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePush = useCallback((userId: string) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushProgress(userId).catch(() => {});
    }, 4000);
  }, []);

  // Ao fazer login (ou quando guest se loga):
  // 1. Baixa do banco e mescla com dados offline (guest ou não)
  // 2. Atualiza estado em memória com o melhor dos dois
  // 3. Faz push imediato para garantir que dados offline subam ao banco
  useEffect(() => {
    if (!user?.id) {
      didPullRef.current = false;
      return;
    }
    if (didPullRef.current) return;
    didPullRef.current = true;

    pullProgress(user.id)
      .then(merged => {
        if (merged) {
          // O pull já fez o merge e escreveu no AsyncStorage.
          // Atualiza o estado em memória com os dados do banco (sempre o maior).
          hydrate({
            totalScore:           merged.gamesXp,
            gamesPlayed:          merged.gamesPlayed,
            unlockedAchievements: merged.unlockedAchievements,
          });
        }
        // Push garante que dados offline (ex: guest) subam ao banco,
        // mesmo que o pull não tenha retornado nada (conta nova).
        pushProgress(user.id).catch(() => {});
      })
      .catch(() => {
        // Sem internet no login: apenas sobe o que temos localmente
        pushProgress(user.id).catch(() => {});
      });
  }, [user?.id, hydrate, schedulePush]);

  // Quando XP/conquistas mudam (após jogar): envia para o banco com debounce
  useEffect(() => {
    if (!user?.id || !didPullRef.current) return;
    schedulePush(user.id);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [user?.id, totalScore, gamesPlayed, unlockedAchievements, schedulePush]);

  // Quando app volta ao foco: sincroniza (pega trilhas concluídas, por ex.)
  useEffect(() => {
    if (!user?.id) return;
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && didPullRef.current) {
        pushProgress(user.id).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [user?.id]);

  return null;
}

// ── Redirecionamento de autenticação ─────────────────────────────────────────
function AuthGate() {
  const { user, loading, isGuest } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth && !isGuest) {
      router.replace('/(auth)/register');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, isGuest]);

  useEffect(() => {
    if (loading) return;
    setupNotificationChannel();
    scheduleDailyReminder();
  }, [loading]);

  useEffect(() => {
    if (!user?.id) return;
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncServerNotifications(user.id);
    });
    syncServerNotifications(user.id);
    return () => sub.remove();
  }, [user?.id]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GameStoreProvider>
        <NotificationsProvider>
          <ProgressSyncBridge />
          <AnimatedSplashOverlay />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationsProvider>
      </GameStoreProvider>
    </AuthProvider>
  );
}
