import { supabase } from '@/lib/supabase';

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  scheduledAt: Date,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const { error } = await supabase.rpc('admin_send_notification', {
    p_user_id: userId, p_title: title, p_body: body, p_scheduled_at: scheduledAt.toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: 1 };
}

export async function broadcastNotification(
  title: string,
  body: string,
  scheduledAt: Date,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const { data, error } = await supabase.rpc('admin_broadcast_notification', {
    p_title: title, p_body: body, p_scheduled_at: scheduledAt.toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: data as number };
}

// Dispara o despacho na hora (fire-and-forget) — evita esperar o cron de 2min
// pra notificações "agora". O cron continua sendo a rede de segurança.
export function triggerDispatchNow(): void {
  supabase.functions.invoke('dispatch-notifications', {}).catch(() => {});
}
