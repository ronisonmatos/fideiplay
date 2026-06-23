import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';

const QUESTIONS = [
  {
    saint: 'São José',
    question: 'Qual era a profissão de São José, pai adotivo de Jesus?',
    options: ['Pescador', 'Carpinteiro', 'Pastor', 'Ferreiro'],
    correct: 1,
  },
  {
    saint: 'São Francisco de Assis',
    question: 'Em que cidade italiana São Francisco de Assis nasceu?',
    options: ['Roma', 'Florença', 'Assis', 'Veneza'],
    correct: 2,
  },
  {
    saint: 'Santa Teresa de Ávila',
    question: 'Qual é a obra mais famosa de Santa Teresa de Ávila?',
    options: ['A Imitação de Cristo', 'O Castelo Interior', 'As Confissões', 'A Suma Teológica'],
    correct: 1,
  },
  {
    saint: 'São Pedro',
    question: 'Qual apóstolo negou Jesus três vezes antes do canto do galo?',
    options: ['João', 'Judas', 'Tomé', 'Pedro'],
    correct: 3,
  },
  {
    saint: 'Santa Teresa de Calcutá',
    question: 'Em que país nasceu Santa Teresa de Calcutá (Madre Teresa)?',
    options: ['Índia', 'Albânia', 'Macedônia do Norte', 'Polônia'],
    correct: 2,
  },
  {
    saint: 'São Domingos',
    question: 'São Domingos de Gusmão fundou qual ordem religiosa?',
    options: ['Franciscanos', 'Jesuítas', 'Dominicanos', 'Beneditinos'],
    correct: 2,
  },
  {
    saint: 'Nossa Senhora Aparecida',
    question: 'Nossa Senhora Aparecida é padroeira de qual país?',
    options: ['Portugal', 'Argentina', 'Brasil', 'México'],
    correct: 2,
  },
  {
    saint: 'São João Bosco',
    question: 'São João Bosco é o patrono de qual grupo?',
    options: ['Pescadores', 'Médicos', 'Jovens', 'Militares'],
    correct: 2,
  },
  {
    saint: 'São Paulo',
    question: 'Qual era o nome de São Paulo antes de sua conversão?',
    options: ['Simão', 'Mateus', 'Saulo', 'Barnabé'],
    correct: 2,
  },
  {
    saint: 'São Nicolau',
    question: 'São Nicolau de Bari inspirou qual personagem popular?',
    options: ['Papai Noel', 'São Valentim', 'Coelhinho da Páscoa', 'Rei Mago'],
    correct: 0,
  },
];

type Phase = 'idle' | 'playing' | 'result';

export default function QuizSantosScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'quiz-santos',
        score: score * 10,
        perfectQuiz: score === QUESTIONS.length,
      });
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, reportResult]);

  const q = QUESTIONS[index];

  const start = () => {
    setPhase('playing');
    setIndex(0);
    setSelected(null);
    setScore(0);
  };

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null) return;
      setSelected(i);
      if (i === q.correct) setScore(s => s + 1);
    },
    [selected, q.correct],
  );

  const next = useCallback(() => {
    setSelected(null);
    if (index + 1 < QUESTIONS.length) {
      setIndex(i => i + 1);
    } else {
      setPhase('result');
    }
  }, [index]);

  const pct = Math.round((score / QUESTIONS.length) * 100);
  const medal = pct >= 80 ? '🥇' : pct >= 60 ? '🥈' : '🥉';
  const resultMsg =
    pct >= 80
      ? 'Excelente! Você conhece muito sobre os Santos!'
      : pct >= 60
        ? 'Bom trabalho! Continue aprendendo.'
        : 'Continue estudando a vida dos Santos!';

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz dos Santos" subtitle="CONHECIMENTO" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/quiz.png')} style={styles.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={styles.textCenter}>
              Quiz dos Santos
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {QUESTIONS.length} perguntas sobre a vida dos santos.{'\n'}Teste seu conhecimento!
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>COMEÇAR</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz dos Santos" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <ThemedText type="subtitle">
              {score}/{QUESTIONS.length} acertos
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {resultMsg}
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Quiz dos Santos"
          right={
            <ThemedText type="smallBold" style={{ color: C.purple }}>
              {score} pts
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[
            styles.playScroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${((index + 1) / QUESTIONS.length) * 100}%` },
              ]}
            />
          </View>
          <ThemedText themeColor="textSecondary" style={styles.progressLabel}>
            {index + 1} de {QUESTIONS.length}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.saintBadge}>
            <ThemedText style={styles.saintBadgeText}>👤 {q.saint}</ThemedText>
          </ThemedView>

          <ThemedText style={styles.questionText}>{q.question}</ThemedText>

          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isCorrect = i === q.correct;
              const isSelected = i === selected;
              const revealed = selected !== null;

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
            <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>
                {index + 1 === QUESTIONS.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
              </ThemedText>
            </TouchableOpacity>
          )}
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
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  textCenter: { textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  bigEmoji: { fontSize: 64, lineHeight: 76 },
  gameIcon: { width: 96, height: 96 },
  primaryBtn: {
    backgroundColor: C.purple,
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    marginTop: Spacing.two,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.purple, borderRadius: 3 },
  progressLabel: { fontSize: 13, textAlign: 'right', marginTop: -Spacing.one },
  saintBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: C.radius.pill,
    borderWidth: 1,
    borderColor: C.border,
  },
  saintBadgeText: { fontSize: 13 },
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
  nextBtn: {
    backgroundColor: C.purple,
    padding: Spacing.three,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
});
