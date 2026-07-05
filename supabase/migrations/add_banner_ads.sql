-- Banner de anúncios no feed (distinto do sistema de vídeo recompensado em ads/ad_views)
-- Execute no SQL Editor do Supabase

create table if not exists public.banner_ads (
  id          uuid    primary key default gen_random_uuid(),
  anunciante  text    not null,
  titulo      text    not null,
  descricao   text,
  link        text,
  imagem_url  text,
  ativo       boolean not null default true,
  impressoes  int     not null default 0,
  cliques     int     not null default 0,
  created_at  timestamptz default now()
);

alter table public.banner_ads enable row level security;

create policy "banner_ads_public_read" on public.banner_ads
  for select using (ativo = true);

create policy "banner_ads_admin_all" on public.banner_ads
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Contadores atômicos (evita race condition de leitura+escrita pelo cliente)
create or replace function increment_banner_impressao(p_id uuid)
returns void language sql security definer as $$
  update public.banner_ads set impressoes = impressoes + 1 where id = p_id;
$$;

create or replace function increment_banner_clique(p_id uuid)
returns void language sql security definer as $$
  update public.banner_ads set cliques = cliques + 1 where id = p_id;
$$;

-- Liga/desliga o banner para todos os usuários (reaproveita a tabela pública app_config)
insert into public.app_config (key, value) values ('banner_ativo', 'true')
on conflict (key) do nothing;

-- app_config só tinha policy de leitura pública; admin precisa poder escrever
drop policy if exists "admin_escreve_config" on public.app_config;
create policy "admin_escreve_config" on public.app_config
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
