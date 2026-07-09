-- Filtro básico de palavras ofensivas no chat da Comunidade — exigência da
-- Apple (Guideline 1.2) para apps com chat entre usuários. A lista fica numa
-- tabela (não hardcoded no client) para o admin expandir via SQL Editor sem
-- precisar de novo deploy do app. Este trigger é a fonte de verdade — o
-- filtro client-side (lib/chat-filtro.ts) só existe para dar feedback
-- imediato antes do round-trip; se as duas listas ficarem dessincronizadas,
-- o pior caso é uma mensagem barrada pelo banco sem aviso prévio no client
-- (degradação de UX, não um risco de segurança).
-- Execute no SQL Editor do Supabase.

create extension if not exists unaccent;

create table if not exists public.chat_banned_words (
  word text primary key
);

insert into public.chat_banned_words (word) values
  ('idiota'), ('burro'), ('imbecil'), ('estupido')
on conflict do nothing;

alter table public.chat_banned_words enable row level security;

create policy "leitura publica banned words"
  on public.chat_banned_words for select
  using (true);

create or replace function public.check_chat_banned_words()
returns trigger
language plpgsql
as $$
declare
  v_normalized text;
  v_word       text;
begin
  -- remove acentos, normaliza caixa e colapsa repetição de letras
  -- ("idiotaaaa" -> "idiotaa") pra dificultar contorno trivial do filtro.
  v_normalized := regexp_replace(lower(unaccent(new.content)), '(.)\1{2,}', '\1\1', 'g');

  for v_word in select word from public.chat_banned_words loop
    if position(v_word in v_normalized) > 0 then
      raise exception 'Mensagem contém termo não permitido' using errcode = 'P0001';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_check_chat_banned_words on public.community_messages;
create trigger trg_check_chat_banned_words
  before insert on public.community_messages
  for each row execute function public.check_chat_banned_words();
