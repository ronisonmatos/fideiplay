-- Coluna para armazenar o resultado da validação (banco + IA) de cada jogador
-- Cada jogador valida as próprias respostas e salva aqui;
-- o adversário lê este campo para exibir o resultado correto.
ALTER TABLE stop_answers
  ADD COLUMN IF NOT EXISTS validation jsonb;
