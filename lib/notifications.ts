import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export const NOTIF_CHANNEL      = 'fideiplay';
export const NOTIF_CHANNEL_CHAT = 'fideiplay_chat';

// Como as notificações aparecem quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Cria canais Android com sons customizados — chamar uma vez no startup
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL, {
    name: 'FideiPlay',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'church_bell.wav',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
  });
  await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL_CHAT, {
    name: 'FideiPlay — Chat',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'chat_beep.wav',
  });
}

// Dispara notificação no SO com o church bell (sistema, conquistas, bônus)
export async function sendOSNotification(title: string, body: string): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'church_bell.wav',
      },
      trigger: Platform.OS === 'android'
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: NOTIF_CHANNEL, repeats: false }
        : null,
    });
  } catch {}
}

// Dispara notificação no SO com o beep (chat)
export async function sendChatOSNotification(title: string, body: string): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'chat_beep.wav',
      },
      trigger: Platform.OS === 'android'
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: NOTIF_CHANNEL_CHAT, repeats: false }
        : null,
    });
  } catch {}
}

// ── Lembrete diário de estudo ─────────────────────────────────────────────────

const DAILY_REMINDER_ID = 'daily-study-reminder';

export async function scheduleDailyReminder() {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancela se já existe para não duplicar
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: '📖 Hora de estudar!',
      body: 'Que tal aprofundar sua fé hoje? Uma lição por dia forma um católico sólido.',
      sound: 'church_bell.wav',
      android: { largeIcon: require('../assets/images/logo_SantosPlay.png'), channelId: NOTIF_CHANNEL },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
      channelId: NOTIF_CHANNEL,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
}

// ── Lembrete de bônus de moedas (2h após resgatar) ───────────────────────────

const COIN_BONUS_ID = 'coin-bonus-reminder';

export async function scheduleCoinBonusReminder() {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.cancelScheduledNotificationAsync(COIN_BONUS_ID).catch(() => {});

  // Dispara daqui a 2 horas
  const triggerDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await Notifications.scheduleNotificationAsync({
    identifier: COIN_BONUS_ID,
    content: {
      title: '🪙 Seu bônus está disponível!',
      body: 'Já faz 2 horas — volte ao FideiPlay para resgatar suas moedas.',
      sound: 'church_bell.wav',
      android: { largeIcon: require('../assets/images/logo_SantosPlay.png'), channelId: NOTIF_CHANNEL },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: NOTIF_CHANNEL,
    },
  });
}

// ── Notificações agendadas pelo servidor (tabela `notifications`) ─────────────

export async function syncServerNotifications(userId: string) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const now = new Date().toISOString();

  // Busca notificações não enviadas agendadas até 24h no futuro
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, scheduled_at')
    .eq('user_id', userId)
    .eq('sent', false)
    .lte('scheduled_at', future)
    .order('scheduled_at', { ascending: true });

  if (error || !data?.length) return;

  for (const notif of data) {
    const scheduledAt = new Date(notif.scheduled_at);
    const isInPast = scheduledAt.getTime() <= Date.now() + 5000; // 5s de tolerância

    await Notifications.scheduleNotificationAsync({
      identifier: `server-${notif.id}`,
      content: {
        title: notif.title,
        body: notif.body,
        sound: 'church_bell.wav',
      },
      trigger: isInPast
        ? Platform.OS === 'android'
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: NOTIF_CHANNEL, repeats: false }
          : null
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledAt,
            channelId: NOTIF_CHANNEL,
          },
    });

    // Marca como enviada no banco
    await supabase
      .from('notifications')
      .update({ sent: true })
      .eq('id', notif.id);
  }
}
