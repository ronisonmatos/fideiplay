import { useCallback, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';

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
      { question: 'Quantas aparições ocorreram em Fátima?', options: ['3', '5', '6', '12'], correct: 2 },
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
      { question: 'O que tornou Lourdes famoso mundialmente?', options: ['Relíquias', 'A água milagrosa', 'Um grande templo', 'Um tesouro'], correct: 1 },
    ],
  },
  {
    emoji: '🇮🇱',
    name: 'Jerusalém',
    country: 'Israel',
    description: 'A Cidade Santa, onde Jesus viveu, morreu e ressuscitou.',
    questions: [
      { question: 'Qual é o nome da colina onde Jesus foi crucificado?', options: ['Monte Sião', 'Gólgota (Calvário)', 'Monte das Oliveiras', 'Monte Sinai'], correct: 1 },
      { question: 'Qual rio Jesus foi batizado por João Batista?', options: ['Rio Nilo', 'Rio Eufrates', 'Rio Jordão', 'Rio Tigre'], correct: 2 },
      { question: 'Qual é a principal basílica em Jerusalém?', options: ['São Pedro', 'Santo Sepulcro', 'Natividade', 'Anunciação'], correct: 1 },
    ],
  },
  {
    emoji: '🇻🇦',
    name: 'Vaticano',
    country: 'Vaticano',
    description: 'O coração da Igreja Católica, onde está o túmulo de São Pedro.',
    questions: [
      { question: 'Quem é enterrado sob a Basílica de São Pedro?', options: ['São Paulo', 'São Pedro', 'Jesus Cristo', 'Papa João Paulo II'], correct: 1 },
      { question: 'Quem pintou o teto da Capela Sistina?', options: ['Leonardo da Vinci', 'Rafael', 'Michelangelo', 'Botticelli'], correct: 2 },
      { question: 'Qual é o menor país do mundo, onde fica o Vaticano?', options: ['Mônaco', 'San Marino', 'Vaticano', 'Liechtenstein'], correct: 2 },
    ],
  },
];

type Screen = 'map' | 'quiz' | 'result';

export default function PeregrinacaoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const [unlocked, setUnlocked] = useState(1);
  const [screen, setScreen] = useState<Screen>('map');
  const [activeSanctuary, setActiveSanctuary] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const reportedSanctuaries = useRef<Set<number>>(new Set());

  const sanctuary = SANCTUARIES[activeSanctuary];
  const q = sanctuary.questions[qIndex];

  const enterSanctuary = (idx: number) => {
    setActiveSanctuary(idx);
    setQIndex(0);
    setSelected(null);
    setCorrect(0);
    setScreen('quiz');
  };

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null) return;
      setSelected(i);
      if (i === q.correct) setCorrect(c => c + 1);
    },
    [selected, q.correct],
  );

  const nextQ = () => {
    setSelected(null);
    if (qIndex + 1 < sanctuary.questions.length) {
      setQIndex(qi => qi + 1);
    } else {
      setScreen('result');
    }
  };

  const finishSanctuary = () => {
    const passed = correct >= 2;
    let nextUnlocked = unlocked;
    if (passed && activeSanctuary + 1 >= unlocked) {
      nextUnlocked = Math.min(unlocked + 1, SANCTUARIES.length);
      setUnlocked(nextUnlocked);
    }
    if (!reportedSanctuaries.current.has(activeSanctuary)) {
      reportedSanctuaries.current.add(activeSanctuary);
      reportResult({
        gameId: 'peregrinacao',
        score: correct * 10,
        pilgrimComplete: nextUnlocked >= SANCTUARIES.length,
      });
    }
    setScreen('map');
  };

  if (screen === 'quiz') {
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
                Pergunta {qIndex + 1} de {sanctuary.questions.length}
              </ThemedText>
              <ThemedText style={{ color: C.green, fontWeight: '600', fontSize: 13 }}>
                {correct} corretas
              </ThemedText>
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
                  {qIndex + 1 === sanctuary.questions.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
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
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Peregrinação Virtual" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{passed ? '🎉' : '🙏'}</ThemedText>
            <ThemedText type="subtitle" style={styles.textCenter}>
              {sanctuary.emoji} {sanctuary.name}
            </ThemedText>
            <ThemedText
              style={[
                styles.textCenter,
                { fontSize: 16, color: passed ? C.green : C.red, fontWeight: '700' },
              ]}>
              {correct}/{sanctuary.questions.length} acertos
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {passed
                ? activeSanctuary + 1 < SANCTUARIES.length
                  ? 'Próximo santuário desbloqueado! Continue a peregrinação.'
                  : 'Parabéns! Você completou a peregrinação!'
                : 'Acerte pelo menos 2 perguntas para avançar.'}
            </ThemedText>
            <TouchableOpacity style={styles.greenBtn} onPress={finishSanctuary} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>VOLTAR AO MAPA</ThemedText>
            </TouchableOpacity>
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
            Percorra santuários respondendo perguntas para avançar no mapa.
          </ThemedText>
          <View style={styles.journeyList}>
            {SANCTUARIES.map((s, idx) => {
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
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
});
