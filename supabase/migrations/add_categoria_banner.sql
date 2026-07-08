-- Categoria do evento (define a cor do banner no app, combate banner blindness).
-- Aplica-se a banner_ads (tipo = 'evento', cadastrado pelo admin) e a
-- eventos_patrocinados (cadastrado pelo usuário). Em banner_ads com
-- tipo = 'comercial', a categoria é ignorada pela UI.
-- Execute no SQL Editor do Supabase.

ALTER TABLE public.banner_ads
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'outro'
  CHECK (categoria IN ('retiro', 'festa', 'missa', 'curso', 'novena', 'outro'));

ALTER TABLE public.eventos_patrocinados
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'outro'
  CHECK (categoria IN ('retiro', 'festa', 'missa', 'curso', 'novena', 'outro'));
