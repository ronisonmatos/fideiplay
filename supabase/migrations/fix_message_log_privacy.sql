-- Volta o community_message_log à intenção original do schema: log de
-- auditoria SEM conteúdo (só quem + quando), suficiente pra Marco Civil,
-- sem guardar o texto da mensagem por 6 meses numa segunda tabela que a
-- exclusão do usuário não alcança.
--
-- O histórico de moderação de 24h do admin (/historico24) passa a consultar
-- community_messages direto (que já não é apagada fisicamente — só soft
-- delete), via a nova policy abaixo. Execute no SQL Editor do Supabase.

alter table public.community_message_log
  drop column if exists content,
  drop column if exists user_name;

-- Admin enxerga todas as mensagens dos últimos períodos (inclusive já
-- soft-deletadas) pra fins de moderação — além da policy normal de leitura.
drop policy if exists "admin_reads_all_messages" on public.community_messages;
create policy "admin_reads_all_messages"
  on public.community_messages for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
