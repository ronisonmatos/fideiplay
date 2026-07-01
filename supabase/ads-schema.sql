-- SantosPlay — Sistema de anúncios próprio
-- Execute no SQL Editor do Supabase

-- 1. Tabela de anúncios (conteúdo vem do Storage)
create table if not exists ads (
  id          uuid    primary key default gen_random_uuid(),
  title       text    not null,
  description text,
  media_url   text    not null,
  media_type  text    not null check (media_type in ('video', 'image')),
  thumb_url   text,
  cta_text    text    not null default 'Saiba Mais',
  cta_url     text,
  duration    int     not null default 15,
  skip_after  int     not null default 5,
  coins       int     not null default 15,
  weight      int     not null default 1,
  active      boolean not null default true,
  created_at  timestamptz default now()
);

alter table ads enable row level security;
create policy "ads_public_read" on ads for select using (active = true);

-- 2. Registro de visualizações (analytics + anti-fraude)
create table if not exists ad_views (
  id         uuid    primary key default gen_random_uuid(),
  ad_id      uuid    references ads(id) on delete set null,
  user_id    uuid    references profiles(id) on delete cascade,
  completed  boolean not null default false,
  created_at timestamptz default now()
);

alter table ad_views enable row level security;
create policy "ad_views_own" on ad_views for all using (user_id = auth.uid());

-- 3. Colunas de controle diário no perfil
alter table profiles
  add column if not exists ad_watches_today int  not null default 0,
  add column if not exists ad_watches_date  date;

-- 4. Função: valida limite diário, registra view, dá moedas
create or replace function claim_ad_reward(
  p_user_id uuid,
  p_ad_id   uuid default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_today         date := current_date;
  v_watches_today int;
  v_watches_date  date;
  v_new_coins     int;
  v_max_daily     int := 3;   -- ECONOMY.LIMITE_ANUNCIOS_DIA
  v_coins_per_ad  int := 15;  -- ECONOMY.ASSISTIR_ANUNCIO
begin
  if p_ad_id is not null then
    select coins into v_coins_per_ad from ads where id = p_ad_id;
    if not found then v_coins_per_ad := 15; end if;
  end if;

  select ad_watches_today, ad_watches_date
    into v_watches_today, v_watches_date
    from profiles where id = p_user_id;

  if v_watches_date is null or v_watches_date < v_today then
    v_watches_today := 0;
  end if;

  if v_watches_today >= v_max_daily then
    return jsonb_build_object(
      'ok', false, 'reason', 'limit_reached',
      'watched', v_watches_today, 'max', v_max_daily
    );
  end if;

  if p_ad_id is not null then
    insert into ad_views(ad_id, user_id, completed)
    values (p_ad_id, p_user_id, true);
  end if;

  update profiles
     set coins            = coins + v_coins_per_ad,
         ad_watches_today = v_watches_today + 1,
         ad_watches_date  = v_today
   where id = p_user_id
  returning coins into v_new_coins;

  return jsonb_build_object(
    'ok',           true,
    'coins_earned', v_coins_per_ad,
    'new_coins',    v_new_coins,
    'watched',      v_watches_today + 1,
    'remaining',    v_max_daily - (v_watches_today + 1)
  );
end;
$$;
