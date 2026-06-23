-- Tabela de notificações agendadas pelo servidor
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  body         text        NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent         boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca eficiente por usuário + não enviados
CREATE INDEX IF NOT EXISTS notifications_user_pending
  ON notifications(user_id, sent, scheduled_at)
  WHERE sent = false;

-- RLS: usuário só vê as próprias notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_le_proprias" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usuario_atualiza_proprias" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role pode inserir notificações para qualquer usuário
CREATE POLICY "service_insere" ON notifications
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Exemplos de como agendar notificações para todos os usuários:
--
-- Notificação imediata para todos:
-- INSERT INTO notifications (user_id, title, body, scheduled_at)
-- SELECT id, '🎉 Nova trilha disponível!', 'As Sete Moradas agora está no app. Confira!', now()
-- FROM auth.users;
--
-- Notificação agendada para amanhã às 9h (horário UTC):
-- INSERT INTO notifications (user_id, title, body, scheduled_at)
-- SELECT id, '📖 Dica do dia', 'Rezar o Rosário diariamente abre as portas do céu. Que tal agora?', now() + interval '1 day'
-- FROM auth.users;
-- ─────────────────────────────────────────────────────────────────────────────
