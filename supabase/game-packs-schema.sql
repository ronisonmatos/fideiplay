-- SantosPlay — Sistema de packs de conteúdo para jogos
-- Execute no SQL Editor do Supabase

-- 1. Tabela principal de packs
create table if not exists game_packs (
  id          uuid    primary key default gen_random_uuid(),
  game_type   text    not null, -- 'quiz' | 'versiculo' | 'peregrinacao' | 'palavras' | 'liturgico' | 'stop'
  titulo      text    not null,
  descricao   text,
  categoria   text,             -- ex: 'santos', 'biblia', 'liturgia', 'maria'
  visivel     boolean not null default true,
  gratuito    boolean not null default true,
  coins_price int     not null default 0,
  conteudo    jsonb   not null,  -- estrutura varia por game_type (ver abaixo)
  ativo       boolean not null default true,
  ordem       int     not null default 0,
  created_at  timestamptz default now()
);

-- conteudo por game_type:
--
-- quiz:
--   { "perguntas": [{ "topic": "...", "question": "...", "options": ["A","B","C","D"], "correct": 0, "difficulty": "facil|medio|dificil" }] }
--
-- versiculo:
--   { "frases": [{ "words": ["Palavra", "..."], "reference": "Jo 3,16", "options": ["A","B","C","D"], "type": "versículo|santo|papa|documento", "difficulty": "facil|medio|dificil" }] }
--
-- peregrinacao:
--   { "santuarios": [{ "emoji": "🇧🇷", "name": "...", "country": "...", "description": "...", "questions": [{ "question": "...", "options": ["A","B","C","D"], "correct": 0 }] }] }
--
-- palavras:
--   { "temas": [{ "title": "...", "subtitle": "...", "words": ["PALAVRA1", "PALAVRA2"], "difficulty": "facil|medio|dificil", "gridSize": 8 }] }
--
-- liturgico:
--   { "perguntas": [{ "question": "...", "options": ["A","B","C","D"], "correct": 0, "hint": "...", "difficulty": "facil|medio|dificil" }] }
--
-- stop:
--   { "categorias": [{ "key": "chave_unica", "label": "Nome da Categoria", "icon": "✝️", "description": "..." }] }

alter table game_packs enable row level security;

create policy "game_packs_public_read" on game_packs
  for select using (ativo = true and visivel = true);

-- Admin pode gerenciar via service role (sem policy adicional necessário)

-- 2. Tabela de packs comprados por usuário
create table if not exists user_game_packs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references profiles(id) on delete cascade,
  pack_id   uuid not null references game_packs(id) on delete cascade,
  origem    text not null default 'coins', -- 'coins' | 'purchase' | 'gift' | 'admin'
  criado_em timestamptz default now(),
  unique(user_id, pack_id)
);

alter table user_game_packs enable row level security;

create policy "user_game_packs_own" on user_game_packs
  for all using (user_id = auth.uid());

-- 3. Função: comprar pack com moedas (atômica)
create or replace function buy_game_pack(p_pack_id uuid)
returns text language plpgsql security definer as $$
declare
  v_user_id    uuid := auth.uid();
  v_price      int;
  v_purchasable boolean;
  v_coins      int;
begin
  if v_user_id is null then
    return 'not_authenticated';
  end if;

  select coins_price, gratuito into v_price, v_purchasable
    from game_packs where id = p_pack_id and ativo = true;

  if not found then return 'not_available'; end if;
  if v_purchasable then return 'not_available'; end if; -- gratuito, não precisa comprar

  if exists (select 1 from user_game_packs where user_id = v_user_id and pack_id = p_pack_id) then
    return 'already_owned';
  end if;

  select coins into v_coins from profiles where id = v_user_id;
  if v_coins < v_price then return 'insufficient_coins'; end if;

  update profiles set coins = coins - v_price where id = v_user_id;
  insert into user_game_packs(user_id, pack_id, origem) values (v_user_id, p_pack_id, 'coins');

  return 'success';
end;
$$;

-- 4. Índices para performance
create index if not exists idx_game_packs_type  on game_packs(game_type) where ativo = true;
create index if not exists idx_user_game_packs  on user_game_packs(user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- EXEMPLOS DE INSERÇÃO — copie, adapte e execute para cada novo pack
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- CAMPOS COMUNS:
--   game_type   → qual jogo recebe o conteúdo
--   titulo      → nome do pack (útil para organização no banco)
--   categoria   → rótulo livre: 'santos', 'biblia', 'liturgia', 'maria', etc.
--   gratuito    → true = disponível para todos / false = requer compra com moedas
--   coins_price → preço em moedas (só importa se gratuito = false)
--   ativo       → true = ativo / false = desativado sem deletar
--   visivel     → false = oculto da query (use para rascunhos)
--   ordem       → ordem de carregamento (menor número = carregado primeiro)
--
-- NOTA SOBRE ASPAS: o conteúdo usa $json$...$json$ (dollar-quoting) em vez de
--   aspas simples, então apóstrofos e outros caracteres especiais não precisam
--   de escape — escreva o texto normalmente.
--
-- GERENCIAMENTO:
--   Desativar:   UPDATE game_packs SET ativo      = false WHERE id = '<uuid>';
--   Ocultar:     UPDATE game_packs SET visivel     = false WHERE id = '<uuid>';
--   Tornar pago: UPDATE game_packs SET gratuito    = false,
--                                     coins_price  = 300   WHERE id = '<uuid>';
--   Consultar:   SELECT id, game_type, titulo, gratuito, coins_price, ativo
--                  FROM game_packs ORDER BY game_type, ordem;
-- ═══════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────
-- 1. QUIZ DOS SANTOS
-- ───────────────────────────────────────────────────────────────────────────────
-- conteudo.perguntas[]:
--   topic      → tema exibido como tag acima da pergunta
--   question   → texto da pergunta
--   options    → array com EXATAMENTE 4 opções de resposta
--   correct    → índice da opção correta (0, 1, 2 ou 3)
--   difficulty → facil | medio | dificil
-- ───────────────────────────────────────────────────────────────────────────────

-- Exemplo GRATUITO:
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'quiz',
  'Santos Brasileiros',
  'santos',
  true,
  10,
  $json${
    "perguntas": [
      {
        "topic": "Santos do Brasil",
        "question": "Qual foi o primeiro santo nascido no Brasil?",
        "options": ["São José de Anchieta", "Santa Dulce dos Pobres", "Frei Galvão", "Madre Paulina"],
        "correct": 2,
        "difficulty": "medio"
      },
      {
        "topic": "Santos do Brasil",
        "question": "Em que cidade nasceu Santa Dulce dos Pobres?",
        "options": ["Recife", "São Paulo", "Salvador", "Fortaleza"],
        "correct": 2,
        "difficulty": "facil"
      },
      {
        "topic": "Santos do Brasil",
        "question": "Qual o nome de batismo de Frei Galvão?",
        "options": ["Antônio de Sant'Ana Galvão", "Francisco de Assis Galvão", "José Maria Galvão", "Pedro Galvão de Moura"],
        "correct": 0,
        "difficulty": "dificil"
      }
    ]
  }$json$::jsonb
);
*/

-- Exemplo PAGO (200 moedas):
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, coins_price, ordem, conteudo)
VALUES (
  'quiz',
  'Teologia Avançada',
  'teologia',
  false,
  200,
  20,
  $json${
    "perguntas": [
      {
        "topic": "Dogmas",
        "question": "Em qual concílio foi definido o dogma da Imaculada Conceição?",
        "options": ["Concílio de Trento", "Vaticano I", "Não foi em concílio", "Vaticano II"],
        "correct": 2,
        "difficulty": "dificil"
      }
    ]
  }$json$::jsonb
);
*/


-- ───────────────────────────────────────────────────────────────────────────────
-- 2. SABEDORIA CATÓLICA (Versículo Misterioso)
-- ───────────────────────────────────────────────────────────────────────────────
-- conteudo.frases[]:
--   words      → cada palavra em um item separado do array
--   reference  → resposta correta (referência bíblica, nome do santo/papa/documento)
--   options    → array com EXATAMENTE 4 opções (inclua a correta entre elas)
--   type       → versiculo | santo | papa | documento
--   difficulty → facil | medio | dificil
--
-- type define o label da pergunta exibido ao jogador:
--   versiculo  → "Onde está escrito?"
--   santo      → "Quem disse isso?"
--   papa       → "De qual papa é esta frase?"
--   documento  → "De qual documento da Igreja?"
-- ───────────────────────────────────────────────────────────────────────────────
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'versiculo',
  'Frases dos Papas',
  'papas',
  true,
  10,
  $json${
    "frases": [
      {
        "words": ["Não", "tenham", "medo."],
        "reference": "São João Paulo II",
        "options": ["São João Paulo II", "Bento XVI", "Francisco", "João XXIII"],
        "type": "papa",
        "difficulty": "facil"
      },
      {
        "words": ["A", "família", "é", "a", "célula", "fundamental", "da", "sociedade."],
        "reference": "Familiaris Consortio",
        "options": ["Familiaris Consortio", "Gaudium et Spes", "Humanae Vitae", "Lumen Gentium"],
        "type": "documento",
        "difficulty": "medio"
      },
      {
        "words": ["Fora", "da", "Igreja", "não", "há", "salvação."],
        "reference": "Santo Cipriano de Cartago",
        "options": ["Santo Agostinho", "Santo Cipriano de Cartago", "São João Crisóstomo", "São Jerônimo"],
        "type": "santo",
        "difficulty": "dificil"
      }
    ]
  }$json$::jsonb
);
*/


-- ───────────────────────────────────────────────────────────────────────────────
-- 3. PEREGRINAÇÃO VIRTUAL
-- ───────────────────────────────────────────────────────────────────────────────
-- conteudo.santuarios[]:
--   emoji       → bandeira ou emoji do país
--   name        → nome do santuário
--   country     → país (exibido no subtítulo)
--   description → breve descrição histórica
--   questions[] → perguntas do santuário
--     question  → texto da pergunta
--     options   → array com EXATAMENTE 4 opções
--     correct   → índice da resposta correta (0–3)
--
-- Recomendado: 4 perguntas por santuário (o jogo exige ≥2 acertos para avançar)
-- Novos santuários aparecem AO FINAL da lista do mapa de peregrinação
-- ───────────────────────────────────────────────────────────────────────────────
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'peregrinacao',
  'Santuários da América Latina',
  'santuarios',
  true,
  10,
  $json${
    "santuarios": [
      {
        "emoji": "🇦🇷",
        "name": "Basílica de Luján",
        "country": "Argentina",
        "description": "Santuário da padroeira da Argentina, Uruguai e Paraguai.",
        "questions": [
          {
            "question": "Nossa Senhora de Luján é padroeira de quantos países?",
            "options": ["1", "2", "3", "4"],
            "correct": 2
          },
          {
            "question": "Em que século foi fundado o Santuário de Luján?",
            "options": ["XVI", "XVII", "XVIII", "XIX"],
            "correct": 1
          },
          {
            "question": "Qual o estilo arquitetônico da Basílica de Luján?",
            "options": ["Barroco", "Renascentista", "Gótico", "Neoclássico"],
            "correct": 2
          },
          {
            "question": "Em que província argentina fica Luján?",
            "options": ["Córdoba", "Buenos Aires", "Santa Fé", "Mendoza"],
            "correct": 1
          }
        ]
      }
    ]
  }$json$::jsonb
);
*/


-- ───────────────────────────────────────────────────────────────────────────────
-- 4. PALAVRAS DA FÉ (Caça-palavras)
-- ───────────────────────────────────────────────────────────────────────────────
-- conteudo.temas[]:
--   title      → nome do tema
--   subtitle   → subtítulo descritivo
--   words      → palavras EM MAIÚSCULAS, sem acento, sem espaço
--                  facil: 5 palavras / medio: 6 palavras / dificil: 7–8 palavras
--   difficulty → facil | medio | dificil
--   gridSize   → tamanho do grid: 8 (facil) | 9 (medio) | 10 (dificil)
--
-- ATENÇÃO: a palavra mais longa do array não pode ter mais letras que gridSize.
--          Escreva sem acentos: EUCARISTIA (não EUCARISTÍA), JOAO (não JOÃO).
-- ───────────────────────────────────────────────────────────────────────────────
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'palavras',
  'Apóstolos e Evangelistas',
  'biblia',
  true,
  10,
  $json${
    "temas": [
      {
        "title": "Os Apóstolos",
        "subtitle": "Escolhidos por Jesus",
        "words": ["PEDRO", "PAULO", "JOAO", "TIAGO", "ANDRE"],
        "difficulty": "facil",
        "gridSize": 8
      },
      {
        "title": "Evangelistas",
        "subtitle": "Autores dos Evangelhos",
        "words": ["MATEUS", "MARCOS", "LUCAS", "JOAO", "APOSTOLO", "ESPIRITO"],
        "difficulty": "medio",
        "gridSize": 9
      },
      {
        "title": "Cartas de Paulo",
        "subtitle": "Epistolas paulinas",
        "words": ["ROMANOS", "CORINTIOS", "GALATAS", "EFESIOS", "FILIPENSES", "COLOSSENSES", "TIMOTEO"],
        "difficulty": "dificil",
        "gridSize": 10
      }
    ]
  }$json$::jsonb
);
*/


-- ───────────────────────────────────────────────────────────────────────────────
-- 5. DESAFIO LITÚRGICO
-- ───────────────────────────────────────────────────────────────────────────────
-- conteudo.perguntas[]:
--   question   → texto da pergunta
--   options    → array com EXATAMENTE 4 opções
--   correct    → índice da opção correta (0–3)
--   hint       → dica exibida após responder (obrigatório, diferente do Quiz)
--   difficulty → facil | medio | dificil
--
-- Diferença do Quiz: tem "hint" em vez de "topic".
-- Timer regressivo por dificuldade: facil=90s | medio=75s | dificil=60s
-- ───────────────────────────────────────────────────────────────────────────────

-- Exemplo GRATUITO:
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'liturgico',
  'Tempo Litúrgico',
  'liturgia',
  true,
  10,
  $json${
    "perguntas": [
      {
        "question": "Qual é a data fixa da solenidade de Cristo Rei?",
        "options": ["Último domingo do Ano Litúrgico", "1 de novembro", "Último domingo de outubro", "Primeiro domingo do Advento"],
        "correct": 0,
        "hint": "Encerra o Tempo Comum, última semana do Ano Litúrgico.",
        "difficulty": "medio"
      },
      {
        "question": "O que é o Triduum Pascal?",
        "options": ["Os três dias antes do Natal", "Quinta-feira Santa, Sexta-feira Santa e Vigília Pascal", "Os três domingos da Quaresma", "Quarta, Quinta e Sexta da Semana Santa"],
        "correct": 1,
        "hint": "Ápice do Ano Litúrgico: Paixão, Morte e Ressurreição de Cristo.",
        "difficulty": "dificil"
      },
      {
        "question": "Quantas semanas tem o Tempo Comum no total?",
        "options": ["30", "33 ou 34", "28", "40"],
        "correct": 1,
        "hint": "Varia conforme a data da Páscoa: entre 33 e 34 semanas.",
        "difficulty": "facil"
      }
    ]
  }$json$::jsonb
);
*/

-- Exemplo PAGO (200 moedas):
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, coins_price, ordem, conteudo)
VALUES (
  'liturgico',
  'Ano Litúrgico Avançado',
  'liturgia',
  false,
  200,
  20,
  $json${
    "perguntas": [
      {
        "question": "Qual documento reforma o calendário litúrgico romano em 1969?",
        "options": ["Sacrosanctum Concilium", "Calendarium Romanum", "Missale Romanum", "Lumen Gentium"],
        "correct": 1,
        "hint": "Publicado por Paulo VI após o Concílio Vaticano II.",
        "difficulty": "dificil"
      }
    ]
  }$json$::jsonb
);
*/


-- ───────────────────────────────────────────────────────────────────────────────
-- 6. STOP CATÓLICO
-- ───────────────────────────────────────────────────────────────────────────────
-- conteudo.categorias[]:
--   key   → identificador único em snake_case, sem espaços, sem acento
--           IMPORTANTE: não repita uma key já existente no código (lista abaixo)
--   label → nome exibido na tela de seleção de categorias
--   emoji → emoji exibido ao lado do label
--
-- Keys já existentes no código (não repetir):
--   fundador, igrejafe, missa, objetolit, partesigrj, titulo_maria,
--   simbolo, oracao, virtude, pecado, livro_biblia, lugar_sagrado,
--   santo, papa, personagem_biblico, padre
-- ───────────────────────────────────────────────────────────────────────────────

-- Exemplo GRATUITO:
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'stop',
  'Categorias Extra',
  'extra',
  true,
  10,
  $json${
    "categorias": [
      { "key": "concilio",  "label": "Concílio ou Sínodo",           "emoji": "🏛️" },
      { "key": "enciclica", "label": "Encíclica papal",               "emoji": "📜" },
      { "key": "heresia",   "label": "Heresia condenada pela Igreja", "emoji": "⚠️" },
      { "key": "martir",    "label": "Mártir cristão",                "emoji": "✝️" }
    ]
  }$json$::jsonb
);
*/

-- Exemplo PAGO (150 moedas):
/*
INSERT INTO game_packs (game_type, titulo, categoria, gratuito, coins_price, ordem, conteudo)
VALUES (
  'stop',
  'Categorias Premium',
  'extra',
  false,
  150,
  20,
  $json${
    "categorias": [
      { "key": "doutor_igreja", "label": "Doutor da Igreja",     "emoji": "📚" },
      { "key": "religiao",      "label": "Ordem ou Congregação", "emoji": "⛪" }
    ]
  }$json$::jsonb
);
*/
