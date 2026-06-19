import { Tabs } from 'expo-router';
import { Text, useColorScheme } from 'react-native';

import { C, Colors } from '@/constants/theme';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.purple,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundElement,
          borderTopColor: C.border,
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Jogos', tabBarIcon: () => <TabIcon emoji="🎮" /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: () => <TabIcon emoji="💬" /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Conta', tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
