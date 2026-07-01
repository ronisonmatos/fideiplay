-- Corrige recompensa de anúncios: de 50 para 15 moedas
ALTER TABLE ads ALTER COLUMN coins SET DEFAULT 15;
UPDATE ads SET coins = 15 WHERE coins = 50;
