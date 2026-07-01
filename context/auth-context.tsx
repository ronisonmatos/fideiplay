import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { getAvatarUrl, isSaintAvatar } from '@/constants/avatares';

export interface Profile {
  id:                string;
  name:              string;
  avatar_emoji:      string;
  total_score:       number;
  coins:             number;
  last_coin_reward:  string | null;
  ad_watches_today:  number | null;
  ad_watches_date:   string | null;
  is_admin:          boolean;
  birth_date:        string | null;
  accepted_terms_at: string | null;
}

interface AuthCtx {
  session:  Session | null;
  user:     User    | null;
  profile:  Profile | null;
  loading:  boolean;
  isGuest:  boolean;
  setGuest: (v: boolean) => void;
  signUp:   (email: string, password: string, name: string, avatar: string, birthDate: string) => Promise<string | null>;
  signIn:   (email: string, password: string) => Promise<string | null>;
  signOut:  () => Promise<void>;
  refreshProfile: () => Promise<void>;
  trilhasDesbloqueadas: number[];
  refreshTrilhas: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

// A rede às vezes ainda não está pronta no exato momento em que o app volta
// do background (ou logo após uma atualização). Sem retry, uma falha nesse
// instante zera o profile/trilhas e o usuário fica com sessão válida mas
// sem dados até fechar e reabrir o app.
async function fetchWithRetry<T>(
  label: string,
  query: () => PromiseLike<{ data: T | null; error: unknown }>,
  attempts = 3,
): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await query();
    if (!error && data != null) return data;
    if (error) console.warn(`[auth] ${label} falhou (tentativa ${i + 1}/${attempts}):`, error);
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isGuest, setGuest]     = useState(false);
  const [trilhasDesbloqueadas, setTrilhasDesbloqueadas] = useState<number[]>([]);

  // Reset guest mode when user authenticates
  useEffect(() => { if (session) setGuest(false); }, [session]);

  const loadProfile = useCallback(async (userId: string) => {
    const data = await fetchWithRetry<Profile>('loadProfile', () =>
      supabase.from('profiles').select('*').eq('id', userId).single(),
    );
    // Em falha após os retries, mantém o profile anterior em vez de zerar
    // (evita a tela "logado sem dados" — só atualiza quando há dado novo).
    if (!data) return;
    setProfile(data);
    if (isSaintAvatar(data.avatar_emoji)) {
      ExpoImage.prefetch(getAvatarUrl(data.avatar_emoji));
    }
  }, []);

  const loadTrilhas = useCallback(async (userId: string) => {
    const data = await fetchWithRetry<{ trilha_id: number | string }[]>('loadTrilhas', () =>
      supabase.from('user_trilhas').select('trilha_id').eq('user_id', userId),
    );
    if (!data) return;
    setTrilhasDesbloqueadas(data.map(r => Number(r.trilha_id)));
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
        // Não chama setLoading(false) aqui: o getSession() abaixo é quem controla
        // o estado de carregamento inicial. Se chamar aqui, pode disparar antes do
        // getSession() resolver e mostrar a tela de login mesmo com sessão válida.
      }
    });

    // Quando o app volta do background, reinicia o auto-refresh do token.
    // Sem isso, o JWT expira enquanto o app está parado e queries falham com 401.
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
        // Força re-leitura da sessão para garantir token válido em memória
        const { data: { session: current } } = await supabase.auth.getSession();
        if (current?.user.id) {
          setSession(current);
          loadProfile(current.user.id).catch(() => {});
        }
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, [loadProfile, loadTrilhas]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    name: string,
    avatar: string,
    birthDate: string,
  ): Promise<string | null> => {
    const acceptedTermsAt = new Date().toISOString();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, avatar, birth_date: birthDate, accepted_terms_at: acceptedTermsAt } },
    });
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([
      '@santosplay:game_store',
      '@santosplay:trilhas_progresso',
    ]).catch(() => {});
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
