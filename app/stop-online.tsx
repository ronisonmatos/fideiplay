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
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const BRAND = '#EF9F27';
const TIMER = 90;
const MATCHMAKING_TIMEOUT_MS = 60_000;

const CATEGORIES = [
  { key: 'santo',    label: 'Santo ou Santa',         emoji: '🙏' },
  { key: 'livro',    label: 'Livro da Bíblia',         emoji: '📖' },
  { key: 'oracao',   label: 'Oração Católica',         emoji: '🤲' },
  { key: 'virtude',  label: 'Virtude Cristã',          emoji: '✨' },
  { key: 'apostolo', label: 'Apóstolo ou Discípulo',   emoji: '👤' },
  { key: 'cidade',   label: 'Cidade Bíblica',          emoji: '🏙️' },
] as const;

type CatKey = (typeof CATEGORIES)[number]['key'];
type AnswerMap = Partial<Record<CatKey, string>>;

const LETTERS = ['A','B','C','D','E','F','G','H','J','L','M','N','P','R','S','T','V'];

type Phase = 'matchmaking' | 'spinning' | 'playing' | 'waiting' | 'result' | 'error';

interface PlayerResult {
  answers: AnswerMap;
  score: number;
  validCount: number;
}

function calcScore(ans: AnswerMap, ltr: string) {
  const valid = CATEGORIES.filter(c => {
    const a = (ans[c.key] ?? '').trim();
    return a.length > 0 && a[0].toUpperCase() === ltr;
  }).length;
  return { score: valid * 10 + (valid === CATEGORIES.length ? 20 : 0), validCount: valid };
}

export default function StopOnlineScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();

  // Mutable ref updated every render — safe to read in async closures
  const playerIdRef2 = useRef('');
  playerIdRef2.current = user?.id ?? '';
  const playerName = profile?.name ?? 'Jogador';

  const [phase, setPhase]               = useState<Phase>('matchmaking');
  const [statusMsg, setStatusMsg]       = useState('Procurando adversário...');
  const [letter, setLetter]             = useState('A');
  const [answers, setAnswers]           = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft]         = useState(TIMER);
  const [myResult, setMyResult]         = useState<PlayerResult | null>(null);
  const [oppResult, setOppResult]       = useState<PlayerResult | null>(null);
  const [p1Rematch, setP1Rematch]       = useState(false);
  const [p2Rematch, setP2Rematch]       = useState(false);
  const [isPlayer1, setIsPlayer1]       = useState(false);

  // Spinning animation
  const [spinLetter, setSpinLetter]     = useState('A');
  const [spinDone, setSpinDone]         = useState(false);
  const scaleAnim                       = useRef(new Animated.Value(1)).current;
  const spinTimeouts                    = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Mutable refs (avoid stale closures in callbacks)
  const roomIdRef     = useRef<string | null>(null);
  const isP1Ref       = useRef(false);
  const answersRef    = useRef<AnswerMap>({});
  const letterRef     = useRef('A');
  const submittedRef  = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mmTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs     = useRef<Partial<Record<CatKey, TextInput | null>>>({});

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { letterRef.current  = letter;  }, [letter]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); doSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => {
    stopTimer();
    spinTimeouts.current.forEach(clearTimeout);
    channelRef.current?.unsubscribe();
    if (mmTimerRef.current) clearTimeout(mmTimerRef.current);
  }, [stopTimer]);

  // ── Spin animation ─────────────────────────────────────────────────────────
  const startSpin = useCallback((targetLetter: string) => {
    spinTimeouts.current.forEach(clearTimeout);
    spinTimeouts.current = [];
    scaleAnim.setValue(1);
    setSpinDone(false);
    setAnswers({});
    answersRef.current = {};
    submittedRef.current = false;

    const targetIdx = LETTERS.indexOf(targetLetter);
    const LC = LETTERS.length;
    const phases = [
      { count: 10, ms: 60  },
      { count: 8,  ms: 110 },
      { count: 5,  ms: 200 },
      { count: 3,  ms: 380 },
    ];
    const totalSteps = phases.reduce((s, p) => s + p.count, 0);
    const startIdx = ((targetIdx - (totalSteps - 1)) % LC + LC) % LC;
    const refs = spinTimeouts.current;
    let idx = startIdx, t = 0, lastT = 0;

    for (const { count, ms } of phases) {
      for (let i = 0; i < count; i++) {
        const l = LETTERS[idx % LC], ct = t, peak = 1 + (ms / 380) * 0.18;
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
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }),
      ]).start();
    }, lastT));
    refs.push(setTimeout(() => {
      setTimeLeft(TIMER);
      setPhase('playing');
    }, lastT + 1100));

    setPhase('spinning');
  }, [scaleAnim]);

  // ── Check if both submitted → show results ─────────────────────────────────
  const checkBothSubmitted = useCallback(async (rId: string) => {
    const { data } = await supabase
      .from('stop_answers')
      .select('*')
      .eq('room_id', rId)
      .eq('submitted', true);

    if (!data || data.length < 2) return;

    const me  = data.find(r => r.player_id === playerIdRef2.current);
    const opp = data.find(r => r.player_id !== playerIdRef2.current);
    if (!me || !opp) return;

    setMyResult({ answers: me.answers,  score: me.score,  validCount: me.valid_count  });
    setOppResult({ answers: opp.answers, score: opp.score, validCount: opp.valid_count });
    setPhase('result');
  }, []);

  // ── Subscribe to room + answers ────────────────────────────────────────────
  const subscribeToRoom = useCallback((rId: string) => {
    channelRef.current?.unsubscribe();

    channelRef.current = supabase
      .channel(`stop_room_${rId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stop_rooms', filter: `id=eq.${rId}` },
        (payload) => {
          const room = payload.new as Record<string, unknown>;

          // Player 2 joined → start spinning (player 1 side)
          if (room.status === 'active' && room.player2_id && isP1Ref.current) {
            if (mmTimerRef.current) { clearTimeout(mmTimerRef.current); mmTimerRef.current = null; }
            startSpin(room.letter as string);
          }

          // Rematch flags
          setP1Rematch(Boolean(room.p1_rematch));
          setP2Rematch(Boolean(room.p2_rematch));

          // Rematch room created by player1 → player2 joins new room
          if (room.rematch_room_id && !isP1Ref.current) {
            joinRematchRoom(room.rematch_room_id as string);
          }
          // Player1 detects player2 accepted (status active in new room) — handled in new subscription
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stop_answers', filter: `room_id=eq.${rId}` },
        () => checkBothSubmitted(rId)
      )
      .subscribe();
  }, [startSpin, checkBothSubmitted]);

  const joinRematchRoom = useCallback(async (newRoomId: string) => {
    roomIdRef.current = newRoomId;
    const { data: room } = await supabase
      .from('stop_rooms')
      .select('letter')
      .eq('id', newRoomId)
      .single();

    if (!room) return;
    setLetter(room.letter);
    letterRef.current = room.letter;
    setP1Rematch(false);
    setP2Rematch(false);
    subscribeToRoom(newRoomId);
    startSpin(room.letter);
  }, [subscribeToRoom, startSpin]);

  // ── Submit answers ─────────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopTimer();

    const rId = roomIdRef.current;
    if (!rId) return;

    const ans = answersRef.current;
    const ltr = letterRef.current;
    const { score, validCount } = calcScore(ans, ltr);

    setPhase('waiting');

    await supabase.from('stop_answers').upsert({
      room_id:     rId,
      player_id:   playerIdRef2.current,
      answers:     ans,
      score,
      valid_count: validCount,
      submitted:   true,
    }, { onConflict: 'room_id,player_id' });

    checkBothSubmitted(rId);
  }, [stopTimer, checkBothSubmitted]);

  const callStop = useCallback(() => doSubmit(), [doSubmit]);

  const setAnswer = useCallback((key: CatKey, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Rematch ────────────────────────────────────────────────────────────────
  const requestRematch = useCallback(async () => {
    const rId = roomIdRef.current;
    if (!rId) return;

    const amPlayer1 = isP1Ref.current;
    const col = amPlayer1 ? 'p1_rematch' : 'p2_rematch';

    // Mark own rematch
    await supabase.from('stop_rooms').update({ [col]: true }).eq('id', rId);
    if (amPlayer1) setP1Rematch(true); else setP2Rematch(true);

    // Check if opponent already requested
    const { data: room } = await supabase
      .from('stop_rooms')
      .select('p1_rematch,p2_rematch,player1_id,player2_id')
      .eq('id', rId)
      .single();
    if (!room) return;

    const bothWant = room.p1_rematch && room.p2_rematch;
    if (!bothWant) return;

    // Both want rematch: player1 creates new room
    if (!amPlayer1) return; // player2 waits for room creation

    const newLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const { data: newRoom } = await supabase
      .from('stop_rooms')
      .insert({
        letter:     newLetter,
        status:     'active',
        player1_id: room.player1_id,
        player2_id: room.player2_id,
      })
      .select()
      .single();

    if (!newRoom) return;

    // Signal player2 via old room
    await supabase.from('stop_rooms').update({ rematch_room_id: newRoom.id }).eq('id', rId);

    // Player1 joins new room directly
    roomIdRef.current = newRoom.id;
    setLetter(newLetter);
    letterRef.current = newLetter;
    setP1Rematch(false);
    setP2Rematch(false);
    subscribeToRoom(newRoom.id);
    startSpin(newLetter);
  }, [startSpin, subscribeToRoom]);

  // ── Matchmaking (runs once on mount) ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function doMatchmaking() {
      try {
        // Find a waiting room (not our own)
        const { data: available } = await supabase
          .from('stop_rooms')
          .select('*')
          .eq('status', 'waiting')
          .neq('player1_id', playerIdRef2.current)
          .order('created_at', { ascending: true })
          .limit(1);

        if (cancelled) return;

        if (available && available.length > 0) {
          const room = available[0];
          const { error } = await supabase
            .from('stop_rooms')
            .update({ player2_id: playerIdRef2.current, status: 'active' })
            .eq('id', room.id)
            .eq('status', 'waiting'); // guard race condition

          if (error || cancelled) { doMatchmaking(); return; } // retry if race

          roomIdRef.current = room.id;
          isP1Ref.current   = false;
          setIsPlayer1(false);
          setLetter(room.letter);
          letterRef.current = room.letter;
          setStatusMsg('Adversário encontrado! 🎯');
          subscribeToRoom(room.id);
          startSpin(room.letter);
        } else {
          // Create new room
          const newLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
          const { data: newRoom, error } = await supabase
            .from('stop_rooms')
            .insert({ letter: newLetter, player1_id: playerIdRef2.current })
            .select()
            .single();

          if (error || !newRoom || cancelled) { setPhase('error'); setStatusMsg('Erro ao criar sala.'); return; }

          roomIdRef.current = newRoom.id;
          isP1Ref.current   = true;
          setIsPlayer1(true);
          setLetter(newLetter);
          letterRef.current = newLetter;
          setStatusMsg('Aguardando adversário...');
          subscribeToRoom(newRoom.id);

          mmTimerRef.current = setTimeout(async () => {
            if (roomIdRef.current === newRoom.id) {
              await supabase.from('stop_rooms').delete().eq('id', newRoom.id).eq('status', 'waiting');
              if (!cancelled) { setPhase('error'); setStatusMsg('Nenhum adversário encontrado.\nTente novamente mais tarde.'); }
            }
          }, MATCHMAKING_TIMEOUT_MS);
        }
      } catch {
        if (!cancelled) { setPhase('error'); setStatusMsg('Erro de conexão.\nVerifique sua internet.'); }
      }
    }

    doMatchmaking();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timerPct   = (timeLeft / TIMER) * 100;
  const timerColor = timeLeft > 30 ? C.green : timeLeft > 15 ? C.gold : C.red;

  // ─────────────────────── RENDERS ──────────────────────────────────────────

  if (phase === 'matchmaking' || phase === 'error') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="MODO ONLINE" />
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 64 }}>{phase === 'error' ? '📡' : '🔍'}</ThemedText>
            <ThemedText type="subtitle" style={s.center}>{statusMsg}</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>{playerName}</ThemedText>
            {phase === 'error' && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: BRAND, marginTop: Spacing.four }]}
                onPress={() => router.replace('/stop-online')}
                activeOpacity={0.8}>
                <ThemedText style={s.btnTxt}>TENTAR NOVAMENTE</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ThemedText style={[s.btnTxt, { color: theme.textSecondary }]}>CANCELAR</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'spinning') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="MODO ONLINE" />
          <View style={s.spinScreen}>
            <ThemedText themeColor="textSecondary" style={s.spinLabel}>
              {spinDone ? 'Sua letra é:' : 'Sorteando...'}
            </ThemedText>
            <Animated.View style={[s.spinCircle, { backgroundColor: BRAND, transform: [{ scale: scaleAnim }] }]}>
              <ThemedText style={s.spinLetterText}>{spinLetter}</ThemedText>
            </Animated.View>
            <ThemedText style={spinDone ? [s.spinGo, { color: BRAND }] : s.spinHint} themeColor={spinDone ? undefined : 'textSecondary'}>
              {spinDone ? 'Prepare-se! 🚀' : 'Aguarde...'}
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'waiting') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="MODO ONLINE" />
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 64 }}>⏳</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Aguardando adversário...</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
              Você finalizou. Aguarde o adversário completar.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'result' && myResult && oppResult) {
    const iWon  = myResult.score > oppResult.score;
    const tied  = myResult.score === oppResult.score;
    const resEmoji = tied ? '🤝' : iWon ? '🏆' : '📿';
    const resMsg   = tied ? 'Empate!' : iWon ? 'Você ganhou!' : 'Adversário ganhou!';
    const resColor = iWon ? C.green : tied ? C.gold : C.red;

    const myRematch  = isPlayer1 ? p1Rematch : p2Rematch;
    const oppRematch = isPlayer1 ? p2Rematch : p1Rematch;

    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="RESULTADO" />
          <ScrollView contentContainerStyle={[s.resultScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>

            {/* Banner */}
            <View style={[s.resBanner, { backgroundColor: resColor + '22', borderColor: resColor }]}>
              <ThemedText style={{ fontSize: 40 }}>{resEmoji}</ThemedText>
              <View style={{ gap: 2 }}>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', color: resColor }}>{resMsg}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                  Letra: {letter} · {myResult.score} vs {oppResult.score} pts
                </ThemedText>
              </View>
            </View>

            {/* Scores */}
            <View style={s.scoreRow}>
              <ThemedView type="backgroundElement" style={[s.scoreCard, { borderColor: C.purple }]}>
                <ThemedText style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: C.purple }}>VOCÊ</ThemedText>
                <ThemedText style={{ fontSize: 30, fontWeight: '900', color: C.purple }}>{myResult.score}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{myResult.validCount}/{CATEGORIES.length} válidas</ThemedText>
              </ThemedView>
              <ThemedText style={{ fontSize: 18, fontWeight: '800', color: theme.textSecondary }}>VS</ThemedText>
              <ThemedView type="backgroundElement" style={[s.scoreCard, { borderColor: BRAND }]}>
                <ThemedText style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: BRAND }}>ADVERSÁRIO</ThemedText>
                <ThemedText style={{ fontSize: 30, fontWeight: '900', color: BRAND }}>{oppResult.score}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{oppResult.validCount}/{CATEGORIES.length} válidas</ThemedText>
              </ThemedView>
            </View>

            {/* Per-category comparison */}
            <ThemedText style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textSecondary }}>
              COMPARAÇÃO DE RESPOSTAS
            </ThemedText>
            {CATEGORIES.map(c => {
              const mine   = ((myResult.answers[c.key] ?? '') as string).trim();
              const theirs = ((oppResult.answers[c.key] ?? '') as string).trim();
              const myV    = mine.length   > 0 && mine[0].toUpperCase()   === letter;
              const theirV = theirs.length > 0 && theirs[0].toUpperCase() === letter;
              return (
                <ThemedView key={c.key} type="backgroundElement" style={s.compCard}>
                  <View style={s.compHeader}>
                    <ThemedText style={s.catEmoji}>{c.emoji}</ThemedText>
                    <ThemedText type="smallBold" style={{ flex: 1 }}>{c.label}</ThemedText>
                  </View>
                  <View style={s.compAnswers}>
                    <View style={[s.compCell, { backgroundColor: (myV ? C.green : C.red) + '18' }]}>
                      <ThemedText style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: C.purple }}>VOCÊ</ThemedText>
                      <ThemedText style={{ fontSize: 13, fontWeight: '600', color: myV ? C.green : theme.textSecondary }}>
                        {mine || '—'}
                      </ThemedText>
                    </View>
                    <View style={[s.compCell, { backgroundColor: (theirV ? C.green : C.red) + '18' }]}>
                      <ThemedText style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: BRAND }}>ADVERSÁRIO</ThemedText>
                      <ThemedText style={{ fontSize: 13, fontWeight: '600', color: theirV ? C.green : theme.textSecondary }}>
                        {theirs || '—'}
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              );
            })}

            {/* Rematch */}
            <TouchableOpacity
              style={[s.btn, myRematch ? { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: BRAND } : { backgroundColor: BRAND }]}
              onPress={myRematch ? undefined : requestRematch}
              activeOpacity={myRematch ? 1 : 0.8}>
              <ThemedText style={[s.btnTxt, myRematch ? { color: BRAND } : { color: '#fff' }]}>
                {myRematch
                  ? (oppRematch ? '🔄 Iniciando nova partida...' : '⏳ Aguardando adversário...')
                  : '🔄  JOGAR NOVAMENTE COM ESTE JOGADOR'}
              </ThemedText>
            </TouchableOpacity>
            {oppRematch && !myRematch && (
              <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
                Adversário quer jogar novamente!
              </ThemedText>
            )}
            <TouchableOpacity style={s.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ThemedText style={[s.btnTxt, { color: theme.textSecondary }]}>VOLTAR AO MENU</ThemedText>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader
          title="Stop Online"
          subtitle="MODO ONLINE"
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
                <ThemedText style={s.letterText}>{letter}</ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 13, lineHeight: 18, flex: 1 }}>
                Preencha as categorias com palavras que comecem com esta letra
              </ThemedText>
            </View>
            {CATEGORIES.map((cat, i) => (
              <ThemedView key={cat.key} type="backgroundElement" style={s.inputCard}>
                <ThemedText style={s.catEmoji}>{cat.emoji}</ThemedText>
                <View style={s.inputGroup}>
                  <ThemedText style={s.catLabel}>{cat.label}</ThemedText>
                  <TextInput
                    ref={ref => { inputRefs.current[cat.key] = ref; }}
                    style={[s.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
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
            <TouchableOpacity style={[s.stopBtn, { backgroundColor: BRAND }]} onPress={callStop} activeOpacity={0.8}>
              <ThemedText style={s.stopTxt}>🛑  STOP!</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:      { flex: 1 },
  center:    { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  btn: {
    paddingHorizontal: Spacing.four,
    paddingVertical:   14,
    borderRadius:      C.radius.pill,
    alignItems:        'center',
    alignSelf:         'stretch',
  },
  btnTxt:   { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  ghostBtn: { paddingVertical: 12, alignItems: 'center', alignSelf: 'stretch' },
  // Spinning
  spinScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  spinLabel:  { fontSize: 17, letterSpacing: 0.3 },
  spinCircle: {
    width: 180, height: 180, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 24, elevation: 24,
  },
  spinLetterText: { fontSize: 110, fontWeight: '900', color: '#fff', lineHeight: 118 },
  spinGo:   { fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  spinHint: { fontSize: 13, opacity: 0.5 },
  // Result
  resultScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  resBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    borderRadius: C.radius.lg, padding: Spacing.three, borderWidth: 1,
  },
  scoreRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  scoreCard: {
    flex: 1, alignItems: 'center', gap: 2,
    borderRadius: C.radius.lg, padding: Spacing.three, borderWidth: 1,
  },
  compCard: {
    borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.one,
    borderWidth: 1, borderColor: C.border,
  },
  compHeader:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  compAnswers: { flexDirection: 'row', gap: Spacing.one },
  compCell:    { flex: 1, borderRadius: C.radius.sm, padding: Spacing.one, gap: 2 },
  catEmoji:    { fontSize: 22, width: 32, textAlign: 'center' },
  // Playing
  playScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.two },
  timerBar:   { height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill:  { height: 8, borderRadius: 4 },
  letterRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  letterCard: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 60 },
  inputCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.two, borderWidth: 1, borderColor: C.border },
  inputGroup: { flex: 1, gap: 3 },
  catLabel:   { fontSize: 12, opacity: 0.65 },
  input: {
    borderWidth: 1.5, borderRadius: C.radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    fontSize: 15, fontWeight: '500',
  },
  stopBtn: { paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', marginTop: Spacing.one },
  stopTxt: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
});
