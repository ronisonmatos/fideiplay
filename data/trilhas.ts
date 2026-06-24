export type BlocoTipo = 'texto' | 'versiculo' | 'destaque' | 'curiosidade';

export interface Bloco {
  tipo: BlocoTipo;
  texto: string;
}

export interface Pergunta {
  pergunta: string;
  opcoes: [string, string, string, string];
  correta: number;
  explicacao: string;
}

export interface Licao {
  id: number;
  titulo: string;
  versiculo: string;
  resumo: string;
  conteudo: Bloco[];
  perguntas: Pergunta[];
  xp: 80;
}

export interface Trilha {
  id: number;
  titulo: string;
  descricao: string;
  icone: string;
  nivel: string;
  totalLicoes: number;
  xpTotal: number;
  gratis: boolean;
  preco?: number;
  licoes: Licao[];
}

export const TRILHAS: Trilha[] = [
  {
    id: 1,
    titulo: 'Catequese',
    descricao: 'Fundamentos da fé católica',
    icone: '✝️',
    nivel: 'Iniciante',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: true,
    licoes: [
      {
        id: 1,
        titulo: 'O que é fé?',
        versiculo: 'Heb 11,1',
        resumo: 'Compreenda o conceito de fé como virtude teologal e adesão pessoal a Deus.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A fé é a resposta do ser humano a Deus que se revela. Ela envolve tanto a inteligência — que adere às verdades reveladas — quanto a vontade — que se entrega livremente a Deus. Não é um sentimento vago, mas um ato pessoal e livre pelo qual o homem se confia inteiramente a Deus.',
          },
          {
            tipo: 'versiculo',
            texto: '"A fé é a garantia daquilo que se espera e a prova das coisas que não se veem." — Heb 11,1',
          },
          {
            tipo: 'destaque',
            texto: 'A fé é uma das três virtudes teologais — junto com a Esperança e a Caridade. São chamadas "teologais" porque têm Deus como origem, motivo e objeto direto. Elas são infundidas por Deus diretamente na alma no Batismo.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Muita gente confunde fé com religião. A fé é a adesão pessoal e íntima a Deus — uma relação viva. A religião é o conjunto de práticas, ritos e crenças que expressam essa fé em comunidade. Pode-se ter religião sem fé viva, e a fé pode existir mesmo antes de uma prática religiosa formal.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Segundo Heb 11,1, a fé é...',
            opcoes: [
              'A garantia do que se espera e prova do que não se vê',
              'Um sentimento de bem-estar espiritual',
              'A obediência cega às normas da Igreja',
              'A certeza absoluta baseada em evidências',
            ],
            correta: 0,
            explicacao: 'Hebreus 11,1 define a fé como "a garantia daquilo que se espera e a prova das coisas que não se veem" — ela nos dá certeza sobre realidades ainda não visíveis.',
          },
          {
            pergunta: 'As virtudes teologais são...',
            opcoes: [
              'Humildade, Obediência e Pobreza',
              'Prudência, Justiça e Fortaleza',
              'Fé, Esperança e Caridade',
              'Oração, Jejum e Esmola',
            ],
            correta: 2,
            explicacao: 'As três virtudes teologais são Fé, Esperança e Caridade. São chamadas "teologais" por terem Deus como objeto direto, e são distintas das virtudes cardeais (prudência, justiça, fortaleza, temperança).',
          },
          {
            pergunta: 'A fé é chamada de virtude teologal porque...',
            opcoes: [
              'Foi inventada pelos teólogos medievais',
              'É infundida por Deus diretamente na alma',
              'Depende apenas do esforço humano',
              'É praticada somente em contextos religiosos',
            ],
            correta: 1,
            explicacao: 'As virtudes teologais têm Deus como sua origem e são infundidas diretamente por Ele na alma, especialmente no Batismo. Elas ultrapassam as capacidades naturais humanas.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'Quem é Deus?',
        versiculo: 'Ex 3,14',
        resumo: 'Conheça os atributos de Deus e o mistério da Santíssima Trindade.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Deus é o ser supremo, criador de tudo o que existe. Ele é eterno, ou seja, não teve início nem terá fim. É o fundamento de toda a realidade. Ao longo da história, Ele se revelou progressivamente ao povo de Israel e, plenamente, em Jesus Cristo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Deus disse a Moisés: Eu Sou o que Sou." — Ex 3,14',
          },
          {
            tipo: 'destaque',
            texto: 'A Santíssima Trindade é o mistério central da fé cristã: um único Deus em três Pessoas — Pai, Filho e Espírito Santo. As três Pessoas são distintas, mas de uma mesma substância divina. Este mistério supera a razão humana e só é conhecido por revelação.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Deus possui atributos que expressam sua perfeição absoluta: Onipotência (todo-poderoso), Onisciência (conhece tudo), Onipresença (está em todo lugar), Eternidade (fora do tempo) e Imutabilidade (não muda). Esses atributos nos ajudam a contemplar quem Ele é.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quando Moisés perguntou o nome de Deus, Ele respondeu...',
            opcoes: [
              'Eu Sou o que Sou',
              'Sou o Deus de Abraão',
              'Sou o Senhor dos Exércitos',
              'Sou o Altíssimo',
            ],
            correta: 0,
            explicacao: 'Em Êxodo 3,14, Deus revela seu nome a Moisés como "Eu Sou o que Sou" — expressando sua existência absoluta e eterna, sem origem nem fim.',
          },
          {
            pergunta: 'A Santíssima Trindade é formada por...',
            opcoes: [
              'Criador, Redentor e Santificador como três deuses',
              'Deus, Jesus e Maria',
              'Pai, Filho e Espírito Santo',
              'Pai, Maria e Jesus',
            ],
            correta: 2,
            explicacao: 'A Santíssima Trindade é um único Deus em três Pessoas distintas: Pai, Filho (Jesus Cristo) e Espírito Santo. É o mistério central do cristianismo.',
          },
          {
            pergunta: 'Qual atributo descreve Deus como presente em todos os lugares?',
            opcoes: [
              'Onipotência',
              'Onipresença',
              'Onisciência',
              'Imutabilidade',
            ],
            correta: 1,
            explicacao: 'A Onipresença é o atributo pelo qual Deus está presente em todo lugar simultaneamente. A Onipotência é o poder ilimitado; a Onisciência é o conhecimento de tudo.',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'Jesus Cristo',
        versiculo: 'Jo 1,14',
        resumo: 'Descubra o mistério da Encarnação e a dupla natureza de Jesus.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Jesus Cristo é o Filho de Deus que se fez homem. A Encarnação é o mistério pelo qual a Segunda Pessoa da Trindade assumiu a natureza humana no seio da Virgem Maria. Ele nasceu em Belém, viveu na Galileia, morreu na cruz e ressuscitou ao terceiro dia.',
          },
          {
            tipo: 'versiculo',
            texto: '"E o Verbo se fez carne e habitou entre nós, e nós contemplamos a sua glória." — Jo 1,14',
          },
          {
            tipo: 'destaque',
            texto: 'O Concílio de Calcedônia (451 d.C.) definiu que Jesus Cristo possui duas naturezas — humana e divina — unidas em uma única Pessoa. Ele é verdadeiro Deus e verdadeiro homem, sem mistura nem confusão entre as naturezas.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A missão de Jesus foi a Redenção da humanidade. Através de sua morte na cruz, Ele pagou o preço do pecado de toda a humanidade. Com a Ressurreição, venceu a morte e abriu o caminho para a vida eterna. Por isso, o cristão é chamado a participar dessa vida nova.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A Encarnação significa que...',
            opcoes: [
              'Deus se fez homem em Jesus Cristo',
              'Jesus foi um profeta inspirado por Deus',
              'Deus adotou Jesus como filho no Batismo',
              'Jesus era apenas humano com poderes especiais',
            ],
            correta: 0,
            explicacao: 'A Encarnação é o mistério pelo qual o Filho de Deus assumiu a natureza humana — tornando-se verdadeiro Deus e verdadeiro homem em Jesus Cristo.',
          },
          {
            pergunta: 'Jesus Cristo possui...',
            opcoes: [
              'Apenas natureza humana',
              'Apenas natureza divina',
              'Duas naturezas: humana e divina',
              'Uma natureza mista, nem humana nem divina',
            ],
            correta: 2,
            explicacao: 'O Concílio de Calcedônia (451) definiu que Cristo tem duas naturezas — humana e divina — unidas em uma só Pessoa, sem mistura nem separação.',
          },
          {
            pergunta: 'A missão principal de Jesus foi...',
            opcoes: [
              'Reformar o judaísmo do seu tempo',
              'Salvar a humanidade do pecado e da morte',
              'Ensinar apenas boas condutas morais',
              'Estabelecer um reino político em Israel',
            ],
            correta: 1,
            explicacao: 'Jesus veio para redimir a humanidade: pela sua morte e ressurreição, venceu o pecado e a morte, abrindo o caminho para a vida eterna.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'O Espírito Santo',
        versiculo: 'At 2,1-4',
        resumo: 'Conheça a Terceira Pessoa da Trindade e seus dons.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Espírito Santo é a Terceira Pessoa da Santíssima Trindade. Após a Ascensão de Jesus, Ele foi enviado pelo Pai e pelo Filho sobre os Apóstolos no dia de Pentecostes. Desde então, habita na Igreja e nos corações dos batizados.',
          },
          {
            tipo: 'versiculo',
            texto: '"Quando chegou o dia de Pentecostes, estavam todos reunidos no mesmo lugar. De repente, veio do céu um ruído como o de um vento impetuoso... e viram línguas como de fogo que se distribuíam e pousavam sobre cada um deles." — At 2,1-3',
          },
          {
            tipo: 'destaque',
            texto: 'O Espírito Santo confere 7 dons: Sabedoria, Entendimento, Conselho, Fortaleza, Ciência, Piedade e Temor de Deus. Esses dons aperfeiçoam as virtudes e tornam o cristão apto a viver segundo a vontade de Deus.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Espírito Santo é representado na Bíblia de diversas formas simbólicas: como pomba (no Batismo de Jesus), línguas de fogo (Pentecostes), vento (sopro de Deus), água (que sacia a sede espiritual) e óleo (unção que fortalece). Cada símbolo revela um aspecto de sua ação.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Pentecostes foi quando...',
            opcoes: [
              'O Espírito Santo desceu sobre os Apóstolos',
              'Jesus ressuscitou dos mortos',
              'Jesus nasceu em Belém',
              'Os Apóstolos foram escolhidos por Jesus',
            ],
            correta: 0,
            explicacao: 'Pentecostes foi o dia em que o Espírito Santo desceu sobre os Apóstolos reunidos com Maria no Cenáculo, 50 dias após a Páscoa. É considerado o "nascimento" da Igreja.',
          },
          {
            pergunta: 'Quantos dons possui o Espírito Santo?',
            opcoes: [
              'Doze',
              'Três',
              'Sete',
              'Cinco',
            ],
            correta: 2,
            explicacao: 'O Espírito Santo confere 7 dons: Sabedoria, Entendimento, Conselho, Fortaleza, Ciência, Piedade e Temor de Deus, baseados em Isaías 11,2-3.',
          },
          {
            pergunta: 'O Espírito Santo é representado simbolicamente por...',
            opcoes: [
              'Cordeiro e espada',
              'Pomba e línguas de fogo',
              'Leão e águia',
              'Peixe e ancora',
            ],
            correta: 1,
            explicacao: 'A pomba representa o Espírito Santo no Batismo de Jesus (Mt 3,16) e as línguas de fogo simbolizam sua descida em Pentecostes (At 2,3).',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'Os Sacramentos',
        versiculo: 'Jo 20,22-23',
        resumo: 'Introdução aos 7 sacramentos e seu papel na vida cristã.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os sacramentos são sinais eficazes da graça, instituídos por Cristo e confiados à Igreja. Por meio deles, Deus comunica sua vida divina às pessoas. São "eficazes" porque realmente realizam o que significam — não são meros símbolos.',
          },
          {
            tipo: 'versiculo',
            texto: '"Recebei o Espírito Santo. Aqueles a quem perdoardes os pecados, serão perdoados; àqueles a quem os retiverdes, serão retidos." — Jo 20,22-23',
          },
          {
            tipo: 'destaque',
            texto: 'Os 7 sacramentos são: Batismo, Crisma (Confirmação), Eucaristia, Penitência (Confissão), Unção dos Enfermos, Ordem Sacerdotal e Matrimônio. Três deles (Batismo, Crisma e Ordem) imprimem um caráter permanente na alma e por isso são recebidos apenas uma vez.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Os sacramentos têm sua origem nas palavras e gestos de Jesus durante sua vida terrena. Ele batizou, perdonou pecados, instituiu a Eucaristia na Última Ceia, ordenou os Apóstolos. A Igreja reconhece que foi o próprio Cristo quem os estabeleceu como canais de graça.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quantos sacramentos existem na Igreja Católica?',
            opcoes: [
              'Sete',
              'Dois',
              'Cinco',
              'Doze',
            ],
            correta: 0,
            explicacao: 'A Igreja Católica possui 7 sacramentos: Batismo, Crisma, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio.',
          },
          {
            pergunta: 'Um sacramento é...',
            opcoes: [
              'Um símbolo sem efeito real na alma',
              'Um ritual criado pela Igreja na Idade Média',
              'Sinal eficaz da graça instituído por Cristo',
              'Uma prática opcional para os católicos',
            ],
            correta: 2,
            explicacao: 'Sacramento é um sinal eficaz da graça, ou seja, não é apenas símbolo — ele realmente comunica a graça divina. Foi instituído por Jesus Cristo e confiado à Igreja.',
          },
          {
            pergunta: 'Quais sacramentos imprimem caráter permanente na alma?',
            opcoes: [
              'Eucaristia, Penitência e Matrimônio',
              'Batismo, Crisma e Ordem',
              'Batismo, Eucaristia e Matrimônio',
              'Todos os sete sacramentos',
            ],
            correta: 1,
            explicacao: 'Batismo, Crisma e Ordem imprimem um caráter espiritual permanente na alma, razão pela qual são recebidos uma única vez.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'O Batismo',
        versiculo: 'Jo 3,5',
        resumo: 'O primeiro sacramento: efeitos, graça batismal e padrinhos.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Batismo é o primeiro e fundamental sacramento cristão. Por ele, a pessoa é incorporada à Igreja, recebe o perdão do pecado original e dos pecados pessoais, torna-se filho(a) de Deus e templo do Espírito Santo. É a "porta" de entrada para os demais sacramentos.',
          },
          {
            tipo: 'versiculo',
            texto: '"Em verdade, em verdade te digo: ninguém pode entrar no Reino de Deus se não nascer da água e do Espírito." — Jo 3,5',
          },
          {
            tipo: 'destaque',
            texto: 'Os principais efeitos do Batismo são: perdão do pecado original e de todos os pecados pessoais anteriores; incorporação à Igreja, Corpo de Cristo; recebimento do Espírito Santo; tornar-se filho de Deus e herdeiro da vida eterna; impressão do caráter batismal permanente na alma.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Os padrinhos no Batismo não são apenas uma tradição social. Eles assumem um compromisso espiritual sério: testemunhar a fé diante da Igreja, apoiar a formação cristã do afilhado e rezar por ele. A escolha dos padrinhos deveria levar em conta a profundidade da fé deles.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Batismo apaga...',
            opcoes: [
              'O pecado original e os pecados pessoais anteriores',
              'Apenas os pecados cometidos na infância',
              'Somente as más tendências da pessoa',
              'Os pecados futuros automaticamente',
            ],
            correta: 0,
            explicacao: 'O Batismo perdoa o pecado original (herdado de Adão) e todos os pecados pessoais cometidos antes do Batismo. Depois do Batismo, os pecados são perdoados pelo sacramento da Penitência.',
          },
          {
            pergunta: 'Jesus disse a Nicodemos que para entrar no Reino é preciso nascer...',
            opcoes: [
              'Por obras e méritos',
              'De novo da mãe',
              'Da água e do Espírito',
              'Pelo estudo das Escrituras',
            ],
            correta: 2,
            explicacao: 'Em Jo 3,5, Jesus explica que é preciso nascer da água (Batismo) e do Espírito (Santo) para entrar no Reino de Deus — referência clara ao sacramento do Batismo.',
          },
          {
            pergunta: 'Qual é o papel dos padrinhos no Batismo?',
            opcoes: [
              'Apenas assinar o registro na paróquia',
              'Testemunhar a fé e apoiar a formação cristã do batizado',
              'Substituir os pais em caso de morte',
              'Garantir presentes ao batizando',
            ],
            correta: 1,
            explicacao: 'Os padrinhos assumem o compromisso de testemunhar a fé, apoiar a formação cristã do afilhado e rezar por ele. É uma responsabilidade espiritual séria diante da Igreja.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'A Eucaristia',
        versiculo: 'Jo 6,51',
        resumo: 'A fonte e ápice da vida cristã: presença real e transubstanciação.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Eucaristia é chamada de "fonte e ápice" da vida cristã porque toda a vida da Igreja converge para ela e dela emana. Na Missa, o pão e o vinho se tornam verdadeiramente o Corpo e Sangue de Cristo — não simbolicamente, mas de forma real e substancial.',
          },
          {
            tipo: 'versiculo',
            texto: '"Eu sou o pão vivo descido do céu; se alguém comer deste pão, viverá para sempre." — Jo 6,51',
          },
          {
            tipo: 'destaque',
            texto: 'A transubstanciação é o termo teológico que descreve o que acontece na Consagração: a substância do pão e do vinho é inteiramente transformada no Corpo e Sangue de Cristo, permanecendo apenas as aparências (acidentes) externas do pão e do vinho.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Para receber a Comunhão com fruto espiritual, a Igreja pede que o fiel esteja em estado de graça (sem pecado mortal) e guarde o jejum eucarístico de pelo menos 1 hora antes da Comunhão. Esses requisitos expressam o respeito pela presença real de Cristo.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A transubstanciação é...',
            opcoes: [
              'A transformação do pão e vinho no Corpo e Sangue de Cristo',
              'Um símbolo da presença espiritual de Jesus',
              'A mudança das aparências do pão e do vinho',
              'Um ritual de recordação da Última Ceia',
            ],
            correta: 0,
            explicacao: 'A transubstanciação significa que na Consagração a substância do pão e do vinho é transformada no Corpo e Sangue de Cristo, permanecendo apenas as aparências externas.',
          },
          {
            pergunta: 'A Eucaristia é chamada de "fonte e ápice" porque...',
            opcoes: [
              'Foi o primeiro sacramento instituído por Cristo',
              'É o sacramento mais fácil de receber',
              'Toda a vida da Igreja converge para ela e dela emana',
              'É celebrada todos os dias da semana',
            ],
            correta: 2,
            explicacao: 'O Concílio Vaticano II ensina que a Eucaristia é "fonte e ápice" da vida cristã — todo o agir da Igreja aponta para ela e dela recebe força.',
          },
          {
            pergunta: 'O jejum eucarístico deve ser de pelo menos...',
            opcoes: [
              '3 horas antes da comunhão',
              '1 hora antes da comunhão',
              '12 horas antes da comunhão',
              'Apenas uns minutos antes',
            ],
            correta: 1,
            explicacao: 'O Código de Direito Canônico (cân. 919) estabelece que o fiel deve abster-se de qualquer alimento ou bebida por pelo menos 1 hora antes da Sagrada Comunhão.',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'A Crisma',
        versiculo: 'At 8,17',
        resumo: 'A confirmação da fé batismal e os dons do Espírito Santo.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Crisma (ou Confirmação) é o sacramento que confirma e aperfeiçoa a graça batismal. Por ela, o crismando recebe os dons do Espírito Santo em plenitude, tornando-se um testemunho maduro e responsável da fé cristã. É o complemento do Batismo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Então lhes impuseram as mãos e eles receberam o Espírito Santo." — At 8,17',
          },
          {
            tipo: 'destaque',
            texto: 'Na Crisma, o crismando recebe os 7 dons do Espírito Santo (Sabedoria, Entendimento, Conselho, Fortaleza, Ciência, Piedade, Temor de Deus) que o capacitam a viver e defender a fé com responsabilidade. O ministro ordinário da Crisma é o bispo.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O nome "Crisma" vem do grego chrisma = ungir com óleo. No sacramento, usa-se o Santo Crisma — óleo de oliva misturado com bálsamo perfumado, consagrado pelo bispo na Missa Crismal da Quinta-Feira Santa. A unção na testa simboliza a força do Espírito.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A Crisma confirma e aperfeiçoa...',
            opcoes: [
              'A graça recebida no Batismo',
              'A preparação para o Matrimônio',
              'Os votos religiosos da vida consagrada',
              'A admissão ao sacerdócio',
            ],
            correta: 0,
            explicacao: 'A Crisma completa o Batismo, confirmando e aperfeiçoando a graça batismal. Por isso é chamada de "sacramento da confirmação".',
          },
          {
            pergunta: 'Na Crisma, o crismando recebe...',
            opcoes: [
              'A ordenação ao diaconato',
              'O perdão de todos os pecados',
              'Os dons do Espírito Santo em plenitude',
              'A permissão para receber a Eucaristia',
            ],
            correta: 2,
            explicacao: 'A Crisma confere os 7 dons do Espírito Santo — Sabedoria, Entendimento, Conselho, Fortaleza, Ciência, Piedade e Temor de Deus — capacitando o cristão para testemunhar a fé.',
          },
          {
            pergunta: 'O ministro ordinário da Crisma é...',
            opcoes: [
              'O pároco',
              'O bispo',
              'O diácono',
              'O catequista',
            ],
            correta: 1,
            explicacao: 'O Código de Direito Canônico (cân. 882) estabelece que o ministro ordinário da Confirmação é o bispo. Em casos especiais, o bispo pode delegar sacerdotes.',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 2,
    titulo: 'A Santa Missa',
    descricao: 'Conheça cada parte da celebração eucarística',
    icone: '🕊️',
    nivel: 'Iniciante',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: true,
    licoes: [
      {
        id: 1,
        titulo: 'O que é a Missa?',
        versiculo: 'Lc 22,19',
        resumo: 'Origem, natureza e importância do sacrifício eucarístico.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Santa Missa é o centro da vida católica. Nela, o sacrifício de Jesus Cristo na cruz é tornado presente de modo incruento e sacramental. Não é uma repetição do Calvário, mas o mesmo sacrifício que se tornou eterno e é celebrado em todo o mundo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Depois, tomando o pão, deu graças, partiu-o e o deu a eles, dizendo: Este é o meu Corpo entregue por vós. Fazei isto em memória de mim." — Lc 22,19',
          },
          {
            tipo: 'destaque',
            texto: 'A Missa é simultaneamente: Sacrifício (renovação do sacrifício da Cruz), Memorial (presença real da Última Ceia), Refeição (banquete eucarístico) e Louvor (ação de graças — Eucharistia em grego). Todos esses aspectos se complementam.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O nome "Missa" vem do latim "Ite, missa est" — a fórmula de despedida ao final da celebração, que significa "Ide, a assembleia está encerrada" ou "Ide, enviados". Com o tempo, "missa" passou a designar toda a celebração eucarística.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A Missa é...',
            opcoes: [
              'Renovação do sacrifício de Cristo na Cruz',
              'Apenas uma reunião de oração comunitária',
              'Uma repetição literal da morte de Jesus',
              'Um símbolo sem efeito real',
            ],
            correta: 0,
            explicacao: 'A Missa torna presente de modo sacramental o sacrifício de Cristo na Cruz — não é repetição, mas o mesmo sacrifício eterno que se atualiza na celebração.',
          },
          {
            pergunta: 'Jesus instituiu a Eucaristia na...',
            opcoes: [
              'Multiplicação dos pães',
              'Transfiguração',
              'Última Ceia',
              'Ressurreição',
            ],
            correta: 2,
            explicacao: 'Jesus instituiu a Eucaristia na noite da Última Ceia, véspera de sua Paixão, quando tomou o pão e o vinho e os transformou em seu Corpo e Sangue.',
          },
          {
            pergunta: 'O nome "Missa" vem do latim e significa...',
            opcoes: [
              'Sacrifício',
              'Envio',
              'Oração',
              'Reunião',
            ],
            correta: 1,
            explicacao: 'O nome Missa deriva do "Ite, missa est" (Ide, está encerrada/enviados) — a fórmula de despedida que expressa o envio missionário dos fiéis ao final da celebração.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'Ritos Iniciais',
        versiculo: 'Sl 95,6',
        resumo: 'Entrada, ato penitencial, Glória e oração coleta.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os Ritos Iniciais preparam os fiéis para a celebração, ajudando-os a sair do cotidiano e entrar na atitude de louvor e escuta. Compreendem: canto de entrada, saudação do sacerdote, ato penitencial, Quírie (Senhor, tende piedade), Glória e oração coleta.',
          },
          {
            tipo: 'versiculo',
            texto: '"Vinde, prostrai-vos, adoremos, dobrai os joelhos diante do Senhor que nos criou." — Sl 95,6',
          },
          {
            tipo: 'destaque',
            texto: 'O Ato Penitencial é o momento em que toda a assembleia reconhece seus pecados diante de Deus e pede misericórdia. O Confiteor ("Confesso a Deus Todo-Poderoso...") é a forma mais completa, onde se bate no peito como sinal de contrito arrependimento.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Glória é um hino antiquíssimo da Igreja, chamado de "Grande Doxologia". Nos domingos (fora da Quaresma e Advento) e nas festas, eleva o louvor a Deus Pai, Jesus Cristo e o Espírito Santo. A Oração Coleta, que encerra os Ritos Iniciais, "coleta" as intenções de toda a assembleia em uma só oração presidida pelo sacerdote.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Ato Penitencial serve para...',
            opcoes: [
              'Reconhecer os pecados e pedir perdão antes da celebração',
              'Substituir o sacramento da Confissão',
              'Apenas cumprir uma formalidade litúrgica',
              'Realizar a absolvição sacramental coletiva',
            ],
            correta: 0,
            explicacao: 'O Ato Penitencial prepara os fiéis para a celebração, ajudando-os a reconhecer sua indignidade e confiar na misericórdia de Deus. Não substitui a Confissão sacramental.',
          },
          {
            pergunta: 'O "Glória" é rezado para...',
            opcoes: [
              'Professar a fé cristã',
              'Pedir perdão pelos pecados',
              'Louvar a Deus Pai, Filho e Espírito Santo',
              'Interceder pelos defuntos',
            ],
            correta: 2,
            explicacao: 'O Glória é um hino de louvor trinitário — dirige-se ao Pai, ao Filho Jesus Cristo e menciona o Espírito Santo. É cantado nos domingos e festas fora da Quaresma e Advento.',
          },
          {
            pergunta: 'A oração da coleta encerra os Ritos Iniciais e é proferida por...',
            opcoes: [
              'Um leitor escolhido',
              'O sacerdote celebrante',
              'Toda a assembleia em uníssono',
              'O diácono',
            ],
            correta: 1,
            explicacao: 'A oração coleta é presidida pelo sacerdote celebrante, que "coleta" as intenções silenciosas de toda a assembleia e as apresenta a Deus em nome de todos.',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'Liturgia da Palavra',
        versiculo: 'Is 55,11',
        resumo: 'Leituras, salmo, Evangelho e homilia.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Na Liturgia da Palavra, Deus fala ao seu povo. A estrutura inclui: 1ª leitura (geralmente do Antigo Testamento), Salmo Responsorial, 2ª leitura (cartas apostólicas), Aclamação do Evangelho (Aleluia) e o Evangelho, seguido da Homilia e da Oração Universal.',
          },
          {
            tipo: 'versiculo',
            texto: '"A minha palavra não volta a mim sem resultado; ela realizará tudo o que eu quero e levará a bom termo a missão que lhe confiei." — Is 55,11',
          },
          {
            tipo: 'destaque',
            texto: 'A Homilia não é uma palestra ou conferência — é a explicação da Palavra de Deus aplicada à vida concreta dos fiéis. Deve ser feita pelo sacerdote ou diácono, conectando as leituras com a vida cristã de hoje.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Os fiéis ficam de pé durante a proclamação do Evangelho como sinal de respeito e prontidão para acolher as palavras de Cristo. Em algumas tradições, vira-se para o lado do Evangelho (geralmente o norte) como gesto de atenção. O livro do Evangelho é frequentemente incensado e processado em solenidade.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual a ordem correta na Liturgia da Palavra?',
            opcoes: [
              '1ª leitura, Salmo, 2ª leitura, Evangelho, Homilia',
              'Homilia, 1ª leitura, Evangelho, Salmo',
              'Evangelho, 1ª leitura, 2ª leitura, Homilia',
              '2ª leitura, Salmo, 1ª leitura, Evangelho',
            ],
            correta: 0,
            explicacao: 'A Liturgia da Palavra segue a ordem: 1ª leitura (AT), Salmo Responsorial, 2ª leitura (Epístola), Aleluia, Evangelho e Homilia — em progressão do Antigo ao Novo Testamento.',
          },
          {
            pergunta: 'O Salmo Responsorial é cantado ou rezado entre...',
            opcoes: [
              'A Homilia e o Credo',
              'A 2ª leitura e o Evangelho',
              'A 1ª e a 2ª leitura',
              'O Evangelho e a Homilia',
            ],
            correta: 2,
            explicacao: 'O Salmo Responsorial ocorre entre a 1ª e a 2ª leitura, servindo como meditação e resposta à Palavra proclamada na primeira leitura.',
          },
          {
            pergunta: 'A Homilia deve ser feita por...',
            opcoes: [
              'Qualquer fiel preparado',
              'O sacerdote ou diácono',
              'O leitor do Evangelho',
              'O cantor da missa',
            ],
            correta: 1,
            explicacao: 'A Homilia é reservada ao sacerdote ou diácono, pois é a proclamação autorizada da Palavra no contexto litúrgico, conectando as leituras com a vida da fé.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'O Credo',
        versiculo: '1Cor 15,3-4',
        resumo: 'História e artigos da fé no Credo Niceno-Constantinopolitano.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Credo (do latim credo = creio) é a profissão de fé da Igreja. É recitado nos domingos e solenidades após a Homilia. Sua formulação atual foi definida nos Concílios de Niceia (325 d.C.) e Constantinopla (381 d.C.) para responder a heresias que negavam a divindade de Cristo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Transmiti-vos em primeiro lugar o que eu mesmo recebi: que Cristo morreu por nossos pecados, segundo as Escrituras; que foi sepultado; que ressuscitou ao terceiro dia, segundo as Escrituras." — 1Cor 15,3-4',
          },
          {
            tipo: 'destaque',
            texto: 'O Credo Niceno-Constantinopolitano professa a fé na Trindade (Pai criador, Jesus Cristo Filho de Deus encarnado, morto e ressuscitado; Espírito Santo Senhor e Vivificador) e na Igreja (una, santa, católica e apostólica), no Batismo, na ressurreição dos mortos e na vida eterna.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Durante o Credo, ao dizer "e se fez homem" (ou "e se encarnou"), todos se inclinam levemente ou ajoelham. Este gesto expressa adoração diante do mistério da Encarnação — o momento em que o eterno Filho de Deus assumiu a natureza humana. Nas solenidades da Natividade e Anunciação, ajoelha-se completamente.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Credo Niceno foi formulado no Concílio de Niceia em...',
            opcoes: [
              '325 d.C.',
              '451 d.C.',
              '100 d.C.',
              '600 d.C.',
            ],
            correta: 0,
            explicacao: 'O Concílio de Niceia (325 d.C.) formulou o Credo em resposta ao arianismo, que negava a divindade de Cristo. O Concílio de Constantinopla (381) o completou.',
          },
          {
            pergunta: 'O Credo professa a fé em...',
            opcoes: [
              'Maria e os santos como mediadores',
              'Apenas em Jesus Cristo como Salvador',
              'Deus Pai, Filho e Espírito Santo, e na Igreja',
              'A Bíblia como única autoridade',
            ],
            correta: 2,
            explicacao: 'O Credo Niceno-Constantinopolitano professa a fé nas três Pessoas da Trindade e na Igreja una, santa, católica e apostólica, além do Batismo, ressurreição e vida eterna.',
          },
          {
            pergunta: 'Por que nos inclinamos ao dizer "e se fez homem"?',
            opcoes: [
              'Por ser uma norma arbitrária da liturgia',
              'Em adoração ao mistério da Encarnação',
              'Para pedir bênção ao sacerdote',
              'Em memória dos mártires',
            ],
            correta: 1,
            explicacao: 'A inclinação ao dizer "e se fez homem" é um gesto de adoração diante do sublime mistério da Encarnação — Deus que se fez homem por amor a nós.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'Liturgia Eucarística',
        versiculo: 'Mt 26,26',
        resumo: 'Ofertório, Oração Eucarística e a sagrada Consagração.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Liturgia Eucarística é o coração da Missa. Começa com o Ofertório (apresentação do pão, vinho e oferendas), segue com a Oração Eucarística (ação de graças, Santo, epiclese, narrativa da instituição, Consagração, anamnese, intercessões) e culmina na Doxologia.',
          },
          {
            tipo: 'versiculo',
            texto: '"Enquanto comiam, Jesus tomou o pão, e depois de abençoá-lo, partiu-o e o deu aos discípulos, dizendo: Tomai e comei, isto é o meu Corpo." — Mt 26,26',
          },
          {
            tipo: 'destaque',
            texto: 'A Consagração é o ápice da Missa: no momento em que o sacerdote pronuncia as palavras de Cristo sobre o pão e o vinho, ocorre a transubstanciação — o pão e o vinho se tornam verdadeiramente o Corpo e Sangue de Cristo. A elevação que se segue convida à adoração.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Missal Romano atual possui quatro Orações Eucarísticas principais: a I (Cânon Romano, antiquíssimo), a II (a mais breve, baseada na Tradição Apostólica de Hipólito, século III), a III e a IV. Para ocasiões especiais, existem orações para missas com crianças, reconciliação e outras temáticas.',
          },
        ],
        perguntas: [
          {
            pergunta: 'No ofertório, são apresentados ao altar...',
            opcoes: [
              'O pão, o vinho e as oferendas dos fiéis',
              'Apenas o cálice com vinho',
              'As intenções escritas pelos fiéis',
              'Os livros sagrados da liturgia',
            ],
            correta: 0,
            explicacao: 'No Ofertório são apresentados o pão e o vinho (que serão consagrados) e as oferendas dos fiéis, que simbolizam a entrega de suas vidas a Deus.',
          },
          {
            pergunta: 'A Consagração é o momento em que...',
            opcoes: [
              'A assembleia recebe a Comunhão',
              'O sacerdote abençoa os fiéis',
              'O pão e o vinho se tornam o Corpo e Sangue de Cristo',
              'São lidas as intenções da Missa',
            ],
            correta: 2,
            explicacao: 'Na Consagração, pelo poder do Espírito Santo e pelas palavras de Cristo pronunciadas pelo sacerdote, o pão e o vinho se tornam o Corpo e Sangue de Cristo — transubstanciação.',
          },
          {
            pergunta: 'Quantas Orações Eucarísticas principais são usadas na Missa?',
            opcoes: [
              'Uma única',
              'Quatro principais',
              'Sete',
              'Doze',
            ],
            correta: 1,
            explicacao: 'O Missal Romano tem quatro Orações Eucarísticas principais (I a IV), além de formas especiais para situações particulares como missas com crianças.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'O Pai Nosso na Missa',
        versiculo: 'Mt 6,9',
        resumo: 'Contexto litúrgico, embolismo e doxologia.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Pai Nosso ocupa um lugar privilegiado na Missa: é rezado após a Oração Eucarística e antes da Comunhão, como preparação para receber o Corpo de Cristo. Jesus mesmo nos ensinou esta oração, por isso ela é chamada de "oração dominical" (do Senhor).',
          },
          {
            tipo: 'versiculo',
            texto: '"Vós, portanto, orai assim: Pai nosso, que estás no céu, santificado seja o teu nome..." — Mt 6,9',
          },
          {
            tipo: 'destaque',
            texto: 'Após o Pai Nosso, o sacerdote reza o Embolismo — uma oração que prolonga a última petição ("livrai-nos do mal"), pedindo: "Livrai-nos, Senhor, de todos os males passados, presentes e futuros." A assembleia responde com a Doxologia: "Porque vosso é o Reino, o poder e a glória, para sempre, Senhor."',
          },
          {
            tipo: 'curiosidade',
            texto: 'A Doxologia final do Pai Nosso ("Porque vosso é o Reino...") não aparece nas versões mais antigas dos Evangelhos de Mateus e Lucas. Foi acrescentada na liturgia primitiva para encerrar a oração com louvor. As tradições protestantes e orientais a incluem no texto do Pai Nosso; na liturgia católica, ela é dita separadamente após o embolismo.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Pai Nosso na Missa é rezado...',
            opcoes: [
              'Após a Oração Eucarística, antes da Comunhão',
              'No início da Missa, como ato penitencial',
              'Após a Homilia, antes do Credo',
              'No final da Missa, antes da bênção',
            ],
            correta: 0,
            explicacao: 'O Pai Nosso é rezado na Missa após a Oração Eucarística e antes da Comunhão, servindo como preparação para receber o Corpo e Sangue de Cristo.',
          },
          {
            pergunta: 'O embolismo na Missa é a oração que começa...',
            opcoes: [
              '"Cordeiro de Deus que tirais o pecado do mundo"',
              '"Senhor, não sou digno"',
              '"Livrai-nos, Senhor, de todos os males"',
              '"Deus, sede propício a mim, pecador"',
            ],
            correta: 2,
            explicacao: 'O embolismo começa com "Livrai-nos, Senhor, de todos os males passados, presentes e futuros..." e prolonga a última petição do Pai Nosso.',
          },
          {
            pergunta: 'Quantas petições contém o Pai Nosso?',
            opcoes: [
              'Três',
              'Sete',
              'Cinco',
              'Dez',
            ],
            correta: 1,
            explicacao: 'O Pai Nosso tem 7 petições: 3 voltadas à glória de Deus (santificação do nome, vinda do Reino, cumprimento da vontade) e 4 para nossas necessidades (pão, perdão, livramento da tentação e do mal).',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'A Comunhão',
        versiculo: '1Cor 11,29',
        resumo: 'Disposições, jejum eucarístico e ação de graças.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Sagrada Comunhão é o momento em que o fiel recebe o Corpo e Sangue de Cristo. Para recebê-la dignamente, é necessário estar em estado de graça (sem pecado mortal), guardar o jejum eucarístico e ter uma disposição interior de fé e reverência.',
          },
          {
            tipo: 'versiculo',
            texto: '"Aquele que comer o pão ou beber o cálice do Senhor indignamente será réu do Corpo e do Sangue do Senhor." — 1Cor 11,27',
          },
          {
            tipo: 'destaque',
            texto: 'Quem estiver em pecado mortal deve receber o sacramento da Penitência (Confissão) antes de se aproximar da Comunhão. Receber a Comunhão em pecado mortal seria um sacrilégio. São Paulo adverte em 1Cor 11 sobre comer e beber o julgamento para si.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A Comunhão pode ser recebida na mão ou diretamente na língua — ambas as formas são igualmente válidas. Após receber a Comunhão, o tempo de ação de graças é precioso: é o momento de diálogo íntimo com Cristo realmente presente em nós. É recomendado manter o silêncio interior e a oração pessoal.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Para receber a Comunhão dignamente é necessário...',
            opcoes: [
              'Estar em estado de graça e guardar o jejum eucarístico',
              'Apenas ter sido batizado na infância',
              'Ser membro ativo de uma comunidade paroquial',
              'Ter recebido todos os sacramentos',
            ],
            correta: 0,
            explicacao: 'Para comungar dignamente é preciso estar em estado de graça (sem pecado mortal), crer na presença real de Cristo e guardar o jejum eucarístico de 1 hora.',
          },
          {
            pergunta: 'Quem está em pecado mortal deve...',
            opcoes: [
              'Esperar até a próxima Missa para se decidir',
              'Receber a Comunhão para obter força contra o pecado',
              'Confessar-se antes de receber a Comunhão',
              'Comungar e pedir perdão depois',
            ],
            correta: 2,
            explicacao: 'Quem cometeu pecado mortal deve receber primeiro o sacramento da Penitência (Confissão) para recuperar o estado de graça e então se aproximar da Comunhão.',
          },
          {
            pergunta: 'O jejum eucarístico é de...',
            opcoes: [
              '3 horas antes da Comunhão',
              '1 hora antes da Comunhão',
              '24 horas antes da Comunhão',
              '30 minutos antes da Comunhão',
            ],
            correta: 1,
            explicacao: 'O Código de Direito Canônico (cân. 919) estabelece o jejum eucarístico de pelo menos 1 hora antes da Sagrada Comunhão, exceto para doentes e idosos.',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'Ritos Finais',
        versiculo: 'Mc 16,15',
        resumo: 'Bênção, despedida e o envio missionário dos fiéis.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os Ritos Finais encerram a celebração e enviam os fiéis para viver o que celebraram. Incluem: eventuais avisos paroquiais, a bênção final e a fórmula de despedida. Longe de ser apenas um encerramento formal, expressam o envio missionário da Igreja ao mundo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Ide por todo o mundo e pregai o Evangelho a toda criatura." — Mc 16,15',
          },
          {
            tipo: 'destaque',
            texto: 'A fórmula "Ide, a Missa está encerrada" (ou outras formas aprovadas) não é apenas um "pode ir embora". É um envio: os fiéis saem transformados pela Palavra e pela Eucaristia para ser testemunhas de Cristo no cotidiano, na família, no trabalho e na sociedade.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Missal Romano de 2002 aprovou quatro formas de despedida ao final da Missa, além do clássico "Ide, a Missa está encerrada": "Ide em paz, glorificando com a vossa vida o Senhor"; "Ide anunciar o Evangelho do Senhor"; e "Podeis ir em paz". Todas expressam o envio missionário.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A bênção final da Missa é dada por...',
            opcoes: [
              'O sacerdote ou bispo celebrante',
              'O diácono em nome do sacerdote',
              'Toda a assembleia em conjunto',
              'O leitor mais antigo da comunidade',
            ],
            correta: 0,
            explicacao: 'A bênção final é dada pelo sacerdote ou bispo celebrante, que estende as mãos sobre a assembleia e faz o sinal da cruz.',
          },
          {
            pergunta: 'A fórmula "Ide, a Missa está encerrada" indica que...',
            opcoes: [
              'Os fiéis podem permanecer ou sair, como preferirem',
              'A celebração foi inválida e deve ser repetida',
              'Os fiéis são enviados para viver o Evangelho no cotidiano',
              'Apenas os ministros devem sair em procissão',
            ],
            correta: 2,
            explicacao: 'A despedida é um envio missionário: os fiéis saem transformados pela Eucaristia para ser testemunhas de Cristo no mundo, na família e no trabalho.',
          },
          {
            pergunta: 'Qual gesto acompanha a bênção final?',
            opcoes: [
              'A imposição das mãos sobre a cabeça',
              'O sinal da cruz',
              'A prostração diante do altar',
              'O abraço da paz',
            ],
            correta: 1,
            explicacao: 'O sacerdote faz o sinal da cruz sobre a assembleia ao pronunciar a bênção trinitária: "Em nome do Pai, do Filho e do Espírito Santo."',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 3,
    titulo: 'Orações e Devoções',
    descricao: 'Orações tradicionais e devoções marianas',
    icone: '🙏',
    nivel: 'Iniciante',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: true,
    licoes: [
      {
        id: 1,
        titulo: 'O que é oração?',
        versiculo: '1Ts 5,17',
        resumo: 'Tipos de oração e sua importância na vida cristã.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A oração é a elevação da alma a Deus — uma conversa viva e pessoal com Ele. Não é apenas recitar palavras, mas colocar o coração diante de Deus. São Teófano, o Recluso, dizia: "Oração é manter a mente no coração diante de Deus."',
          },
          {
            tipo: 'versiculo',
            texto: '"Orai sem cessar." — 1Ts 5,17',
          },
          {
            tipo: 'destaque',
            texto: 'Existem quatro formas fundamentais de oração: Louvor (adorar a Deus por quem Ele é), Súplica (pedir a Deus pelas nossas necessidades e as dos outros), Ação de Graças (agradecer pelos dons recebidos) e Contrição (pedir perdão pelos pecados com arrependimento sincero).',
          },
          {
            tipo: 'curiosidade',
            texto: 'São João Maria Vianney, o Cura d\'Ars, encontrou um dia um camponês sentado na frente do sacrário por horas. Perguntou o que ele fazia. O camponês respondeu: "Eu olho para Ele e Ele olha para mim." Isso descreve a contemplação — a forma mais profunda de oração, onde as palavras dão lugar ao silêncio amoroso.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Os quatro tipos principais de oração são...',
            opcoes: [
              'Louvor, súplica, ação de graças e contrição',
              'Missa, Rosário, Novena e Confissão',
              'Leitura, meditação, contemplação e ação',
              'Matinas, Laudes, Vésperas e Completas',
            ],
            correta: 0,
            explicacao: 'As quatro formas fundamentais de oração são: Louvor (adorar a Deus), Súplica (pedir), Ação de Graças (agradecer) e Contrição (pedir perdão).',
          },
          {
            pergunta: 'São Paulo exorta os cristãos a orar...',
            opcoes: [
              'Três vezes ao dia',
              'Apenas nos domingos',
              'Sem cessar',
              'Quando sentir necessidade',
            ],
            correta: 2,
            explicacao: 'Em 1Ts 5,17, São Paulo exorta: "Orai sem cessar." Isso não significa recitar orações continuamente, mas manter uma atitude constante de abertura e confiança em Deus.',
          },
          {
            pergunta: 'A oração de contrição é uma oração de...',
            opcoes: [
              'Louvor pela grandeza de Deus',
              'Arrependimento pelos pecados cometidos',
              'Pedido de graças especiais',
              'Agradecimento pelas bênçãos recebidas',
            ],
            correta: 1,
            explicacao: 'A contrição é a oração de arrependimento pelos pecados cometidos, expressando dor pelo mal praticado e firme propósito de emenda.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'O Pai Nosso',
        versiculo: 'Mt 6,9-13',
        resumo: 'A oração ensinada por Jesus analisada versículo a versículo.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Pai Nosso é a oração por excelência do cristão — a única que Jesus mesmo nos ensinou quando os discípulos pediram: "Senhor, ensina-nos a orar" (Lc 11,1). O Catecismo da Igreja Católica dedica um tratado inteiro a ela, chamando-a de "resumo de todo o Evangelho".',
          },
          {
            tipo: 'versiculo',
            texto: '"Pai nosso, que estás no céu, santificado seja o teu nome; venha o teu reino; seja feita a tua vontade, assim na terra como no céu. O pão nosso de cada dia nos dá hoje; perdoa-nos as nossas dívidas, assim como nós perdoamos aos nossos devedores; e não nos deixes cair em tentação, mas livra-nos do mal." — Mt 6,9-13',
          },
          {
            tipo: 'destaque',
            texto: 'O Pai Nosso tem 7 petições divididas em dois grupos: As 3 primeiras são voltadas para Deus (santificação do nome, vinda do Reino, cumprimento da vontade). As 4 últimas são para nossas necessidades: pão (sustento), perdão (misericórdia), preservação da tentação e livramento do mal.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Pai Nosso começa com "Pai nosso" — não "Meu pai". Essa forma comunitária é intencional: Jesus nos ensina a orar como membros de uma família, em solidariedade com todos os irmãos. Além disso, chamar Deus de "Pai" era algo revolucionário — Jesus usava a palavra aramaica "Abba", que indica intimidade filial.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quem ensinou o Pai Nosso?',
            opcoes: [
              'Jesus Cristo',
              'São Paulo',
              'Moisés',
              'O profeta Isaías',
            ],
            correta: 0,
            explicacao: 'Jesus ensinou o Pai Nosso quando seus discípulos pediram: "Senhor, ensina-nos a orar" (Lc 11,1). É a única oração ensinada diretamente por Cristo.',
          },
          {
            pergunta: 'Quantas petições tem o Pai Nosso?',
            opcoes: [
              'Dez',
              'Três',
              'Sete',
              'Cinco',
            ],
            correta: 2,
            explicacao: 'O Pai Nosso tem 7 petições: 3 voltadas à glória de Deus e 4 às nossas necessidades humanas.',
          },
          {
            pergunta: 'A primeira parte das petições do Pai Nosso é voltada para...',
            opcoes: [
              'Nossas necessidades pessoais',
              'A glória de Deus',
              'O perdão dos pecados',
              'A proteção contra o diabo',
            ],
            correta: 1,
            explicacao: 'As três primeiras petições — santificação do nome, vinda do Reino e cumprimento da vontade — são voltadas para a glória de Deus. As quatro últimas são para nossas necessidades.',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'A Ave Maria',
        versiculo: 'Lc 1,28',
        resumo: 'Origem bíblica e o papel intercessor de Maria.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Ave Maria é a oração mariana mais conhecida. Sua origem é totalmente bíblica: a primeira parte vem da saudação do anjo Gabriel (Lc 1,28) e das palavras de Isabel (Lc 1,42). A segunda parte — "Santa Maria, Mãe de Deus, rogai por nós..." — foi acrescentada pela Igreja para pedir a intercessão de Maria.',
          },
          {
            tipo: 'versiculo',
            texto: '"Alegra-te, cheia de graça, o Senhor está contigo." — Lc 1,28 (saudação do anjo Gabriel a Maria)',
          },
          {
            tipo: 'destaque',
            texto: 'Na segunda parte da Ave Maria, pedimos a intercessão de Maria: "Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora de nossa morte." Ao chamar Maria de "Mãe de Deus" (Theotokos), professamos a fé no Concílio de Éfeso (431 d.C.), que definiu que Maria é verdadeiramente Mãe de Deus.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A fórmula completa da Ave Maria, como a conhecemos hoje, se consolidou por volta do século XVI. A saudação do anjo e de Isabel existiam desde o início do cristianismo como aclamações marianas. A parte da petição foi sendo incorporada gradualmente na devoção popular, sendo oficializada pelo Papa Pio V no século XVI.',
          },
        ],
        perguntas: [
          {
            pergunta: 'As primeiras palavras da Ave Maria foram ditas por...',
            opcoes: [
              'O anjo Gabriel',
              'Jesus Cristo',
              'São João Evangelista',
              'São José',
            ],
            correta: 0,
            explicacao: '"Alegra-te, cheia de graça, o Senhor está contigo" foram as palavras do anjo Gabriel ao saudar Maria na Anunciação (Lc 1,28).',
          },
          {
            pergunta: '"Bendita és tu entre as mulheres" foi dito por...',
            opcoes: [
              'Ana, mãe de Samuel',
              'O anjo Gabriel',
              'Isabel, prima de Maria',
              'A multidão em Caná',
            ],
            correta: 2,
            explicacao: 'Isabel disse a Maria: "Bendita és tu entre as mulheres e bendito é o fruto do teu ventre!" (Lc 1,42) quando Maria foi visitá-la durante a Visitação.',
          },
          {
            pergunta: 'A segunda parte da Ave Maria pede...',
            opcoes: [
              'A proteção de Maria contra os inimigos',
              'A intercessão de Maria por nós pecadores',
              'A cura de doenças físicas',
              'O aumento da fé dos cristãos',
            ],
            correta: 1,
            explicacao: 'A segunda parte ("Santa Maria, Mãe de Deus, rogai por nós pecadores, agora e na hora de nossa morte") é uma súplica pedindo a intercessão de Maria junto a Deus.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'O Rosário',
        versiculo: 'Lc 1,46-47',
        resumo: 'História, mistérios e a contemplação da vida de Cristo com Maria.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Rosário é uma das mais belas e profundas devoções marianas. Mais do que repetir Ave Marias, é uma forma de contemplar os principais mistérios da vida de Jesus com o olhar de Maria. São João Paulo II o chamou de "compêndio do Evangelho".',
          },
          {
            tipo: 'versiculo',
            texto: '"A minha alma engrandece o Senhor e meu espírito exulta em Deus, meu Salvador." — Lc 1,46-47 (Magnificat de Maria)',
          },
          {
            tipo: 'destaque',
            texto: 'O Rosário completo tem 20 mistérios divididos em 4 grupos: Mistérios Gozosos (segunda e sábado) — infância de Jesus; Mistérios Luminosos (quinta) — vida pública; Mistérios Dolorosos (terça e sexta) — Paixão; Mistérios Gloriosos (quarta e domingo) — Ressurreição e glorificação.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A tradição atribui a origem do Rosário a São Domingos de Gusmão (século XIII), que o teria recebido da Virgem Maria durante uma aparição. Historicamente, sua forma atual foi desenvolvida gradualmente. Os Mistérios Luminosos foram o último acréscimo — introduzidos por São João Paulo II na carta apostólica "Rosarium Virginis Mariae" em 2002.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quantos grupos de mistérios tem o Rosário completo?',
            opcoes: [
              'Quatro',
              'Três',
              'Cinco',
              'Dois',
            ],
            correta: 0,
            explicacao: 'O Rosário tem 4 grupos de mistérios: Gozosos, Luminosos (adicionados por João Paulo II), Dolorosos e Gloriosos.',
          },
          {
            pergunta: 'Os mistérios luminosos foram acrescentados por...',
            opcoes: [
              'Papa Pio XII em 1950',
              'São Domingos de Gusmão no século XIII',
              'São João Paulo II em 2002',
              'Concílio Vaticano II em 1965',
            ],
            correta: 2,
            explicacao: 'São João Paulo II acrescentou os Mistérios Luminosos em 2002, na carta "Rosarium Virginis Mariae", contemplando a vida pública de Jesus.',
          },
          {
            pergunta: 'Os mistérios gozosos contemplam...',
            opcoes: [
              'A Paixão e morte de Jesus',
              'A infância e juventude de Jesus',
              'A Ressurreição e Ascensão',
              'Os milagres de Cana e multiplicação dos pães',
            ],
            correta: 1,
            explicacao: 'Os Mistérios Gozosos contemplam: Anunciação, Visitação, Nascimento, Apresentação no Templo e Encontro do Menino Jesus no Templo.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'O Terço',
        versiculo: 'Lc 1,42',
        resumo: 'Diferença entre terço e rosário e como rezar.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Terço é a forma mais comum de rezar o Rosário no Brasil. Enquanto o Rosário completo tem 20 dezenas (4 grupos de 5 mistérios), o Terço tem apenas 5 dezenas — um terço do Rosário completo, daí o nome. É uma forma acessível e muito praticada pela devoção popular.',
          },
          {
            tipo: 'versiculo',
            texto: '"Bendita és tu entre as mulheres e bendito é o fruto do teu ventre!" — Lc 1,42',
          },
          {
            tipo: 'destaque',
            texto: 'Como rezar o Terço: (1) Credo; (2) Pai Nosso; (3) 3 Ave Marias; (4) Glória; depois para cada uma das 5 dezenas: (5) anunciar o mistério; (6) Pai Nosso; (7) 10 Ave Marias; (8) Glória; (9) Ó meu Jesus (oração de Fátima). Ao final: Salve Rainha.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Nossa Senhora de Fátima, nas aparições de 1917, pediu às crianças que rezassem o Terço todos os dias pela paz no mundo e pela conversão dos pecadores. Prometeu graças especiais a quem praticasse essa devoção. Por isso, o Terço é especialmente ligado às aparições de Fátima e ao pedido de Maria.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O terço é composto por quantas dezenas?',
            opcoes: [
              'Cinco',
              'Dez',
              'Vinte',
              'Quinze',
            ],
            correta: 0,
            explicacao: 'O Terço tem 5 dezenas de Ave Marias — correspondendo a um terço do Rosário completo (que tem 20 dezenas).',
          },
          {
            pergunta: 'A diferença entre terço e rosário é que...',
            opcoes: [
              'O rosário é rezado apenas por religiosos',
              'O terço inclui mais orações que o rosário',
              'O rosário tem 20 dezenas (4 grupos), o terço tem 5',
              'O terço não inclui os mistérios',
            ],
            correta: 2,
            explicacao: 'O Rosário completo tem 20 dezenas distribuídas em 4 grupos de mistérios. O Terço é apenas 5 dezenas — um grupo de mistérios — equivalente a um terço do total.',
          },
          {
            pergunta: 'Cada dezena do terço começa com...',
            opcoes: [
              'Uma Ave Maria',
              'Um Pai Nosso',
              'O Credo',
              'O Glória',
            ],
            correta: 1,
            explicacao: 'Cada dezena começa com o anúncio do mistério e um Pai Nosso, seguido de 10 Ave Marias e encerrado com o Glória e a oração de Fátima.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'A Novena',
        versiculo: 'At 1,14',
        resumo: 'Origem, significado e exemplos de novenas populares.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Uma novena é um conjunto de orações rezadas durante 9 dias consecutivos, pedindo uma graça especial ou honrando um santo. A palavra vem do latim "novem" (nove). É uma das formas de oração mais praticadas no catolicismo popular.',
          },
          {
            tipo: 'versiculo',
            texto: '"Todos eles, concordes, perseveravam na oração com as mulheres e Maria, a mãe de Jesus, e com seus irmãos." — At 1,14 (os Apóstolos em oração por 9 dias antes de Pentecostes)',
          },
          {
            tipo: 'destaque',
            texto: 'A origem das novenas remonta aos 9 dias entre a Ascensão e Pentecostes, quando os Apóstolos e Maria permaneceram em oração no Cenáculo aguardando o Espírito Santo (At 1,14). Essa espera de 9 dias se tornou o modelo das novenas cristãs. Exemplos populares: novena de N. Sra. Aparecida (outubro), novena a São José (março).',
          },
          {
            tipo: 'curiosidade',
            texto: 'A palavra "novena" vem do latim "novem" = nove. Além das novenas tradicionais, há também as "trezenas" (13 dias, como a de Santo Antônio) e os "septenários" (7 dias). O número 9, associado às novenas, simboliza os 9 dias de espera do Pentecostes e também os 9 meses de gestação — tempo de preparação e espera.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A origem das novenas remete aos...',
            opcoes: [
              '9 dias de oração entre a Ascensão e Pentecostes',
              '9 dias de criação do mundo segundo a Bíblia',
              '9 sacramentos da Igreja primitiva',
              '9 anos de formação dos Apóstolos',
            ],
            correta: 0,
            explicacao: 'As novenas têm origem nos 9 dias em que os Apóstolos e Maria permaneceram em oração no Cenáculo, entre a Ascensão de Jesus e a descida do Espírito Santo em Pentecostes.',
          },
          {
            pergunta: 'A palavra "novena" vem do latim e significa...',
            opcoes: [
              'Noite',
              'Nova',
              'Nove',
              'Nuvem',
            ],
            correta: 2,
            explicacao: '"Novena" deriva do latim "novem" = nove, referindo-se aos 9 dias consecutivos de oração.',
          },
          {
            pergunta: 'A novena a Nossa Senhora Aparecida é especialmente rezada...',
            opcoes: [
              'Em dezembro, mês do Natal',
              'Em outubro, mês de Nossa Senhora',
              'Em maio, mês de Maria',
              'Em agosto, mês da Assunção',
            ],
            correta: 1,
            explicacao: 'A novena a Nossa Senhora Aparecida é especialmente rezada em outubro, mês de Nossa Senhora do Rosário. A festa da Padroeira do Brasil é celebrada em 12 de outubro.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'A Coroa Franciscana',
        versiculo: 'Lc 1,48',
        resumo: 'As sete alegrias de Maria e como rezar a Coroa.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Coroa Franciscana (ou Rosário das Sete Alegrias de Nossa Senhora) é uma devoção mariana criada pelos Frades Menores Franciscanos no século XV. Ela contempla as sete maiores alegrias de Maria em sua vida terrena e glorificada.',
          },
          {
            tipo: 'versiculo',
            texto: '"Porque o Todo-poderoso fez grandes coisas em meu favor e o seu nome é santo." — Lc 1,49',
          },
          {
            tipo: 'destaque',
            texto: 'As 7 alegrias de Maria contempladas na Coroa Franciscana são: (1) Anunciação, (2) Visitação a Isabel, (3) Nascimento de Jesus, (4) Adoração dos Magos, (5) Encontro do Menino Jesus no Templo, (6) Ressurreição de Jesus, (7) Assunção e Coroação de Maria. Cada alegria é rezada com 1 Pai Nosso e 10 Ave Marias.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A Coroa Franciscana surgiu segundo a tradição em 1422, quando um jovem franciscano em Florença teria tido uma visão de Maria pedindo que os frades rezassem em honra de suas alegrias. A devoção se espalhou rapidamente e foi aprovada pelos papas. A Coroa tem 7 dezenas (70 Ave Marias) e ao final acrescentam-se mais 2 Ave Marias para totalizar 72 — idade tradicional atribuída a Maria em sua morte.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quantas alegrias de Maria são contempladas na Coroa Franciscana?',
            opcoes: [
              'Sete',
              'Cinco',
              'Três',
              'Doze',
            ],
            correta: 0,
            explicacao: 'A Coroa Franciscana contempla as 7 alegrias de Maria: Anunciação, Visitação, Nascimento de Jesus, Adoração dos Magos, Encontro no Templo, Ressurreição e Assunção/Coroação.',
          },
          {
            pergunta: 'A Coroa Franciscana surgiu no século...',
            opcoes: [
              'XVII',
              'XIII',
              'XV',
              'XI',
            ],
            correta: 2,
            explicacao: 'A Coroa Franciscana surgiu no século XV (por volta de 1422) entre os Frades Menores Franciscanos de Florença, Itália.',
          },
          {
            pergunta: 'Cada alegria na Coroa é rezada com...',
            opcoes: [
              'Três Pai Nossos e sete Ave Marias',
              'Um Pai Nosso e dez Ave Marias',
              'Um Credo e cinco Ave Marias',
              'Dez Pai Nossos',
            ],
            correta: 1,
            explicacao: 'Cada uma das 7 alegrias da Coroa Franciscana é rezada com 1 Pai Nosso e 10 Ave Marias, totalizando 70 Ave Marias (mais 2 ao final = 72).',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'Devoções Marianas',
        versiculo: 'Jo 19,27',
        resumo: 'Angelus, Regina Caeli, Salve Rainha e Memorare.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Além do Rosário e Terço, a Igreja possui um rico tesouro de orações marianas. Entre as mais importantes estão o Angelus (rezado três vezes ao dia), o Regina Caeli (tempo pascal), a Salve Rainha (após o Rosário) e o Memorare (oração de confiança a Maria).',
          },
          {
            tipo: 'versiculo',
            texto: '"Depois disse ao discípulo: Eis aí a tua mãe. E desde aquela hora o discípulo a tomou para sua casa." — Jo 19,27',
          },
          {
            tipo: 'destaque',
            texto: 'O Angelus é rezado três vezes ao dia (manhã, meio-dia e tarde), ao som do sino, em memória do mistério da Encarnação. Durante o tempo pascal (da Páscoa a Pentecostes), é substituído pelo Regina Caeli ("Alegra-te, Rainha do Céu"), que celebra a ressurreição de Cristo. A Salve Rainha encerra o Rosário.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Memorare é uma das orações marianas mais tocantes: "Lembrai-vos, ó puríssima Virgem Maria, que jamais se ouviu dizer que alguém que recorreu à vossa proteção... foi abandonado." Atribuído a São Bernardo de Claraval (século XII), o Memorare expressa uma confiança absoluta na intercessão de Maria. O Papa Francisco a reza com frequência e recomendou o hábito de rezá-la diariamente.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Angelus é rezado...',
            opcoes: [
              'Três vezes ao dia: manhã, meio-dia e tarde',
              'Uma vez ao dia, ao amanhecer',
              'Apenas aos domingos, antes da Missa',
              'Toda vez que se passa por uma igreja',
            ],
            correta: 0,
            explicacao: 'O Angelus é rezado três vezes ao dia, ao toque do sino, em memória da Anunciação. A prática remonta ao século XIII.',
          },
          {
            pergunta: 'O Regina Caeli substitui o Angelus...',
            opcoes: [
              'Nos dias de jejum',
              'Durante o Advento',
              'Durante o tempo pascal (da Páscoa a Pentecostes)',
              'No mês de maio',
            ],
            correta: 2,
            explicacao: 'O Regina Caeli ("Alegra-te, Rainha do Céu") substitui o Angelus durante o tempo pascal — da Páscoa até Pentecostes — celebrando a alegria da Ressurreição.',
          },
          {
            pergunta: 'O Memorare é uma oração de...',
            opcoes: [
              'Louvor à Santíssima Trindade',
              'Confiança e intercessão a Maria',
              'Penitência e reparação pelos pecados',
              'Ação de graças pela criação',
            ],
            correta: 1,
            explicacao: 'O Memorare é uma oração de profunda confiança na intercessão de Maria, afirmando que quem recorre a ela jamais foi abandonado.',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 4,
    titulo: 'Liturgia Avançada',
    descricao: 'Aprofunde-se nos ritos e tempos litúrgicos',
    icone: '📿',
    nivel: 'Intermediário',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: false,
    preco: 9.90,
    licoes: [
      {
        id: 1,
        titulo: 'O Calendário Litúrgico',
        versiculo: 'Sl 118,24',
        resumo: 'Compreenda o ciclo anual da Igreja e como ela celebra os mistérios de Cristo ao longo do ano.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O ano litúrgico é o ciclo anual através do qual a Igreja celebra os mistérios de Cristo — da Encarnação à Ressurreição, Ascensão e Pentecostes. Não é uma simples recordação histórica, mas uma atualização sacramental dos eventos da salvação.',
          },
          {
            tipo: 'versiculo',
            texto: '"Este é o dia que o Senhor fez; alegremo-nos e regozijemo-nos nele." — Sl 118,24',
          },
          {
            tipo: 'destaque',
            texto: 'O ano litúrgico começa no 1º Domingo do Advento (fins de novembro/início de dezembro) e termina na solenidade de Cristo Rei. É dividido em tempos: Advento, Natal, Tempo Comum, Quaresma, Tríduo Pascal, Páscoa e Pentecostes.',
          },
          {
            tipo: 'curiosidade',
            texto: 'As cores litúrgicas indicam o tempo ou a festa celebrada: roxo (Advento e Quaresma), branco (Natal e Páscoa), vermelho (Pentecostes, mártires), verde (Tempo Comum) e rosa (3º domingo do Advento e 4º da Quaresma).',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quando começa o ano litúrgico?',
            opcoes: ['No 1º Domingo do Advento', 'No dia 1º de janeiro', 'Na Páscoa', 'No dia de Natal'],
            correta: 0,
            explicacao: 'O ano litúrgico começa no 1º Domingo do Advento, período de preparação para o Natal, geralmente em fins de novembro ou início de dezembro.',
          },
          {
            pergunta: 'Qual cor litúrgica é usada no Tempo Comum?',
            opcoes: ['Vermelho', 'Roxo', 'Verde', 'Branco'],
            correta: 2,
            explicacao: 'O verde representa esperança e vida no crescimento ordinário da fé — é usado nos domingos do Tempo Comum, quando não há festa especial.',
          },
          {
            pergunta: 'O ano litúrgico termina na solenidade de...',
            opcoes: ['Pentecostes', 'Cristo Rei', 'Todos os Santos', 'Nossa Senhora'],
            correta: 1,
            explicacao: 'O último domingo do ano litúrgico é a solenidade de Cristo Rei do Universo, celebrando a realeza universal de Jesus antes do início do Advento.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'O Advento',
        versiculo: 'Is 40,3',
        resumo: 'Descubra o significado do tempo de preparação para o Natal e a segunda vinda de Cristo.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Advento é o tempo de preparação para o Natal e também para a segunda vinda de Cristo. A palavra "advento" vem do latim adventus, que significa "chegada". É um tempo de expectativa, conversão e esperança que dura quatro semanas.',
          },
          {
            tipo: 'versiculo',
            texto: '"Uma voz clama no deserto: Preparai o caminho do Senhor." — Is 40,3',
          },
          {
            tipo: 'destaque',
            texto: 'O Advento tem um duplo caráter: memória da primeira vinda de Cristo (Encarnação) e expectativa de sua segunda vinda gloriosa. Por isso, lemos tanto profecias do Antigo Testamento sobre o Messias quanto textos apocalípticos sobre o fim dos tempos.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A tradição da Coroa do Advento com 4 velas representa as 4 semanas — 3 roxas e 1 rosa (acesa no 3º domingo, Gaudete, de alegria). A vela central branca é acesa no Natal. Cada vela simboliza um tema: esperança, paz, alegria e amor.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Advento significa em latim...',
            opcoes: ['Chegada', 'Espera', 'Preparação', 'Silêncio'],
            correta: 0,
            explicacao: 'A palavra "advento" vem do latim adventus = chegada. Celebramos a chegada de Cristo — tanto a histórica no Natal quanto a gloriosa no fim dos tempos.',
          },
          {
            pergunta: 'Quantas semanas dura o Advento?',
            opcoes: ['Seis', 'Três', 'Quatro', 'Duas'],
            correta: 2,
            explicacao: 'O Advento dura quatro semanas — cada uma representada por uma vela na Coroa do Advento, contando regressivamente até o Natal.',
          },
          {
            pergunta: "O 3º domingo do Advento é chamado de 'Gaudete' porque...",
            opcoes: ['É o início do Advento', 'É um domingo de alegria no meio da preparação', 'É quando se acende a vela branca', 'É o domingo mais importante do Advento'],
            correta: 1,
            explicacao: "'Gaudete' significa 'alegrai-vos' em latim. É um momento de alegria antecipada no meio do tempo penitencial do Advento, expresso pela vela rosa.",
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'O Natal e a Epifania',
        versiculo: 'Lc 2,11',
        resumo: 'Compreenda o mistério da Encarnação e o significado da Epifania para toda a humanidade.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Natal celebra o nascimento de Jesus Cristo, o Filho de Deus feito homem. Não é apenas uma data histórica, mas a festa da Encarnação — Deus entrando na história humana para nos salvar. O tempo do Natal vai do dia 25 de dezembro até o Batismo do Senhor.',
          },
          {
            tipo: 'versiculo',
            texto: '"Hoje, na cidade de Davi, nasceu para vós um Salvador, que é Cristo Senhor." — Lc 2,11',
          },
          {
            tipo: 'destaque',
            texto: 'A Epifania (6 de janeiro) celebra a manifestação de Jesus aos Magos, representantes de todos os povos. Simboliza que a salvação é para toda a humanidade, não apenas para Israel. Em algumas culturas é chamada de "Dia de Reis" e tem grande importância litúrgica.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A tradição do presépio foi popularizada por São Francisco de Assis em 1223, em Greccio (Itália). Ele queria que as pessoas visualizassem concretamente o mistério da Encarnação — Deus nascendo pobre, em uma manjedoura, no frio da noite.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O tempo do Natal termina quando?',
            opcoes: ['No Batismo do Senhor', 'No dia 6 de janeiro', 'No dia 2 de fevereiro', 'No Carnaval'],
            correta: 0,
            explicacao: 'O tempo litúrgico do Natal encerra-se no domingo do Batismo do Senhor, que celebra o início do ministério público de Jesus.',
          },
          {
            pergunta: 'A Epifania celebra...',
            opcoes: ['A fuga para o Egito', 'O nascimento de Jesus', 'A manifestação de Jesus aos Magos do Oriente', 'A apresentação no Templo'],
            correta: 2,
            explicacao: 'Epifania vem do grego epiphaneia = manifestação. Celebra a visita dos Magos — símbolos de todos os povos — reconhecendo Jesus como Rei, Sacerdote e Salvador.',
          },
          {
            pergunta: 'Quem popularizou a tradição do presépio?',
            opcoes: ['São Domingos de Gusmão', 'São Francisco de Assis', 'Santo Agostinho', 'São João Bosco'],
            correta: 1,
            explicacao: 'São Francisco de Assis criou o primeiro preségio vivo em Greccio em 1223, para tornar concreto o mistério da Encarnação ao povo.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'A Quaresma',
        versiculo: 'Jl 2,12',
        resumo: 'Conheça o tempo de conversão e seus três pilares: oração, jejum e esmola.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Quaresma é o tempo de 40 dias de preparação para a Páscoa. Os 40 dias evocam os 40 anos de Israel no deserto e os 40 dias de jejum de Jesus. É tempo de oração intensificada, jejum e esmola — os três pilares da conversão cristã.',
          },
          {
            tipo: 'versiculo',
            texto: '"Convertei-vos a mim de todo o coração, com jejum, choro e pranto." — Jl 2,12',
          },
          {
            tipo: 'destaque',
            texto: 'Os três pilares da Quaresma são: Oração (aprofundar a relação com Deus), Jejum (mortificação do corpo e liberdade interior) e Esmola (solidariedade com os pobres). Esses três elementos formam um conjunto inseparável de conversão interior.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A Quarta-feira de Cinzas inicia a Quaresma. As cinzas são feitas queimando os ramos do Domingo de Ramos do ano anterior. O gesto "Lembra-te de que és pó e ao pó voltarás" (Gn 3,19) recorda a nossa condição humana e a necessidade de conversão.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quantos dias dura a Quaresma?',
            opcoes: ['40 dias', '33 dias', '50 dias', '30 dias'],
            correta: 0,
            explicacao: 'A Quaresma dura 40 dias em memória dos 40 anos de Israel no deserto e dos 40 dias de jejum de Jesus no deserto antes de seu ministério público.',
          },
          {
            pergunta: 'Os três pilares da Quaresma são...',
            opcoes: ['Penitência, Mortificação e Silêncio', 'Missa, Confissão e Comunhão', 'Oração, Jejum e Esmola', 'Leitura, Meditação e Contemplação'],
            correta: 2,
            explicacao: 'Oração, Jejum e Esmola são os três pilares da conversão quaresmal ensinados por Jesus no Sermão da Montanha (Mt 6,1-18).',
          },
          {
            pergunta: 'A Quaresma começa na...',
            opcoes: ['Domingo de Ramos', 'Quarta-feira de Cinzas', 'Terça de Carnaval', 'Primeira sexta-feira do ano'],
            correta: 1,
            explicacao: 'A Quarta-feira de Cinzas inicia a Quaresma com a imposição das cinzas, símbolo de penitência e mortalidade, lembrando que somos pó e ao pó voltaremos.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'A Semana Santa',
        versiculo: 'Fl 2,8',
        resumo: 'Aprofunde-se no Tríduo Pascal e nos ritos da semana mais importante do ano litúrgico.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Semana Santa é o ápice do ano litúrgico, celebrando os últimos dias de Jesus antes da morte e Ressurreição. Começa no Domingo de Ramos e culmina no Tríduo Pascal: Quinta-feira Santa, Sexta-feira da Paixão e Vigília Pascal.',
          },
          {
            tipo: 'versiculo',
            texto: '"Humilhou-se a si mesmo, tornando-se obediente até a morte, e morte de cruz." — Fl 2,8',
          },
          {
            tipo: 'destaque',
            texto: 'O Tríduo Pascal (Quinta, Sexta e Sábado Santos + Vigília) é a celebração mais importante de todo o ano litúrgico. A Quinta-feira Santa celebra a instituição da Eucaristia e do sacerdócio. A Sexta-feira lembra a Paixão e morte de Jesus. A Vigília Pascal proclama a Ressurreição.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Na Quinta-feira Santa, o celebrante lava os pés de 12 pessoas — memória do gesto de Jesus no Cenáculo (Jo 13,1-15). Este gesto de serviço e humildade é chamado de mandatum (mandamento), origem do nome Quinta-feira do Mandato em algumas tradições.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Tríduo Pascal abrange...',
            opcoes: ['Quinta-feira Santa, Sexta-feira da Paixão e Vigília Pascal', 'Domingo de Ramos até Páscoa', 'Sexta-feira e Sábado Santos apenas', 'Toda a Semana Santa'],
            correta: 0,
            explicacao: 'O Tríduo Pascal (do latim triduum = três dias) abrange a Quinta-feira Santa à noite, a Sexta-feira da Paixão e a Vigília Pascal do Sábado Santo até o amanhecer de Páscoa.',
          },
          {
            pergunta: 'O que celebra a Quinta-feira Santa?',
            opcoes: ['A entrada de Jesus em Jerusalém', 'A Ressurreição de Jesus', 'A instituição da Eucaristia e do sacerdócio', 'A morte de Jesus na Cruz'],
            correta: 2,
            explicacao: "Na Quinta-feira Santa celebra-se a Última Ceia, onde Jesus instituiu a Eucaristia ('Fazei isto em memória de mim') e o sacerdócio ministerial, além do mandamento do amor.",
          },
          {
            pergunta: 'O gesto de lavar os pés na Quinta-feira Santa é chamado de...',
            opcoes: ['Baptismus', 'Mandatum', 'Lavatio', 'Servitium'],
            correta: 1,
            explicacao: "O rito da lavagem dos pés é chamado de Mandatum (mandamento) por causa das palavras de Jesus: 'Um mandamento novo vos dou: que vos ameis uns aos outros' (Jo 13,34), proferidas após o gesto.",
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'A Páscoa e Pentecostes',
        versiculo: '1Cor 15,20',
        resumo: 'Celebre o centro da fé cristã: a Ressurreição de Cristo e o nascimento da Igreja.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Páscoa é a festa das festas, o centro e ápice de todo o ano cristão. Celebra a Ressurreição de Jesus Cristo dentre os mortos — o fundamento de toda a nossa fé. O tempo pascal dura 50 dias, de Páscoa a Pentecostes, culminando na vinda do Espírito Santo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Mas agora Cristo ressuscitou dentre os mortos, as primícias dos que morreram." — 1Cor 15,20',
          },
          {
            tipo: 'destaque',
            texto: 'Os 50 dias do tempo pascal são uma grande semana de semanas (7×7+1), período de alegria intensa. Durante este tempo não se fazem penitências, canta-se Aleluia abundantemente e o Regina Caeli substitui o Angelus. É o período litúrgico mais longo e festivo do ano.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A data da Páscoa é calculada como o primeiro domingo após a primeira lua cheia após o equinócio da primavera (21 de março no hemisfério norte). Por isso varia entre 22 de março e 25 de abril. Este cálculo é chamado de comput pascal e foi estabelecido no Concílio de Niceia (325 d.C.).',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quantos dias dura o tempo pascal?',
            opcoes: ['50 dias', '40 dias', '33 dias', '7 dias'],
            correta: 0,
            explicacao: 'O tempo pascal dura 50 dias — de Páscoa até Pentecostes. Este número evoca a Grande Semana (7×7 dias + 1) e o dom da Lei a Moisés 50 dias após o Êxodo.',
          },
          {
            pergunta: 'O que celebra Pentecostes?',
            opcoes: ['A Ressurreição de Jesus', 'A Ascensão de Jesus ao Céu', 'A vinda do Espírito Santo sobre os Apóstolos', 'O nascimento da Igreja no Natal'],
            correta: 2,
            explicacao: "Pentecostes (do grego 'quinquagésimo') celebra a vinda do Espírito Santo 50 dias após a Páscoa, marcando o nascimento da Igreja missionária.",
          },
          {
            pergunta: 'A data da Páscoa é determinada pela...',
            opcoes: ['Data fixa no calendário', 'Primeira lua cheia após o equinócio de março', 'Decisão anual do Papa', 'Calendário lunar judaico'],
            correta: 1,
            explicacao: 'A Páscoa cristã é calculada pelo comput pascal: primeiro domingo após a primeira lua cheia após 21 de março. Por isso é uma data móvel, variando entre 22 de março e 25 de abril.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'O Tempo Comum',
        versiculo: 'Rm 6,4',
        resumo: 'Descubra o valor do tempo ordinário e como crescer na fé no cotidiano cristão.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Tempo Comum não é um período "vazio" entre as grandes festas — é o tempo da vida ordinária cristã, do crescimento na fé e da construção do Reino de Deus no cotidiano. Ocupa a maior parte do ano litúrgico: antes e depois do tempo pascal.',
          },
          {
            tipo: 'versiculo',
            texto: '"Fomos sepultados com Cristo pelo batismo... para que vivamos uma vida nova." — Rm 6,4',
          },
          {
            tipo: 'destaque',
            texto: 'O Tempo Comum é dividido em dois períodos: o primeiro (entre o Batismo do Senhor e o início da Quaresma) e o segundo (entre Pentecostes e o Advento). Ao longo das 34 semanas do Tempo Comum, a Igreja aprofunda o ensino de Jesus e sua missão na história.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Os domingos do Tempo Comum são numerados ordinalmente (2º, 3º... 34º Domingo do Tempo Comum). A cor litúrgica verde simboliza a esperança e o crescimento. É no Tempo Comum que lemos os Evangelhos de Mateus, Marcos ou Lucas de forma semicontínua (ano A: Mateus, B: Marcos, C: Lucas).',
          },
        ],
        perguntas: [
          {
            pergunta: 'O Tempo Comum ocupa qual parte do ano litúrgico?',
            opcoes: ['A maior parte, com 34 semanas ao todo', 'Apenas 4 semanas no verão', 'O período entre Natal e Páscoa', 'As 8 semanas centrais do ano'],
            correta: 0,
            explicacao: 'O Tempo Comum é o período mais longo do ano litúrgico, com 34 semanas distribuídas em dois blocos — antes da Quaresma e após Pentecostes.',
          },
          {
            pergunta: 'A cor litúrgica do Tempo Comum é...',
            opcoes: ['Roxo', 'Branco', 'Verde', 'Vermelho'],
            correta: 2,
            explicacao: 'O verde é usado no Tempo Comum, simbolizando esperança e crescimento ordinário na vida cristã, como a natureza que cresce silenciosamente.',
          },
          {
            pergunta: 'No Tempo Comum lemos os Evangelhos de forma...',
            opcoes: ['Exclusivamente de João', 'Semicontínua (ano A: Mateus, B: Marcos, C: Lucas)', 'Aleatória, sem ordem', 'Apenas do Antigo Testamento'],
            correta: 1,
            explicacao: 'A liturgia usa um ciclo trianual (anos A, B, C) para ler os Sinóticos. No ano A lemos Mateus, B Marcos, C Lucas. O Evangelho de João é lido principalmente na Páscoa e Natal.',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'Os Sacramentais',
        versiculo: 'Nm 6,24-26',
        resumo: 'Entenda o que são os sacramentais e como eles santificam o cotidiano cristão.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os sacramentais são sinais sagrados instituídos pela Igreja que preparam o homem para receber a graça dos sacramentos e santificam as diversas circunstâncias da vida. Diferem dos sacramentos porque foram instituídos pela Igreja, não diretamente por Cristo.',
          },
          {
            tipo: 'versiculo',
            texto: '"O Senhor te abençoe e te guarde; o Senhor faça resplandecer sua face sobre ti." — Nm 6,24-26',
          },
          {
            tipo: 'destaque',
            texto: 'Os principais sacramentais são: bênçãos (de pessoas, objetos, lugares), exorcismos, água benta, cinzas, ramos bêntos, terço, escapulário, crucifixo, imagens sagradas e óleos bêntos. Eles não conferem graça ex opere operato (pelo só ato), mas pela oração da Igreja e disposição do fiel.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A água benta lembra o Batismo — por isso os fiéis se benzem ao entrar na igreja, renovando mentalmente sua consagração batismal. A tradição de colocar água benta na entrada das casas remonta aos primeiros cristãos, que santificavam seus lares com este sinal.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Os sacramentais diferem dos sacramentos porque...',
            opcoes: ['Foram instituídos pela Igreja, não diretamente por Cristo', 'Não conferem nenhuma graça', 'São apenas superstições medievais', 'São exclusivos do clero'],
            correta: 0,
            explicacao: 'Os sacramentos foram instituídos por Jesus Cristo e conferem graça ex opere operato. Os sacramentais foram instituídos pela Igreja e santificam por meio da oração da Igreja e da disposição do fiel.',
          },
          {
            pergunta: 'O que é o escapulário?',
            opcoes: ['Um tipo de rosário com 150 contas', 'Uma vestimenta exclusiva de frades', 'Um sacramental mariano que expressa devoção e proteção de Maria', 'Uma bênção dada apenas na Quaresma'],
            correta: 2,
            explicacao: 'O escapulário (especialmente o do Carmo) é um sacramental mariano — dois pequenos pedaços de pano unidos por cordões, usados sobre os ombros como sinal de pertença a Maria e acolhimento de sua proteção.',
          },
          {
            pergunta: 'A água benta lembra os fiéis de...',
            opcoes: ['O dilúvio de Noé', 'Seu Batismo e consagração a Deus', 'A travessia do Mar Vermelho apenas', 'A cura dos leprosos por Jesus'],
            correta: 1,
            explicacao: 'Ao benzer-se com água benta, o fiel renova mentalmente a graça do seu Batismo — a morte para o pecado e o renascimento para a vida em Cristo.',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 5,
    titulo: 'Teologia Moral',
    descricao: 'Os princípios da moral cristã e sua aplicação à vida',
    icone: '⚖️',
    nivel: 'Intermediário',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: false,
    preco: 9.90,
    licoes: [
      {
        id: 1,
        titulo: 'O que é moral cristã?',
        versiculo: 'Rm 12,2',
        resumo: 'Entenda os fundamentos da moral cristã como caminho de amor e dignidade humana.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A moral cristã não é um conjunto de proibições, mas um caminho de vida que conduz à felicidade plena. Ela parte da dignidade da pessoa humana — criada à imagem de Deus — e propõe como responder a esta dignidade nas escolhas cotidianas. É uma moral de amor, não de medo.',
          },
          {
            tipo: 'versiculo',
            texto: '"Não vos conformeis com este mundo, mas transformai-vos pela renovação da mente." — Rm 12,2',
          },
          {
            tipo: 'destaque',
            texto: 'A moral cristã tem três fontes: o objeto do ato (o que se faz), a intenção (por que se faz) e as circunstâncias (como, quando, onde se faz). Um ato moralmente bom requer que os três elementos sejam bons — uma boa intenção não justifica um ato intrinsecamente mau.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A diferença entre pecado mortal e venial: o pecado mortal rompe a comunhão com Deus e requer matéria grave, pleno conhecimento e deliberado consentimento. O pecado venial enfraquece a caridade sem romper a amizade com Deus. A distinção remonta ao próprio João (1Jo 5,16-17).',
          },
        ],
        perguntas: [
          {
            pergunta: 'Os três elementos que determinam a moralidade de um ato são...',
            opcoes: ['Objeto, intenção e circunstâncias', 'Consequências, intenção e aprovação social', 'Lei, vontade e resultado', 'Fé, esperança e caridade'],
            correta: 0,
            explicacao: 'Segundo o Catecismo (n. 1750), a moralidade de um ato humano depende do objeto (o que se faz), da intenção (por que se faz) e das circunstâncias (o contexto). Os três devem ser bons para que o ato seja moralmente bom.',
          },
          {
            pergunta: 'Um ato moralmente bom requer que...',
            opcoes: ['O resultado final seja positivo', 'Apenas a intenção seja boa', 'O objeto, a intenção e as circunstâncias sejam bons', 'A autoridade da Igreja aprove'],
            correta: 2,
            explicacao: 'Uma boa intenção não basta — não se pode fazer o mal para que venha o bem (Rm 3,8). O objeto do ato deve ser intrinsecamente bom ou neutro; uma boa intenção não purifica um objeto mau.',
          },
          {
            pergunta: 'Para ser pecado mortal, o ato deve ter...',
            opcoes: ['Apenas matéria grave', 'Matéria grave, pleno conhecimento e deliberado consentimento', 'Repetição habitual e má intenção', 'Consciência culpada e vergonha'],
            correta: 1,
            explicacao: 'O Catecismo (n. 1857) define três condições para o pecado mortal: matéria grave, plena advertência e deliberado consentimento. A ausência de qualquer um desses elementos reduz a gravidade do pecado.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'A Consciência Moral',
        versiculo: 'Rm 2,15',
        resumo: 'Aprenda o que é a consciência moral e como formá-la corretamente.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A consciência moral é o julgamento da razão pelo qual a pessoa reconhece a qualidade moral de um ato concreto. É como uma voz interior que nos diz o que é bom e o que é mau. Mas a consciência não é infalível — ela precisa ser formada e educada.',
          },
          {
            tipo: 'versiculo',
            texto: '"Eles mostram que o que a Lei prescreve está gravado em seus corações, dando testemunho sua própria consciência." — Rm 2,15',
          },
          {
            tipo: 'destaque',
            texto: 'A consciência pode ser: certa (julga com segurança), duvidosa (hesita entre o bem e o mal), escrupulosa (vê pecado onde não há) ou laxa (minimiza gravidade dos pecados). A Igreja exorta a formar uma consciência reta — nem rígida demais nem permissiva demais.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A formação da consciência se dá pela Palavra de Deus, pelo Magistério da Igreja, pela oração, pelo exemplo dos santos e pelo exame de consciência diário — prática recomendada por Santo Inácio de Loyola como parte dos Exercícios Espirituais.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A consciência moral é...',
            opcoes: ['O julgamento da razão sobre a qualidade moral de um ato', 'Um sentimento subjetivo sem base objetiva', 'A voz de Deus audível diretamente', 'A opinião da maioria da sociedade'],
            correta: 0,
            explicacao: 'A consciência é um julgamento racional, não um mero sentimento. Ela aplica os princípios morais objetivos às situações concretas, mas pode errar e por isso precisa ser formada.',
          },
          {
            pergunta: 'Uma consciência laxa é aquela que...',
            opcoes: ['Julga com perfeita segurança', 'Vê pecado onde não há', 'Minimiza a gravidade dos pecados', 'Nunca toma decisões'],
            correta: 2,
            explicacao: 'A consciência laxa (ou relaxada) tende a subestimar a gravidade dos pecados e a encontrar justificativas para atos moralmente errados. É o extremo oposto da consciência escrupulosa.',
          },
          {
            pergunta: 'A formação da consciência inclui...',
            opcoes: ['Apenas seguir a própria intuição', 'Palavra de Deus, Magistério, oração e exame de consciência', 'Estudar filosofia secular', 'Consultar apenas a opinião pessoal'],
            correta: 1,
            explicacao: 'A consciência precisa ser formada pelas fontes objetivas da moral cristã: a Sagrada Escritura, o Magistério da Igreja, a oração, os sacramentos e a prática do exame de consciência.',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'Os Pecados Capitais',
        versiculo: 'Mc 7,21',
        resumo: 'Conheça os sete pecados capitais e como eles são raízes de outros pecados.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os sete pecados capitais são vícios fundamentais que geram outros pecados. São chamados "capitais" do latim caput (cabeça) por serem as raízes ou fontes principais de onde brotam muitos outros pecados. Não são os piores pecados, mas os mais fundamentais.',
          },
          {
            tipo: 'versiculo',
            texto: '"É do interior, do coração do homem, que saem os maus pensamentos." — Mc 7,21',
          },
          {
            tipo: 'destaque',
            texto: 'Os 7 pecados capitais são: Soberba (orgulho excessivo), Avareza (apego desordenado aos bens), Luxúria (desordem no desejo sexual), Ira (raiva descontrolada), Gula (excesso no comer/beber), Inveja (tristeza pelo bem do próximo) e Preguiça (negligência espiritual).',
          },
          {
            tipo: 'curiosidade',
            texto: 'São Gregório Magno (século VI) organizou a lista dos 7 pecados capitais que usamos hoje. A tradição medieval associava cada um a um animal simbólico: soberba=pavão, avareza=sapo, luxúria=serpente, ira=urso, gula=porco, inveja=cão, preguiça=burro.',
          },
        ],
        perguntas: [
          {
            pergunta: "'Capital' em 'pecados capitais' significa...",
            opcoes: ['Raiz ou fonte de outros pecados (caput = cabeça)', 'Os pecados mais graves de todos', 'Crimes puníveis pela lei civil', 'Pecados que levam à morte imediata'],
            correta: 0,
            explicacao: "'Capital' vem do latim caput (cabeça). Os pecados capitais são as raízes ou fontes principais de onde brotam muitos outros pecados — não necessariamente os mais graves.",
          },
          {
            pergunta: 'Quantos são os pecados capitais?',
            opcoes: ['Três', 'Dez', 'Sete', 'Doze'],
            correta: 2,
            explicacao: 'São sete os pecados capitais, sistematizados por São Gregório Magno: soberba, avareza, luxúria, ira, gula, inveja e preguiça (acédia).',
          },
          {
            pergunta: 'A inveja é definida como...',
            opcoes: ['Desejo de ter mais do que se tem', 'Tristeza pelo bem do próximo e desejo de privá-lo dele', 'Raiva diante da injustiça', 'Orgulho pelo próprio sucesso'],
            correta: 1,
            explicacao: 'A inveja é a tristeza diante do bem alheio acompanhada do desejo de privá-lo desse bem. É especialmente grave porque se opõe diretamente à caridade fraterna.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'As Virtudes Cardeais',
        versiculo: 'Sb 8,7',
        resumo: 'Aprenda as quatro virtudes morais fundamentais que sustentam a vida cristã.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'As virtudes cardeais são as quatro virtudes morais fundamentais: Prudência, Justiça, Fortaleza e Temperança. São chamadas "cardeais" do latim cardo (gonzo, dobradiça) por sustentarem toda a vida moral, como uma porta sustentada por suas dobradiças.',
          },
          {
            tipo: 'versiculo',
            texto: '"Ela ensina a temperança e a prudência, a justiça e a fortaleza." — Sb 8,7',
          },
          {
            tipo: 'destaque',
            texto: 'A Prudência é a razão prática que discerne o bem verdadeiro; a Justiça dá a cada um o que lhe é devido; a Fortaleza firma na dificuldade e persevera no bem; a Temperança modera a atração pelos prazeres e mantém o equilíbrio. Aristóteles já as ensinou, mas a fé as eleva.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Platão foi o primeiro a sistematizar as quatro virtudes cardeais na República. São Tomás de Aquino as integrou à teologia cristã no século XIII, mostrando como as virtudes teologais (fé, esperança e caridade) elevam e aperfeiçoam as virtudes cardeais naturais.',
          },
        ],
        perguntas: [
          {
            pergunta: "'Cardeal' em 'virtudes cardeais' vem do latim cardo que significa...",
            opcoes: ['Dobradiça — as virtudes que sustentam toda a vida moral', 'Cardeal da Igreja — virtudes episcopais', 'Coração — virtudes do coração', 'Principal — as mais importantes'],
            correta: 0,
            explicacao: 'Cardo em latim significa dobradiça ou gonzo — a peça que sustenta e faz girar uma porta. As virtudes cardeais sustentam toda a vida moral, como dobradiças sustentam uma porta.',
          },
          {
            pergunta: 'A virtude da Prudência é...',
            opcoes: ['A perseverança diante das dificuldades', 'A moderação nos prazeres', 'A razão prática que discerne o bem verdadeiro em cada situação', 'Dar a cada um o que lhe é devido'],
            correta: 2,
            explicacao: "A Prudência (phronesis em grego) é a virtude que aplica os princípios morais às situações concretas, discernindo o que deve ser feito. É chamada de 'a cocheira das virtudes' por guiar todas as outras.",
          },
          {
            pergunta: 'Qual virtude cardeal modera a atração pelos prazeres?',
            opcoes: ['Fortaleza', 'Temperança', 'Prudência', 'Justiça'],
            correta: 1,
            explicacao: 'A Temperança modera a atração pelos prazeres e assegura o domínio da vontade sobre os instintos. Ela garante o equilíbrio e não permite que o prazer legítimo se torne desordenado.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'A Lei Natural',
        versiculo: 'Rm 2,14',
        resumo: 'Compreenda a lei inscrita por Deus no coração humano e seus preceitos universais.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Lei Natural é a participação da lei eterna de Deus na criatura racional. É inscrita por Deus no coração de todo ser humano e pode ser conhecida pela razão, mesmo sem a revelação. Ela é universal (vale para todos), permanente (não muda) e imutável.',
          },
          {
            tipo: 'versiculo',
            texto: '"Os pagãos, que não têm a Lei, fazem por natureza o que a Lei prescreve." — Rm 2,14',
          },
          {
            tipo: 'destaque',
            texto: 'A Lei Natural fundamenta os direitos humanos universais — como o direito à vida, à liberdade, à dignidade — que valem para todos independente de cultura ou religião. Ela também é a base do diálogo entre a Igreja e o mundo, pois apela a uma razão comum.',
          },
          {
            tipo: 'curiosidade',
            texto: 'São Tomás de Aquino ensinou que a Lei Natural tem um preceito primário (fazer o bem e evitar o mal) e preceitos secundários derivados (não matar, não roubar, honrar os pais, etc.). Estes preceitos podem ser obscurecidos pelo pecado, mas nunca completamente apagados da consciência humana.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A Lei Natural é...',
            opcoes: ['A participação da lei eterna de Deus inscrita no coração humano', 'As leis criadas pelo governo', 'Os mandamentos do Antigo Testamento apenas', 'As regras criadas pela Igreja no século XX'],
            correta: 0,
            explicacao: 'A Lei Natural é a lei moral inscrita por Deus no coração de toda pessoa humana, cognoscível pela razão. Ela antecede e fundamenta todas as leis positivas (civis ou eclesiásticas).',
          },
          {
            pergunta: 'O preceito primário da Lei Natural segundo São Tomás é...',
            opcoes: ['Respeitar a autoridade civil', 'Amar a Deus sobre todas as coisas', 'Fazer o bem e evitar o mal', 'Não matar e não roubar'],
            correta: 2,
            explicacao: "São Tomás ensina que o primeiro e mais fundamental preceito da Lei Natural é: 'O bem deve ser feito e procurado; o mal deve ser evitado.' Todos os outros preceitos morais naturais derivam deste.",
          },
          {
            pergunta: 'A Lei Natural é universal porque...',
            opcoes: ['Foi aprovada pela ONU', 'Vale para todos os seres humanos, independente de cultura ou religião', 'É ensinada em todas as religiões da mesma forma', 'Foi escrita na Bíblia para todos'],
            correta: 1,
            explicacao: 'A universalidade da Lei Natural decorre de sua origem divina e de ser inscrita na natureza racional humana. Por isso, seus preceitos fundamentais são reconhecíveis por todos os povos e culturas, mesmo com variações.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'Os Mandamentos de Deus',
        versiculo: 'Ex 20,3',
        resumo: 'Aprofunde-se no Decálogo como caminho para a felicidade e fundamento da moral.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os Dez Mandamentos (Decálogo) são a lei revelada por Deus a Moisés no Sinai, expressão privilegiada da Lei Natural e do caminho para a felicidade. Não são obstáculos à liberdade, mas seu fundamento — como as paredes de uma casa protegem, não aprisionam.',
          },
          {
            tipo: 'versiculo',
            texto: '"Não terás outros deuses diante de mim." — Ex 20,3',
          },
          {
            tipo: 'destaque',
            texto: 'O Decálogo divide-se em duas tábuas: a primeira (mandamentos 1-3) regula a relação com Deus; a segunda (mandamentos 4-10) regula a relação com o próximo. Jesus resumiu os dez em dois: amar a Deus sobre tudo e ao próximo como a si mesmo (Mt 22,37-40).',
          },
          {
            tipo: 'curiosidade',
            texto: 'Os números dos mandamentos variam entre tradições: católicos e luteranos seguem a numeração de Santo Agostinho (que une os dois primeiros em um e divide o décimo em dois), enquanto as igrejas reformadas seguem a numeração de Orígenes (que separa os dois primeiros). O conteúdo é o mesmo.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Os Dez Mandamentos foram dados por Deus a...',
            opcoes: ['Moisés no Monte Sinai', 'Abraão no deserto', 'Jesus no Sermão da Montanha', 'Elias no Monte Horeb'],
            correta: 0,
            explicacao: 'Os Dez Mandamentos (Decálogo) foram revelados por Deus a Moisés no Monte Sinai, inscritos em duas tábuas de pedra, segundo o livro do Êxodo (cap. 20) e do Deuteronômio (cap. 5).',
          },
          {
            pergunta: 'A primeira tábua dos Mandamentos regula...',
            opcoes: ['Os rituais da sinagoga', 'A relação do homem com o próximo', 'A relação do homem com Deus', 'As leis civis de Israel'],
            correta: 2,
            explicacao: 'Os três primeiros mandamentos (primeira tábua) tratam da relação com Deus: adorar apenas a Deus, não tomar seu nome em vão e guardar o dia do Senhor. Os outros sete (segunda tábua) regulam a relação com o próximo.',
          },
          {
            pergunta: 'Jesus resumiu os dez mandamentos em...',
            opcoes: ['Orar, jejuar e dar esmolas', 'Amar a Deus sobre tudo e ao próximo como a si mesmo', 'As oito bem-aventuranças', 'Batizar e ensinar todas as nações'],
            correta: 1,
            explicacao: 'Em Mt 22,37-40, Jesus resumiu toda a Lei e os Profetas em dois mandamentos: amar a Deus de todo o coração e amar o próximo como a si mesmo. Estes dois contêm e fundamentam os dez.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'O Amor ao Próximo',
        versiculo: 'Jo 13,34',
        resumo: 'Descubra o mandamento novo de Jesus e como as obras de misericórdia o concretizam.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O mandamento do amor ao próximo é o mandamento novo dado por Jesus — novo não em conteúdo (o Antigo Testamento já o tinha) mas na medida: "como eu vos amei". O amor cristão (ágape) não é um sentimento, mas uma decisão e um ato de vontade orientado ao bem do outro.',
          },
          {
            tipo: 'versiculo',
            texto: '"Amai-vos uns aos outros como eu vos amei." — Jo 13,34',
          },
          {
            tipo: 'destaque',
            texto: 'As obras de misericórdia concretizam o amor ao próximo: corporais (alimentar com fome, dar de beber, vestir o nu, acolher o estrangeiro, visitar o enfermo, visitar o preso, enterrar os mortos) e espirituais (ensinar, aconselhar, corrigir, consolar, perdoar, suportar, orar pelos outros).',
          },
          {
            tipo: 'curiosidade',
            texto: 'A palavra grega para o amor cristão é ágape — amor incondicional que busca o bem do outro sem pedir nada em troca. Difere do eros (amor passional/romântico) e da philia (amor de amizade). Bento XVI no Deus Caritas Est mostrou como os três tipos de amor se integram no amor cristão pleno.',
          },
        ],
        perguntas: [
          {
            pergunta: "O mandamento do amor é 'novo' porque...",
            opcoes: ['A medida é nova: amar como Jesus amou, até dar a vida', 'Nunca havia existido antes de Jesus', 'Substituiu completamente o Antigo Testamento', 'Foi revelado só a João'],
            correta: 0,
            explicacao: "O mandamento do amor já existia no Antigo Testamento (Lv 19,18). Jesus o tornou 'novo' ao propor uma medida inédita: 'como eu vos amei' — amor até a entrega total, até a morte na Cruz.",
          },
          {
            pergunta: 'As obras de misericórdia são divididas em...',
            opcoes: ['Obrigatórias e voluntárias', 'Privadas e públicas', 'Corporais e espirituais', 'Antigas e modernas'],
            correta: 2,
            explicacao: 'A Igreja enumera 7 obras de misericórdia corporais (que atendem às necessidades físicas) e 7 espirituais (que atendem às necessidades da alma). Juntas expressam o amor integral ao ser humano.',
          },
          {
            pergunta: 'Ágape em grego significa...',
            opcoes: ['Amor romântico e passional', 'Amor incondicional que busca o bem do outro', 'Amor de amizade entre iguais', 'Amor filial pelos pais'],
            correta: 1,
            explicacao: 'Ágape é a palavra grega usada no Novo Testamento para o amor cristão — amor que doa, que serve, que perdoa, que não busca o próprio interesse (1Cor 13). É o amor com que Deus nos ama e que somos chamados a imitar.',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'A Misericórdia de Deus',
        versiculo: 'Lc 15,20',
        resumo: 'Contemple o atributo mais revelado de Deus no Evangelho e o sacramento do perdão.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A misericórdia (do latim misericordia = coração que se comove com a miséria alheia) é o atributo mais revelado de Deus no Evangelho. Jesus veio "não para chamar os justos, mas os pecadores" (Mc 2,17). A misericórdia de Deus não tem limites — o único limite é a nossa recusa.',
          },
          {
            tipo: 'versiculo',
            texto: '"Quando ainda estava longe, seu pai o viu e, comovido de compaixão, correu ao seu encontro." — Lc 15,20',
          },
          {
            tipo: 'destaque',
            texto: 'O Sacramento da Reconciliação (Confissão) é o lugar privilegiado onde o pecador encontra a misericórdia de Deus. Na Confissão, Deus não apenas perdoa, mas também restaura a dignidade filial. São João Paulo II chamou-a de "sacramento do amor misericordioso de Deus".',
          },
          {
            tipo: 'curiosidade',
            texto: 'Santa Faustina Kowalska (1905-1938), religiosa polonesa, recebeu revelações sobre a Divina Misericórdia, resultando na imagem do Cristo Misericordioso e na Coroa da Misericórdia. João Paulo II canonizou-a em 2000 e instituiu o Domingo da Misericórdia (1º domingo após a Páscoa) para toda a Igreja.',
          },
        ],
        perguntas: [
          {
            pergunta: 'A parábola do Filho Pródigo revela principalmente...',
            opcoes: ['A misericórdia ilimitada do Pai que acolhe o filho arrependido', 'A importância de guardar a herança da família', 'A punição do pecado com rigor', 'A superioridade do filho mais velho'],
            correta: 0,
            explicacao: 'A parábola do Filho Pródigo (Lc 15,11-32) é o retrato mais perfeito da misericórdia divina: o pai corre ao encontro do filho que voltou, o abraça, lhe coloca vestes e promove uma festa — sem exigir que prove seu arrependimento antes.',
          },
          {
            pergunta: 'O Sacramento da Reconciliação é também chamado de...',
            opcoes: ['Crisma da Penitência', 'Unção dos Enfermos', 'Confissão ou Penitência', 'Batismo de arrependimento'],
            correta: 2,
            explicacao: 'O Sacramento da Reconciliação tem três nomes no Catecismo: Sacramento da Penitência (destaca a conversão), Sacramento da Confissão (destaca o momento da acusação dos pecados) e Sacramento do Perdão (destaca o efeito).',
          },
          {
            pergunta: 'O Domingo da Divina Misericórdia foi instituído por...',
            opcoes: ['Bento XVI em 2005', 'São João Paulo II em 2000', 'Paulo VI em 1970', 'Francisco em 2015'],
            correta: 1,
            explicacao: 'João Paulo II instituiu o Domingo da Divina Misericórdia (1º domingo após a Páscoa) ao canonizar Santa Faustina em 30 de abril de 2000, tornando-o universal para toda a Igreja Católica.',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 6,
    titulo: 'Catequese Avançada',
    descricao: 'Sacramentos, graça e vida sacramental aprofundada',
    icone: '📜',
    nivel: 'Avançado',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: true,
    licoes: [
      {
        id: 1,
        titulo: 'Sacramento da Penitência',
        versiculo: 'Jo 20,23',
        resumo: 'Compreenda a estrutura sacramental do perdão: matéria, forma e ministro à luz do ensinamento da Igreja.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Sacramento da Penitência — também chamado de Reconciliação ou Confissão — é o meio ordinário pelo qual os pecados cometidos após o Batismo são perdoados. Seus atos essenciais são: contrição do penitente, confissão oral dos pecados ao sacerdote, absolvição e satisfação. O ministro é exclusivamente o sacerdote ordenado com a devida jurisdição.',
          },
          {
            tipo: 'versiculo',
            texto: '"Àqueles a quem perdoardes os pecados, serão perdoados; àqueles a quem os retiverdes, serão retidos." — Jo 20,23',
          },
          {
            tipo: 'destaque',
            texto: 'O sacramento atua ex opere operato — pelo próprio ato sacramental realizado segundo a forma prescrita, independente dos méritos pessoais do ministro. Distingue-se a contrição perfeita (motivada pelo amor a Deus) da atrição (motivada pelo temor das penas), sendo ambas válidas para o sacramento, mas a contrição perfeita podendo remitir os pecados mortais mesmo antes da confissão, com o propósito de confessar-se.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O Catecismo da Igreja Católica (n. 1422–1498) define quatro nomes para este sacramento, cada um revelando um aspecto: "Penitência" (conversão interior), "Confissão" (acusação dos pecados), "Reconciliação" (restauração da amizade com Deus) e "Perdão" (o efeito principal). Na Igreja oriental, é chamado de sacramento da *metanoia* — transformação profunda da mente e do coração.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que significa a expressão "ex opere operato"?',
            opcoes: [
              'O sacramento age pelo próprio ato sacramental realizado, independente dos méritos do ministro',
              'O sacramento depende da fé subjetiva do penitente para ser válido',
              'A graça é conferida automaticamente, sem nenhuma disposição do penitente',
              'O sacerdote confere graça por seus próprios méritos pessoais',
            ],
            correta: 0,
            explicacao: '"Ex opere operato" (pelo ato realizado) significa que a eficácia do sacramento provém da ação de Cristo nele, não dos méritos do ministro ou do receptor — embora a disposição do fiel seja necessária para receber o fruto.',
          },
          {
            pergunta: 'Qual a diferença entre contrição perfeita e atrição?',
            opcoes: [
              'A atrição é motivada pelo arrependimento por haver ofendido os amigos',
              'A contrição perfeita é motivada apenas pelo medo do inferno',
              'A contrição perfeita nasce do amor a Deus; a atrição nasce do temor das penas eternas',
              'A atrição é mais elevada que a contrição perfeita na escala da virtude',
            ],
            correta: 2,
            explicacao: 'A contrição perfeita (ato de caridade) dói do pecado primordialmente porque ofendeu a Deus infinitamente bom e amável. A atrição (contrição imperfeita) nasce de motivos inferiores — temor do inferno ou fealdade do pecado — sendo suficiente para o sacramento, mas não para remitir pecados mortais fora dele.',
          },
          {
            pergunta: 'Quem pode administrar validamente o sacramento da Penitência?',
            opcoes: [
              'Qualquer fiel batizado em caso de necessidade extrema',
              'Sacerdote ordenado com a devida jurisdição (faculdade de absolver)',
              'Diáconos ordenados com licença do bispo diocesano',
              'Qualquer sacerdote, independentemente de ter jurisdição',
            ],
            correta: 1,
            explicacao: 'O ministro do sacramento da Penitência é o bispo ou o presbítero que possua a faculdade (jurisdição) de absolver, concedida pelo direito ou pelo ordinário competente (CDC can. 966). Sem jurisdição, a absolvição é inválida, salvo em perigo de morte.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'Eucaristia como Sacrifício',
        versiculo: 'Heb 9,28',
        resumo: 'Aprofunde-se na natureza sacrificial da Missa à luz do Concílio de Trento e da Tradição.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Concílio de Trento (1545–1563) definiu solenemente que a Santa Missa é um verdadeiro e próprio sacrifício — não apenas uma commemoratio ou simples banquete fraternal. O mesmo Cristo que se ofereceu na Cruz oferece-se na Missa de modo incruento, por ministério dos sacerdotes. A substância do sacrifício é idêntica; só o modo difere.',
          },
          {
            tipo: 'versiculo',
            texto: '"Cristo foi oferecido uma única vez para tirar os pecados de muitos." — Heb 9,28',
          },
          {
            tipo: 'destaque',
            texto: 'O Concílio de Trento (Sessão XXII, 1562) condenou como heresia a afirmação de que a Missa é mera recordação do sacrifício da Cruz. Definiu que ela é propitatória — não apenas para os vivos, mas também pode ser oferecida pelos defuntos no Purgatório. O *Canon* Romano (I Oração Eucarística) reflete esta teologia ao pedir que o sacrifício seja "aceito como o de Abel, Abraão e Melquisedeque".',
          },
          {
            tipo: 'curiosidade',
            texto: 'A palavra latina *hostia* (de onde vem "hóstia") significa literalmente "vítima de sacrifício". A palavra *missa*, conforme São Isidoro de Sevilha, deriva do ato de *dimittere* (enviar): "Ite, missa est" — Ide, a assembleia está dispensada para a missão. São Tomás de Aquino ensinou que a Eucaristia é o sacrifício mais excelente porque a própria vítima é Cristo, o sumo sacerdote eterno.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que definiu o Concílio de Trento sobre a natureza da Missa?',
            opcoes: [
              'É um verdadeiro e próprio sacrifício, propitatório e idêntico ao da Cruz em substância',
              'É somente uma refeição comunitária em memória da Última Ceia',
              'É uma repetição renovada do sacrifício do Calvário com nova efusão de sangue',
              'É um rito simbólico instituído pelos Apóstolos após a Ressurreição',
            ],
            correta: 0,
            explicacao: 'Na Sessão XXII (1562), Trento definiu que a Missa é um verdadeiro e próprio sacrifício propitatório — a mesma oferta do Calvário tornada presente de modo incruento, por ministério sacerdotal. Condenou quem negasse esta definição.',
          },
          {
            pergunta: 'O que significa a palavra "hóstia" em latim?',
            opcoes: [
              'Pão sagrado abençoado pelo sacerdote',
              'Memória ritual da Ceia do Senhor',
              'Vítima de sacrifício',
              'Alimento reservado ao clero',
            ],
            correta: 2,
            explicacao: 'Do latim *hostia* = vítima sacrificial. A terminologia reflete a natureza sacrificial da Eucaristia: Cristo é a vítima imolada na Cruz e tornada presente na Missa, oferecida pelo sacerdote que age *in persona Christi*.',
          },
          {
            pergunta: 'Em que difere a Missa do sacrifício do Calvário, segundo a Tradição?',
            opcoes: [
              'A vítima é diferente: na Cruz era o Cristo histórico, na Missa é simbólico',
              'São dois sacrifícios distintos com eficácias complementares',
              'O modo: na Cruz foi cruento; na Missa é incruento — mas a substância e o sacerdote são os mesmos',
              'A Missa é superior ao Calvário por ser repetida diariamente',
            ],
            correta: 2,
            explicacao: 'O sacrifício é único e idêntico em substância — mesma vítima (Cristo), mesmo sacerdote principal (Cristo). O que difere é o modo: sangrento na Cruz, incruento na Missa. Não há dois sacrifícios, mas um mesmo oferecido de forma diferente (Trento, Sess. XXII, cap. 2).',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'O Sacramento da Confirmação',
        versiculo: 'At 2,38',
        resumo: 'Entenda o caráter permanente da Confirmação e seu significado de soldado de Cristo.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Confirmação (ou Crisma) é o sacramento que completa o Batismo, conferindo a plenitude do Espírito Santo. O Catecismo (n. 1285) ensina que ela aperfeiçoa a graça batismal, une mais firmemente à Igreja e dá força para defender e propagar a fé como "soldados de Cristo". Imprime um *character indelebilis* — marca espiritual permanente e indelével — razão pela qual é recebido apenas uma vez.',
          },
          {
            tipo: 'versiculo',
            texto: '"Arrependei-vos e cada um de vós seja batizado em nome de Jesus Cristo, para remissão dos vossos pecados; e recebereis o dom do Espírito Santo." — At 2,38',
          },
          {
            tipo: 'destaque',
            texto: 'O *character indelebilis* (marca indelével) é uma realidade espiritual que configura o confirmado ao sacerdócio de Cristo e lhe confere a capacidade de profetizar e testemunhar a fé publicamente. Esta marca não pode ser apagada por nenhum pecado — ela persiste mesmo no pecador — e é o motivo teológico pelo qual o sacramento não pode ser repetido.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A palavra "crisma" vem do grego *chrisma* (χρῖσμα) = unção com óleo perfumado. No Antigo Testamento, reis, sacerdotes e profetas eram ungidos. Na Confirmação, o Espírito unge o fiel configurando-o a Cristo — o "Ungido" (*Christos* em grego, *Mashiach* em hebraico). O Santo Crisma — mistura de azeite e bálsamo — é consagrado pelo bispo na Missa Crismal da Quinta-Feira Santa.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que é o "character indelebilis" conferido pela Confirmação?',
            opcoes: [
              'Uma marca espiritual permanente que configura o confirmado a Cristo e não pode ser apagada',
              'Um selo temporário que dura até o próximo pecado mortal',
              'A impressão física do sinal da cruz feita pelo bispo na testa',
              'A graça habitual que pode ser perdida e recuperada pela confissão',
            ],
            correta: 0,
            explicacao: 'O *character indelebilis* é uma realidade espiritual permanente — não uma graça, mas uma qualificação ontológica que orienta o fiel ao culto e ao testemunho. Como o Batismo e a Ordem, a Confirmação não pode ser repetida por causa deste caráter.',
          },
          {
            pergunta: 'A palavra "crisma" vem do grego e significa...',
            opcoes: [
              'Testemunho público da fé diante da comunidade',
              'Sinal da Cruz imposto pelo bispo',
              'Unção com óleo perfumado',
              'Confirmação da promessa batismal',
            ],
            correta: 2,
            explicacao: 'Do grego *chrisma* (χρῖσμα) = unção. O nome revela a essência do rito: a unção com o Santo Crisma — mistura de azeite e bálsamo consagrada pelo bispo — que confere o Espírito Santo ao confirmado.',
          },
          {
            pergunta: 'Por que a Confirmação é recebida apenas uma vez?',
            opcoes: [
              'Por decreto do Concílio de Trento que proibiu sua repetição',
              'Porque imprime um caráter permanente na alma, tornando a repetição desnecessária e impossível',
              'Porque a graça conferida é suficiente para toda a vida cristã sem renovação',
              'Por costume da Igreja primitiva estabelecido pelos Apóstolos',
            ],
            correta: 1,
            explicacao: 'A Confirmação, como o Batismo e a Ordem, imprime um *character* — marca espiritual permanente. Não pode ser repetida porque aquilo que se imprimiu na alma permanece para sempre, mesmo em estado de pecado (CIC n. 1317).',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'Ordem Sacerdotal',
        versiculo: 'Heb 5,4',
        resumo: 'Conheça os três graus da Ordem e a distinção entre sacerdócio ministerial e comum.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Sacramento da Ordem confere uma participação especial no sacerdócio de Cristo. A Igreja distingue dois modos de participação: o sacerdócio comum dos fiéis (recebido no Batismo, que habilita para o culto espiritual) e o sacerdócio ministerial ou hierárquico (conferido pela Ordem, que habilita a agir *in persona Christi Capitis* — na pessoa de Cristo Cabeça). Estes dois sacerdócios diferem essencialmente, não apenas de grau.',
          },
          {
            tipo: 'versiculo',
            texto: '"Ninguém se atribui esta honra; só aquele que é chamado por Deus, como o foi Aarão." — Heb 5,4',
          },
          {
            tipo: 'destaque',
            texto: 'O Sacramento da Ordem tem três graus: o Episcopado (plenitude do sacramento, que habilita para ordenar, consagrar e governar), o Presbiterado (colaborador do bispo, que pode celebrar a Eucaristia, absolver e presidir a liturgia) e o Diaconado (ministério de serviço, não sacerdotal, que pode pregar, batizar e assistir ao matrimônio). O Concílio Vaticano II (Lumen Gentium, 28) aprofundou esta distinção.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A expressão latina *in persona Christi* — "na pessoa de Cristo" — descreve o modo pelo qual o sacerdote age nos sacramentos. Quando o padre diz "Eu te absolvo" ou "Este é o meu Corpo", não fala em seu próprio nome, mas como instrumento de Cristo. São Paulo já expressava isso: "Não sou mais eu que vivo, mas Cristo vive em mim" (Gl 2,20). A validade do sacramento não depende da santidade pessoal do ministro, mas da sua ordenação válida.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Em que diferem essencialmente o sacerdócio ministerial e o sacerdócio comum dos fiéis?',
            opcoes: [
              'O ministerial age in persona Christi Capitis nos sacramentos; o comum habilita para o culto espiritual pelo Batismo',
              'O ministerial é superior apenas em grau, sendo uma extensão quantitativa do sacerdócio batismal',
              'O sacerdócio comum é exclusivo dos leigos, enquanto o ministerial é exclusivo dos religiosos',
              'Diferem apenas no vestuário litúrgico e nas funções administrativas paroquiais',
            ],
            correta: 0,
            explicacao: 'O Concílio Vaticano II (Lumen Gentium, 10) afirma que os dois sacerdócios "diferem essencialmente e não só de grau". O ministerial habilita o ordenado a agir *in persona Christi Capitis* nos sacramentos, conferindo uma capacidade ontológica que o sacerdócio batismal não possui.',
          },
          {
            pergunta: 'Quais são os três graus do Sacramento da Ordem?',
            opcoes: [
              'Papa, Cardeal e Bispo',
              'Acólito, Leitor e Diácono',
              'Episcopado, Presbiterado e Diaconado',
              'Bispo, Pároco e Capelão',
            ],
            correta: 2,
            explicacao: 'O Sacramento da Ordem existe em três graus: Episcopado (plenitude), Presbiterado e Diaconado. Os demais títulos (cardeal, pároco, vigário) são funções jurisdicionais ou honoríficas, não graus sacramentais distintos.',
          },
          {
            pergunta: 'O que significa a expressão "in persona Christi" na teologia sacramental?',
            opcoes: [
              'O sacerdote imita Cristo em sua vida moral pessoal',
              'O sacerdote age como instrumento de Cristo, representando-O nos atos sacramentais',
              'O sacerdote substitui Cristo durante sua ausência no céu',
              'O sacerdote recebe poderes divinos permanentes que superam sua natureza humana',
            ],
            correta: 1,
            explicacao: '*In persona Christi* significa que o sacerdote ordenado age como instrumento e representante de Cristo Cabeça nos sacramentos — especialmente na Eucaristia e na Absolvição. A eficácia do ato não depende da santidade do ministro, mas da ordenação válida e da intenção de fazer o que a Igreja faz.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'Matrimônio Cristão',
        versiculo: 'Mt 19,6',
        resumo: 'Compreenda a indissolubilidade do matrimônio e os bens definidos por Santo Agostinho.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Matrimônio entre batizados é um sacramento que reproduz a aliança de Cristo com a Igreja (Ef 5,32). Seus ministros são os próprios cônjuges, que se conferem mutuamente o sacramento pelo consentimento. Suas propriedades essenciais são a unidade (um homem e uma mulher) e a indissolubilidade — "o que Deus uniu, o homem não separe" (Mt 19,6). O divórcio com novo casamento é, para a Igreja, impossível enquanto ambos os cônjuges vivem.',
          },
          {
            tipo: 'versiculo',
            texto: '"O que Deus uniu, o homem não separe." — Mt 19,6',
          },
          {
            tipo: 'destaque',
            texto: 'Santo Agostinho identificou três bens do matrimônio que justificam e santificam o casamento: *proles* (abertura à procriação), *fides* (fidelidade conjugal) e *sacramentum* (indissolubilidade do vínculo como sinal do mistério de Cristo e a Igreja). Estes três bens articulam a doutrina matrimonial da Igreja e foram retomados pelo Catecismo (n. 1601–1666) e pela encíclica *Casti Connubii* de Pio XI (1930).',
          },
          {
            tipo: 'curiosidade',
            texto: 'A diferença entre separação e divórcio é fundamental no direito canônico: a separação dos cônjuges é permitida em casos graves (violência, infidelidade reiterada) sem romper o vínculo matrimonial — que permanece válido. O divórcio civil dissolve apenas o vínculo jurídico civil, mas não o sacramento. Um novo casamento civil, quando o cônjuge anterior vive, é considerado adultério pela doutrina da Igreja (CIC, can. 1085).',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quais são os três bens do matrimônio identificados por Santo Agostinho?',
            opcoes: [
              'Proles (filhos), fides (fidelidade) e sacramentum (indissolubilidade)',
              'Amor, respeito mútuo e coabitação permanente',
              'Virgindade anterior, fidelidade futura e fecundidade garantida',
              'Consentimento livre, forma canônica e testemunhas eclesiásticas',
            ],
            correta: 0,
            explicacao: 'Santo Agostinho (séc. IV–V), em *De Bono Coniugali*, identificou três bens que santificam o matrimônio: *proles* (abertura à procriação e educação cristã dos filhos), *fides* (fidelidade exclusiva) e *sacramentum* (indissolubilidade do vínculo como imagem da união de Cristo com a Igreja).',
          },
          {
            pergunta: 'Quem são os ministros do Sacramento do Matrimônio na Igreja latina?',
            opcoes: [
              'Exclusivamente o bispo diocesano, em casos solenes',
              'O sacerdote assistente, que confere o sacramento aos noivos',
              'Os próprios cônjuges, que se conferem mutuamente o sacramento pelo consentimento',
              'O diácono ordenado com faculdade especial do ordinário local',
            ],
            correta: 2,
            explicacao: 'Na tradição latina, os cônjuges são os ministros do sacramento — eles se conferem mutuamente o Matrimônio pelo consentimento livre e mútuo. O sacerdote (ou diácono) assiste como testemunha qualificada da Igreja e recebe o consentimento em nome dela (CDC, can. 1057).',
          },
          {
            pergunta: 'A indissolubilidade do matrimônio significa que...',
            opcoes: [
              'Os cônjuges nunca podem se separar fisicamente em nenhuma circunstância',
              'O vínculo matrimonial válido e consumado não pode ser desfeito por nenhum poder humano enquanto ambos vivem',
              'Apenas a morte de um dos cônjuges permite a separação canônica',
              'O divórcio civil dissolve o vínculo sacramental automaticamente',
            ],
            correta: 1,
            explicacao: 'A indissolubilidade significa que o vínculo do matrimônio rato e consumado entre batizados não pode ser dissolvido por nenhuma autoridade humana — nem civil nem eclesiástica. Apenas a morte de um cônjuge dissolve o vínculo (CDC, can. 1141). A nulidade declara que nunca houve matrimônio válido.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'Unção dos Enfermos',
        versiculo: 'Tg 5,14',
        resumo: 'Conheça os efeitos espirituais e corporais da Unção e sua origem apostólica.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Unção dos Enfermos é um sacramento especialmente destinado aos que sofrem de doença grave ou velhice avançada. O Catecismo (n. 1499) ensina que ele não é exclusivo dos moribundos — embora também possa ser recebido *in articulo mortis*. Ele une a doença do fiel ao sofrimento redentor de Cristo e pode trazer saúde espiritual e até corporal, se for a vontade de Deus.',
          },
          {
            tipo: 'versiculo',
            texto: '"Está alguém doente entre vós? Chame os presbíteros da Igreja, e eles orarão sobre ele, ungindo-o com óleo em nome do Senhor." — Tg 5,14',
          },
          {
            tipo: 'destaque',
            texto: 'Os efeitos espirituais da Unção são: a graça do Espírito Santo para fortalecer, pacificar e encorajar o enfermo; o perdão dos pecados (se o fiel não pôde receber a Confissão); a preparação para a passagem à vida eterna (*viaticum*). O efeito corporal — a recuperação da saúde — é condicionado à vontade de Deus e à salvação do enfermo (Tg 5,15). O Concílio de Trento (Sess. XIV) confirmou que é sacramento instituído por Cristo.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Durante séculos, a Unção foi chamada de *Extrema Unção* — última unção — porque geralmente era recebida apenas no leito de morte. O Concílio Vaticano II (Sacrosanctum Concilium, 73) e o novo Código (CDC, can. 1004) restauraram o nome e a prática mais ampla: é um sacramento dos enfermos, não apenas dos moribundos. Pode ser recebido a cada nova fase de doença grave e repetido se o estado agravar.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quem pode receber licitamente o sacramento da Unção dos Enfermos?',
            opcoes: [
              'Qualquer fiel batizado que esteja em perigo de morte, independente da causa',
              'Exclusivamente os que estão em agonia imediata e não podem mais falar',
              'Fiéis batizados que sofrem de doença grave, cirurgia de risco ou velhice avançada',
              'Apenas aqueles que tenham recebido antes o sacramento da Confissão',
            ],
            correta: 0,
            explicacao: 'O CDC (can. 1004) estabelece que pode receber a Unção todo fiel batizado que, tendo chegado ao uso da razão, se encontra em perigo por doença ou velhice. Não é reservado aos moribundos — inclui doentes graves, idosos fragilizados e pré-operatórios de risco.',
          },
          {
            pergunta: 'O sacramento da Unção dos Enfermos tem origem apostólica atestada em...',
            opcoes: [
              'A Didaquê, documento do século I que descreve a prática litúrgica primitiva',
              'O Evangelho de João, capítulo 11, na ressurreição de Lázaro',
              'A carta de Tiago 5,14-15, que prescreve a unção dos enfermos pelos presbíteros',
              'As Atas do Concílio de Niceia, que instituíram formalmente o rito',
            ],
            correta: 2,
            explicacao: 'Tiago 5,14-15 é o texto fundante do sacramento: "Chame os presbíteros da Igreja, e eles orarão sobre ele, ungindo-o com óleo em nome do Senhor; e a oração da fé salvará o doente." O Concílio de Trento (1551) confirmou este texto como fundamento escriturístico do sacramento.',
          },
          {
            pergunta: 'Por que a Unção dos Enfermos não é mais chamada de "Extrema Unção"?',
            opcoes: [
              'Porque o nome foi considerado superstições pelo Concílio Vaticano I',
              'Porque o Vaticano II restaurou o sentido mais amplo: é sacramento dos enfermos graves, não exclusivo dos moribundos',
              'Porque a prática foi abolida após o Concílio e substituída pela bênção dos enfermos',
              'Porque passou a ser administrado apenas por bispos em situações excepcionais',
            ],
            correta: 1,
            explicacao: 'O Concílio Vaticano II (Sacrosanctum Concilium, 73) determinou que o sacramento se destinava aos enfermos — não exclusivamente aos que estão à beira da morte. Assim, o nome "Extrema Unção" foi substituído por "Unção dos Enfermos" para refletir seu verdadeiro escopo sacramental.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'Indulgências e Purgatório',
        versiculo: '2Mc 12,46',
        resumo: 'Entenda a doutrina do Purgatório e o poder das indulgências no tesouro da Igreja.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Purgatório é o estado de purificação final pelo qual passam os que morreram na graça de Deus, mas ainda necessitam ser purificados da "pena temporal" devida pelos pecados já perdoados. O Concílio de Florença (1439) e o de Trento (Sess. XXV, 1563) definiram dogmaticamente sua existência. A Igreja pode ajudar as almas do Purgatório com orações, Missas e indulgências.',
          },
          {
            tipo: 'versiculo',
            texto: '"É uma santa e salutar ideia orar pelos mortos, para que sejam libertos dos pecados." — 2Mc 12,46',
          },
          {
            tipo: 'destaque',
            texto: 'A indulgência é "a remissão, perante Deus, da pena temporal devida pelos pecados, já perdoados quanto à culpa" (CIC n. 1471). A Igreja a concede em virtude do *thesaurus Ecclesiae* — o tesouro dos méritos de Cristo e dos santos. A indulgência plenária remite toda a pena temporal; a parcial, uma parte. Pode ser aplicada pelos vivos ou pelos defuntos no Purgatório, por modo de sufrágio.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A distinção entre culpa e pena é fundamental: o sacramento da Penitência perdoa a *culpa* (a ofensa a Deus e a reorientação para o mal) e a pena eterna do inferno. Porém, permanece uma pena temporal — consequência ordenada do pecado — que deve ser expurgada aqui ou no Purgatório. Essa doutrina foi sistematizada por São Tomás de Aquino (Suma Teológica, Suplemento, q. 25–27) e é distinta das práticas abusivas que motivaram a Reforma protestante.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que é o Purgatório segundo a definição dogmática da Igreja?',
            opcoes: [
              'Um estado de purificação final para os que morreram na graça mas ainda têm pena temporal a expiar',
              'Um período de segunda chance para os que morreram em pecado mortal',
              'Um lugar físico de sofrimento equivalente ao inferno, mas temporário',
              'Uma crença popular sem base dogmática, tolerada pela Igreja por tradição',
            ],
            correta: 0,
            explicacao: 'O Purgatório é definido dogmaticamente (Concílio de Florença 1439; Trento 1563) como estado de purificação final para os que morreram em amizade com Deus, mas com dívidas de pena temporal a pagar. Não é segunda chance para os condenados, nem lugar físico descrito em detalhes pela revelação.',
          },
          {
            pergunta: 'O que é o "thesaurus Ecclesiae" (tesouro da Igreja)?',
            opcoes: [
              'Os recursos financeiros administrados pela Santa Sé para obras de caridade',
              'O conjunto dos bens materiais e culturais pertencentes ao Vaticano',
              'Os méritos superabundantes de Cristo e dos santos, que a Igreja distribui pelas indulgências',
              'Os sacramentos como canais únicos de graça divina na economia salvífica',
            ],
            correta: 2,
            explicacao: 'O *thesaurus Ecclesiae* é o tesouro espiritual dos méritos infinitos de Cristo e dos méritos supererrogatórios dos santos, do qual a Igreja, por sua autoridade das chaves, retira para conceder indulgências — remissão da pena temporal devida pelos pecados (CIC n. 1476–1477).',
          },
          {
            pergunta: 'A indulgência plenária remite...',
            opcoes: [
              'A culpa dos pecados veniais cometidos após a última confissão',
              'A pena eterna merecida pelos pecados mortais não confessados',
              'Toda a pena temporal devida pelos pecados já perdoados quanto à culpa',
              'Apenas metade da pena temporal, complementada pela contrição do penitente',
            ],
            correta: 2,
            explicacao: 'A indulgência plenária remite *toda* a pena temporal devida pelos pecados, cuja culpa já foi perdoada. Exige estado de graça, ausência de apego a qualquer pecado (mesmo venial), e o cumprimento das obras prescritas (oração, confissão, comunhão, intenção do Papa).',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'A Graça Santificante',
        versiculo: 'Jo 15,5',
        resumo: 'Aprofunde-se na doutrina da graça — habitual, atual e os méritos — à luz de Trento.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A graça é a participação gratuita na vida divina, "gratum faciens" — que torna agradável a Deus (São Tomás, ST I-II, q. 111). Distingue-se graça habitual (ou santificante): disposição estável que aperfeiçoa a alma e a orienta para Deus; e graça atual: impulso transitório de Deus que move à ação sobrenatural. Sem a graça, nada de meritório para a salvação é possível (Jo 15,5).',
          },
          {
            tipo: 'versiculo',
            texto: '"Sem mim não podeis fazer nada." — Jo 15,5',
          },
          {
            tipo: 'destaque',
            texto: 'O Concílio de Trento (Sess. VI, 1547) definiu contra os protestantes que o homem pode, com a graça, verdadeiramente merecer a vida eterna. Distinguem-se dois tipos de mérito: *de condigno* (de estrita justiça, fundado na graça santificante — o único pelo qual se merece a vida eterna) e *de congruo* (de conveniência, fundado na amizade com Deus — como interceder pelos outros). Nenhum mérito é possível sem a graça previdente de Deus.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A disputa entre agostinianos, tomistas e molinistas sobre a compatibilidade da graça eficaz com o livre-arbítrio durou séculos. Domingo Bañez OP defendia a *praemotio physica* (moção física prévia de Deus); Luís de Molina SJ propunha a *scientia media* (ciência média de Deus sobre os futuros condicionados). O Papa Clemente VIII (1597–1607) presidiu as *Congregationes de Auxiliis* sem dirimir definitivamente — deixando ambas as posições abertas na Igreja.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que é a graça habitual (ou santificante)?',
            opcoes: [
              'Uma disposição estável e sobrenatural que aperfeiçoa a alma e a torna participante da vida divina',
              'Os impulsos transitórios de Deus que movem à prática de atos virtuosos ocasionais',
              'A graça recebida pelo hábito de rezar diariamente durante anos',
              'O conjunto das virtudes morais adquiridas pelo esforço humano ao longo da vida',
            ],
            correta: 0,
            explicacao: 'A graça habitual (santificante) é uma qualidade sobrenatural e estável infundida na alma por Deus, que faz o homem justo, filho adotivo de Deus e herdeiro da vida eterna. Ela é perdida pelo pecado mortal e recuperada pela Confissão (Trento, Sess. VI).',
          },
          {
            pergunta: 'O que o Concílio de Trento definiu sobre o mérito humano?',
            opcoes: [
              'Que nenhum ato humano pode ter valor meritório, pois só a fé justifica',
              'Que o homem, com a graça, pode verdadeiramente merecer a vida eterna (mérito de condigno)',
              'Que os méritos dos santos podem substituir os méritos de Cristo para os fiéis',
              'Que o mérito humano é apenas metafórico, sem realidade ontológica perante Deus',
            ],
            correta: 1,
            explicacao: 'Trento (Sess. VI, can. 32) definiu que o homem justificado pode, pela graça, merecer verdadeiramente a vida eterna e o aumento da graça — contra a negação protestante do mérito. Este mérito (*de condigno*) é totalmente dependente da graça de Deus, nunca independente dela.',
          },
          {
            pergunta: 'O que diferencia o mérito "de condigno" do mérito "de congruo"?',
            opcoes: [
              'O de condigno é alcançado pelos santos canonizados; o de congruo pelos fiéis comuns',
              'O de condigno exige jejum e penitência; o de congruo exige apenas oração',
              'O de condigno é de estrita justiça (fundado na graça), pelo qual se merece a vida eterna; o de congruo é de conveniência, usado nas intercessões',
              'O de condigno pertence ao clero ordenado; o de congruo, aos leigos em estado de graça',
            ],
            correta: 2,
            explicacao: 'O mérito *de condigno* (de estrita condigência) é o pelo qual, fundado na graça santificante e na caridade, se merece a vida eterna com rigor de justiça — condignamente. O mérito *de congruo* (de conveniência) é menos rigoroso, como quando intercedemos pelos outros: convém que Deus atenda, mas não há estrita exigência.',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 7,
    titulo: 'História da Igreja: Primeiros Séculos',
    descricao: 'Das origens apostólicas ao Cisma do Oriente',
    icone: '🏛️',
    nivel: 'Intermediário',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: true,
    licoes: [
      {
        id: 1,
        titulo: 'A Igreja Primitiva e os Apóstolos',
        versiculo: 'At 2,42',
        resumo: 'Descubra as origens da Igreja no Pentecostes e a missão apostólica nos primeiros séculos.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Igreja nasce em Pentecostes (At 2) com a descida do Espírito Santo sobre os Apóstolos reunidos com Maria no Cenáculo. Em grego, a palavra *ekklēsia* (ἐκκλησία) — traduzida como "Igreja" — significa "assembleia dos convocados". Os Apóstolos, enviados por Cristo, espalharam o Evangelho pelo Império Romano, fundando comunidades em Jerusalém, Antioquia, Éfeso, Corinto e Roma.',
          },
          {
            tipo: 'versiculo',
            texto: '"Perseveravam no ensinamento dos Apóstolos, na comunhão fraterna, na fração do pão e nas orações." — At 2,42',
          },
          {
            tipo: 'destaque',
            texto: 'A presença de São Pedro em Roma é atestada por documentos do século I: a carta de Clemente Romano (c. 96 d.C.) e a epístola de Inácio de Antioquia. O martírio de Pedro no Circo de Nero (c. 64–68 d.C.) na Via Appia e sua sepultura na colina do Vaticano são historicamente documentados por escavações arqueológicas realizadas sob a Basílica de São Pedro no século XX.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A perseguição de Nero (64 d.C.) foi desencadeada após o grande incêndio de Roma. O historiador romano Tácito (*Annales* XV, 44) relata que Nero culpou os cristãos pelo incêndio para desviar suspeitas de si. Nesta perseguição morreram São Pedro (crucificado de cabeça para baixo) e São Paulo (decapitado), tornando-se os pilares fundadores da Igreja de Roma.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que significa a palavra grega "ekklēsia" (ἐκκλησία)?',
            opcoes: [
              'Assembleia dos convocados — a comunidade reunida por Deus',
              'Templo sagrado construído para o culto divino',
              'Hierarquia dos sacerdotes ordenados pelo bispo',
              'Escola de doutrina cristã nos primeiros séculos',
            ],
            correta: 0,
            explicacao: '*Ekklēsia* em grego significa "assembleia dos convocados". A palavra passou para o latim como *ecclesia* e designa tanto a comunidade dos fiéis quanto o edifício onde se reúnem. Expressa que a Igreja não é uma organização humana, mas uma convocação divina.',
          },
          {
            pergunta: 'Qual historiador romano do século I atesta a existência e perseguição dos cristãos em Roma?',
            opcoes: [
              'Cícero, no De Republica, descrevendo os costumes dos cristãos orientais',
              'Virgílio, na Eneida, ao descrever as religiões orientais no Império',
              'Tácito, nos Annales (XV, 44), ao relatar a perseguição de Nero',
              'Plínio, o Velho, na Historia Naturalis, ao catalogar seitas orientais',
            ],
            correta: 2,
            explicacao: 'Tácito, em seus *Annales* (XV, 44), escreveu c. 116 d.C. que Nero culpou os cristãos pelo incêndio de Roma (64 d.C.) e os submeteu a tormentos. É um dos mais importantes testemunhos pagãos sobre os primeiros cristãos e o martírio em Roma.',
          },
          {
            pergunta: 'A Igreja nasce oficialmente em qual evento narrado nos Atos dos Apóstolos?',
            opcoes: [
              'Na última Ceia, quando Jesus institui a Eucaristia e ordena os Doze',
              'Na Ressurreição, quando Jesus aparece a Maria Madalena e aos Apóstolos',
              'Em Pentecostes, com a descida do Espírito Santo sobre os Apóstolos e Maria',
              'Na Ascensão, quando Jesus encarrega os Apóstolos de batizar todas as nações',
            ],
            correta: 2,
            explicacao: 'Pentecostes (At 2) é considerado o "nascimento" visível da Igreja: o Espírito Santo desce sobre os Apóstolos reunidos com Maria, Pedro prega publicamente e cerca de 3.000 pessoas são batizadas naquele dia — formando a primeira comunidade cristã de Jerusalém.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'As Catacumbas e os Mártires',
        versiculo: 'Ap 12,11',
        resumo: 'Conheça o testemunho de sangue dos mártires e os cemitérios subterrâneos onde a fé floresceu.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'As catacumbas eram cemitérios subterrâneos escavados nos arredores de Roma onde os cristãos sepultavam seus mortos e, durante as perseguições, celebravam os sacramentos junto aos túmulos dos mártires. Não eram primariamente esconderijos, mas locais sagrados de culto e memória. Os séculos I–IV viram dez grandes perseguições imperiais, a última e mais feroz sob Diocleciano (303–313 d.C.).',
          },
          {
            tipo: 'versiculo',
            texto: '"Eles o venceram pelo sangue do Cordeiro e pelo testemunho que deram, pois não amaram a própria vida a ponto de recusar a morte." — Ap 12,11',
          },
          {
            tipo: 'destaque',
            texto: 'Tertuliano (c. 160–220 d.C.), apologista africano, cunhou a frase que sintetiza a força do martírio: *Sanguis martyrum semen christianorum* — "o sangue dos mártires é semente de novos cristãos". Contra toda expectativa humana, a perseguição não destruiu a Igreja, mas a expandiu. O testemunho dos mártires — *martys* em grego significa "testemunha" — era o argumento mais poderoso da credibilidade do Evangelho.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A arte catacumbal é a mais antiga expressão da arte cristã. Nos afrescos das catacumbas de Roma (sécs. II–IV) aparecem imagens simbólicas: o peixe (*ichthys* = Jesus Cristo, Filho de Deus, Salvador — acrônimo grego), o bom pastor, Jonás no ventre da baleia (símbolo da Ressurreição), a fração do pão e Orfeu (figura simbólica de Cristo). Evitavam representações diretas de Cristo por cautela diante dos pagãos.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que afirmou Tertuliano sobre a relação entre martírio e crescimento da Igreja?',
            opcoes: [
              '"Sanguis martyrum semen christianorum" — o sangue dos mártires é semente de novos cristãos',
              '"Credo quia absurdum" — creio porque é absurdo, o que desafia a razão humana',
              '"Extra Ecclesiam nulla salus" — fora da Igreja não há salvação, mesmo para os mártires',
              '"Anima naturaliter christiana" — a alma é naturalmente cristã, sem precisar do martirio',
            ],
            correta: 0,
            explicacao: 'Tertuliano (*Apologeticum*, cap. 50) afirmou que o sangue dos mártires era semente de novos cristãos — as perseguições, ao invés de destruir a Igreja, a expandiam, pois o testemunho até a morte da fé cristã atraía pagãos à conversão.',
          },
          {
            pergunta: 'O símbolo do peixe (ichthys) nas catacumbas era um acrônimo de...',
            opcoes: [
              'Iesus Christus Hominum Thronus Yathroph — nomes divinos em hebraico mesclados',
              'In Cruce Hoc Triumphavit Yeshua — "nesta cruz Yeshu triunfou"',
              'Iēsous Christos Theou Yios Sōtēr — "Jesus Cristo, Filho de Deus, Salvador" em grego',
              'In Christo His Testificatur Ys — sigla medieval das virtudes teologais',
            ],
            correta: 2,
            explicacao: '*Ichthys* (ΙΧΘΥΣ) em grego significa "peixe" e é acrônimo de: **Ι**ησοῦς **Χ**ριστός **Θ**εοῦ **Υ**ἱός **Σ**ωτήρ — Jesus Cristo, Filho de Deus, Salvador. Resumia a profissão de fé cristã de forma discreta, usada pelos primeiros cristãos para se identificar mutuamente nas perseguições.',
          },
          {
            pergunta: 'Qual palavra grega para "testemunha" originou o termo "mártir"?',
            opcoes: [
              'Doulos (δοῦλος) — servo ou escravo dedicado ao Senhor',
              'Martys (μάρτυς) — testemunha que atesta com sua própria vida',
              'Hagios (ἅγιος) — santo consagrado pelo bispo após a morte',
              'Pistis (πίστις) — fé inquebrantável diante da perseguição',
            ],
            correta: 1,
            explicacao: 'Do grego *martys* (μάρτυς) = testemunha. O mártir cristão testemunha com seu sangue a verdade do Evangelho e a realidade da Ressurreição de Cristo. O martírio é considerado pela Igreja o ato de fé mais perfeito — *baptismus sanguinis* (batismo de sangue).',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'Os Padres Apostólicos',
        versiculo: '2Tm 2,2',
        resumo: 'Conheça os discípulos diretos dos Apóstolos que transmitiram a fé da Igreja primitiva.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Os "Padres Apostólicos" são escritores cristãos do fim do século I e início do século II que foram discípulos diretos dos Apóstolos ou viveram em sua geração imediata. São a geração-ponte entre o Novo Testamento e a Igreja do século II. Entre eles destacam-se: Clemente Romano, Inácio de Antioquia, Policarpo de Esmirna e o autor da *Didaquê*.',
          },
          {
            tipo: 'versiculo',
            texto: '"O que aprendeste de mim, na presença de muitas testemunhas, confia a homens fiéis, aptos a ensinarem os outros." — 2Tm 2,2',
          },
          {
            tipo: 'destaque',
            texto: 'Santo Inácio de Antioquia (c. 35–107 d.C.), discípulo de São João Apóstolo e bispo de Antioquia, escreveu sete cartas a diversas Igrejas enquanto era conduzido a Roma para ser martirizado. Em sua carta aos Esmirnenses (cap. 8), empregou pela primeira vez o termo *katholikē ekklēsia* — "Igreja Católica" — para designar a Igreja universal unida ao bispo. Seu martírio no anfiteatro de Roma é atestado pela Carta de Policarpo.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A *Didaquê* ("Instrução dos Doze Apóstolos") é um documento do século I (c. 70–110 d.C.) redescoberto em 1873 em Constantinopla. É o mais antigo manual de catequese e liturgia cristã que possuímos, descrevendo o Batismo (por imersão ou por infusão tríplice), a Eucaristia, o jejum (quartas e sextas-feiras), a oração do Pai Nosso (três vezes ao dia) e a organização da comunidade. Revela a vida litúrgica da Igreja mais primitiva.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quem empregou pela primeira vez o termo "Igreja Católica" (katholikē ekklēsia)?',
            opcoes: [
              'Santo Inácio de Antioquia, na carta aos Esmirnenses (c. 107 d.C.)',
              'São Clemente Romano, na carta aos Coríntios (c. 96 d.C.)',
              'São Paulo, na carta aos Efésios, ao descrever a Igreja universal',
              'O Concílio de Niceia (325 d.C.), ao definir os atributos da Igreja',
            ],
            correta: 0,
            explicacao: 'Santo Inácio de Antioquia (carta aos Esmirnenses, cap. 8, c. 107 d.C.) escreveu: "Onde estiver o bispo, aí esteja a multidão, como onde estiver Jesus Cristo, aí está a Igreja Católica." É o primeiro uso documentado da expressão.',
          },
          {
            pergunta: 'O que é a Didaquê e quando foi redescoberta?',
            opcoes: [
              'Uma coleção de sermões de São Basílio Magno reencontrada em 1521 em Florença',
              'O mais antigo cânone bíblico completo, descoberto em Qumrã em 1947',
              'Um manual do século I de catequese e liturgia cristã primitiva, redescoberto em 1873',
              'As atas do primeiro Concílio de Jerusalém presidido por São Tiago, datadas do ano 48 d.C.',
            ],
            correta: 2,
            explicacao: 'A *Didaquê* (= Instrução), redescoberta em 1873 num manuscrito de Constantinopla, é documento do séc. I (c. 70–110 d.C.) que descreve Batismo, Eucaristia, jejum, oração e estrutura da comunidade. É fonte preciosa sobre a liturgia e disciplina da Igreja mais primitiva.',
          },
          {
            pergunta: 'Por que os Padres Apostólicos têm autoridade especial na Tradição da Igreja?',
            opcoes: [
              'Foram canonizados coletivamente pelo Concílio Vaticano I como Doutores da Igreja',
              'Eram discípulos diretos dos Apóstolos ou da geração imediata, transmitindo a fé apostólica sem interrupção',
              'Escreveram textos incluídos posteriormente no cânon do Novo Testamento',
              'Foram os primeiros a formular o Credo Niceno-Constantinopolitano em suas bases',
            ],
            correta: 1,
            explicacao: 'Os Padres Apostólicos são a geração-ponte entre os Apóstolos e a Igreja pós-apostólica. Por terem recebido a fé diretamente dos Apóstolos ou de seus discípulos imediatos, seus escritos são testemunhos de primeira ordem sobre a fé e a prática da Igreja primitiva — parte essencial da Tradição Viva.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'Heresias e Concílios Ecumênicos',
        versiculo: 'Tt 3,10',
        resumo: 'Entenda como o arianismo ameaçou a fé e como Niceia (325) definiu a divindade de Cristo.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A grande heresia do século IV foi o arianismo, proposto por Ário de Alexandria (c. 256–336 d.C.). Ário ensinava que o Filho de Deus era uma criatura — o mais perfeito das criaturas, mas não Deus em sentido pleno: *homoiousios* (de substância semelhante), não *homoousios* (consubstancial). O Concílio de Niceia (325 d.C.), convocado pelo imperador Constantino e presidido pelo bispo Ósio de Córdoba, condenou Ário e definiu que o Filho é consubstancial (*homoousios*) ao Pai.',
          },
          {
            tipo: 'versiculo',
            texto: '"O homem herético, depois de uma ou duas admoestações, evita-o." — Tt 3,10',
          },
          {
            tipo: 'destaque',
            texto: 'O campeão da ortodoxia contra o arianismo foi Santo Atanásio de Alexandria (c. 296–373 d.C.), que repetidas vezes foi exilado por imperadores arianos — *Athanasius contra mundum* (Atanásio contra o mundo). O Concílio de Constantinopla (381 d.C.) completou o Credo niceno, definindo a divindade do Espírito Santo contra os macedonianos (pneumatômacos — "combatentes contra o Espírito"). Foi então que surgiu o Credo Niceno-Constantinopolitano que rezamos hoje.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A diferença entre *homoousios* e *homoiousios* era de apenas uma letra — iota (ι) em grego — mas implicava diferença abismal de significado: *homoousios* = "de mesma substância" (consubstancial); *homoiousios* = "de substância semelhante". São Jerônimo chegou a dizer que "o mundo acordou ariano" após Niceia, pois a heresia se espalhou amplamente mesmo após a condenação. Daí a expressão posterior "não ceder nem um iota".',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que ensinava Ário sobre o Filho de Deus?',
            opcoes: [
              'Que o Filho é consubstancial ao Pai — Deus verdadeiro de Deus verdadeiro',
              'Que o Filho é uma criatura, o mais perfeito dos seres, mas não Deus em sentido pleno',
              'Que o Filho era apenas o aspecto humano de Deus, sem existência eterna própria',
              'Que o Pai e o Filho são dois deuses distintos em essência e em vontade',
            ],
            correta: 0,
            explicacao: 'Ário ensinava que "houve um tempo em que o Filho não existia" (*ēn pote hote ouk ēn*). Para ele, o Filho era a mais perfeita das criaturas, mas não Deus eterno e consubstancial. O Concílio de Niceia (325) condenou esta heresia e definiu o Filho como *homoousios* — consubstancial ao Pai.',
          },
          {
            pergunta: 'O que significa homoousios no Credo niceno?',
            opcoes: [
              'De semelhante vontade e amor — unidade moral entre Pai e Filho',
              'De igual dignidade, mas substância hierarquicamente inferior ao Pai',
              'De mesma substância — consubstancial ao Pai, Deus verdadeiro de Deus verdadeiro',
              'De semelhante substância, diferente apenas na forma de se manifestar',
            ],
            correta: 2,
            explicacao: '*Homoousios* (ὁμοούσιος) = "de mesma substância/essência". O Credo de Niceia afirma que o Filho é *homoousios* ao Pai — não criatura, não ser inferior, mas Deus verdadeiro. Esta palavra foi o ponto central da controvérsia ariana e permanece no Credo que rezamos nas Missas dominicais.',
          },
          {
            pergunta: 'Quem foi o principal defensor da fé nicena contra o arianismo?',
            opcoes: [
              'São Basílio Magno de Cesareia, organizador do monaquismo oriental',
              'Santo Atanásio de Alexandria — Athanasius contra mundum',
              'São Gregório de Nissa, o mais filosófico dos Padres Capadócios',
              'São Hilário de Poitiers, que combateu o arianismo no Ocidente',
            ],
            correta: 1,
            explicacao: 'Santo Atanásio de Alexandria (*c.* 296–373) foi o principal defensor da fé nicena, exilado cinco vezes por imperadores arianos. A expressão *Athanasius contra mundum* (Atanásio contra o mundo) resume sua resistência solitária ao arianismo dominante na corte imperial.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'Constantino e o Édito de Milão',
        versiculo: 'Rm 13,1',
        resumo: 'Compreenda como a paz constantiniana transformou a Igreja e seus riscos históricos.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Édito de Milão (313 d.C.) foi uma carta imperial de Constantino e Licínio que concedeu liberdade religiosa a todos os habitantes do Império Romano — incluindo especificamente os cristãos. Encerrou oficialmente as perseguições e devolveu os bens confiscados à Igreja. Não tornou o cristianismo religião oficial do Estado — isso ocorreu sob Teodósio I em 380 d.C. (Édito de Tessalônica).',
          },
          {
            tipo: 'versiculo',
            texto: '"Toda autoridade vem de Deus; e as que existem foram estabelecidas por Deus." — Rm 13,1',
          },
          {
            tipo: 'destaque',
            texto: 'A conversão de Constantino ao cristianismo permanece historicamente debatida. Antes da batalha da Ponte Mílvia (312 d.C.), teria visto uma cruz com as palavras *in hoc signo vinces* ("com este sinal vencerás") e adotado o monograma de Cristo (☧ — Chi-Rho) em seu exército. Eusébio de Cesareia descreveu a visão em detalhes. Constantino foi batizado apenas em seu leito de morte (337 d.C.), prática então comum para manter a liberdade de ação política.',
          },
          {
            tipo: 'curiosidade',
            texto: 'O perigo do *cesaropapismo* — interferência do poder civil nos assuntos eclesiásticos — emergiu com Constantino, que convocou o Concílio de Niceia (325) como uma assembleia de sua corte imperial. Esta tensão entre o poder espiritual e o temporal marcaria toda a história medieval. São Ambrósio de Milão (séc. IV) foi o primeiro a enfrentar publicamente o imperador (Teodósio I), impondo-lhe penitência pública pelo massacre de Tessalônica — afirmando a superioridade da lei divina sobre a imperial.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que o Édito de Milão (313 d.C.) estabeleceu?',
            opcoes: [
              'Liberdade religiosa para todos, incluindo os cristãos, e devolução de bens confiscados à Igreja',
              'O cristianismo como religião oficial e única do Império Romano',
              'A convocação do Concílio de Niceia para resolver a controvérsia ariana',
              'A expulsão de todos os sacerdotes pagãos das províncias orientais do Império',
            ],
            correta: 0,
            explicacao: 'O Édito de Milão concedeu liberdade religiosa geral — não apenas aos cristãos — e ordenou a restituição dos bens confiscados à Igreja. O cristianismo só se tornou religião oficial do Império com o Édito de Tessalônica de Teodósio I (380 d.C.).',
          },
          {
            pergunta: 'O que significa "in hoc signo vinces" na tradição constantiniana?',
            opcoes: [
              '"Neste sinal vencerás" — frase associada à visão da cruz antes da batalha da Ponte Mílvia',
              '"Neste sinal batiza" — ordem de Constantino para batizar o exército antes da batalha',
              '"Pelo sinal da Cruz, proteges teus servos" — oração litúrgica antiga do rito romano',
              '"Com este sinal curas" — relato da cura milagrosa de Constantino pela cruz de Cristo',
            ],
            correta: 0,
            explicacao: 'Segundo Eusébio de Cesareia (*Vida de Constantino*), antes da batalha da Ponte Mílvia (312 d.C.), Constantino teria visto uma cruz luminosa com as palavras *in hoc signo vinces* ("com este sinal vencerás"). Após a vitória, adotou o monograma *Chi-Rho* (☧) como símbolo imperial.',
          },
          {
            pergunta: 'O que foi o cesaropapismo e qual Padre da Igreja o enfrentou publicamente?',
            opcoes: [
              'A heresia ariana combatida por Atanásio que propunha um César-Papa único',
              'A interferência do poder civil nos assuntos eclesiásticos, enfrentada por São Ambrósio de Milão',
              'O sistema de eleição papal pelos imperadores carolíngios no século VIII',
              'A doutrina de Constantino que identificava o imperador com o vicário de Cristo na terra',
            ],
            correta: 1,
            explicacao: 'O cesaropapismo é a subordinação da autoridade eclesiástica ao poder civil. São Ambrósio de Milão (c. 340–397) o combateu exemplarmente ao impor penitência pública ao imperador Teodósio I pelo massacre de Tessalônica (390 d.C.) — afirmando que o imperador estava sujeito à lei de Cristo, não acima dela.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'Santo Agostinho e a Ortodoxia',
        versiculo: 'Rm 9,16',
        resumo: 'Conheça o maior Doutor do Ocidente e seu combate ao pelagianismo sobre a graça e o livre-arbítrio.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Santo Agostinho de Hipona (354–430 d.C.) é o maior Doutor da Igreja Ocidental. Convertido ao cristianismo em 387 d.C. após anos de busca intelectual e vida dissoluta — narrados nas *Confissões* —, tornou-se bispo de Hipona (norte da África) em 395 d.C. Seu combate ao pelagianismo definiu a doutrina católica sobre graça, pecado original e livre-arbítrio para toda a tradição subsequente.',
          },
          {
            tipo: 'versiculo',
            texto: '"Portanto, não depende do querer nem do esforço humano, mas da misericórdia de Deus." — Rm 9,16',
          },
          {
            tipo: 'destaque',
            texto: 'Pelágio (c. 354–420 d.C.), monge britânico, ensinava que o homem pode alcançar a salvação por seu próprio esforço natural sem a graça interior de Deus. A graça seria apenas auxílio externo (lei, exemplo de Cristo, perdão dos pecados). Agostinho combateu isto vigorosamente: sem a graça interior, o livre-arbítrio está ferido pelo pecado original e inclina-se ao mal. O Concílio de Cartago (418 d.C.) condenou o pelagianismo como heresia.',
          },
          {
            tipo: 'curiosidade',
            texto: 'As *Confissões* de Santo Agostinho (escritas c. 397–401 d.C.) são consideradas a primeira autobiografia espiritual da história ocidental. A frase mais célebre resume toda a sua teologia: *"Fecisti nos ad te, et inquietum est cor nostrum, donec requiescat in te"* — "Fizeste-nos para Ti, e inquieto está o nosso coração, enquanto não repousa em Ti" (*Confissões* I, 1). Sua obra *A Cidade de Deus* (413–426 d.C.) é a primeira grande filosofia cristã da história.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que ensinava Pelágio que foi condenado como heresia?',
            opcoes: [
              'Que o homem pode alcançar a salvação por seu próprio esforço natural, sem necessidade da graça interior',
              'Que Cristo não era verdadeiramente humano, apenas aparentando ter corpo material',
              'Que os pecados mortais após o Batismo não podiam ser perdoados por nenhum meio',
              'Que o Espírito Santo procederia apenas do Pai, sem proceder também do Filho',
            ],
            correta: 0,
            explicacao: 'Pelágio ensinava que o livre-arbítrio humano, intacto após o pecado original, podia alcançar a salvação sem necessidade da graça interior de Deus. A graça seria apenas auxílio externo. Agostinho combateu esta posição, e o Concílio de Cartago (418 d.C.) condenou o pelagianismo.',
          },
          {
            pergunta: 'Qual é a frase inicial das Confissões de Santo Agostinho?',
            opcoes: [
              '"Deus é amor, e quem permanece no amor permanece em Deus, e Deus nele."',
              '"Crede ut intelligas, intellige ut credas" — crê para entender, entende para crer',
              '"Fecisti nos ad te, et inquietum est cor nostrum, donec requiescat in te"',
              '"In principio erat Verbum" — no princípio era o Verbo, e o Verbo estava com Deus',
            ],
            correta: 2,
            explicacao: '"Fecisti nos ad te, et inquietum est cor nostrum, donec requiescat in te" (*Confissões* I, 1) — "Fizeste-nos para Ti, e inquieto está o nosso coração, enquanto não repousa em Ti." Esta frase sintetiza toda a antropologia agostiniana: o coração humano só encontra repouso em Deus.',
          },
          {
            pergunta: 'Em que ano e por qual evento Agostinho se converteu ao catolicismo?',
            opcoes: [
              'Em 354 d.C., ao nascer de mãe cristã, Santa Mônica, que o batizou imediatamente',
              'Em 410 d.C., após o saque de Roma pelos visigodos, que o convenceu da fragilidade do mundo',
              'Em 387 d.C., batizado por Santo Ambrósio em Milão após anos de busca intelectual',
              'Em 395 d.C., ao ser eleito bispo de Hipona contra sua vontade pela comunidade local',
            ],
            correta: 2,
            explicacao: 'Agostinho foi batizado pelo bispo Santo Ambrósio de Milão na Vigília Pascal de 387 d.C., na Páscoa. Seu percurso de conversão — do maniqueísmo ao neoplatonismo ao catolicismo — está narrado em detalhes nas *Confissões* (livros I–IX). Sua mãe, Santa Mônica, acompanhou o processo com orações por décadas.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'São Jerônimo e a Vulgata',
        versiculo: 'Sl 119,105',
        resumo: 'Conheça o maior tradutor da Bíblia e sua busca pela verdade hebraica das Escrituras.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'São Jerônimo (c. 347–420 d.C.) é o maior biblista dos Padres da Igreja Ocidental. Doutor em latim, grego e hebraico, foi encarregado pelo Papa Dâmaso I de revisar a tradução latina da Bíblia. Seu trabalho resultou na *Vulgata* — a tradução latina da Bíblia que se tornaria a versão oficial da Igreja por mais de mil anos e foi canonizada pelo Concílio de Trento (Sess. IV, 1546).',
          },
          {
            tipo: 'versiculo',
            texto: '"A tua palavra é lâmpada para os meus passos e luz no meu caminho." — Sl 119,105',
          },
          {
            tipo: 'destaque',
            texto: 'O princípio orientador de Jerônimo na tradução era a *Hebraica veritas* — a verdade hebraica: traduzir o Antigo Testamento diretamente do original hebraico (e aramaico), e não da Septuaginta (tradução grega do AT). Isso lhe valeu críticas de contemporâneos, incluindo Santo Agostinho, que preferiam a autoridade da Septuaginta usada pelos Apóstolos. Jerônimo estabeleceu os fundamentos da exegese bíblica científica.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Jerônimo viveu anos como eremita no deserto sírio, aprendeu hebraico com um mestre judeu e fundou um mosteiro em Belém (perto do local do nascimento de Cristo), onde passou os últimos 35 anos de sua vida traduzindo e comentando as Escrituras. Seu temperamento polêmico e irascível gerou inúmeras controvérsias epistolares com contemporâneos. É patrono dos tradutores e estudiosos da Bíblia, e seu símbolo iconográfico é um leão — segundo a lenda, tinha domesticado um leão no deserto.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual foi a principal contribuição de São Jerônimo à Igreja?',
            opcoes: [
              'A tradução da Bíblia para o latim (Vulgata), encomendada pelo Papa Dâmaso I',
              'A organização dos primeiros mosteiros cenobíticos no Ocidente cristão',
              'A formulação do dogma da Imaculada Conceição de Maria no século IV',
              'A redação do Credo Apostólico em sua forma atual usada até hoje',
            ],
            correta: 0,
            explicacao: 'Jerônimo, encarregado pelo Papa Dâmaso I (c. 382 d.C.), traduziu e revisou a Bíblia para o latim, produzindo a *Vulgata* (*versio vulgata* = versão comum/popular). Esta tradução foi declarada oficial pela Igreja no Concílio de Trento (1546) e usada por mais de um milênio.',
          },
          {
            pergunta: 'O que significa o princípio "Hebraica veritas" de Jerônimo?',
            opcoes: [
              'A superioridade da tradução grega (Septuaginta) sobre o texto hebraico original',
              'A necessidade de traduzir o AT diretamente do original hebraico e aramaico, não da Septuaginta grega',
              'A verdade que Deus revelou exclusivamente ao povo hebreu no Antigo Testamento',
              'O método de comparar textos hebraicos medievais com as citações dos Padres gregos',
            ],
            correta: 1,
            explicacao: 'A *Hebraica veritas* era o princípio de Jerônimo de buscar a verdade textual nos originais hebraicos (e aramaicos), traduzindo diretamente deles ao invés de usar a Septuaginta — a versão grega do AT usada pelos Apóstolos. Isso causou polêmica com Agostinho, mas fundou a tradição exegética científica da Igreja.',
          },
          {
            pergunta: 'O Concílio de Trento (1546) canonizou a Vulgata porque...',
            opcoes: [
              'Era a tradução mais recente e atualizada da Bíblia disponível no século XVI',
              'Foi a versão aprovada por unanimidade pelos reformadores protestantes de Lutero',
              'Era a tradução latina usada pela Igreja por mais de mil anos, com autoridade de longa tradição',
              'Superava em precisão filológica todas as traduções hebraicas e gregas conhecidas',
            ],
            correta: 2,
            explicacao: 'O Concílio de Trento (Sessão IV, 1546) declarou a Vulgata "autêntica" para uso litúrgico e doutrinal da Igreja latina — não por ser a mais perfeita filologicamente, mas por sua autoridade de séculos de uso ininterrupto, aceitação universal e conformidade com a fé transmitida.',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'O Grande Cisma do Oriente (1054)',
        versiculo: 'Jo 17,21',
        resumo: 'Entenda as causas teológicas e políticas da ruptura entre Roma e Constantinopla.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O Grande Cisma de 1054 foi a ruptura formal entre a Igreja Católica Romana e a Igreja Ortodoxa Oriental. Em 16 de julho de 1054, o cardeal Humberto de Silva Cândida depôs sobre o altar de Santa Sofia de Constantinopla uma bula de excomunhão contra o patriarca Miguel Cerulário, que respondeu excomungando os legados romanos. Tecnicamente, o papa Leão IX já havia morrido durante o processo, tornando a ação juridicamente questionável.',
          },
          {
            tipo: 'versiculo',
            texto: '"Que todos sejam um, como tu, Pai, estás em mim e eu em ti." — Jo 17,21',
          },
          {
            tipo: 'destaque',
            texto: 'As causas do Cisma eram múltiplas e acumuladas por séculos: (1) teológica — a questão do *Filioque* (adição latina ao Credo: o Espírito Santo procede do Pai "e do Filho"); (2) eclesiológica — a reivindicação romana de primazia jurisdicional universal vs. o modelo oriental de pentarquia (cinco patriarcados iguais); (3) litúrgica — rito latino (pão ázimo) vs. rito grego (pão levedado); (4) política — rivalidade entre Roma e Constantinopla como capitais eclesiásticas.',
          },
          {
            tipo: 'curiosidade',
            texto: 'As excomunhões mútuas de 1054 foram formalmente levantadas em 1964 pelo Papa Paulo VI e o Patriarca Atenágoras I de Constantinopla, num gesto histórico de reconciliação. A declaração conjunta de 7 de dezembro de 1965 expressou o "pesar" pelos fatos de 1054 e o desejo de caminhar para a unidade plena. Contudo, a comunhão plena ainda não foi restaurada — as questões teológicas fundamentais (Filioque, primado papal) permanecem em diálogo.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual foi a principal questão teológica que separou Roma e Constantinopla?',
            opcoes: [
              'O Filioque — a adição latina ao Credo afirmando que o Espírito Santo procede do Pai "e do Filho"',
              'A questão do celibato clerical, rejeitada pelos ortodoxos como inovação medieval latina',
              'A definição da Imaculada Conceição de Maria, rejeitada como sem fundamento bíblico',
              'O calendário litúrgico: os gregos seguiam o calendário juliano, os latinos o gregoriano',
            ],
            correta: 0,
            explicacao: 'O *Filioque* (latim: "e do Filho") foi inserido unilateralmente pelo Ocidente no Credo Niceno-Constantinopolitano (originalmente: "o Espírito Santo procede do Pai"). Os orientais rejeitaram tanto a adição teológica quanto o procedimento unilateral como violação da colegialidade conciliar.',
          },
          {
            pergunta: 'Em que ano e por qual gesto ocorreu formalmente o Cisma de 1054?',
            opcoes: [
              'Em 1054, quando o cardeal Humberto depôs uma bula de excomunhão sobre o altar de Santa Sofia',
              'Em 1053, quando o Papa Leão IX escreveu uma carta declarando o patriarca herético',
              'Em 1061, quando o patriarca Miguel Cerulário fechou as igrejas latinas de Constantinopla',
              'Em 1054, quando o Concílio de Constantinopla votou pela ruptura com Roma',
            ],
            correta: 0,
            explicacao: 'Em 16 de julho de 1054, os legados romanos chefiados pelo cardeal Humberto de Silva Cândida depuseram sobre o altar da Basílica de Santa Sofia (Hagia Sophia) uma bula excomungando o patriarca Miguel Cerulário. Este respondeu anatemizando os legados — marcando formalmente o Cisma.',
          },
          {
            pergunta: 'Quando as excomunhões mútuas de 1054 foram formalmente levantadas?',
            opcoes: [
              'Em 1870, durante o Concílio Vaticano I, como gesto de abertura ecuménica',
              'Em 1964, pelo Papa Paulo VI e o Patriarca Atenágoras I, numa declaração conjunta',
              'Em 2016, durante o encontro histórico do Papa Francisco com o Patriarca Cirilo em Cuba',
              'Nunca foram formalmente levantadas — permanecem canonicamente válidas até hoje',
            ],
            correta: 1,
            explicacao: 'Em 1964, Paulo VI e Atenágoras I se encontraram em Jerusalém — o primeiro encontro entre Papa e Patriarca em séculos. Em 7 de dezembro de 1965, publicaram uma declaração conjunta expressando "pesar" pelos eventos de 1054 e levantando as excomunhões mútuas — sem, contudo, restaurar a plena comunhão.',
          },
        ],
        xp: 80,
      },
    ],
  },
  {
    id: 8,
    titulo: 'As Sete Moradas: Módulo 1',
    descricao: 'O Castelo Interior de Santa Teresa d\'Ávila — introdução à vida contemplativa',
    icone: '🏰',
    nivel: 'Avançado',
    totalLicoes: 8,
    xpTotal: 640,
    gratis: false,
    preco: 9.90,
    licoes: [
      {
        id: 1,
        titulo: 'Santa Teresa e o Castelo Interior',
        versiculo: '1Cor 3,16',
        resumo: 'Conheça a vida de Santa Teresa d\'Ávila e a imagem do castelo de diamante que fundamenta sua mística.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Santa Teresa de Ávila (1515–1582), Doutora da Igreja e cofundadora da Reforma Carmelita junto com São João da Cruz, escreveu *O Castelo Interior* (Las Moradas) em 1577, a pedido de seu confessor. O livro descreve a vida interior da alma sob a imagem de um castelo de diamante ou cristal puro — de beleza incomparável — que contém sete moradas (câmaras) por onde a alma avança em direção ao Rei que habita no centro.',
          },
          {
            tipo: 'versiculo',
            texto: '"Não sabeis que sois templo de Deus e que o Espírito de Deus habita em vós?" — 1Cor 3,16',
          },
          {
            tipo: 'destaque',
            texto: 'Teresa explica que a alma em estado de pecado mortal é como um castelo de cristal obscurecido — sua beleza está lá, mas não pode ser contemplada porque a escuridão do pecado impede a luz. A reforma carmelita que ela empreendeu visava restaurar o silêncio, a pobreza e a oração contemplativa às suas primazias, contra o relaxamento dos conventos carmelitas do tempo. Em 1970, Paulo VI a proclamou a primeira Doutora da Igreja entre as mulheres.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Teresa escreveu *O Castelo Interior* em poucos meses, quase sem reler o que escrevera. Ela própria dizia receber as revelações diretamente durante a oração contemplativa. Seu outro grande livro, *Vida* (autobiografia), foi escrito a pedido de seus confessores como prestação de contas de seus estados interiores — prática de discernimento espiritual exigida da época. Teresa foi canonizada em 1622 por Gregório XV junto com São Inácio de Loyola, São Francisco Xavier e São Filipe Néri.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual imagem central usa Santa Teresa para descrever a alma em O Castelo Interior?',
            opcoes: [
              'Um castelo de diamante ou cristal com sete moradas, onde Deus habita no centro',
              'Um jardim florido com sete canteiros irrigados por diferentes formas de oração',
              'Uma escada de sete degraus que conduz do purgatório ao céu',
              'Uma chama de sete cores que representa os dons do Espírito Santo',
            ],
            correta: 0,
            explicacao: 'Teresa descreve a alma como "um castelo todo de diamante ou de cristalino espelho, no qual há muitos aposentos, assim como no céu há muitas moradas" (Las Moradas, I,1,1). O centro é a morada onde Deus mesmo habita, e as sete câmaras representam os estágios da vida espiritual.',
          },
          {
            pergunta: 'Em que ano Teresa foi proclamada Doutora da Igreja e por quem?',
            opcoes: [
              'Em 1622, pelo Papa Gregório XV, junto com São Inácio e São Francisco Xavier',
              'Em 1582, pelo Papa Gregório XIII, no dia de sua morte em Alba de Tormes',
              'Em 1970, pelo Papa Paulo VI, primeira mulher a receber este título na história',
              'Em 1614, pelo Papa Paulo V, ao beatificá-la em cerimônia em Roma',
            ],
            correta: 2,
            explicacao: 'Paulo VI proclamou Santa Teresa de Ávila Doutora da Igreja em 27 de setembro de 1970 — tornando-a a primeira mulher a receber este título, junto com Santa Catarina de Sena. A canonização havia ocorrido em 1622 por Gregório XV.',
          },
          {
            pergunta: 'O que Teresa quis indicar com a imagem da alma em pecado mortal como castelo obscurecido?',
            opcoes: [
              'Que o pecado mortal destrói completamente a alma, que deixa de existir espiritualmente',
              'Que a alma permanece bela e com Deus habitando nela, mas a luz interior fica impedida pelo pecado',
              'Que o pecado afeta apenas as moradas externas, deixando o centro do castelo sempre intacto',
              'Que somente os religiosos consagrados possuem o castelo interior plenamente desenvolvido',
            ],
            correta: 1,
            explicacao: 'Teresa ensina que a alma em pecado mortal é como um castelo de cristal coberto por trevas: "ainda que o mesmo sol que lhe dava tanta claridade e formosura esteja no centro da alma, é como se ele não estivesse ali" (I,2,1). A alma não é destruída pelo pecado, mas sua beleza torna-se invisível.',
          },
        ],
        xp: 80,
      },
      {
        id: 2,
        titulo: 'Primeira Morada: O Autoconhecimento',
        versiculo: 'Sl 139,23',
        resumo: 'A humildade como porta de entrada no castelo e o papel do autoconhecimento na vida espiritual.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'As Primeiras Moradas correspondem ao início da vida espiritual. Nelas, a alma acaba de entrar no castelo — ou seja, começou a orar — mas está ainda muito presa às criaturas e ao mundo exterior. O grande risco é que, embora a alma entre no castelo, volte logo para fora, distraída pelos apelos das criaturas que rodeiam o castelo. É a vida do cristão que começa a orar mas vive sem profundidade.',
          },
          {
            tipo: 'versiculo',
            texto: '"Sonda-me, ó Deus, e conhece o meu coração; examina-me e conhece os meus pensamentos." — Sl 139,23',
          },
          {
            tipo: 'destaque',
            texto: 'Teresa insiste que o autoconhecimento é o fundamento insubstituível de toda a vida espiritual: "Por mais elevada que seja a oração de uma alma, ela não deve abandonar o autoconhecimento" (Las Moradas I,2,9). Mas adverte: o autoconhecimento verdadeiro não é introspecção psicológica, mas é inseparável do conhecimento de Deus — quanto mais vejo a grandeza de Deus, mais percebo minha pequenez.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Teresa usa uma metáfora luminosa: as primeiras moradas são como os aposentos do castelo que ficam perto da entrada, onde entram répteis e animais venenosos — as distrações, os apegos desordenados, a vaidade, o amor-próprio excessivo. São João da Cruz, seu companheiro reformador, descreveria essas mesmas realidades como "apegos" que impedem o avanço espiritual. Os dois doutores carmelitas se complementam: Teresa é mais afetiva e narrativa; João é mais rigoroso e sistemático.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Por que Teresa afirma que o autoconhecimento nunca deve ser abandonado, mesmo nas orações mais elevadas?',
            opcoes: [
              'Porque é o fundamento de toda humildade, e sem ele a alma cai em ilusão espiritual e soberba',
              'Porque é um exercício psicológico necessário para o equilíbrio mental do orante',
              'Porque foi ordenado pelos confessores de Teresa como condição para receber a Comunhão',
              'Porque é o único modo pelo qual o orante consegue memorizar os mistérios do Rosário',
            ],
            correta: 0,
            explicacao: 'Para Teresa, o autoconhecimento — especialmente da própria miséria diante de Deus — gera a humildade que é a base de toda a vida espiritual. Sem ela, mesmo estados contemplativos elevados podem levar à soberba espiritual. Por isso, nas moradas mais altas, o autoconhecimento continua necessário, porém sempre em relação ao conhecimento de Deus.',
          },
          {
            pergunta: 'Quais são os "répteis e animais" que habitam as primeiras moradas no símbolo teresiano?',
            opcoes: [
              'Os demônios que atacam diretamente as almas em estado de pecado mortal grave',
              'As distrações, apegos desordenados, vaidades e o amor-próprio excessivo que perturbam a oração',
              'Os pecados capitais que impedem completamente a entrada no castelo interior',
              'Os hereges e inimigos externos da Igreja que perseguem os contemplativos',
            ],
            correta: 1,
            explicacao: 'Os "répteis" que entram pelas primeiras moradas são, na linguagem simbólica de Teresa, os apegos às criaturas, às vaidades mundanas, ao julgamento dos outros e ao amor-próprio desordenado. Não são pecados mortais, mas impedem o avanço para as moradas interiores onde a oração se aprofunda.',
          },
          {
            pergunta: 'Como Teresa descreve a relação entre autoconhecimento e conhecimento de Deus?',
            opcoes: [
              'São dois caminhos paralelos e independentes que a alma deve trilhar separadamente',
              'O autoconhecimento deve preceder o conhecimento de Deus nos estágios iniciais',
              'São inseparáveis: quanto mais a alma conhece a grandeza de Deus, mais percebe sua própria pequenez',
              'O conhecimento de Deus torna o autoconhecimento desnecessário nas moradas superiores',
            ],
            correta: 2,
            explicacao: 'Teresa ensina que não é possível conhecer-se verdadeiramente sem se elevar a contemplar a grandeza de Deus — e vice-versa. As almas que vivem sempre olhando para sua própria miséria, sem elevar o olhar a Deus, tendem ao desânimo e à pusilanimidade. O verdadeiro autoconhecimento gera humildade, não depressão.',
          },
        ],
        xp: 80,
      },
      {
        id: 3,
        titulo: 'Segunda Morada: A Perseverança na Oração',
        versiculo: 'Lc 18,1',
        resumo: 'A batalha espiritual das segundas moradas e por que nunca se deve abandonar a oração.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'As Segundas Moradas representam a alma que já ouve mais claramente o chamado de Deus — através de bons livros, sermões, sofrimentos, amizades virtuosas — mas sente fortíssimas tentações para abandonar a oração e voltar para os apegos mundanos. É o estágio do cristão que quer ser fiel, mas oscila. Teresa descreve esta morada como "mais trabalhosa" que as primeiras porque a alma já vê o que perde ao voltar atrás.',
          },
          {
            tipo: 'versiculo',
            texto: '"Jesus lhes contou uma parábola para mostrar que é preciso orar sempre e não desanimar." — Lc 18,1',
          },
          {
            tipo: 'destaque',
            texto: 'O conselho fundamental de Teresa para as segundas moradas é a perseverança: "Não desistir da oração é o que mais importa" (Las Moradas II,1). O demônio ataca com muita força exatamente nesta fase, pois sabe que se a alma perseverar na oração, eventualmente vencerá os apegos. Teresa cita São Pedro: "o demônio, como leão, anda rondando, procurando alguém para devorar" — e seu alvo preferencial são os que tentam avançar na vida de oração.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Teresa não hesitou em ser autobiográfica: ela mesma ficou quase dezoito anos nas segundas moradas, oscilando entre a oração e os afetos mundanos, sofrendo o que chamou de "vida de tormento". Diz que entrava no oratório e ficava olhando para o relógio esperando passar a hora de oração. Sua honestidade sobre as dificuldades da vida de oração torna *O Castelo Interior* acessível e humano. São João da Cruz chamaria este período de "noite dos sentidos".',
          },
        ],
        perguntas: [
          {
            pergunta: 'Por que Teresa considera as Segundas Moradas "mais trabalhosas" que as Primeiras?',
            opcoes: [
              'Porque a alma já não tem força para orar e entra num estado de aridez total e permanente',
              'Porque a alma já vê o que perde ao abandonar a oração, mas ainda sente o chamado das criaturas',
              'Porque os demônios são mais numerosos e violentos nesta morada que nas anteriores',
              'Porque o confessor exige mais penitências externas desta alma que avança na vida espiritual',
            ],
            correta: 0,
            explicacao: 'Nas segundas moradas, a alma já ouve mais claramente a voz de Deus — e por isso sofre mais ao tentar ignorá-la. A consciência da tensão entre o chamado divino e os apegos mundanos gera sofrimento maior que a ignorância das primeiras moradas. É o período mais duro de transição.',
          },
          {
            pergunta: 'Qual o conselho central de Teresa para a alma nas Segundas Moradas?',
            opcoes: [
              'Aumentar as penitências corporais para dominar as paixões que perturbam a oração',
              'Buscar diretores espirituais experientes que orientem cada passo com rigor doutrinal',
              'Nunca abandonar a oração, perseverando mesmo nos momentos de aridez e tentação',
              'Retirar-se do mundo para o mosteiro, pois o ambiente secular impede o progresso espiritual',
            ],
            correta: 2,
            explicacao: 'O conselho central de Teresa — repetido ao longo de toda a obra — é nunca abandonar a oração: "não desistir da oração é o que mais importa neste estágio" (Las Moradas II,1). A perseverança vence todas as tentações; o abandono da oração é o maior perigo espiritual.',
          },
          {
            pergunta: 'Por quanto tempo Teresa de Ávila permaneceu oscilando nas "segundas moradas" segundo ela mesma?',
            opcoes: [
              'Por sete anos, desde sua entrada no Carmelo até a primeira experiência mística',
              'Por quase dezoito anos, oscilando entre a oração fiel e os afetos às criaturas',
              'Por apenas alguns meses, antes de receber uma graça especial de conversão profunda',
              'Por três anos, que correspondem ao período de seu noviciado no Convento da Encarnação',
            ],
            correta: 1,
            explicacao: 'Teresa narra em sua *Vida* (autobiografia) que passou cerca de dezoito anos em sofrimento espiritual, entrando no oratório por obrigação e olhando para o relógio. Esta confissão pública de suas dificuldades é um dos aspectos mais valiosos de seu ensinamento: o progresso espiritual é lento e doloroso, mas possível com a graça de Deus.',
          },
        ],
        xp: 80,
      },
      {
        id: 4,
        titulo: 'Terceira Morada: A Vida Ordenada',
        versiculo: 'Ap 3,15',
        resumo: 'O perigo da tibieza e do formalismo na vida de quem ora regularmente mas sem ardor.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'As Terceiras Moradas descrevem almas que já alcançaram uma vida de virtude ordenada e regular: rezam, praticam penitência, evitam os pecados mortais, são caridosas com os pobres. São pessoas boas, respeitadas na comunidade. Contudo, Teresa aponta um perigo sutil neste estágio: a acomodação, o formalismo, a dependência dos consolos espirituais e uma certa auto-satisfação que impede o avanço.',
          },
          {
            tipo: 'versiculo',
            texto: '"Conheço as tuas obras: não és frio nem quente. Quem dera fosses frio ou quente!" — Ap 3,15',
          },
          {
            tipo: 'destaque',
            texto: 'Teresa cita (Las Moradas III,2) o jovem rico do Evangelho (Mc 10,17-22) como protótipo das almas das terceiras moradas: virtuoso, observador da lei, mas incapaz de dar o passo decisivo pedido por Jesus. A aridez espiritual — quando os consolos de Deus secam e a oração torna-se árida e sem sabor — é vista por Teresa não como punição, mas como convite de Deus a amar desinteressadamente, além dos consolos.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A "tibieza" das terceiras moradas não é pecado grave — estas almas não pecam mortalmente. O problema é que estão presas a uma mediocridade confortável, dependentes dos "consolos" espirituais (sensação agradável na oração) e perturbadas quando estes desaparecem. São João da Cruz chamou esta transição de "noite dos sentidos" — Deus retira os consolos sensíveis para purificar o amor, tornando-o mais espiritual e desinteressado. É fase dolorosa, mas necessária ao crescimento.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual é o perigo principal das almas nas Terceiras Moradas segundo Teresa?',
            opcoes: [
              'A auto-satisfação e dependência dos consolos espirituais que impedem o avanço no amor',
              'O excesso de penitências que destroem a saúde e a capacidade de oração',
              'A tentação de abandonar a vida religiosa pela vida secular mais confortável',
              'A soberba intelectual gerada pelo estudo excessivo da teologia escolástica',
            ],
            correta: 0,
            explicacao: 'As almas das terceiras moradas são boas e virtuosas, mas Teresa identifica o perigo da auto-satisfação — um certo contentamento com a própria bondade — e da dependência dos consolos espirituais. Quando estes secam (aridez), estas almas ficam perturbadas, revelando que ainda não amam a Deus de modo totalmente desinteressado.',
          },
          {
            pergunta: 'Qual personagem evangélico Teresa cita como protótipo da alma nas terceiras moradas?',
            opcoes: [
              'Zaqueu, o publicano que subiu à árvore para ver Jesus mas hesitou em recebê-lo em casa',
              'Pedro, que jurou fidelidade a Jesus mas o negou três vezes por fraqueza humana',
              'O jovem rico que guardava todos os mandamentos mas não conseguiu seguir Jesus ao dar tudo',
              'Marta, que servia a Jesus com dedicação mas estava inquieta com muitas coisas',
            ],
            correta: 2,
            explicacao: 'Teresa cita o jovem rico (Mc 10,17-22; Las Moradas III,2) como imagem das almas das terceiras moradas: observava os mandamentos, era virtuoso, mas ao ser convidado a dar o passo decisivo (vender tudo e seguir), "ficou triste e se foi". A tristeza da aridez é semelhante — a alma boa hesita diante do amor total.',
          },
          {
            pergunta: 'O que Teresa ensina sobre a aridez espiritual (ausência de consolos) nas terceiras moradas?',
            opcoes: [
              'É sinal de que a alma pecou gravemente e deve fazer penitências para recuperar os consolos',
              'É um convite de Deus a amar desinteressadamente, além dos sentimentos agradáveis na oração',
              'Indica que a alma não está em estado de graça e deve confessar-se imediatamente',
              'Significa que a alma atingiu o limite do crescimento espiritual possível em sua vocação',
            ],
            correta: 1,
            explicacao: 'Para Teresa, a aridez não é punição mas pedagogia divina: Deus retira os consolos sensíveis para purificar o amor da alma. Quando os consolos desaparecem e a alma continua fiel à oração, está aprendendo a amar a Deus por Ele mesmo — não pelo prazer que Ele dá. Este é um passo essencial para avançar às moradas superiores.',
          },
        ],
        xp: 80,
      },
      {
        id: 5,
        titulo: 'Quarta Morada: Oração de Recolhimento',
        versiculo: 'Sl 18,36',
        resumo: 'A transição para a contemplação: diferença entre consolações humanas e gozos divinos.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'As Quartas Moradas marcam a grande fronteira do *Castelo Interior*: é aqui que começa a oração infusa — aquela que vem primariamente de Deus, não do esforço humano. Nas moradas anteriores, a alma trabalhava ativamente; aqui começa a receber passivamente. Teresa distingue com precisão: *consolações* (que vêm dos sentidos e do esforço humano, como chorar em uma pregação) de *gozos* (que vêm de Deus e se expandem do interior para o exterior).',
          },
          {
            tipo: 'versiculo',
            texto: '"Dilataste os meus passos sob mim, e os meus pés não vacilaram." — Sl 18,36',
          },
          {
            tipo: 'destaque',
            texto: 'Teresa usa duas imagens geniais (Las Moradas IV,2): para as consolações, a água que vem de longe por canos — com barulho e esforço; para os gozos, a água que brota diretamente da fonte, silenciosamente, enchendo o poço de dentro para fora. Esta distinção é decisiva: os gozos são dom de Deus, não produto do esforço, e trazem uma paz e expansão do coração que as consolações não alcançam.',
          },
          {
            tipo: 'curiosidade',
            texto: 'São João da Cruz, o grande amigo e colaborador de Teresa, descreve o mesmo fenômeno em linguagem mais abstrata e filosófica. Para João, nas quartas moradas inicia-se a "contemplação infusa" — um conhecimento amoroso e obscuro de Deus que não passa pelos sentidos nem pelo raciocínio discursivo. A alma "recebe" mais do que "age". Esta é a razão pela qual a *lectio divina*, a meditação vocal e as orações vocais perdem gradualmente eficácia: a alma foi chamada a uma relação mais direta com Deus.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual é a grande diferença entre "consolações" e "gozos" segundo Teresa nas quartas moradas?',
            opcoes: [
              'Consolações vêm do esforço humano e dos sentidos; gozos vêm de Deus e se expandem do interior para o exterior',
              'Consolações são concedidas apenas aos santos canonizados; gozos estão ao alcance de todos os fiéis',
              'Consolações são superiores porque exigem cooperação da vontade; gozos são inferiores por serem passivos',
              'Consolações pertencem à oração vocal; gozos são exclusivos da oração litúrgica sacramental',
            ],
            correta: 0,
            explicacao: 'Teresa distingue: *consolações* são frutos da meditação ativa, da pregação, da leitura devota — vêm dos sentidos e do esforço humano, são boas mas limitadas. *Gozos* (*gustos*) vêm diretamente de Deus, brotam do centro da alma e se expandem para os sentidos — trazem uma paz e "dilatação do coração" que o esforço humano não pode produzir (Las Moradas IV,1-2).',
          },
          {
            pergunta: 'Quais são as duas imagens da água que Teresa usa para explicar consolações e gozos?',
            opcoes: [
              'O rio que flui sempre e o lago que transborda apenas em certas estações do ano',
              'A chuva que cai de cima e o orvalho que ascende da terra pela manhã',
              'A água vinda de longe por canos com barulho (consolações) e a que brota silenciosamente da fonte (gozos)',
              'O mar profundo que representa Deus e as ondas que chegam à praia representando as graças',
            ],
            correta: 2,
            explicacao: 'Em Las Moradas IV,2, Teresa usa a metáfora de dois tanques: um que se enche de água vinda de longe por canos (consolações — com barulho e esforço); outro que tem a fonte dentro de si e se enche silenciosamente e em abundância (gozos — dom de Deus). A segunda imagem representa a oração de quietude e a contemplação infusa.',
          },
          {
            pergunta: 'O que marca a fronteira entre as primeiras e as quartas moradas no sistema teresiano?',
            opcoes: [
              'A recepção do sacramento da Confirmação com plena consciência e compromisso espiritual',
              'A passagem da oração ativa (esforço humano) para a oração infusa (dom passivo de Deus)',
              'A decisão de entrar para a vida religiosa consagrada num convento ou mosteiro',
              'A obtenção da indulgência plenária após uma peregrinação a Roma ou Santiago de Compostela',
            ],
            correta: 1,
            explicacao: 'A fronteira entre as terceiras e quartas moradas marca a passagem da oração *adquirida* (fruto do esforço humano) para a oração *infusa* (dom de Deus que vem de dentro). A alma deixa de ser predominantemente ativa para tornar-se predominantemente receptiva — começa a verdadeira contemplação.',
          },
        ],
        xp: 80,
      },
      {
        id: 6,
        titulo: 'Quarta Morada: A Oração de Quietude',
        versiculo: 'Sl 46,11',
        resumo: 'Aprofundamento na oração de quietude — como recebê-la e como não perturbá-la.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'A Oração de Quietude é o primeiro grau de oração infusa descrito por Teresa. Nela, a vontade da alma é "unida" a Deus numa paz profunda e doce — enquanto as demais faculdades (memória, inteligência) ainda se dispersam. É como se uma parte da alma estivesse completamente em repouso em Deus, enquanto outra parte ainda trabalha. A alma experimenta uma expansão interior que a linguagem humana dificilmente exprime.',
          },
          {
            tipo: 'versiculo',
            texto: '"Sossegai e sabei que eu sou Deus." — Sl 46,11',
          },
          {
            tipo: 'destaque',
            texto: 'O maior erro que uma alma pode cometer na oração de quietude é tentar "ajudar" Deus — isto é, forçar a mente a pensar em coisas piedosas, fazer raciocínios teológicos ou rezar orações vocais com esforço. Isso perturbará a quietude e a alma perderá o dom que está recebendo. Teresa ensina: quando Deus chega, a alma deve "recolher-se suavemente como quem não quer fazer barulho" (Las Moradas IV,3), deixando-se guiar sem resistir nem forçar.',
          },
          {
            tipo: 'curiosidade',
            texto: 'A oração de quietude corresponde, na linguagem de São João da Cruz, ao início da "contemplação infusa obscura" — aquele conhecimento amoroso de Deus que não passa pelo raciocínio discursivo. João a descreve como "uma luz amorosa e pacífica" que habita na alma sem forma nem imagem determinada. A tradição hesicasta oriental (de *hēsychia* = silêncio/repouso), com a Oração de Jesus ("Senhor Jesus Cristo, Filho de Deus, tende misericórdia de mim, pecador"), descreve experiência análoga — a oração do coração que conduz ao repouso em Deus.',
          },
        ],
        perguntas: [
          {
            pergunta: 'O que caracteriza a Oração de Quietude segundo Teresa?',
            opcoes: [
              'A vontade da alma repousa unida a Deus em paz profunda, enquanto as demais faculdades ainda se dispersam',
              'Todas as faculdades da alma param completamente de funcionar num estado de êxtase total',
              'A alma experimenta visões e locuções divinas com imagens claras e palavras audíveis',
              'É uma oração de grupo que exige silêncio exterior absoluto em comunidade por horas seguidas',
            ],
            correta: 0,
            explicacao: 'Na oração de quietude, a *vontade* é como que "cativa" por Deus em repouso amoroso, enquanto a inteligência e a memória continuam se dispersando. Teresa diz que a alma experimenta uma "expansão do coração" e uma paz que nem sabe explicar. É um grau de contemplação infusa acessível a almas que perseveraram na oração.',
          },
          {
            pergunta: 'Qual é o maior erro a evitar durante a oração de quietude?',
            opcoes: [
              'Permanecer em silêncio absoluto sem usar nenhuma forma de oração vocal',
              'Forçar a mente a pensar ou rezar com esforço, perturbando o repouso dado por Deus',
              'Não comunicar ao confessor as graças recebidas, correndo risco de ilusão espiritual',
              'Abandonar as devoções tradicionais como o Rosário e a Missa em favor da contemplação',
            ],
            correta: 1,
            explicacao: 'Teresa adverte: quando Deus concede a quietude, a alma não deve tentar "ajudar" com esforço mental — rezar forçadamente, fazer raciocínios ou provocar consolos artificialmente. Isso destrói o dom. A alma deve recolher-se "como quem não quer fazer barulho" e deixar-se conduzir suavemente (Las Moradas IV,3).',
          },
          {
            pergunta: 'Como a tradição hesicasta oriental descreve uma experiência análoga à oração de quietude teresiana?',
            opcoes: [
              'Como a "teologia apofática" — o conhecimento de Deus pelo que Ele não é, desenvolvida por Dionísio Areopagita',
              'Como a "oração do coração" ou Oração de Jesus — prática contemplativa que conduz ao repouso em Deus',
              'Como a "oração de adoração" — prática comunitária de prostração diante do Santíssimo Sacramento',
              'Como a "lectio divina" — a leitura meditativa e orante das Escrituras em ritmo lento e pausado',
            ],
            correta: 1,
            explicacao: 'A tradição hesicasta oriental (*hēsychia* = repouso/silêncio), especialmente a Oração de Jesus ("Senhor Jesus Cristo, Filho de Deus, tende misericórdia de mim, pecador"), aponta para uma experiência análoga de oração do coração que conduz ao repouso contemplativo em Deus. Embora culturalmente diferente, converge com o ensinamento teresiano sobre a quietude.',
          },
        ],
        xp: 80,
      },
      {
        id: 7,
        titulo: 'O Discernimento dos Espíritos',
        versiculo: '1Jo 4,1',
        resumo: 'Como Teresa ensina a discernir as graças verdadeiras das ilusões espirituais.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'O discernimento espiritual é um tema central em Teresa, especialmente porque ela mesma foi sujeita a longos processos de verificação por seus confessores. A vida mística está exposta a três fontes de "espíritos": Deus (fonte das graças autênticas), o demônio (que imita graças para enganar) e a própria imaginação humana (que produz ilusões). Teresa desenvolveu critérios concretos para distinguir as três fontes.',
          },
          {
            tipo: 'versiculo',
            texto: '"Caríssimos, não acrediteis em todo espírito; mas provai os espíritos se são de Deus." — 1Jo 4,1',
          },
          {
            tipo: 'destaque',
            texto: 'Os critérios de Teresa para discernir as graças verdadeiras são (Las Moradas I,2,7): (1) *conformidade com a doutrina da Igreja* — graças que levam a desobedecer ao Magistério são suspeitas; (2) *frutos duradouros* — humildade, caridade, paz, desapego crescente das criaturas; (3) *obediência ao confessor* — a alma que desobedece ao diretor espiritual em matéria de oração deve desconfiar da origem das graças; (4) *ausência de perturbação após a graça* — a graça divina deixa paz, a diabólica deixa inquietação.',
          },
          {
            tipo: 'curiosidade',
            texto: 'Teresa foi examinada por inquisidores e teólogos várias vezes. Seu primeiro biógrafo e confessor, o Padre Francisco de Ribera SJ, documentou os processos de discernimento. O inquisidor Francisco de Soto y Salazar examinou seus escritos e os aprovou. O Padre Pedro Ibáñez OP escreveu um parecer favorável. Este processo rigoroso de verificação externa foi valorizado por Teresa, que via na obediência ao confessor sábio uma proteção contra o engano do demônio.',
          },
        ],
        perguntas: [
          {
            pergunta: 'Quais são as três fontes possíveis de "espíritos" que podem produzir fenômenos espirituais segundo Teresa?',
            opcoes: [
              'Deus, o demônio e a própria imaginação humana',
              'Os anjos, os demônios e as almas do Purgatório',
              'A graça atual, a graça habitual e a graça sacramental',
              'A vontade, a inteligência e a memória como faculdades da alma',
            ],
            correta: 0,
            explicacao: 'Teresa identifica três origens possíveis dos fenômenos espirituais: Deus (graças autênticas), o demônio (que imita graças para enganar e desviar a alma) e a própria imaginação humana (que pode produzir ilusões pias sem origem sobrenatural). O discernimento exige examinar os frutos e a conformidade com a doutrina da Igreja.',
          },
          {
            pergunta: 'Qual é o critério principal de discernimento das graças segundo Teresa?',
            opcoes: [
              'A intensidade da experiência mística — quanto mais intensa, mais certamente vem de Deus',
              'O parecer de outros místicos contemplativos com experiência de graus elevados de oração',
              'Os frutos duradouros: humildade, caridade, paz e desapego crescente das criaturas',
              'A ausência de qualquer elemento sensível, pois Deus nunca age pelos sentidos corporais',
            ],
            correta: 2,
            explicacao: 'Para Teresa, o critério mais seguro são os *frutos* produzidos pela graça: "a árvore conhece-se pelos seus frutos" (Mt 7,16). A graça divina produz humildade crescente, amor a Deus e ao próximo, paz duradoura e desapego das criaturas. O demônio pode imitar consolos, mas não pode produzir humildade verdadeira por muito tempo.',
          },
          {
            pergunta: 'Por que Teresa valoriza tanto a obediência ao confessor no processo de discernimento?',
            opcoes: [
              'Porque o confessor tem poderes sobrenaturais especiais que lhe permitem ler a alma diretamente',
              'Porque a alma que desobedece ao diretor espiritual sábio perde a proteção contra as ilusões do demônio',
              'Porque os confessores são infalíveis em matéria de discernimento espiritual por sua ordenação',
              'Porque Teresa foi obrigada pelos inquisidores a incluir este critério em seus escritos',
            ],
            correta: 1,
            explicacao: 'Teresa vê na obediência ao confessor sábio uma das proteções mais seguras contra o engano espiritual: o demônio dificilmente consegue manter uma ilusão quando a alma é transparente e obediente ao diretor. A desobediência ao confessor em matérias espirituais é, para Teresa, sinal forte de que a graça pode não ser de Deus.',
          },
        ],
        xp: 80,
      },
      {
        id: 8,
        titulo: 'Preparação para as Moradas Superiores',
        versiculo: 'Jo 13,35',
        resumo: 'Humildade, obediência e amor fraterno como critérios de crescimento espiritual rumo às moradas superiores.',
        conteudo: [
          {
            tipo: 'texto',
            texto: 'Antes de descrever as moradas superiores (quinta a sétima — as mais elevadas), Teresa faz uma pausa para insistir nas disposições que habilitam a alma a receber as graças mais altas: humildade, desapego, obediência e amor ao próximo. Ela é taxativa: sem estas disposições fundamentais, qualquer experiência mística elevada é suspeita ou perigosa. As experiências místicas não substituem as virtudes — as pressupõem.',
          },
          {
            tipo: 'versiculo',
            texto: '"Nisto todos reconhecerão que sois meus discípulos: se tiverdes amor uns aos outros." — Jo 13,35',
          },
          {
            tipo: 'destaque',
            texto: 'O critério do amor fraterno é fundamental em Teresa: ela insiste que a alma que recebe graças místicas elevadas mas não ama concretamente o próximo — não serve aos irmãos, não é paciente com os defeitos alheios, não perdoa — está em ilusão espiritual. A contemplação autêntica sempre gera um amor mais efetivo. Em suas palavras: "O Senhor não nos pede muita ciência, mas que o amemos; e que nos amemos uns aos outros" (Las Moradas V,3).',
          },
          {
            tipo: 'curiosidade',
            texto: 'Santa Teresa morreu em 4 de outubro de 1582 — exatamente na noite em que o calendário gregoriano entrou em vigor, fazendo com que o dia seguinte fosse 15 de outubro em vez de 5. Por isso, sua festa litúrgica é celebrada em 15 de outubro — o dia que "deveria" ter sido o dia seguinte ao de sua morte. Teresa morreu dizendo: "Ao fim sou filha da Igreja." São João da Cruz, que a visitou em seus últimos meses, escreveu após a morte dela que havia perdido "a metade da minha alma".',
          },
        ],
        perguntas: [
          {
            pergunta: 'Qual disposição Teresa destaca como critério mais seguro de autenticidade espiritual antes das moradas superiores?',
            opcoes: [
              'A frequência de experiências místicas extraordinárias como êxtases e visões',
              'O amor concreto e efetivo ao próximo — sem o qual qualquer mística é suspeita',
              'O número de horas diárias dedicadas à oração mental e contemplativa',
              'A austeridade das penitências corporais praticadas como sinal de mortificação',
            ],
            correta: 0,
            explicacao: 'Para Teresa, o amor fraterno concreto é o critério mais seguro: "Nisto conhecerão que sois meus discípulos" (Jo 13,35). Graças místicas elevadas sem amor real ao próximo são suspeitas de ilusão. A contemplação autêntica sempre produz mais caridade efetiva — não apenas sentimentos piedosos, mas serviço real e paciência com os irmãos.',
          },
          {
            pergunta: 'Por que Teresa insiste que as experiências místicas não substituem as virtudes fundamentais?',
            opcoes: [
              'Porque as virtudes são merecedoras de recompensa, enquanto as graças místicas são dons gratuitos',
              'Porque as graças mais altas pressupõem humildade, desapego e obediência — sem elas, são perigosas',
              'Porque as virtudes morais são superiores às graças místicas na hierarquia da vida espiritual',
              'Porque as graças místicas são exclusivas de religiosos consagrados que já praticam as virtudes há anos',
            ],
            correta: 1,
            explicacao: 'Teresa adverte que graças místicas concedidas a almas sem humildade, desapego e obediência são perigosas: a alma pode se ensoberbecer, comparar-se a outros e cair em ilusões do demônio. As graças elevadas *pressupõem* as virtudes fundamentais — não as substituem. Por isso Teresa insiste na preparação antes de descrever as moradas superiores.',
          },
          {
            pergunta: 'Quais são as palavras finais que Teresa disse antes de morrer, segundo as tradições biográficas?',
            opcoes: [
              '"Finalmente, Senhor, os olhos vos vejo" — contemplando uma visão de Cristo Ressuscitado',
              '"Ao fim sou filha da Igreja" — expressão de sua profunda fidelidade eclesial até o fim',
              '"São João, prepare-se, em breve nos encontraremos no céu" — mensagem ao seu colaborador',
              '"Não temas, pequeno rebanho" — exortação às carmelitas reunidas em torno de seu leito',
            ],
            correta: 1,
            explicacao: '"Ao fim sou filha da Igreja" (*Al fin, soy hija de la Iglesia*) são as últimas palavras atribuídas a Teresa de Ávila, morta em 4 de outubro de 1582. Expressam perfeitamente o espírito de todo o seu ensinamento: a mística autêntica não afasta da Igreja — a une mais profundamente a ela.',
          },
        ],
        xp: 80,
      },
    ],
  },
];
