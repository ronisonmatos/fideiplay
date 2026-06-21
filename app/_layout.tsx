import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { GameStoreProvider } from '@/context/game-store';
import { AuthProvider, useAuth } from '@/context/auth-context';

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
