import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ALL_LETTERS, ALL_STOP_CATEGORIES, StopCategory } from '@/constants/stop-categories';

/**
 * Loads stop categories from the `stop_categories` table in Supabase.
 * Falls back to the hardcoded ALL_STOP_CATEGORIES if the DB is unreachable or empty.
 * New categories can be added directly via the bank without a new app release.
 */
export function useStopCategories(): StopCategory[] {
  const [categories, setCategories] = useState<StopCategory[]>(ALL_STOP_CATEGORIES);

  useEffect(() => {
    supabase
      .from('stop_categories')
      .select('key, label, emoji, valid_letters')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(
            data.map(row => ({
              key:          row.key,
              label:        row.label,
              emoji:        row.emoji,
              validLetters: Array.isArray(row.valid_letters) ? row.valid_letters : ALL_LETTERS,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  return categories;
}
