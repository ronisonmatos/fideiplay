-- Tabela de configurações globais do app
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS public.app_config (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Leitura pública (sem autenticação) — apenas SELECT
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de config"
  ON public.app_config
  FOR SELECT
  USING (true);

-- URLs das páginas legais — atualize para o domínio real após o deploy na Vercel
INSERT INTO public.app_config (key, value) VALUES
  ('url_termos',      'https://santosplay.vercel.app/termos.html'),
  ('url_privacidade', 'https://santosplay.vercel.app/privacidade.html')
ON CONFLICT (key) DO UPDATE SET
  value      = EXCLUDED.value,
  updated_at = now();
