-- Teste de Conhecimento Católico: diagnóstico de 30 perguntas (5 por tema),
-- gera um nível geral e por tema, salva histórico por usuário. Execute no SQL
-- Editor do Supabase.

-- ── 1. Banco de questões ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questoes_teste (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tema        TEXT NOT NULL CHECK (tema IN ('teologia', 'liturgia', 'biblia', 'historia', 'moral', 'santos')),
  pergunta    TEXT NOT NULL,
  opcoes      TEXT[] NOT NULL,
  correta     INTEGER NOT NULL,
  explicacao  TEXT,
  dificuldade TEXT NOT NULL DEFAULT 'medio' CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  ativo       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_questoes_teste_tema ON public.questoes_teste (tema) WHERE ativo = true;

ALTER TABLE public.questoes_teste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica_questoes" ON public.questoes_teste
  FOR SELECT USING (ativo = true);

CREATE POLICY "admin_gerencia_questoes" ON public.questoes_teste
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- ── 2. Resultados do usuário ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testes_conhecimento (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id      UUID REFERENCES auth.users NOT NULL,
  nivel_geral     TEXT NOT NULL,
  temas           JSONB NOT NULL,
  concluido_em    TIMESTAMPTZ DEFAULT NOW(),
  total_questoes  INTEGER NOT NULL,
  total_acertos   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_testes_conhecimento_usuario ON public.testes_conhecimento (usuario_id, concluido_em DESC);

ALTER TABLE public.testes_conhecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprio" ON public.testes_conhecimento
  FOR ALL USING (auth.uid() = usuario_id);

-- ── 3. Percentil — a RLS acima impede o cliente de ver os testes de outros
-- usuários, então o "melhor que X% dos usuários" precisa ser calculado no
-- servidor, com privilégio elevado, devolvendo só o número (nunca as linhas).
CREATE OR REPLACE FUNCTION calcular_percentil_teste(p_teste_id UUID)
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER STABLE AS $$
  WITH alvo AS (
    SELECT total_acertos::float / NULLIF(total_questoes, 0) AS pct
    FROM public.testes_conhecimento WHERE id = p_teste_id
  ),
  ultimo_por_usuario AS (
    SELECT DISTINCT ON (usuario_id)
      usuario_id, total_acertos::float / NULLIF(total_questoes, 0) AS pct
    FROM public.testes_conhecimento
    ORDER BY usuario_id, concluido_em DESC
  )
  SELECT CASE WHEN (SELECT COUNT(*) FROM ultimo_por_usuario) <= 1 THEN 50
    ELSE ROUND(
      100.0 * (SELECT COUNT(*) FROM ultimo_por_usuario u, alvo a WHERE u.pct <= a.pct)
      / (SELECT COUNT(*) FROM ultimo_por_usuario)
    )::integer
  END;
$$;
