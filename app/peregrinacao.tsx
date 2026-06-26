import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeSanctuaries } from '@/hooks/use-game-packs';
import { supabase } from '@/lib/supabase';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface Sanctuary {
  emoji: string;
  name: string;
  country: string;
  description: string;
  questions: Question[];
}

const SANCTUARIES: Sanctuary[] = [
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestion(q: Question): Question {
  const correctAnswer = q.options[q.correct];
  const shuffled = shuffle(q.options);
  return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
}

type Screen = 'map' | 'quiz' | 'result';

export default function PeregrinacaoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const { user, refreshProfile } = useAuth();
  const { packs } = useGamePacks('peregrinacao');
  const allSanctuaries = useMemo(() => mergeSanctuaries(SANCTUARIES, packs), [packs]);
  const [unlocked, setUnlocked] = useState(1);
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [screen, setScreen] = useState<Screen>('map');
  const [activeSanctuary, setActiveSanctuary] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const reportedSanctuaries = useRef<Set<number>>(new Set());
  const coinsAwardedRef = useRef<Set<number>>(new Set());

  const sanctuary = allSanctuaries[activeSanctuary];
  const q = shuffledQuestions[qIndex];

  // Award coins when result screen appears (before user taps back)
  useEffect(() => {
    if (screen !== 'result' || coinsAwardedRef.current.has(activeSanctuary) || !user?.id) return;
    const passed = correct >= 2;
    if (!passed) return;
    coinsAwardedRef.current.add(activeSanctuary);
    const nextUnlockedCalc = activeSanctuary + 1 >= unlocked
      ? Math.min(unlocked + 1, allSanctuaries.length)
      : unlocked;
    const isComplete = nextUnlockedCalc >= allSanctuaries.length;
    const coins = ECONOMY.COMPLETAR_QUIZ + (isComplete ? ECONOMY.COMPLETAR_TRILHA_INTEIRA : 0);
    supabase.rpc('add_coins', { p_user_id: user.id, p_amount: coins })
      .then(() => { setCoinsEarned(coins); refreshProfile(); })
      .catch(() => {});
  }, [screen, correct, activeSanctuary, unlocked, allSanctuaries.length, user, refreshProfile]);

  const enterSanctuary = (idx: number) => {
    setActiveSanctuary(idx);
    setShuffledQuestions(allSanctuaries[idx].questions.map(shuffleQuestion));
    setQIndex(0);
    setSelected(null);
    setCorrect(0);
    setCoinsEarned(null);
    setScreen('quiz');
  };

  const handleSelect = useCallback(
    (i: number) => {
      if (!q || selected !== null) return;
      setSelected(i);
      if (i === q.correct) setCorrect(c => c + 1);
    },
    [selected, q],
  );

  const nextQ = () => {
    setSelected(null);
    if (qIndex + 1 < shuffledQuestions.length) {
      setQIndex(qi => qi + 1);
    } else {
      setScreen('result');
    }
  };

  const finishSanctuary = () => {
    const passed = correct >= 2;
    let nextUnlocked = unlocked;
    if (passed && activeSanctuary + 1 >= unlocked) {
      nextUnlocked = Math.min(unlocked + 1, allSanctuaries.length);
      setUnlocked(nextUnlocked);
    }
    if (!reportedSanctuaries.current.has(activeSanctuary)) {
      reportedSanctuaries.current.add(activeSanctuary);
      const isComplete = nextUnlocked >= allSanctuaries.length;
      reportResult({ gameId: 'peregrinacao', score: correct * ECONOMY.XP_MEDIO, pilgrimComplete: isComplete });
    }
    setScreen('map');
  };

  if (screen === 'quiz') {
    if (!q) return null;
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title={sanctuary.name} subtitle={`${sanctuary.emoji} ${sanctuary.country}`} />
          <ScrollView
            contentContainerStyle={[
              styles.playScroll,
              { paddingBottom: BottomTabInset + Spacing.four },
            ]}>
            <View style={styles.progressRow}>
              <ThemedText themeColor="textSecondary" style={styles.smallText}>
                Pergunta {qIndex + 1} de {shuffledQuestions.length}
              </ThemedText>
              <ThemedText style={{ color: C.green, fontWeight: '600', fontSize: 13 }}>
                {correct} corretas
              </ThemedText>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((qIndex + 1) / shuffledQuestions.length) * 100}%` },
                ]}
              />
            </View>
            <ThemedText style={styles.questionText}>{q.question}</ThemedText>
            <View style={styles.options}>
              {q.options.map((opt, i) => {
                const revealed = selected !== null;
                const isCorrect = i === q.correct;
                const isSelected = i === selected;
                let bg: string = theme.backgroundElement;
                let textColor: string = theme.text;
                let borderColor: string = C.border;
                if (revealed) {
                  if (isCorrect) { bg = C.green; textColor = '#fff'; borderColor = C.green; }
                  else if (isSelected) { bg = C.red; textColor = '#fff'; borderColor = C.red; }
                }
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSelect(i)}
                    activeOpacity={0.75}
                    style={[styles.option, { backgroundColor: bg, borderColor }]}>
                    <ThemedText style={[styles.optLetter, { color: textColor }]}>
                      {String.fromCharCode(65 + i)}
                    </ThemedText>
                    <ThemedText style={[styles.optText, { color: textColor }]}>{opt}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selected !== null && (
              <TouchableOpacity style={styles.greenBtn} onPress={nextQ} activeOpacity={0.8}>
                <ThemedText style={styles.btnText}>
                  {qIndex + 1 === shuffledQuestions.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (screen === 'result') {
    const passed = correct >= 2;
    const isLastSanctuary = activeSanctuary + 1 >= allSanctuaries.length;
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Peregrinação Virtual" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{passed ? (isLastSanctuary ? '🏆' : '🎉') : '🙏'}</ThemedText>
            <ThemedText type="subtitle" style={styles.textCenter}>
              {sanctuary.emoji} {sanctuary.name}
            </ThemedText>
            <ThemedText
              style={[
                styles.textCenter,
                { fontSize: 16, color: passed ? C.green : C.red, fontWeight: '700' },
              ]}>
              {correct}/{shuffledQuestions.length} acertos
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {passed
                ? isLastSanctuary
                  ? 'Parabéns! Você completou toda a Peregrinação Virtual!'
                  : 'Próximo santuário desbloqueado! Continue a peregrinação.'
                : 'Acerte pelo menos 2 perguntas para avançar.'}
            </ThemedText>
            {passed && <GameRewardBanner xp={correct * ECONOMY.XP_MEDIO} coins={coinsEarned} />}
            <TouchableOpacity style={styles.greenBtn} onPress={finishSanctuary} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>VOLTAR AO MAPA</ThemedText>
            </TouchableOpacity>
            {!passed && (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: C.green }]}
                onPress={() => enterSanctuary(activeSanctuary)}
                activeOpacity={0.8}>
                <ThemedText style={[styles.outlineBtnText, { color: C.green }]}>TENTAR NOVAMENTE</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader title="Peregrinação Virtual" subtitle="AVENTURA" />
        <ScrollView
          contentContainerStyle={[
            styles.mapScroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <Image source={require('@/assets/images/peregrinacao.png')} style={styles.mapIcon} resizeMode="contain" />
          <ThemedText themeColor="textSecondary" style={styles.mapSubtitle}>
            Percorra {allSanctuaries.length} santuários respondendo perguntas para avançar no mapa.
          </ThemedText>
          <View style={styles.journeyList}>
            {allSanctuaries.map((s, idx) => {
              const isUnlocked = idx < unlocked;
              const isCompleted = idx < unlocked - 1;
              return (
                <View key={s.name} style={styles.journeyItem}>
                  {idx > 0 && (
                    <View style={styles.connector}>
                      <View
                        style={[
                          styles.connectorLine,
                          { backgroundColor: isUnlocked ? C.green : theme.backgroundElement },
                        ]}
                      />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => isUnlocked && enterSanctuary(idx)}
                    activeOpacity={isUnlocked ? 0.75 : 1}>
                    <ThemedView
                      type="backgroundElement"
                      style={[
                        styles.sanctuaryCard,
                        isCompleted && styles.completedCard,
                        !isUnlocked && styles.lockedCard,
                      ]}>
                      <ThemedText style={styles.sanctuaryEmoji}>{s.emoji}</ThemedText>
                      <View style={styles.sanctuaryInfo}>
                        <ThemedText type="smallBold" style={[!isUnlocked && { opacity: 0.4 }]}>
                          {s.name}
                        </ThemedText>
                        <ThemedText
                          themeColor="textSecondary"
                          style={[styles.smallText, !isUnlocked && { opacity: 0.4 }]}>
                          {s.country}
                        </ThemedText>
                        {isUnlocked && !isCompleted && (
                          <ThemedText style={styles.smallText} themeColor="textSecondary">
                            {s.description}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText style={styles.statusIcon}>
                        {isCompleted ? '✅' : isUnlocked ? '▶️' : '🔒'}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  textCenter: { textAlign: 'center' },
  bigEmoji: { fontSize: 64, lineHeight: 76 },
  mapIcon: { width: 72, height: 72, alignSelf: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  mapScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  mapSubtitle: { fontSize: 14, lineHeight: 20 },
  journeyList: { gap: 0 },
  journeyItem: {},
  connector: { alignItems: 'center', height: 28, justifyContent: 'center', marginLeft: 36 },
  connectorLine: { width: 2, flex: 1 },
  sanctuaryCard: {
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
  },
  completedCard: { borderWidth: 1, borderColor: C.green + '55' },
  lockedCard: { opacity: 0.6 },
  sanctuaryEmoji: { fontSize: 32, lineHeight: 42, width: 44, textAlign: 'center' },
  sanctuaryInfo: { flex: 1, gap: 2 },
  statusIcon: { fontSize: 22, lineHeight: 30 },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: -Spacing.one },
  progressFill: { height: 6, backgroundColor: C.green, borderRadius: 3 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallText: { fontSize: 13 },
  questionText: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  options: { gap: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: C.radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  optLetter: { fontSize: 14, fontWeight: '700', width: 22 },
  optText: { flex: 1, fontSize: 15 },
  greenBtn: {
    backgroundColor: C.green,
    padding: Spacing.three,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.one,
    alignSelf: 'stretch',
  },
  outlineBtn: {
    paddingHorizontal: Spacing.five,
    paddingVertical: 12,
    borderRadius: C.radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
});
