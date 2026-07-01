import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAdminBadge(isAdmin: boolean | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) { setCount(0); return; }

    let cancelled = false;

    const fetch = async () => {
      const [{ count: c1 }, { count: c2 }] = await Promise.all([
        supabase.from('stop_contests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_messages').select('*', { count: 'exact', head: true }).eq('read', false),
      ]);
      if (!cancelled) setCount((c1 ?? 0) + (c2 ?? 0));
    };

    fetch();
    const id = setInterval(fetch, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin]);

  return count;
}
