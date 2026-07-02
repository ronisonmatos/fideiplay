-- A migração anterior (add_admin_notifications.sql) trocou o INSERT em
-- `notifications` pra WITH CHECK (false), forçando tudo passar pelas funções
-- admin_send_notification/admin_broadcast_notification — mas isso quebrou
-- inserts diretos já existentes (aprovação/rejeição de contestação, resposta
-- de suporte, em admin.tsx e admin-contestacoes.tsx). Corrige permitindo
-- INSERT direto apenas para admins, mantendo bloqueado para os demais.

DROP POLICY IF EXISTS "apenas_admin_functions_inserem" ON notifications;

CREATE POLICY "apenas_admin_insere" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );
