-- Sistema de convite de amigos. Execute no SQL Editor do Supabase.

create table if not exists public.convites (
  id uuid default gen_random_uuid() primary key,
  codigo text unique not null,
  convidante_id uuid references auth.users not null,
  convidado_id uuid references auth.users,
  status text not null default 'pendente' check (status in ('pendente', 'convertido')),
  criado_em timestamptz default now(),
  convertido_em timestamptz
);

alter table public.convites enable row level security;

-- Além dos próprios, também precisa enxergar um convite pendente e ainda não
-- reivindicado por código — é a primeira consulta que aplicarConvite() faz,
-- antes do convidado ainda constar na linha (sem isso, RLS bloqueia e o fluxo
-- de aceitar convite nunca funciona pra ninguém além de quem criou o convite).
drop policy if exists "usuario_ve_proprios_convites" on public.convites;
create policy "usuario_ve_proprios_convites" on public.convites
  for select using (
    auth.uid() = convidante_id
    or auth.uid() = convidado_id
    or (status = 'pendente' and convidado_id is null)
  );

drop policy if exists "usuario_cria_proprio_convite" on public.convites;
create policy "usuario_cria_proprio_convite" on public.convites
  for insert with check (auth.uid() = convidante_id);

-- Só permite marcar conversão em convite ainda não reivindicado (pendente e sem
-- convidado_id), e só o próprio convidado pode se atribuir a esse convite —
-- nunca revertido, nunca atribuído a terceiros.
drop policy if exists "convidado_marca_conversao" on public.convites;
create policy "convidado_marca_conversao" on public.convites
  for update using (
    (convidado_id is null and status = 'pendente') or auth.uid() = convidado_id
  )
  with check (auth.uid() = convidado_id and status = 'convertido');

-- RLS sozinho não impede um UPDATE malicioso de reescrever convidante_id/codigo
-- (a policy acima só restringe QUAIS linhas e o formato final de convidado_id/status)
-- — trava esses campos via trigger, independente do que o cliente tentar enviar.
create or replace function public.protect_convite_immutable_fields()
returns trigger language plpgsql security definer as $$
begin
  new.codigo        := old.codigo;
  new.convidante_id := old.convidante_id;
  new.criado_em      := old.criado_em;
  return new;
end;
$$;

drop trigger if exists trg_protect_convite_immutable on public.convites;
create trigger trg_protect_convite_immutable
  before update on public.convites
  for each row execute function public.protect_convite_immutable_fields();

create index if not exists idx_convites_convidante on public.convites(convidante_id);
create index if not exists idx_convites_codigo on public.convites(codigo);

-- Impede que o próprio convidante se autoconceda o bônus de "convidado" chamando
-- a RPC direto (contornando a checagem que hoje só existe no app, em lib/convites.ts).
alter table public.convites
  add constraint convites_nao_pode_ser_o_proprio_convidante
  check (convidado_id is null or convidado_id <> convidante_id);

-- Trava ECONOMY.LIMITE_CONVITES (=10) no servidor — a checagem de lib/convites.ts
-- é só uma consulta de contagem no app antes do insert, então sem isso dava pra
-- criar convites ilimitados chamando a API direto.
create or replace function public.enforce_limite_convites()
returns trigger language plpgsql security definer as $$
declare
  total int;
begin
  select count(*) into total from public.convites where convidante_id = new.convidante_id;
  if total >= 10 then
    raise exception 'limite_convites_atingido';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limite_convites on public.convites;
create trigger trg_limite_convites
  before insert on public.convites
  for each row execute function public.enforce_limite_convites();
