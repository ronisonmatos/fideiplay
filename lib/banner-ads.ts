import { supabase } from './supabase';

export interface BannerAd {
  id:         string;
  anunciante: string;
  titulo:     string;
  descricao:  string | null;
  link:       string | null;
  imagem_url: string | null;
}

export async function fetchActiveBannerAds(): Promise<BannerAd[]> {
  try {
    const { data, error } = await supabase
      .from('banner_ads')
      .select('id, anunciante, titulo, descricao, link, imagem_url')
      .eq('ativo', true)
      .order('created_at', { ascending: true });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchBannerAtivo(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'banner_ativo')
      .maybeSingle();
    if (error || !data) return true;
    return data.value !== 'false';
  } catch {
    return true;
  }
}

export async function registerBannerImpressao(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_banner_impressao', { p_id: id });
  } catch { /* best-effort */ }
}

export async function registerBannerClique(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_banner_clique', { p_id: id });
  } catch { /* best-effort */ }
}
