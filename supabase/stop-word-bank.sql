-- ============================================================
-- SantosPlay — Stop Católico · Base de Palavras
-- Letras sorteadas: A B C D E F G H J L M N O P R S T V
-- ============================================================

-- ── Schema ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stop_word_bank (
  id       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  category text    NOT NULL,  -- chave da categoria (ex: 'santo', 'oracao')
  letter   char(1) NOT NULL,  -- letra maiúscula (ex: 'A')
  word     text    NOT NULL,
  UNIQUE(category, letter, word)
);
ALTER TABLE stop_word_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura_auth" ON stop_word_bank;
CREATE POLICY "leitura_auth" ON stop_word_bank FOR SELECT USING (auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS idx_wb_cat_letter ON stop_word_bank(category, letter);

-- ── Migração: remove categorias substituídas ─────────────────
-- Execute apenas uma vez se o banco já contiver dados antigos:
--   DELETE FROM stop_word_bank WHERE category IN ('apostolo','dom','misericord','veste');

-- ── Dados ────────────────────────────────────────────────────
INSERT INTO stop_word_bank (category, letter, word) VALUES

-- ════════════════════════════════════════════════════════════
-- 1. fundador — Fundador de ordem religiosa
--    Cobertura: A B C D F J L M N P R T V  (E G H O S = VAZIO)
-- ════════════════════════════════════════════════════════════
('fundador','A','Agostinho'),          -- Ordem de Santo Agostinho
('fundador','A','Afonso de Ligório'),  -- Redentoristas
('fundador','B','Bento'),              -- Beneditinos (OSB)
('fundador','B','Bruno'),              -- Cartuxa
('fundador','C','Clara de Assis'),     -- Clarissas
('fundador','C','Camilo de Lellis'),   -- Camilianos
('fundador','D','Domingos'),           -- Dominicanos (OP)
('fundador','F','Francisco de Assis'), -- Franciscanos (OFM)
('fundador','F','Filipe Neri'),        -- Congregação do Oratório
('fundador','J','João Bosco'),         -- Salesianos (SDB)
('fundador','J','João de Deus'),       -- Irmãos de São João de Deus
('fundador','J','José Calasanzio'),    -- Escolápios
('fundador','L','Luís Maria de Montfort'), -- Montfortianos
('fundador','M','Marcelino Champagnat'),   -- Maristas
('fundador','N','Norberto'),           -- Premonstratenses
('fundador','P','Paulo da Cruz'),      -- Passionistas
('fundador','P','Pedro Nolasco'),      -- Mercedários
('fundador','R','Roberto de Molesme'),-- Cistercienses
('fundador','R','Romualdo'),           -- Camaldulenses
('fundador','T','Teresa de Ávila'),    -- Carmelitas Descalças (OCD)
('fundador','V','Vicente de Paulo'),   -- Vicentinos / Lazaristas

-- ════════════════════════════════════════════════════════════
-- 2. igrejafe — Igreja e fé
--    Cobertura: todas as 18 letras ✅
-- ════════════════════════════════════════════════════════════
('igrejafe','A','Aliança'),
('igrejafe','A','Alma'),
('igrejafe','A','Adoração'),
('igrejafe','A','Apóstolo'),
('igrejafe','B','Batismo'),
('igrejafe','B','Bíblia'),
('igrejafe','B','Bênção'),
('igrejafe','C','Credo'),
('igrejafe','C','Cristo'),
('igrejafe','C','Comunhão'),
('igrejafe','C','Confissão'),
('igrejafe','D','Deus'),
('igrejafe','D','Dízimo'),
('igrejafe','D','Discípulo'),
('igrejafe','E','Eucaristia'),
('igrejafe','E','Evangelização'),
('igrejafe','E','Encarnação'),
('igrejafe','F','Fé'),
('igrejafe','F','Fidelidade'),
('igrejafe','F','Família'),
('igrejafe','G','Graça'),
('igrejafe','G','Glória'),
('igrejafe','H','Homilia'),
('igrejafe','H','Heresia'),
('igrejafe','H','Hierarquia'),
('igrejafe','J','Jesus'),
('igrejafe','J','Jejum'),
('igrejafe','J','Juízo Final'),
('igrejafe','L','Liturgia'),
('igrejafe','L','Lei de Deus'),
('igrejafe','M','Missão'),
('igrejafe','M','Maria'),
('igrejafe','M','Mistério'),
('igrejafe','N','Novena'),
('igrejafe','N','Natividade'),
('igrejafe','O','Oração'),
('igrejafe','O','Ordenação'),
('igrejafe','O','Oblação'),
('igrejafe','P','Papa'),
('igrejafe','P','Paróquia'),
('igrejafe','P','Peregrinação'),
('igrejafe','P','Pecado'),
('igrejafe','R','Ressurreição'),
('igrejafe','R','Redenção'),
('igrejafe','R','Revelação'),
('igrejafe','S','Sacramento'),
('igrejafe','S','Salvação'),
('igrejafe','S','Santidade'),
('igrejafe','T','Trindade'),
('igrejafe','T','Tradição'),
('igrejafe','T','Transfiguração'),
('igrejafe','V','Virgem'),
('igrejafe','V','Vocação'),
('igrejafe','V','Verdade'),

-- ════════════════════════════════════════════════════════════
-- 3. missa — Coisas da Santa Missa
--    Cobertura: A B C D E F G H L M O P R S  (J N T V = VAZIO)
-- ════════════════════════════════════════════════════════════
('missa','A','Aclamação'),
('missa','A','Aleluia'),
('missa','A','Amém'),
('missa','B','Bênção Final'),
('missa','C','Consagração'),
('missa','C','Credo'),
('missa','C','Comunhão'),
('missa','D','Doxologia'),
('missa','D','Diácono'),
('missa','E','Evangelho'),
('missa','E','Epístola'),
('missa','E','Entrada'),
('missa','F','Fração do Pão'),
('missa','G','Glória'),
('missa','G','Genuflexão'),
('missa','H','Homilia'),
('missa','H','Hóstia'),
('missa','L','Leitura'),
('missa','L','Lavabo'),
('missa','L','Liturgia da Palavra'),
('missa','M','Missal'),
('missa','M','Mistério da Fé'),
('missa','O','Ofertório'),
('missa','P','Prefácio'),
('missa','P','Paz'),
('missa','P','Procissão'),
('missa','R','Rito'),
('missa','R','Responso'),
('missa','S','Sanctus'),
('missa','S','Salmo Responsorial'),
('missa','S','Silêncio'),

-- ════════════════════════════════════════════════════════════
-- 4. objetolit — Objeto litúrgico
--    Cobertura: A B C E H L M N O P R S T V  (D F G J = VAZIO)
-- ════════════════════════════════════════════════════════════
('objetolit','A','Altar'),
('objetolit','A','Aspersório'),
('objetolit','B','Báculo'),
('objetolit','C','Cálice'),
('objetolit','C','Castiçal'),
('objetolit','C','Cruz'),
('objetolit','C','Cibório'),
('objetolit','C','Corporal'),
('objetolit','E','Evangeliário'),
('objetolit','H','Hisopo'),
('objetolit','L','Lâmpada do Santuário'),
('objetolit','L','Lecionário'),
('objetolit','M','Missal'),
('objetolit','N','Naveta'),
('objetolit','O','Ostensório'),
('objetolit','P','Patena'),
('objetolit','P','Píxide'),
('objetolit','P','Purificador'),
('objetolit','R','Relicário'),
('objetolit','S','Sacrário'),
('objetolit','S','Sino'),
('objetolit','T','Turíbulo'),
('objetolit','T','Tocheiro'),
('objetolit','V','Véu'),
('objetolit','V','Vela'),

-- ════════════════════════════════════════════════════════════
-- 5. partesigrj — Partes da igreja
--    Cobertura: A B C F N O P R S T V  (D E G H J L M = VAZIO)
-- ════════════════════════════════════════════════════════════
('partesigrj','A','Abside'),
('partesigrj','A','Átrio'),
('partesigrj','B','Batistério'),
('partesigrj','C','Capela'),
('partesigrj','C','Coro'),
('partesigrj','C','Cripta'),
('partesigrj','C','Claustro'),
('partesigrj','C','Campanário'),
('partesigrj','F','Fachada'),
('partesigrj','N','Nave'),
('partesigrj','O','Oratório'),
('partesigrj','P','Púlpito'),
('partesigrj','P','Pórtico'),
('partesigrj','P','Presbítério'),
('partesigrj','R','Rosácea'),
('partesigrj','S','Sacristia'),
('partesigrj','S','Santuário'),
('partesigrj','T','Torre'),
('partesigrj','T','Transepto'),
('partesigrj','V','Vitral'),
('partesigrj','V','Vestíbulo'),

-- ════════════════════════════════════════════════════════════
-- 6. titulo_maria — Título de Nossa Senhora
--    Cobertura: A B C D E F G H L M N O P R S T V  (J = VAZIO)
-- ════════════════════════════════════════════════════════════
('titulo_maria','A','Aparecida'),
('titulo_maria','A','Auxiliadora'),
('titulo_maria','A','Assunção'),
('titulo_maria','B','Boa Morte'),
('titulo_maria','B','Bom Conselho'),
('titulo_maria','C','Conceição'),
('titulo_maria','C','Carmo'),
('titulo_maria','C','Consoladora'),
('titulo_maria','D','Dores'),
('titulo_maria','D','Das Graças'),
('titulo_maria','E','Esperança'),
('titulo_maria','E','Expectação'),
('titulo_maria','F','Fátima'),
('titulo_maria','G','Guadalupe'),
('titulo_maria','G','Graça'),
('titulo_maria','H','Horto'),
('titulo_maria','L','Loreto'),
('titulo_maria','L','Lourdes'),
('titulo_maria','M','Mãe de Deus'),
('titulo_maria','M','Misericórdia'),
('titulo_maria','M','Maternidade'),
('titulo_maria','N','Nazaré'),
('titulo_maria','N','Navegantes'),
('titulo_maria','O','Ó'),
('titulo_maria','P','Paz'),
('titulo_maria','P','Penha'),
('titulo_maria','P','Perpétua'),
('titulo_maria','R','Rainha'),
('titulo_maria','R','Remédios'),
('titulo_maria','R','Rosário'),
('titulo_maria','S','Saúde'),
('titulo_maria','S','Socorro'),
('titulo_maria','S','Santíssima'),
('titulo_maria','T','Trindade'),
('titulo_maria','V','Virgem'),
('titulo_maria','V','Visitação'),
('titulo_maria','V','Vitória'),

-- ════════════════════════════════════════════════════════════
-- 7. simbolo — Símbolo católico
--    Cobertura: A C E L M O P R T V  (B D F G H J N S = VAZIO)
-- ════════════════════════════════════════════════════════════
('simbolo','A','Âncora'),
('simbolo','A','Alpha e Ômega'),
('simbolo','C','Cruz'),
('simbolo','C','Chi-Rho'),
('simbolo','C','Cordeiro'),
('simbolo','C','Chama'),
('simbolo','E','Espiga de Trigo'),
('simbolo','E','Estrela'),
('simbolo','L','Lírio'),
('simbolo','L','Leão'),
('simbolo','L','Lâmpada'),
('simbolo','M','Monograma de Maria'),
('simbolo','O','Oliva'),
('simbolo','P','Peixe'),
('simbolo','P','Pomba'),
('simbolo','P','Palma'),
('simbolo','P','Pão'),
('simbolo','R','Rosa Mística'),
('simbolo','T','Tau'),
('simbolo','T','Trevo'),
('simbolo','V','Vinha'),
('simbolo','V','Vela'),

-- ════════════════════════════════════════════════════════════
-- 8. oracao — Oração
--    Cobertura: A B C D E G L M O P R S T V  (F H J N = VAZIO)
-- ════════════════════════════════════════════════════════════
('oracao','A','Ave-Maria'),
('oracao','A','Ato de Contrição'),
('oracao','A','Angelus'),
('oracao','B','Bênção da Mesa'),
('oracao','C','Confiteor'),
('oracao','C','Credo'),
('oracao','D','De Profundis'),
('oracao','D','Divina Misericórdia'),
('oracao','E','Exsultet'),
('oracao','G','Glória ao Pai'),
('oracao','G','Glória a Deus nas Alturas'),
('oracao','L','Ladainha'),
('oracao','L','Litania'),
('oracao','M','Magnificat'),
('oracao','M','Memorare'),
('oracao','M','Miserere'),
('oracao','O','Ofício Divino'),
('oracao','P','Pai Nosso'),
('oracao','R','Rosário'),
('oracao','R','Regina Coeli'),
('oracao','S','Salve Rainha'),
('oracao','S','Sub Tuum'),
('oracao','S','Salmo'),
('oracao','T','Terço'),
('oracao','T','Trísagio'),
('oracao','V','Via Sacra'),
('oracao','V','Vésperas'),

-- ════════════════════════════════════════════════════════════
-- 9. virtude — Virtude cristã
--    Cobertura: A B C D E F G H J L M O P R S T V  (N = VAZIO)
-- ════════════════════════════════════════════════════════════
('virtude','A','Amor'),
('virtude','A','Abnegação'),
('virtude','A','Alegria'),
('virtude','B','Bondade'),
('virtude','B','Benevolência'),
('virtude','C','Caridade'),
('virtude','C','Castidade'),
('virtude','C','Compaixão'),
('virtude','D','Docilidade'),
('virtude','D','Desprendimento'),
('virtude','E','Esperança'),
('virtude','F','Fé'),
('virtude','F','Fidelidade'),
('virtude','F','Fortaleza'),
('virtude','F','Fraternidade'),
('virtude','G','Generosidade'),
('virtude','G','Gratidão'),
('virtude','H','Humildade'),
('virtude','H','Honestidade'),
('virtude','J','Justiça'),
('virtude','L','Lealdade'),
('virtude','L','Longanimidade'),
('virtude','M','Misericórdia'),
('virtude','M','Mansidão'),
('virtude','O','Obediência'),
('virtude','P','Paciência'),
('virtude','P','Prudência'),
('virtude','P','Perseverança'),
('virtude','P','Piedade'),
('virtude','R','Resignação'),
('virtude','R','Retidão'),
('virtude','S','Santidade'),
('virtude','S','Sinceridade'),
('virtude','S','Sobriedade'),
('virtude','T','Temperança'),
('virtude','T','Tolerância'),
('virtude','V','Veracidade'),

-- ════════════════════════════════════════════════════════════
-- 10. pecado — Pecado
--     Cobertura: A B C D E F G H L M O P R S T V  (J N = VAZIO)
-- ════════════════════════════════════════════════════════════
('pecado','A','Avareza'),
('pecado','A','Adultério'),
('pecado','A','Arrogância'),
('pecado','B','Blasfêmia'),
('pecado','C','Cobiça'),
('pecado','C','Calúnia'),
('pecado','C','Crueldade'),
('pecado','D','Desonestidade'),
('pecado','D','Desespero'),
('pecado','E','Egoísmo'),
('pecado','E','Embriaguez'),
('pecado','E','Escândalo'),
('pecado','F','Falsidade'),
('pecado','F','Fornicação'),
('pecado','F','Furto'),
('pecado','G','Gula'),
('pecado','G','Ganância'),
('pecado','H','Homicídio'),
('pecado','H','Heresia'),
('pecado','H','Hipocrisia'),
('pecado','L','Luxúria'),
('pecado','M','Mentira'),
('pecado','M','Murmuração'),
('pecado','O','Orgulho'),
('pecado','O','Omissão'),
('pecado','P','Preguiça'),
('pecado','P','Perjúrio'),
('pecado','R','Roubo'),
('pecado','S','Soberba'),
('pecado','S','Sensualidade'),
('pecado','T','Traição'),
('pecado','V','Vaidade'),
('pecado','V','Vingança'),

-- ════════════════════════════════════════════════════════════
-- 11. livro_biblia — Livro da Bíblia (substituiu: dom)
--     Cobertura: A B C D E F G H J L M N O P R S T  (V = VAZIO)
-- ════════════════════════════════════════════════════════════
('livro_biblia','A','Atos dos Apóstolos'),
('livro_biblia','A','Amós'),
('livro_biblia','A','Apocalipse'),
('livro_biblia','B','Baruc'),
('livro_biblia','C','Colossenses'),
('livro_biblia','C','Crônicas'),
('livro_biblia','D','Deuteronômio'),
('livro_biblia','D','Daniel'),
('livro_biblia','E','Efésios'),
('livro_biblia','E','Ester'),
('livro_biblia','E','Ezequiel'),
('livro_biblia','F','Filipenses'),
('livro_biblia','F','Filemom'),
('livro_biblia','G','Gênesis'),
('livro_biblia','G','Gálatas'),
('livro_biblia','H','Hebreus'),
('livro_biblia','J','João'),
('livro_biblia','J','Josué'),
('livro_biblia','J','Juízes'),
('livro_biblia','J','Jeremias'),
('livro_biblia','J','Jó'),
('livro_biblia','L','Lucas'),
('livro_biblia','L','Levítico'),
('livro_biblia','M','Mateus'),
('livro_biblia','M','Marcos'),
('livro_biblia','M','Miquéias'),
('livro_biblia','N','Números'),
('livro_biblia','N','Neemias'),
('livro_biblia','N','Naum'),
('livro_biblia','O','Oséias'),
('livro_biblia','P','Provérbios'),
('livro_biblia','P','Primeira Pedro'),
('livro_biblia','R','Romanos'),
('livro_biblia','R','Rute'),
('livro_biblia','S','Salmos'),
('livro_biblia','S','Samuel'),
('livro_biblia','S','Sabedoria'),
('livro_biblia','S','Sirácides'),
('livro_biblia','T','Tobias'),
('livro_biblia','T','Timóteo'),
('livro_biblia','T','Tito'),

-- ════════════════════════════════════════════════════════════
-- 12. lugar_sagrado — Lugar sagrado / Cidade bíblica (substituiu: misericord)
--     Cobertura: todas as 18 letras ✅
-- ════════════════════════════════════════════════════════════
('lugar_sagrado','A','Antioquia'),
('lugar_sagrado','A','Arimateia'),
('lugar_sagrado','A','Alexandria'),
('lugar_sagrado','B','Belém'),
('lugar_sagrado','B','Betsaida'),
('lugar_sagrado','B','Betel'),
('lugar_sagrado','B','Betânia'),
('lugar_sagrado','C','Cafarnaum'),
('lugar_sagrado','C','Corinto'),
('lugar_sagrado','C','Calvário'),
('lugar_sagrado','D','Damasco'),
('lugar_sagrado','E','Emaús'),
('lugar_sagrado','E','Egito'),
('lugar_sagrado','F','Filipos'),
('lugar_sagrado','G','Galileia'),
('lugar_sagrado','G','Gólgota'),
('lugar_sagrado','G','Getsêmani'),
('lugar_sagrado','H','Hebrom'),
('lugar_sagrado','J','Jerusalém'),
('lugar_sagrado','J','Jericó'),
('lugar_sagrado','J','Jordão'),
('lugar_sagrado','L','Laodiceia'),
('lugar_sagrado','M','Monte Sinai'),
('lugar_sagrado','M','Monte Tabor'),
('lugar_sagrado','M','Macedônia'),
('lugar_sagrado','N','Nazaré'),
('lugar_sagrado','N','Nínive'),
('lugar_sagrado','O','Oreb'),
('lugar_sagrado','P','Patmos'),
('lugar_sagrado','P','Palestina'),
('lugar_sagrado','R','Roma'),
('lugar_sagrado','S','Samaria'),
('lugar_sagrado','S','Sião'),
('lugar_sagrado','S','Sodoma'),
('lugar_sagrado','T','Tessalônica'),
('lugar_sagrado','T','Tabor'),
('lugar_sagrado','T','Tiro'),
('lugar_sagrado','V','Vale de Josafá'),

-- ════════════════════════════════════════════════════════════
-- 13. santo — Santo que começa com a letra
--     Cobertura: todas as 18 letras ✅
-- ════════════════════════════════════════════════════════════
('santo','A','Antônio'),
('santo','A','Agostinho'),
('santo','A','Ana'),
('santo','A','André'),
('santo','A','Afonso'),
('santo','B','Bento'),
('santo','B','Bernadette'),
('santo','B','Boaventura'),
('santo','B','Brás'),
('santo','C','Clara'),
('santo','C','Catarina'),
('santo','C','Cecília'),
('santo','C','Carlos Borromeo'),
('santo','D','Domingos'),
('santo','D','Damião'),
('santo','D','Dimas'),
('santo','E','Estêvão'),
('santo','E','Expedito'),
('santo','E','Edwiges'),
('santo','F','Francisco de Assis'),
('santo','F','Faustina'),
('santo','F','Filipe Néri'),
('santo','G','Gertrudes'),
('santo','G','Gregório'),
('santo','G','Gabriel'),
('santo','H','Henrique'),
('santo','H','Hilário'),
('santo','J','João'),
('santo','J','José'),
('santo','J','Jerônimo'),
('santo','J','Joaquim'),
('santo','J','Jorge'),
('santo','L','Luís de Montfort'),
('santo','L','Lúcia'),
('santo','L','Lucas'),
('santo','M','Maria Goretti'),
('santo','M','Marcos'),
('santo','M','Mateus'),
('santo','M','Madalena'),
('santo','N','Nicolau'),
('santo','O','Onofre'),
('santo','O','Osvaldo'),
('santo','P','Pedro'),
('santo','P','Paulo'),
('santo','P','Pio de Pietrelcina'),
('santo','P','Perpétua'),
('santo','R','Rita'),
('santo','R','Roque'),
('santo','R','Rosália'),
('santo','S','Sebastião'),
('santo','S','Sara'),
('santo','S','Simeão'),
('santo','T','Teresa de Ávila'),
('santo','T','Tomás de Aquino'),
('santo','T','Tiago'),
('santo','V','Vicente de Paulo'),
('santo','V','Valentim'),
('santo','V','Vito'),

-- ════════════════════════════════════════════════════════════
-- 14. papa — Papa que começa com a letra
--     Cobertura: A B C D F G H J L M N P S T V  (E O R = VAZIO)
-- ════════════════════════════════════════════════════════════
('papa','A','Adriano'),
('papa','A','Alexandre'),
('papa','B','Bento XVI'),
('papa','B','Bonifácio'),
('papa','C','Celestino V'),
('papa','C','Clemente'),
('papa','D','Dâmaso'),
('papa','F','Francisco'),
('papa','G','Gregório Magno'),
('papa','G','Gregório VII'),
('papa','G','Gregório XIII'),
('papa','H','Honório'),
('papa','H','Hilário'),
('papa','J','João XXIII'),
('papa','J','João Paulo II'),
('papa','L','Leão Magno'),
('papa','L','Leão XIII'),
('papa','M','Martinho V'),
('papa','N','Nicolau'),
('papa','P','Pio X'),
('papa','P','Pio XII'),
('papa','P','Paulo VI'),
('papa','P','Pedro'),
('papa','S','Sisto V'),
('papa','S','Sérgio'),
('papa','T','Telesforo'),
('papa','V','Vítor'),

-- ════════════════════════════════════════════════════════════
-- 15. personagem_biblico — Personagem bíblico (substituiu: apostolo)
--     Cobertura: todas as 18 letras ✅
-- ════════════════════════════════════════════════════════════
('personagem_biblico','A','Abraão'),
('personagem_biblico','A','Adão'),
('personagem_biblico','A','Ana'),
('personagem_biblico','A','Abel'),
('personagem_biblico','B','Barnabé'),
('personagem_biblico','B','Bartolomeu'),
('personagem_biblico','B','Boaz'),
('personagem_biblico','C','Caifás'),
('personagem_biblico','C','Cornélio'),
('personagem_biblico','C','Caleb'),
('personagem_biblico','D','Davi'),
('personagem_biblico','D','Daniel'),
('personagem_biblico','D','Débora'),
('personagem_biblico','D','Dalila'),
('personagem_biblico','E','Elias'),
('personagem_biblico','E','Eliseu'),
('personagem_biblico','E','Ester'),
('personagem_biblico','E','Ezequiel'),
('personagem_biblico','F','Faraó'),
('personagem_biblico','F','Filipe'),
('personagem_biblico','G','Golias'),
('personagem_biblico','G','Gedeão'),
('personagem_biblico','G','Gabriel'),
('personagem_biblico','H','Herodes'),
('personagem_biblico','H','Habacuc'),
('personagem_biblico','J','Jesus'),
('personagem_biblico','J','José'),
('personagem_biblico','J','Jonas'),
('personagem_biblico','J','João'),
('personagem_biblico','J','Jacó'),
('personagem_biblico','L','Lázaro'),
('personagem_biblico','L','Lot'),
('personagem_biblico','L','Lia'),
('personagem_biblico','M','Moisés'),
('personagem_biblico','M','Maria'),
('personagem_biblico','M','Marta'),
('personagem_biblico','M','Micaias'),
('personagem_biblico','N','Noé'),
('personagem_biblico','N','Natã'),
('personagem_biblico','N','Nicodemos'),
('personagem_biblico','O','Oseias'),
('personagem_biblico','P','Pedro'),
('personagem_biblico','P','Paulo'),
('personagem_biblico','P','Pilatos'),
('personagem_biblico','R','Rute'),
('personagem_biblico','R','Rafael'),
('personagem_biblico','R','Rebeca'),
('personagem_biblico','S','Salomão'),
('personagem_biblico','S','Samuel'),
('personagem_biblico','S','Sara'),
('personagem_biblico','S','Simeão'),
('personagem_biblico','T','Tomé'),
('personagem_biblico','T','Tobias'),
('personagem_biblico','T','Tiago'),
('personagem_biblico','V','Vasti'),
('personagem_biblico','V','Virgem Maria')

ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- SUMÁRIO DE COMBINAÇÕES GENUINAMENTE VAZIAS
-- (letra O incluída nas 18 letras sorteáveis)
-- ════════════════════════════════════════════════════════════
--
-- fundador    + E G H O S         = VAZIO (5 letras)
-- missa       + J N T V           = VAZIO (4 letras)
-- objetolit   + D F G J           = VAZIO (4 letras)
-- partesigrj  + D E G H J L M     = VAZIO (7 letras)
-- titulo_maria+ J                 = VAZIO (1 letra)   ← novo
-- simbolo     + B D F G H J N S   = VAZIO (8 letras)
-- oracao      + F H J N           = VAZIO (4 letras)
-- virtude     + N                 = VAZIO (1 letra)
-- pecado      + J N               = VAZIO (2 letras)
-- livro_biblia+ V                 = VAZIO (1 letra)   ← novo
-- lugar_sagrado                   = cobertura total ✅ ← novo
-- santo                           = cobertura total ✅
-- papa        + E O R             = VAZIO (3 letras)
-- personagem_biblico              = cobertura total ✅ ← novo
-- ============================================================
