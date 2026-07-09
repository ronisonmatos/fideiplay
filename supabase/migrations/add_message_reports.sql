-- Denúncia de mensagens do chat da Comunidade — exigência da Apple
-- (Guideline 1.2) para apps com chat entre usuários. `reported_content` é um
-- snapshot do texto no momento da denúncia: se o autor excluir a própria
-- mensagem depois, a denúncia continua auditável (message_id vira null, mas
-- o texto denunciado sobrevive).
-- Execute no SQL Editor do Supabase.

create table if not exists public.message_reports (
  id                 uuid        primary key default gen_random_uuid(),
  message_id         uuid        references public.community_messages(id) on delete set null,
  reported_content   text        not null,
  reporter_id        uuid        not null references auth.users(id) on delete cascade,
  reporter_name      text        not null,
  reported_user_id   uuid        not null references auth.users(id) on delete cascade,
  reported_user_name text        not null,
  status             text        not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at         timestamptz not null default now(),
  reviewed_at        timestamptz,
  reviewed_by        uuid        references auth.users(id)
);

create index if not exists idx_message_reports_status on public.message_reports (status);

-- Evita o mesmo usuário denunciar a mesma mensagem mais de uma vez.
create unique index if not exists idx_message_reports_unique
  on public.message_reports (message_id, reporter_id)
  where message_id is not null;

alter table public.message_reports enable row level security;

create policy "usuario cria denuncia propria"
  on public.message_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "usuario ve suas denuncias"
  on public.message_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

create policy "admin ve todas denuncias"
  on public.message_reports for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "admin atualiza denuncias"
  on public.message_reports for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
