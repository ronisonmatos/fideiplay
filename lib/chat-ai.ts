import { supabase } from '@/lib/supabase';

export async function askChatAI(question: string): Promise<{ answer?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('chat-ai', { body: { question } });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    if (!data?.answer) return { error: 'empty_answer' };
    return { answer: String(data.answer) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown_error' };
  }
}
