-- Tabela de avatares dos Santos disponíveis no app
create table if not exists avatares_santos (
  id         serial primary key,
  filename   text not null unique,
  nome       text not null,
  ativo      boolean not null default true,
  created_at timestamptz default now()
);

-- RLS: leitura pública, apenas service_role pode escrever
alter table avatares_santos enable row level security;
create policy "Avatares visíveis para todos" on avatares_santos for select using (true);

-- Seed com os avatares disponíveis
insert into avatares_santos (filename, nome) values
  ('Nossa_Senhora.png',               'Nossa Senhora'),
  ('Santa_Madre_Tereza_Caucutar.png', 'Madre Teresa de Calcutá'),
  ('Santa_Terezinha.png',             'Santa Terezinha'),
  ('Sao_Bento.png',                   'São Bento'),
  ('Sao_FrassiscoAssis.png',          'São Francisco de Assis'),
  ('Sao_Joao_Batista.png',            'São João Batista'),
  ('Sao_Jose.png',                    'São José'),
  ('Sao_Joao_Paulo.png',              'São João Paulo II'),
  ('Sao_Carlos_A.png',                'São Carlos'),
  ('Joana_Darc.png',                  'Joana D''Arc')
on conflict (filename) do update set nome = excluded.nome;
