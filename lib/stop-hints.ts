import { supabase } from './supabase';
import { StopCategory } from '@/constants/stop-categories';

export type HintMap = Record<string, string | null>;

export async function loadBankHints(letter: string, cats: StopCategory[]): Promise<HintMap> {
  const { data } = await supabase
    .from('stop_word_bank')
    .select('category, word')
    .eq('letter', letter.toUpperCase())
    .in('category', cats.map(c => c.key));

  const hints: HintMap = {};
  for (const cat of cats) {
    const words = (data ?? []).filter(r => r.category === cat.key).map(r => r.word as string);
    hints[cat.key] = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : null;
  }
  return hints;
}

export async function getAIHint(
  letter: string,
  categoryKey: string,
  categoryLabel: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('suggest-stop-word', {
      body: { letter, categoryKey, categoryLabel },
    });
    if (error || !data?.word) return null;
    return String(data.word).trim() || null;
  } catch {
    return null;
  }
}
