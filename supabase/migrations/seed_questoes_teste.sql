-- 30 questões do Teste de Conhecimento Católico (5 por tema). Execute no SQL
-- Editor do Supabase, depois de add_teste_conhecimento.sql.

INSERT INTO public.questoes_teste (tema, pergunta, opcoes, correta, explicacao, dificuldade) VALUES

-- ── Teologia ─────────────────────────────────────────────────────────────────
('teologia', 'O que é a Santíssima Trindade?',
 ARRAY['Deus se manifestando de três formas diferentes em momentos distintos', 'Três deuses distintos que governam juntos', 'Um só Deus em três Pessoas distintas: Pai, Filho e Espírito Santo', 'Uma crença apenas simbólica, sem realidade concreta'],
 2, 'A Trindade é o mistério central da fé cristã: um único Deus em três Pessoas distintas — Pai, Filho e Espírito Santo — iguais em natureza divina.', 'facil'),

('teologia', 'O que significa "Encarnação"?',
 ARRAY['A ressurreição de Jesus Cristo', 'O Filho de Deus assumindo a natureza humana, tornando-se verdadeiro homem sem deixar de ser Deus', 'A criação do mundo pelo Pai', 'A vinda do Espírito Santo em Pentecostes'],
 1, 'Na Encarnação, o Verbo de Deus assumiu a natureza humana no seio de Maria, permanecendo verdadeiro Deus e tornando-se verdadeiro homem.', 'medio'),

('teologia', 'O que são os atributos divinos?',
 ARRAY['Os nomes dados a Deus pelos profetas', 'Perfeições próprias da natureza de Deus, como onipotência, onisciência, onipresença e eternidade', 'Os dons do Espírito Santo', 'Os títulos litúrgicos usados para Jesus'],
 1, 'Os atributos divinos são as perfeições essenciais de Deus: Ele é onipotente, onisciente, onipresente e eterno.', 'medio'),

('teologia', 'O que é a graça santificante?',
 ARRAY['Um sentimento de paz momentâneo', 'Um dom material concedido aos santos', 'A participação na vida divina que nos torna filhos de Deus e templos do Espírito Santo', 'A recompensa dada apenas após a morte'],
 2, 'A graça santificante é um dom estável e sobrenatural que nos faz participar da própria vida de Deus, tornando-nos seus filhos adotivos.', 'dificil'),

('teologia', 'Quantas naturezas tem Jesus Cristo, segundo a fé católica?',
 ARRAY['Apenas a natureza divina', 'Apenas a natureza humana', 'Duas naturezas — divina e humana — unidas em uma só Pessoa, sem confusão nem separação', 'Três naturezas distintas'],
 2, 'Jesus Cristo é verdadeiro Deus e verdadeiro homem: possui duas naturezas, divina e humana, unidas na única Pessoa do Verbo, conforme definido no Concílio de Calcedônia (451).', 'dificil'),

-- ── Liturgia ─────────────────────────────────────────────────────────────────
('liturgia', 'Quantas partes principais tem a Santa Missa?',
 ARRAY['Uma parte única e contínua', 'Duas — a Liturgia da Palavra e a Liturgia Eucarística', 'Cinco partes independentes', 'Depende da paróquia'],
 1, 'A Missa se estrutura em duas grandes partes: a Liturgia da Palavra (leituras e homilia) e a Liturgia Eucarística (consagração e comunhão), unidas pelos ritos iniciais e finais.', 'facil'),

('liturgia', 'O que é a transubstanciação?',
 ARRAY['A troca do padre durante a celebração', 'A mudança da substância do pão e do vinho no Corpo e Sangue de Cristo, mantendo as aparências', 'A bênção final da Missa', 'A leitura do Evangelho'],
 1, 'Na transubstanciação, pela ação do Espírito Santo e as palavras da consagração, o pão e o vinho se tornam realmente o Corpo e o Sangue de Cristo, embora as aparências permaneçam as mesmas.', 'medio'),

('liturgia', 'Qual é a cor litúrgica usada no tempo do Advento?',
 ARRAY['Verde', 'Branco', 'Roxo (ou violeta)', 'Vermelho'],
 2, 'O roxo (ou violeta) é a cor litúrgica do Advento e da Quaresma, simbolizando penitência e preparação espiritual.', 'facil'),

('liturgia', 'O que é o Credo Niceno-Constantinopolitano?',
 ARRAY['Uma oração exclusiva dos sacerdotes', 'A profissão de fé recitada nas Missas dominicais e solenidades, que resume as principais verdades da fé', 'Um hino cantado apenas na Páscoa', 'O nome do primeiro concílio ecumênico'],
 1, 'O Credo Niceno-Constantinopolitano é a profissão de fé formulada nos Concílios de Niceia (325) e Constantinopla (381), rezada nas Missas dominicais e festivas.', 'medio'),

('liturgia', 'Quais são os sacramentos da iniciação cristã?',
 ARRAY['Batismo, Crisma (Confirmação) e Eucaristia', 'Batismo, Matrimônio e Ordem', 'Confissão, Unção dos Enfermos e Eucaristia', 'Apenas o Batismo'],
 0, 'Os três sacramentos da iniciação cristã — Batismo, Crisma e Eucaristia — lançam os fundamentos de toda vida cristã, incorporando o fiel a Cristo e à Igreja.', 'dificil'),

-- ── Bíblia Sagrada ───────────────────────────────────────────────────────────
('biblia', 'Quantos livros tem a Bíblia Católica?',
 ARRAY['66 livros', '73 livros — 46 do Antigo Testamento e 27 do Novo Testamento', '80 livros', '27 livros, apenas o Novo Testamento'],
 1, 'A Bíblia Católica reúne 73 livros: 46 no Antigo Testamento e 27 no Novo Testamento, incluindo os livros deuterocanônicos.', 'facil'),

('biblia', 'Quem escreveu o Quarto Evangelho?',
 ARRAY['Mateus', 'Marcos', 'Lucas', 'João'],
 3, 'O Quarto Evangelho é atribuído ao apóstolo João, com uma teologia mais contemplativa e centrada na divindade de Cristo.', 'facil'),

('biblia', 'O que significa "Pentateuco"?',
 ARRAY['Os cinco primeiros livros do Antigo Testamento, atribuídos a Moisés', 'Os cinco livros sapienciais', 'Os cinco Evangelhos', 'As cinco cartas de São Paulo'],
 0, 'Pentateuco (do grego "cinco rolos") designa os cinco primeiros livros da Bíblia: Gênesis, Êxodo, Levítico, Números e Deuteronômio.', 'medio'),

('biblia', 'Qual é um dos versículos mais conhecidos da Bíblia, que resume o amor de Deus pela humanidade?',
 ARRAY['Gênesis 1,1', 'João 3,16', 'Salmo 23,1', 'Apocalipse 21,1'],
 1, 'João 3,16 — "Deus amou tanto o mundo que deu o seu Filho único..." — é um dos versículos mais citados por resumir o amor de Deus revelado em Cristo.', 'medio'),

('biblia', 'Em que língua foi escrito originalmente o Novo Testamento?',
 ARRAY['Hebraico', 'Latim', 'Aramaico', 'Grego koiné'],
 3, 'O Novo Testamento foi escrito originalmente em grego koiné, a língua comum do mundo helenístico da época.', 'dificil'),

-- ── História da Igreja ───────────────────────────────────────────────────────
('historia', 'Em que período ocorreu o Concílio Vaticano II?',
 ARRAY['1870-1871', '1962-1965', '1545-1563', '325-381'],
 1, 'O Concílio Vaticano II foi realizado entre 1962 e 1965, convocado pelo Papa São João XXIII, trazendo renovação pastoral à Igreja.', 'medio'),

('historia', 'Quem foi o primeiro Papa?',
 ARRAY['São Paulo', 'São Pedro', 'São João', 'Santo Inácio de Antioquia'],
 1, 'São Pedro, apóstolo escolhido por Jesus, é considerado o primeiro Papa, a quem Cristo confiou as chaves do Reino dos Céus.', 'facil'),

('historia', 'O que foi o Cisma do Oriente?',
 ARRAY['A separação entre católicos e protestantes no século XVI', 'A separação entre a Igreja Católica e a Igreja Ortodoxa, ocorrida em 1054', 'A divisão entre Roma e Avinhão', 'O fim do Império Romano'],
 1, 'O Cisma do Oriente, em 1054, marcou a separação formal entre a Igreja Católica (Ocidente) e a Igreja Ortodoxa (Oriente).', 'medio'),

('historia', 'Quem proclamou o dogma da Imaculada Conceição?',
 ARRAY['Papa Pio IX, em 1854', 'Papa Leão XIII, em 1888', 'Papa Pio XII, em 1950', 'Papa São João Paulo II'],
 0, 'O Papa Pio IX proclamou o dogma da Imaculada Conceição de Maria em 1854, na bula "Ineffabilis Deus".', 'dificil'),

('historia', 'Em que século viveu São Francisco de Assis?',
 ARRAY['Século XI', 'Século XIII (1181/1182-1226)', 'Século XV', 'Século XVIII'],
 1, 'São Francisco de Assis viveu entre 1181/1182 e 1226, no século XIII, fundando a Ordem Franciscana.', 'facil'),

-- ── Teologia Moral ───────────────────────────────────────────────────────────
('moral', 'Quais são as virtudes cardeais?',
 ARRAY['Fé, Esperança, Caridade e Humildade', 'Prudência, Justiça, Fortaleza e Temperança', 'Paciência, Bondade, Mansidão e Fidelidade', 'Oração, Jejum, Esmola e Penitência'],
 1, 'As virtudes cardeais — Prudência, Justiça, Fortaleza e Temperança — são virtudes humanas fundamentais das quais derivam todas as outras virtudes morais.', 'facil'),

('moral', 'Quantos mandamentos tem o Decálogo?',
 ARRAY['Sete', 'Dez', 'Doze', 'Cinco'],
 1, 'O Decálogo, dado por Deus a Moisés no Monte Sinai, é composto por dez mandamentos.', 'facil'),

('moral', 'O que é pecado mortal?',
 ARRAY['Qualquer falha cotidiana sem maior gravidade', 'Um ato de matéria grave, cometido com plena consciência e livre consentimento', 'Um pensamento involuntário', 'Uma falta apenas contra a lei civil'],
 1, 'O pecado mortal exige três condições simultâneas: matéria grave, plena consciência e deliberado consentimento — destruindo a caridade no coração do homem.', 'medio'),

('moral', 'Quais são as obras de misericórdia corporais?',
 ARRAY['Ensinar, aconselhar, consolar, perdoar, suportar e rezar', 'Alimentar os famintos, dar de beber aos sedentos, vestir os nus, acolher os peregrinos, visitar os enfermos e presos, e sepultar os mortos', 'Rezar o terço, jejuar e fazer esmolas', 'Confessar-se e comungar frequentemente'],
 1, 'As sete obras de misericórdia corporais atendem às necessidades materiais do próximo: alimentar, dar de beber, vestir, acolher, visitar doentes e presos, e sepultar os mortos.', 'dificil'),

('moral', 'O que é a lei natural?',
 ARRAY['As leis civis promulgadas pelos Estados', 'A lei moral inscrita por Deus na razão humana, reconhecível por todo homem de boa vontade', 'Um conjunto de rituais litúrgicos', 'As regras estabelecidas por concílios ecumênicos'],
 1, 'A lei natural é a lei moral que Deus gravou no coração e na razão do ser humano, permitindo discernir o bem e o mal mesmo antes de qualquer revelação.', 'dificil'),

-- ── Santos ───────────────────────────────────────────────────────────────────
('santos', 'Qual é a padroeira do Brasil?',
 ARRAY['Santa Teresinha do Menino Jesus', 'Nossa Senhora Aparecida', 'Santa Rita de Cássia', 'Nossa Senhora de Fátima'],
 1, 'Nossa Senhora Aparecida é a padroeira do Brasil, com festa celebrada em 12 de outubro.', 'facil'),

('santos', 'Em que data é celebrado o Dia de Todos os Santos?',
 ARRAY['2 de novembro', '1º de novembro', '31 de outubro', '8 de dezembro'],
 1, 'O Dia de Todos os Santos é celebrado em 1º de novembro, honrando todos os santos, canonizados ou não, que já contemplam a Deus no Céu.', 'facil'),

('santos', 'Qual santo é conhecido pelo amor à pobreza, à natureza e aos animais?',
 ARRAY['São Bento', 'São Francisco de Assis', 'São Jerônimo', 'São Tomás de Aquino'],
 1, 'São Francisco de Assis é lembrado por seu amor radical à pobreza evangélica e por sua fraternidade com toda a criação, incluindo os animais.', 'medio'),

('santos', 'Qual santa foi declarada pelo Papa Pio XII padroeira da televisão, sendo também lembrada de forma popular como padroeira da internet?',
 ARRAY['Santa Clara de Assis', 'Santa Mônica', 'Santa Rita de Cássia', 'Santa Edith Stein'],
 0, 'O Papa Pio XII declarou Santa Clara de Assis padroeira da televisão em 1958; por extensão popular, ela também é lembrada como padroeira da internet e das comunicações.', 'dificil'),

('santos', 'Santa Teresa de Ávila é Doutora da Igreja. O que esse título significa?',
 ARRAY['Que ela foi médica antes de ser religiosa', 'Um título honorífico dado a santos cujos escritos e ensinamentos têm valor especial para toda a Igreja', 'Que ela fundou uma universidade', 'Um título dado apenas a papas'],
 1, 'Doutor da Igreja é um título concedido pelo Magistério a santos de doutrina eminente e santidade excepcional, cujos escritos iluminam toda a Igreja — Santa Teresa de Ávila foi a primeira mulher a recebê-lo, em 1970.', 'dificil');
