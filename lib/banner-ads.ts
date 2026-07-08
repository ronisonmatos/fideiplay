import { supabase } from './supabase';
import type { CategoriaEvento } from '@/constants/banner-config';

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
  categoria:      CategoriaEvento;
  // De onde veio o registro — decide qual RPC de impressão/clique chamar.
  origem:         'banner_ads' | 'evento_patrocinado';
}

export interface LocalizacaoFiltro {
  estado: string | null;
  cidade: string | null;
}

function dentroDoAlcance(
  row: { alcance: string | null; estados: string[] | null; cidades: string[] | null },
  localizacao?: LocalizacaoFiltro,
): boolean {
  // Sem alcance definido (banners antigos) equivale a nacional
  if (!row.alcance || row.alcance === 'nacional') return true;
  if (row.alcance === 'estado') return !!localizacao?.estado && !!row.estados?.includes(localizacao.estado);
  if (row.alcance === 'cidade') return !!localizacao?.cidade && !!row.cidades?.includes(localizacao.cidade);
  return true;
}

async function fetchActiveEventosPatrocinados(localizacao?: LocalizacaoFiltro): Promise<BannerAd[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('eventos_patrocinados')
    .select('id, titulo, descricao, imagem_url, link_externo, local_evento, data_inicio, exibicao_inicio, exibicao_fim, alcance, estados, cidades, categoria')
    .in('status', ['aprovado', 'ativo'])
    .lte('exibicao_inicio', hoje)
    .gte('exibicao_fim', hoje);
  if (error) return [];

  return (data ?? [])
    .filter(evento => dentroDoAlcance(evento, localizacao))
    .map(evento => ({
      id:             evento.id,
      anunciante:     evento.titulo,
      titulo:         evento.titulo,
      descricao:      evento.descricao,
      link:           evento.link_externo,
      imagem_url:     evento.imagem_url,
      tipo:           'evento' as const,
      data_evento:    evento.data_inicio,
      local_evento:   evento.local_evento,
      periodo_inicio: evento.exibicao_inicio,
      periodo_fim:    evento.exibicao_fim,
      alcance:        evento.alcance,
      estados:        evento.estados ?? [],
      cidades:        evento.cidades ?? [],
      categoria:      (evento.categoria ?? 'outro') as CategoriaEvento,
      origem:         'evento_patrocinado' as const,
    }));
}

export async function fetchActiveBannerAds(localizacao?: LocalizacaoFiltro): Promise<BannerAd[]> {
  try {
    const [{ data, error }, eventos] = await Promise.all([
      supabase
        .from('banner_ads')
        .select('id, anunciante, titulo, descricao, link, imagem_url, tipo, data_evento, local_evento, periodo_inicio, periodo_fim, alcance, estados, cidades, categoria')
        .eq('ativo', true)
        .order('created_at', { ascending: true }),
      fetchActiveEventosPatrocinados(localizacao),
    ]);
    if (error) return eventos;

    const hoje = new Date().toISOString().slice(0, 10);
    const banners: BannerAd[] = (data ?? [])
      .filter(ad => {
        // Fora do período de exibição (quando definido), o banner some mesmo com ativo = true
        const dentroPeriodo =
          (!ad.periodo_inicio || ad.periodo_inicio <= hoje) &&
          (!ad.periodo_fim || ad.periodo_fim >= hoje);
        return dentroPeriodo && dentroDoAlcance(ad, localizacao);
      })
      .map(ad => ({ ...ad, origem: 'banner_ads' as const }));

    return [...banners, ...eventos];
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

export async function registerBannerImpressao(id: string, origem: BannerAd['origem'] = 'banner_ads'): Promise<void> {
  try {
    const rpc = origem === 'evento_patrocinado' ? 'increment_evento_impressao' : 'increment_banner_impressao';
    await supabase.rpc(rpc, { p_id: id });
  } catch { /* best-effort */ }
}

export async function registerBannerClique(id: string, origem: BannerAd['origem'] = 'banner_ads'): Promise<void> {
  try {
    const rpc = origem === 'evento_patrocinado' ? 'increment_evento_clique' : 'increment_banner_clique';
    await supabase.rpc(rpc, { p_id: id });
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
