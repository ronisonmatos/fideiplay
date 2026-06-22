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
              'Fé, Esperança e Caridade',
              'Prudência, Justiça e Fortaleza',
              'Humildade, Obediência e Pobreza',
              'Oração, Jejum e Esmola',
            ],
            correta: 0,
            explicacao: 'As três virtudes teologais são Fé, Esperança e Caridade. São chamadas "teologais" por terem Deus como objeto direto, e são distintas das virtudes cardeais (prudência, justiça, fortaleza, temperança).',
          },
          {
            pergunta: 'A fé é chamada de virtude teologal porque...',
            opcoes: [
              'É infundida por Deus diretamente na alma',
              'Foi inventada pelos teólogos medievais',
              'Depende apenas do esforço humano',
              'É praticada somente em contextos religiosos',
            ],
            correta: 0,
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
              'Pai, Filho e Espírito Santo',
              'Deus, Jesus e Maria',
              'Criador, Redentor e Santificador como três deuses',
              'Pai, Maria e Jesus',
            ],
            correta: 0,
            explicacao: 'A Santíssima Trindade é um único Deus em três Pessoas distintas: Pai, Filho (Jesus Cristo) e Espírito Santo. É o mistério central do cristianismo.',
          },
          {
            pergunta: 'Qual atributo descreve Deus como presente em todos os lugares?',
            opcoes: [
              'Onipresença',
              'Onipotência',
              'Onisciência',
              'Imutabilidade',
            ],
            correta: 0,
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
              'Duas naturezas: humana e divina',
              'Apenas natureza divina',
              'Apenas natureza humana',
              'Uma natureza mista, nem humana nem divina',
            ],
            correta: 0,
            explicacao: 'O Concílio de Calcedônia (451) definiu que Cristo tem duas naturezas — humana e divina — unidas em uma só Pessoa, sem mistura nem separação.',
          },
          {
            pergunta: 'A missão principal de Jesus foi...',
            opcoes: [
              'Salvar a humanidade do pecado e da morte',
              'Reformar o judaísmo do seu tempo',
              'Ensinar apenas boas condutas morais',
              'Estabelecer um reino político em Israel',
            ],
            correta: 0,
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
              'Sete',
              'Três',
              'Doze',
              'Cinco',
            ],
            correta: 0,
            explicacao: 'O Espírito Santo confere 7 dons: Sabedoria, Entendimento, Conselho, Fortaleza, Ciência, Piedade e Temor de Deus, baseados em Isaías 11,2-3.',
          },
          {
            pergunta: 'O Espírito Santo é representado simbolicamente por...',
            opcoes: [
              'Pomba e línguas de fogo',
              'Cordeiro e espada',
              'Leão e águia',
              'Peixe e ancora',
            ],
            correta: 0,
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
              'Sinal eficaz da graça instituído por Cristo',
              'Um ritual criado pela Igreja na Idade Média',
              'Um símbolo sem efeito real na alma',
              'Uma prática opcional para os católicos',
            ],
            correta: 0,
            explicacao: 'Sacramento é um sinal eficaz da graça, ou seja, não é apenas símbolo — ele realmente comunica a graça divina. Foi instituído por Jesus Cristo e confiado à Igreja.',
          },
          {
            pergunta: 'Quais sacramentos imprimem caráter permanente na alma?',
            opcoes: [
              'Batismo, Crisma e Ordem',
              'Eucaristia, Penitência e Matrimônio',
              'Batismo, Eucaristia e Matrimônio',
              'Todos os sete sacramentos',
            ],
            correta: 0,
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
              'Da água e do Espírito',
              'De novo da mãe',
              'Por obras e méritos',
              'Pelo estudo das Escrituras',
            ],
            correta: 0,
            explicacao: 'Em Jo 3,5, Jesus explica que é preciso nascer da água (Batismo) e do Espírito (Santo) para entrar no Reino de Deus — referência clara ao sacramento do Batismo.',
          },
          {
            pergunta: 'Qual é o papel dos padrinhos no Batismo?',
            opcoes: [
              'Testemunhar a fé e apoiar a formação cristã do batizado',
              'Apenas assinar o registro na paróquia',
              'Substituir os pais em caso de morte',
              'Garantir presentes ao batizando',
            ],
            correta: 0,
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
              'Toda a vida da Igreja converge para ela e dela emana',
              'É o sacramento mais fácil de receber',
              'Foi o primeiro sacramento instituído por Cristo',
              'É celebrada todos os dias da semana',
            ],
            correta: 0,
            explicacao: 'O Concílio Vaticano II ensina que a Eucaristia é "fonte e ápice" da vida cristã — todo o agir da Igreja aponta para ela e dela recebe força.',
          },
          {
            pergunta: 'O jejum eucarístico deve ser de pelo menos...',
            opcoes: [
              '1 hora antes da comunhão',
              '3 horas antes da comunhão',
              '12 horas antes da comunhão',
              'Apenas uns minutos antes',
            ],
            correta: 0,
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
              'Os dons do Espírito Santo em plenitude',
              'O perdão de todos os pecados',
              'A ordenação ao diaconato',
              'A permissão para receber a Eucaristia',
            ],
            correta: 0,
            explicacao: 'A Crisma confere os 7 dons do Espírito Santo — Sabedoria, Entendimento, Conselho, Fortaleza, Ciência, Piedade e Temor de Deus — capacitando o cristão para testemunhar a fé.',
          },
          {
            pergunta: 'O ministro ordinário da Crisma é...',
            opcoes: [
              'O bispo',
              'O pároco',
              'O diácono',
              'O catequista',
            ],
            correta: 0,
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
              'Última Ceia',
              'Transfiguração',
              'Multiplicação dos pães',
              'Ressurreição',
            ],
            correta: 0,
            explicacao: 'Jesus instituiu a Eucaristia na noite da Última Ceia, véspera de sua Paixão, quando tomou o pão e o vinho e os transformou em seu Corpo e Sangue.',
          },
          {
            pergunta: 'O nome "Missa" vem do latim e significa...',
            opcoes: [
              'Envio',
              'Sacrifício',
              'Oração',
              'Reunião',
            ],
            correta: 0,
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
              'Louvar a Deus Pai, Filho e Espírito Santo',
              'Pedir perdão pelos pecados',
              'Professar a fé cristã',
              'Interceder pelos defuntos',
            ],
            correta: 0,
            explicacao: 'O Glória é um hino de louvor trinitário — dirige-se ao Pai, ao Filho Jesus Cristo e menciona o Espírito Santo. É cantado nos domingos e festas fora da Quaresma e Advento.',
          },
          {
            pergunta: 'A oração da coleta encerra os Ritos Iniciais e é proferida por...',
            opcoes: [
              'O sacerdote celebrante',
              'Um leitor escolhido',
              'Toda a assembleia em uníssono',
              'O diácono',
            ],
            correta: 0,
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
              'A 1ª e a 2ª leitura',
              'A 2ª leitura e o Evangelho',
              'A Homilia e o Credo',
              'O Evangelho e a Homilia',
            ],
            correta: 0,
            explicacao: 'O Salmo Responsorial ocorre entre a 1ª e a 2ª leitura, servindo como meditação e resposta à Palavra proclamada na primeira leitura.',
          },
          {
            pergunta: 'A Homilia deve ser feita por...',
            opcoes: [
              'O sacerdote ou diácono',
              'Qualquer fiel preparado',
              'O leitor do Evangelho',
              'O cantor da missa',
            ],
            correta: 0,
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
              'Deus Pai, Filho e Espírito Santo, e na Igreja',
              'Apenas em Jesus Cristo como Salvador',
              'Maria e os santos como mediadores',
              'A Bíblia como única autoridade',
            ],
            correta: 0,
            explicacao: 'O Credo Niceno-Constantinopolitano professa a fé nas três Pessoas da Trindade e na Igreja una, santa, católica e apostólica, além do Batismo, ressurreição e vida eterna.',
          },
          {
            pergunta: 'Por que nos inclinamos ao dizer "e se fez homem"?',
            opcoes: [
              'Em adoração ao mistério da Encarnação',
              'Por ser uma norma arbitrária da liturgia',
              'Para pedir bênção ao sacerdote',
              'Em memória dos mártires',
            ],
            correta: 0,
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
              'O pão e o vinho se tornam o Corpo e Sangue de Cristo',
              'O sacerdote abençoa os fiéis',
              'A assembleia recebe a Comunhão',
              'São lidas as intenções da Missa',
            ],
            correta: 0,
            explicacao: 'Na Consagração, pelo poder do Espírito Santo e pelas palavras de Cristo pronunciadas pelo sacerdote, o pão e o vinho se tornam o Corpo e Sangue de Cristo — transubstanciação.',
          },
          {
            pergunta: 'Quantas Orações Eucarísticas principais são usadas na Missa?',
            opcoes: [
              'Quatro principais',
              'Uma única',
              'Sete',
              'Doze',
            ],
            correta: 0,
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
              '"Livrai-nos, Senhor, de todos os males"',
              '"Senhor, não sou digno"',
              '"Cordeiro de Deus que tirais o pecado do mundo"',
              '"Deus, sede propício a mim, pecador"',
            ],
            correta: 0,
            explicacao: 'O embolismo começa com "Livrai-nos, Senhor, de todos os males passados, presentes e futuros..." e prolonga a última petição do Pai Nosso.',
          },
          {
            pergunta: 'Quantas petições contém o Pai Nosso?',
            opcoes: [
              'Sete',
              'Três',
              'Cinco',
              'Dez',
            ],
            correta: 0,
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
              'Confessar-se antes de receber a Comunhão',
              'Receber a Comunhão para obter força contra o pecado',
              'Esperar até a próxima Missa para se decidir',
              'Comungar e pedir perdão depois',
            ],
            correta: 0,
            explicacao: 'Quem cometeu pecado mortal deve receber primeiro o sacramento da Penitência (Confissão) para recuperar o estado de graça e então se aproximar da Comunhão.',
          },
          {
            pergunta: 'O jejum eucarístico é de...',
            opcoes: [
              '1 hora antes da Comunhão',
              '3 horas antes da Comunhão',
              '24 horas antes da Comunhão',
              '30 minutos antes da Comunhão',
            ],
            correta: 0,
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
              'Os fiéis são enviados para viver o Evangelho no cotidiano',
              'A celebração foi inválida e deve ser repetida',
              'Os fiéis podem permanecer ou sair, como preferirem',
              'Apenas os ministros devem sair em procissão',
            ],
            correta: 0,
            explicacao: 'A despedida é um envio missionário: os fiéis saem transformados pela Eucaristia para ser testemunhas de Cristo no mundo, na família e no trabalho.',
          },
          {
            pergunta: 'Qual gesto acompanha a bênção final?',
            opcoes: [
              'O sinal da cruz',
              'A imposição das mãos sobre a cabeça',
              'A prostração diante do altar',
              'O abraço da paz',
            ],
            correta: 0,
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
              'Sem cessar',
              'Apenas nos domingos',
              'Três vezes ao dia',
              'Quando sentir necessidade',
            ],
            correta: 0,
            explicacao: 'Em 1Ts 5,17, São Paulo exorta: "Orai sem cessar." Isso não significa recitar orações continuamente, mas manter uma atitude constante de abertura e confiança em Deus.',
          },
          {
            pergunta: 'A oração de contrição é uma oração de...',
            opcoes: [
              'Arrependimento pelos pecados cometidos',
              'Louvor pela grandeza de Deus',
              'Pedido de graças especiais',
              'Agradecimento pelas bênçãos recebidas',
            ],
            correta: 0,
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
              'Sete',
              'Três',
              'Dez',
              'Cinco',
            ],
            correta: 0,
            explicacao: 'O Pai Nosso tem 7 petições: 3 voltadas à glória de Deus e 4 às nossas necessidades humanas.',
          },
          {
            pergunta: 'A primeira parte das petições do Pai Nosso é voltada para...',
            opcoes: [
              'A glória de Deus',
              'Nossas necessidades pessoais',
              'O perdão dos pecados',
              'A proteção contra o diabo',
            ],
            correta: 0,
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
              'Isabel, prima de Maria',
              'O anjo Gabriel',
              'Ana, mãe de Samuel',
              'A multidão em Caná',
            ],
            correta: 0,
            explicacao: 'Isabel disse a Maria: "Bendita és tu entre as mulheres e bendito é o fruto do teu ventre!" (Lc 1,42) quando Maria foi visitá-la durante a Visitação.',
          },
          {
            pergunta: 'A segunda parte da Ave Maria pede...',
            opcoes: [
              'A intercessão de Maria por nós pecadores',
              'A proteção de Maria contra os inimigos',
              'A cura de doenças físicas',
              'O aumento da fé dos cristãos',
            ],
            correta: 0,
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
              'São João Paulo II em 2002',
              'São Domingos de Gusmão no século XIII',
              'Papa Pio XII em 1950',
              'Concílio Vaticano II em 1965',
            ],
            correta: 0,
            explicacao: 'São João Paulo II acrescentou os Mistérios Luminosos em 2002, na carta "Rosarium Virginis Mariae", contemplando a vida pública de Jesus.',
          },
          {
            pergunta: 'Os mistérios gozosos contemplam...',
            opcoes: [
              'A infância e juventude de Jesus',
              'A Paixão e morte de Jesus',
              'A Ressurreição e Ascensão',
              'Os milagres de Cana e multiplicação dos pães',
            ],
            correta: 0,
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
              'O rosário tem 20 dezenas (4 grupos), o terço tem 5',
              'O terço inclui mais orações que o rosário',
              'O rosário é rezado apenas por religiosos',
              'O terço não inclui os mistérios',
            ],
            correta: 0,
            explicacao: 'O Rosário completo tem 20 dezenas distribuídas em 4 grupos de mistérios. O Terço é apenas 5 dezenas — um grupo de mistérios — equivalente a um terço do total.',
          },
          {
            pergunta: 'Cada dezena do terço começa com...',
            opcoes: [
              'Um Pai Nosso',
              'Uma Ave Maria',
              'O Credo',
              'O Glória',
            ],
            correta: 0,
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
              'Nove',
              'Nova',
              'Noite',
              'Nuvem',
            ],
            correta: 0,
            explicacao: '"Novena" deriva do latim "novem" = nove, referindo-se aos 9 dias consecutivos de oração.',
          },
          {
            pergunta: 'A novena a Nossa Senhora Aparecida é especialmente rezada...',
            opcoes: [
              'Em outubro, mês de Nossa Senhora',
              'Em dezembro, mês do Natal',
              'Em maio, mês de Maria',
              'Em agosto, mês da Assunção',
            ],
            correta: 0,
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
              'XV',
              'XIII',
              'XVII',
              'XI',
            ],
            correta: 0,
            explicacao: 'A Coroa Franciscana surgiu no século XV (por volta de 1422) entre os Frades Menores Franciscanos de Florença, Itália.',
          },
          {
            pergunta: 'Cada alegria na Coroa é rezada com...',
            opcoes: [
              'Um Pai Nosso e dez Ave Marias',
              'Três Pai Nossos e sete Ave Marias',
              'Um Credo e cinco Ave Marias',
              'Dez Pai Nossos',
            ],
            correta: 0,
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
              'Durante o tempo pascal (da Páscoa a Pentecostes)',
              'Durante o Advento',
              'Nos dias de jejum',
              'No mês de maio',
            ],
            correta: 0,
            explicacao: 'O Regina Caeli ("Alegra-te, Rainha do Céu") substitui o Angelus durante o tempo pascal — da Páscoa até Pentecostes — celebrando a alegria da Ressurreição.',
          },
          {
            pergunta: 'O Memorare é uma oração de...',
            opcoes: [
              'Confiança e intercessão a Maria',
              'Louvor à Santíssima Trindade',
              'Penitência e reparação pelos pecados',
              'Ação de graças pela criação',
            ],
            correta: 0,
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
            opcoes: ['Verde', 'Roxo', 'Vermelho', 'Branco'],
            correta: 0,
            explicacao: 'O verde representa esperança e vida no crescimento ordinário da fé — é usado nos domingos do Tempo Comum, quando não há festa especial.',
          },
          {
            pergunta: 'O ano litúrgico termina na solenidade de...',
            opcoes: ['Cristo Rei', 'Pentecostes', 'Todos os Santos', 'Nossa Senhora'],
            correta: 0,
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
            opcoes: ['Quatro', 'Três', 'Seis', 'Duas'],
            correta: 0,
            explicacao: 'O Advento dura quatro semanas — cada uma representada por uma vela na Coroa do Advento, contando regressivamente até o Natal.',
          },
          {
            pergunta: "O 3º domingo do Advento é chamado de 'Gaudete' porque...",
            opcoes: ['É um domingo de alegria no meio da preparação', 'É o início do Advento', 'É quando se acende a vela branca', 'É o domingo mais importante do Advento'],
            correta: 0,
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
            opcoes: ['A manifestação de Jesus aos Magos do Oriente', 'O nascimento de Jesus', 'A fuga para o Egito', 'A apresentação no Templo'],
            correta: 0,
            explicacao: 'Epifania vem do grego epiphaneia = manifestação. Celebra a visita dos Magos — símbolos de todos os povos — reconhecendo Jesus como Rei, Sacerdote e Salvador.',
          },
          {
            pergunta: 'Quem popularizou a tradição do presépio?',
            opcoes: ['São Francisco de Assis', 'São Domingos de Gusmão', 'Santo Agostinho', 'São João Bosco'],
            correta: 0,
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
            opcoes: ['Oração, Jejum e Esmola', 'Missa, Confissão e Comunhão', 'Penitência, Mortificação e Silêncio', 'Leitura, Meditação e Contemplação'],
            correta: 0,
            explicacao: 'Oração, Jejum e Esmola são os três pilares da conversão quaresmal ensinados por Jesus no Sermão da Montanha (Mt 6,1-18).',
          },
          {
            pergunta: 'A Quaresma começa na...',
            opcoes: ['Quarta-feira de Cinzas', 'Domingo de Ramos', 'Terça de Carnaval', 'Primeira sexta-feira do ano'],
            correta: 0,
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
            opcoes: ['A instituição da Eucaristia e do sacerdócio', 'A Ressurreição de Jesus', 'A entrada de Jesus em Jerusalém', 'A morte de Jesus na Cruz'],
            correta: 0,
            explicacao: "Na Quinta-feira Santa celebra-se a Última Ceia, onde Jesus instituiu a Eucaristia ('Fazei isto em memória de mim') e o sacerdócio ministerial, além do mandamento do amor.",
          },
          {
            pergunta: 'O gesto de lavar os pés na Quinta-feira Santa é chamado de...',
            opcoes: ['Mandatum', 'Baptismus', 'Lavatio', 'Servitium'],
            correta: 0,
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
            opcoes: ['A vinda do Espírito Santo sobre os Apóstolos', 'A Ascensão de Jesus ao Céu', 'A Ressurreição de Jesus', 'O nascimento da Igreja no Natal'],
            correta: 0,
            explicacao: "Pentecostes (do grego 'quinquagésimo') celebra a vinda do Espírito Santo 50 dias após a Páscoa, marcando o nascimento da Igreja missionária.",
          },
          {
            pergunta: 'A data da Páscoa é determinada pela...',
            opcoes: ['Primeira lua cheia após o equinócio de março', 'Data fixa no calendário', 'Decisão anual do Papa', 'Calendário lunar judaico'],
            correta: 0,
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
            opcoes: ['Verde', 'Branco', 'Roxo', 'Vermelho'],
            correta: 0,
            explicacao: 'O verde é usado no Tempo Comum, simbolizando esperança e crescimento ordinário na vida cristã, como a natureza que cresce silenciosamente.',
          },
          {
            pergunta: 'No Tempo Comum lemos os Evangelhos de forma...',
            opcoes: ['Semicontínua (ano A: Mateus, B: Marcos, C: Lucas)', 'Exclusivamente de João', 'Aleatória, sem ordem', 'Apenas do Antigo Testamento'],
            correta: 0,
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
            opcoes: ['Um sacramental mariano que expressa devoção e proteção de Maria', 'Uma vestimenta exclusiva de frades', 'Um tipo de rosário com 150 contas', 'Uma bênção dada apenas na Quaresma'],
            correta: 0,
            explicacao: 'O escapulário (especialmente o do Carmo) é um sacramental mariano — dois pequenos pedaços de pano unidos por cordões, usados sobre os ombros como sinal de pertença a Maria e acolhimento de sua proteção.',
          },
          {
            pergunta: 'A água benta lembra os fiéis de...',
            opcoes: ['Seu Batismo e consagração a Deus', 'O dilúvio de Noé', 'A travessia do Mar Vermelho apenas', 'A cura dos leprosos por Jesus'],
            correta: 0,
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
            opcoes: ['O objeto, a intenção e as circunstâncias sejam bons', 'Apenas a intenção seja boa', 'O resultado final seja positivo', 'A autoridade da Igreja aprove'],
            correta: 0,
            explicacao: 'Uma boa intenção não basta — não se pode fazer o mal para que venha o bem (Rm 3,8). O objeto do ato deve ser intrinsecamente bom ou neutro; uma boa intenção não purifica um objeto mau.',
          },
          {
            pergunta: 'Para ser pecado mortal, o ato deve ter...',
            opcoes: ['Matéria grave, pleno conhecimento e deliberado consentimento', 'Apenas matéria grave', 'Repetição habitual e má intenção', 'Consciência culpada e vergonha'],
            correta: 0,
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
            opcoes: ['Minimiza a gravidade dos pecados', 'Vê pecado onde não há', 'Julga com perfeita segurança', 'Nunca toma decisões'],
            correta: 0,
            explicacao: 'A consciência laxa (ou relaxada) tende a subestimar a gravidade dos pecados e a encontrar justificativas para atos moralmente errados. É o extremo oposto da consciência escrupulosa.',
          },
          {
            pergunta: 'A formação da consciência inclui...',
            opcoes: ['Palavra de Deus, Magistério, oração e exame de consciência', 'Apenas seguir a própria intuição', 'Estudar filosofia secular', 'Consultar apenas a opinião pessoal'],
            correta: 0,
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
            opcoes: ['Sete', 'Dez', 'Três', 'Doze'],
            correta: 0,
            explicacao: 'São sete os pecados capitais, sistematizados por São Gregório Magno: soberba, avareza, luxúria, ira, gula, inveja e preguiça (acédia).',
          },
          {
            pergunta: 'A inveja é definida como...',
            opcoes: ['Tristeza pelo bem do próximo e desejo de privá-lo dele', 'Desejo de ter mais do que se tem', 'Raiva diante da injustiça', 'Orgulho pelo próprio sucesso'],
            correta: 0,
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
            opcoes: ['A razão prática que discerne o bem verdadeiro em cada situação', 'A moderação nos prazeres', 'A perseverança diante das dificuldades', 'Dar a cada um o que lhe é devido'],
            correta: 0,
            explicacao: "A Prudência (phronesis em grego) é a virtude que aplica os princípios morais às situações concretas, discernindo o que deve ser feito. É chamada de 'a cocheira das virtudes' por guiar todas as outras.",
          },
          {
            pergunta: 'Qual virtude cardeal modera a atração pelos prazeres?',
            opcoes: ['Temperança', 'Fortaleza', 'Prudência', 'Justiça'],
            correta: 0,
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
            opcoes: ['Fazer o bem e evitar o mal', 'Amar a Deus sobre todas as coisas', 'Respeitar a autoridade civil', 'Não matar e não roubar'],
            correta: 0,
            explicacao: "São Tomás ensina que o primeiro e mais fundamental preceito da Lei Natural é: 'O bem deve ser feito e procurado; o mal deve ser evitado.' Todos os outros preceitos morais naturais derivam deste.",
          },
          {
            pergunta: 'A Lei Natural é universal porque...',
            opcoes: ['Vale para todos os seres humanos, independente de cultura ou religião', 'Foi aprovada pela ONU', 'É ensinada em todas as religiões da mesma forma', 'Foi escrita na Bíblia para todos'],
            correta: 0,
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
            opcoes: ['A relação do homem com Deus', 'A relação do homem com o próximo', 'Os rituais da sinagoga', 'As leis civis de Israel'],
            correta: 0,
            explicacao: 'Os três primeiros mandamentos (primeira tábua) tratam da relação com Deus: adorar apenas a Deus, não tomar seu nome em vão e guardar o dia do Senhor. Os outros sete (segunda tábua) regulam a relação com o próximo.',
          },
          {
            pergunta: 'Jesus resumiu os dez mandamentos em...',
            opcoes: ['Amar a Deus sobre tudo e ao próximo como a si mesmo', 'Orar, jejuar e dar esmolas', 'As oito bem-aventuranças', 'Batizar e ensinar todas as nações'],
            correta: 0,
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
            opcoes: ['Corporais e espirituais', 'Privadas e públicas', 'Obrigatórias e voluntárias', 'Antigas e modernas'],
            correta: 0,
            explicacao: 'A Igreja enumera 7 obras de misericórdia corporais (que atendem às necessidades físicas) e 7 espirituais (que atendem às necessidades da alma). Juntas expressam o amor integral ao ser humano.',
          },
          {
            pergunta: 'Ágape em grego significa...',
            opcoes: ['Amor incondicional que busca o bem do outro', 'Amor romântico e passional', 'Amor de amizade entre iguais', 'Amor filial pelos pais'],
            correta: 0,
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
            opcoes: ['Confissão ou Penitência', 'Unção dos Enfermos', 'Crisma da Penitência', 'Batismo de arrependimento'],
            correta: 0,
            explicacao: 'O Sacramento da Reconciliação tem três nomes no Catecismo: Sacramento da Penitência (destaca a conversão), Sacramento da Confissão (destaca o momento da acusação dos pecados) e Sacramento do Perdão (destaca o efeito).',
          },
          {
            pergunta: 'O Domingo da Divina Misericórdia foi instituído por...',
            opcoes: ['São João Paulo II em 2000', 'Bento XVI em 2005', 'Paulo VI em 1970', 'Francisco em 2015'],
            correta: 0,
            explicacao: 'João Paulo II instituiu o Domingo da Divina Misericórdia (1º domingo após a Páscoa) ao canonizar Santa Faustina em 30 de abril de 2000, tornando-o universal para toda a Igreja Católica.',
          },
        ],
        xp: 80,
      },
    ],
  },
];
