-- ── Tabela principal de mensagens (expira em 5 min) ────────────────────────
create table if not exists public.community_messages (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  user_name  text        not null,
  content    text        not null check (char_length(content) between 1 and 200),
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '1 hour') not null
);

create index if not exists community_messages_expires_at_idx
  on public.community_messages (expires_at);

-- ── Log de auditoria: sem conteúdo, retido por 6 meses (Marco Civil) ────────
create table if not exists public.community_message_log (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  sent_at    timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '6 months') not null
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.community_messages     enable row level security;
alter table public.community_message_log  enable row level security;

-- Leitura: apenas mensagens ainda válidas, por usuários autenticados
create policy "authenticated can read messages"
  on public.community_messages for select
  to authenticated
  using (expires_at > now());

-- Inserção: apenas o próprio usuário
create policy "users can insert own messages"
  on public.community_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Deleção: apenas mensagens já expiradas (clientes limpam ao animar a saída)
create policy "delete expired messages"
  on public.community_messages for delete
  to authenticated
  using (expires_at <= now());

-- Log: apenas o próprio usuário insere
create policy "users can insert message log"
  on public.community_message_log for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.community_messages;
