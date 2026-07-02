-- Suporte a carrossel de imagens no anúncio próprio (até 6 fotos, estilo Instagram/YouTube).
-- media_url continua sendo a capa/fallback (compatível com anúncios já cadastrados);
-- media_urls é opcional e só é usado quando o anúncio tem mais de 1 imagem.

ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS media_urls text[];

ALTER TABLE ads
  DROP CONSTRAINT IF EXISTS ads_media_urls_max6;

ALTER TABLE ads
  ADD CONSTRAINT ads_media_urls_max6 CHECK (media_urls IS NULL OR array_length(media_urls, 1) <= 6);
