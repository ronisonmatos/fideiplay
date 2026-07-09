-- Lote 2 do Teste de Conhecimento Católico: +90 questões (15 por tema),
-- completando cada tema para 20 perguntas (5 do lote original + 15 novas).
-- Execute no SQL Editor do Supabase, depois de seed_questoes_teste.sql.
-- Nenhum tópico repete os já cobertos no lote original.

INSERT INTO public.questoes_teste (tema, pergunta, opcoes, correta, explicacao, dificuldade) VALUES

-- ── Teologia ─────────────────────────────────────────────────────────────────
('teologia', 'Quais são as três virtudes teologais?',
 ARRAY['Fé, Esperança e Caridade', 'Prudência, Justiça e Fortaleza', 'Humildade, Paciência e Mansidão', 'Oração, Jejum e Esmola'],
 0, 'As virtudes teologais — Fé, Esperança e Caridade — têm Deus como origem, motivo e objeto direto, sendo infundidas por Ele na alma no Batismo.', 'facil'),

('teologia', 'O que é a fé, segundo a Carta aos Hebreus?',
 ARRAY['Um sentimento de conforto diante do sofrimento', 'A garantia daquilo que se espera e a prova das coisas que não se veem', 'A obediência cega às leis da Igreja', 'Um conjunto de rituais praticados em comunidade'],
 1, 'Hebreus 11,1 define a fé como "a garantia daquilo que se espera e a prova das coisas que não se veem" — uma adesão pessoal e livre a Deus.', 'facil'),

('teologia', 'O que a Igreja Católica entende por "Céu"?',
 ARRAY['Um estado de felicidade puramente simbólico', 'Um lugar físico situado acima das nuvens', 'A comunhão de vida e amor com a Trindade, com Maria, os anjos e os santos', 'A recompensa dada apenas aos religiosos consagrados'],
 2, 'O Céu é a comunhão perfeita e eterna de vida e amor com a Santíssima Trindade, com a Virgem Maria, os anjos e todos os santos.', 'facil'),

('teologia', 'O que significa dizer que a Igreja é "católica"?',
 ARRAY['Que ela existe apenas em Roma', 'Que ela segue exclusivamente o rito latino', 'Que ela foi fundada no século XVI', 'Que ela é universal, destinada a todos os povos de todos os tempos'],
 3, '"Católica" vem do grego "katholikós", que significa universal — a Igreja é enviada a todos os povos e todas as épocas, sem exclusão.', 'facil'),

('teologia', 'Quem, segundo a fé católica, é o autor de toda a criação?',
 ARRAY['Deus Uno e Trino — Pai, Filho e Espírito Santo agindo em unidade', 'Apenas o Pai, sem participação do Filho e do Espírito', 'Os anjos, por delegação divina', 'Um princípio impessoal e eterno chamado Logos'],
 0, 'A criação é obra comum das três Pessoas divinas, embora seja apropriada de modo especial ao Pai — Filho e Espírito Santo participam plenamente do ato criador.', 'facil'),

('teologia', 'O que é o inferno, segundo a doutrina católica?',
 ARRAY['Um estado temporário de purificação antes do Céu', 'A separação eterna e definitiva de Deus, escolhida por quem morre em pecado mortal não arrependido', 'Um castigo aplicado apenas aos que nunca ouviram falar de Cristo', 'Um símbolo usado só para fins pedagógicos, sem realidade após a morte'],
 1, 'O inferno é o estado de autoexclusão definitiva da comunhão com Deus, consequência de morrer livre e conscientemente em pecado mortal sem arrependimento.', 'facil'),

('teologia', 'O que é o pecado original?',
 ARRAY['Um pecado pessoal cometido por cada criança ao nascer', 'Uma tendência ao mal presente apenas em algumas pessoas', 'O estado de privação da graça original em que nasce todo ser humano, herdado da desobediência de Adão', 'Uma lenda simbólica sem consequência real na natureza humana'],
 2, 'O pecado original não é um ato pessoal, mas o estado de natureza privada da graça e da santidade originais, transmitido a toda a humanidade desde Adão.', 'medio'),

('teologia', 'O que é a Providência Divina?',
 ARRAY['A crença de que Deus abandonou o mundo após criá-lo', 'Um sinônimo de sorte ou destino cego', 'A intervenção de Deus apenas em situações milagrosas', 'O governo amoroso e sábio de Deus sobre toda a criação, conduzindo-a ao seu fim'],
 3, 'A Providência é a disposição pela qual Deus conduz suas criaturas, com sabedoria e amor, à perfeição a que as destina, respeitando sua liberdade.', 'medio'),

('teologia', 'O que é a Ressurreição da carne, professada no Credo?',
 ARRAY['A fé de que, no fim dos tempos, os mortos ressuscitarão com seus próprios corpos, transformados e glorificados', 'A crença de que a alma reencarna em outro corpo', 'Um símbolo apenas espiritual, sem realidade corporal', 'A ressurreição exclusiva de Jesus Cristo, sem aplicação aos demais homens'],
 0, 'A Igreja professa que, na Parusia, os corpos dos mortos ressuscitarão e serão reunidos às suas almas, transformados à semelhança do corpo glorioso de Cristo.', 'medio'),

('teologia', 'O que é a Revelação Divina?',
 ARRAY['O conjunto de descobertas científicas compatíveis com a fé', 'O modo pelo qual Deus se manifesta e comunica livremente o mistério de seu desígnio, culminando em Jesus Cristo', 'Apenas os textos proféticos do Antigo Testamento', 'Um sinônimo de tradição cultural cristã'],
 1, 'A Revelação é a autocomunicação livre de Deus à humanidade, transmitida pela Sagrada Escritura e pela Tradição, e que atinge sua plenitude em Cristo.', 'medio'),

('teologia', 'Qual a diferença entre dogma e doutrina teológica na Igreja Católica?',
 ARRAY['Não existe diferença, são sinônimos', 'Dogma é o que os padres pregam; doutrina é só o que está na Bíblia', 'O dogma é uma verdade definida infalivelmente pelo Magistério como revelada por Deus; a doutrina teológica é reflexão que pode ser aprofundada ou revisada', 'Dogma é usado só na Igreja Ortodoxa'],
 2, 'O dogma é uma verdade de fé proposta infalivelmente como revelada por Deus, exigindo assentimento pleno; outras doutrinas teológicas podem admitir desenvolvimento e debate legítimo.', 'medio'),

('teologia', 'O que ensina o dogma da Assunção de Nossa Senhora, proclamado em 1950?',
 ARRAY['Que Maria nunca morreu, sendo levada viva diretamente ao Céu em corpo e alma', 'Que Maria ressuscitou três dias após sua morte, como Jesus', 'Que Maria subiu aos Céus por seus próprios méritos, sem intervenção divina', 'Que, ao final de sua vida terrena, Maria foi elevada ao Céu em corpo e alma'],
 3, 'O dogma proclamado pelo Papa Pio XII em 1950 ensina que Maria, terminado o curso de sua vida terrena, foi assunta em corpo e alma à glória celeste — distinta da Ascensão de Jesus, que subiu ao Céu por poder próprio.', 'dificil'),

('teologia', 'O que significa a expressão "kenosis", usada por São Paulo em Filipenses 2 sobre Cristo?',
 ARRAY['O esvaziamento de si mesmo — o Filho de Deus assumindo a condição humana e a forma de servo', 'A glorificação final de Cristo após a Ressurreição', 'O momento em que Jesus expulsa os demônios', 'A partilha dos dons do Espírito Santo entre os apóstolos'],
 0, '"Kenosis" (do grego, esvaziamento) descreve o modo como o Filho de Deus, sendo de condição divina, não se apegou a essa condição, mas se esvaziou a si mesmo assumindo a forma de servo (Fl 2,6-7).', 'dificil'),

('teologia', 'O que é a analogia entis (analogia do ser), usada na teologia católica para falar de Deus?',
 ARRAY['A ideia de que Deus e as criaturas têm exatamente o mesmo modo de existir', 'O princípio segundo o qual há semelhança real entre Deus e a criatura, mas numa diferença sempre maior', 'O princípio de que Deus é totalmente incognoscível, sem nenhuma semelhança com a criatura', 'Um método científico para provar a existência de Deus por experimentos'],
 1, 'A analogia entis afirma que, entre Deus e a criatura, há uma semelhança real (permitindo falar de Deus a partir do mundo criado), mas dentro de uma dessemelhança sempre maior, evitando tanto o panteísmo quanto o agnosticismo total.', 'dificil'),

('teologia', 'Qual concílio ecumênico completou o Credo afirmando a procedência do Espírito Santo, dando origem ao debate posterior sobre o "Filioque" na tradição latina?',
 ARRAY['Concílio de Trento', 'Concílio de Niceia (325)', 'Concílio de Constantinopla (381)', 'Concílio Vaticano I'],
 2, 'O Concílio de Constantinopla (381) completou o Credo afirmando a procedência do Espírito Santo do Pai; a fórmula "Filioque" (e do Filho), acrescentada depois na tradição latina, tornou-se um dos pontos de discussão com a Igreja Oriental.', 'dificil'),

-- ── Liturgia ─────────────────────────────────────────────────────────────────
('liturgia', 'Qual é a cor litúrgica usada no Tempo Comum?',
 ARRAY['Verde', 'Roxo', 'Branco', 'Vermelho'],
 0, 'O verde é a cor do Tempo Comum, simbolizando esperança e crescimento na vida da fé, usada na maior parte do ano litúrgico.', 'facil'),

('liturgia', 'Em que dia da semana a Igreja celebra a Ressurreição do Senhor de modo especial?',
 ARRAY['Na sexta-feira', 'No domingo', 'No sábado', 'Na quinta-feira'],
 1, 'O domingo é o "Dia do Senhor", celebrado desde os primeiros tempos da Igreja como memorial semanal da Ressurreição de Cristo.', 'facil'),

('liturgia', 'O que é o Sinal da Cruz?',
 ARRAY['Uma bênção exclusiva do bispo', 'Um rito usado apenas no Batismo', 'Um gesto que professa a fé na Trindade e na Cruz de Cristo', 'Um costume apenas dos religiosos consagrados'],
 2, 'O Sinal da Cruz é um gesto simples que professa, ao mesmo tempo, a fé na Santíssima Trindade e no mistério da Cruz de Cristo, e abre a maioria das orações e celebrações católicas.', 'facil'),

('liturgia', 'O que é a Vigília Pascal?',
 ARRAY['Uma missa comum de domingo', 'Uma procissão realizada na Sexta-feira Santa', 'Uma novena rezada antes do Natal', 'A celebração central do ano litúrgico, na noite de sábado para domingo de Páscoa'],
 3, 'A Vigília Pascal, celebrada na noite de sábado para domingo de Páscoa, é chamada de "mãe de todas as vigílias" e é a celebração mais solene do ano litúrgico.', 'facil'),

('liturgia', 'O que é o ambão, dentro da igreja?',
 ARRAY['O local de onde se proclamam as leituras e o Evangelho', 'O local onde ficam guardadas as hóstias consagradas', 'A cadeira reservada ao bispo', 'O espaço onde os fiéis se confessam'],
 0, 'O ambão é o local próprio de onde se proclamam as leituras bíblicas e o Evangelho, destacando a importância da Palavra de Deus na liturgia.', 'facil'),

('liturgia', 'O que é o sacrário (ou tabernáculo)?',
 ARRAY['O local onde o padre se veste antes da Missa', 'O espaço onde se guarda o Santíssimo Sacramento reservado', 'A pia usada no Batismo', 'O móvel onde ficam os livros litúrgicos'],
 1, 'O sacrário, ou tabernáculo, é o local seguro e digno onde se guarda a Eucaristia consagrada, principalmente para a comunhão dos enfermos e a adoração.', 'medio'),

('liturgia', 'O que caracteriza um sacramental, diferentemente de um sacramento?',
 ARRAY['É exatamente igual a um sacramento, apenas com outro nome', 'É um rito exclusivo dos primeiros séculos da Igreja, hoje abolido', 'É um sinal instituído pela Igreja (não diretamente por Cristo) que prepara para receber a graça e dispõe à cooperação com ela', 'É praticado apenas por leigos, nunca por sacerdotes'],
 2, 'Sacramentais são sinais sagrados instituídos pela Igreja — como bênçãos, água benta e o terço — que preparam para receber a graça e santificam momentos da vida, distintos dos sete sacramentos instituídos por Cristo.', 'medio'),

('liturgia', 'O que é a Liturgia das Horas?',
 ARRAY['Uma devoção popular rezada só em Quaresma', 'Um outro nome para a Santa Missa', 'A contagem do tempo litúrgico feita pelo bispo', 'A oração oficial da Igreja que santifica as diversas horas do dia, rezada por clérigos, religiosos e leigos'],
 3, 'A Liturgia das Horas é a oração pública e oficial da Igreja, que santifica o curso do dia através de salmos, cânticos e leituras, rezada especialmente por clero e religiosos.', 'medio'),

('liturgia', 'O que significa a palavra "Aleluia", cantada antes do Evangelho (exceto na Quaresma)?',
 ARRAY['Uma expressão hebraica que significa "louvai o Senhor"', 'Uma saudação usada apenas no Natal', 'O nome de um salmo específico', 'Um pedido de perdão pelos pecados'],
 0, '"Aleluia" é uma exclamação hebraica que significa "louvai o Senhor", usada como aclamação de alegria antes da proclamação do Evangelho, omitida durante a Quaresma.', 'medio'),

('liturgia', 'Por que a Igreja não canta ou reza o "Aleluia" durante a Quaresma?',
 ARRAY['Porque a palavra foi proibida pelo Concílio de Trento', 'Por causa do caráter penitencial do tempo, que retoma a alegria plena somente na Páscoa', 'Porque é reservada exclusivamente ao tempo do Advento', 'Não há nenhum motivo especial, é apenas tradição regional'],
 1, 'A Quaresma é tempo de penitência e preparação; por isso a Igreja suspende o canto do "Aleluia", retomando-o com toda a solenidade na Vigília Pascal.', 'medio'),

('liturgia', 'O que é a epiclese, dentro da Oração Eucarística?',
 ARRAY['A saudação inicial do sacerdote à assembleia', 'A leitura do Evangelho', 'A invocação do Espírito Santo sobre o pão e o vinho e sobre a assembleia', 'O canto final de despedida da Missa'],
 2, 'A epiclese é o momento da Oração Eucarística em que o sacerdote invoca o Espírito Santo para que transforme o pão e o vinho no Corpo e Sangue de Cristo e santifique os que vão comungar.', 'dificil'),

('liturgia', 'O que é a "anamnese" na Oração Eucarística?',
 ARRAY['O pedido de perdão feito no início da Missa', 'A bênção final dada pelo sacerdote', 'A leitura do Antigo Testamento', 'A parte em que se faz memória da paixão, morte, ressurreição e ascensão de Cristo, logo após a consagração'],
 3, 'A anamnese é a parte da Oração Eucarística, após a consagração, em que a Igreja faz memória viva da paixão, morte, ressurreição e ascensão de Cristo, tornando presente o mistério pascal.', 'dificil'),

('liturgia', 'O que distingue o rito ambrosiano do rito romano na liturgia católica?',
 ARRAY['É uma tradição litúrgica própria da arquidiocese de Milão, com particularidades no calendário e nos textos, mas em plena comunhão com Roma', 'O rito ambrosiano é usado apenas em países de língua inglesa', 'É uma liturgia que só existiu antes do Concílio de Trento e foi abolida', 'É a mesma coisa que o rito bizantino'],
 0, 'O rito ambrosiano é uma tradição litúrgica latina própria, ligada à arquidiocese de Milão e atribuída à influência de Santo Ambrósio, mantida em plena comunhão com a Sé de Roma e distinta do rito romano comum.', 'dificil'),

('liturgia', 'O que é a "mistagogia", no período que segue a Vigília Pascal?',
 ARRAY['O período de jejum antes do Batismo dos catecúmenos', 'A catequese que aprofunda o sentido dos sacramentos recebidos, dirigida aos recém-batizados no Tempo Pascal', 'Um sinônimo para a homilia dominical', 'O nome antigo dado à Quaresma'],
 1, 'A mistagogia é o tempo de aprofundamento catequético, ao longo do Tempo Pascal, em que os neófitos (recém-batizados na Vigília Pascal) são conduzidos a compreender melhor os mistérios que celebraram.', 'dificil'),

('liturgia', 'O que caracteriza os "dias de preceito" no calendário litúrgico católico?',
 ARRAY['Dias em que é proibido trabalhar em qualquer país católico', 'Dias reservados apenas para jejum e abstinência', 'Solenidades em que os fiéis têm a obrigação de participar da Missa, além dos domingos', 'Datas comemorativas sem nenhuma obrigação litúrgica'],
 2, 'Os dias de preceito são solenidades — como Natal e a Imaculada Conceição — em que a Igreja estabelece a obrigação de participar da Missa, à semelhança do que ocorre nos domingos.', 'dificil'),

-- ── Bíblia Sagrada ───────────────────────────────────────────────────────────
('biblia', 'Quantos Evangelhos existem no Novo Testamento?',
 ARRAY['Quatro', 'Três', 'Cinco', 'Sete'],
 0, 'O Novo Testamento contém quatro Evangelhos: Mateus, Marcos, Lucas e João, chamados de Evangelhos canônicos.', 'facil'),

('biblia', 'Quem foram os pais de Nossa Senhora, segundo a Tradição da Igreja?',
 ARRAY['Zacarias e Isabel', 'Joaquim e Ana', 'José e Maria de Cléofas', 'Abraão e Sara'],
 1, 'Segundo a Tradição da Igreja (não citada explicitamente na Bíblia canônica), os pais de Nossa Senhora foram São Joaquim e Sant''Ana.', 'facil'),

('biblia', 'Quem traiu Jesus por trinta moedas de prata?',
 ARRAY['Pedro', 'Tomé', 'Judas Iscariotes', 'Barrabás'],
 2, 'Judas Iscariotes, um dos Doze Apóstolos, entregou Jesus às autoridades por trinta moedas de prata, conforme relatado nos Evangelhos.', 'facil'),

('biblia', 'Em que cidade Jesus nasceu?',
 ARRAY['Nazaré', 'Jerusalém', 'Cafarnaum', 'Belém'],
 3, 'Jesus nasceu em Belém, cidade de Davi, cumprindo a profecia de Miqueias, embora tenha crescido em Nazaré.', 'facil'),

('biblia', 'Quem batizou Jesus no rio Jordão?',
 ARRAY['São João Batista', 'São Pedro', 'São José', 'Simão, o Cireneu'],
 0, 'São João Batista, o precursor, batizou Jesus no rio Jordão, evento em que se manifestou a voz do Pai e a presença do Espírito Santo em forma de pomba.', 'facil'),

('biblia', 'Quantos Salmos compõem o livro dos Salmos?',
 ARRAY['100', '150', '120', '90'],
 1, 'O livro dos Salmos, atribuído principalmente ao rei Davi, é composto por 150 poemas usados na oração e na liturgia.', 'medio'),

('biblia', 'O que são os livros deuterocanônicos?',
 ARRAY['Livros escritos depois do ano 1000 d.C.', 'Cartas apócrifas rejeitadas por todas as igrejas cristãs', 'Sete livros do Antigo Testamento reconhecidos pela Igreja Católica, mas não aceitos no cânon judaico/protestante', 'Livros exclusivos do Novo Testamento'],
 2, 'Os deuterocanônicos — como Tobias, Judite e Sabedoria — são sete livros do Antigo Testamento presentes na Bíblia Católica, aceitos a partir da tradição da Septuaginta, mas ausentes do cânon hebraico usado por judeus e protestantes.', 'medio'),

('biblia', 'Quem foi lançado na cova dos leões por permanecer fiel a Deus?',
 ARRAY['Jonas', 'Elias', 'Davi', 'Daniel'],
 3, 'O profeta Daniel foi lançado na cova dos leões por continuar orando a Deus apesar do decreto do rei, e foi milagrosamente preservado.', 'medio'),

('biblia', 'Qual apóstolo é conhecido como "apóstolo dos gentios" por sua missão evangelizadora fora do povo judeu?',
 ARRAY['São Paulo', 'São Pedro', 'São Tiago Maior', 'São Bartolomeu'],
 0, 'São Paulo, convertido no caminho de Damasco, é chamado de "apóstolo dos gentios" por sua intensa atividade missionária entre os povos não judeus.', 'medio'),

('biblia', 'O que é o Cântico dos Cânticos (ou Cântico dos Cantares)?',
 ARRAY['Uma coleção de parábolas de Jesus', 'Um livro poético do Antigo Testamento que celebra o amor esponsal, lido também como imagem do amor entre Deus e seu povo', 'Um hino cantado exclusivamente no Natal', 'Uma carta de São Paulo às comunidades da Ásia Menor'],
 1, 'O Cântico dos Cânticos é um livro poético do Antigo Testamento que celebra o amor esponsal humano, tradicionalmente interpretado também como símbolo da aliança de amor entre Deus e seu povo, e entre Cristo e a Igreja.', 'medio'),

('biblia', 'Quais são os quatro sentidos da Sagrada Escritura reconhecidos pela tradição da Igreja?',
 ARRAY['Histórico, poético, profético e sapiencial', 'Judaico, grego, latino e aramaico', 'Literal, alegórico, moral e anagógico', 'Antigo, Novo, deuterocanônico e apócrifo'],
 2, 'A tradição cristã distingue o sentido literal (o que o texto diz) dos três sentidos espirituais: alegórico (relação com Cristo), moral (orientação para agir) e anagógico (relação com o destino eterno).', 'dificil'),

('biblia', 'O que é a "Septuaginta"?',
 ARRAY['A primeira tradução completa da Bíblia para o latim, feita por São Jerônimo', 'Um conjunto de setenta cartas apostólicas', 'O nome dado aos setenta discípulos enviados por Jesus', 'A tradução grega do Antigo Testamento, feita antes de Cristo e usada pelos primeiros cristãos'],
 3, 'A Septuaginta é a tradução grega do Antigo Testamento, realizada por volta do século III a.C. em Alexandria, amplamente usada pelos judeus de língua grega e pelos primeiros cristãos, incluindo os autores do Novo Testamento.', 'dificil'),

('biblia', 'Quem foi o autor da Vulgata, a tradução da Bíblia para o latim que se tornou oficial na Igreja por séculos?',
 ARRAY['São Jerônimo', 'Santo Agostinho', 'São Tomás de Aquino', 'Orígenes'],
 0, 'São Jerônimo, no século IV-V, traduziu a Bíblia para o latim a partir dos textos originais, produzindo a Vulgata, que se tornou a versão oficial usada pela Igreja Latina por muitos séculos.', 'dificil'),

('biblia', 'O que caracteriza os livros chamados "sapienciais" do Antigo Testamento?',
 ARRAY['Narram exclusivamente a história dos reis de Israel', 'Reúnem reflexões sobre a sabedoria, o sentido da vida e a conduta reta, como Provérbios, Jó e Eclesiastes', 'São cartas escritas pelos apóstolos às primeiras comunidades', 'Contêm apenas profecias sobre o fim dos tempos'],
 1, 'Os livros sapienciais — como Jó, Provérbios, Eclesiastes, Cântico dos Cânticos, Sabedoria e Eclesiástico (Sirácida) — reúnem a reflexão de Israel sobre o sentido da vida, o sofrimento e a conduta segundo a sabedoria de Deus.', 'dificil'),

('biblia', 'Qual é a estrutura literária característica de boa parte da poesia hebraica bíblica, como nos Salmos?',
 ARRAY['A rima final entre os versos, como na poesia moderna', 'A métrica silábica fixa idêntica à grega', 'O paralelismo — a repetição ou o contraste de ideias entre versos sucessivos', 'O uso exclusivo de acróstico alfabético'],
 2, 'A poesia hebraica bíblica se organiza principalmente pelo paralelismo — versos que repetem, completam ou contrastam a ideia do verso anterior — mais do que pela rima, comum na poesia ocidental moderna.', 'dificil'),

-- ── História da Igreja ───────────────────────────────────────────────────────
('historia', 'Em que evento a Igreja recebeu o Espírito Santo, tradicionalmente considerado o início público de sua missão?',
 ARRAY['No Pentecostes', 'Na Última Ceia', 'Na Ascensão de Jesus', 'No Concílio de Jerusalém'],
 0, 'No Pentecostes, cinquenta dias após a Páscoa, o Espírito Santo desceu sobre os Apóstolos reunidos com Maria, marcando o início público da missão evangelizadora da Igreja.', 'facil'),

('historia', 'Qual imperador romano decretou o Édito de Milão, em 313, concedendo liberdade de culto aos cristãos?',
 ARRAY['Nero', 'Constantino', 'Diocleciano', 'Justiniano'],
 1, 'O imperador Constantino, junto com Licínio, promulgou o Édito de Milão em 313, pondo fim às perseguições oficiais e concedendo liberdade religiosa aos cristãos.', 'facil'),

('historia', 'O que eram as catacumbas, usadas pelos cristãos nos primeiros séculos?',
 ARRAY['Templos pagãos convertidos em igrejas', 'Palácios dos primeiros bispos de Roma', 'Galerias subterrâneas usadas como cemitérios e, em tempos de perseguição, também para celebrações', 'Escolas de teologia fundadas por Santo Agostinho'],
 2, 'As catacumbas eram galerias subterrâneas escavadas para sepultamento; nos períodos de perseguição, os cristãos também as usaram para celebrar a Eucaristia e homenagear os mártires.', 'facil'),

('historia', 'Quem foi Santa Teresinha do Menino Jesus, canonizada e declarada Doutora da Igreja no século XX?',
 ARRAY['Uma imperatriz que se converteu ao catolicismo', 'Uma mártir dos primeiros séculos do cristianismo', 'Uma missionária que evangelizou a América colonial', 'Uma carmelita francesa conhecida pela "pequena via" de confiança e amor espiritual'],
 3, 'Santa Teresinha do Menino Jesus (1873-1897) foi uma religiosa carmelita francesa, autora da "pequena via" espiritual, canonizada e proclamada Doutora da Igreja em 1997.', 'facil'),

('historia', 'Em que região nasceu o cristianismo, com a vida terrena de Jesus Cristo?',
 ARRAY['Palestina (região da Judeia)', 'Egito', 'Grécia', 'Itália'],
 0, 'Jesus Cristo nasceu, viveu e morreu na região da Palestina, na época sob domínio do Império Romano, dentro da tradição judaica.', 'facil'),

('historia', 'O que foi o Concílio de Trento (1545-1563)?',
 ARRAY['O concílio que definiu o dogma da Trindade', 'O concílio convocado em resposta à Reforma Protestante, que reafirmou doutrinas católicas e promoveu reformas internas', 'O primeiro concílio ecumênico da história da Igreja', 'O concílio que aboliu o Latim na liturgia'],
 1, 'O Concílio de Trento foi convocado para responder à Reforma Protestante, reafirmando doutrinas como a Eucaristia e a justificação, além de promover reformas disciplinares na Igreja.', 'medio'),

('historia', 'Quem foi Santo Agostinho de Hipona?',
 ARRAY['Um papa do século III', 'O fundador da Ordem Beneditina', 'Um bispo e teólogo do século IV-V, autor de "Confissões" e "A Cidade de Deus"', 'Um mártir perseguido por Nero'],
 2, 'Santo Agostinho (354-430), bispo de Hipona, foi um dos maiores teólogos da Igreja, autor de obras fundamentais como "Confissões" e "A Cidade de Deus".', 'medio'),

('historia', 'O que foi o Grande Cisma do Ocidente (1378-1417)?',
 ARRAY['A separação definitiva entre católicos e ortodoxos', 'A divisão entre católicos e protestantes no século XVI', 'A fragmentação do Império Romano em reinos bárbaros', 'Um período em que houve dois ou até três homens reivindicando simultaneamente o papado'],
 3, 'O Grande Cisma do Ocidente foi um período de crise em que chegou a haver dois (e depois três) pretendentes ao papado ao mesmo tempo, resolvido no Concílio de Constança (1414-1418).', 'medio'),

('historia', 'Quem foi São Bento de Núrsia?',
 ARRAY['O patriarca do monaquismo ocidental, autor da Regra beneditina ("ora et labora")', 'O fundador da Ordem Franciscana', 'O primeiro missionário jesuíta no Brasil', 'Um dos quatro Evangelistas'],
 0, 'São Bento de Núrsia (século VI) é considerado o patriarca do monaquismo ocidental, autor de uma Regra monástica que resume o ideal de vida em "ora et labora" (reza e trabalho).', 'medio'),

('historia', 'O que caracterizou o movimento missionário das Reduções Jesuíticas na América colonial?',
 ARRAY['A imposição da escravidão indígena pelos missionários', 'Comunidades organizadas por jesuítas para evangelizar e proteger povos indígenas, sobretudo guaranis, na América do Sul', 'A fundação das primeiras universidades da Europa', 'Uma ordem militar criada para combater hereges'],
 1, 'As Reduções Jesuíticas foram comunidades organizadas por missionários da Companhia de Jesus, principalmente entre os guaranis, buscando evangelizar e proteger os indígenas da escravização colonial.', 'medio'),

('historia', 'O que definiu o Concílio de Éfeso (431) sobre a Virgem Maria?',
 ARRAY['Proclamou o dogma da Assunção de Maria', 'Instituiu a festa da Imaculada Conceição', 'Definiu Maria como "Theotókos" (Mãe de Deus), contra a doutrina de Nestório', 'Aprovou o primeiro calendário litúrgico mariano'],
 2, 'O Concílio de Éfeso, em 431, definiu contra Nestório que Maria é verdadeiramente "Theotókos" (Mãe de Deus), pois gerou a Pessoa única do Verbo encarnado, e não apenas sua natureza humana.', 'dificil'),

('historia', 'O que foi a "Querela das Investiduras", ocorrida entre os séculos XI e XII?',
 ARRAY['Uma disputa teológica sobre a Trindade', 'A guerra entre católicos e muçulmanos pela posse de Jerusalém', 'A disputa entre franciscanos e dominicanos por territórios de missão', 'O conflito entre o Papado e o Sacro Império Romano-Germânico sobre quem tinha autoridade para nomear bispos e abades'],
 3, 'A Querela das Investiduras foi o conflito entre o Papado (com destaque para o Papa Gregório VII) e os imperadores do Sacro Império sobre o direito de nomear (investir) bispos e abades, resolvido parcialmente pela Concordata de Worms (1122).', 'dificil'),

('historia', 'Quem convocou o Concílio Vaticano I (1869-1870), que definiu o dogma da infalibilidade papal?',
 ARRAY['Papa Pio IX', 'Papa Pio VII', 'Papa Leão XIII', 'Papa São Pio X'],
 0, 'O Papa Pio IX convocou o Concílio Vaticano I, que definiu o dogma da infalibilidade papal em matérias de fé e moral, quando o Papa fala "ex cathedra".', 'dificil'),

('historia', 'O que foi o "Cativeiro de Avinhão" (1309-1377)?',
 ARRAY['O aprisionamento de um papa pelos muçulmanos durante as Cruzadas', 'O período em que os papas residiram em Avinhão, na França, em vez de Roma', 'A perseguição aos cristãos sob o imperador Diocleciano', 'O exílio dos jesuítas expulsos de Portugal'],
 1, 'Entre 1309 e 1377, sete papas sucessivos residiram em Avinhão, na França, sob forte influência da monarquia francesa, período conhecido como "Cativeiro de Avinhão", antes do retorno da sede papal a Roma.', 'dificil'),

('historia', 'Qual movimento de renovação espiritual e teológica do século XX é considerado uma das bases que prepararam o Concílio Vaticano II?',
 ARRAY['O Iluminismo católico', 'A Contrarreforma tridentina', 'O Movimento Litúrgico e a Nouvelle Théologie (ressourcement)', 'O Modernismo condenado por São Pio X'],
 2, 'O Movimento Litúrgico e a chamada Nouvelle Théologie (com teólogos como Congar e de Lubac, propondo um retorno às fontes patrísticas e bíblicas) foram correntes de renovação que ajudaram a preparar o terreno teológico e pastoral do Concílio Vaticano II.', 'dificil'),

-- ── Teologia Moral ───────────────────────────────────────────────────────────
('moral', 'O que é a consciência moral, segundo a Igreja?',
 ARRAY['O julgamento da razão pelo qual a pessoa reconhece a qualidade moral de um ato concreto', 'Um sentimento de culpa que deve ser ignorado', 'Uma norma imposta apenas pela sociedade', 'Um instinto puramente emocional, sem relação com a razão'],
 0, 'A consciência moral é o julgamento prático da razão que permite à pessoa reconhecer, no momento de agir, se um ato concreto é bom ou mau.', 'facil'),

('moral', 'O que são as obras de misericórdia espirituais?',
 ARRAY['Ações voltadas para atender necessidades materiais, como alimentar e vestir', 'Ações que atendem às necessidades espirituais, como ensinar, aconselhar e perdoar', 'Um sinônimo dos sete sacramentos', 'Rituais realizados exclusivamente na Quaresma'],
 1, 'As obras de misericórdia espirituais — como ensinar os ignorantes, aconselhar os que duvidam e perdoar as ofensas — atendem às necessidades espirituais do próximo.', 'facil'),

('moral', 'O que é o pecado venial?',
 ARRAY['Um pecado que rompe completamente a comunhão com Deus', 'Um sinônimo de pecado mortal', 'Uma falta que enfraquece a caridade sem destruí-la, envolvendo matéria leve ou falta de plena consciência/consentimento', 'Um pecado cometido apenas por não católicos'],
 2, 'O pecado venial fere e enfraquece a caridade sem romper a aliança com Deus, diferentemente do pecado mortal, que destrói a graça no coração do homem.', 'facil'),

('moral', 'Qual é o primeiro mandamento do Decálogo?',
 ARRAY['Não matarás', 'Guardarás o Domingo', 'Não roubarás', 'Amarás a Deus sobre todas as coisas / Não terás outros deuses diante de mim'],
 3, 'O primeiro mandamento chama a adorar e amar somente a Deus sobre todas as coisas, rejeitando a idolatria e o culto a falsos deuses.', 'facil'),

('moral', 'O que significa o mandamento "Não levantarás falso testemunho"?',
 ARRAY['Proíbe a mentira e a difamação, exigindo respeito à verdade e à reputação do próximo', 'Proíbe apenas mentir sob juramento em tribunal', 'Refere-se apenas a testemunhas de acidentes', 'É um mandamento aplicável somente a autoridades públicas'],
 0, 'O oitavo mandamento exige o respeito à verdade e à honra do próximo, proibindo mentira, calúnia, difamação e todo dano injusto à reputação alheia.', 'facil'),

('moral', 'O que é a "opção preferencial pelos pobres", princípio da Doutrina Social da Igreja?',
 ARRAY['A ideia de que apenas os pobres podem ser salvos', 'Um chamado a dar atenção especial aos mais necessitados nas decisões pessoais, sociais e políticas, sem excluir ninguém', 'Uma política econômica específica defendida oficialmente pela Igreja', 'Um voto religioso obrigatório para todos os fiéis'],
 1, 'A opção preferencial pelos pobres é um princípio da Doutrina Social que chama toda a comunidade cristã a dar atenção especial aos mais vulneráveis, sem que isso signifique exclusão de ninguém do amor de Deus.', 'medio'),

('moral', 'O que é o livre-arbítrio, segundo a antropologia católica?',
 ARRAY['A capacidade de fazer qualquer coisa sem nenhuma consequência moral', 'Um dom exclusivo dos santos', 'A capacidade humana de escolher livremente entre o bem e o mal, dada por Deus e responsável pelos próprios atos', 'Um conceito rejeitado pela Igreja por contradizer a graça divina'],
 2, 'O livre-arbítrio é a faculdade humana de autodeterminar-se e escolher livremente, tornando a pessoa responsável por seus atos voluntários — dom de Deus que a graça não anula, mas eleva.', 'medio'),

('moral', 'O que é o escândalo, do ponto de vista moral?',
 ARRAY['Um sinônimo de fofoca sem consequência real', 'Um pecado exclusivamente contra a castidade', 'Uma palavra usada só no contexto jurídico civil', 'Uma atitude ou omissão que leva outra pessoa a praticar o mal'],
 3, 'O escândalo é toda atitude ou omissão que induz outra pessoa a praticar o mal, sendo considerado uma falta grave por ferir também o bem espiritual do próximo.', 'medio'),

('moral', 'O que é a virtude da penitência?',
 ARRAY['A disposição interior de conversão do coração, unida a atos externos de reparação pelo pecado', 'Apenas o jejum praticado na Quaresma', 'Um sinônimo de excomunhão', 'Uma prática abolida após o Concílio Vaticano II'],
 0, 'A penitência é, antes de tudo, a conversão interior do coração ao amor de Deus, expressa também em gestos concretos de reparação e mudança de vida.', 'medio'),

('moral', 'O que ensina a Igreja sobre a dignidade da pessoa humana, fundamento da moral social católica?',
 ARRAY['Que a dignidade varia conforme a posição social ou econômica da pessoa', 'Que toda pessoa humana, criada à imagem e semelhança de Deus, possui dignidade inviolável do início ao fim da vida natural', 'Que a dignidade é concedida pelo Estado através das leis', 'Que apenas os batizados possuem dignidade plena'],
 1, 'A Igreja ensina que toda pessoa, por ser criada à imagem e semelhança de Deus, possui dignidade intrínseca e inviolável, que não depende de condição social, econômica ou de qualquer outro fator humano.', 'medio'),

('moral', 'O que é a "cooperação formal ao mal", que a moral católica considera sempre ilícita?',
 ARRAY['Ajudar involuntariamente alguém que pratica o mal, sem saber', 'Trabalhar em qualquer empresa que tenha cometido algum erro no passado', 'Participar de uma ação má compartilhando a mesma intenção má de quem a pratica', 'Pagar impostos a um governo injusto'],
 2, 'A cooperação formal ocorre quando alguém partilha da intenção má de outra pessoa ao ajudá-la a praticar o mal, sendo sempre moralmente ilícita, diferente da cooperação material, que pode em certos casos ser tolerada.', 'medio'),

('moral', 'O que é o "princípio do duplo efeito", usado na teologia moral para avaliar ações com consequências boas e más ao mesmo tempo?',
 ARRAY['A ideia de que o fim sempre justifica os meios', 'Uma regra que proíbe qualquer ação com risco de efeito negativo', 'Um princípio exclusivo do direito penal civil', 'Um critério que permite, sob certas condições, realizar uma ação boa mesmo prevendo um efeito mau não pretendido diretamente'],
 3, 'O princípio do duplo efeito estabelece condições (ação boa em si, intenção reta, efeito mau não sendo o meio para o bom, e proporcionalidade) sob as quais é moralmente lícito realizar um ato bom mesmo prevendo um efeito colateral negativo não pretendido.', 'dificil'),

('moral', 'Qual é a diferença entre "lei eterna" e "lei natural" na Teologia Moral, segundo Santo Tomás de Aquino?',
 ARRAY['A lei eterna é a própria razão de Deus governando o universo; a lei natural é a participação da criatura racional nessa lei eterna', 'São exatamente a mesma coisa com nomes diferentes', 'A lei eterna se refere apenas aos anjos; a lei natural, apenas aos homens', 'A lei natural substitui totalmente a lei eterna após a Encarnação'],
 0, 'Para Santo Tomás de Aquino, a lei eterna é o plano racional de Deus que governa todo o universo; a lei natural é a participação da criatura racional — o ser humano — nessa lei eterna, permitindo discernir o bem através da razão.', 'dificil'),

('moral', 'O que é o "probabilismo" em teologia moral, sistema historicamente debatido na Igreja?',
 ARRAY['A doutrina de que nenhuma ação humana pode ser julgada moralmente', 'Um sistema que admite seguir uma opinião moral solidamente provável mesmo havendo outra opinião mais provável em sentido contrário, quando a lei está em dúvida', 'Um método estatístico usado para calcular a gravidade dos pecados', 'A negação da existência do livre-arbítrio'],
 1, 'O probabilismo é um sistema moral, historicamente associado sobretudo aos jesuítas, segundo o qual, havendo dúvida sobre a existência de uma lei, é lícito seguir uma opinião solidamente fundamentada em favor da liberdade, mesmo que outra opinião pareça mais provável.', 'dificil'),

('moral', 'O que é a "virtude infusa", distinta da virtude adquirida pelo simples exercício e repetição de atos?',
 ARRAY['Uma virtude imposta por lei civil', 'Um sinônimo de talento natural', 'Uma disposição boa e estável dada diretamente por Deus, especialmente as teologais e as virtudes morais ligadas à graça', 'Uma virtude que só existia antes do Batismo'],
 2, 'As virtudes infusas são dadas por Deus diretamente à alma pela graça — como as três virtudes teologais —, diferindo das virtudes morais adquiridas pelo esforço humano repetido, ainda que ambas possam se relacionar e se fortalecer mutuamente.', 'dificil'),

-- ── Santos ───────────────────────────────────────────────────────────────────
('santos', 'Quem foi São José, segundo a tradição católica?',
 ARRAY['O esposo de Maria e pai adotivo de Jesus, padroeiro da Igreja Universal', 'Um dos doze apóstolos de Jesus', 'Um profeta do Antigo Testamento', 'O primeiro bispo de Roma depois de São Pedro'],
 0, 'São José foi o esposo de Maria e pai adotivo (legal) de Jesus, modelo de fidelidade e obediência a Deus, declarado padroeiro da Igreja Universal.', 'facil'),

('santos', 'Quem é considerada a padroeira das missões, apesar de nunca ter saído de seu convento na França?',
 ARRAY['Santa Bernadete de Lourdes', 'Santa Teresinha do Menino Jesus', 'Santa Joana d''Arc', 'Santa Genoveva'],
 1, 'Santa Teresinha do Menino Jesus, carmelita que viveu em clausura, foi declarada padroeira das missões por seu amor espiritual e intercessão pelos missionários, mesmo sem nunca ter viajado.', 'facil'),

('santos', 'Quem foi São Judas Tadeu, popularmente invocado como padroeiro das causas difíceis e impossíveis?',
 ARRAY['Um mártir do século XV', 'Um papa medieval', 'Um dos doze apóstolos de Jesus', 'Um santo fundador de uma ordem religiosa'],
 2, 'São Judas Tadeu foi um dos doze apóstolos de Jesus, tradicionalmente invocado como padroeiro das causas difíceis e desesperadas.', 'facil'),

('santos', 'Quem foi Santa Bernadete Soubirous?',
 ARRAY['A vidente das aparições de Nossa Senhora em Fátima', 'Uma mártir romana do século II', 'A fundadora das Missionárias da Caridade', 'A jovem que recebeu as aparições de Nossa Senhora em Lourdes, na França'],
 3, 'Santa Bernadete Soubirous foi a jovem francesa a quem Nossa Senhora apareceu em Lourdes, em 1858, revelando-se como "a Imaculada Conceição".', 'facil'),

('santos', 'Quem foi Santa Teresa de Calcutá (Madre Teresa)?',
 ARRAY['Uma religiosa que dedicou a vida aos mais pobres entre os pobres, na Índia', 'Uma mártir dos primeiros séculos do cristianismo', 'A fundadora da Ordem Franciscana', 'Uma santa medieval canonizada no século XIII'],
 0, 'Santa Teresa de Calcutá, fundadora das Missionárias da Caridade, dedicou sua vida ao serviço dos mais pobres e moribundos na Índia, sendo canonizada em 2016.', 'facil'),

('santos', 'Qual santo é considerado o "Doutor Angélico" e patrono das universidades e estudantes católicos?',
 ARRAY['Santo Agostinho', 'São Tomás de Aquino', 'São Boaventura', 'São Jerônimo'],
 1, 'São Tomás de Aquino, autor da "Suma Teológica", é chamado "Doutor Angélico" e é o padroeiro das universidades e dos estudantes católicos.', 'medio'),

('santos', 'Quem foi Santa Mônica?',
 ARRAY['Uma mártir egípcia do século III', 'A fundadora da Ordem das Clarissas', 'Mãe de Santo Agostinho, conhecida por suas orações e lágrimas pela conversão do filho', 'Uma imperatriz romana convertida ao cristianismo'],
 2, 'Santa Mônica é lembrada por sua perseverança em orar durante anos pela conversão de seu filho, Santo Agostinho, que se tornou um dos maiores doutores da Igreja.', 'medio'),

('santos', 'Qual santo fundou a Companhia de Jesus (jesuítas)?',
 ARRAY['São Filipe Néri', 'São Vicente de Paulo', 'São João Bosco', 'Santo Inácio de Loyola'],
 3, 'Santo Inácio de Loyola, ex-militar espanhol convertido, fundou a Companhia de Jesus em 1540, ordem dedicada à formação, missão e obediência ao Papa.', 'medio'),

('santos', 'Quem foi São Maximiliano Kolbe?',
 ARRAY['Um frade franciscano polonês que se ofereceu para morrer no lugar de outro prisioneiro em um campo de concentração nazista', 'Um missionário que evangelizou o Japão no século XVI', 'O fundador da Ordem Dominicana', 'Um papa do início do século XX'],
 0, 'São Maximiliano Kolbe, frade franciscano, ofereceu voluntariamente sua vida para salvar um pai de família condenado à morte no campo de concentração de Auschwitz, sendo canonizado como mártir da caridade.', 'medio'),

('santos', 'Quem é a santa polonesa que recebeu as revelações da Divina Misericórdia e as registrou em seu "Diário", apesar de pouca escolaridade formal?',
 ARRAY['Santa Teresa d''Ávila', 'Santa Faustina Kowalska', 'Santa Rita de Cássia', 'Santa Edith Stein'],
 1, 'Santa Faustina Kowalska, religiosa polonesa do século XX, recebeu as revelações da Divina Misericórdia e as registrou em seu "Diário", tornando-se uma das devoções mais difundidas da Igreja contemporânea.', 'medio'),

('santos', 'Quem foi São João Bosco?',
 ARRAY['Um mártir dos primeiros séculos do cristianismo', 'O primeiro missionário a chegar ao Brasil', 'Um sacerdote italiano do século XIX dedicado à educação de jovens pobres, fundador dos Salesianos', 'Um papa que governou durante a Reforma Protestante'],
 2, 'São João Bosco (Dom Bosco), no século XIX, dedicou-se à educação e evangelização de jovens pobres e abandonados, fundando a Sociedade Salesiana.', 'medio'),

('santos', 'Quem foi Santa Edith Stein (Teresa Benedita da Cruz)?',
 ARRAY['Uma princesa medieval que fundou um convento na Alemanha', 'A primeira mulher Doutora da Igreja', 'Uma vidente de aparições marianas no século XX', 'Uma filósofa judia convertida ao catolicismo, carmelita, morta em Auschwitz e canonizada como mártir'],
 3, 'Santa Edith Stein foi uma filósofa judia alemã, discípula de Husserl, convertida ao catolicismo e tornada carmelita descalça; morreu em Auschwitz por ser judia e foi canonizada como mártir e copadroeira da Europa.', 'dificil'),

('santos', 'Qual santo medieval é conhecido como "Doutor Seráfico" e escreveu obras místicas como o "Itinerário da Mente para Deus"?',
 ARRAY['São Boaventura', 'São Alberto Magno', 'São Beda, o Venerável', 'São João Damasceno'],
 0, 'São Boaventura, frade franciscano e teólogo do século XIII, é chamado "Doutor Seráfico" e é autor de obras místico-teológicas como o "Itinerarium Mentis in Deum".', 'dificil'),

('santos', 'Quem foi Santa Hildegarda de Bingen, declarada Doutora da Igreja em 2012?',
 ARRAY['Uma rainha convertida ao catolicismo no século IX', 'Uma monja beneditina medieval, mística, compositora e escritora de obras teológicas e científicas', 'Uma mártir do Império Romano', 'A fundadora da primeira ordem hospitaleira'],
 1, 'Santa Hildegarda de Bingen (1098-1179) foi uma monja beneditina alemã, mística, compositora, escritora e estudiosa de ciências naturais, declarada Doutora da Igreja pelo Papa Bento XVI em 2012.', 'dificil'),

('santos', 'Quem foi São João Maria Vianney, conhecido como Cura d''Ars, padroeiro dos párocos?',
 ARRAY['Um bispo francês do século XX conhecido por suas reformas', 'Um papa que governou durante a Revolução Francesa', 'Um simples pároco francês do século XIX, célebre por horas dedicadas ao confessionário e à direção espiritual', 'Um teólogo alemão contemporâneo de Lutero'],
 2, 'São João Maria Vianney, o Cura d''Ars, foi um simples pároco francês do século XIX, célebre por sua vida de oração, penitência e por passar longas horas no confessionário, sendo hoje padroeiro dos párocos.', 'dificil');
