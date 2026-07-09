-- Suporte a Apple In-App Purchase nas trilhas pagas (iOS) — exigência da
-- Apple (Guideline 3.1.1): conteúdo digital consumido dentro do app não pode
-- ser vendido via gateway externo (Mercado Pago) em iOS. mp_id (bigint) é
-- específico do Mercado Pago; o transactionId da Apple é alfanumérico, por
-- isso ganha coluna própria em vez de reaproveitar mp_id.
-- Execute no SQL Editor do Supabase.

alter table public.payments
  add column if not exists apple_transaction_id text;

-- Sem predicado WHERE: um índice único do Postgres já trata múltiplos NULL
-- como distintos entre si, então isso não impede duas linhas com
-- apple_transaction_id nulo (Mercado Pago) — só impede duplicar o mesmo
-- transactionId da Apple. Sem WHERE também é o que permite usar
-- ON CONFLICT (apple_transaction_id) num upsert simples (com predicado
-- parcial, o Postgres exige repetir a mesma condição no ON CONFLICT).
create unique index if not exists idx_payments_apple_transaction_id
  on public.payments (apple_transaction_id);

-- 'method' (hoje 'pix'/'credit_card') e 'user_trilhas.origem' (hoje
-- 'manual'/'compra'/'coins') já são texto livre sem CHECK constraint —
-- passam a aceitar o valor 'apple_iap' sem necessidade de alterar o schema.
