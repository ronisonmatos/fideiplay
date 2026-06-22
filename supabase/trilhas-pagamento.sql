-- FideiPlay — Histórico de pagamentos de trilhas
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS payments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trilha_id  int         NOT NULL,
  mp_id      bigint      UNIQUE,
  status     text        NOT NULL DEFAULT 'pending',
  method     text        NOT NULL DEFAULT 'pix',
  amount     numeric(10,2) NOT NULL DEFAULT 9.90,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios pagamentos" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_id ON payments (mp_id);
