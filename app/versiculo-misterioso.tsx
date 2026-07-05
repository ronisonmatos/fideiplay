import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { ALL_FRASES } from '@/constants/versiculo-frases';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeVersiculo } from '@/hooks/use-game-packs';
import { supabase } from '@/lib/supabase';
import { GameRewardBanner } from '@/components/game-reward-banner';

const GAME_ID = 'versiculo';

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
  const { user, refreshProfile } = useAuth();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const { packs } = useGamePacks('versiculo');
  const [phase, setPhase] = useState<Phase>('idle');
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
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
      const allCorrect = correctCount === frases.length;
      const maxScore = frases.length * 5;
      const XP = { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL };
      reportResult({
        gameId: GAME_ID,
        score: correctCount * XP[difficulty],
        allVersesCorrect: allCorrect,
        pct: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
      });
      markLevelComplete(GAME_ID, difficulty);
      if (user?.id) {
        const coins = ECONOMY.COMPLETAR_QUIZ + (allCorrect ? ECONOMY.BONUS_QUIZ_PERFEITO : 0);
        supabase.rpc('add_coins', { p_user_id: user.id, p_amount: coins })
          .then(() => { setCoinsEarned(coins); refreshProfile(); })
          .catch(() => {});
      }
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, correctCount, frases.length, reportResult, user, refreshProfile, difficulty, markLevelComplete]);

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
    setCoinsEarned(null);
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
              const done = isLevelComplete(GAME_ID, diff);
              return (
                <TouchableOpacity
                  key={diff}
                  style={[s.diffBtn, { borderColor: dc.color }]}
                  onPress={() => startWithDifficulty(diff)}
                  activeOpacity={0.8}>
                  <ThemedView type="backgroundElement" style={s.diffBtnInner}>
                    <View style={s.diffHeaderRow}>
                      <View style={[s.diffBadge, { backgroundColor: dc.color + '22' }]}>
                        <ThemedText style={[s.diffBadgeText, { color: dc.color }]}>{dc.emoji} {dc.label}</ThemedText>
                      </View>
                      {done && <ThemedText style={{ fontSize: 16 }}>✅</ThemedText>}
                    </View>
                    <ThemedText themeColor="textSecondary" style={s.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[s.diffCount, { color: dc.color }]}>
                      {done ? 'Concluído · jogar novamente' : `15 frases · começa com ${dc.initialReveal} palavra${dc.initialReveal > 1 ? 's' : ''}`}
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
            <GameRewardBanner xp={correctCount * { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL }[difficulty]} coins={coinsEarned} />
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
          onBack={() => setPhase('difficulty')}
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
