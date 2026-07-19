-- Solitário Católico — jogo de cartas estilo "word solitaire" com temática católica.
-- Categorias e cartas são geridas pelo admin (app) sem precisar de nova versão do app.
-- Execute no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS public.solitario_categorias (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text        NOT NULL UNIQUE,
  icone      text        NOT NULL DEFAULT '✝️',
  cor        text        NOT NULL DEFAULT '#534AB7',
  ativo      boolean     NOT NULL DEFAULT true,
  ordem      int         NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solitario_cartas (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid        NOT NULL REFERENCES public.solitario_categorias(id) ON DELETE CASCADE,
  nome         text        NOT NULL,
  imagem_url   text,
  ativo        boolean     NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (categoria_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_solitario_cartas_categoria ON public.solitario_cartas(categoria_id);

ALTER TABLE public.solitario_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solitario_cartas      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solitario_categorias_public_read" ON public.solitario_categorias
  FOR SELECT USING (ativo = true);

CREATE POLICY "solitario_categorias_admin_all" ON public.solitario_categorias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "solitario_cartas_public_read" ON public.solitario_cartas
  FOR SELECT USING (ativo = true);

CREATE POLICY "solitario_cartas_admin_all" ON public.solitario_cartas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Categorias e cartas iniciais ─────────────────────────────────────────────
-- Conteúdo suficiente para os níveis 1–5 sem depender de cadastro manual antes
-- do primeiro lançamento. O admin pode adicionar mais depois (aba Solitário).

INSERT INTO public.solitario_categorias (nome, icone, cor, ordem) VALUES
  ('Santos',         '😇', '#534AB7', 1),
  ('Símbolos da Fé', '✝️', '#EF9F27', 2),
  ('Sacramentos',    '🕊️', '#1D9E75', 3),
  ('Orações',        '🙏', '#E24B4A', 4),
  ('Virtudes',       '⭐', '#3B82F6', 5)
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.solitario_cartas (categoria_id, nome)
SELECT id, carta FROM public.solitario_categorias, LATERAL (
  VALUES
    ('São Francisco'), ('Santa Clara'), ('São João Paulo II'), ('Santa Teresinha'),
    ('São Pedro'), ('São Paulo'), ('Santa Dulce'), ('São José')
) AS t(carta)
WHERE nome = 'Santos'
ON CONFLICT (categoria_id, nome) DO NOTHING;

INSERT INTO public.solitario_cartas (categoria_id, nome)
SELECT id, carta FROM public.solitario_categorias, LATERAL (
  VALUES
    ('Crucifixo'), ('Cálice'), ('Hóstia'), ('Vela'),
    ('Rosário'), ('Pomba'), ('Âncora'), ('Peixe (Ichthys)')
) AS t(carta)
WHERE nome = 'Símbolos da Fé'
ON CONFLICT (categoria_id, nome) DO NOTHING;

INSERT INTO public.solitario_cartas (categoria_id, nome)
SELECT id, carta FROM public.solitario_categorias, LATERAL (
  VALUES
    ('Batismo'), ('Eucaristia'), ('Crisma'), ('Confissão'),
    ('Unção dos Enfermos'), ('Ordem'), ('Matrimônio'), ('Primeira Comunhão')
) AS t(carta)
WHERE nome = 'Sacramentos'
ON CONFLICT (categoria_id, nome) DO NOTHING;

INSERT INTO public.solitario_cartas (categoria_id, nome)
SELECT id, carta FROM public.solitario_categorias, LATERAL (
  VALUES
    ('Pai Nosso'), ('Ave Maria'), ('Glória ao Pai'), ('Salve Rainha'),
    ('Ato de Contrição'), ('Anjo da Guarda'), ('Credo'), ('Angelus')
) AS t(carta)
WHERE nome = 'Orações'
ON CONFLICT (categoria_id, nome) DO NOTHING;

INSERT INTO public.solitario_cartas (categoria_id, nome)
SELECT id, carta FROM public.solitario_categorias, LATERAL (
  VALUES
    ('Fé'), ('Esperança'), ('Caridade'), ('Prudência'),
    ('Justiça'), ('Fortaleza'), ('Temperança'), ('Humildade')
) AS t(carta)
WHERE nome = 'Virtudes'
ON CONFLICT (categoria_id, nome) DO NOTHING;
