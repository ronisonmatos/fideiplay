-- Adiciona 'caravana' como categoria válida de evento (peregrinações/excursões).
-- Execute no SQL Editor do Supabase.

ALTER TABLE public.banner_ads
  DROP CONSTRAINT IF EXISTS banner_ads_categoria_check;
ALTER TABLE public.banner_ads
  ADD CONSTRAINT banner_ads_categoria_check
  CHECK (categoria IN ('retiro', 'festa', 'missa', 'curso', 'novena', 'caravana', 'outro'));

ALTER TABLE public.eventos_patrocinados
  DROP CONSTRAINT IF EXISTS eventos_patrocinados_categoria_check;
ALTER TABLE public.eventos_patrocinados
  ADD CONSTRAINT eventos_patrocinados_categoria_check
  CHECK (categoria IN ('retiro', 'festa', 'missa', 'curso', 'novena', 'caravana', 'outro'));
