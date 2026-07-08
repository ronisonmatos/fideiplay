-- Eventos patrocinados por usuários: usuário paga para divulgar um evento no
-- banner (mesmo slot/visual do banner_ads tipo 'evento'), passando por fila
-- de aprovação do admin. Execute no SQL Editor do Supabase.

-- ── 1. Tabela ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos_patrocinados (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id               UUID REFERENCES auth.users NOT NULL,
  titulo                   TEXT NOT NULL,
  descricao                TEXT NOT NULL,
  imagem_url               TEXT,
  link_externo             TEXT,
  data_inicio              DATE NOT NULL,
  data_fim                 DATE NOT NULL,
  local_evento             TEXT,
  alcance                  TEXT NOT NULL DEFAULT 'cidade'
    CHECK (alcance IN ('cidade', 'estado', 'nacional')),
  estados                  TEXT[] NOT NULL DEFAULT '{}',
  cidades                  TEXT[] NOT NULL DEFAULT '{}',
  -- Período contratado (dias de exibição do banner) e a janela real de
  -- exibição — começa na aprovação e dura `periodo` dias. Independente de
  -- data_inicio/data_fim, que são as datas do evento em si (pode ser
  -- divulgado com antecedência ou depois que o evento já começou).
  periodo                  INTEGER NOT NULL CHECK (periodo IN (7, 15)),
  exibicao_inicio          DATE,
  exibicao_fim             DATE,
  -- 'aguardando_pagamento' → 'aguardando_aprovacao' → 'aprovado' → 'ativo' → 'encerrado'
  -- 'rejeitado' → reembolso automático
  status                   TEXT NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento', 'aguardando_aprovacao', 'aprovado', 'ativo', 'rejeitado', 'encerrado')),
  motivo_rejeicao          TEXT,
  erro_reembolso           TEXT,
  valor_pago               DECIMAL(10,2),
  payment_id               TEXT,
  aprovado_por             UUID REFERENCES auth.users,
  aprovado_em              TIMESTAMPTZ,
  notificado_encerramento  BOOLEAN NOT NULL DEFAULT false,
  criado_em                TIMESTAMPTZ DEFAULT NOW(),
  impressoes               INTEGER NOT NULL DEFAULT 0,
  cliques                  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_eventos_patrocinados_status  ON public.eventos_patrocinados (status);
CREATE INDEX IF NOT EXISTS idx_eventos_patrocinados_usuario ON public.eventos_patrocinados (usuario_id);

-- ── 2. Chave liga/desliga (reaproveita app_config, já usada pelo banner) ──────
INSERT INTO public.app_config (key, value) VALUES
  ('eventos_patrocinados_ativo', 'true')
ON CONFLICT (key) DO NOTHING;

-- ── 3. RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.eventos_patrocinados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprios" ON public.eventos_patrocinados
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "usuario_cria_proprio" ON public.eventos_patrocinados
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "admin_ve_todos" ON public.eventos_patrocinados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "leitura_eventos_ativos" ON public.eventos_patrocinados
  FOR SELECT USING (status IN ('aprovado', 'ativo'));

-- ── 4. Contadores atômicos (mesmo padrão de increment_banner_impressao/clique) ─
CREATE OR REPLACE FUNCTION increment_evento_impressao(p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.eventos_patrocinados SET impressoes = impressoes + 1 WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION increment_evento_clique(p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.eventos_patrocinados SET cliques = cliques + 1 WHERE id = p_id;
$$;

-- ── 5. Pagamentos: generaliza a tabela `payments` (hoje só trilha) ────────────
ALTER TABLE public.payments
  ALTER COLUMN trilha_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'trilha' CHECK (tipo IN ('trilha', 'evento')),
  ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES public.eventos_patrocinados(id);

CREATE INDEX IF NOT EXISTS idx_payments_evento ON public.payments (evento_id);

-- ── 6. Transição diária de status + aviso de encerramento ────────────────────
--
-- "aprovado" só vira "ativo" quando exibicao_inicio chega (na prática, no
-- primeiro dia após a aprovação — quem ativa a exibição em si é o admin, que
-- grava exibicao_inicio = hoje / exibicao_fim = hoje + período), e some
-- (vira "encerrado") quando exibicao_fim passa. A visibilidade no banner
-- (fetchActiveBannerAds) já filtra por exibicao_inicio/exibicao_fim
-- independente disso — este job só mantém o status exibido em "Meus
-- eventos"/histórico do admin coerente e dispara o aviso de encerramento.
CREATE OR REPLACE FUNCTION atualizar_status_eventos_patrocinados()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  UPDATE public.eventos_patrocinados
    SET status = 'ativo'
    WHERE status = 'aprovado' AND exibicao_inicio <= hoje AND exibicao_fim >= hoje;

  UPDATE public.eventos_patrocinados
    SET status = 'encerrado'
    WHERE status IN ('aprovado', 'ativo') AND exibicao_fim < hoje;

  -- Agenda o aviso via tabela `notifications` (o cron dispatch-notifications,
  -- que já roda a cada 2 min, entrega o push e marca sent = true).
  INSERT INTO public.notifications (user_id, title, body, scheduled_at)
  SELECT usuario_id,
         '⏳ Seu evento encerra amanhã',
         'Seu evento "' || titulo || '" encerra amanhã. Quer divulgar por mais tempo?',
         now()
  FROM public.eventos_patrocinados
  WHERE status = 'ativo'
    AND exibicao_fim = hoje + 1
    AND notificado_encerramento = false;

  UPDATE public.eventos_patrocinados
    SET notificado_encerramento = true
    WHERE status = 'ativo' AND exibicao_fim = hoje + 1 AND notificado_encerramento = false;
END;
$$;

SELECT cron.unschedule('atualizar-eventos-patrocinados') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'atualizar-eventos-patrocinados'
);

SELECT cron.schedule(
  'atualizar-eventos-patrocinados',
  '0 6 * * *',
  $$SELECT atualizar_status_eventos_patrocinados();$$
);

-- ── 7. Storage: usuários comuns podem subir a imagem do próprio evento ───────
-- O bucket "ads" já existe (add_ads_storage_bucket.sql) com escrita restrita a
-- admins. Eventos de usuário sobem em "eventos/..." dentro do mesmo bucket —
-- libera insert nesse prefixo pra qualquer usuário autenticado.
DROP POLICY IF EXISTS "ads bucket user write eventos" ON storage.objects;
CREATE POLICY "ads bucket user write eventos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ads'
    AND (storage.foldername(name))[1] = 'eventos'
  );
