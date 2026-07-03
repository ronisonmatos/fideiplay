-- Chat da comunidade: avatar do remetente (snapshot, mesmo padrão de user_name)
-- + exclusão "por quem enviou" (some da tela de todos, mas continua no banco).
alter table public.community_messages
  add column if not exists avatar_emoji text,
  add column if not exists deleted_at   timestamptz;

-- Leitura: além de não expirada, também não pode estar excluída
drop policy if exists "authenticated can read messages" on public.community_messages;
create policy "authenticated can read messages"
  on public.community_messages for select
  to authenticated
  using (expires_at > now() and deleted_at is null);

-- Exclusão (soft): só o autor, e só marca deleted_at — impedido de reescrever
-- o conteúdo já enviado (ver trigger abaixo).
create policy "users can soft delete own messages"
  on public.community_messages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.protect_community_message_content()
returns trigger language plpgsql as $$
begin
  new.user_id      := old.user_id;
  new.user_name    := old.user_name;
  new.avatar_emoji := old.avatar_emoji;
  new.content      := old.content;
  new.created_at   := old.created_at;
  new.expires_at   := old.expires_at;
  return new;
end;
$$;

drop trigger if exists trg_protect_community_message_content on public.community_messages;
create trigger trg_protect_community_message_content
  before update on public.community_messages
  for each row execute function public.protect_community_message_content();
