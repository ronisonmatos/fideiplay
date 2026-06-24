-- ── Tabela de mensagens de suporte ──────────────────────────────────────────
create table if not exists public.support_messages (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete set null,
  email      text,
  message    text        not null check (char_length(message) between 1 and 500),
  created_at timestamptz default now() not null,
  read       boolean     default false not null
);

alter table public.support_messages enable row level security;

-- Apenas o próprio usuário pode inserir
create policy "users can insert support messages"
  on public.support_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Usuários não autenticados (guests) também podem inserir sem user_id
create policy "anon can insert support messages"
  on public.support_messages for insert
  to anon
  with check (user_id is null);

-- ── Tabela de feedback de lições (estrelas) ──────────────────────────────────
create table if not exists public.licao_feedback (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete set null,
  trilha_id  integer     not null,
  licao_id   integer     not null,
  stars      smallint    not null check (stars between 1 and 5),
  created_at timestamptz default now() not null
);

alter table public.licao_feedback enable row level security;

create policy "users can insert licao feedback"
  on public.licao_feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "anon can insert licao feedback"
  on public.licao_feedback for insert
  to anon
  with check (user_id is null);
