-- Admin: cadastro/edição/exclusão e período de exibição (agendamento) dos anúncios.

alter table ads
  add column if not exists start_date timestamptz,
  add column if not exists end_date   timestamptz;

-- Leitura pública: além de ativo, precisa estar dentro do período (quando definido)
drop policy if exists "ads_public_read" on ads;
create policy "ads_public_read" on ads for select using (
  active = true
  and (start_date is null or start_date <= now())
  and (end_date   is null or end_date   >= now())
);

-- Admin: acesso total (lista todos, inclusive fora do período/desativados; cria; edita; exclui)
create policy "admin all ads"
  on ads for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
