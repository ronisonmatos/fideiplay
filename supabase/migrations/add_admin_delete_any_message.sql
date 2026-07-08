-- Permite que administradores excluam (soft delete) qualquer mensagem do
-- chat, não só as próprias, e registra quem excluiu — mesmo padrão de
-- snapshot já usado para user_name/avatar_emoji (evita depender de join
-- com profiles, que pode mudar de nome depois da exclusão).
-- Execute no SQL Editor do Supabase.

alter table public.community_messages
  add column if not exists deleted_by      uuid references auth.users(id),
  add column if not exists deleted_by_name text;

-- Admin pode marcar deleted_at/deleted_by em qualquer mensagem. A policy de
-- autor ("users can soft delete own messages") continua valendo separadamente
-- pra exclusão da própria mensagem.
create policy "admins can soft delete any message"
  on public.community_messages for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
