-- Remove a exclusão automática de mensagens do chat após 1h. Mensagens ficam
-- indefinidamente; só somem se o próprio autor excluir manualmente (soft
-- delete via deleted_at, já existente desde add_chat_avatar_and_soft_delete.sql).
-- Execute no SQL Editor do Supabase.

drop policy if exists "delete expired messages" on public.community_messages;

drop policy if exists "authenticated can read messages" on public.community_messages;
create policy "authenticated can read messages"
  on public.community_messages for select
  to authenticated
  using (deleted_at is null);

-- Trigger de proteção de conteúdo não precisa mais travar expires_at (coluna removida abaixo)
create or replace function public.protect_community_message_content()
returns trigger language plpgsql as $$
begin
  new.user_id      := old.user_id;
  new.user_name    := old.user_name;
  new.avatar_emoji := old.avatar_emoji;
  new.content      := old.content;
  new.created_at   := old.created_at;
  return new;
end;
$$;

drop index if exists community_messages_expires_at_idx;
alter table public.community_messages drop column if exists expires_at;
