-- Frases exibidas na tela de validação do Stop Online
CREATE TABLE IF NOT EXISTS stop_validation_quotes (
  id     serial PRIMARY KEY,
  text   text    NOT NULL,
  author text,
  active boolean NOT NULL DEFAULT true
);

-- Leitura pública (sem login necessário)
ALTER TABLE stop_validation_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura_publica" ON stop_validation_quotes
  FOR SELECT USING (active = true);
