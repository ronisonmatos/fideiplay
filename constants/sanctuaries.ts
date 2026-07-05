import type { Sanctuary } from '@/hooks/use-game-packs';

export const SANCTUARIES: Sanctuary[] = [
  {
    emoji: '🇵🇹',
    name: 'Santuário de Fátima',
    country: 'Portugal',
    description: 'Nossa Senhora apareceu a três pastorinhos em 1917.',
    questions: [
      { question: 'Em que ano Nossa Senhora apareceu em Fátima?', options: ['1910', '1917', '1925', '1900'], correct: 1 },
      { question: 'Qual dos pastorinhos de Fátima ainda é vivo?', options: ['Francisco', 'Jacinta', 'Lúcia', 'Todos faleceram'], correct: 3 },
      { question: 'Quantas aparições ocorreram em Fátima (maio–outubro de 1917)?', options: ['3', '5', '6', '12'], correct: 2 },
      { question: 'Qual é o nome dos três pastores que viram Nossa Senhora em Fátima?', options: ['Lúcia, Francisco e Jacinta', 'Lúcia, Marta e José', 'Bernadette, Francisco e Jacinta', 'Maria, João e Jacinta'], correct: 0 },
    ],
  },
  {
    emoji: '🇧🇷',
    name: 'Santuário de Aparecida',
    country: 'Brasil',
    description: 'Maior santuário mariano do mundo, padroeira do Brasil.',
    questions: [
      { question: 'Em que estado brasileiro fica Aparecida?', options: ['Rio de Janeiro', 'Minas Gerais', 'São Paulo', 'Bahia'], correct: 2 },
      { question: 'Em que ano foi encontrada a imagem de N. S. Aparecida?', options: ['1717', '1800', '1917', '1650'], correct: 0 },
      { question: 'De que material é feita a imagem original de N. S. Aparecida?', options: ['Madeira', 'Argila', 'Barro', 'Pedra'], correct: 2 },
      { question: 'Quantos pescadores encontraram a imagem de N. S. Aparecida?', options: ['2', '3', '4', '7'], correct: 1 },
    ],
  },
  {
    emoji: '🇫🇷',
    name: 'Santuário de Lourdes',
    country: 'França',
    description: 'Nossa Senhora apareceu a Bernadette Soubirous em 1858.',
    questions: [
      { question: 'Qual santa viu Nossa Senhora em Lourdes?', options: ['Santa Teresa', 'Santa Bernadette', 'Santa Jacinta', 'Santa Clara'], correct: 1 },
      { question: 'Quantas vezes Nossa Senhora apareceu em Lourdes?', options: ['8', '12', '18', '24'], correct: 2 },
      { question: 'O que tornou Lourdes famosa mundialmente?', options: ['Relíquias raras', 'A água milagrosa', 'Um grande templo romano', 'Um tesouro medieval'], correct: 1 },
      { question: 'Em que ano ocorreram as aparições de Lourdes?', options: ['1817', '1858', '1900', '1917'], correct: 1 },
    ],
  },
  {
    emoji: '🇮🇱',
    name: 'Jerusalém',
    country: 'Israel',
    description: 'A Cidade Santa, onde Jesus viveu, morreu e ressuscitou.',
    questions: [
      { question: 'Qual é o nome da colina onde Jesus foi crucificado?', options: ['Monte Sião', 'Gólgota (Calvário)', 'Monte das Oliveiras', 'Monte Sinai'], correct: 1 },
      { question: 'Em qual rio Jesus foi batizado por João Batista?', options: ['Rio Nilo', 'Rio Eufrates', 'Rio Jordão', 'Rio Tigre'], correct: 2 },
      { question: 'Qual é a principal basílica de Jerusalém, sobre o túmulo de Jesus?', options: ['São Pedro', 'Santo Sepulcro', 'Natividade', 'Anunciação'], correct: 1 },
      { question: 'Em qual cidade próxima Jesus nasceu?', options: ['Nazaré', 'Jericó', 'Cafarnaum', 'Belém'], correct: 3 },
    ],
  },
  {
    emoji: '🇻🇦',
    name: 'Vaticano',
    country: 'Vaticano',
    description: 'O coração da Igreja Católica, onde está o túmulo de São Pedro.',
    questions: [
      { question: 'Quem está sepultado sob a Basílica de São Pedro?', options: ['São Paulo', 'São Pedro', 'Jesus Cristo', 'Papa João Paulo II'], correct: 1 },
      { question: 'Quem pintou o teto da Capela Sistina?', options: ['Leonardo da Vinci', 'Rafael', 'Michelangelo', 'Botticelli'], correct: 2 },
      { question: 'O Vaticano é o menor país do mundo. Qual é o segundo menor?', options: ['Mônaco', 'San Marino', 'Liechtenstein', 'Andorra'], correct: 0 },
      { question: 'Qual papa convocou o Concílio Vaticano II?', options: ['Pio XII', 'João XXIII', 'Paulo VI', 'João Paulo I'], correct: 1 },
    ],
  },
  {
    emoji: '🇪🇸',
    name: 'Santiago de Compostela',
    country: 'Espanha',
    description: 'Destino do famoso Caminho de Santiago — túmulo do apóstolo.',
    questions: [
      { question: 'Qual apóstolo está sepultado em Santiago de Compostela?', options: ['São Pedro', 'São Paulo', 'São Tiago', 'São João'], correct: 2 },
      { question: 'Qual é o nome do famoso caminho de peregrinação até Santiago?', options: ['Via Dolorosa', 'Caminho de Santiago', 'Via Francigena', 'Caminho de Roma'], correct: 1 },
      { question: 'Em que país fica Santiago de Compostela?', options: ['Portugal', 'França', 'Espanha', 'Itália'], correct: 2 },
      { question: 'A Catedral de Santiago é famosa pelo rito do grande incensário chamado...', options: ['O sino milagroso', 'O Turíbulo de Prata', 'O Botafumeiro', 'A Cruz do Apóstolo'], correct: 2 },
    ],
  },
  {
    emoji: '🇵🇱',
    name: 'Santuário de Czestochowa',
    country: 'Polônia',
    description: 'Lar da venerada Nossa Senhora Negra, Rainha da Polônia.',
    questions: [
      { question: 'Qual imagem famosa é guardada no Santuário de Czestochowa?', options: ['Nossa Senhora de Loreto', 'Nossa Senhora Negra', 'Nossa Senhora de Fátima', 'Nossa Senhora do Perpétuo Socorro'], correct: 1 },
      { question: 'Em que país fica o Santuário de Czestochowa?', options: ['Rússia', 'República Tcheca', 'Polônia', 'Hungria'], correct: 2 },
      { question: 'Qual papa polonês visitou Czestochowa diversas vezes?', options: ['Bento XVI', 'São João Paulo II', 'São João XXIII', 'Papa Francisco'], correct: 1 },
      { question: 'Nossa Senhora Negra de Czestochowa é também chamada de...', options: ['Estrela da Polônia', 'Rainha da Polônia', 'Mãe de Varsóvia', 'Protetora do Leste'], correct: 1 },
    ],
  },
  {
    emoji: '🇲🇽',
    name: 'Basílica de Guadalupe',
    country: 'México',
    description: 'Nossa Senhora apareceu a Juan Diego em 1531, deixando sua imagem no manto.',
    questions: [
      { question: 'A quem Nossa Senhora de Guadalupe apareceu no México?', options: ['Juan Paulo', 'Pedro Rodrigues', 'Juan Diego', 'Diego Morales'], correct: 2 },
      { question: 'Em que ano ocorreu a aparição de Nossa Senhora de Guadalupe?', options: ['1431', '1531', '1631', '1731'], correct: 1 },
      { question: 'O que ficou impresso na tilma (manto) de Juan Diego?', options: ['Uma cruz dourada', 'A imagem de Nossa Senhora', 'Palavras em nahuatl', 'Um mapa da cidade'], correct: 1 },
      { question: 'Nossa Senhora de Guadalupe é padroeira de...', options: ['México', 'América Central', 'América do Sul', 'Toda a América'], correct: 3 },
    ],
  },
  {
    emoji: '🇮🇹',
    name: 'Santuário de Assis',
    country: 'Itália',
    description: 'Cidade natal de São Francisco, patrono da ecologia e da paz.',
    questions: [
      { question: 'Qual santo nasceu em Assis?', options: ['São Domingos', 'São Bento', 'São Francisco de Assis', 'Santo António de Pádua'], correct: 2 },
      { question: 'Qual ordem religiosa São Francisco fundou?', options: ['Dominicanos', 'Jesuítas', 'Beneditinos', 'Franciscanos'], correct: 3 },
      { question: 'Qual famosa oração é associada a São Francisco de Assis?', options: ['Ave Maria', 'Magnificat', '"Senhor, fazei-me instrumento de vossa paz"', 'Pai Nosso'], correct: 2 },
      { question: 'Em que ano São Francisco de Assis morreu?', options: ['1126', '1226', '1326', '1426'], correct: 1 },
    ],
  },
  {
    emoji: '🇪🇬',
    name: 'Monte Sinai',
    country: 'Egito',
    description: 'Onde Deus entregou os Dez Mandamentos a Moisés.',
    questions: [
      { question: 'Qual evento bíblico central ocorreu no Monte Sinai?', options: ['Nascimento de Moisés', 'Travessia do Mar Vermelho', 'Deus entregou os Dez Mandamentos a Moisés', 'Batalha de Jericó'], correct: 2 },
      { question: 'Quem recebeu os Dez Mandamentos no Monte Sinai?', options: ['Abraão', 'Josué', 'Elias', 'Moisés'], correct: 3 },
      { question: 'Qual mosteiro milenar fica ao pé do Monte Sinai?', options: ['Mosteiro de São Bento', 'Mosteiro de Santa Catarina', 'Mosteiro do Espírito Santo', 'Mosteiro de São Elias'], correct: 1 },
      { question: 'Em que país fica o Monte Sinai?', options: ['Israel', 'Jordânia', 'Arábia Saudita', 'Egito'], correct: 3 },
    ],
  },
];
