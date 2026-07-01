import { Alert } from 'react-native';
import { supabase } from './supabase';
import { StopCategory } from '@/constants/stop-categories';

type AnswerMap = Partial<Record<string, string>>;

// valid      → found in word bank
// ai_valid   → not in bank, but Claude confirmed it's correct
// unverified → starts with letter; AI check pending or errored
// ai_invalid → starts with letter, but Claude says it doesn't fit the category
// invalid    → empty or wrong first letter
export type BankResult = 'valid' | 'ai_valid' | 'unverified' | 'ai_invalid' | 'invalid';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export async function validateWithBank(
  letter: string,
  answers: AnswerMap,
  cats: StopCategory[],
): Promise<Partial<Record<string, BankResult>>> {
  const catKeys = cats.map(c => c.key);
  if (catKeys.length === 0) return {};

  const { data } = await supabase
    .from('stop_word_bank')
    .select('category, word')
    .eq('letter', letter)
    .in('category', catKeys);

  const map: Partial<Record<string, BankResult>> = {};
  for (const cat of cats) {
    const ans = (answers[cat.key] ?? '').trim();
    if (!ans || ans[0].toUpperCase() !== letter) {
      map[cat.key] = 'invalid';
      continue;
    }
    const inBank =
      data?.some(
        row => row.category === cat.key && norm(row.word) === norm(ans),
      ) ?? false;
    map[cat.key] = inBank ? 'valid' : 'unverified';
  }
  return map;
}

// Calls the Supabase Edge Function which asks Claude Haiku to validate the answer.
// On success, saves the word to stop_word_bank using the client session (same as rooms/users).
// Returns true (ai_valid), false (ai_invalid), or null (error → keep as unverified).
export async function validateWithAI(
  letter: string,
  answer: string,
  categoryKey: string,
  categoryLabel: string,
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'validate-stop-answer',
      { body: { letter, answer, categoryKey, categoryLabel } },
    );
    if (error) {
      console.error('[StopBank] Erro na Edge Function:', JSON.stringify(error));
      return null;
    }
    if (data?.valid === null || data?.valid === undefined) {
      console.warn('[StopBank] Edge Function retornou valid=null/undefined. data:', JSON.stringify(data));
      return null;
    }
    const valid = Boolean(data.valid);
    console.log(`[StopBank] IA: "${answer}" (${categoryKey}/${letter}) → ${valid ? 'VÁLIDA ✅' : 'INVÁLIDA ❌'}`);

    if (valid && categoryKey !== 'padre') {
      const word = answer.trim();
      console.log(`[StopBank] Salvando no banco: categoria=${categoryKey} letra=${letter} palavra="${word}"`);
      const { error: insertError } = await supabase
        .from('stop_word_bank')
        .insert({ category: categoryKey, letter, word });
      if (!insertError) {
        console.log(`[StopBank] ✅ Salvo com sucesso: "${word}" em ${categoryKey}/${letter}`);
      } else if (insertError.code === '23505') {
        // unique_violation = palavra já existe no banco = OK
        console.log(`[StopBank] ℹ️ "${word}" já existe no banco (${categoryKey}/${letter}) — OK`);
      } else {
        console.error('[StopBank] ❌ ERRO ao salvar:', JSON.stringify(insertError));
        Alert.alert(
          'Debug: Erro ao salvar palavra',
          `categoria: ${categoryKey}\npalavra: "${word}"\n\nErro: ${insertError.message}\nCódigo: ${insertError.code}`,
        );
      }
    }

    return valid;
  } catch {
    return null;
  }
}
