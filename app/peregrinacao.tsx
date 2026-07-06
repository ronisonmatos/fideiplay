import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { SANCTUARIES } from '@/constants/sanctuaries';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeSanctuaries } from '@/hooks/use-game-packs';
import { supabase } from '@/lib/supabase';

const GAME_ID = 'peregrinacao';

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
  const { user, profile, refreshProfile } = useAuth();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const { packs } = useGamePacks('peregrinacao');
  const allSanctuaries = useMemo(() => mergeSanctuaries(SANCTUARIES, packs), [packs]);
  const [unlocked, setUnlocked] = useState(1);
  const hydratedUnlockedRef = useRef(false);

  // Retoma de onde o jogador parou: sem isso, `unlocked` sempre reiniciava em 1
  // a cada vez que o app era reaberto, obrigando a refazer santuários já vencidos.
  useEffect(() => {
    if (hydratedUnlockedRef.current || allSanctuaries.length === 0) return;
    hydratedUnlockedRef.current = true;
    let passedCount = 0;
    while (passedCount < allSanctuaries.length && isLevelComplete(GAME_ID, String(passedCount))) {
      passedCount++;
    }
    setUnlocked(Math.min(passedCount + 1, allSanctuaries.length));
  }, [allSanctuaries.length, isLevelComplete]);
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [screen, setScreen] = useState<Screen>('map');
  const [activeSanctuary, setActiveSanctuary] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [errosSeguidos, setErrosSeguidos] = useState(0);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
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
    const coins = ECONOMY.PEREGRINACAO_SANTUARIO + (isComplete ? ECONOMY.PEREGRINACAO_COMPLETA : 0);
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
    setErrosSeguidos(0);
    setEliminatedOptions([]);
    setRevealedAnswer(false);
    setScreen('quiz');
  };

  const handleSelect = useCallback(
    (i: number) => {
      if (!q || selected !== null) return;
      setSelected(i);
      if (i === q.correct) {
        setCorrect(c => c + 1);
        setErrosSeguidos(0);
      } else {
        setErrosSeguidos(e => e + 1);
      }
    },
    [selected, q],
  );

  const nextQ = () => {
    setSelected(null);
    setEliminatedOptions([]);
    setRevealedAnswer(false);
    if (qIndex + 1 < shuffledQuestions.length) {
      setQIndex(qi => qi + 1);
    } else {
      setScreen('result');
    }
  };

  const handleDica = useCallback(async (custo: number, nivel: 'direcao' | 'texto' | 'revelar') => {
    if (!user || !q) return;
    if (!profile || profile.coins < custo) {
      Alert.alert('Moedas insuficientes', `Você precisa de ${custo} 🪙 para essa dica. Assista um anúncio ou aguarde o bônus de moedas.`);
      return;
    }
    try {
      const { error } = await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -custo });
      if (error) throw error;
      if (nivel === 'revelar') {
        setRevealedAnswer(true);
      } else {
        const wrongIdx = q.options
          .map((_, i) => i)
          .filter(i => i !== q.correct && !eliminatedOptions.includes(i));
        if (wrongIdx.length > 0) {
          const toRemove = wrongIdx[Math.floor(Math.random() * wrongIdx.length)];
          setEliminatedOptions(prev => [...prev, toRemove]);
        }
      }
      refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível usar a dica agora. Tente novamente.');
    }
  }, [user, profile, q, eliminatedOptions, refreshProfile]);

  const finishSanctuary = () => {
    const passed = correct >= 2;
    let nextUnlocked = unlocked;
    if (passed && activeSanctuary + 1 >= unlocked) {
      nextUnlocked = Math.min(unlocked + 1, allSanctuaries.length);
      setUnlocked(nextUnlocked);
    }
    if (passed) markLevelComplete(GAME_ID, String(activeSanctuary));
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
          <GameHeader
            title={sanctuary.name}
            subtitle={`${sanctuary.emoji} ${sanctuary.country}`}
            onBack={() => setScreen('map')}
          />
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
            {errosSeguidos >= 2 && selected === null && (
              <View style={styles.dicaRow}>
                <TouchableOpacity
                  onPress={() => handleDica(ECONOMY.PEREGRINACAO_DICA_DIRECAO, 'direcao')}
                  style={[styles.dicaBtn, { borderColor: C.gold }]}
                  activeOpacity={0.8}>
                  <ThemedText style={[styles.dicaBtnText, { color: C.gold }]}>
                    💡 Eliminar 1 ({ECONOMY.PEREGRINACAO_DICA_DIRECAO} 🪙)
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDica(ECONOMY.PEREGRINACAO_DICA_TEXTO, 'texto')}
                  style={[styles.dicaBtn, { borderColor: C.gold }]}
                  activeOpacity={0.8}>
                  <ThemedText style={[styles.dicaBtnText, { color: C.gold }]}>
                    💡 Eliminar 2 ({ECONOMY.PEREGRINACAO_DICA_TEXTO} 🪙)
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDica(ECONOMY.PEREGRINACAO_REVELAR_SANTUARIO, 'revelar')}
                  style={[styles.dicaBtn, { borderColor: C.purple }]}
                  activeOpacity={0.8}>
                  <ThemedText style={[styles.dicaBtnText, { color: C.purple }]}>
                    🔓 Revelar ({ECONOMY.PEREGRINACAO_REVELAR_SANTUARIO} 🪙)
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.options}>
              {q.options.map((opt, i) => {
                const revealed = selected !== null;
                const isCorrect = i === q.correct;
                const isSelected = i === selected;
                const eliminated = !revealed && eliminatedOptions.includes(i);
                let bg: string = theme.backgroundElement;
                let textColor: string = theme.text;
                let borderColor: string = C.border;
                if (revealed) {
                  if (isCorrect) { bg = C.green; textColor = '#fff'; borderColor = C.green; }
                  else if (isSelected) { bg = C.red; textColor = '#fff'; borderColor = C.red; }
                } else if (!eliminated && revealedAnswer && isCorrect) {
                  bg = C.purple + '33'; borderColor = C.purple;
                }
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSelect(i)}
                    disabled={eliminated}
                    activeOpacity={0.75}
                    style={[styles.option, { backgroundColor: bg, borderColor }, eliminated && { opacity: 0.3 }]}>
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
          <GameHeader title="Peregrinação Virtual" onBack={finishSanctuary} />
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
  dicaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  dicaBtn: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: C.radius.pill, borderWidth: 1.5 },
  dicaBtnText: { fontSize: 11, fontWeight: '700' },
});
