-- Adiciona campos de resposta às mensagens de suporte
alter table public.support_messages
  add column if not exists reply       text,
  add column if not exists replied_at  timestamptz,
  add column if not exists replied_by  uuid references public.profiles(id) on delete set null;

-- Permite admins verem e atualizarem todas as mensagens
create policy "admin all support messages"
  on public.support_messages for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
