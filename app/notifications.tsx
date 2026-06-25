import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useNotifications, type AppNotification } from '@/context/notifications-context';
import { useTheme } from '@/hooks/use-theme';

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

function isYesterday(iso: string): boolean {
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
}

function groupLabel(iso: string): string {
  if (isToday(iso)) return 'Hoje';
  if (isYesterday(iso)) return 'Ontem';
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
}

function NotifItem({ n, onDelete }: { n: AppNotification; onDelete: () => void }) {
  const theme    = useTheme();
  const isUnread = !n.readAt;
  const icon     = n.type === 'chat_message' ? '💬' : n.type === 'server' ? '📢' : '🔔';
  const count    = n.count ?? 1;

  return (
    <View style={[
      s.item,
      { backgroundColor: theme.backgroundElement, borderColor: isUnread ? C.purple + '66' : C.border },
      isUnread && { borderLeftWidth: 3, borderLeftColor: C.purple },
    ]}>
      <View style={s.itemLeft}>
        <View>
          <ThemedText style={s.itemIcon}>{icon}</ThemedText>
          {count > 1 && (
            <View style={s.countBadge}>
              <ThemedText style={s.countBadgeText}>{count > 99 ? '99+' : count}</ThemedText>
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText style={[s.itemTitle, { color: isUnread ? theme.text : theme.textSecondary }]}
            numberOfLines={1}>
            {n.title}
          </ThemedText>
          <ThemedText style={[s.itemBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {n.body}
          </ThemedText>
          <ThemedText style={s.itemTime}>{fmtRelative(n.createdAt)}</ThemedText>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <ThemedText style={s.deleteBtnText}>✕</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAllRead, deleteNotification, clearAll } = useNotifications();
  const theme = useTheme();

  // Mark all as read when screen opens
  useEffect(() => {
    if (unreadCount > 0) markAllRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group by date label
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const n of notifications) {
    const label = groupLabel(n.createdAt);
    const existing = groups.find(g => g.label === label);
    if (existing) existing.items.push(n);
    else groups.push({ label, items: [n] });
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <ThemedText style={[s.backArrow, { color: theme.text }]}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={s.headerTitle}>Notificações</ThemedText>
          {notifications.length > 0 ? (
            <TouchableOpacity onPress={clearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ThemedText style={{ fontSize: 12, color: C.red }}>Limpar</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 52 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
          {notifications.length === 0 ? (
            <View style={s.empty}>
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                source={require('@/assets/images/sino.png')}
                style={s.emptyIcon}
                resizeMode="contain"
              />
              <ThemedText style={[s.emptyTitle, { color: theme.text }]}>Nenhuma notificação</ThemedText>
              <ThemedText style={[s.emptySub, { color: theme.textSecondary }]}>
                Mensagens do chat, avisos do app e notificações do servidor aparecerão aqui.
              </ThemedText>
            </View>
          ) : (
            groups.map(g => (
              <View key={g.label} style={s.group}>
                <ThemedText style={s.groupLabel}>{g.label.toUpperCase()}</ThemedText>
                {g.items.map(n => (
                  <NotifItem
                    key={n.id}
                    n={n}
                    onDelete={() => deleteNotification(n.id)}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  backBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backArrow: { fontSize: 26 },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  scroll: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },

  group: { gap: Spacing.two },
  groupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4' },

  item: {
    borderRadius: C.radius.md,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  itemLeft:  { flex: 1, flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  itemIcon:  { fontSize: 20, lineHeight: 26 },
  itemTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  itemBody:  { fontSize: 13, lineHeight: 18 },
  itemTime:  { fontSize: 11, color: '#9B97D4', marginTop: 2 },

  deleteBtn:     { paddingLeft: 4 },
  deleteBtnText: { fontSize: 13, color: '#9B97D4' },

  countBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  countBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', lineHeight: 12 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.two },
  emptyIcon:  { width: 72, height: 72, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
