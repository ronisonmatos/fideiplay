import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Appearance } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import * as ExpoNotifications from 'expo-notifications';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { GameStoreProvider, useGameStore } from '@/context/game-store';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationsProvider, useNotifications } from '@/context/notifications-context';
import { scheduleDailyReminder, setupNotificationChannel, syncServerNotifications } from '@/lib/notifications';
import { pullProgress, pushProgress } from '@/lib/progress-sync';

// Aplica o tema salvo (padrão: escuro)
AsyncStorage.getItem('@santosplay:theme').then(saved => {
  Appearance.setColorScheme(saved === 'light' ? 'light' : 'dark');
});

// ── Sincronização de progresso (somente quando logado) ───────────────────────
function ProgressSyncBridge() {
  const { user } = useAuth();
  const { totalScore, gamesPlayed, unlockedAchievements, hydrate, reset } = useGameStore();

  const didPullRef   = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePush = useCallback((userId: string) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushProgress(userId).catch(() => {});
    }, 4000);
  }, []);

  // Ao fazer login: descarta progresso offline e carrega exclusivamente do banco
  useEffect(() => {
    if (!user?.id) {
      didPullRef.current = false;
      return;
    }
    if (didPullRef.current) return;

    // Limpa progresso offline antes de carregar dados do banco
    reset();
    AsyncStorage.removeItem('@santosplay:trilhas_progresso').catch(() => {});

    didPullRef.current = true;

    pullProgress(user.id)
      .then(remote => {
        if (remote) {
          hydrate({
            totalScore:           remote.gamesXp,
            gamesPlayed:          remote.gamesPlayed,
            unlockedAchievements: remote.unlockedAchievements,
          });
          // Escreve trilha no AsyncStorage para trilhas.tsx ler
          AsyncStorage.setItem('@santosplay:trilhas_progresso', JSON.stringify({
            licoesConcluidas: remote.licoesConcluidas,
            xpTotal:          remote.trilhasXp,
          })).catch(() => {});
        }
      })
      .catch(() => {});
  }, [user?.id, reset, hydrate]);

  // Quando XP/conquistas mudam (após jogar): envia para o banco com debounce
  // Ignora estado inicial/reset (tudo zero) para não enviar arrays vazios ao banco
  useEffect(() => {
    if (!user?.id || !didPullRef.current) return;
    if (totalScore === 0 && gamesPlayed === 0) return;
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

// ── Bridge: captura todas as notificações para a tela in-app ─────────────────
function NotificationBridge() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Ref estável para não recriar efeitos ao re-render
  const addRef = useRef(addNotification);
  useEffect(() => { addRef.current = addNotification; }, [addNotification]);

  // Callback para notificações vindas do banco (notifications table)
  const onServerNotif = useCallback((title: string, body: string) => {
    addRef.current({ type: 'server', title, body, createdAt: new Date().toISOString() }, true);
  }, []);

  // Sync do banco ao abrir/focar o app
  useEffect(() => {
    if (!user?.id) return;
    const sync = () => syncServerNotifications(user.id, onServerNotif);
    sync();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [user?.id, onServerNotif]);

  // Captura notificações Expo recebidas com o app aberto (lembrete diário, bônus etc.)
  useEffect(() => {
    const sub = ExpoNotifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      const identifier = notification.request.identifier;
      if (!title) return;
      // Chat já é tratado pelo chat.tsx — evita duplicata
      if ((data as Record<string, unknown>)?.type === 'chat') return;
      // Banco já é tratado por syncServerNotifications via onInApp — evita duplicata
      if (identifier.startsWith('server-')) return;
      addRef.current({
        type: 'system',
        title,
        body: body ?? '',
        createdAt: new Date().toISOString(),
      }, true); // silent — o SO já tocou o som
    });
    return () => sub.remove();
  }, []);

  return null;
}

// ── Redirecionamento de autenticação ─────────────────────────────────────────
function AuthGate() {
  const { loading } = useAuth();
  const segments = useSegments();
  const { user, isGuest } = useAuth();

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

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GameStoreProvider>
        <NotificationsProvider>
          <ProgressSyncBridge />
          <NotificationBridge />
          <AnimatedSplashOverlay />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationsProvider>
      </GameStoreProvider>
    </AuthProvider>
  );
}
