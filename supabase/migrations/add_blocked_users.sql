-- Permite que um usuário bloqueie outro no chat da Comunidade — mensagens de
-- quem foi bloqueado somem do feed só para quem bloqueou (filtro client-side,
-- não afeta o que outros usuários veem). Exigência da Apple (Guideline 1.2 —
-- User Generated Content) para apps com chat entre usuários.
-- Execute no SQL Editor do Supabase.

create table if not exists public.blocked_users (
  blocker_id uuid        not null references auth.users(id) on delete cascade,
  blocked_id uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_no_self check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "usuario gerencia proprios bloqueios"
  on public.blocked_users for all
  to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);
