-- Google Play, Requisitos da Política para Famílias — "Recursos e aplicativos
-- sociais": chat da comunidade precisa (1) de um lembrete de segurança antes
-- de menores trocarem mídia/informação em formato livre e (2) de um jeito de
-- um adulto controlar o recurso social para contas de menores de idade.
--
-- chat_social_enabled: null/false = chat da comunidade bloqueado para a conta
--   (padrão para menores até um adulto liberar via Configurações). Contas de
--   maiores de idade ignoram esta coluna (sempre liberado) — ver isMinor no app.
-- chat_social_enabled_at: quando um adulto passou pelo "portão parental" e
--   liberou o recurso — registro do consentimento.
-- chat_safety_ack_at: quando o usuário confirmou o aviso de segurança on-line
--   exibido antes do primeiro uso do chat.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_social_enabled    boolean,
  ADD COLUMN IF NOT EXISTS chat_social_enabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS chat_safety_ack_at      timestamptz;

DROP POLICY IF EXISTS "usuario_atualiza_controle_parental_chat" ON profiles;
CREATE POLICY "usuario_atualiza_controle_parental_chat" ON profiles
  FOR UPDATE USING (auth.uid() = id);
