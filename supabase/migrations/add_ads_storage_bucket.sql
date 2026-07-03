-- Bucket público para os arquivos de mídia dos anúncios (upload feito pela tela admin).
insert into storage.buckets (id, name, public)
values ('ads', 'ads', true)
on conflict (id) do nothing;

-- Leitura pública (o app exibe os anúncios para qualquer usuário)
drop policy if exists "ads bucket public read" on storage.objects;
create policy "ads bucket public read"
  on storage.objects for select
  using (bucket_id = 'ads');

-- Escrita (upload/edição/exclusão do arquivo) só para admins
drop policy if exists "ads bucket admin write" on storage.objects;
create policy "ads bucket admin write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ads'
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "ads bucket admin update" on storage.objects;
create policy "ads bucket admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ads'
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "ads bucket admin delete" on storage.objects;
create policy "ads bucket admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ads'
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
