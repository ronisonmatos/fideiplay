import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { ALL_QUESTIONS } from '@/constants/liturgico-questions';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeLiturgQuestions } from '@/hooks/use-game-packs';
import { supabase } from '@/lib/supabase';

const GAME_ID = 'desafio-liturgico';

type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'idle' | 'difficulty' | 'playing' | 'result';

interface LiturgQuestion {
  question: string;
  options: string[];
  correct: number;
  hint: string;
  difficulty: Difficulty;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; emoji: string; desc: string; time: number }> = {
  facil:   { label: 'Fácil',   color: C.green, emoji: '🌿', desc: 'Cores, tempos e sacramentos básicos', time: 90 },
  medio:   { label: 'Médio',   color: C.gold,  emoji: '✝️', desc: 'Semana Santa, ritos e datas litúrgicas', time: 75 },
  dificil: { label: 'Difícil', color: C.red,   emoji: '📿', desc: 'Preces, Triduum, história e documentos', time: 60 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestion(q: LiturgQuestion): LiturgQuestion {
  const correctAnswer = q.options[q.correct];
  const shuffled = shuffle(q.options);
  return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
}

export default function DesafioLiturgicoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const { user, profile, refreshProfile } = useAuth();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const { packs } = useGamePacks('liturgico');
  const [phase, setPhase] = useState<Phase>('idle');
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [questions, setQuestions] = useState<LiturgQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [usouTempoExtra, setUsouTempoExtra] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reported = useRef(false);
  const finalTimeRef = useRef(60);

  const cfg = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      const isPerfect = questions.length > 0 && score === questions.length;
      const XP = { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL };
      reportResult({ gameId: GAME_ID, score: score * XP[difficulty], liturgyTimeLeft: finalTimeRef.current });
      markLevelComplete(GAME_ID, difficulty);
      if (user?.id) {
        const coins = ECONOMY.COMPLETAR_JOGO + (isPerfect ? ECONOMY.BONUS_PERFEITO : 0);
        supabase.rpc('add_coins', { p_user_id: user.id, p_amount: coins })
          .then(() => { setCoinsEarned(coins); refreshProfile(); })
          .catch(() => {});
      }
    }
    if (phase === 'playing') {
      reported.current = false;
      finalTimeRef.current = cfg.time;
      setCoinsEarned(null);
    }
  }, [phase, score, questions.length, cfg.time, reportResult, user, refreshProfile, difficulty, markLevelComplete]);

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

  const startWithDifficulty = useCallback((diff: Difficulty) => {
    const totalTime = DIFFICULTY_CONFIG[diff].time;
    const allQ = mergeLiturgQuestions(ALL_QUESTIONS, packs);
    const filtered = shuffle(allQ.filter(q => q.difficulty === diff)).map(shuffleQuestion);
    setDifficulty(diff);
    setQuestions(filtered);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setTimeLeft(totalTime);
    finalTimeRef.current = totalTime;
    setUsouTempoExtra(false);
    setPhase('playing');
  }, []);

  const handleTempoExtra = useCallback(async () => {
    if (!user || usouTempoExtra) return;
    if (!profile || profile.coins < ECONOMY.DESAFIO_LITURGICO_TEMPO_EXTRA) {
      Alert.alert(
        'Moedas insuficientes',
        `Você precisa de ${ECONOMY.DESAFIO_LITURGICO_TEMPO_EXTRA} 🪙 para ganhar mais tempo. Assista um anúncio ou aguarde o bônus de moedas.`,
      );
      return;
    }
    try {
      const { error } = await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -ECONOMY.DESAFIO_LITURGICO_TEMPO_EXTRA });
      if (error) throw error;
      setUsouTempoExtra(true);
      setTimeLeft(t => t + 15);
      refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível usar essa dica agora. Tente novamente.');
    }
  }, [user, profile, usouTempoExtra, refreshProfile]);

  const q = questions[index];

  const handleSelect = useCallback(
    (i: number) => {
      if (!q || selected !== null) return;
      setSelected(i);
      if (i === q.correct) setScore(s => s + 1);
    },
    [selected, q],
  );

  const next = useCallback(() => {
    setSelected(null);
    if (index + 1 < questions.length) { setIndex(ix => ix + 1); }
    else { endGame(timeLeft); }
  }, [index, questions.length, timeLeft, endGame]);

  const timerPct = questions.length > 0 ? (timeLeft / cfg.time) * 100 : 100;
  const timerColor = timeLeft > cfg.time * 0.33 ? C.green : timeLeft > cfg.time * 0.17 ? C.gold : C.red;

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" subtitle="LITURGIA" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/desafio_calendário_liturgico.png')} style={styles.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={styles.textCenter}>Desafio Litúrgico</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              45 questões sobre o calendário litúrgico.{'\n'}Escolha o nível e teste seu conhecimento!
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>ESCOLHER NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'difficulty') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" subtitle="ESCOLHA O NÍVEL" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }]}>
            <ThemedText type="subtitle" style={styles.textCenter}>Qual nível deseja jogar?</ThemedText>
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => {
              const dc = DIFFICULTY_CONFIG[diff];
              const done = isLevelComplete(GAME_ID, diff);
              return (
                <TouchableOpacity
                  key={diff}
                  style={[styles.diffBtn, { borderColor: dc.color }]}
                  onPress={() => startWithDifficulty(diff)}
                  activeOpacity={0.8}>
                  <ThemedView type="backgroundElement" style={styles.diffBtnInner}>
                    <View style={styles.diffHeaderRow}>
                      <View style={[styles.diffBadge, { backgroundColor: dc.color + '22' }]}>
                        <ThemedText style={[styles.diffBadgeText, { color: dc.color }]}>{dc.emoji} {dc.label}</ThemedText>
                      </View>
                      {done && <ThemedText style={{ fontSize: 16 }}>✅</ThemedText>}
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[styles.diffCount, { color: dc.color }]}>
                      {done ? 'Concluído · jogar novamente' : `15 questões · ⏱ ${dc.time}s`}
                    </ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const medal = pct >= 80 ? '🏆' : pct >= 50 ? '✝️' : '📿';
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Desafio Litúrgico" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22', alignSelf: 'center' }]}>
              <ThemedText style={[styles.diffBadgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText type="subtitle">{score}/{questions.length} acertos</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {pct >= 80 ? 'Excelente! Você domina a liturgia!' : pct >= 50 ? 'Bom resultado! Continue aprendendo.' : 'Estude mais sobre o calendário litúrgico!'}
            </ThemedText>
            <GameRewardBanner xp={score * { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL }[difficulty]} coins={coinsEarned} />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.color }]} onPress={() => startWithDifficulty(difficulty)} activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: cfg.color }]} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={[styles.outlineBtnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!q) return null;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Desafio Litúrgico"
          onBack={() => setPhase('difficulty')}
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
          {timeLeft < 10 && !usouTempoExtra && (
            <TouchableOpacity onPress={handleTempoExtra} style={styles.tempoExtraBtn} activeOpacity={0.8}>
              <ThemedText style={styles.tempoExtraText}>
                ⏱️ +15 segundos ({ECONOMY.DESAFIO_LITURGICO_TEMPO_EXTRA} 🪙)
              </ThemedText>
            </TouchableOpacity>
          )}
          <View style={styles.progressRow}>
            <ThemedText themeColor="textSecondary" style={styles.smallText}>
              {index + 1}/{questions.length}
            </ThemedText>
            <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22' }]}>
              <ThemedText style={[styles.diffBadgeSmall, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText style={{ color: cfg.color, fontWeight: '600', fontSize: 13 }}>
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
            <>
              <ThemedView type="backgroundElement" style={styles.hintBox}>
                <ThemedText themeColor="textSecondary" style={styles.hintLabel}>💡 DICA</ThemedText>
                <ThemedText style={styles.hintText}>{q.hint}</ThemedText>
              </ThemedView>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.color }]} onPress={next} activeOpacity={0.8}>
                <ThemedText style={styles.btnText}>
                  {index + 1 === questions.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
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
  bigEmoji: { fontSize: 64, lineHeight: 76 },
  gameIcon: { width: 96, height: 96 },
  desc: { fontSize: 15, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: C.red,
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.one,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
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
  diffHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  timerBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: 8, borderRadius: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -Spacing.one },
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
  hintBox: {
    borderRadius: C.radius.md,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  hintLabel: { fontSize: 11, letterSpacing: 1.1 },
  hintText: { fontSize: 14, fontStyle: 'italic' },
  tempoExtraBtn: {
    alignSelf: 'center',
    backgroundColor: C.gold,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: C.radius.pill,
  },
  tempoExtraText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
