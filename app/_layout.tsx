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
