import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeVersiculo } from '@/hooks/use-game-packs';

type EntryType = 'versículo' | 'santo' | 'papa' | 'documento';
type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'idle' | 'difficulty' | 'playing' | 'answered' | 'done';

interface FraseSagrada {
  words: string[];
  reference: string;
  options: string[];
  type: EntryType;
  difficulty: Difficulty;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; emoji: string; desc: string; initialReveal: number }> = {
  facil:   { label: 'Fácil',   color: C.green, emoji: '🌱', desc: 'Versículos populares e frases famosas', initialReveal: 3 },
  medio:   { label: 'Médio',   color: C.gold,  emoji: '✝️', desc: 'Versículos, santos e ensinamentos', initialReveal: 2 },
  dificil: { label: 'Difícil', color: C.red,   emoji: '📜', desc: 'Teologia, documentos e doutores da Igreja', initialReveal: 1 },
};

const GUESS_LABEL: Record<EntryType, string> = {
  'versículo':  'Onde está escrito?',
  'santo':      'Quem disse isso?',
  'papa':       'De qual papa é esta frase?',
  'documento':  'De qual documento da Igreja?',
};

const TYPE_ICON: Record<EntryType, string> = {
  'versículo':  '📖',
  'santo':      '✝️',
  'papa':       '⛪',
  'documento':  '📜',
};

const TYPE_LABEL: Record<EntryType, string> = {
  'versículo':  'Versículo',
  'santo':      'Frase de Santo',
  'papa':       'Palavra do Papa',
  'documento':  'Documento da Igreja',
};

const ALL_FRASES: FraseSagrada[] = [
  // ── FÁCIL ───────────────────────────────────────────────────────────────────
  {
    words: ['Porque', 'Deus', 'amou', 'o', 'mundo', 'de', 'tal', 'maneira', 'que', 'deu', 'o', 'seu', 'Filho', 'unigênito.'],
    reference: 'João 3:16',
    options: ['João 3:16', 'Mateus 5:3', 'Salmos 23:1', 'Romanos 8:28'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['O', 'Senhor', 'é', 'o', 'meu', 'pastor;', 'nada', 'me', 'faltará.'],
    reference: 'Salmos 23:1',
    options: ['Salmos 23:1', 'João 10:11', 'Isaías 40:31', 'Hebreus 13:6'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Eu', 'sou', 'o', 'caminho,', 'a', 'verdade', 'e', 'a', 'vida.'],
    reference: 'João 14:6',
    options: ['João 14:6', 'João 11:25', 'Mateus 7:14', 'Lucas 4:18'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Tudo', 'posso', 'naquele', 'que', 'me', 'fortalece.'],
    reference: 'Filipenses 4:13',
    options: ['Filipenses 4:13', 'Romanos 8:37', '2 Coríntios 12:9', 'Isaías 41:10'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Amai-vos', 'uns', 'aos', 'outros,', 'como', 'eu', 'vos', 'amei.'],
    reference: 'João 15:12',
    options: ['João 15:12', '1 Coríntios 13:4', 'Mateus 22:39', 'Romanos 13:9'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Bem-aventurados', 'os', 'pobres', 'em', 'espírito,', 'porque', 'deles', 'é', 'o', 'reino', 'dos', 'céus.'],
    reference: 'Mateus 5:3',
    options: ['Mateus 5:3', 'Lucas 6:20', 'Salmos 37:11', 'Isaías 61:1'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Procurai', 'primeiro', 'o', 'Reino', 'de', 'Deus', 'e', 'a', 'sua', 'justiça.'],
    reference: 'Mateus 6:33',
    options: ['Mateus 6:33', 'Mateus 7:7', 'Lucas 12:31', 'João 6:27'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['No', 'princípio', 'era', 'o', 'Verbo,', 'e', 'o', 'Verbo', 'estava', 'com', 'Deus.'],
    reference: 'João 1:1',
    options: ['João 1:1', 'Gênesis 1:1', 'Hebreus 1:1', 'Colossenses 1:15'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Alegrai-vos', 'sempre', 'no', 'Senhor;', 'outra', 'vez', 'digo,', 'alegrai-vos.'],
    reference: 'Filipenses 4:4',
    options: ['Filipenses 4:4', '1 Tessalonicenses 5:16', 'Salmos 118:24', 'Romanos 5:11'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Eu', 'sou', 'a', 'ressurreição', 'e', 'a', 'vida;', 'quem', 'crê', 'em', 'mim,', 'ainda', 'que', 'esteja', 'morto,', 'viverá.'],
    reference: 'João 11:25',
    options: ['João 11:25', 'João 6:35', 'João 14:6', 'João 10:28'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['O', 'amor', 'é', 'paciente,', 'o', 'amor', 'é', 'bondoso,', 'não', 'é', 'invejoso.'],
    reference: '1 Coríntios 13:4',
    options: ['1 Coríntios 13:4', 'Romanos 12:9', 'Efésios 4:2', 'Colossenses 3:14'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Vós', 'sois', 'o', 'sal', 'da', 'terra.'],
    reference: 'Mateus 5:13',
    options: ['Mateus 5:13', 'Mateus 5:14', 'João 8:12', 'Lucas 14:34'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Fazei', 'isto', 'em', 'memória', 'de', 'mim.'],
    reference: 'Lucas 22:19',
    options: ['Lucas 22:19', '1 Coríntios 11:24', 'Mateus 26:26', 'Marcos 14:22'],
    type: 'versículo', difficulty: 'facil',
  },
  {
    words: ['Nosso', 'coração', 'está', 'inquieto', 'até', 'que', 'repose', 'em', 'Vós.'],
    reference: 'Santo Agostinho',
    options: ['Santo Agostinho', 'São Francisco de Assis', 'São Tomás de Aquino', 'São Jerônimo'],
    type: 'santo', difficulty: 'facil',
  },
  {
    words: ['Senhor,', 'fazei-me', 'instrumento', 'de', 'vossa', 'paz.'],
    reference: 'São Francisco de Assis',
    options: ['São Francisco de Assis', 'São Domingos', 'São Bento', 'Santo Antônio'],
    type: 'santo', difficulty: 'facil',
  },
  {
    words: ['Pequenas', 'coisas', 'feitas', 'com', 'grande', 'amor.'],
    reference: 'Santa Teresa de Calcutá',
    options: ['Santa Teresa de Calcutá', 'Santa Teresa de Ávila', 'São João Bosco', 'São Padre Pio'],
    type: 'santo', difficulty: 'facil',
  },
  {
    words: ['A', 'oração', 'é', 'a', 'respiração', 'da', 'alma.'],
    reference: 'São João Maria Vianney',
    options: ['São João Maria Vianney', 'Santo Agostinho', 'São Francisco de Sales', 'São João Bosco'],
    type: 'santo', difficulty: 'facil',
  },
  {
    words: ['Dai-me', 'almas,', 'e', 'ficai', 'com', 'o', 'resto.'],
    reference: 'São João Bosco',
    options: ['São João Bosco', 'São Francisco de Assis', 'São Padre Pio', 'Santo Antônio'],
    type: 'santo', difficulty: 'facil',
  },
  {
    words: ['A', 'maior', 'das', 'sabedorias', 'é', 'conhecer', 'Jesus', 'Cristo.'],
    reference: 'São Tomás de Kempis',
    options: ['São Tomás de Kempis', 'Santo Agostinho', 'São Bernardo de Claraval', 'São Boaventura'],
    type: 'santo', difficulty: 'facil',
  },
  {
    words: ['Deus', 'não', 'nos', 'chama', 'para', 'ser', 'bem-sucedidos,', 'mas', 'para', 'ser', 'fiéis.'],
    reference: 'Santa Teresa de Calcutá',
    options: ['Santa Teresa de Calcutá', 'Santa Teresa de Ávila', 'São João Paulo II', 'São Padre Pio'],
    type: 'santo', difficulty: 'facil',
  },

  // ── MÉDIO ───────────────────────────────────────────────────────────────────
  {
    words: ['Não', 'vos', 'conformeis', 'com', 'este', 'século,', 'mas', 'transformai-vos', 'pela', 'renovação', 'da', 'vossa', 'mente.'],
    reference: 'Romanos 12:2',
    options: ['Romanos 12:2', 'Efésios 4:23', 'Colossenses 3:10', '1 Pedro 1:14'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Sede', 'fortes', 'e', 'corajosos.', 'Não', 'temais', 'nem', 'vos', 'turbeis', 'diante', 'deles.'],
    reference: 'Josué 1:9',
    options: ['Josué 1:9', 'Deuteronômio 31:6', 'Salmos 27:14', 'Isaías 35:4'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Confiai', 'no', 'Senhor', 'de', 'todo', 'o', 'coração', 'e', 'não', 'vos', 'apoieis', 'na', 'vossa', 'própria', 'prudência.'],
    reference: 'Provérbios 3:5',
    options: ['Provérbios 3:5', 'Salmos 37:5', 'Jeremias 17:7', 'Isaías 26:4'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Porque', 'eu', 'bem', 'sei', 'os', 'planos', 'que', 'tenho', 'a', 'vosso', 'respeito,', 'diz', 'o', 'Senhor.'],
    reference: 'Jeremias 29:11',
    options: ['Jeremias 29:11', 'Isaías 55:8', 'Romanos 8:28', 'Salmos 139:16'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Quem', 'não', 'ama', 'não', 'conheceu', 'a', 'Deus,', 'porque', 'Deus', 'é', 'amor.'],
    reference: '1 João 4:8',
    options: ['1 João 4:8', '1 João 3:16', 'João 3:16', 'Romanos 5:8'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Sede', 'sempre', 'prontos', 'para', 'dar', 'razão', 'da', 'esperança', 'que', 'há', 'em', 'vós.'],
    reference: '1 Pedro 3:15',
    options: ['1 Pedro 3:15', 'Romanos 10:10', 'Hebreus 11:1', 'Efésios 6:15'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Sede', 'sóbrios', 'e', 'vigilantes.', 'O', 'diabo,', 'vosso', 'adversário,', 'anda', 'em', 'derredor', 'como', 'leão', 'que', 'ruge.'],
    reference: '1 Pedro 5:8',
    options: ['1 Pedro 5:8', 'Efésios 6:11', 'Apocalipse 20:2', 'Tiago 4:7'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Cada', 'um', 'dê', 'segundo', 'propôs', 'no', 'seu', 'coração,', 'porque', 'Deus', 'ama', 'o', 'que', 'dá', 'com', 'alegria.'],
    reference: '2 Coríntios 9:7',
    options: ['2 Coríntios 9:7', 'Lucas 21:4', 'Provérbios 11:24', 'Malaquias 3:10'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Nada', 'te', 'perturbe,', 'nada', 'te', 'espante,', 'tudo', 'passa,', 'Deus', 'não', 'muda.'],
    reference: 'Santa Teresa de Ávila',
    options: ['Santa Teresa de Ávila', 'Santa Teresa de Lisieux', 'Santa Catarina de Siena', 'São João da Cruz'],
    type: 'santo', difficulty: 'medio',
  },
  {
    words: ['Ora,', 'espera', 'e', 'não', 'te', 'preocupes.'],
    reference: 'São Padre Pio',
    options: ['São Padre Pio', 'São João Bosco', 'São Pio X', 'São João Maria Vianney'],
    type: 'santo', difficulty: 'medio',
  },
  {
    words: ['Não', 'tenhais', 'medo!', 'Abri,', 'mais,', 'escancarai', 'as', 'portas', 'a', 'Cristo!'],
    reference: 'São João Paulo II',
    options: ['São João Paulo II', 'São João XXIII', 'São Paulo VI', 'Bento XVI'],
    type: 'papa', difficulty: 'medio',
  },
  {
    words: ['No', 'fim', 'da', 'vida,', 'seremos', 'examinados', 'no', 'amor.'],
    reference: 'São João da Cruz',
    options: ['São João da Cruz', 'Santa Teresa de Ávila', 'São Francisco de Sales', 'Santo Agostinho'],
    type: 'santo', difficulty: 'medio',
  },
  {
    words: ['Farei', 'o', 'bem', 'até', 'o', 'fim;', 'espalhá-lo-ei', 'como', 'uma', 'chuva', 'de', 'rosas.'],
    reference: 'Santa Teresa de Lisieux',
    options: ['Santa Teresa de Lisieux', 'Santa Teresa de Ávila', 'Santa Bernadette Soubirous', 'Santa Faustina Kowalska'],
    type: 'santo', difficulty: 'medio',
  },
  {
    words: ['É', 'preferível', 'uma', 'Igreja', 'acidentada,', 'ferida', 'e', 'suja', 'de', 'sair', 'pelas', 'estradas.'],
    reference: 'Papa Francisco',
    options: ['Papa Francisco', 'Bento XVI', 'São João Paulo II', 'São João XXIII'],
    type: 'papa', difficulty: 'medio',
  },
  {
    words: ['Sede', 'a', 'luz', 'do', 'mundo.', 'Não', 'se', 'pode', 'esconder', 'uma', 'cidade', 'edificada', 'sobre', 'um', 'monte.'],
    reference: 'Mateus 5:14',
    options: ['Mateus 5:14', 'João 8:12', 'João 1:9', 'Mateus 5:16'],
    type: 'versículo', difficulty: 'medio',
  },
  {
    words: ['Se', 'quiserdes', 'saber', 'se', 'amais', 'a', 'Deus,', 'vede', 'se', 'amais', 'o', 'vosso', 'próximo.'],
    reference: 'São João da Cruz',
    options: ['São João da Cruz', 'Santa Teresa de Ávila', 'São Francisco de Sales', 'São Bernardo de Claraval'],
    type: 'santo', difficulty: 'medio',
  },
  {
    words: ['A', 'cruz', 'é', 'o', 'livro', 'de', 'amor', 'mais', 'profundo', 'que', 'Deus', 'escreveu', 'para', 'nós.'],
    reference: 'São João Paulo II',
    options: ['São João Paulo II', 'São Paulo VI', 'Bento XVI', 'São João XXIII'],
    type: 'papa', difficulty: 'medio',
  },

  // ── DIFÍCIL ─────────────────────────────────────────────────────────────────
  {
    words: ['Vivo', 'eu,', 'mas', 'não', 'sou', 'mais', 'eu', 'que', 'vivo;', 'é', 'Cristo', 'que', 'vive', 'em', 'mim.'],
    reference: 'Gálatas 2:20',
    options: ['Gálatas 2:20', 'Romanos 8:10', 'Colossenses 3:3', 'Filipenses 1:21'],
    type: 'versículo', difficulty: 'dificil',
  },
  {
    words: ['O', 'próprio', 'Espírito', 'intercede', 'por', 'nós', 'com', 'gemidos', 'inefáveis.'],
    reference: 'Romanos 8:26',
    options: ['Romanos 8:26', 'João 14:16', '1 Coríntios 2:10', 'Efésios 3:16'],
    type: 'versículo', difficulty: 'dificil',
  },
  {
    words: ['Onde', 'está,', 'ó', 'morte,', 'a', 'tua', 'vitória?', 'Onde', 'está,', 'ó', 'morte,', 'o', 'teu', 'aguilhão?'],
    reference: '1 Coríntios 15:55',
    options: ['1 Coríntios 15:55', 'Oseias 13:14', 'Apocalipse 21:4', 'Romanos 6:23'],
    type: 'versículo', difficulty: 'dificil',
  },
  {
    words: ['Eu', 'sou', 'o', 'pão', 'da', 'vida;', 'aquele', 'que', 'vem', 'a', 'mim', 'jamais', 'terá', 'fome.'],
    reference: 'João 6:35',
    options: ['João 6:35', 'João 4:14', 'João 7:37', 'Apocalipse 22:17'],
    type: 'versículo', difficulty: 'dificil',
  },
  {
    words: ['Estou', 'à', 'porta', 'e', 'bato;', 'se', 'alguém', 'ouvir', 'a', 'minha', 'voz', 'e', 'abrir', 'a', 'porta,', 'entrarei.'],
    reference: 'Apocalipse 3:20',
    options: ['Apocalipse 3:20', 'João 10:9', 'Mateus 7:7', 'Lucas 11:9'],
    type: 'versículo', difficulty: 'dificil',
  },
  {
    words: ['Amai', 'e', 'fazei', 'o', 'que', 'quiserdes.'],
    reference: 'Santo Agostinho',
    options: ['Santo Agostinho', 'São Tomás de Aquino', 'São Bernardo de Claraval', 'São Cirilo de Alexandria'],
    type: 'santo', difficulty: 'dificil',
  },
  {
    words: ['A', 'graça', 'não', 'destrói', 'a', 'natureza,', 'mas', 'a', 'pressupõe', 'e', 'a', 'aperfeiçoa.'],
    reference: 'São Tomás de Aquino',
    options: ['São Tomás de Aquino', 'Santo Agostinho', 'São Boaventura', 'São Anselmo de Cantuária'],
    type: 'santo', difficulty: 'dificil',
  },
  {
    words: ['Aquele', 'que', 'canta', 'ora', 'duas', 'vezes.'],
    reference: 'Santo Agostinho',
    options: ['Santo Agostinho', 'São Gregório Magno', 'São Jerônimo', 'São Ambrósio'],
    type: 'santo', difficulty: 'dificil',
  },
  {
    words: ['O', 'homem', 'não', 'pode', 'viver', 'sem', 'amor;', 'permanece', 'para', 'si', 'mesmo', 'um', 'ser', 'incompreensível.'],
    reference: 'São João Paulo II',
    options: ['São João Paulo II', 'São Paulo VI', 'Bento XVI', 'São João XXIII'],
    type: 'papa', difficulty: 'dificil',
  },
  {
    words: ['A', 'fé', 'e', 'a', 'razão', 'são', 'como', 'as', 'duas', 'asas', 'pelas', 'quais', 'o', 'espírito', 'humano', 'se', 'eleva', 'para', 'a', 'contemplação', 'da', 'verdade.'],
    reference: 'São João Paulo II',
    options: ['São João Paulo II', 'São Paulo VI', 'Bento XVI', 'São João XXIII'],
    type: 'papa', difficulty: 'dificil',
  },
  {
    words: ['As', 'alegrias', 'e', 'as', 'esperanças,', 'as', 'tristezas', 'e', 'as', 'angústias', 'dos', 'homens', 'de', 'hoje', 'são', 'também', 'as', 'dos', 'discípulos', 'de', 'Cristo.'],
    reference: 'Gaudium et Spes',
    options: ['Gaudium et Spes', 'Lumen Gentium', 'Dei Verbum', 'Apostolicam Actuositatem'],
    type: 'documento', difficulty: 'dificil',
  },
  {
    words: ['Deus', 'é', 'espírito,', 'e', 'importa', 'que', 'os', 'que', 'o', 'adoram', 'o', 'adorem', 'em', 'espírito', 'e', 'em', 'verdade.'],
    reference: 'João 4:24',
    options: ['João 4:24', 'João 1:18', '1 João 4:16', '1 Coríntios 3:16'],
    type: 'versículo', difficulty: 'dificil',
  },
  {
    words: ['A', 'dignidade', 'da', 'pessoa', 'humana', 'exige', 'que', 'o', 'homem', 'aja', 'segundo', 'a', 'própria', 'consciência', 'e', 'o', 'seu', 'livre', 'arbítrio.'],
    reference: 'Dignitatis Humanae',
    options: ['Dignitatis Humanae', 'Gaudium et Spes', 'Lumen Gentium', 'Nostra Aetate'],
    type: 'documento', difficulty: 'dificil',
  },
  {
    words: ['A', 'Igreja', 'de', 'Cristo', 'subsiste', 'na', 'Igreja', 'Católica', 'Romana,', 'governada', 'pelo', 'sucessor', 'de', 'Pedro.'],
    reference: 'Lumen Gentium',
    options: ['Lumen Gentium', 'Gaudium et Spes', 'Unitatis Redintegratio', 'Dei Verbum'],
    type: 'documento', difficulty: 'dificil',
  },
  {
    words: ['Arrependei-vos', 'e', 'fazei-vos', 'batizar', 'cada', 'um', 'de', 'vós', 'em', 'nome', 'de', 'Jesus', 'Cristo,', 'para', 'remissão', 'dos', 'vossos', 'pecados.'],
    reference: 'Atos 2:38',
    options: ['Atos 2:38', 'Mateus 28:19', 'Marcos 16:16', 'Lucas 3:16'],
    type: 'versículo', difficulty: 'dificil',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VersiculoMisteriosoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const { packs } = useGamePacks('versiculo');
  const [phase, setPhase] = useState<Phase>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [frases, setFrases] = useState<FraseSagrada[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    if (phase === 'done' && !reported.current) {
      reported.current = true;
      const maxScore = frases.length * 5;
      reportResult({
        gameId: 'versiculo',
        score: score * 10,
        allVersesCorrect: correctCount === frases.length,
        pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      });
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, correctCount, frases.length, reportResult]);

  const startWithDifficulty = useCallback((diff: Difficulty) => {
    const allF = mergeVersiculo(ALL_FRASES, packs);
    const filtered = shuffle(allF.filter(f => f.difficulty === diff))
      .map(f => ({ ...f, options: shuffle(f.options) }));
    setDifficulty(diff);
    setFrases(filtered);
    setIdx(0);
    setRevealed(DIFFICULTY_CONFIG[diff].initialReveal);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setRoundPoints(0);
    setPhase('playing');
  }, []);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const frase = frases[idx];
  const totalWords = frase?.words.length ?? 0;
  const canRevealMore = revealed < totalWords;

  const revealMore = () => setRevealed(r => Math.min(r + 2, totalWords));
  const calcPoints = () => Math.max(5 - Math.floor(revealed / 3), 1);

  const handleGuess = useCallback(
    (opt: string) => {
      if (!frase || selected !== null) return;
      setSelected(opt);
      const correct = opt === frase.reference;
      const pts = correct ? calcPoints() : 0;
      setRoundPoints(pts);
      setScore(s => s + pts);
      if (correct) setCorrectCount(c => c + 1);
      setPhase('answered');
    },
    [selected, frase, revealed],
  );

  const next = () => {
    if (idx + 1 < frases.length) {
      setIdx(i => i + 1);
      setRevealed(cfg.initialReveal);
      setSelected(null);
      setRoundPoints(0);
      setPhase('playing');
    } else {
      setPhase('done');
    }
  };

  if (phase === 'idle') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Sabedoria Católica" subtitle="DESCOBERTA" />
          <View style={[s.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/frase_misteriosa.png')} style={s.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={s.textCenter}>Sabedoria Católica</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.textCenter, s.desc]}>
              Versículos, frases de santos, palavras dos papas e documentos da Igreja.{'\n'}Descubra a frase e ganhe pontos!
            </ThemedText>
            <ThemedView type="backgroundElement" style={s.rulesBox}>
              <ThemedText type="smallBold">PONTUAÇÃO POR RODADA</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.ruleItem}>⚡ Poucas palavras reveladas → 5 pontos</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.ruleItem}>📘 Revelação moderada → 3 pontos</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.ruleItem}>📚 Muitas palavras reveladas → 1 ponto</ThemedText>
            </ThemedView>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={s.primaryBtnText}>ESCOLHER NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'difficulty') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Sabedoria Católica" subtitle="ESCOLHA O NÍVEL" />
          <View style={[s.center, { paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }]}>
            <ThemedText type="subtitle" style={s.textCenter}>Qual nível deseja jogar?</ThemedText>
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => {
              const dc = DIFFICULTY_CONFIG[diff];
              return (
                <TouchableOpacity
                  key={diff}
                  style={[s.diffBtn, { borderColor: dc.color }]}
                  onPress={() => startWithDifficulty(diff)}
                  activeOpacity={0.8}>
                  <ThemedView type="backgroundElement" style={s.diffBtnInner}>
                    <View style={[s.diffBadge, { backgroundColor: dc.color + '22' }]}>
                      <ThemedText style={[s.diffBadgeText, { color: dc.color }]}>{dc.emoji} {dc.label}</ThemedText>
                    </View>
                    <ThemedText themeColor="textSecondary" style={s.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[s.diffCount, { color: dc.color }]}>15 frases · começa com {dc.initialReveal} palavra{dc.initialReveal > 1 ? 's' : ''}</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'done') {
    const maxScore = frases.length * 5;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const medal = pct >= 80 ? '🌟' : pct >= 50 ? '⭐' : '📖';
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Sabedoria Católica" />
          <View style={[s.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={s.bigEmoji}>{medal}</ThemedText>
            <View style={[s.diffBadge, { backgroundColor: cfg.color + '22', alignSelf: 'center' }]}>
              <ThemedText style={[s.diffBadgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText type="subtitle">{score}/{maxScore} pontos</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.textCenter, s.desc]}>
              {pct >= 80
                ? 'Você conhece bem a Sabedoria Católica!'
                : pct >= 50
                  ? 'Bom resultado! Continue mergulhando na fé.'
                  : 'Continue lendo e orando para crescer na sabedoria!'}
            </ThemedText>
            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: cfg.color }]} onPress={() => startWithDifficulty(difficulty)} activeOpacity={0.8}>
              <ThemedText style={s.primaryBtnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[s.outlineBtn, { borderColor: cfg.color }]} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={[s.outlineBtnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!frase) return null;

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader
          title="Sabedoria Católica"
          right={
            <ThemedText type="smallBold" style={{ color: cfg.color }}>
              {score} pts
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[s.playScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>

          <View style={s.progressRow}>
            <ThemedText themeColor="textSecondary" style={s.smallText}>
              {idx + 1} de {frases.length}
            </ThemedText>
            <View style={[s.diffBadge, { backgroundColor: cfg.color + '22' }]}>
              <ThemedText style={[s.diffBadgeSmall, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText style={{ color: cfg.color, fontWeight: '600', fontSize: 13 }}>
              {calcPoints()} pts possíveis
            </ThemedText>
          </View>

          <View style={[s.typeBadge, { borderColor: C.border }]}>
            <ThemedText style={s.typeBadgeText}>
              {TYPE_ICON[frase.type]} {TYPE_LABEL[frase.type]}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={s.verseCard}>
            <View style={s.wordsRow}>
              {frase.words.map((word, i) => (
                <ThemedText
                  key={i}
                  style={[
                    s.word,
                    i < revealed
                      ? s.wordVisible
                      : [s.wordHidden, { backgroundColor: theme.backgroundSelected }],
                  ]}>
                  {i < revealed ? word : '▓'.repeat(Math.max(word.replace(/[^a-zA-ZÀ-ú]/g, '').length, 3))}
                </ThemedText>
              ))}
            </View>
          </ThemedView>

          {phase === 'playing' && (
            <>
              {canRevealMore && (
                <TouchableOpacity
                  style={[s.hintBtn, { borderColor: cfg.color }]}
                  onPress={revealMore}
                  activeOpacity={0.75}>
                  <ThemedText style={{ color: cfg.color, fontWeight: '600' }}>
                    💡 Revelar mais ({revealed}/{totalWords} palavras)
                  </ThemedText>
                </TouchableOpacity>
              )}
              <ThemedText type="smallBold" style={s.guessLabel}>
                {GUESS_LABEL[frase.type]}
              </ThemedText>
              <View style={s.options}>
                {frase.options.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleGuess(opt)}
                    activeOpacity={0.75}
                    style={[s.option, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={s.optText}>{opt}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {phase === 'answered' && (
            <>
              <ThemedView
                style={[
                  s.resultCard,
                  {
                    backgroundColor: selected === frase.reference ? C.green + '22' : C.red + '22',
                    borderColor: selected === frase.reference ? C.green : C.red,
                  },
                ]}>
                <ThemedText
                  style={{
                    color: selected === frase.reference ? C.green : C.red,
                    fontWeight: '700',
                    fontSize: 15,
                  }}>
                  {selected === frase.reference
                    ? `✅ Correto! +${roundPoints} pts`
                    : `❌ Era: ${frase.reference}`}
                </ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={s.fullVerseCard}>
                <ThemedText themeColor="textSecondary" style={s.smallText}>
                  {TYPE_ICON[frase.type]} Frase completa:
                </ThemedText>
                <ThemedText style={s.fullVerseText}>{frase.words.join(' ')}</ThemedText>
                <ThemedText style={{ color: cfg.color, fontWeight: '600', marginTop: Spacing.one }}>
                  — {frase.reference}
                </ThemedText>
              </ThemedView>

              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: cfg.color }]} onPress={next} activeOpacity={0.8}>
                <ThemedText style={s.primaryBtnText}>
                  {idx + 1 === frases.length ? 'VER RESULTADO' : 'PRÓXIMO →'}
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  textCenter: { textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  bigEmoji: { fontSize: 64, lineHeight: 76 },
  gameIcon: { width: 96, height: 96 },
  rulesBox: {
    alignSelf: 'stretch',
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: C.border,
  },
  ruleItem: { fontSize: 14, marginTop: 2 },
  primaryBtn: {
    backgroundColor: C.purple,
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
  outlineBtn: {
    paddingHorizontal: Spacing.five,
    paddingVertical: 12,
    borderRadius: C.radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  diffBtn: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderRadius: C.radius.lg,
    overflow: 'hidden',
  },
  diffBtnInner: { padding: Spacing.three, gap: Spacing.one },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: C.radius.pill,
  },
  diffBadgeText: { fontSize: 13, fontWeight: '700' },
  diffBadgeSmall: { fontSize: 11, fontWeight: '700' },
  diffDesc: { fontSize: 13, lineHeight: 18 },
  diffCount: { fontSize: 12, fontWeight: '600' },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallText: { fontSize: 13 },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: C.radius.pill,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 12 },
  verseCard: {
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
  },
  wordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, rowGap: 8 },
  word: { fontSize: 16 },
  wordVisible: { fontWeight: '500' },
  wordHidden: { borderRadius: 4, paddingHorizontal: 2, color: 'transparent', overflow: 'hidden' },
  hintBtn: {
    borderWidth: 1.5,
    borderRadius: C.radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  guessLabel: { marginTop: Spacing.one },
  options: { gap: Spacing.two },
  option: {
    padding: Spacing.three,
    borderRadius: C.radius.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  optText: { fontSize: 15 },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: C.radius.md,
    padding: Spacing.three,
    alignItems: 'center',
  },
  fullVerseCard: {
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: C.border,
  },
  fullVerseText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
});
