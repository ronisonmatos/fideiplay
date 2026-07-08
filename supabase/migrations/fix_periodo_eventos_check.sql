-- O período de exibição do evento passou a ser livre (7 a 60 dias, com desconto
-- por faixa — ver constants/eventos-precos.ts), mas a constraint original ainda
-- travava em (7, 15). Sem isso, qualquer período fora desses dois valores
-- falha ao salvar o evento. Execute no SQL Editor do Supabase.

ALTER TABLE public.eventos_patrocinados
  DROP CONSTRAINT IF EXISTS eventos_patrocinados_periodo_check;

ALTER TABLE public.eventos_patrocinados
  ADD CONSTRAINT eventos_patrocinados_periodo_check CHECK (periodo BETWEEN 7 AND 60);
