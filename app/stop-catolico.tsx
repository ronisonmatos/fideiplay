import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';

const BRAND = '#EF9F27';
const TIMER_DURATION = 90;

const CATEGORIES = [
  { key: 'santo', label: 'Santo ou Santa', emoji: '🙏' },
  { key: 'livro', label: 'Livro da Bíblia', emoji: '📖' },
  { key: 'oracao', label: 'Oração Católica', emoji: '🤲' },
  { key: 'virtude', label: 'Virtude Cristã', emoji: '✨' },
  { key: 'apostolo', label: 'Apóstolo ou Discípulo', emoji: '👤' },
  { key: 'cidade', label: 'Cidade Bíblica', emoji: '🏙️' },
] as const;

type CatKey = (typeof CATEGORIES)[number]['key'];

const LETTERS = ['A','B','C','D','E','F','G','H','J','L','M','N','P','R','S','T','V'];

const HINTS: Record<string, Record<CatKey, string>> = {
  A: { santo:'André, Ana, Agostinho', livro:'Atos, Amós, Abdias', oracao:'Ave-Maria, Ângelus', virtude:'Amor, Alegria', apostolo:'André', cidade:'Antioquia, Alexandria' },
  B: { santo:'Benedito, Bernardo, Bárbara', livro:'Baruc', oracao:'Bênção apostólica', virtude:'Bondade, Benevolência', apostolo:'Bartolomeu, Barnabé', cidade:'Belém, Babilônia' },
  C: { santo:'Clara, Carlos Borromeu, Cecília', livro:'Colossenses, Crônicas, Cânticos', oracao:'Credo, Confiteor', virtude:'Caridade, Castidade', apostolo:'Cefas (Pedro)', cidade:'Cafarnaum, Corinto' },
  D: { santo:'Domingos, Damião, Diniz', livro:'Daniel, Deuteronômio', oracao:'Deus vos salve', virtude:'Diligência, Devoção', apostolo:'Diácono Estevão', cidade:'Damasco' },
  E: { santo:'Estevão, Efrem, Eduviges', livro:'Efésios, Ester, Êxodo, Ezequiel', oracao:'Exultet', virtude:'Esperança, Equanimidade', apostolo:'Epafrodito', cidade:'Éfeso, Emaús' },
  F: { santo:'Francisco, Faustina, Felipe Néri', livro:'Filipenses, Filemom', oracao:'Fiat (Haja em mim)', virtude:'Fé, Fortaleza, Fraternidade', apostolo:'Filipe', cidade:'Filipos' },
  G: { santo:'Gregório, Gertrudes, Gabriel', livro:'Gênesis, Gálatas', oracao:'Glória, Graças (ação de)', virtude:'Generosidade, Gratidão', apostolo:'(raro)', cidade:'Galileia, Getsêmani' },
  H: { santo:'Helena, Henrique, Hilário', livro:'Hebreus, Habacuc, Hageu', oracao:'Hora Santa', virtude:'Humildade, Honestidade', apostolo:'Hermas', cidade:'Hebron, Hermon' },
  J: { santo:'João, José, Jacinta, Jerônimo', livro:'João, Josué, Jeremias, Jó, Jonas', oracao:'Jaculatória', virtude:'Justiça', apostolo:'João, Judas Tadeu, Jacó', cidade:'Jerusalém, Jericó' },
  L: { santo:'Luís, Luzia, Lourenço', livro:'Lucas, Levítico, Lamentações', oracao:'Ladainha, Laudes', virtude:'Lealdade, Largueza', apostolo:'Levi (Mateus)', cidade:'Laodiceia' },
  M: { santo:'Maria, Marcos, Martinho, Madalena', livro:'Marcos, Mateus, Miquéias', oracao:'Magnificat, Miserere', virtude:'Mansidão, Misericórdia', apostolo:'Mateus, Matias', cidade:'Macedônia, Magdala' },
  N: { santo:'Nicolau, Norberto', livro:'Números, Naum, Neemias', oracao:'Novena', virtude:'Nobreza', apostolo:'Natanael (Bartolomeu)', cidade:'Nínive, Nazaré' },
  P: { santo:'Paulo, Pedro, Pio, Patrícia', livro:'1 e 2 Pedro, Provérbios', oracao:'Pai-Nosso, Páter-Nóster', virtude:'Paciência, Paz, Prudência', apostolo:'Pedro, Filipe', cidade:'Palestina, Patmos' },
  R: { santo:'Rita, Rosa, Raimundo', livro:'Romanos, Rute', oracao:'Rosário, Regina Caeli', virtude:'Respeito, Reverência', apostolo:'Rafael (arcanjo)', cidade:'Roma, Ramá' },
  S: { santo:'Sebastião, Sara, Simeão', livro:'Salmos, Samuel, Sofonias', oracao:'Salve-Rainha, Sanctus', virtude:'Santidade, Sabedoria', apostolo:'Simão Pedro, Simão Zelote', cidade:'Sião, Samaria' },
  T: { santo:'Teresa, Tomás, Timóteo', livro:'1/2 Timóteo, Tito, Tobias', oracao:'Te Deum, Terço', virtude:'Templança, Tenacidade', apostolo:'Tomé, Tadeu', cidade:'Tessalônica, Tiro' },
  V: { santo:'Valentim, Virgílio', livro:'(desafio!)', oracao:'Vésperas, Via-Sacra', virtude:'Vigilância, Virtude', apostolo:'(desafio!)', cidade:'(desafio!)' },
};

type Phase = 'idle' | 'spinning' | 'playing' | 'result';

export default function StopCatolicoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [letter, setLetter] = useState('A');
  const [answers, setAnswers] = useState<Partial<Record<CatKey, string>>>({});
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<Partial<Record<CatKey, TextInput | null>>>({});
  const reported = useRef(false);
  const [spinLetter, setSpinLetter] = useState('A');
  const [spinDone, setSpinDone] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spinTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const targetLetterRef = useRef('A');

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const clearSpinTimeouts = useCallback(() => {
    spinTimeoutsRef.current.forEach(clearTimeout);
    spinTimeoutsRef.current = [];
  }, []);

  const skipSpin = useCallback(() => {
    clearSpinTimeouts();
    setSpinLetter(targetLetterRef.current);
    setSpinDone(true);
    scaleAnim.setValue(1);
    const t = setTimeout(() => setPhase('playing'), 400);
    spinTimeoutsRef.current.push(t);
  }, [clearSpinTimeouts, scaleAnim]);

  const validCount = CATEGORIES.filter(c => {
    const a = answers[c.key]?.trim() ?? '';
    return a.length > 0 && a[0].toUpperCase() === letter;
  }).length;
  const score = validCount * 10 + (validCount === CATEGORIES.length ? 20 : 0);

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'stop-catolico',
        score,
        allStopFilled: validCount === CATEGORIES.length,
      });
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, validCount, reportResult]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); setPhase('result'); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, stopTimer]);

  useEffect(() => () => clearSpinTimeouts(), [clearSpinTimeouts]);

  const start = useCallback(() => {
    clearSpinTimeouts();
    scaleAnim.setValue(1);
    setSpinDone(false);

    const targetIdx = Math.floor(Math.random() * LETTERS.length);
    const targetLetter = LETTERS[targetIdx];
    targetLetterRef.current = targetLetter;
    setLetter(targetLetter);
    setAnswers({});
    setTimeLeft(TIMER_DURATION);

    const LC = LETTERS.length;
    const phases = [
      { count: 10, ms: 60 },
      { count: 8, ms: 110 },
      { count: 5, ms: 200 },
      { count: 3, ms: 380 },
    ];
    const totalSteps = phases.reduce((s, p) => s + p.count, 0);
    const startIdx = ((targetIdx - (totalSteps - 1)) % LC + LC) % LC;

    let idx = startIdx;
    let t = 0;
    let lastT = 0;
    const refs = spinTimeoutsRef.current;

    for (const { count, ms } of phases) {
      for (let i = 0; i < count; i++) {
        const l = LETTERS[idx % LC];
        const captT = t;
        const peakScale = 1 + (ms / 380) * 0.18;
        refs.push(setTimeout(() => {
          setSpinLetter(l);
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: peakScale, duration: ms * 0.3, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: ms * 0.7, useNativeDriver: true }),
          ]).start();
        }, captT));
        lastT = t;
        t += ms;
        idx = (idx + 1) % LC;
      }
    }

    refs.push(setTimeout(() => {
      setSpinDone(true);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.45, duration: 280, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      ]).start();
    }, lastT));

    refs.push(setTimeout(() => setPhase('playing'), lastT + 1100));

    setPhase('spinning');
  }, [clearSpinTimeouts, scaleAnim]);

  const callStop = useCallback(() => { stopTimer(); setPhase('result'); }, [stopTimer]);

  const setAnswer = useCallback((key: CatKey, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const isValid = useCallback((key: CatKey): boolean => {
    const a = answers[key]?.trim() ?? '';
    return a.length > 0 && a[0].toUpperCase() === letter;
  }, [answers, letter]);

  const timerPct = (timeLeft / TIMER_DURATION) * 100;
  const timerColor = timeLeft > 30 ? C.green : timeLeft > 15 ? C.gold : C.red;

  if (phase === 'spinning') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Stop Católico" subtitle="VOCABULÁRIO" />
          <TouchableOpacity style={styles.spinScreen} onPress={skipSpin} activeOpacity={1}>
            <ThemedText themeColor="textSecondary" style={styles.spinLabel}>
              {spinDone ? 'Sua letra é:' : 'Sorteando...'}
            </ThemedText>
            <Animated.View
              style={[styles.spinCircle, { backgroundColor: BRAND, transform: [{ scale: scaleAnim }] }]}>
              <ThemedText style={styles.spinLetterText}>{spinLetter}</ThemedText>
            </Animated.View>
            {spinDone ? (
              <ThemedText style={[styles.spinGoText, { color: BRAND }]}>Prepare-se! 🚀</ThemedText>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.spinSkipHint}>Toque para pular</ThemedText>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Stop Católico" subtitle="VOCABULÁRIO" />
          <ScrollView contentContainerStyle={[styles.idleScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.heroEmoji}>🛑</ThemedText>
            <ThemedText type="subtitle" style={styles.center}>Stop Católico</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.center, styles.desc]}>
              Uma letra é sorteada e você tem {TIMER_DURATION} segundos para preencher as 6 categorias com palavras da fé que começem com ela.
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.catList}>
              {CATEGORIES.map(c => (
                <View key={c.key} style={styles.catRow}>
                  <ThemedText style={styles.catEmoji}>{c.emoji}</ThemedText>
                  <ThemedText type="small">{c.label}</ThemedText>
                </View>
              ))}
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.rulesBox}>
              <ThemedText type="smallBold" style={styles.rulesTitle}>PONTUAÇÃO</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ruleItem}>✅  +10 pts por resposta válida</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ruleItem}>🌟  +20 pts bônus ao completar tudo</ThemedText>
            </ThemedView>

            {/* ── Seleção de Modo ── */}
            <ThemedText themeColor="textSecondary" style={styles.modeLabel}>ESCOLHA O MODO</ThemedText>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeCard, { backgroundColor: BRAND }]}
                onPress={start}
                activeOpacity={0.8}>
                <ThemedText style={styles.modeEmoji}>🎲</ThemedText>
                <ThemedText style={styles.modeTitle}>Jogar Solo</ThemedText>
                <ThemedText style={styles.modeDesc}>Contra o sistema</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeCard, { backgroundColor: C.purple }]}
                onPress={() => router.push('/stop-online')}
                activeOpacity={0.8}>
                <ThemedText style={styles.modeEmoji}>🌐</ThemedText>
                <ThemedText style={styles.modeTitle}>Jogar Online</ThemedText>
                <ThemedText style={styles.modeDesc}>Com outros jogadores</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    const medal = score >= 60 ? '🏆' : score >= 30 ? '🎖️' : '📿';
    const msg = score >= 60 ? 'Excelente vocabulário da fé!' : score >= 30 ? 'Bom resultado! Continue praticando.' : 'Estude mais o vocabulário católico!';
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Stop Católico" />
          <ScrollView contentContainerStyle={[styles.resultScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={styles.resultSummary}>
              <View style={[styles.letterCircle, { backgroundColor: BRAND }]}>
                <ThemedText style={styles.letterCircleText}>{letter}</ThemedText>
              </View>
              <View style={styles.resultSummaryText}>
                <ThemedText style={{ fontSize: 40 }}>{medal}</ThemedText>
                <ThemedText type="subtitle">{score} pts</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                  {validCount}/{CATEGORIES.length} válidas{validCount === CATEGORIES.length ? ' + bônus 🌟' : ''}
                </ThemedText>
              </View>
            </View>
            <ThemedText themeColor="textSecondary" style={[styles.center, { fontSize: 14 }]}>{msg}</ThemedText>
            {CATEGORIES.map(c => {
              const answer = (answers[c.key] ?? '').trim();
              const valid = isValid(c.key);
              const hint = HINTS[letter]?.[c.key];
              return (
                <ThemedView key={c.key} type="backgroundElement" style={styles.resultCard}>
                  <View style={styles.resultCardTop}>
                    <ThemedText style={styles.catEmoji}>{c.emoji}</ThemedText>
                    <ThemedText type="smallBold" style={{ flex: 1 }}>{c.label}</ThemedText>
                    <ThemedText style={{ fontSize: 20 }}>{valid ? '✅' : '❌'}</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultAnswer, { color: valid ? C.green : theme.textSecondary }]}>
                    {answer || '(sem resposta)'}
                  </ThemedText>
                  {!valid && hint ? (
                    <ThemedText themeColor="textSecondary" style={styles.hintLine}>💡 Ex: {hint}</ThemedText>
                  ) : null}
                </ThemedView>
              );
            })}
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: BRAND }]} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>🎲  NOVA LETRA</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Stop Católico"
          right={
            <ThemedText type="smallBold" style={{ color: timerColor, fontSize: 20 }}>
              {timeLeft}s
            </ThemedText>
          }
        />
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[styles.playScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
            keyboardShouldPersistTaps="handled">
            <View style={[styles.timerBar, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.timerFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
            </View>
            <View style={styles.letterRow}>
              <View style={[styles.letterCard, { backgroundColor: BRAND }]}>
                <ThemedText style={styles.letterCardText}>{letter}</ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 13, lineHeight: 18, flex: 1 }}>
                Preencha as categorias com palavras que comecem com esta letra
              </ThemedText>
            </View>
            {CATEGORIES.map((cat, i) => (
              <ThemedView key={cat.key} type="backgroundElement" style={styles.inputCard}>
                <ThemedText style={styles.catEmoji}>{cat.emoji}</ThemedText>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.catLabel}>{cat.label}</ThemedText>
                  <TextInput
                    ref={ref => { inputRefs.current[cat.key] = ref; }}
                    style={[styles.input, {
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                      backgroundColor: theme.background,
                    }]}
                    value={answers[cat.key] ?? ''}
                    onChangeText={text => setAnswer(cat.key, text)}
                    placeholder={`${letter}...`}
                    placeholderTextColor={theme.textSecondary}
                    returnKeyType={i < CATEGORIES.length - 1 ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      const nextKey = CATEGORIES[i + 1]?.key;
                      if (nextKey) inputRefs.current[nextKey]?.focus();
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </ThemedView>
            ))}
            <TouchableOpacity style={[styles.stopBtn, { backgroundColor: BRAND }]} onPress={callStop} activeOpacity={0.8}>
              <ThemedText style={styles.stopBtnText}>🛑  STOP!</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: 'center' },
  heroEmoji: { fontSize: 64, textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  idleScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three, alignItems: 'center' },
  catList: {
    alignSelf: 'stretch',
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  catEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  rulesBox: {
    alignSelf: 'stretch',
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: C.border,
  },
  rulesTitle: { letterSpacing: 1.1 },
  ruleItem: { fontSize: 14, marginTop: 2 },
  modeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  modeRow: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' },
  modeCard: {
    flex: 1,
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  modeEmoji: { fontSize: 32 },
  modeTitle: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  modeDesc:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center' },
  primaryBtn: {
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.two },
  timerBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: 8, borderRadius: 4 },
  letterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  letterCard: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  letterCardText: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 60 },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: C.radius.md,
    padding: Spacing.two,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputGroup: { flex: 1, gap: 3 },
  catLabel: { fontSize: 12, opacity: 0.65 },
  input: {
    borderWidth: 1.5,
    borderRadius: C.radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    fontSize: 15,
    fontWeight: '500',
  },
  stopBtn: { paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', marginTop: Spacing.one },
  stopBtnText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  resultScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  resultSummary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.one },
  resultSummaryText: { gap: 2 },
  letterCircle: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  letterCircleText: { fontSize: 42, fontWeight: '900', color: '#fff' },
  resultCard: {
    borderRadius: C.radius.md,
    padding: Spacing.two,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  resultAnswer: { fontSize: 15, fontWeight: '600', paddingLeft: 40 },
  hintLine: { fontSize: 12, paddingLeft: 40, fontStyle: 'italic' },
  spinScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  spinLabel: { fontSize: 17, letterSpacing: 0.3 },
  spinCircle: {
    width: 180, height: 180, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#EF9F27', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 24,
  },
  spinLetterText: { fontSize: 110, fontWeight: '900', color: '#fff', lineHeight: 118 },
  spinGoText: { fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  spinSkipHint: { fontSize: 13, opacity: 0.5 },
});
