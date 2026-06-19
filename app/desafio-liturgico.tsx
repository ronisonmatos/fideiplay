import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';

interface LiturgQuestion {
  question: string;
  options: string[];
  correct: number;
  hint: string;
}

const QUESTIONS: LiturgQuestion[] = [
  { question: 'Qual é a cor litúrgica do Tempo do Advento?', options: ['Verde', 'Vermelho', 'Roxo (Violeta)', 'Branco'], correct: 2, hint: 'Tempo de penitência e espera.' },
  { question: 'Qual é a cor litúrgica do Tempo de Natal?', options: ['Vermelho', 'Branco/Dourado', 'Roxo', 'Verde'], correct: 1, hint: 'Celebração e alegria do nascimento.' },
  { question: 'Qual é a cor litúrgica da Quaresma?', options: ['Branco', 'Verde', 'Azul', 'Roxo (Violeta)'], correct: 3, hint: '40 dias de jejum e conversão.' },
  { question: 'Qual é a cor litúrgica do Tempo Pascal (Páscoa)?', options: ['Branco/Dourado', 'Vermelho', 'Roxo', 'Verde'], correct: 0, hint: 'Ressurreição e glória.' },
  { question: 'Qual é a cor litúrgica do Tempo Comum?', options: ['Azul', 'Verde', 'Branco', 'Amarelo'], correct: 1, hint: 'Crescimento e esperança na fé.' },
  { question: 'Qual é a cor usada em Pentecostes e festas de mártires?', options: ['Roxo', 'Laranja', 'Vermelho', 'Dourado'], correct: 2, hint: 'Fogo do Espírito Santo e sangue dos mártires.' },
  { question: 'Quantos sacramentos existem na Igreja Católica?', options: ['5', '6', '7', '10'], correct: 2, hint: 'Número sacramental completo.' },
  { question: 'Qual é o primeiro sacramento da iniciação cristã?', options: ['Eucaristia', 'Crisma', 'Batismo', 'Penitência'], correct: 2, hint: 'Morte e ressurreição com Cristo.' },
  { question: 'Qual período litúrgico vem antes da Páscoa?', options: ['Advento', 'Natal', 'Quaresma', 'Pentecostes'], correct: 2, hint: 'Preparação para a maior festa cristã.' },
  { question: 'A Solenidade de Corpus Christi celebra o quê?', options: ['A Ressurreição', 'A Eucaristia', 'O Espírito Santo', 'A Natividade'], correct: 1, hint: '"Corpo de Cristo" em latim.' },
];

const TOTAL_TIME = 60;
type Phase = 'idle' | 'playing' | 'result';

export default function DesafioLiturgicoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reported = useRef(false);
  const finalTimeRef = useRef(TOTAL_TIME);

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'desafio-liturgico',
        score: score * 10,
        liturgyTimeLeft: finalTimeRef.current,
      });
    }
    if (phase === 'playing') {
      reported.current = false;
      finalTimeRef.current = TOTAL_TIME;
    }
  }, [phase, score, reportResult]);

  const q = QUESTIONS[index];

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const endGame = useCallback((remainingTime?: number) => {
    stopTimer();
    if (remainingTime !== undefined) finalTimeRef.current = remainingTime;
    setPhase('result');
  }, [stopTimer]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { endGame(0); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, endGame, stopTimer]);

  const start = () => {
    setPhase('playing');
    setIndex(0);
    setSelected(null);
    setScore(0);
    setTimeLeft(TOTAL_TIME);
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
    if (index + 1 < QUESTIONS.length) { setIndex(ix => ix + 1); }
    else { endGame(timeLeft); }
  }, [index, timeLeft, endGame]);

  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft > 20 ? '#10B981' : timeLeft > 10 ? '#F59E0B' : '#EF4444';

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" subtitle="Liturgia" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>⏱️</ThemedText>
            <ThemedText type="subtitle" style={styles.textCenter}>Desafio Litúrgico</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {QUESTIONS.length} perguntas sobre o calendário litúrgico.{'\n'}Você tem {TOTAL_TIME} segundos!
            </ThemedText>
            <TouchableOpacity style={styles.redBtn} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>Iniciar Desafio</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    const medal = pct >= 80 ? '🏆' : pct >= 50 ? '✝️' : '📿';
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <ThemedText type="subtitle">{score}/{QUESTIONS.length} acertos</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {pct >= 80 ? 'Excelente! Você domina a liturgia!' : pct >= 50 ? 'Bom resultado! Continue aprendendo.' : 'Estude mais sobre o calendário litúrgico!'}
            </ThemedText>
            <TouchableOpacity style={styles.redBtn} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>Jogar Novamente</ThemedText>
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
          title="Desafio Litúrgico"
          right={
            <ThemedText type="smallBold" style={{ color: timerColor, fontSize: 18 }}>
              {timeLeft}s
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[
            styles.playScroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <View style={[styles.timerBar, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.timerFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
          </View>
          <View style={styles.progressRow}>
            <ThemedText themeColor="textSecondary" style={styles.smallText}>
              {index + 1}/{QUESTIONS.length}
            </ThemedText>
            <ThemedText style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>
              {score} acertos
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
              if (revealed) {
                if (isCorrect) { bg = '#22C55E'; textColor = '#fff'; }
                else if (isSelected) { bg = '#EF4444'; textColor = '#fff'; }
              }
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelect(i)}
                  activeOpacity={0.75}
                  style={[styles.option, { backgroundColor: bg }]}>
                  <ThemedText style={[styles.optLetter, { color: textColor }]}>
                    {String.fromCharCode(65 + i)}
                  </ThemedText>
                  <ThemedText style={[styles.optText, { color: textColor }]}>{opt}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          {selected !== null && (
            <>
              <ThemedView type="backgroundElement" style={styles.hintBox}>
                <ThemedText themeColor="textSecondary" style={styles.hintLabel}>💡 Dica:</ThemedText>
                <ThemedText style={styles.hintText}>{q.hint}</ThemedText>
              </ThemedView>
              <TouchableOpacity style={styles.redBtn} onPress={next} activeOpacity={0.8}>
                <ThemedText style={styles.btnText}>
                  {index + 1 === QUESTIONS.length ? 'Ver Resultado' : 'Próxima →'}
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  textCenter: { textAlign: 'center' },
  bigEmoji: { fontSize: 64 },
  desc: { fontSize: 15, lineHeight: 22 },
  redBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 99,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.one,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  timerBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: 8, borderRadius: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -Spacing.one },
  smallText: { fontSize: 13 },
  questionText: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  options: { gap: Spacing.two },
  option: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.two },
  optLetter: { fontSize: 14, fontWeight: '700', width: 22 },
  optText: { flex: 1, fontSize: 15 },
  hintBox: { borderRadius: Spacing.two, padding: Spacing.three, gap: 4 },
  hintLabel: { fontSize: 12 },
  hintText: { fontSize: 14, fontStyle: 'italic' },
});
