import { Image, Text, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';

import { C, Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notifications-context';
import { useAdminBadge } from '@/hooks/use-admin-badge';

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
  const { chatUnreadCount } = useNotifications();
  const { profile } = useAuth();
  const adminBadgeCount = useAdminBadge(profile?.is_admin);

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
          tabBarBadge: chatUnreadCount > 0 ? (chatUnreadCount > 9 ? '9+' : chatUnreadCount) : undefined,
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
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: profile?.is_admin ? undefined : null,
          tabBarBadge: adminBadgeCount > 0 ? (adminBadgeCount > 9 ? '9+' : adminBadgeCount) : undefined,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.38 }}>✋</Text>
          ),
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
