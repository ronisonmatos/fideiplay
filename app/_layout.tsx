import { useEffect } from 'react';
import { AppState, Appearance } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { GameStoreProvider } from '@/context/game-store';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { scheduleDailyReminder, syncServerNotifications } from '@/lib/notifications';

Appearance.setColorScheme('dark');

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

  // Lembrete diário ao abrir o app
  useEffect(() => {
    if (loading) return;
    scheduleDailyReminder();
  }, [loading]);

  // Sincroniza notificações do servidor quando app volta ao foco
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
        <AnimatedSplashOverlay />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }} />
      </GameStoreProvider>
    </AuthProvider>
  );
}
