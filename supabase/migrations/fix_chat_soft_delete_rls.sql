-- Corrige a exclusão manual de mensagem do chat, que não funcionava de verdade:
-- ao tentar excluir (soft delete via deleted_at), o Postgres rejeitava o UPDATE
-- com "new row violates row-level security policy". Causa: a policy de SELECT
-- só permitia ver linhas com deleted_at IS NULL, e o Postgres exige que a linha
-- continue visível pra quem faz o UPDATE depois da mudança — como o autor
-- deixava de "ver" a própria linha (deleted_at passou a ser preenchido), o
-- RLS bloqueava a operação inteira.
--
-- Correção: o autor sempre pode "ver" (via RLS) sua própria mensagem, mesmo
-- já excluída — isso só satisfaz a exigência interna do Postgres. A consulta
-- do app (hooks/use-chat-mensagens.ts) já filtra deleted_at IS NULL
-- explicitamente, então a mensagem continua realmente sumindo da tela pra
-- todo mundo, inclusive pra quem excluiu, mesmo depois de recarregar.
-- Execute no SQL Editor do Supabase.

drop policy if exists "authenticated can read messages" on public.community_messages;
create policy "authenticated can read messages"
  on public.community_messages for select
  to authenticated
  using (deleted_at is null or auth.uid() = user_id);
