import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useTheme } from '@/hooks/use-theme';

const GRID = [
  ['A', 'M', 'O', 'R', 'F', 'P', 'K', 'G'],
  ['Z', 'H', 'B', 'C', 'W', 'X', 'Q', 'S'],
  ['V', 'N', 'J', 'E', 'S', 'U', 'S', 'A'],
  ['D', 'L', 'T', 'Y', 'W', 'K', 'P', 'N'],
  ['E', 'Q', 'C', 'Z', 'M', 'R', 'F', 'T'],
  ['U', 'S', 'A', 'N', 'T', 'O', 'H', 'A'],
  ['S', 'V', 'I', 'B', 'X', 'C', 'J', 'W'],
  ['G', 'Y', 'W', 'P', 'L', 'Z', 'K', 'T'],
];

interface WordEntry {
  word: string;
  cells: [number, number][];
}

const WORDS: WordEntry[] = [
  { word: 'AMOR', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { word: 'JESUS', cells: [[2, 2], [2, 3], [2, 4], [2, 5], [2, 6]] },
  { word: 'SANTO', cells: [[5, 1], [5, 2], [5, 3], [5, 4], [5, 5]] },
  { word: 'DEUS', cells: [[3, 0], [4, 0], [5, 0], [6, 0]] },
  { word: 'SANTA', cells: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]] },
];

const GRID_SIZE = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL = Math.floor((SCREEN_WIDTH - Spacing.four * 2 - Spacing.one * (GRID_SIZE - 1)) / GRID_SIZE);

type Cell = [number, number];

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

function pathToWord(path: Cell[]): string {
  return path.map(([r, c]) => GRID[r][c]).join('');
}

function matchWord(path: Cell[]): string | null {
  const forward = pathToWord(path);
  const reverse = forward.split('').reverse().join('');
  for (const w of WORDS) {
    if (w.word === forward || w.word === reverse) return w.word;
  }
  return null;
}

function cellKey([r, c]: Cell) {
  return `${r},${c}`;
}

export default function PalavrasFeScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [start, setStart] = useState<Cell | null>(null);
  const [preview, setPreview] = useState<Cell[]>([]);
  const [done, setDone] = useState(false);
  const reported = useRef(false);

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      reportResult({
        gameId: 'palavras-fe',
        score: WORDS.length * 10,
      });
    }
    if (!done) reported.current = false;
  }, [done, reportResult]);

  const handleCellPress = useCallback(
    (cell: Cell) => {
      if (done) return;

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

      const matched = matchWord(path);
      if (matched && !foundWords.includes(matched)) {
        const newFound = [...foundWords, matched];
        const newCells = new Set(foundCells);
        path.forEach(c => newCells.add(cellKey(c)));
        setFoundWords(newFound);
        setFoundCells(newCells);
        setStart(null);
        setPreview([]);
        if (newFound.length === WORDS.length) setDone(true);
      } else {
        setStart(cell);
        setPreview([cell]);
      }
    },
    [start, foundWords, foundCells, done],
  );

  const previewSet = new Set(preview.map(cellKey));
  const isSelected = (cell: Cell) => start && cellKey(start) === cellKey(cell);
  const isPreview = (cell: Cell) => previewSet.has(cellKey(cell)) && !isSelected(cell);
  const isFound = (cell: Cell) => foundCells.has(cellKey(cell));

  const reset = () => {
    setFoundWords([]);
    setFoundCells(new Set());
    setStart(null);
    setPreview([]);
    setDone(false);
  };

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Palavras da Fé"
          subtitle="Vocabulário"
          right={
            <ThemedText type="smallBold" style={{ color: '#3B82F6' }}>
              {foundWords.length}/{WORDS.length}
            </ThemedText>
          }
        />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}>
          <ThemedText themeColor="textSecondary" style={styles.hint}>
            Toque na primeira e na última letra de cada palavra para encontrá-la.
          </ThemedText>

          {done && (
            <ThemedView style={styles.winBanner}>
              <ThemedText style={styles.winText}>🎉 Você encontrou todas as palavras!</ThemedText>
              <TouchableOpacity onPress={reset} style={styles.resetBtn} activeOpacity={0.8}>
                <ThemedText style={styles.resetBtnText}>Jogar Novamente</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          <View style={styles.grid}>
            {GRID.map((row, r) => (
              <View key={r} style={styles.row}>
                {row.map((letter, c) => {
                  const cell: Cell = [r, c];
                  const found = isFound(cell);
                  const sel = isSelected(cell);
                  const prev = isPreview(cell);

                  let bg: string = theme.backgroundElement;
                  let textColor: string = theme.text;
                  let borderColor = 'transparent';

                  if (found) { bg = '#3B82F633'; borderColor = '#3B82F6'; textColor = '#3B82F6'; }
                  else if (sel) { bg = '#3B82F6'; textColor = '#fff'; }
                  else if (prev) { bg = '#3B82F644'; textColor = theme.text; }

                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => handleCellPress(cell)}
                      activeOpacity={0.7}
                      style={[
                        styles.cell,
                        { width: CELL, height: CELL, backgroundColor: bg, borderColor },
                      ]}>
                      <ThemedText style={[styles.cellLetter, { color: textColor }]}>
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
              Palavras para encontrar:
            </ThemedText>
            <View style={styles.wordChips}>
              {WORDS.map(w => {
                const found = foundWords.includes(w.word);
                return (
                  <ThemedView
                    key={w.word}
                    style={[
                      styles.chip,
                      found
                        ? { backgroundColor: '#3B82F622', borderColor: '#3B82F6', borderWidth: 1 }
                        : { backgroundColor: theme.backgroundElement },
                    ]}>
                    <ThemedText
                      style={[
                        styles.chipText,
                        found ? { color: '#3B82F6', textDecorationLine: 'line-through' } : {},
                      ]}>
                      {w.word}
                    </ThemedText>
                  </ThemedView>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  winBanner: {
    alignSelf: 'stretch',
    backgroundColor: '#3B82F622',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  winText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  resetBtn: { backgroundColor: '#3B82F6', paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: 99 },
  resetBtnText: { color: '#fff', fontWeight: '700' },
  grid: { gap: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.one },
  cell: { borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cellLetter: { fontSize: 14, fontWeight: '700' },
  wordList: { alignSelf: 'stretch', gap: Spacing.two },
  wordListTitle: {},
  wordChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 99 },
  chipText: { fontSize: 14, fontWeight: '600' },
});
