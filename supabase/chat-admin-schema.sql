-- ── Campo is_admin no perfil ───────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ── Adiciona conteúdo ao log existente (community_message_log) ─────────────
alter table public.community_message_log
  add column if not exists user_name text,
  add column if not exists content   text;

-- Leitura do log: somente admins
create policy "admins read message log"
  on public.community_message_log for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ── Tornar um usuário admin (executar no dashboard) ─────────────────────────
-- update public.profiles set is_admin = true where id = '<uuid-do-admin>';
