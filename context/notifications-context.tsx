import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { playSystemSound } from '@/lib/chat-sound';

const STORAGE_KEY    = '@fideiplay:notifications';
const MUTE_KEY       = '@fideiplay:mutechat';
const READ_EXPIRE_MS = 24 * 60 * 60 * 1000;
const CHAT_NOTIF_ID  = 'community_chat';

export interface AppNotification {
  id: string;
  type: 'chat_message' | 'system';
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  count?: number;
}

interface NotificationsCtx {
  notifications: AppNotification[];
  unreadCount: number;
  muteChat: boolean;
  setMuteChat: (v: boolean) => void;
  addChatNotification: (senderName: string, preview: string) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'readAt'>) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const Ctx = createContext<NotificationsCtx>({
  notifications: [],
  unreadCount: 0,
  muteChat: false,
  setMuteChat: () => {},
  addChatNotification: () => {},
  addNotification: () => {},
  markAllRead: () => {},
  deleteNotification: () => {},
  clearAll: () => {},
});

function purgeExpired(list: AppNotification[]): AppNotification[] {
  const now = Date.now();
  return list.filter(n => {
    if (!n.readAt) return true;
    return now - new Date(n.readAt).getTime() < READ_EXPIRE_MS;
  });
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [muteChat, setMuteChatState]      = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try { setNotifications(purgeExpired(JSON.parse(raw) as AppNotification[])); } catch {}
    });
    AsyncStorage.getItem(MUTE_KEY).then(v => {
      if (v === 'true') setMuteChatState(true);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(() => {});
  }, [notifications]);

  const setMuteChat = useCallback((v: boolean) => {
    setMuteChatState(v);
    AsyncStorage.setItem(MUTE_KEY, v ? 'true' : 'false').catch(() => {});
  }, []);

  // Grouped chat notification — creates or updates a single item with a count
  const addChatNotification = useCallback((senderName: string, preview: string) => {
    const now     = new Date().toISOString();
    const excerpt = preview.length > 70 ? preview.slice(0, 70) + '…' : preview;
    setNotifications(prev => {
      const idx = prev.findIndex(n => n.id === CHAT_NOTIF_ID && !n.readAt);
      if (idx >= 0) {
        const existing  = prev[idx];
        const newCount  = (existing.count ?? 1) + 1;
        const updated: AppNotification = {
          ...existing,
          title:     `${newCount} novas mensagens`,
          body:      `Última de ${senderName}: ${excerpt}`,
          createdAt: now,
          count:     newCount,
        };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      }
      const newN: AppNotification = {
        id:        CHAT_NOTIF_ID,
        type:      'chat_message',
        title:     senderName,
        body:      excerpt,
        createdAt: now,
        readAt:    null,
        count:     1,
      };
      return purgeExpired([newN, ...prev]).slice(0, 50);
    });
  }, []);

  // Generic notification (achievements, bonuses, system alerts)
  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'readAt'>) => {
    const newN: AppNotification = {
      ...n,
      id:     `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      readAt: null,
    };
    setNotifications(prev => purgeExpired([newN, ...prev]).slice(0, 50));
    playSystemSound().catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => (n.readAt ? n : { ...n, readAt: now })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  // Count uses the 'count' field so grouped notifications contribute their real count
  const unreadCount = notifications
    .filter(n => !n.readAt)
    .reduce((sum, n) => sum + (n.count ?? 1), 0);

  return (
    <Ctx.Provider value={{
      notifications, unreadCount,
      muteChat, setMuteChat,
      addChatNotification, addNotification,
      markAllRead, deleteNotification, clearAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
