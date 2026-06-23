import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

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
      sound: true,
      android: { largeIcon: require('../assets/images/logo_SantosPlay.png') },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
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
      sound: true,
      android: { largeIcon: require('../assets/images/logo_SantosPlay.png') },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
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
        sound: true,
      },
      trigger: isInPast
        ? null // dispara imediatamente
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduledAt,
          },
    });

    // Marca como enviada no banco
    await supabase
      .from('notifications')
      .update({ sent: true })
      .eq('id', notif.id);
  }
}
