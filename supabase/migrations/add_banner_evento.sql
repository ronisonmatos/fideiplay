-- Adiciona suporte a banners de "Evento" (retiros, missas, novenas) além do
-- banner comercial já existente. Execute no SQL Editor do Supabase.

alter table public.banner_ads
  add column if not exists tipo text not null default 'comercial'
    check (tipo in ('comercial', 'evento')),
  add column if not exists data_evento date,
  add column if not exists local_evento text;
