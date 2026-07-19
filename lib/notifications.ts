import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export const NOTIF_CHANNEL      = 'santosplay';
export const NOTIF_CHANNEL_CHAT = 'santosplay_chat';

// Push notifications remotas foram removidas do Expo Go no Android (SDK 53+)
const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

// Como as notificações aparecem quando o app está aberto
if (!isExpoGoAndroid) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web' || isExpoGoAndroid) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Cria canais Android com sons customizados — chamar uma vez no startup
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android' || isExpoGoAndroid) return;
  await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL, {
    name: 'SantosPlay',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'church_bell.wav',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7C3AED',
  });
  await Notifications.setNotificationChannelAsync(NOTIF_CHANNEL_CHAT, {
    name: 'SantosPlay — Chat',
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
        data: { type: 'chat' },
      },
      trigger: Platform.OS === 'android'
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: NOTIF_CHANNEL_CHAT, repeats: false }
        : null,
    });
  } catch {}
}

// ── Lembrete diário de estudo ─────────────────────────────────────────────────

const DAILY_REMINDER_ID = 'daily-study-reminder';

// Um trigger DAILY do SO grava o conteúdo no momento em que é agendado — o
// mesmo título/corpo dispara todo dia até alguém reagendar. Por isso a
// variedade vem daqui: cada vez que scheduleDailyReminder() roda (abertura
// do app, onboarding de permissões), sorteamos uma mensagem e um horário
// novos dentro da janela da manhã, então usuários que abrem o app com
// alguma frequência veem mensagem/horário mudarem dia a dia.
const DAILY_REMINDER_MESSAGES: { title: string; body: string }[] = [
  { title: '📖 Hora de estudar!', body: 'Que tal aprofundar sua fé hoje? Uma lição por dia forma um católico sólido.' },
  { title: '✝️ Bom dia!', body: 'Comece o dia com uma lição — sua trilha espera por você.' },
  { title: '🕊️ A fé se cultiva todo dia', body: 'Volte ao SantosPlay e continue de onde parou na sua trilha.' },
  { title: '📿 Um minuto pela fé', body: 'Que tal um Quiz Católico rápido antes de começar o dia?' },
  { title: '⛪ Sua trilha te espera', body: 'Cada lição é um passo mais perto de conhecer melhor a fé católica.' },
  { title: '🌅 Comece bem o dia', body: 'Uma pequena lição de manhã fortalece toda a sua jornada de fé.' },
  { title: '🙏 Não perca sua sequência!', body: 'Continue estudando hoje e mantenha seu progresso na trilha.' },
  { title: '📖 Hora de crescer na fé', body: 'Volte pro SantosPlay e desafie seu conhecimento católico hoje.' },
];

// Janela de horário: entre 7h e 9h59, minuto qualquer — evita cair fora da manhã.
function randomMorningTime(): { hour: number; minute: number } {
  return {
    hour: 7 + Math.floor(Math.random() * 3),
    minute: Math.floor(Math.random() * 60),
  };
}

export async function scheduleDailyReminder() {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancela se já existe para não duplicar
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  const { title, body } = DAILY_REMINDER_MESSAGES[Math.floor(Math.random() * DAILY_REMINDER_MESSAGES.length)];
  const { hour, minute } = randomMorningTime();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title,
      body,
      sound: 'church_bell.wav',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
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
      body: 'Já faz 2 horas — volte ao SantosPlay para resgatar suas moedas.',
      sound: 'church_bell.wav',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: NOTIF_CHANNEL,
    },
  });
}

// ── Registro e salvamento do Expo Push Token ─────────────────────────────────

export async function registerAndSavePushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web' || isExpoGoAndroid) return;
  const granted = await requestNotificationPermission();
  if (!granted) return;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'a7cd055d-5cfe-4f9f-a8af-37bb94f0dc51',
    });
    if (token) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
    }
  } catch (err) {
    console.warn('[push] falha ao registrar token:', err);
  }
}

// ── Notificações agendadas pelo servidor (tabela `notifications`) ─────────────

export async function syncServerNotifications(
  userId: string,
  onInApp?: (title: string, body: string) => void,
) {
  const granted = await requestNotificationPermission();
  if (!granted) return;

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

    // Registra na tela in-app
    onInApp?.(notif.title, notif.body);

    // Marca como enviada no banco
    await supabase
      .from('notifications')
      .update({ sent: true })
      .eq('id', notif.id);
  }
}
