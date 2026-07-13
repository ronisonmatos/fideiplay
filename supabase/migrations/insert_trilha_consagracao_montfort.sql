-- Cadastra a trilha "Consagração a Nossa Senhora" (método de São Luís de
-- Montfort) via game_packs, usando o mecanismo genérico de trilhas via banco
-- (ver hooks/use-game-packs.ts mergeTrilhas + supabase/game-packs-schema.sql
-- seção 7). id 1002 (faixa reservada a trilhas via banco: >= 1000).

INSERT INTO game_packs (game_type, titulo, categoria, gratuito, ordem, conteudo)
VALUES (
  'trilhas',
  'Consagração a Nossa Senhora (Montfort)',
  'maria',
  true,
  10,
  $json${
  "trilhas": [
    {
      "id": 1002,
      "titulo": "Consagração a Nossa Senhora",
      "descricao": "O método de São Luís Maria de Montfort para se consagrar a Jesus por Maria",
      "icone": "🌹",
      "nivel": "Intermediário",
      "totalLicoes": 6,
      "xpTotal": 180,
      "gratis": true,
      "licoes": [
        {
          "id": 1,
          "titulo": "O que é a Consagração a Maria?",
          "versiculo": "Jo 19,26-27",
          "resumo": "A base bíblica da consagração e o que ela realmente significa.",
          "conteudo": [
            {
              "tipo": "texto",
              "texto": "Consagrar-se a Nossa Senhora é fazer uma doação total e livre de si mesmo a Jesus Cristo, por meio de Maria, reconhecendo o papel único que ela tem no plano da salvação. Não é um ato mágico nem substitui a relação pessoal com Deus — é justamente um caminho para vivê-la com mais profundidade, seguindo o mesmo caminho que o próprio Deus escolheu ao vir ao mundo: por meio de Maria."
            },
            {
              "tipo": "versiculo",
              "texto": "\"Mulher, eis o teu filho... Eis a tua mãe.\" — Jo 19,26-27"
            },
            {
              "tipo": "destaque",
              "texto": "A Igreja distingue três níveis de culto: latria (adoração devida só a Deus), dulia (veneração aos santos) e hiperdulia (veneração especial só a Maria, maior que a dos santos, mas infinitamente menor que a adoração a Deus). Consagrar-se a Maria é um ato de hiperdulia — nunca de adoração."
            },
            {
              "tipo": "curiosidade",
              "texto": "Da cruz, um dos últimos atos de Jesus foi entregar sua Mãe ao discípulo amado — e, nele, a toda a Igreja. É esse gesto que a tradição vê como o fundamento bíblico da devoção mariana total."
            }
          ],
          "perguntas": [
            {
              "pergunta": "O que significa, na prática, consagrar-se a Nossa Senhora?",
              "opcoes": [
                "Substituir a devoção a Jesus pela devoção a Maria",
                "Entregar-se totalmente a Jesus, por meio de Maria",
                "Um ritual que garante automaticamente a salvação",
                "Adorar Maria como se fosse divina"
              ],
              "correta": 1,
              "explicacao": "A consagração é uma entrega total a Jesus Cristo, feita por meio de Maria — ela não substitui nem diminui a relação com Jesus, ao contrário, aprofunda-a."
            },
            {
              "pergunta": "Em que momento do Evangelho Jesus entrega Maria como mãe ao discípulo amado?",
              "opcoes": [
                "Nas bodas de Caná",
                "Na Anunciação",
                "Na cruz, pouco antes de morrer",
                "Na Ressurreição"
              ],
              "correta": 2,
              "explicacao": "Em Jo 19,26-27, já na cruz, Jesus diz a Maria \"eis o teu filho\" e ao discípulo \"eis a tua mãe\" — um gesto lido pela tradição como Maria sendo dada como mãe a toda a Igreja."
            },
            {
              "pergunta": "Qual é o nome do culto especial dado a Maria, diferente da adoração devida só a Deus?",
              "opcoes": [
                "Latria",
                "Dulia",
                "Hiperdulia",
                "Liturgia"
              ],
              "correta": 2,
              "explicacao": "Hiperdulia é a veneração especial dada a Maria — maior que a dulia (dada aos santos), mas infinitamente inferior à latria, que é a adoração devida só a Deus."
            }
          ],
          "xp": 30
        },
        {
          "id": 2,
          "titulo": "São Luís Maria Grignion de Montfort",
          "versiculo": "2Cor 12,15",
          "resumo": "A vida do missionário francês que sistematizou essa espiritualidade mariana.",
          "conteudo": [
            {
              "tipo": "texto",
              "texto": "Luís Maria Grignion de Montfort nasceu em 1673, na Bretanha, França. Ordenado sacerdote, dedicou-se a pregar missões populares por vilarejos pobres do interior francês, sempre unindo uma intensa devoção mariana à pregação da cruz de Cristo. Fundou duas famílias religiosas: a Companhia de Maria (Missionários Montfortianos), para padres, e as Filhas da Sabedoria, junto com Marie Louise Trichet, dedicadas aos pobres e doentes."
            },
            {
              "tipo": "versiculo",
              "texto": "\"De muito bom grado gastarei tudo o que tenho, e a mim mesmo me gastarei, por vossas almas.\" — 2Cor 12,15"
            },
            {
              "tipo": "destaque",
              "texto": "Montfort escreveu o \"Tratado da Verdadeira Devoção à Santíssima Virgem\", obra que sistematiza o método de consagração mariana. O manuscrito ficou perdido por mais de um século dentro de um baú, e só foi encontrado e publicado em 1842 — quase 130 anos após sua morte."
            },
            {
              "tipo": "curiosidade",
              "texto": "Montfort morreu exausto em 1716, aos 43 anos, depois de anos de pregação incessante. Foi canonizado pelo Papa Pio XII em 1947. Seu lema pessoal, que assinava em suas cartas, era \"Deus solus\" — Só Deus."
            }
          ],
          "perguntas": [
            {
              "pergunta": "Em que século viveu São Luís de Montfort?",
              "opcoes": [
                "Século XII",
                "Século XV",
                "Séculos XVII–XVIII",
                "Século XX"
              ],
              "correta": 2,
              "explicacao": "Montfort nasceu em 1673 e morreu em 1716, vivendo entre os séculos XVII e XVIII, na França."
            },
            {
              "pergunta": "Qual é o título da obra clássica de Montfort sobre devoção mariana?",
              "opcoes": [
                "Imitação de Cristo",
                "Tratado da Verdadeira Devoção à Santíssima Virgem",
                "Introdução à Vida Devota",
                "Glórias de Maria"
              ],
              "correta": 1,
              "explicacao": "O \"Tratado da Verdadeira Devoção à Santíssima Virgem\" é a obra onde Montfort expõe seu método de consagração mariana."
            },
            {
              "pergunta": "O que aconteceu com o manuscrito desse tratado?",
              "opcoes": [
                "Foi publicado ainda em vida do autor",
                "Ficou perdido por mais de 100 anos até ser redescoberto",
                "Foi destruído num incêndio",
                "Nunca chegou a ser escrito, é uma compilação posterior"
              ],
              "correta": 1,
              "explicacao": "O manuscrito ficou esquecido dentro de um baú por mais de um século e só foi encontrado e publicado em 1842."
            }
          ],
          "xp": 30
        },
        {
          "id": 3,
          "titulo": "Verdadeira e Falsas Devoções",
          "versiculo": "Mt 15,8",
          "resumo": "Montfort descreve devoções marianas defeituosas — e o que caracteriza a verdadeira.",
          "conteudo": [
            {
              "tipo": "texto",
              "texto": "No Tratado, Montfort alerta para devoções marianas deformadas: o devoto crítico, que só analisa e discute a devoção sem praticá-la; o devoto escrupuloso, que teme que honrar Maria diminua a Jesus; o devoto exterior, preso só a rituais e gestos externos sem conversão do coração; o devoto presunçoso, que usa a devoção como desculpa para continuar pecando, achando-se automaticamente protegido; e o devoto inconstante, que muda de prática religiosa sem nunca perseverar em nenhuma."
            },
            {
              "tipo": "versiculo",
              "texto": "\"Este povo me honra com os lábios, mas o seu coração está longe de mim.\" — Mt 15,8"
            },
            {
              "tipo": "destaque",
              "texto": "Para Montfort, a verdadeira devoção é interior (do coração, não só de gestos), confiante (com filial abandono), santa (afasta do pecado, não o justifica), constante (perseverante, não uma moda passageira) e desinteressada (busca a glória de Deus, não vantagens pessoais)."
            },
            {
              "tipo": "curiosidade",
              "texto": "Essa crítica às devoções falsas mostra que, para Montfort, o alvo nunca é acumular práticas religiosas, mas viver uma transformação real e duradoura do coração."
            }
          ],
          "perguntas": [
            {
              "pergunta": "Como Montfort chama o devoto que usa a devoção mariana como desculpa para continuar pecando, achando-se protegido?",
              "opcoes": [
                "Devoto crítico",
                "Devoto exterior",
                "Devoto presunçoso",
                "Devoto interesseiro"
              ],
              "correta": 2,
              "explicacao": "O \"devoto presunçoso\" é aquele que se acha automaticamente salvo por praticar devoções externas, sem buscar realmente converter-se."
            },
            {
              "pergunta": "Quais características marcam a verdadeira devoção, segundo Montfort?",
              "opcoes": [
                "Ser vistosa e exterior, sem exigir mudança de vida",
                "Interior, confiante, santa, constante e desinteressada",
                "Apenas emocional e passageira",
                "Baseada só em fórmulas e rituais fixos"
              ],
              "correta": 1,
              "explicacao": "A verdadeira devoção nasce do coração, é confiante, leva a evitar o pecado, é perseverante e não busca vantagem própria."
            },
            {
              "pergunta": "O que caracteriza o \"devoto inconstante\"?",
              "opcoes": [
                "Estudar demais a teologia mariana",
                "Mudar de prática devocional sem nunca perseverar em nenhuma",
                "Rezar o terço todos os dias",
                "Ser excessivamente cauteloso com a devoção"
              ],
              "correta": 1,
              "explicacao": "O devoto inconstante troca de devoções por modismo, sem constância — o oposto da perseverança que caracteriza a verdadeira devoção."
            }
          ],
          "xp": 30
        },
        {
          "id": 4,
          "titulo": "\"A Jesus por Maria\"",
          "versiculo": "Jo 2,5",
          "resumo": "Por que Montfort propõe chegar a Jesus passando por Maria.",
          "conteudo": [
            {
              "tipo": "texto",
              "texto": "Montfort chama Maria de \"molde de Deus\": assim como um molde dá forma exata ao que nele é derramado, Maria — que formou o próprio Cristo em seu ventre — nos conforma a Jesus de modo mais rápido, mais seguro e mais humilde. Passar por Maria não diminui Cristo: é seguir o mesmo caminho que o próprio Deus escolheu ao se encarnar por meio dela."
            },
            {
              "tipo": "versiculo",
              "texto": "\"Fazei tudo o que ele vos disser.\" — Jo 2,5"
            },
            {
              "tipo": "destaque",
              "texto": "Essa mediação materna de Maria é chamada de mediação mariana — e é sempre subordinada e dependente da única mediação de Cristo (1Tm 2,5: \"há um só mediador entre Deus e os homens, Cristo Jesus\"). Maria nunca substitui Jesus; ela sempre aponta para Ele."
            },
            {
              "tipo": "curiosidade",
              "texto": "O lema de São João Paulo II, \"Totus Tuus\" (Todo Teu), gravado em seu brasão papal com um \"M\" de Maria, nasceu diretamente da espiritualidade de Montfort — ele leu o Tratado ainda jovem, trabalhando numa fábrica na Polônia ocupada."
            }
          ],
          "perguntas": [
            {
              "pergunta": "O que Montfort quer dizer ao chamar Maria de \"molde de Deus\"?",
              "opcoes": [
                "Que Maria é uma estátua sagrada",
                "Que ela nos conforma a Jesus Cristo, como um molde dá forma ao que recebe",
                "Que ela substitui Jesus na salvação",
                "Que apenas os padres podem imitar Maria"
              ],
              "correta": 1,
              "explicacao": "Assim como um molde forma o que é derramado nele, Maria — que formou o próprio Jesus — nos ajuda a sermos conformados a Cristo."
            },
            {
              "pergunta": "Nas bodas de Caná, o que a atitude de Maria revela sobre sua mediação?",
              "opcoes": [
                "Ela sempre aponta e conduz para Jesus",
                "Ela resolve os problemas sozinha, sem Jesus",
                "Ela pede para ser o centro das atenções",
                "Ela desaconselha pedir milagres"
              ],
              "correta": 0,
              "explicacao": "Em \"fazei tudo o que ele vos disser\" (Jo 2,5), Maria não se coloca no centro — ela conduz diretamente a Jesus."
            },
            {
              "pergunta": "A mediação de Maria substitui a mediação única de Cristo?",
              "opcoes": [
                "Sim, ela é uma segunda mediadora independente",
                "Não — é subordinada e dependente da única mediação de Cristo (1Tm 2,5)",
                "Isso é uma questão sem resposta na doutrina católica",
                "Sim, mas só durante a Quaresma"
              ],
              "correta": 1,
              "explicacao": "1Tm 2,5 afirma que há um só mediador, Cristo Jesus. A mediação materna de Maria depende inteiramente da mediação única de seu Filho."
            }
          ],
          "xp": 30
        },
        {
          "id": 5,
          "titulo": "As Semanas de Preparação",
          "versiculo": "Fl 1,6",
          "resumo": "A estrutura do retiro clássico de 33 dias antes da consagração.",
          "conteudo": [
            {
              "tipo": "texto",
              "texto": "A preparação tradicional para a consagração, organizada ao longo de 33 dias, segue quatro fases: nos primeiros dias, a renúncia ao espírito do mundo (vaidade, orgulho, apegos desordenados); depois, o conhecimento de si mesmo (reconhecer a própria fragilidade e a necessidade da graça, em humildade); em seguida, o conhecimento de Nossa Senhora (aprofundar suas virtudes e seu papel na salvação); e, por fim, o conhecimento de Jesus Cristo por meio de Maria, culminando no Ato de Consagração."
            },
            {
              "tipo": "versiculo",
              "texto": "\"Aquele que começou em vós a boa obra, ele mesmo a levará à perfeição.\" — Fl 1,6"
            },
            {
              "tipo": "destaque",
              "texto": "É comum encerrar o retiro numa festa mariana — como 25 de março (Anunciação), 31 de maio (Visitação), 15 de agosto (Assunção) ou 8 de dezembro (Imaculada Conceição) — contando 33 dias para trás a partir da data escolhida."
            },
            {
              "tipo": "curiosidade",
              "texto": "Essa estrutura de 33 dias foi popularizada em formas mais acessíveis ao longo do século XX, mantendo fiéis as quatro fases originais propostas por Montfort em seu Tratado."
            }
          ],
          "perguntas": [
            {
              "pergunta": "Quantas fases tem a preparação clássica para a consagração?",
              "opcoes": [
                "Duas",
                "Três",
                "Quatro",
                "Sete"
              ],
              "correta": 2,
              "explicacao": "As quatro fases são: renúncia ao espírito do mundo, conhecimento de si mesmo, conhecimento de Maria e conhecimento de Jesus Cristo."
            },
            {
              "pergunta": "Quantos dias, tradicionalmente, dura essa preparação?",
              "opcoes": [
                "7 dias",
                "15 dias",
                "33 dias",
                "100 dias"
              ],
              "correta": 2,
              "explicacao": "A preparação clássica de Montfort é organizada, na forma mais difundida, ao longo de 33 dias."
            },
            {
              "pergunta": "Qual destas é uma data comum para concluir a consagração?",
              "opcoes": [
                "1º de janeiro",
                "15 de agosto (Assunção de Nossa Senhora)",
                "24 de junho",
                "2 de novembro"
              ],
              "correta": 1,
              "explicacao": "É tradicional escolher uma festa mariana para o dia da consagração, como 15 de agosto, 8 de dezembro, 25 de março ou 31 de maio."
            }
          ],
          "xp": 30
        },
        {
          "id": 6,
          "titulo": "O Ato de Consagração",
          "versiculo": "Lc 1,38",
          "resumo": "O que se entrega no ato final — e como viver a consagração no dia a dia.",
          "conteudo": [
            {
              "tipo": "texto",
              "texto": "No Ato de Consagração, a pessoa oferece a Jesus, pelas mãos de Maria, tudo o que é e tem: corpo e alma, bens interiores e exteriores, e até o valor de suas boas obras — para que Maria disponha de tudo isso para a maior glória de Deus. Montfort usa a expressão forte \"santa escravidão de amor\": não é servidão literal, mas uma entrega radical e livre, motivada pelo amor, inspirada nas próprias palavras de Maria."
            },
            {
              "tipo": "versiculo",
              "texto": "\"Eis a serva do Senhor; faça-se em mim segundo a tua palavra.\" — Lc 1,38"
            },
            {
              "tipo": "destaque",
              "texto": "Viver a consagração no cotidiano significa fazer tudo \"por Maria, com Maria, em Maria e para Maria\" — uma fórmula montfortiana que, no fim, aponta sempre para Jesus: fazer tudo assim serve para fazer tudo mais perfeitamente com, por, em e para Cristo."
            },
            {
              "tipo": "curiosidade",
              "texto": "Muitos que vivem essa consagração renovam o Ato anualmente e o relembram todas as manhãs, oferecendo as ações do dia a Jesus por meio de Maria — um gesto simples que sustenta a entrega feita no dia da consagração."
            }
          ],
          "perguntas": [
            {
              "pergunta": "O que a pessoa entrega no Ato de Consagração, segundo o método de Montfort?",
              "opcoes": [
                "Apenas suas orações diárias",
                "Tudo o que é e tem: corpo, alma, bens e o valor de suas boas obras",
                "Somente seus bens materiais",
                "Nada é entregue, é só um gesto simbólico"
              ],
              "correta": 1,
              "explicacao": "A consagração montfortiana é uma entrega total: corpo, alma, bens interiores e exteriores, e até o valor das próprias boas obras."
            },
            {
              "pergunta": "O que significa a expressão \"santa escravidão de amor\" usada por Montfort?",
              "opcoes": [
                "Uma submissão forçada e sem liberdade",
                "Uma entrega radical e livre, motivada pelo amor",
                "Um castigo espiritual para pecadores",
                "Um título apenas para religiosos consagrados"
              ],
              "correta": 1,
              "explicacao": "Não se trata de servidão literal, mas de uma doação total e livre de si mesmo por amor — inspirada em Maria se chamando \"serva do Senhor\" (Lc 1,38)."
            },
            {
              "pergunta": "A fórmula \"por Maria, com Maria, em Maria e para Maria\" tem como objetivo final...",
              "opcoes": [
                "Substituir a centralidade de Jesus Cristo",
                "Viver tudo mais perfeitamente com, por, em e para Jesus Cristo",
                "Reduzir a importância da Eucaristia",
                "Ser apenas uma devoção sem efeito prático"
              ],
              "correta": 1,
              "explicacao": "Toda a espiritualidade mariana de Montfort é cristocêntrica: passar por Maria serve para viver tudo mais unido a Jesus Cristo, nunca para substituí-lo."
            }
          ],
          "xp": 30
        }
      ]
    }
  ]
}$json$::jsonb
);
