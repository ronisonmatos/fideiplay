import { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { PUZZLE_THEMES } from '@/constants/puzzle-themes';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergePuzzleThemes } from '@/hooks/use-game-packs';
import { placeWords } from '@/lib/word-grid';
import { supabase } from '@/lib/supabase';

const GAME_ID = 'palavras-fe';

// ── Types ──────────────────────────────────────────────────────────────────────
type Difficulty = 'facil' | 'medio' | 'dificil';
type Phase = 'select' | 'playing' | 'result';
type Cell = [number, number];

interface PuzzleTheme {
  title: string;
  subtitle: string;
  words: string[];
  difficulty: Difficulty;
  gridSize: number;
}

interface ActivePuzzle {
  theme: PuzzleTheme;
  grid: string[][];
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; emoji: string; desc: string }> = {
  facil:  { label: 'Fácil',   color: C.green, emoji: '🌱', desc: '3 temas · grade 8×8 · 5 palavras'   },
  medio:  { label: 'Médio',   color: C.gold,  emoji: '🌿', desc: '3 temas · grade 9×9 · 6 palavras'   },
  dificil:{ label: 'Difícil', color: C.red,   emoji: '🌳', desc: '3 temas · grade 10×10 · 7 palavras' },
};

// ── Path helpers ───────────────────────────────────────────────────────────────
function getPath(start: Cell, end: Cell): Cell[] | null {
  const [r1, c1] = start;
  const [r2, c2] = end;
  const dr = r2 - r1;
  const dc = c2 - c1;
  if (dr === 0 && dc === 0) return null;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = dr === 0 ? 0 : dr / Math.abs(dr);
  const sc = dc === 0 ? 0 : dc / Math.abs(dc);
  const path: Cell[] = [];
  for (let i = 0; i <= steps; i++) path.push([r1 + i * sr, c1 + i * sc]);
  return path;
}

function pathToWord(path: Cell[], grid: string[][]): string {
  return path.map(([r, c]) => grid[r][c]).join('');
}

function matchWord(path: Cell[], grid: string[][], words: string[]): string | null {
  const forward = pathToWord(path, grid);
  const reverse = forward.split('').reverse().join('');
  for (const w of words) {
    if (w === forward || w === reverse) return w;
  }
  return null;
}

function cellKey([r, c]: Cell) { return `${r},${c}`; }

// Acha onde uma palavra está escondida na grade (8 direções, em linha reta) — usado
// pela dica "revelar letra", já que o jogador já sabe a palavra, só não sabe onde está.
function findWordCells(grid: string[][], word: string): Cell[] | null {
  const size = grid.length;
  const dirs: Cell[] = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of dirs) {
        let ok = true;
        const cells: Cell[] = [];
        for (let i = 0; i < word.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || cc < 0 || rr >= size || cc >= size || grid[rr][cc] !== word[i]) { ok = false; break; }
          cells.push([rr, cc]);
        }
        if (ok) return cells;
      }
    }
  }
  return null;
}

// ── Screen ─────────────────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PalavrasFeScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const { user, profile, refreshProfile } = useAuth();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const { packs } = useGamePacks('palavras');

  const [phase, setPhase] = useState<Phase>('select');
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [activeDiff, setActiveDiff] = useState<Difficulty>('facil');
  const [activePuzzle, setActivePuzzle] = useState<ActivePuzzle | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [start, setStart] = useState<Cell | null>(null);
  const [preview, setPreview] = useState<Cell[]>([]);
  const [hintCell, setHintCell] = useState<Cell | null>(null);
  const reported = useRef(false);

  function startDifficulty(diff: Difficulty) {
    const allThemes = mergePuzzleThemes(PUZZLE_THEMES, packs);
    const themes = allThemes.filter(t => t.difficulty === diff);
    const shuffled = [...themes].sort(() => Math.random() - 0.5);
    for (const t of shuffled) {
      let result: ReturnType<typeof placeWords> = null;
      for (let i = 0; i < 5; i++) {
        result = placeWords(t.words, t.gridSize);
        if (result) break;
      }
      if (result) {
        setActiveDiff(diff);
        setActivePuzzle({ theme: t, grid: result.grid });
        setFoundWords([]);
        setFoundCells(new Set());
        setStart(null);
        setPreview([]);
        setHintCell(null);
        setCoinsEarned(null);
        reported.current = false;
        setPhase('playing');
        return;
      }
    }
  }

  const handleCellPress = useCallback(
    (cell: Cell) => {
      if (phase !== 'playing' || !activePuzzle) return;
      const { grid, theme: puzzleTheme } = activePuzzle;
      const words = puzzleTheme.words;

      if (!start) {
        setStart(cell);
        setPreview([cell]);
        return;
      }
      if (cellKey(start) === cellKey(cell)) {
        setStart(null);
        setPreview([]);
        return;
      }
      const path = getPath(start, cell);
      if (!path) {
        setStart(cell);
        setPreview([cell]);
        return;
      }
      const matched = matchWord(path, grid, words);
      if (matched && !foundWords.includes(matched)) {
        const newFound = [...foundWords, matched];
        const newCells = new Set(foundCells);
        path.forEach(c => newCells.add(cellKey(c)));
        setFoundWords(newFound);
        setFoundCells(newCells);
        setStart(null);
        setPreview([]);
        setHintCell(null);
        if (newFound.length === words.length) {
          if (!reported.current) {
            reported.current = true;
            const XP = { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL };
            reportResult({ gameId: GAME_ID, score: words.length * XP[activeDiff] });
            markLevelComplete(GAME_ID, activeDiff);
            if (user?.id) {
              supabase.rpc('add_coins', { p_user_id: user.id, p_amount: ECONOMY.COMPLETAR_JOGO })
                .then(() => { setCoinsEarned(ECONOMY.COMPLETAR_JOGO); refreshProfile(); })
                .catch(() => {});
            }
          }
          setPhase('result');
        }
      } else {
        setStart(cell);
        setPreview([cell]);
      }
    },
    [phase, activePuzzle, start, foundWords, foundCells, reportResult, markLevelComplete],
  );

  const handleRevealLetter = useCallback(async () => {
    if (!user || !activePuzzle) return;
    if (!profile || profile.coins < ECONOMY.PALAVRA_FE_REVELAR_LETRA) {
      Alert.alert(
        'Moedas insuficientes',
        `Você precisa de ${ECONOMY.PALAVRA_FE_REVELAR_LETRA} 🪙 para revelar uma letra. Assista um anúncio ou aguarde o bônus de moedas.`,
      );
      return;
    }
    const unfound = activePuzzle.theme.words.filter(w => !foundWords.includes(w));
    if (unfound.length === 0) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const cells = findWordCells(activePuzzle.grid, target);
    if (!cells || cells.length === 0) return;
    const cell = cells[Math.floor(Math.random() * cells.length)];
    try {
      const { error } = await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -ECONOMY.PALAVRA_FE_REVELAR_LETRA });
      if (error) throw error;
      setHintCell(cell);
      refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível usar a dica agora. Tente novamente.');
    }
  }, [user, profile, activePuzzle, foundWords, refreshProfile]);

  // ── SELECT ─────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Palavras da Fé" subtitle="VOCABULÁRIO" />
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <ThemedText style={styles.selectTitle}>Escolha a Dificuldade</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.selectSub}>
              Um caça-palavras católico único será gerado para você.
            </ThemedText>
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => {
              const cfg = DIFFICULTY_CONFIG[diff];
              const done = isLevelComplete(GAME_ID, diff);
              return (
                <TouchableOpacity
                  key={diff}
                  onPress={() => startDifficulty(diff)}
                  activeOpacity={0.82}
                  style={[styles.diffCard, { borderColor: cfg.color + '88' }]}>
                  <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22' }]}>
                    <ThemedText style={styles.diffEmoji}>{cfg.emoji}</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.diffLabel, { color: cfg.color }]}>{cfg.label}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.diffDesc}>
                      {done ? 'Concluído · jogar novamente' : cfg.desc}
                    </ThemedText>
                  </View>
                  {done && <ThemedText style={{ fontSize: 16 }}>✅</ThemedText>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const cfg = DIFFICULTY_CONFIG[activeDiff];
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Palavras da Fé" subtitle="VOCABULÁRIO" />
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={styles.resultCard}>
              <ThemedText style={styles.resultEmoji}>🎉</ThemedText>
              <ThemedText style={styles.resultTitle}>Parabéns!</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.resultSub}>
                Você encontrou todas as {activePuzzle?.theme.words.length} palavras!
              </ThemedText>
              <View style={[styles.resultBadge, { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}>
                <ThemedText style={[styles.resultBadgeText, { color: cfg.color }]}>
                  {cfg.emoji} {cfg.label} · {activePuzzle?.theme.title}
                </ThemedText>
              </View>
            </View>
            <GameRewardBanner xp={(activePuzzle?.theme.words.length ?? 0) * { facil: ECONOMY.XP_FACIL, medio: ECONOMY.XP_MEDIO, dificil: ECONOMY.XP_DIFICIL }[activeDiff]} coins={coinsEarned} />
            <TouchableOpacity
              onPress={() => startDifficulty(activeDiff)}
              style={[styles.btn, { backgroundColor: cfg.color }]}
              activeOpacity={0.8}>
              <ThemedText style={styles.btnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPhase('select')}
              style={[styles.btnOutline, { borderColor: cfg.color }]}
              activeOpacity={0.8}>
              <ThemedText style={[styles.btnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (!activePuzzle) return null;
  const { grid, theme: puzzleTheme } = activePuzzle;
  const words = puzzleTheme.words;
  const cfg = DIFFICULTY_CONFIG[activeDiff];
  const gridSize = grid.length;
  const cellSize = Math.floor((SCREEN_WIDTH - Spacing.four * 2 - Spacing.one * (gridSize - 1)) / gridSize);

  const previewSet = new Set(preview.map(cellKey));
  const isSelected = (cell: Cell) => start !== null && cellKey(start) === cellKey(cell);
  const isPreview = (cell: Cell) => previewSet.has(cellKey(cell)) && !isSelected(cell);
  const isFound = (cell: Cell) => foundCells.has(cellKey(cell));
  const isHinted = (cell: Cell) => !!hintCell && hintCell[0] === cell[0] && hintCell[1] === cell[1];

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Palavras da Fé"
          subtitle="VOCABULÁRIO"
          onBack={() => setPhase('select')}
          right={
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <ThemedText type="smallBold" style={{ color: cfg.color }}>
                {foundWords.length}/{words.length}
              </ThemedText>
              <View style={[styles.levelBadge, { backgroundColor: cfg.color + '22' }]}>
                <ThemedText style={[styles.levelBadgeText, { color: cfg.color }]}>
                  {cfg.emoji} {cfg.label}
                </ThemedText>
              </View>
            </View>
          }
        />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
          <View style={styles.themeHeader}>
            <ThemedText style={styles.themeTitle}>{puzzleTheme.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.themeSub}>{puzzleTheme.subtitle}</ThemedText>
          </View>

          <ThemedText themeColor="textSecondary" style={styles.hint}>
            Toque na primeira e na última letra de cada palavra.
          </ThemedText>

          <View style={styles.grid}>
            {grid.map((row, r) => (
              <View key={r} style={styles.gridRow}>
                {row.map((letter, c) => {
                  const cell: Cell = [r, c];
                  const found = isFound(cell);
                  const sel = isSelected(cell);
                  const prev = isPreview(cell);
                  const hinted = !found && isHinted(cell);

                  let bg = theme.backgroundElement;
                  let textColor = theme.text;
                  let borderColor = 'transparent';

                  if (found)       { bg = cfg.color + '33'; borderColor = cfg.color; textColor = cfg.color; }
                  else if (sel)    { bg = cfg.color; textColor = '#fff'; borderColor = cfg.color; }
                  else if (prev)   { bg = cfg.color + '44'; borderColor = cfg.color + '88'; }
                  else if (hinted) { bg = C.gold + '55'; borderColor = C.gold; }

                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => handleCellPress(cell)}
                      activeOpacity={0.7}
                      style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: bg, borderColor }]}>
                      <ThemedText style={[styles.cellLetter, { color: textColor, fontSize: Math.max(10, Math.floor(cellSize * 0.38)) }]}>
                        {letter}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.wordList}>
            <ThemedText type="smallBold" style={styles.wordListTitle}>
              PALAVRAS PARA ENCONTRAR
            </ThemedText>
            <View style={styles.wordChips}>
              {words.map(w => {
                const found = foundWords.includes(w);
                return (
                  <ThemedView
                    key={w}
                    style={[
                      styles.chip,
                      found
                        ? { backgroundColor: cfg.color + '22', borderColor: cfg.color, borderWidth: 1 }
                        : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: C.border },
                    ]}>
                    <ThemedText
                      style={[styles.chipText, found ? { color: cfg.color, textDecorationLine: 'line-through' } : {}]}>
                      {w}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity onPress={handleRevealLetter} style={styles.hintFab} activeOpacity={0.8}>
          <ThemedText style={styles.hintFabText}>
            💡 Revelar letra ({ECONOMY.PALAVRA_FE_REVELAR_LETRA} 🪙)
          </ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Select
  selectTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  selectSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  diffCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: C.radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
  },
  diffBadge: { width: 52, height: 52, borderRadius: C.radius.md, alignItems: 'center', justifyContent: 'center' },
  diffEmoji: { fontSize: 26 },
  diffLabel: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  diffDesc: { fontSize: 12 },

  // Result
  resultCard: { alignSelf: 'stretch', alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  resultEmoji: { fontSize: 52 },
  resultTitle: { fontSize: 26, fontWeight: '800' },
  resultSub: { fontSize: 14, textAlign: 'center' },
  resultBadge: {
    borderRadius: C.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: Spacing.two,
  },
  resultBadgeText: { fontSize: 13, fontWeight: '700' },
  btn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: C.radius.pill,
    alignItems: 'center',
  },
  btnOutline: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    borderWidth: 2,
  },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1.1, fontSize: 14 },

  // Playing
  levelBadge: { borderRadius: C.radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeText: { fontSize: 10, fontWeight: '700' },
  themeHeader: { alignItems: 'center', gap: 2 },
  themeTitle: { fontSize: 18, fontWeight: '800' },
  themeSub: { fontSize: 12 },
  grid: { gap: Spacing.one },
  gridRow: { flexDirection: 'row', gap: Spacing.one },
  cell: { borderRadius: C.radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cellLetter: { fontWeight: '700' },
  wordList: { alignSelf: 'stretch', gap: Spacing.two },
  wordListTitle: { letterSpacing: 1.1 },
  wordChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: C.radius.pill },
  chipText: { fontSize: 14, fontWeight: '600' },
  hintFab: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: C.radius.pill,
  },
  hintFabText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
