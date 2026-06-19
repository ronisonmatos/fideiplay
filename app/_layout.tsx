import { Stack } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { GameStoreProvider } from '@/context/game-store';

export default function RootLayout() {
  return (
    <GameStoreProvider>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </GameStoreProvider>
  );
}
