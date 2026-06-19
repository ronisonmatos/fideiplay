import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';

interface Verse {
  words: string[];
  reference: string;
  options: string[];
}

const VERSES: Verse[] = [
  {
    words: ['Porque', 'Deus', 'amou', 'o', 'mundo', 'de', 'tal', 'maneira', 'que', 'deu', 'o', 'seu', 'Filho', 'unigênito.'],
    reference: 'João 3:16',
    options: ['João 3:16', 'Mateus 5:3', 'Salmos 23:1', 'Romanos 8:28'],
  },
  {
    words: ['O', 'Senhor', 'é', 'o', 'meu', 'pastor;', 'nada', 'me', 'faltará.'],
    reference: 'Salmos 23:1',
    options: ['Salmos 23:1', 'João 10:11', 'Isaías 40:31', 'Hebreus 13:6'],
  },
  {
    words: ['Eu', 'sou', 'o', 'caminho,', 'a', 'verdade', 'e', 'a', 'vida.'],
    reference: 'João 14:6',
    options: ['João 14:6', 'João 11:25', 'Mateus 7:14', 'Lucas 4:18'],
  },
  {
    words: ['Tudo', 'posso', 'naquele', 'que', 'me', 'fortalece.'],
    reference: 'Filipenses 4:13',
    options: ['Filipenses 4:13', 'Romanos 8:37', '2 Coríntios 12:9', 'Isaías 41:10'],
  },
  {
    words: ['Amai-vos', 'uns', 'aos', 'outros,', 'como', 'eu', 'vos', 'amei.'],
    reference: 'João 15:12',
    options: ['João 15:12', '1 Coríntios 13:4', 'Mateus 22:39', 'Romanos 13:9'],
  },
];

type Phase = 'idle' | 'playing' | 'answered' | 'done';

export default function VersiculoMisteriosoScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [verseIdx, setVerseIdx] = useState(0);
  const [revealed, setRevealed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [correctVerses, setCorrectVerses] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    if (phase === 'done' && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'versiculo',
        score: score * 10,
        allVersesCorrect: correctVerses === VERSES.length,
      });
    }
    if (phase === 'playing') reported.current = false;
  }, [phase, score, correctVerses, reportResult]);

  const verse = VERSES[verseIdx];
  const totalWords = verse.words.length;
  const canRevealMore = revealed < totalWords;

  const start = () => {
    setPhase('playing');
    setVerseIdx(0);
    setRevealed(2);
    setSelected(null);
    setScore(0);
    setCorrectVerses(0);
  };

  const revealMore = () => {
    setRevealed(r => Math.min(r + 2, totalWords));
  };

  const calcPoints = () => Math.max(5 - Math.floor(revealed / 3), 1);

  const handleGuess = useCallback(
    (opt: string) => {
      if (selected !== null) return;
      setSelected(opt);
      const correct = opt === verse.reference;
      const pts = correct ? calcPoints() : 0;
      setRoundPoints(pts);
      setScore(s => s + pts);
      if (correct) setCorrectVerses(c => c + 1);
      setPhase('answered');
    },
    [selected, verse.reference, revealed],
  );

  const next = () => {
    if (verseIdx + 1 < VERSES.length) {
      setVerseIdx(i => i + 1);
      setRevealed(2);
      setSelected(null);
      setRoundPoints(0);
      setPhase('playing');
    } else {
      setPhase('done');
    }
  };

  const maxScore = VERSES.length * 5;
  const pct = Math.round((score / maxScore) * 100);

  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Versículo Misterioso" subtitle="Bíblia" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>📖</ThemedText>
            <ThemedText type="subtitle" style={styles.textCenter}>
              Versículo Misterioso
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              Descubra o versículo a partir de dicas progressivas.{'\n'}Quanto menos palavras revelar, mais pontos!
            </ThemedText>
            <View style={styles.rulesBox}>
              <ThemedText type="smallBold">Pontuação por rodada:</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ruleItem}>⚡ 1–2 palavras → 5 pontos</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ruleItem}>📘 3–5 palavras → 3 pontos</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.ruleItem}>📚 6+ palavras → 1 ponto</ThemedText>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>Começar</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'done') {
    const medal = pct >= 80 ? '🌟' : pct >= 50 ? '⭐' : '📖';
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Versículo Misterioso" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.bigEmoji}>{medal}</ThemedText>
            <ThemedText type="subtitle">{score}/{maxScore} pontos</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              {pct >= 80
                ? 'Você conhece as Escrituras muito bem!'
                : pct >= 50
                  ? 'Bom conhecimento bíblico! Continue praticando.'
                  : 'Continue lendo a Bíblia para melhorar!'}
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={start} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>Jogar Novamente</ThemedText>
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
          title="Versículo Misterioso"
          right={
            <ThemedText type="smallBold" style={{ color: '#8B5CF6' }}>
              {score} pts
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[
            styles.playScroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <View style={styles.progressRow}>
            <ThemedText themeColor="textSecondary" style={styles.smallText}>
              Versículo {verseIdx + 1} de {VERSES.length}
            </ThemedText>
            <ThemedText style={{ color: '#8B5CF6', fontWeight: '600', fontSize: 13 }}>
              {calcPoints()} pts possíveis
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.verseCard}>
            <View style={styles.wordsRow}>
              {verse.words.map((word, i) => (
                <ThemedText
                  key={i}
                  style={[
                    styles.word,
                    i < revealed
                      ? styles.wordVisible
                      : [styles.wordHidden, { backgroundColor: theme.backgroundSelected }],
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
                  style={[styles.hintBtn, { borderColor: '#8B5CF6' }]}
                  onPress={revealMore}
                  activeOpacity={0.75}>
                  <ThemedText style={{ color: '#8B5CF6', fontWeight: '600' }}>
                    💡 Revelar mais ({revealed}/{totalWords} palavras)
                  </ThemedText>
                </TouchableOpacity>
              )}
              <ThemedText type="smallBold" style={styles.guessLabel}>
                Qual é este versículo?
              </ThemedText>
              <View style={styles.options}>
                {verse.options.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleGuess(opt)}
                    activeOpacity={0.75}
                    style={[styles.option, { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={styles.optText}>{opt}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {phase === 'answered' && (
            <>
              <ThemedView
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: selected === verse.reference ? '#22C55E22' : '#EF444422',
                    borderColor: selected === verse.reference ? '#22C55E' : '#EF4444',
                  },
                ]}>
                <ThemedText
                  style={{
                    color: selected === verse.reference ? '#22C55E' : '#EF4444',
                    fontWeight: '700',
                    fontSize: 15,
                  }}>
                  {selected === verse.reference
                    ? `✅ Correto! +${roundPoints} pts`
                    : `❌ Era ${verse.reference}`}
                </ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.fullVerseCard}>
                <ThemedText themeColor="textSecondary" style={styles.smallText}>
                  Versículo completo:
                </ThemedText>
                <ThemedText style={styles.fullVerseText}>{verse.words.join(' ')}</ThemedText>
                <ThemedText style={{ color: '#8B5CF6', fontWeight: '600', marginTop: Spacing.one }}>
                  — {verse.reference}
                </ThemedText>
              </ThemedView>

              <TouchableOpacity style={styles.primaryBtn} onPress={next} activeOpacity={0.8}>
                <ThemedText style={styles.primaryBtnText}>
                  {verseIdx + 1 === VERSES.length ? 'Ver Resultado' : 'Próximo →'}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  textCenter: { textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  bigEmoji: { fontSize: 64 },
  rulesBox: { alignSelf: 'stretch', gap: Spacing.one, paddingHorizontal: Spacing.four },
  ruleItem: { fontSize: 14, marginTop: 2 },
  primaryBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: 99,
    alignItems: 'center',
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallText: { fontSize: 13 },
  verseCard: { borderRadius: Spacing.three, padding: Spacing.three },
  wordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, rowGap: 8 },
  word: { fontSize: 16 },
  wordVisible: { fontWeight: '500' },
  wordHidden: { borderRadius: 4, paddingHorizontal: 2, color: 'transparent', overflow: 'hidden' },
  hintBtn: {
    borderWidth: 1.5,
    borderRadius: 99,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  guessLabel: { marginTop: Spacing.one },
  options: { gap: Spacing.two },
  option: { padding: Spacing.three, borderRadius: Spacing.two },
  optText: { fontSize: 15 },
  resultCard: { borderWidth: 1.5, borderRadius: Spacing.two, padding: Spacing.three, alignItems: 'center' },
  fullVerseCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  fullVerseText: { fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
});
