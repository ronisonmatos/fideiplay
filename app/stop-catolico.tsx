import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
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
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { ALL_LETTERS, computeAvailableLetters, randomDefaultKeys, StopCategory } from '@/constants/stop-categories';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeStopCategories } from '@/hooks/use-game-packs';
import { useStopCategories } from '@/hooks/use-stop-categories';
import { validateWithBank, validateWithAI, BankResult } from '@/lib/stop-bank';
import { supabase } from '@/lib/supabase';
import { loadBankHints, getAIHint, HintMap } from '@/lib/stop-hints';

const BRAND          = '#EF9F27';
const TIMER_DURATION = 90;
const MIN_CATS       = 4;

type Phase = 'idle' | 'selecting' | 'spinning' | 'playing' | 'result';
type AnswerMap = Partial<Record<string, string>>;

export default function StopCatolicoScreen() {
  const theme   = useTheme();
  const { reportResult } = useGameStore();
  const { user, profile, refreshProfile } = useAuth();
  const { packs } = useGamePacks('stop');
  const baseCategories = useStopCategories();
  const allCategories  = mergeStopCategories(baseCategories, packs, ALL_LETTERS) as StopCategory[];

  const [phase,       setPhase]       = useState<Phase>('idle');
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => randomDefaultKeys());
  const [activeCategories, setActiveCategories] = useState<StopCategory[]>([]);
  const [letter,      setLetter]      = useState('A');
  const [answers,     setAnswers]     = useState<AnswerMap>({});
  const [timeLeft,    setTimeLeft]    = useState(TIMER_DURATION);
  const [bankMap,     setBankMap]     = useState<Partial<Record<string, BankResult>>>({});
  const [aiLoading,   setAiLoading]   = useState(false);
  const [hints,       setHints]       = useState<HintMap>({});
  const [loadingHint, setLoadingHint] = useState<string | null>(null);

  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs        = useRef<Partial<Record<string, TextInput | null>>>({});
  const reported         = useRef(false);
  const [spinLetter,   setSpinLetter]   = useState('A');
  const [spinDone,     setSpinDone]     = useState(false);
  const scaleAnim        = useRef(new Animated.Value(1)).current;
  const spinTimeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const targetLetterRef  = useRef('A');

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

  const validCount = activeCategories.filter(c => {
    const a = answers[c.key]?.trim() ?? '';
    return a.length > 0 && a[0].toUpperCase() === letter;
  }).length;
  const score = validCount * 10 + (validCount === activeCategories.length && activeCategories.length > 0 ? 20 : 0);

  // After validation completes, derive the true score from the bank map
  const bankDone       = !aiLoading && Object.keys(bankMap).length === activeCategories.length && activeCategories.length > 0;
  const bankValidCount = bankDone ? activeCategories.filter(c => bankMap[c.key] === 'valid' || bankMap[c.key] === 'ai_valid').length : null;
  const bankScore      = bankValidCount !== null ? bankValidCount * 10 + (bankValidCount === activeCategories.length ? 20 : 0) : null;

  useEffect(() => {
    if (phase === 'playing') { reported.current = false; setCoinsEarned(null); return; }
    if (phase !== 'result' || reported.current || bankScore === null) return;
    reported.current = true;

    const xp = (bankValidCount ?? 0) * ECONOMY.XP_MEDIO;
    reportResult({ gameId: 'stop-solo', score: xp });

    const uid = user?.id;
    if (uid && bankValidCount !== null && bankValidCount > 0) {
      supabase.rpc('add_coins', { p_user_id: uid, p_amount: bankValidCount })
        .then(() => { setCoinsEarned(bankValidCount); refreshProfile(); })
        .catch(() => {});
    } else {
      setCoinsEarned(0);
    }
  }, [phase, bankScore, bankValidCount, activeCategories.length, user?.id, reportResult, refreshProfile]);

  useEffect(() => {
    if (phase !== 'result') return;
    setBankMap({});
    setAiLoading(false);

    validateWithBank(letter, answers, activeCategories).then(async (map) => {
      setBankMap(map);

      const toCheck = activeCategories.filter(c => map[c.key] === 'unverified');
      // 'padre' já marcado como 'valid' no banco; verificamos apenas palavrão via IA
      const padreCat = activeCategories.find(c => c.key === 'padre' && map['padre'] === 'valid');
      if (toCheck.length === 0 && !padreCat) return;

      setAiLoading(true);
      try {
        await Promise.all([
          ...toCheck.map(async (cat) => {
            const ans = (answers[cat.key] ?? '').trim();
            const result = await validateWithAI(letter, ans, cat.key, cat.label);
            if (result === null) return;
            setBankMap(prev => ({ ...prev, [cat.key]: result ? 'ai_valid' : 'ai_invalid' }));
          }),
          ...(padreCat ? [(async () => {
            const ans = (answers['padre'] ?? '').trim();
            if (!ans) return;
            const result = await validateWithAI(letter, ans, 'padre', padreCat.label);
            if (result === false) setBankMap(prev => ({ ...prev, padre: 'ai_invalid' }));
          })()] : []),
        ]);
      } finally {
        setAiLoading(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    setHints({});
    loadBankHints(letter, activeCategories).then(setHints);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

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

  const toggleCat = useCallback((key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > MIN_CATS) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleShuffle = useCallback(async () => {
    if (!user || !profile || profile.coins < 1) return;
    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -1 });
    setSelectedKeys(randomDefaultKeys(6));
    refreshProfile();
  }, [user, profile, refreshProfile]);

  const handleHint = useCallback(async (cat: StopCategory) => {
    if (!user || !profile) return;
    if (profile.coins < 2) {
      Alert.alert('Moedas insuficientes', 'Você precisa de 2 🪙 para usar uma dica.');
      return;
    }
    if (loadingHint) return;
    setLoadingHint(cat.key);

    let word: string | null = hints[cat.key] ?? null;
    if (!word) {
      word = await getAIHint(letter, cat.key, cat.label);
      if (word) setHints(prev => ({ ...prev, [cat.key]: word! }));
    }

    if (!word) {
      Alert.alert('Dica indisponível', 'Não encontramos sugestão para essa categoria com essa letra.');
      setLoadingHint(null);
      return;
    }

    setAnswer(cat.key, word.slice(0, 3));
    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -2 });
    refreshProfile();
    setLoadingHint(null);
  }, [user, profile, hints, loadingHint, letter, setAnswer, refreshProfile]);

  const startGame = useCallback((cats: StopCategory[]) => {
    clearSpinTimeouts();
    scaleAnim.setValue(1);
    setSpinDone(false);
    setActiveCategories(cats);
    setAnswers({});
    setTimeLeft(TIMER_DURATION);

    const availableLetters = computeAvailableLetters(cats);
    const targetIdx        = Math.floor(Math.random() * availableLetters.length);
    const targetLetter     = availableLetters[targetIdx];
    targetLetterRef.current = targetLetter;
    setLetter(targetLetter);

    const LC     = availableLetters.length;
    const phases = [
      { count: 10, ms: 60 },
      { count: 8,  ms: 110 },
      { count: 5,  ms: 200 },
      { count: 3,  ms: 380 },
    ];
    const totalSteps = phases.reduce((s, p) => s + p.count, 0);
    const startIdx   = ((targetIdx - (totalSteps - 1)) % LC + LC) % LC;

    let idx = startIdx, t = 0, lastT = 0;
    const refs = spinTimeoutsRef.current;

    for (const { count, ms } of phases) {
      for (let i = 0; i < count; i++) {
        const l = availableLetters[idx % LC], ct = t;
        const peak = 1 + (ms / 380) * 0.18;
        refs.push(setTimeout(() => {
          setSpinLetter(l);
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: peak, duration: ms * 0.3, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1,    duration: ms * 0.7, useNativeDriver: true }),
          ]).start();
        }, ct));
        lastT = t; t += ms; idx = (idx + 1) % LC;
      }
    }

    refs.push(setTimeout(() => {
      setSpinDone(true);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.45, duration: 280, useNativeDriver: true }),
        Animated.spring(scaleAnim,  { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      ]).start();
    }, lastT));

    refs.push(setTimeout(() => setPhase('playing'), lastT + 1100));
    setPhase('spinning');
  }, [clearSpinTimeouts, scaleAnim]);

  const handleVamosJogar = useCallback(() => {
    const cats = allCategories.filter(c => selectedKeys.has(c.key));
    startGame(cats as StopCategory[]);
  }, [allCategories, selectedKeys, startGame]);

  const callStop  = useCallback(() => { stopTimer(); setPhase('result'); }, [stopTimer]);
  const setAnswer = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);
  const isValid = useCallback((key: string) => {
    const a = answers[key]?.trim() ?? '';
    return a.length > 0 && a[0].toUpperCase() === letter;
  }, [answers, letter]);

  const timerPct   = (timeLeft / TIMER_DURATION) * 100;
  const timerColor = timeLeft > 30 ? C.green : timeLeft > 15 ? C.gold : C.red;

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Católico" subtitle="VOCABULÁRIO" />
          <ScrollView contentContainerStyle={[s.idleScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/stop.png')} style={s.heroEmoji} resizeMode="contain" />
            <ThemedText type="subtitle" style={s.center}>Stop Católico</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, s.desc]}>
              Sorteamos uma letra e você tem {TIMER_DURATION}s para preencher as categorias com palavras da fé que comecem com ela.
            </ThemedText>

            <ThemedView type="backgroundElement" style={s.rulesBox}>
              <ThemedText type="smallBold" style={s.rulesTitle}>PONTUAÇÃO</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.ruleItem}>✅  +10 pts por resposta válida</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.ruleItem}>🌟  +20 pts bônus ao completar tudo</ThemedText>
            </ThemedView>

            <ThemedText themeColor="textSecondary" style={s.modeLabel}>ESCOLHA O MODO</ThemedText>
            <View style={s.modeRow}>
              <TouchableOpacity
                style={[s.modeCard, { backgroundColor: BRAND }]}
                onPress={() => setPhase('selecting')}
                activeOpacity={0.8}>
                <ThemedText style={s.modeEmoji}>🎲</ThemedText>
                <ThemedText style={s.modeTitle}>Jogar Solo</ThemedText>
                <ThemedText style={s.modeDesc}>Contra o sistema</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modeCard, { backgroundColor: C.purple }]}
                onPress={() => router.push('/stop-online')}
                activeOpacity={0.8}>
                <ThemedText style={s.modeEmoji}>🌐</ThemedText>
                <ThemedText style={s.modeTitle}>Jogar Online</ThemedText>
                <ThemedText style={s.modeDesc}>Com outros jogadores</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── SELECTING ───────────────────────────────────────────────────────────────
  if (phase === 'selecting') {
    const numSelected = selectedKeys.size;
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Católico" subtitle="CATEGORIAS" />
          <ScrollView
            contentContainerStyle={[s.selectScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
            showsVerticalScrollIndicator={false}>

            <ThemedText type="subtitle" style={s.center}>Escolha as categorias</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
              Selecione pelo menos {MIN_CATS}. Selecionadas: {numSelected}
            </ThemedText>

            <TouchableOpacity
              style={[s.shuffleBtn, profile && profile.coins < 1 && { opacity: 0.4 }]}
              onPress={handleShuffle}
              disabled={!profile || profile.coins < 1}
              activeOpacity={0.8}>
              <ThemedText style={s.shuffleBtnText}>🔀  Novas categorias  −1 🪙</ThemedText>
            </TouchableOpacity>

            <View style={s.catGrid}>
              {allCategories.map(cat => {
                const on = selectedKeys.has(cat.key);
                const canDeselect = on && numSelected > MIN_CATS;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => toggleCat(cat.key)}
                    activeOpacity={0.75}
                    style={[
                      s.catChip,
                      on
                        ? { backgroundColor: BRAND, borderColor: BRAND }
                        : { backgroundColor: 'transparent', borderColor: C.border },
                      !canDeselect && on && numSelected <= MIN_CATS && { opacity: 0.85 },
                    ]}>
                    <ThemedText
                      style={[s.chipLabel, { color: on ? '#fff' : theme.textSecondary }]}
                      numberOfLines={2}>
                      {cat.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[s.playBtn, { backgroundColor: BRAND }]}
              onPress={handleVamosJogar}
              activeOpacity={0.85}>
              <ThemedText style={s.playBtnTxt}>🎲  VAMOS JOGAR!</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.backBtn}
              onPress={() => setPhase('idle')}
              activeOpacity={0.7}>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 14 }}>← Voltar</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── SPINNING ────────────────────────────────────────────────────────────────
  if (phase === 'spinning') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Católico" subtitle="VOCABULÁRIO" />
          <TouchableOpacity style={s.spinScreen} onPress={skipSpin} activeOpacity={1}>
            <ThemedText themeColor="textSecondary" style={s.spinLabel}>
              {spinDone ? 'Sua letra é:' : 'Sorteando...'}
            </ThemedText>
            <Animated.View style={[s.spinCircle, { backgroundColor: BRAND, transform: [{ scale: scaleAnim }] }]}>
              <ThemedText style={s.spinLetterText}>{spinLetter}</ThemedText>
            </Animated.View>
            {spinDone
              ? <ThemedText style={[s.spinGoText, { color: BRAND }]}>Prepare-se! 🚀</ThemedText>
              : <ThemedText themeColor="textSecondary" style={s.spinSkipHint}>Toque para pular</ThemedText>
            }
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const displayScore      = bankScore ?? score;
    const displayValidCount = bankValidCount ?? validCount;
    const medal = displayScore >= 60 ? '🏆' : displayScore >= 30 ? '🎖️' : '📿';
    const msg   = displayScore >= 60
      ? 'Excelente vocabulário da fé!'
      : displayScore >= 30
        ? 'Bom resultado! Continue praticando.'
        : 'Estude mais o vocabulário católico!';

    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Católico" />
          <ScrollView contentContainerStyle={[s.resultScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={s.resultSummary}>
              <View style={[s.letterCircle, { backgroundColor: BRAND }]}>
                <ThemedText style={s.letterCircleText}>{letter}</ThemedText>
              </View>
              <View style={s.resultSummaryText}>
                <ThemedText style={{ fontSize: 40, lineHeight: 48 }}>{medal}</ThemedText>
                <ThemedText type="subtitle" style={{ lineHeight: 32 }}>
                  {bankScore !== null ? `${displayScore} pts` : '...'}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                  {bankScore !== null
                    ? `${displayValidCount}/${activeCategories.length} válidas${displayValidCount === activeCategories.length ? ' + bônus 🌟' : ''}`
                    : 'Verificando respostas...'}
                </ThemedText>
              </View>
            </View>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 14 }]}>{msg}</ThemedText>

            {activeCategories.map(c => {
              const answer   = (answers[c.key] ?? '').trim();
              const startsOk = isValid(c.key);
              const res      = bankMap[c.key];
              const checking = aiLoading && res === 'unverified';

              const icon =
                !res                          ? (startsOk ? '⏳' : '❌')
                : res === 'valid'             ? '✅'
                : res === 'ai_valid'          ? '✅'
                : checking                    ? '⏳'
                : res === 'unverified'        ? '⚠️'
                : /* ai_invalid / invalid */    '❌';

              const color =
                (res === 'valid' || res === 'ai_valid') ? C.green
                : res === 'unverified'                  ? C.gold
                : res === 'ai_invalid'                  ? C.red
                : theme.textSecondary;

              const badge =
                res === 'valid'                   ? 'Reconhecida'
                : res === 'ai_valid'              ? 'Válida (IA) 🤖'
                : checking                        ? 'Verificando...'
                : res === 'unverified'            ? 'Não verificada'
                : res === 'ai_invalid'            ? 'Não reconhecida'
                : null;

              const badgeColor =
                (res === 'valid' || res === 'ai_valid') ? C.green
                : res === 'ai_invalid'                  ? C.red
                : C.gold;

              return (
                <ThemedView key={c.key} type="backgroundElement" style={s.resultCard}>
                  <View style={s.resultCardTop}>
                    <ThemedText type="smallBold" style={{ flex: 1 }}>{c.label}</ThemedText>
                    <ThemedText style={{ fontSize: 20 }}>{icon}</ThemedText>
                  </View>
                  <View style={s.resultCardBottom}>
                    <ThemedText style={[s.resultAnswer, { color }]}>
                      {answer || '(sem resposta)'}
                    </ThemedText>
                    {badge ? (
                      <View style={[s.resultBadge, { backgroundColor: badgeColor + '22' }]}>
                        <ThemedText style={[s.resultBadgeTxt, { color: badgeColor }]}>{badge}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                </ThemedView>
              );
            })}

            <GameRewardBanner xp={(bankValidCount ?? 0) * ECONOMY.XP_MEDIO} coins={coinsEarned} />
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: BRAND }]}
              onPress={() => setPhase('selecting')}
              activeOpacity={0.8}>
              <ThemedText style={s.btnText}>🎲  NOVA LETRA</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader
          title="Stop Católico"
          right={
            <ThemedText type="smallBold" style={{ color: timerColor, fontSize: 20 }}>
              {timeLeft}s
            </ThemedText>
          }
        />
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[s.playScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
            keyboardShouldPersistTaps="handled">
            <View style={[s.timerBar, { backgroundColor: theme.backgroundElement }]}>
              <View style={[s.timerFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
            </View>
            <View style={s.letterRow}>
              <View style={[s.letterCard, { backgroundColor: BRAND }]}>
                <ThemedText style={s.letterCardText}>{letter}</ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 13, lineHeight: 18, flex: 1 }}>
                Preencha as categorias com palavras que comecem com esta letra
              </ThemedText>
            </View>

            {activeCategories.map((cat, i) => (
              <ThemedView key={cat.key} type="backgroundElement" style={s.inputCard}>
                <View style={s.inputGroup}>
                  <View style={s.inputHeader}>
                    <ThemedText style={s.catLabel}>{cat.label}</ThemedText>
                    <TouchableOpacity
                      onPress={() => handleHint(cat)}
                      disabled={!profile || profile.coins < 2 || !!loadingHint}
                      style={[s.hintBtn, (!profile || profile.coins < 2) && { opacity: 0.35 }]}
                      activeOpacity={0.7}>
                      <ThemedText style={s.hintBtnText}>
                        {loadingHint === cat.key ? '...' : '🪙 Dica −2'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    ref={ref => { inputRefs.current[cat.key] = ref; }}
                    style={[s.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                    value={answers[cat.key] ?? ''}
                    onChangeText={text => setAnswer(cat.key, text)}
                    placeholder={`${letter}...`}
                    placeholderTextColor={theme.textSecondary}
                    returnKeyType={i < activeCategories.length - 1 ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      const nextKey = activeCategories[i + 1]?.key;
                      if (nextKey) inputRefs.current[nextKey]?.focus();
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </ThemedView>
            ))}

            <TouchableOpacity style={[s.stopBtn, { backgroundColor: BRAND }]} onPress={callStop} activeOpacity={0.8}>
              <ThemedText style={s.stopBtnText}>🛑  STOP!</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:    { flex: 1 },
  center:  { textAlign: 'center' },
  heroEmoji: { width: 96, height: 96, alignSelf: 'center' },
  desc:    { fontSize: 15, lineHeight: 22 },

  // Idle
  idleScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, gap: Spacing.three, alignItems: 'center' },
  rulesBox:   { alignSelf: 'stretch', borderRadius: C.radius.lg, padding: Spacing.three, gap: Spacing.one, borderWidth: 1, borderColor: C.border },
  rulesTitle: { letterSpacing: 1.1 },
  ruleItem:   { fontSize: 14, marginTop: 2 },
  modeLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  modeRow:    { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' },
  modeCard:   { flex: 1, borderRadius: C.radius.lg, padding: Spacing.three, alignItems: 'center', gap: Spacing.one },
  modeEmoji:  { fontSize: 32, lineHeight: 40 },
  modeTitle:  { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  modeDesc:   { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center' },

  // Selecting
  selectScroll: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignSelf: 'stretch' },
  catChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderRadius: C.radius.md,
    borderWidth: 1.5,
  },
  chipEmoji:  { fontSize: 20, width: 26, textAlign: 'center' },
  chipLabel:  { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 16 },
  playBtn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  playBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 },
  backBtn:    { paddingVertical: Spacing.one },

  // Spin
  spinScreen:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  spinLabel:     { fontSize: 17, letterSpacing: 0.3 },
  spinCircle: {
    width: 180, height: 180, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 24,
  },
  spinLetterText: { fontSize: 110, fontWeight: '900', color: '#fff', lineHeight: 118 },
  spinGoText:     { fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  spinSkipHint:   { fontSize: 13, opacity: 0.5 },

  // Playing
  playScroll:  { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.two },
  timerBar:    { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill:   { height: 8, borderRadius: 4 },
  letterRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  letterCard:  { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  letterCardText: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 60 },
  inputCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.two, borderWidth: 1, borderColor: C.border },
  inputGroup:  { flex: 1, gap: 3 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  catLabel:    { fontSize: 12, opacity: 0.65 },
  catEmoji:    { fontSize: 22, width: 32, textAlign: 'center' },
  hintBtn:     { backgroundColor: C.gold + '22', borderRadius: C.radius.pill, paddingVertical: 3, paddingHorizontal: 8 },
  hintBtnText: { fontSize: 11, fontWeight: '800', color: C.gold },
  shuffleBtn:  { borderWidth: 1.5, borderColor: C.purple + '88', borderRadius: C.radius.pill, paddingVertical: 10, alignItems: 'center' as const, alignSelf: 'stretch' as const, marginBottom: -4 },
  shuffleBtnText: { color: C.purple, fontWeight: '800' as const, fontSize: 13, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderRadius: C.radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    fontSize: 15, fontWeight: '500',
  },
  stopBtn:    { paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', marginTop: Spacing.one },
  stopBtnText:{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },

  // Result
  resultScroll:      { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  resultSummary:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.one },
  resultSummaryText: { gap: 2 },
  letterCircle:      { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  letterCircleText:  { fontSize: 42, fontWeight: '900', color: '#fff', lineHeight: 52 },
  resultCard:        { borderRadius: C.radius.md, padding: Spacing.two, gap: 4, borderWidth: 1, borderColor: C.border },
  resultCardTop:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  resultCardBottom:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 40, flexWrap: 'wrap' },
  resultAnswer:      { fontSize: 15, fontWeight: '600' },
  resultBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  resultBadgeTxt:    { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  primaryBtn: { paddingHorizontal: Spacing.five, paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', alignSelf: 'stretch' },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
});
