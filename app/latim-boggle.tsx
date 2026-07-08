import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, LayoutChangeEvent, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  BounceIn,
  ZoomOut,
  makeMutable,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { GameHeader } from '@/components/game-header';
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { LATIM_BOGGLE_LEVELS, type LatimBoggleDifficulty, type LatimBoggleLevel } from '@/constants/latim-boggle-levels';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useGamePacks, mergeLatimLevels } from '@/hooks/use-game-packs';
import { useTheme } from '@/hooks/use-theme';
import { placeWordsAsRows } from '@/lib/word-grid';
import { supabase } from '@/lib/supabase';
import { playClickSound } from '@/lib/click-sound';

const GAME_ID = 'latim-boggle';

type Phase = 'idle' | 'difficulty' | 'playing' | 'level-complete' | 'game-complete';

interface DifficultyStyle {
  label: string;
  color: string;
  emoji: string;
  desc: string;
  xp: number;
}

const DIFFICULTY_CONFIG: Record<LatimBoggleDifficulty, DifficultyStyle> = {
  facil:   { label: 'Fácil',   color: C.green, emoji: '🌱', desc: 'Grades 6×6 · vocabulário básico da liturgia', xp: ECONOMY.XP_FACIL },
  medio:   { label: 'Médio',   color: C.gold,  emoji: '✝️', desc: 'Grades 7×7 · orações e louvor', xp: ECONOMY.XP_MEDIO },
  dificil: { label: 'Difícil', color: C.red,   emoji: '📖', desc: 'Grades 8×8 · liturgia e doutrina', xp: ECONOMY.XP_DIFICIL },
};

const IDLE_GRADIENT: [string, string] = ['#FFFFFF', '#ECE9F7'];
// Letra selecionada/formada: sempre laranja-dourado, igual em todas as dificuldades
const ORANGE_GRADIENT: [string, string] = ['#FFD54A', '#FF9500'];
const CONNECTOR_COLOR = '#FF9500';
const FOUND_OVERLAY_OPACITY = 0.88;
const LETTER_COLOR = '#2D2559';
const CONNECTOR_POOL_SIZE = 24;
const FOUND_CONNECTOR_POOL_SIZE = 28; // até 4 palavras × 7 segmentos (palavra de 8 letras)

const MAX_CELLS = 144; // até 12×12 — dá folga para níveis vindos do banco com gridSize maior que 8
const IDLE = 0;
const IN_PATH = 1;
const FOUND = 2;

function maskWord(word: string, revealed: number[] = []): string {
  if (word.length <= 2) return word;
  return word
    .split('')
    .map((ch, i) => (i === 0 || i === word.length - 1 || revealed.includes(i) ? ch : '-'))
    .join('');
}

function cellIndex(row: number, col: number, gridSize: number) {
  return row * gridSize + col;
}

// Níveis vindos do banco podem ter uma combinação de palavras/gridSize que não
// cabe (ex: palavra maior que a grade) — nesse caso não trava o app, só avisa
// no console e devolve uma grade só de preenchimento (nível fica sem solução,
// mas o jogo não quebra).
function buildLevelGrid(words: string[], gridSize: number, levelId: string): string[] {
  const rows = placeWordsAsRows(words, gridSize);
  if (rows) return rows;
  console.warn(`[latim-boggle] nível "${levelId}": não coube [${words.join(', ')}] numa grade ${gridSize}×${gridSize}`);
  return placeWordsAsRows([], gridSize) ?? [];
}

interface CellProps {
  letter: string;
  size: number;
  state: SharedValue<number>;
}

function BoggleCell({ letter, size, state }: CellProps) {
  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: state.value === IDLE ? 0.15 : 0.4,
    shadowRadius:  state.value === IDLE ? 3 : 7,
  }));
  const activeOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state.value === IN_PATH ? 1 : 0, { duration: 140 }),
  }));
  const foundOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state.value === FOUND ? FOUND_OVERLAY_OPACITY : 0, { duration: 220 }),
  }));
  const letterStyle = useAnimatedStyle(() => ({
    transform: [{
      scale: state.value === FOUND
        ? withSequence(withTiming(1.25, { duration: 120 }), withTiming(1, { duration: 120 }))
        : withTiming(1, { duration: 100 }),
    }],
  }));

  const radius = Math.max(6, Math.floor(size * 0.2));

  return (
    <Animated.View style={[styles.cellShadowWrap, { width: size, height: size, borderRadius: radius }, shadowStyle]}>
      <View style={[styles.cellInner, { borderRadius: radius }]}>
        <LinearGradient colors={IDLE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, activeOverlayStyle]}>
          <LinearGradient colors={ORANGE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, foundOverlayStyle]}>
          <LinearGradient colors={ORANGE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
          style={[styles.cellBevel, { height: size * 0.5 }]}
          pointerEvents="none"
        />
        <Animated.Text
          style={[
            styles.cellLetter,
            { fontSize: Math.max(12, Math.floor(size * 0.42)), color: LETTER_COLOR },
            letterStyle,
          ]}>
          {letter}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

interface ConnectorProps {
  index: number;
  pathSV: SharedValue<number[]>;
  gridSizeSV: SharedValue<number>;
  cellSizeSV: SharedValue<number>;
  color: string;
}

function Connector({ index, pathSV, gridSizeSV, cellSizeSV, color }: ConnectorProps) {
  const style = useAnimatedStyle(() => {
    const path = pathSV.value;
    if (index >= path.length - 1) return { opacity: 0 };
    const gs = gridSizeSV.value;
    const cs = cellSizeSV.value;
    if (cs <= 0) return { opacity: 0 };
    const a = path[index];
    const b = path[index + 1];
    const ax = (a % gs) * cs + cs / 2;
    const ay = Math.floor(a / gs) * cs + cs / 2;
    const bx = (b % gs) * cs + cs / 2;
    const by = Math.floor(b / gs) * cs + cs / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    const thickness = 6;
    // Ancora a barra pelo CENTRO (não pela ponta): a rotação do RN gira em torno
    // do centro do elemento, então para o traço realmente ligar A a B a barra
    // não-rotacionada precisa já nascer centralizada no ponto médio de A-B.
    return {
      opacity: 1,
      width: length,
      left: midX - length / 2,
      top: midY - thickness / 2,
      transform: [{ rotate: `${angle}rad` }],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.connector, { backgroundColor: color }, style]} />;
}

interface FoundConnectorProps {
  index: number;
  segmentsSV: SharedValue<number[]>;
  gridSizeSV: SharedValue<number>;
  cellSizeSV: SharedValue<number>;
  color: string;
}

// Traço fixo entre um par de células de uma palavra já encontrada — ao contrário
// de Connector (que segue a ponta do dedo num único caminho crescente), aqui cada
// instância só lê o par [a,b] correspondente ao seu índice num pool de segmentos
// acumulados de todas as palavras já formadas no nível.
function FoundConnector({ index, segmentsSV, gridSizeSV, cellSizeSV, color }: FoundConnectorProps) {
  const style = useAnimatedStyle(() => {
    const segs = segmentsSV.value;
    const a = segs[index * 2];
    const b = segs[index * 2 + 1];
    if (a === undefined || b === undefined) return { opacity: 0 };
    const gs = gridSizeSV.value;
    const cs = cellSizeSV.value;
    if (cs <= 0) return { opacity: 0 };
    const ax = (a % gs) * cs + cs / 2;
    const ay = Math.floor(a / gs) * cs + cs / 2;
    const bx = (b % gs) * cs + cs / 2;
    const by = Math.floor(b / gs) * cs + cs / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    const thickness = 6;
    return {
      opacity: 1,
      width: length,
      left: midX - length / 2,
      top: midY - thickness / 2,
      transform: [{ rotate: `${angle}rad` }],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.connector, { backgroundColor: color }, style]} />;
}

export default function LatimBoggleScreen() {
  const theme = useTheme();
  const { reportResult } = useGameStore();
  const { user, profile, refreshProfile } = useAuth();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const { packs } = useGamePacks('latim');
  const allLevels = useMemo(() => mergeLatimLevels(LATIM_BOGGLE_LEVELS, packs), [packs]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [difficulty, setDifficulty] = useState<LatimBoggleDifficulty>('facil');
  const [levelIndex, setLevelIndex] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [reveal, setReveal] = useState<{ word: string; meaning: string; emoji?: string } | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [activeGrid, setActiveGrid] = useState<string[]>([]);
  const [revealsUsed, setRevealsUsed] = useState(0);
  const [revealedPositions, setRevealedPositions] = useState<Record<string, number[]>>({});

  const levels = useMemo(
    () => allLevels.filter(l => l.difficulty === difficulty),
    [allLevels, difficulty],
  );
  const level: LatimBoggleLevel = levels[levelIndex] ?? levels[0];
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const accentColor = cfg.color;

  const reported = useRef(false);
  const levelRef = useRef(level);
  const gridRef = useRef<string[]>([]);
  const foundWordsRef = useRef<string[]>([]);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { foundWordsRef.current = foundWords; }, [foundWords]);

  // Reporta XP/moedas ao completar o jogo dentro de um efeito — chamar reportResult
  // (que faz setState no GameStoreProvider) direto no corpo do render disparava
  // "Cannot update a component while rendering a different component".
  useEffect(() => {
    if (phase !== 'game-complete' || reported.current) return;
    reported.current = true;
    reportResult({ gameId: GAME_ID, score: totalXp });
    if (user?.id) {
      supabase.rpc('add_coins', { p_user_id: user.id, p_amount: ECONOMY.COMPLETAR_JOGO })
        .then(() => { setCoinsEarned(ECONOMY.COMPLETAR_JOGO); refreshProfile(); })
        .catch(() => {});
    }
  }, [phase, totalXp, reportResult, user, refreshProfile]);

  // Pool fixo de shared values — uma por célula (até MAX_CELLS), reaproveitado entre níveis.
  const cellStates = useRef<SharedValue<number>[]>(
    Array.from({ length: MAX_CELLS }, () => makeMutable(IDLE)),
  ).current;

  const pathSV = useSharedValue<number[]>([]);
  // Índices já pertencentes a palavras encontradas — acessível no worklet, para
  // que o próprio gesto (onEnd) já saiba, no fim do arraste, quais células devem
  // permanecer destacadas, sem depender da volta assíncrona pela thread JS.
  const foundCellsSV = useSharedValue<number[]>([]);
  // Pares [a,b] acumulados de todas as palavras já formadas no nível — usado
  // para manter o traço visível ligando cada palavra encontrada.
  const foundSegmentsSV = useSharedValue<number[]>([]);
  const gridSizeSV = useSharedValue(level.gridSize);
  const cellSizeSV = useSharedValue(0);

  const cellSize = level.gridSize > 0 && gridWidth > 0
    ? Math.floor((gridWidth - Spacing.one * (level.gridSize - 1)) / level.gridSize)
    : 0;

  useEffect(() => {
    cellSizeSV.value = cellSize + Spacing.one;
  }, [cellSize, cellSizeSV]);

  const resetCellVisuals = useCallback(() => {
    for (const sv of cellStates) sv.value = IDLE;
  }, [cellStates]);

  const startLevel = useCallback((index: number, lvls: LatimBoggleLevel[]) => {
    const lvl = lvls[index];
    const grid = buildLevelGrid(lvl.words.map(w => w.word), lvl.gridSize, lvl.id);
    levelRef.current = lvl;
    gridRef.current = grid;
    setActiveGrid(grid);
    setLevelIndex(index);
    setFoundWords([]);
    foundWordsRef.current = [];
    foundCellsSV.value = [];
    foundSegmentsSV.value = [];
    setReveal(null);
    pathSV.value = [];
    gridSizeSV.value = lvl.gridSize;
    resetCellVisuals();
    setRevealsUsed(0);
    setRevealedPositions({});
    setPhase('playing');
  }, [foundCellsSV, foundSegmentsSV, gridSizeSV, pathSV, resetCellVisuals]);

  const handleRevealLetter = useCallback(async () => {
    if (!user || revealsUsed >= ECONOMY.BOGGLE_MAX_REVELACOES) return;
    if (!profile || profile.coins < ECONOMY.BOGGLE_REVELAR_LETRA) {
      Alert.alert(
        'Moedas insuficientes',
        `Você precisa de ${ECONOMY.BOGGLE_REVELAR_LETRA} 🪙 para revelar uma letra. Assista um anúncio ou resgate o bônus de moedas para conseguir mais.`,
      );
      return;
    }
    const unfound = levelRef.current.words.filter(w => !foundWordsRef.current.includes(w.word));
    if (unfound.length === 0) return;

    const target    = unfound[Math.floor(Math.random() * unfound.length)];
    const revealed  = revealedPositions[target.word] ?? [];
    const candidates = Array.from({ length: target.word.length }, (_, i) => i)
      .filter(i => i !== 0 && i !== target.word.length - 1 && !revealed.includes(i));
    if (candidates.length === 0) return;
    const pos = candidates[Math.floor(Math.random() * candidates.length)];

    try {
      const { error } = await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -ECONOMY.BOGGLE_REVELAR_LETRA });
      if (error) throw error;
      setRevealedPositions(prev => ({ ...prev, [target.word]: [...(prev[target.word] ?? []), pos] }));
      setRevealsUsed(prev => prev + 1);
      refreshProfile();
    } catch {
      Alert.alert('Erro', 'Não foi possível usar a dica agora. Tente novamente.');
    }
  }, [user, profile, revealsUsed, revealedPositions, refreshProfile]);

  const startWithDifficulty = useCallback((diff: LatimBoggleDifficulty) => {
    playClickSound();
    const filtered = allLevels.filter(l => l.difficulty === diff);
    const resumeIndex = filtered.findIndex(l => !isLevelComplete(GAME_ID, l.id));
    setDifficulty(diff);
    setTotalXp(0);
    setCoinsEarned(null);
    reported.current = false;
    startLevel(resumeIndex === -1 ? 0 : resumeIndex, filtered);
  }, [allLevels, startLevel, isLevelComplete]);

  // ── Fim de um traço: roda na thread JS via runOnJS ──────────────────────
  const handleTraceEnd = useCallback((path: number[]) => {
    if (path.length === 0) return;
    const lvl = levelRef.current;
    const gs = lvl.gridSize;
    const letters = path
      .map(idx => {
        const r = Math.floor(idx / gs);
        const c = idx % gs;
        return gridRef.current[r]?.[c] ?? '';
      })
      .join('');

    const match = lvl.words.find(
      w => w.word === letters && !foundWordsRef.current.includes(w.word),
    );

    if (!match) return;

    path.forEach(idx => {
      if (idx < cellStates.length) cellStates[idx].value = FOUND;
    });
    foundCellsSV.value = [...foundCellsSV.value, ...path];

    const newSegments = [...foundSegmentsSV.value];
    for (let i = 0; i < path.length - 1; i++) newSegments.push(path[i], path[i + 1]);
    foundSegmentsSV.value = newSegments;

    const newFound = [...foundWordsRef.current, match.word];
    foundWordsRef.current = newFound;
    setFoundWords(newFound);

    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    setReveal({ word: match.word, meaning: match.meaning, emoji: match.emoji });
    revealTimeout.current = setTimeout(() => setReveal(null), 1600);

    setTotalXp(prev => prev + cfg.xp);

    if (newFound.length === lvl.words.length) {
      markLevelComplete(GAME_ID, lvl.id);
    }
  }, [cellStates, foundCellsSV, foundSegmentsSV, cfg.xp, markLevelComplete]);

  // Todas as palavras encontradas: espera o toque no botão em vez de trocar de
  // tela sozinho, para o jogador poder conferir o tabuleiro e as traduções antes.
  const allWordsFound = foundWords.length > 0 && foundWords.length === level.words.length;
  const isLastLevel = levelIndex >= levels.length - 1;
  const handleAdvance = useCallback(() => {
    setPhase(isLastLevel ? 'game-complete' : 'level-complete');
  }, [isLastLevel]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      'worklet';
      const gs = gridSizeSV.value;
      const cs = cellSizeSV.value;
      if (cs <= 0) return;
      const col = Math.floor(e.x / cs);
      const row = Math.floor(e.y / cs);
      if (row < 0 || col < 0 || row >= gs || col >= gs) return;

      // Zona de detecção circular (em vez do retângulo cheio da célula): evita que
      // um arraste na diagonal "grude" numa célula vizinha errada bem no canto
      // onde 4 células se encontram, já que ali o toque fica ambíguo entre elas.
      const pureSize = cs - Spacing.one;
      const centerX = col * cs + pureSize / 2;
      const centerY = row * cs + pureSize / 2;
      const dx = e.x - centerX;
      const dy = e.y - centerY;
      const hitRadius = pureSize * 0.6;
      if (dx * dx + dy * dy > hitRadius * hitRadius) return;

      const idx = row * gs + col;
      const path = pathSV.value;
      const last = path.length ? path[path.length - 1] : -1;

      if (last === idx) return;

      if (path.length >= 2 && path[path.length - 2] === idx) {
        const removed = path[path.length - 1];
        cellStates[removed].value = foundCellsSV.value.includes(removed) ? FOUND : IDLE;
        pathSV.value = path.slice(0, -1);
        return;
      }

      if (last === -1) {
        pathSV.value = [idx];
        cellStates[idx].value = IN_PATH;
        return;
      }

      const lastRow = Math.floor(last / gs);
      const lastCol = last % gs;
      const dr = Math.abs(row - lastRow);
      const dc = Math.abs(col - lastCol);
      const adjacent = dr <= 1 && dc <= 1;
      if (!adjacent) return;
      if (path.includes(idx)) return;

      pathSV.value = [...path, idx];
      cellStates[idx].value = IN_PATH;
    })
    .onFinalize(() => {
      'worklet';
      // Limpa o traço já aqui, na UI thread, em vez de esperar a volta assíncrona
      // por runOnJS: se o usuário já começar um novo arraste antes dessa volta
      // chegar, pathSV.value ainda estaria com o traço antigo (célula "grudada").
      // onFinalize roda tanto em fim normal quanto em cancelamento do gesto.
      const path = pathSV.value;
      const found = foundCellsSV.value;
      path.forEach(idx => {
        if (idx < cellStates.length) cellStates[idx].value = found.includes(idx) ? FOUND : IDLE;
      });
      pathSV.value = [];
      runOnJS(handleTraceEnd)(path);
    });

  const onGridLayout = useCallback((e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  }, []);

  // ── IDLE ───────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Boggle Latim" subtitle="VOCABULÁRIO EM LATIM" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <Image source={require('@/assets/images/latim_boggle.png')} style={styles.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={styles.textCenter}>
              Boggle Latim
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.desc]}>
              Arraste o dedo por letras vizinhas (inclusive na diagonal) para formar
              palavras em latim usadas na liturgia.{'\n'}Escolha seu nível e comece!
            </ThemedText>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { playClickSound(); setPhase('difficulty'); }} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>ESCOLHER NÍVEL</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── DIFFICULTY ───────────────────────────────────────────────────────────
  if (phase === 'difficulty') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Boggle Latim" subtitle="ESCOLHA O NÍVEL" />
          <View style={[styles.center, { paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three }]}>
            <ThemedText type="subtitle" style={styles.textCenter}>Qual nível deseja jogar?</ThemedText>
            {(['facil', 'medio', 'dificil'] as LatimBoggleDifficulty[]).map(diff => {
              const dc = DIFFICULTY_CONFIG[diff];
              const tierLevels = allLevels.filter(l => l.difficulty === diff);
              const count = tierLevels.length;
              const doneCount = tierLevels.filter(l => isLevelComplete(GAME_ID, l.id)).length;
              const tierDone = doneCount === count;
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
                      {tierDone && <ThemedText style={{ fontSize: 16 }}>✅</ThemedText>}
                    </View>
                    <ThemedText themeColor="textSecondary" style={styles.diffDesc}>{dc.desc}</ThemedText>
                    <ThemedText style={[styles.diffCount, { color: dc.color }]}>
                      {tierDone ? 'Concluído' : doneCount > 0 ? `${doneCount}/${count} níveis · continuar` : `${count} ${count === 1 ? 'nível' : 'níveis'}`}
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

  // ── LEVEL COMPLETE ───────────────────────────────────────────────────────
  if (phase === 'level-complete') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Boggle Latim" subtitle="VOCABULÁRIO EM LATIM" />
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={styles.resultCard}>
              <ThemedText style={styles.resultEmoji}>🎉</ThemedText>
              <ThemedText style={styles.resultTitle}>Nível completo!</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.resultSub}>
                Você encontrou todas as palavras de &quot;{level.title}&quot;.
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => startLevel(levelIndex + 1, levels)}
              style={[styles.btn, { backgroundColor: accentColor }]}
              activeOpacity={0.85}>
              <ThemedText style={styles.btnText}>PRÓXIMO NÍVEL</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── GAME COMPLETE ────────────────────────────────────────────────────────
  if (phase === 'game-complete') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <GameHeader title="Boggle Latim" subtitle="VOCABULÁRIO EM LATIM" />
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={styles.resultCard}>
              <ThemedText style={styles.resultEmoji}>🏆</ThemedText>
              <ThemedText style={styles.resultTitle}>Parabéns!</ThemedText>
              <View style={[styles.diffBadge, { backgroundColor: cfg.color + '22', alignSelf: 'center' }]}>
                <ThemedText style={[styles.diffBadgeText, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.resultSub}>
                Você completou todos os {levels.length} níveis do nível {cfg.label.toLowerCase()}.
              </ThemedText>
            </View>
            <GameRewardBanner xp={totalXp} coins={coinsEarned} />
            <TouchableOpacity
              onPress={() => startWithDifficulty(difficulty)}
              style={[styles.btn, { backgroundColor: accentColor }]}
              activeOpacity={0.85}>
              <ThemedText style={styles.btnText}>JOGAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPhase('difficulty')}
              style={[styles.outlineBtn, { borderColor: cfg.color }]}
              activeOpacity={0.85}>
              <ThemedText style={[styles.outlineBtnText, { color: cfg.color }]}>MUDAR NÍVEL</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────────────────────
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <GameHeader
          title="Boggle Latim"
          subtitle="VOCABULÁRIO EM LATIM"
          onBack={() => setPhase('difficulty')}
          right={
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <ThemedText type="smallBold" style={{ color: accentColor }}>
                {foundWords.length}/{level.words.length}
              </ThemedText>
              <View style={[styles.levelBadge, { backgroundColor: accentColor + '22' }]}>
                <ThemedText style={[styles.levelBadgeText, { color: accentColor }]}>
                  Nível {levelIndex + 1}/{levels.length}
                </ThemedText>
              </View>
            </View>
          }
        />

        <View style={[styles.playArea, { paddingBottom: BottomTabInset + Spacing.three }]}>
          <View style={styles.themeHeader}>
            <ThemedText style={styles.themeTitle}>{level.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.hint}>
              Arraste entre letras vizinhas para formar as palavras
            </ThemedText>
          </View>

          <View style={styles.gridWrap}>
            {/* Traço fica atrás dos ladrilhos: renderizado antes, os ladrilhos opacos
                por cima escondem tudo menos o trecho visível no vão entre as células. */}
            {gridWidth > 0 && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {Array.from({ length: FOUND_CONNECTOR_POOL_SIZE }, (_, i) => (
                  <FoundConnector
                    key={`found-${i}`}
                    index={i}
                    segmentsSV={foundSegmentsSV}
                    gridSizeSV={gridSizeSV}
                    cellSizeSV={cellSizeSV}
                    color={CONNECTOR_COLOR}
                  />
                ))}
                {Array.from({ length: CONNECTOR_POOL_SIZE }, (_, i) => (
                  <Connector
                    key={i}
                    index={i}
                    pathSV={pathSV}
                    gridSizeSV={gridSizeSV}
                    cellSizeSV={cellSizeSV}
                    color={CONNECTOR_COLOR}
                  />
                ))}
              </View>
            )}
            <GestureDetector gesture={pan}>
              <View style={styles.grid} onLayout={onGridLayout}>
                {gridWidth > 0 && activeGrid.map((row, r) => (
                  <View key={r} style={styles.gridRow}>
                    {row.split('').map((letter, c) => {
                      const idx = cellIndex(r, c, level.gridSize);
                      const cellState = cellStates[idx];
                      // Nível com gridSize maior que o pool de shared values (erro de
                      // configuração no banco): não derruba o jogo, só não desenha a célula.
                      if (!cellState) return null;
                      return (
                        <BoggleCell
                          key={c}
                          letter={letter}
                          size={cellSize}
                          state={cellState}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </GestureDetector>
          </View>

          {reveal ? (
            <Animated.View
              entering={BounceIn.duration(400)}
              exiting={ZoomOut.duration(150)}
              style={[styles.revealToast, { backgroundColor: accentColor }]}>
              <ThemedText style={styles.revealText}>
                {reveal.emoji ? `${reveal.emoji} ` : ''}{reveal.word} = {reveal.meaning}
              </ThemedText>
            </Animated.View>
          ) : null}

          <View style={styles.wordList}>
            <ThemedText type="smallBold" style={styles.wordListTitle}>
              PALAVRAS PARA ENCONTRAR
            </ThemedText>
            <View style={styles.wordChips}>
              {level.words.map(w => {
                const found = foundWords.includes(w.word);
                return (
                  <ThemedView
                    key={w.word}
                    style={[
                      styles.chip,
                      found
                        ? { backgroundColor: accentColor + '22', borderColor: accentColor, borderWidth: 1 }
                        : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: C.border },
                    ]}>
                    {found ? (
                      <>
                        <ThemedText style={[styles.chipText, { color: accentColor }]}>
                          {w.emoji ? `${w.emoji} ` : ''}{w.word}
                        </ThemedText>
                        <ThemedText themeColor="textSecondary" style={styles.chipMeaning}>
                          {w.meaning}
                        </ThemedText>
                      </>
                    ) : (
                      <ThemedText style={styles.chipText}>{maskWord(w.word, revealedPositions[w.word])}</ThemedText>
                    )}
                  </ThemedView>
                );
              })}
            </View>
          </View>

          {allWordsFound && (
            <Animated.View entering={BounceIn.duration(400)} style={styles.advanceBtnWrap}>
              <TouchableOpacity
                onPress={handleAdvance}
                style={[styles.btn, { backgroundColor: accentColor }]}
                activeOpacity={0.85}>
                <ThemedText style={styles.btnText}>
                  {isLastLevel ? 'VER RESULTADO' : 'PRÓXIMO NÍVEL'}
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          )}

          {!allWordsFound && revealsUsed < ECONOMY.BOGGLE_MAX_REVELACOES && (
            <TouchableOpacity onPress={handleRevealLetter} style={styles.hintFab} activeOpacity={0.8}>
              <ThemedText style={styles.hintFabText}>
                💡 Revelar letra ({ECONOMY.BOGGLE_REVELAR_LETRA} 🪙)
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  // Idle / difficulty
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  textCenter: { textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
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
  btn: { alignSelf: 'stretch', paddingVertical: 16, borderRadius: C.radius.pill, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1.1, fontSize: 14 },

  // Result
  resultCard: { alignSelf: 'stretch', alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  resultEmoji: { fontSize: 52, lineHeight: 64, textAlign: 'center' },
  resultTitle: { fontSize: 26, fontWeight: '800' },
  resultSub: { fontSize: 14, textAlign: 'center' },

  // Playing
  playArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three, alignItems: 'center' },
  levelBadge: { borderRadius: C.radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeText: { fontSize: 10, fontWeight: '700' },
  themeHeader: { alignItems: 'center', gap: 2 },
  themeTitle: { fontSize: 18, fontWeight: '800' },
  gridWrap: { alignSelf: 'stretch' },
  grid: { alignSelf: 'stretch', gap: Spacing.one },
  gridRow: { flexDirection: 'row', gap: Spacing.one, justifyContent: 'center' },
  cellShadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cellInner: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cellBevel: { position: 'absolute', top: 0, left: 0, right: 0 },
  cellLetter: { fontWeight: '800' },
  connector: { position: 'absolute', height: 6, borderRadius: 3 },
  revealToast: { borderRadius: C.radius.pill, paddingHorizontal: 16, paddingVertical: 8 },
  revealText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  wordList: { alignSelf: 'stretch', gap: Spacing.two },
  advanceBtnWrap: { alignSelf: 'stretch' },
  wordListTitle: { letterSpacing: 1.1 },
  wordChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, justifyContent: 'center' },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: C.radius.md, alignItems: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipMeaning: { fontSize: 11, marginTop: 1 },
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
