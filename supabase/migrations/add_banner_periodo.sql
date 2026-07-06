-- Período de exibição do banner de evento (fora dessa janela, o banner some do feed
-- mesmo com ativo = true). Execute no SQL Editor do Supabase.

alter table public.banner_ads
  add column if not exists periodo_inicio date,
  add column if not exists periodo_fim date;
