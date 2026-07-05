import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { ALL_QUESTIONS } from '@/constants/quiz-questions';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeQuizQuestions } from '@/hooks/use-game-packs';
import { supabase } from '@/lib/supabase';
import { GameRewardBanner } from '@/components/game-reward-banner';

const GAME_ID = 'quiz-santos';

type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'idle' | 'difficulty' | 'playing' | 'result';

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; emoji: string; desc: string }> = {
  facil:   { label: 'Fácil',   color: C.green,  emoji: '🌱', desc: 'Conhecimentos básicos da fé católica' },
  medio:   { label: 'Médio',   color: C.gold,   emoji: '✝️', desc: 'Santos, sacramentos e doutrina' },
  dificil: { label: 'Difícil', color: C.red,    emoji: '📖', desc: 'Teologia, concílios e história da Igreja' },
};

export default function QuizSantosScreen() {
  const theme  = useTheme();
  const scheme = useColorScheme() ?? 'light';
  const { reportResult } = useGameStore();
  const { user, refreshProfile } = useAuth();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const { packs } = useGamePacks('quiz');
  const allQuestions = useMemo(() => mergeQuizQuestions(ALL_QUESTIONS, packs), [packs]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [questions, setQuestions] = useState<typeof ALL_QUESTIONS>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    if (phase === 'result' && !reported.current) {
      reported.current = true;
      const isPerfect = score === questions.length;
      const XP = { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL };
      reportResult({ gameId: GAME_ID, score: score * XP[difficulty], perfectQuiz: isPerfect });
      markLevelComplete(GAME_ID, difficulty);
      if (user?.id) {
        const coins = ECONOMY.COMPLETAR_QUIZ + (isPerfect ? ECONOMY.BONUS_QUIZ_PERFEITO : 0);
        supabase.rpc('add_coins', { p_user_id: user.id, p_amount: coins })
          .then(() => { setCoinsEarned(coins); refreshProfile(); })
          .catch(() => {});
      }
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, questions.length, reportResult, user, refreshProfile, difficulty, markLevelComplete]);

  const startWithDifficulty = useCallback((diff: Difficulty) => {
    setCoinsEarned(null);
    const filtered = allQuestions.filter(q => q.difficulty === diff);
    setDifficulty(diff);
    setQuestions(filtered);
    setIndex(0);
    setSelected(null);
    setScore(0);
    setPhase('playing');
  }, [allQuestions]);

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null || questions.length === 0) return;
      setSelected(i);
      if (i === questions[index].correct) setScore(s => s + 1);
    },
    [selected, questions, index],
  );

  const next = useCallback(() => {
    setSelected(null);
    if (index + 1 < questions.length) {
      setIndex(i => i + 1);
    } else {
      setPhase('result');
    }
  }, [index, questions.length]);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const medal = pct >= 80 ? '🥇' : pct >= 60 ? '🥈' : '🥉';
  const resultMsg =
    pct >= 80
      ? `Excelente! Você domina o nível ${cfg.label.toLowerCase()}!`
      : pct >= 60
        ? 'Bom trabalho! Continue aprendendo a fé católica.'
        : 'Continue estudando — cada pergunta é uma oportunidade de crescer!';

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz Católico" subtitle="CONHECIMENTO" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/quiz.png')} style={styles.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={styles.textCenter}>
              Quiz Católico
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {allQuestions.length} perguntas sobre doutrina, santos e história da Igreja.{'\n'}Escolha seu nível e teste o seu conhecimento!
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>ESCOLHER NÍVEL</ThemedText>
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
          <GameHeader title="Quiz Católico" subtitle="ESCOLHA O NÍVEL" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }]}>
            <ThemedText type="subtitle" style={styles.textCenter}>Qual nível deseja jogar?</ThemedText>
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => {
              const dc = DIFFICULTY_CONFIG[diff];
              const done = isLevelComplete(GAME_ID, diff);
              return (
                <TouchableOpacity
                  key={diff}
                  style={[styles.diffBtn, { borderColor: dc.color, backgroundColor: theme.backgroundElement }]}
                  onPress={() => startWithDifficulty(diff)}
                  activeOpacity={0.8}>
                  <View style={styles.diffBtnInner}>
                    <View style={styles.diffHeaderRow}>
                      <View style={[styles.diffBadge, { backgroundColor: dc.color + '22' }]}>
                        <ThemedText style={[styles.diffBadgeText, { color: dc.color }]}>{dc.emoji} {dc.label}</ThemedText>
                      </View>
                      {done && <ThemedText style={{ fontSize: 16 }}>✅</ThemedText>}
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[styles.diffCount, { color: dc.color }]}>
                      {done ? 'Concluído · jogar novamente' : `${allQuestions.filter(q => q.difficulty === diff).length} perguntas`}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Quiz Católico" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22', alignSelf: 'center' }]}>
              <ThemedText style={[styles.diffBadgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
            </View>
            <ThemedText type="subtitle">
              {score}/{questions.length} acertos
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {resultMsg}
            </ThemedText>
            <GameRewardBanner xp={score * { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL }[difficulty]} coins={coinsEarned} />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: cfg.color }]} onPress={() => startWithDifficulty(difficulty)} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: cfg.color }]} onPress={() => setPhase('difficulty')} activeOpacity={0.8}>
              <ThemedText style={[styles.outlineBtnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const q = questions[index];
  if (!q) return null;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Quiz Católico"
          onBack={() => setPhase('difficulty')}
          right={
            <ThemedText type="smallBold" style={{ color: cfg.color }}>
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
                { width: `${((index + 1) / questions.length) * 100}%`, backgroundColor: cfg.color },
              ]}
            />
          </View>
          <ThemedText themeColor="textSecondary" style={styles.progressLabel}>
            {index + 1} de {questions.length}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.topicBadge}>
            <ThemedText style={styles.topicBadgeText}>{cfg.emoji} {q.topic}</ThemedText>
          </ThemedView>

          <ThemedText style={styles.questionText}>{q.question}</ThemedText>

          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isCorrect  = i === q.correct;
              const isSelected = i === selected;
              const revealed   = selected !== null;

              const defaultBg     = scheme === 'dark' ? theme.backgroundElement : '#FFFFFF';
              const defaultBorder = scheme === 'dark' ? C.border : 'rgba(0,0,0,0.10)';

              let bg          = defaultBg;
              let textColor   = theme.text;
              let borderColor = defaultBorder;

              if (revealed) {
                if (isCorrect)        { bg = C.green; textColor = '#fff'; borderColor = C.green; }
                else if (isSelected)  { bg = C.red;   textColor = '#fff'; borderColor = C.red; }
                else                  { textColor = theme.textSecondary; }
              }

              return (
                <TouchableOpacity
                  key={opt}
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
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: cfg.color }]} onPress={next} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>
                {index + 1 === questions.length ? 'VER RESULTADO' : 'PRÓXIMA →'}
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
  diffBtnInner: {
    padding: Spacing.three,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  diffHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: C.radius.pill,
  },
  diffBadgeText: { fontSize: 13, fontWeight: '700' },
  diffDesc: { fontSize: 13, lineHeight: 18 },
  diffCount: { fontSize: 12, fontWeight: '600' },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 13, textAlign: 'right', marginTop: -Spacing.one },
  topicBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: C.radius.pill,
    borderWidth: 1,
    borderColor: C.border,
  },
  topicBadgeText: { fontSize: 13 },
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
    padding: Spacing.three,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
});
