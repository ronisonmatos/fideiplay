-- Geolocalização para filtragem de anúncios/banners. Execute no SQL Editor do Supabase.

-- Localização do usuário (perfil)
alter table public.profiles
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists latitude decimal(10, 8),
  add column if not exists longitude decimal(11, 8),
  add column if not exists localizacao_atualizada_em timestamptz;

-- Alcance geográfico do banner: 'nacional' (padrão) | 'estado' | 'cidade'
alter table public.banner_ads
  add column if not exists alcance text not null default 'nacional'
    check (alcance in ('nacional', 'estado', 'cidade')),
  add column if not exists estados text[] not null default '{}',
  add column if not exists cidades text[] not null default '{}';

create index if not exists idx_banner_ads_alcance on public.banner_ads (alcance);
create index if not exists idx_banner_ads_ativo   on public.banner_ads (ativo);
