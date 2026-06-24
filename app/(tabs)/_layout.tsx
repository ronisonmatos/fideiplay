import { Image, Text, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';

import { C, Colors } from '@/constants/theme';
import { useNotifications } from '@/context/notifications-context';

function TabIcon({ source, focused }: { source: ReturnType<typeof require>; focused: boolean }) {
  return (
    <Image
      source={source}
      style={{ width: 26, height: 26, opacity: focused ? 1 : 0.38 }}
      resizeMode="contain"
    />
  );
}

export default function TabsLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { unreadCount } = useNotifications();

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
        options={{
          title: 'Jogos',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/jogos.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.38 }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="trilhas"
        options={{
          title: 'Trilhas',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.38 }}>🎓</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Conta',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/conta.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
