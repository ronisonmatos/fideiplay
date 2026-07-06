import { supabase } from './supabase';

export interface BannerAd {
  id:             string;
  anunciante:     string;
  titulo:         string;
  descricao:      string | null;
  link:           string | null;
  imagem_url:     string | null;
  tipo:           'comercial' | 'evento';
  data_evento:    string | null;
  local_evento:   string | null;
  periodo_inicio: string | null;
  periodo_fim:    string | null;
  alcance:        'nacional' | 'estado' | 'cidade';
  estados:        string[];
  cidades:        string[];
}

export interface LocalizacaoFiltro {
  estado: string | null;
  cidade: string | null;
}

export async function fetchActiveBannerAds(localizacao?: LocalizacaoFiltro): Promise<BannerAd[]> {
  try {
    const { data, error } = await supabase
      .from('banner_ads')
      .select('id, anunciante, titulo, descricao, link, imagem_url, tipo, data_evento, local_evento, periodo_inicio, periodo_fim, alcance, estados, cidades')
      .eq('ativo', true)
      .order('created_at', { ascending: true });
    if (error) return [];

    const hoje = new Date().toISOString().slice(0, 10);
    return (data ?? []).filter(ad => {
      // Fora do período de exibição (quando definido), o banner some mesmo com ativo = true
      const dentroPeriodo =
        (!ad.periodo_inicio || ad.periodo_inicio <= hoje) &&
        (!ad.periodo_fim || ad.periodo_fim >= hoje);
      if (!dentroPeriodo) return false;

      // Sem alcance definido (banners antigos) equivale a nacional
      if (!ad.alcance || ad.alcance === 'nacional') return true;
      if (ad.alcance === 'estado') return !!localizacao?.estado && ad.estados?.includes(localizacao.estado);
      if (ad.alcance === 'cidade') return !!localizacao?.cidade && ad.cidades?.includes(localizacao.cidade);
      return true;
    });
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

// Sugestão de descrição via IA (Claude) — devolve null se falhar
export async function suggestBannerDescription(input: {
  anunciante: string;
  titulo: string;
  descricaoAtual?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('suggest-banner-description', {
      body: input,
    });
    if (error) return null;
    return (data?.descricao as string | undefined) ?? null;
  } catch {
    return null;
  }
}
