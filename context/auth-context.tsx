import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id:               string;
  name:             string;
  avatar_emoji:     string;
  total_score:      number;
  coins:            number;
  last_coin_reward: string | null;
}

interface AuthCtx {
  session:  Session | null;
  user:     User    | null;
  profile:  Profile | null;
  loading:  boolean;
  isGuest:  boolean;
  setGuest: (v: boolean) => void;
  signUp:   (email: string, password: string, name: string, avatar: string) => Promise<string | null>;
  signIn:   (email: string, password: string) => Promise<string | null>;
  signOut:  () => Promise<void>;
  refreshProfile: () => Promise<void>;
  trilhasDesbloqueadas: number[];
  refreshTrilhas: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isGuest, setGuest]     = useState(false);
  const [trilhasDesbloqueadas, setTrilhasDesbloqueadas] = useState<number[]>([]);

  // Reset guest mode when user authenticates
  useEffect(() => { if (session) setGuest(false); }, [session]);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data ?? null);
  }, []);

  const loadTrilhas = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_trilhas')
      .select('trilha_id')
      .eq('user_id', userId);
    if (error) {
      console.warn('[loadTrilhas] erro:', error.message, error.code);
    }
    console.log('[loadTrilhas] data:', JSON.stringify(data));
    setTrilhasDesbloqueadas(data?.map(r => Number(r.trilha_id)) ?? []);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const refreshTrilhas = useCallback(async () => {
    if (session?.user.id) await loadTrilhas(session.user.id);
  }, [session, loadTrilhas]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        await loadProfile(s.user.id);
        await loadTrilhas(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s) {
        await loadProfile(s.user.id);
        await loadTrilhas(s.user.id);
      } else {
        setProfile(null);
        setTrilhasDesbloqueadas([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, loadTrilhas]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    avatar: string,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, avatar } },
    });
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, loading, isGuest, setGuest, signUp, signIn, signOut, refreshProfile, trilhasDesbloqueadas, refreshTrilhas }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
