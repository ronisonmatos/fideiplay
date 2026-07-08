import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Appearance, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router, useSegments } from 'expo-router';
import * as ExpoNotifications from 'expo-notifications';
import Constants from 'expo-constants';

const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { GameStoreProvider, useGameStore } from '@/context/game-store';
import { GameLevelsProvider } from '@/context/game-levels-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationsProvider, useNotifications } from '@/context/notifications-context';
import { useLocalizacao } from '@/hooks/use-location';
import { processarConvitePendente } from '@/lib/convites';
import { scheduleDailyReminder, setupNotificationChannel, syncServerNotifications, registerAndSavePushToken } from '@/lib/notifications';
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

  // Sync do banco + push token ao fazer login e ao retornar ao foreground
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const sync = () => {
      syncServerNotifications(userId, onServerNotif);
      registerAndSavePushToken(userId).catch(() => {});
    };
    sync();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [user?.id, onServerNotif]);

  // Captura notificações Expo recebidas com o app aberto (lembrete diário, bônus etc.)
  useEffect(() => {
    if (isExpoGoAndroid) return; // push não suportado no Expo Go Android (SDK 53+)
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
  const { user, isGuest, signInTick } = useAuth();
  const { solicitarPermissao, atualizarLocalizacao } = useLocalizacao();

  // Ref estável — solicitarPermissao muda de identidade quando a localização é
  // resolvida (atualiza o profile), e isso não pode disparar o efeito de novo.
  const solicitarLocalizacaoRef = useRef(solicitarPermissao);
  useEffect(() => { solicitarLocalizacaoRef.current = solicitarPermissao; }, [solicitarPermissao]);

  const atualizarLocalizacaoRef = useRef(atualizarLocalizacao);
  useEffect(() => { atualizarLocalizacaoRef.current = atualizarLocalizacao; }, [atualizarLocalizacao]);

  // Login explícito (signInTick só incrementa no evento SIGNED_IN, não na
  // sessão persistida restaurada no boot) força atualização da localização
  // ignorando o cache de 24h.
  useEffect(() => {
    if (signInTick === 0) return;
    atualizarLocalizacaoRef.current().catch(() => {});
  }, [signInTick]);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    const inResetPassword = segments[0] === 'reset-password';
    if (inResetPassword) return;
    if (!user && !inAuth && !isGuest) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, isGuest]);

  useEffect(() => {
    if (loading) return;
    setupNotificationChannel().catch(() => {});
    scheduleDailyReminder().catch(() => {});
    // Pede localização logo em seguida da permissão de notificação — mesmo
    // momento de onboarding, evita ter que ir em Configurações pedir depois.
    solicitarLocalizacaoRef.current().catch(() => {});
  }, [loading]);

  // Aplica convite salvo localmente (usuário abriu o link de convite antes de
  // logar) assim que uma sessão fica disponível — sem isso o bônus nunca cai.
  useEffect(() => {
    if (loading || !user?.id) return;
    processarConvitePendente(user.id).catch(() => {});
  }, [loading, user?.id]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <GameStoreProvider>
          <GameLevelsProvider>
            <NotificationsProvider>
              <ProgressSyncBridge />
              <NotificationBridge />
              <AnimatedSplashOverlay />
              <AuthGate />
              <Stack screenOptions={{ headerShown: false }} />
            </NotificationsProvider>
          </GameLevelsProvider>
        </GameStoreProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
