-- FideiPlay — Perfis de usuário
-- Execute no SQL Editor do Supabase APÓS criar o projeto

-- 1. Tabela de perfis (vinculada ao Supabase Auth)
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  avatar_emoji text not null default '🙏',
  total_score  int  not null default 0,
  created_at   timestamptz default now()
);

-- 2. RLS
alter table profiles enable row level security;
create policy "Perfis públicos"        on profiles for select using (true);
create policy "Usuário edita o próprio" on profiles for update using (auth.uid() = id);
create policy "Usuário insere o próprio" on profiles for insert with check (auth.uid() = id);

-- 3. Cria perfil automaticamente ao cadastrar
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_emoji)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Jogador'),
    coalesce(new.raw_user_meta_data->>'avatar', '🙏')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- IMPORTANTE: No painel do Supabase vá em
-- Authentication → Settings → desmarque "Enable email confirmations"
-- para não exigir confirmação de e-mail.
