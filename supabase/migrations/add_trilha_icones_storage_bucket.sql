-- Bucket público para ícones .png customizados de trilhas cadastradas via
-- game_packs (quando não há arte local via require() nem se quer usar emoji).
-- Mesmo padrão de políticas do bucket "ads": leitura pública, escrita restrita
-- a admins (profiles.is_admin = true). Ver components/trilha-icon.tsx, que
-- renderiza qualquer icone começando com http(s):// como imagem via URL.

INSERT INTO storage.buckets (id, name, public)
VALUES ('trilha-icones', 'trilha-icones', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "trilha-icones bucket public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'trilha-icones');

CREATE POLICY "trilha-icones bucket admin write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trilha-icones'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "trilha-icones bucket admin update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'trilha-icones'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "trilha-icones bucket admin delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trilha-icones'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );
