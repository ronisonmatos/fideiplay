-- Tabela de categorias do Stop Católico
-- Permite adicionar/editar categorias via banco sem nova versão do app.
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS public.stop_categories (
  key          text PRIMARY KEY,
  label        text        NOT NULL,
  emoji        text        NOT NULL DEFAULT '✝️',
  valid_letters text[]     NOT NULL DEFAULT ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'],
  active       boolean     NOT NULL DEFAULT true,
  sort_order   integer     NOT NULL DEFAULT 0
);

-- Leitura pública sem autenticação
ALTER TABLE public.stop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de stop_categories"
  ON public.stop_categories
  FOR SELECT
  USING (true);

-- ── Categorias ──────────────────────────────────────────────────────────────
-- sort_order define a ordem na tela de seleção (menor = primeiro).
-- valid_letters: letras que têm pelo menos uma resposta válida para a categoria.

INSERT INTO public.stop_categories (key, label, emoji, valid_letters, sort_order) VALUES

-- Categorias com 100% de cobertura (21 letras) — aparecem primeiro
('igrejafe',          'Igreja e fé',                   '✝️',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'], 1),

('santo',             'Santo(a)',                       '😇',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','P','R','S','T','U','V','Z'], 2),

('personagem_biblico','Personagem bíblico',             '📜',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','P','R','S','T','U','V','Z'], 3),

('pecado',            'Pecado',                        '🍎',
  ARRAY['A','B','C','D','E','F','G','H','I','L','M','N','O','P','R','S','T','U','V','Z'], 4),

('atributo_deus',     'Atributo de Deus',              '🌟',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'], 5),

('animal_biblico',    'Animal bíblico',                '🐑',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'], 6),

('dogma',             'Dogma / Verdade de Fé',         '✡️',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'], 9),

('festa_liturgica',   'Festa litúrgica',               '🎉',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'], 10),

('mulher_biblia',     'Mulher da Bíblia',              '👩',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V','Z'], 11),

-- Categorias com cobertura parcial
('virtude',           'Virtude cristã',                '✨',
  ARRAY['A','B','C','D','E','F','G','H','I','L','M','P','R','S','T','U','V','Z'], 12),

('livro_biblia',      'Livro da Bíblia',               '📖',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','Z'], 13),

('lugar_sagrado',     'Lugar sagrado / Cidade bíblica','🗺️',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','Z'], 14),

('papa',              'Papa',                          '👑',
  ARRAY['A','B','C','D','E','F','G','H','I','J','L','M','N','P','S','T','U','V','Z'], 15),

('fundador',          'Fundador de ordem religiosa',   '⛪',
  ARRAY['A','B','C','D','E','F','G','I','J','L','M','N','P','R','S','T','V','Z'], 16),

('titulo_maria',      'Título de Nossa Senhora',       '🌹',
  ARRAY['A','B','C','D','E','F','G','J','L','M','N','P','R','S','T','V'], 17),

('objetolit',         'Objeto litúrgico',              '🕯️',
  ARRAY['A','B','C','D','E','F','G','H','I','L','M','N','O','P','R','S','T','V'], 18),

('partesigrj',        'Parte da igreja',               '🏛️',
  ARRAY['A','B','C','D','E','F','G','H','L','M','O','P','R','S','T','U','V'], 19),

('missa',             'Coisa da Santa Missa',          '🍷',
  ARRAY['A','C','D','E','F','G','H','I','L','M','O','P','R','S','T'], 20)

ON CONFLICT (key) DO UPDATE SET
  label         = EXCLUDED.label,
  emoji         = EXCLUDED.emoji,
  valid_letters = EXCLUDED.valid_letters,
  sort_order    = EXCLUDED.sort_order;
