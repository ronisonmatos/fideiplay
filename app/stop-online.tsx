import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ALL_STOP_CATEGORIES, randomDefaultKeys, StopCategory } from '@/constants/stop-categories';
import { supabase } from '@/lib/supabase';
import { validateWithBank, validateWithAI, BankResult } from '@/lib/stop-bank';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const BRAND   = '#EF9F27';
const TIMER   = 90;
const MIN_CATS = 4;
const ASYNC_DEADLINE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

const COINS = {
  WIN_RT:   20,   // vitória tempo real
  DRAW_RT:  10,   // empate tempo real
  LOSE_RT:  -5,   // derrota tempo real
  WIN_AS:   15,   // vitória assíncrona
  DRAW_AS:   8,   // empate assíncrono
  LOSE_AS:  -3,   // derrota assíncrona
  ABANDON: -15,   // abandonou a partida
  OPP_OUT:  25,   // adversário abandonou / expirou
} as const;

const LETTERS         = ['A','B','C','D','E','F','G','H','J','L','M','N','O','P','R','S','T','V'];
const CODE_CHARS      = 'ABCDEFGHJKLMNPRSTV23456789';
const genRoomCode = () =>
  Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

type Phase     = 'selecting' | 'matchmaking' | 'spinning' | 'playing' | 'waiting' | 'async_submitted' | 'validating' | 'result' | 'error';
type GameMode  = 'realtime' | 'async';
type AnswerMap = Partial<Record<string, string>>;

interface PlayerResult  { answers: AnswerMap; score: number; validCount: number; }
interface RealtimeRoom  { id: string; letter: string; player1_name: string | null; created_at: string; }
interface AsyncGame     {
  id: string; letter: string; status: string;
  player1_id: string; player2_id: string | null;
  player1_name: string | null; player2_name: string | null;
  deadline: string | null;
}
interface PendingResults { meAnswers: AnswerMap; oppAnswers: AnswerMap; skipCoins?: boolean; }

function calcScore(ans: AnswerMap, ltr: string, cats: StopCategory[]) {
  const valid = cats.filter(c => {
    const a = (ans[c.key] ?? '').trim();
    return a.length > 0 && a[0].toUpperCase() === ltr;
  }).length;
  return { score: valid * 10 + (valid === cats.length ? 20 : 0), validCount: valid };
}

function fmtDeadline(iso: string | null): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Expirado';
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return `${h}h restantes`;
  return `${Math.floor(h / 24)}d ${h % 24}h restantes`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function StopOnlineScreen() {
  const theme      = useTheme();
  const navigation = useNavigation();
  const { user, profile, refreshProfile } = useAuth();

  const playerIdRef   = useRef('');   playerIdRef.current   = user?.id ?? '';
  const playerNameRef = useRef('Jogador'); playerNameRef.current = profile?.name ?? 'Jogador';

  // ── Phase / mode / categories ──────────────────────────────────────────────
  const [phase,          setPhase]          = useState<Phase>('selecting');
  const phaseRef = useRef<Phase>('selecting'); phaseRef.current = phase;
  const [gameMode,       setGameMode]       = useState<GameMode>('realtime');
  const gameModeRef                         = useRef<GameMode>('realtime');
  const [statusMsg,      setStatusMsg]      = useState('');
  const [selectedKeys,   setSelectedKeys]   = useState<Set<string>>(() => randomDefaultKeys());
  const [gameCategories, setGameCategories] = useState<StopCategory[]>([]);
  const gameCatsRef = useRef<StopCategory[]>([]);
  useEffect(() => { gameCatsRef.current = gameCategories; }, [gameCategories]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  // ── Game state ─────────────────────────────────────────────────────────────
  const [letter,    setLetter]    = useState('A');
  const [answers,   setAnswers]   = useState<AnswerMap>({});
  const [timeLeft,  setTimeLeft]  = useState(TIMER);
  const [myResult,  setMyResult]  = useState<PlayerResult | null>(null);
  const [oppResult, setOppResult] = useState<PlayerResult | null>(null);
  const [p1Rematch, setP1Rematch] = useState(false);
  const [p2Rematch, setP2Rematch] = useState(false);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [abandoned,  setAbandoned]  = useState<'me' | 'opp' | null>(null);
  const [coinDelta,  setCoinDelta]  = useState<number | null>(null);

  // ── Room lists ─────────────────────────────────────────────────────────────
  const [realtimeRooms,   setRealtimeRooms]   = useState<RealtimeRoom[]>([]);
  const [loadingRooms,    setLoadingRooms]     = useState(false);
  const [asyncGames,      setAsyncGames]       = useState<AsyncGame[]>([]);
  const [loadingAsync,    setLoadingAsync]     = useState(false);
  const [privateRoomCode, setPrivateRoomCode]  = useState<string | null>(null);
  const [joinCodeInput,   setJoinCodeInput]    = useState('');
  const [myBankMap,   setMyBankMap]   = useState<Partial<Record<string, BankResult>>>({});
  const [oppBankMap,  setOppBankMap]  = useState<Partial<Record<string, BankResult>>>({});
  const [aiLoading,   setAiLoading]   = useState(false);
  const [waitingOpp,  setWaitingOpp]  = useState(false);

  // ── Spin state ─────────────────────────────────────────────────────────────
  const [spinLetter, setSpinLetter] = useState('A');
  const [spinDone,   setSpinDone]   = useState(false);
  const scaleAnim                   = useRef(new Animated.Value(1)).current;
  const spinTimeouts                = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const roomIdRef          = useRef<string | null>(null);
  const isP1Ref            = useRef(false);
  const answersRef         = useRef<AnswerMap>({});
  const letterRef          = useRef('A');
  const submittedRef       = useRef(false);
  const isMatchedRef       = useRef(false);
  const abandonedRef       = useRef(false);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef         = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mmTimerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRefs          = useRef<Partial<Record<string, TextInput | null>>>({});
  const doSubmitRef        = useRef<() => void>(() => {});
  const handleAbandonRef   = useRef<() => Promise<void>>(async () => {});
  const joinRematchRoomRef = useRef<((id: string) => Promise<void>) | null>(null);
  const isActiveGameRef    = useRef(false);
  const awardCoinsRef      = useRef<(delta: number) => void>(() => {});
  const coinsAwardedRef    = useRef(false);
  const pendingResultsRef  = useRef<PendingResults | null>(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { letterRef.current  = letter;  }, [letter]);

  // ── Back-button abandon guard ──────────────────────────────────────────────
  const isActiveGame = (phase === 'spinning' || phase === 'playing' || phase === 'waiting')
    && gameMode === 'realtime' && !abandonedRef.current;

  useEffect(() => { isActiveGameRef.current = isActiveGame; }, [isActiveGame]);

  useEffect(() => {
    const unsub = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (!isActiveGameRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Abandonar partida?',
        'Você perderá automaticamente se sair agora.',
        [
          { text: 'Ficar', style: 'cancel' },
          { text: 'Abandonar', style: 'destructive', onPress: () => {
            handleAbandonRef.current().then(() => (navigation as any).dispatch(e.data.action));
          }},
        ]
      );
    });
    return unsub;
  }, [navigation]);

  // ── Timer (realtime only) ──────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (phase !== 'playing' || gameMode !== 'realtime') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); doSubmitRef.current(); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, gameMode, stopTimer]);

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
    answersRef.current    = {};
    submittedRef.current  = false;
    abandonedRef.current  = false;
    coinsAwardedRef.current  = false;
    pendingResultsRef.current = null;
    setCoinDelta(null);

    const targetIdx  = LETTERS.indexOf(targetLetter);
    const LC         = LETTERS.length;
    const spinPhases = [{ count: 10, ms: 60 }, { count: 8, ms: 110 }, { count: 5, ms: 200 }, { count: 3, ms: 380 }];
    const total      = spinPhases.reduce((s, p) => s + p.count, 0);
    const startIdx   = ((targetIdx - (total - 1)) % LC + LC) % LC;
    const refs = spinTimeouts.current;
    let idx = startIdx, t = 0, lastT = 0;

    for (const { count, ms } of spinPhases) {
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
    refs.push(setTimeout(() => { setTimeLeft(TIMER); setPhase('playing'); }, lastT + 1100));
    setPhase('spinning');
  }, [scaleAnim]);

  // ── Award coins (idempotent via coinsAwardedRef) ──────────────────────────
  const awardCoins = useCallback(async (delta: number) => {
    if (coinsAwardedRef.current) return;
    coinsAwardedRef.current = true;
    setCoinDelta(delta);
    if (!user?.id || delta === 0) return;
    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: delta });
    refreshProfile();
  }, [user, refreshProfile]);

  useEffect(() => { awardCoinsRef.current = awardCoins; }, [awardCoins]);

  // ── Check both submitted ───────────────────────────────────────────────────
  const checkBothSubmitted = useCallback(async (rId: string) => {
    // Guard: once we've entered validating or result, never go back to validating.
    // Late-arriving postgres_changes notifications (e.g. opponent's upsert) would
    // otherwise reset the phase after we've already moved on, causing a double-run.
    if (phaseRef.current === 'validating' || phaseRef.current === 'result') return;

    const { data } = await supabase
      .from('stop_answers').select('*').eq('room_id', rId).eq('submitted', true);
    if (!data || data.length < 2) return;
    const me  = data.find(r => r.player_id === playerIdRef.current);
    const opp = data.find(r => r.player_id !== playerIdRef.current);
    if (!me || !opp) return;
    setAbandoned(null);
    pendingResultsRef.current = { meAnswers: me.answers, oppAnswers: opp.answers };
    setPhase('validating');
  }, []);

  // ── Subscribe to room (realtime) ───────────────────────────────────────────
  const subscribeToRoom = useCallback((rId: string) => {
    channelRef.current?.unsubscribe();
    channelRef.current = supabase
      .channel(`stop_room_${rId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stop_rooms', filter: `id=eq.${rId}` },
        (payload) => {
          const room = payload.new as Record<string, unknown>;

          // P1 detects P2 joined → start spin + broadcast cats
          if (room.status === 'active' && room.player2_id && isP1Ref.current && !isMatchedRef.current) {
            isMatchedRef.current = true;
            if (mmTimerRef.current) { clearTimeout(mmTimerRef.current); mmTimerRef.current = null; }
            setTimeout(() => {
              channelRef.current?.send({
                type: 'broadcast', event: 'cats_sync',
                payload: { cats: gameCatsRef.current.map(c => c.key) },
              });
            }, 600);
            startSpin(room.letter as string);
          }

          // Opponent abandoned → I win
          if (room.status === 'abandoned' && room.abandoned_by !== playerIdRef.current && !abandonedRef.current) {
            stopTimer();
            const ans = answersRef.current;
            const { score, validCount } = calcScore(ans, letterRef.current, gameCatsRef.current);
            setMyResult({ answers: ans, score, validCount });
            setOppResult({ answers: {}, score: 0, validCount: 0 });
            setAbandoned('opp');
            awardCoinsRef.current(COINS.OPP_OUT);
            setPhase('result');
          }

          setP1Rematch(Boolean(room.p1_rematch));
          setP2Rematch(Boolean(room.p2_rematch));
          if (room.rematch_room_id && !isP1Ref.current) {
            joinRematchRoomRef.current?.(room.rematch_room_id as string);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stop_answers', filter: `room_id=eq.${rId}` },
        () => checkBothSubmitted(rId)
      )
      // P2 receives category keys from P1
      .on('broadcast', { event: 'cats_sync' }, ({ payload }) => {
        const keys = (payload as { cats: string[] }).cats;
        const cats = ALL_STOP_CATEGORIES.filter(c => keys.includes(c.key));
        if (cats.length > 0) { setGameCategories(cats); gameCatsRef.current = cats; }
      })
      // One player clicked STOP → other player also stops
      .on('broadcast', { event: 'stop_signal' }, () => { doSubmitRef.current(); })
      // Broadcast for immediate abandon notification
      .on('broadcast', { event: 'abandoned' }, () => {
        if (abandonedRef.current) return;
        stopTimer();
        const ans = answersRef.current;
        const { score, validCount } = calcScore(ans, letterRef.current, gameCatsRef.current);
        setMyResult({ answers: ans, score, validCount });
        setOppResult({ answers: {}, score: 0, validCount: 0 });
        setAbandoned('opp');
        awardCoinsRef.current(COINS.OPP_OUT);
        setPhase('result');
      })
      .subscribe();
  }, [startSpin, checkBothSubmitted, stopTimer]);

  // ── Rematch ────────────────────────────────────────────────────────────────
  const joinRematchRoom = useCallback(async (newRoomId: string) => {
    roomIdRef.current = newRoomId;
    const { data: room } = await supabase
      .from('stop_rooms').select('letter').eq('id', newRoomId).single();
    if (!room) return;
    setLetter(room.letter); letterRef.current = room.letter;
    setP1Rematch(false); setP2Rematch(false);
    setAbandoned(null);
    subscribeToRoom(newRoomId);
    startSpin(room.letter);
  }, [subscribeToRoom, startSpin]);

  useEffect(() => { joinRematchRoomRef.current = joinRematchRoom; }, [joinRematchRoom]);

  const requestRematch = useCallback(async () => {
    const rId = roomIdRef.current;
    if (!rId) return;
    const col = isP1Ref.current ? 'p1_rematch' : 'p2_rematch';
    await supabase.from('stop_rooms').update({ [col]: true }).eq('id', rId);
    if (isP1Ref.current) setP1Rematch(true); else setP2Rematch(true);

    const { data: room } = await supabase
      .from('stop_rooms').select('p1_rematch,p2_rematch,player1_id,player2_id').eq('id', rId).single();
    if (!room || !(room.p1_rematch && room.p2_rematch) || !isP1Ref.current) return;

    const newLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const { data: newRoom } = await supabase
      .from('stop_rooms')
      .insert({ letter: newLetter, status: 'active', mode: 'realtime',
                player1_id: room.player1_id, player1_name: playerNameRef.current,
                player2_id: room.player2_id })
      .select().single();
    if (!newRoom) return;

    await supabase.from('stop_rooms').update({ rematch_room_id: newRoom.id }).eq('id', rId);
    roomIdRef.current = newRoom.id;
    setLetter(newLetter); letterRef.current = newLetter;
    setP1Rematch(false); setP2Rematch(false);
    setAbandoned(null);
    subscribeToRoom(newRoom.id);
    startSpin(newLetter);
  }, [startSpin, subscribeToRoom]);

  // ── Abandon ────────────────────────────────────────────────────────────────
  const handleAbandon = useCallback(async () => {
    if (abandonedRef.current) return;
    abandonedRef.current = true;
    stopTimer();
    const rId = roomIdRef.current;
    if (rId) {
      channelRef.current?.send({ type: 'broadcast', event: 'abandoned', payload: {} });
      await supabase.from('stop_rooms')
        .update({ status: 'abandoned', abandoned_by: playerIdRef.current })
        .eq('id', rId);
    }
    setAbandoned('me');
    setMyResult({ answers: answersRef.current, score: 0, validCount: 0 });
    setOppResult({ answers: {}, score: 0, validCount: 0 });
    awardCoinsRef.current(COINS.ABANDON);
    setPhase('result');
  }, [stopTimer]);

  useEffect(() => { handleAbandonRef.current = handleAbandon; }, [handleAbandon]);

  // ── Submit answers ─────────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopTimer();

    const rId = roomIdRef.current;
    if (!rId) return;

    const isAsync = gameModeRef.current === 'async';
    if (!isAsync) {
      channelRef.current?.send({ type: 'broadcast', event: 'stop_signal', payload: {} });
    }

    const ans = answersRef.current;
    const ltr = letterRef.current;
    const { score, validCount } = calcScore(ans, ltr, gameCatsRef.current);

    if (!isAsync) setPhase('waiting');

    await supabase.from('stop_answers').upsert({
      room_id: rId, player_id: playerIdRef.current,
      answers: ans, score, valid_count: validCount, submitted: true,
    }, { onConflict: 'room_id,player_id' });

    if (isAsync) {
      if (isP1Ref.current) {
        const deadline = new Date(Date.now() + ASYNC_DEADLINE_MS).toISOString();
        await supabase.from('stop_rooms')
          .update({ status: 'async_wait_p2', deadline }).eq('id', rId);
        setPhase('async_submitted');
      } else {
        await supabase.from('stop_rooms').update({ status: 'completed' }).eq('id', rId);
        checkBothSubmitted(rId);
      }
    } else {
      checkBothSubmitted(rId);
    }
  }, [stopTimer, checkBothSubmitted]);

  useEffect(() => { doSubmitRef.current = doSubmit; }, [doSubmit]);

  const callStop   = useCallback(() => doSubmit(), [doSubmit]);
  const setAnswer  = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);
  const toggleCat  = useCallback((key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > MIN_CATS) next.delete(key); }
      else next.add(key);
      return next;
    });
  }, []);

  // ── Fetch room lists ───────────────────────────────────────────────────────
  const fetchRealtimeRooms = useCallback(async (silent = false) => {
    if (!playerIdRef.current) { setRealtimeRooms([]); return; }
    if (!silent) setLoadingRooms(true);
    const { data } = await supabase
      .from('stop_rooms').select('id, letter, player1_name, created_at')
      .eq('status', 'waiting').eq('mode', 'realtime').eq('visibility', 'public')
      .neq('player1_id', playerIdRef.current)
      .order('created_at', { ascending: true }).limit(10);
    setRealtimeRooms((data as RealtimeRoom[]) ?? []);
    if (!silent) setLoadingRooms(false);
  }, []);

  const fetchAsyncGames = useCallback(async (silent = false) => {
    if (!playerIdRef.current) { setAsyncGames([]); return; }
    if (!silent) setLoadingAsync(true);
    const pid = playerIdRef.current;

    // Somente partidas onde eu sou jogador (P1 ou P2 já definido)
    const { data } = await supabase
      .from('stop_rooms')
      .select('id, letter, player1_id, player2_id, player1_name, player2_name, deadline, status')
      .eq('mode', 'async')
      .in('status', ['async_wait_p2', 'async_p2', 'completed'])
      .or(`player1_id.eq.${pid},player2_id.eq.${pid}`)
      .order('created_at', { ascending: false })
      .limit(20);

    setAsyncGames((data as AsyncGame[]) ?? []);
    if (!silent) setLoadingAsync(false);
  }, []);

  // Auto-refresh selection screen data
  useEffect(() => {
    if (phase !== 'selecting' || !user) return;
    fetchRealtimeRooms();
    fetchAsyncGames();
    const id1 = setInterval(() => fetchRealtimeRooms(true), 5000);
    const id2 = setInterval(() => fetchAsyncGames(true), 10_000);
    return () => { clearInterval(id1); clearInterval(id2); };
  }, [phase, user, fetchRealtimeRooms, fetchAsyncGames]);

  // Each player validates ONLY their own answers (bank + AI) and stores the result
  // in stop_answers.validation. The opponent reads that stored result — so both screens
  // show the exact same validation status for every answer.
  // The phaseRef guard in checkBothSubmitted ensures the UPDATE to stop_answers.validation
  // cannot re-trigger this effect, preventing the loop we had before.
  useEffect(() => {
    if (phase !== 'validating') return;
    const pending = pendingResultsRef.current;
    if (!pending) return;
    const cats = gameCatsRef.current;
    const ltr  = letterRef.current;
    const rId  = roomIdRef.current;
    const myId = playerIdRef.current;

    const run = async () => {
      setAiLoading(false);
      setWaitingOpp(false);
      console.log('[StopOnline] Iniciando validação. letra:', ltr, 'categorias:', cats.map(c => c.key));

      // ── Step 1: Validate MY answers (bank + AI) ──────────────────────────
      const myMap = await validateWithBank(ltr, pending.meAnswers, cats);
      setMyBankMap(myMap);
      console.log('[StopOnline] Banco (minhas):', myMap);

      const finalMyMap = { ...myMap };
      const myUnverified = cats.filter(c => myMap[c.key] === 'unverified' && c.key !== 'padre');
      console.log('[StopOnline] Não verificados (minhas):', myUnverified.map(c => `${c.key}="${pending.meAnswers[c.key]}"`));

      if (myUnverified.length > 0) {
        setAiLoading(true);
        await Promise.all(myUnverified.map(async (cat) => {
          const ans = (pending.meAnswers[cat.key] ?? '').trim();
          if (!ans) return;
          const result = await validateWithAI(ltr, ans, cat.key, cat.label);
          console.log(`[StopOnline] IA (minha) "${ans}": ${result === null ? 'null' : result ? 'VÁLIDA' : 'INVÁLIDA'}`);
          if (result !== null) finalMyMap[cat.key] = result ? 'ai_valid' : 'ai_invalid';
        }));
        setMyBankMap(finalMyMap);
        setAiLoading(false);
      }

      // ── Step 2: Save MY validation to DB ─────────────────────────────────
      // The phaseRef guard in checkBothSubmitted means this UPDATE cannot
      // re-trigger the 'validating' phase, so there is no loop risk here.
      if (rId && myId && !pending.skipCoins) {
        const { error: upErr } = await supabase.from('stop_answers')
          .update({ validation: finalMyMap })
          .eq('room_id', rId)
          .eq('player_id', myId);
        if (upErr) console.warn('[StopOnline] Erro ao salvar validation:', upErr.message);
        else console.log('[StopOnline] Minha validation salva no DB:', finalMyMap);
      }

      // ── Step 3: Read opponent's stored validation (max ~6 s wait) ────────
      let finalOppMap: Partial<Record<string, BankResult>> = {};
      const hasOpp = Object.keys(pending.oppAnswers).length > 0;

      if (rId && myId && hasOpp && !pending.skipCoins) {
        setWaitingOpp(true);
        for (let i = 0; i < 3; i++) {
          const { data } = await supabase
            .from('stop_answers')
            .select('validation')
            .eq('room_id', rId)
            .neq('player_id', myId)
            .limit(1);
          const stored = data?.[0]?.validation;
          console.log(`[StopOnline] Lendo validation do adv (tentativa ${i + 1}):`, stored ?? 'null');
          if (stored && Object.keys(stored).length > 0) {
            finalOppMap = stored as Partial<Record<string, BankResult>>;
            break;
          }
          if (i < 2) await new Promise<void>(r => setTimeout(r, 2000));
        }
        setWaitingOpp(false);
      }

      // Fallback: opponent's validation not in DB yet → bank-only for display
      if (hasOpp && Object.keys(finalOppMap).length === 0) {
        finalOppMap = await validateWithBank(ltr, pending.oppAnswers, cats);
        console.log('[StopOnline] Fallback banco (adv):', finalOppMap);
      }

      setOppBankMap(finalOppMap);

      // ── Step 4: Score and show result ────────────────────────────────────
      const myVC  = cats.filter(c => finalMyMap[c.key]  === 'valid' || finalMyMap[c.key]  === 'ai_valid').length;
      const oppVC = cats.filter(c => finalOppMap[c.key] === 'valid' || finalOppMap[c.key] === 'ai_valid').length;
      const myS   = myVC  * 10 + (cats.length > 0 && myVC  === cats.length ? 20 : 0);
      const oppS  = oppVC * 10 + (cats.length > 0 && oppVC === cats.length ? 20 : 0);
      console.log(`[StopOnline] Pontuação final — eu: ${myS} (${myVC}) | adv: ${oppS} (${oppVC})`);

      setMyResult({ answers: pending.meAnswers,  score: myS,  validCount: myVC });
      setOppResult({ answers: pending.oppAnswers, score: oppS, validCount: oppVC });

      if (!pending.skipCoins) {
        const isAS = gameModeRef.current === 'async';
        const delta = myS > oppS
          ? (isAS ? COINS.WIN_AS  : COINS.WIN_RT)
          : myS === oppS
            ? (isAS ? COINS.DRAW_AS : COINS.DRAW_RT)
            : (isAS ? COINS.LOSE_AS : COINS.LOSE_RT);
        awardCoinsRef.current(delta);
      }

      setPhase('result');
    };

    run().catch((err) => {
      console.error('[StopOnline] Erro inesperado na validação:', err);
      setPhase('result');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Create realtime room ──────────────────────────────────────────────────
  const createRealtimeRoom = useCallback(async (visibility: 'public' | 'private') => {
    if (!playerIdRef.current) return;
    const cats = ALL_STOP_CATEGORIES.filter(c => selectedKeys.has(c.key));
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('realtime'); gameModeRef.current = 'realtime';
    setPhase('matchmaking');
    setStatusMsg(visibility === 'private' ? 'Sala privada criada!' : 'Aguardando adversário...');
    isMatchedRef.current = false;
    setPrivateRoomCode(null);

    const newLetter  = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const roomCode   = visibility === 'private' ? genRoomCode() : null;
    const { data: newRoom, error } = await supabase
      .from('stop_rooms')
      .insert({
        letter: newLetter, player1_id: playerIdRef.current,
        player1_name: playerNameRef.current, mode: 'realtime',
        visibility, room_code: roomCode,
      })
      .select().single();

    if (error || !newRoom) { setPhase('error'); setStatusMsg('Erro ao criar sala.'); return; }

    roomIdRef.current = newRoom.id; isP1Ref.current = true; setIsPlayer1(true);
    setLetter(newLetter); letterRef.current = newLetter;
    if (roomCode) setPrivateRoomCode(roomCode);
    subscribeToRoom(newRoom.id);

    mmTimerRef.current = setTimeout(async () => {
      if (!isMatchedRef.current) {
        await supabase.from('stop_rooms').delete()
          .eq('id', newRoom.id).eq('status', 'waiting');
        setPhase('error');
        setStatusMsg('Nenhum adversário entrou.\nTente novamente.');
      }
    }, 5 * 60_000);
  }, [selectedKeys, subscribeToRoom]);

  const handleCriarSalaPublica  = useCallback(() => createRealtimeRoom('public'),  [createRealtimeRoom]);
  const handleCriarSalaPrivada  = useCallback(() => createRealtimeRoom('private'), [createRealtimeRoom]);

  // ── Join a realtime room from list ─────────────────────────────────────────
  const joinRealtimeRoom = useCallback(async (roomId: string, roomLetter: string) => {
    if (!playerIdRef.current) return;
    const cats = ALL_STOP_CATEGORIES.filter(c => selectedKeys.has(c.key));
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('realtime'); gameModeRef.current = 'realtime';
    isMatchedRef.current = false;
    setPhase('matchmaking'); setStatusMsg('Entrando na sala...');

    const { data: claimed } = await supabase
      .from('stop_rooms')
      .update({ player2_id: playerIdRef.current, player2_name: playerNameRef.current, status: 'active' })
      .eq('id', roomId).eq('status', 'waiting').select();

    if (!claimed || claimed.length === 0) {
      setPhase('selecting'); fetchRealtimeRooms();
      return;
    }

    isMatchedRef.current = true; isP1Ref.current = false; setIsPlayer1(false);
    roomIdRef.current = roomId;
    setLetter(roomLetter); letterRef.current = roomLetter;
    setStatusMsg('Adversário encontrado! 🎯');
    subscribeToRoom(roomId);
    startSpin(roomLetter);
  }, [selectedKeys, subscribeToRoom, startSpin, fetchRealtimeRooms]);

  // ── Join private room by code ─────────────────────────────────────────────
  const joinByCode = useCallback(async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert('Código inválido', 'Digite o código de 6 caracteres da sala.');
      return;
    }
    const { data: rooms } = await supabase
      .from('stop_rooms').select('id, letter')
      .eq('room_code', code).eq('status', 'waiting').eq('mode', 'realtime').limit(1);

    if (!rooms || rooms.length === 0) {
      Alert.alert('Sala não encontrada', 'Código inválido ou a sala já foi iniciada.');
      return;
    }
    setJoinCodeInput('');
    await joinRealtimeRoom(rooms[0].id, rooms[0].letter);
  }, [joinCodeInput, joinRealtimeRoom]);

  // ── Async flow (VAMOS JOGAR!) ──────────────────────────────────────────────
  const handleVamosJogar = useCallback(async () => {
    if (!playerIdRef.current) return;
    const cats = ALL_STOP_CATEGORIES.filter(c => selectedKeys.has(c.key));
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('async'); gameModeRef.current = 'async';
    setPhase('matchmaking'); setStatusMsg('Procurando partida...');
    isMatchedRef.current = false;

    // Find the oldest async game waiting for P2
    const { data: available } = await supabase
      .from('stop_rooms').select('*')
      .eq('mode', 'async').eq('status', 'async_wait_p2')
      .is('player2_id', null)
      .neq('player1_id', playerIdRef.current)
      .gt('deadline', new Date().toISOString())
      .order('created_at', { ascending: true }).limit(1);

    if (available && available.length > 0) {
      const room = available[0];
      const { data: claimed } = await supabase
        .from('stop_rooms')
        .update({ player2_id: playerIdRef.current, player2_name: playerNameRef.current, status: 'async_p2' })
        .eq('id', room.id).eq('status', 'async_wait_p2').select();

      if (claimed && claimed.length > 0) {
        isMatchedRef.current = true;
        isP1Ref.current = false; setIsPlayer1(false);
        roomIdRef.current = room.id;
        setLetter(room.letter); letterRef.current = room.letter;
        setStatusMsg('Partida encontrada! 🎯');
        startSpin(room.letter);
        return;
      }
      // Another player grabbed it — create our own
    }

    // Create a new async room and play as P1
    const newLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const { data: newRoom, error } = await supabase
      .from('stop_rooms')
      .insert({ letter: newLetter, player1_id: playerIdRef.current,
                player1_name: playerNameRef.current, mode: 'async', status: 'waiting' })
      .select().single();

    if (error || !newRoom) { setPhase('error'); setStatusMsg('Erro ao criar partida.'); return; }

    roomIdRef.current = newRoom.id; isP1Ref.current = true; setIsPlayer1(true);
    setLetter(newLetter); letterRef.current = newLetter;
    startSpin(newLetter);
  }, [selectedKeys, startSpin]);

  // ── Join a specific async game from list (as P2) ───────────────────────────
  const joinAsyncGame = useCallback(async (game: AsyncGame) => {
    if (!playerIdRef.current) return;
    if (game.deadline && new Date(game.deadline) < new Date()) {
      Alert.alert('Prazo expirado', 'Esta partida já expirou.');
      fetchAsyncGames(true); return;
    }
    const cats = ALL_STOP_CATEGORIES.filter(c => selectedKeys.has(c.key));
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('async'); gameModeRef.current = 'async';
    setPhase('matchmaking'); setStatusMsg('Entrando na partida...');

    const { data: claimed } = await supabase
      .from('stop_rooms')
      .update({ player2_id: playerIdRef.current, player2_name: playerNameRef.current, status: 'async_p2' })
      .eq('id', game.id).eq('status', 'async_wait_p2').select();

    if (!claimed || claimed.length === 0) {
      setPhase('selecting'); fetchAsyncGames(true); return;
    }

    isP1Ref.current = false; setIsPlayer1(false);
    roomIdRef.current = game.id;
    setLetter(game.letter); letterRef.current = game.letter;
    startSpin(game.letter);
  }, [selectedKeys, startSpin, fetchAsyncGames]);

  // ── View result of a completed async game ─────────────────────────────────
  const viewAsyncResult = useCallback(async (game: AsyncGame) => {
    const isExpired = game.deadline ? new Date(game.deadline) < new Date() : false;
    const pid = playerIdRef.current;

    const { data } = await supabase
      .from('stop_answers').select('*').eq('room_id', game.id).eq('submitted', true);

    const me  = data?.find(r => r.player_id === pid);
    const opp = data?.find(r => r.player_id !== pid);

    if (!me) { Alert.alert('Aguarde', 'Você ainda não enviou suas respostas.'); return; }

    const answerKeys = Object.keys(me.answers ?? {});
    const cats = ALL_STOP_CATEGORIES.filter(c => answerKeys.includes(c.key));

    roomIdRef.current = game.id;
    setLetter(game.letter); letterRef.current = game.letter;
    if (cats.length > 0) { setGameCategories(cats); gameCatsRef.current = cats; }

    setP1Rematch(false); setP2Rematch(false);

    if (opp) {
      setAbandoned(null);
      pendingResultsRef.current = { meAnswers: me.answers, oppAnswers: opp.answers };
      setPhase('validating');
    } else if (isExpired) {
      // Opp never responded — validate my answers but skip coin award
      setAbandoned('opp');
      pendingResultsRef.current = { meAnswers: me.answers, oppAnswers: {}, skipCoins: true };
      setPhase('validating');
    } else {
      Alert.alert('Aguardando', 'O adversário ainda não respondeu.');
    }
  }, []);

  // ─────────────────────────────────── RENDERS ──────────────────────────────

  const timerPct   = (timeLeft / TIMER) * 100;
  const timerColor = timeLeft > 30 ? C.green : timeLeft > 15 ? C.gold : C.red;

  // Login gate
  if (!user) return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="MODO ONLINE" />
        <View style={s.centerFlex}>
          <ThemedText style={{ fontSize: 64 }}>🔐</ThemedText>
          <ThemedText type="subtitle" style={s.center}>Login necessário</ThemedText>
          <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
            Para jogar online você precisa estar logado.
          </ThemedText>
          <TouchableOpacity style={[s.btn, { backgroundColor: BRAND, marginTop: Spacing.four }]}
            onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
            <ThemedText style={s.btnTxt}>FAZER LOGIN</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ThemedText style={[s.btnTxt, { color: theme.textSecondary }]}>VOLTAR</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );

  // ── Category selection ─────────────────────────────────────────────────────
  if (phase === 'selecting') {
    const numSelected = selectedKeys.size;
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="ESCOLHER CATEGORIAS" />
          <ScrollView contentContainerStyle={[s.selectScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
            showsVerticalScrollIndicator={false}>

            <ThemedText type="subtitle" style={s.center}>Escolha as categorias</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
              Mínimo {MIN_CATS} · Selecionadas: {numSelected}
            </ThemedText>

            <View style={s.catGrid}>
              {ALL_STOP_CATEGORIES.map(cat => {
                const on = selectedKeys.has(cat.key);
                return (
                  <TouchableOpacity key={cat.key} onPress={() => toggleCat(cat.key)} activeOpacity={0.75}
                    style={[s.catChip, on
                      ? { backgroundColor: BRAND, borderColor: BRAND }
                      : { backgroundColor: 'transparent', borderColor: C.border }]}>
                    <ThemedText style={[s.chipLabel, { color: on ? '#fff' : theme.textSecondary }]}
                      numberOfLines={2}>{cat.label}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Modo escolha ── */}
            <View style={s.modeRow}>
              <TouchableOpacity style={[s.modeBtn, { backgroundColor: C.purple }]}
                onPress={handleCriarSalaPublica} activeOpacity={0.85}>
                <ThemedText style={{ fontSize: 20 }}>🏠</ThemedText>
                <ThemedText style={s.modeBtnTitle}>SALA PÚBLICA</ThemedText>
                <ThemedText style={s.modeBtnSub}>Qualquer um entra</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modeBtn, { backgroundColor: '#5B6EBF' }]}
                onPress={handleCriarSalaPrivada} activeOpacity={0.85}>
                <ThemedText style={{ fontSize: 20 }}>🔒</ThemedText>
                <ThemedText style={s.modeBtnTitle}>SALA PRIVADA</ThemedText>
                <ThemedText style={s.modeBtnSub}>Somente com código</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.modeBtn, { backgroundColor: BRAND, alignSelf: 'stretch' }]}
              onPress={handleVamosJogar} activeOpacity={0.85}>
              <ThemedText style={{ fontSize: 20 }}>⏱️</ThemedText>
              <ThemedText style={s.modeBtnTitle}>VAMOS JOGAR!</ThemedText>
              <ThemedText style={s.modeBtnSub}>Sem pressa · até 2 dias para responder</ThemedText>
            </TouchableOpacity>

            {/* ── Entrar com código ── */}
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionLabel}>🔒 ENTRAR EM SALA PRIVADA</ThemedText>
            </View>
            <View style={s.codeEntryRow}>
              <TextInput
                style={[s.codeInput, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                value={joinCodeInput}
                onChangeText={t => setJoinCodeInput(t.toUpperCase())}
                placeholder="CÓDIGO DA SALA"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
              <TouchableOpacity
                style={[s.enterBtn, { opacity: joinCodeInput.trim().length >= 4 ? 1 : 0.4 }]}
                onPress={joinByCode}
                disabled={joinCodeInput.trim().length < 4}
                activeOpacity={0.8}>
                <ThemedText style={s.enterBtnTxt}>ENTRAR</ThemedText>
              </TouchableOpacity>
            </View>

            {/* ── Salas em tempo real ── */}
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionLabel}>🏠 SALAS PÚBLICAS</ThemedText>
              <TouchableOpacity onPress={() => fetchRealtimeRooms()} style={s.refreshBtn}>
                <ThemedText style={{ fontSize: 16 }}>{loadingRooms ? '⏳' : '🔄'}</ThemedText>
              </TouchableOpacity>
            </View>
            {realtimeRooms.length === 0 ? (
              <ThemedView type="backgroundElement" style={s.emptyCard}>
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12 }]}>
                  Nenhuma sala aberta. Crie a sua!
                </ThemedText>
              </ThemedView>
            ) : realtimeRooms.map(room => (
              <ThemedView key={room.id} type="backgroundElement" style={s.roomCard}>
                <View style={s.roomCardLeft}>
                  <ThemedText style={{ fontSize: 26 }}>👤</ThemedText>
                  <View>
                    <ThemedText type="smallBold">{room.player1_name || 'Jogador'}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                      Aguardando adversário
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity style={s.enterBtn}
                  onPress={() => joinRealtimeRoom(room.id, room.letter)} activeOpacity={0.8}>
                  <ThemedText style={s.enterBtnTxt}>ENTRAR</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ))}

            {/* ── Partidas assíncronas ── */}
            <View style={s.sectionHeader}>
              <ThemedText style={s.sectionLabel}>⏱️ PARTIDAS ASSÍNCRONAS</ThemedText>
              <TouchableOpacity onPress={() => fetchAsyncGames()} style={s.refreshBtn}>
                <ThemedText style={{ fontSize: 16 }}>{loadingAsync ? '⏳' : '🔄'}</ThemedText>
              </TouchableOpacity>
            </View>
            {asyncGames.length === 0 ? (
              <ThemedView type="backgroundElement" style={s.emptyCard}>
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12 }]}>
                  Clique em "Vamos Jogar!" para entrar em uma partida.
                </ThemedText>
              </ThemedView>
            ) : asyncGames.map(game => {
              const pid    = playerIdRef.current;
              const amP1   = game.player1_id === pid;
              const amP2   = game.player2_id === pid;
              const isOpen = !amP1 && !amP2 && game.status === 'async_wait_p2';
              const isDone = game.status === 'completed';
              const expired = game.deadline ? new Date(game.deadline) < new Date() : false;
              const opp    = amP1 ? (game.player2_name || '?') : (game.player1_name || '?');
              const dl     = fmtDeadline(game.deadline);

              let icon = '⏳', label = '', sub = dl, canAct = false;
              if (isDone) {
                icon = '🏁'; label = `vs ${opp}`; sub = 'Concluído';
                canAct = true;
              } else if (isOpen) {
                icon = expired ? '⛔' : '⏰';
                label = `${game.player1_name || 'Alguém'} aguarda`;
                sub = expired ? 'Expirado' : dl;
                canAct = !expired;
              } else if (amP1) {
                icon = expired ? '✅' : '⏳';
                label = expired ? 'Adversário não respondeu' : 'Aguardando resposta';
                canAct = expired;
              } else if (amP2) {
                icon = '✅'; label = `vs ${opp}`; sub = 'Sua resposta enviada';
                canAct = isDone;
              }

              return (
                <ThemedView key={game.id} type="backgroundElement" style={s.asyncCard}>
                  <View style={s.asyncCardLeft}>
                    <ThemedText style={{ fontSize: 22 }}>{icon}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" numberOfLines={1}>{label}</ThemedText>
                      <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>{sub}</ThemedText>
                    </View>
                  </View>
                  {isOpen && !expired ? (
                    <TouchableOpacity style={s.enterBtn} onPress={() => joinAsyncGame(game)} activeOpacity={0.8}>
                      <ThemedText style={s.enterBtnTxt}>JOGAR</ThemedText>
                    </TouchableOpacity>
                  ) : canAct ? (
                    <TouchableOpacity style={[s.enterBtn, { backgroundColor: C.purple }]}
                      onPress={() => viewAsyncResult(game)} activeOpacity={0.8}>
                      <ThemedText style={s.enterBtnTxt}>RESULTADO</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </ThemedView>
              );
            })}

            <TouchableOpacity style={s.ghostBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <ThemedText style={[s.btnTxt, { color: theme.textSecondary }]}>VOLTAR</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Matchmaking / error ────────────────────────────────────────────────────
  if (phase === 'matchmaking' || phase === 'error') {
    const isRealtime = gameMode === 'realtime';
    const isPrivate  = Boolean(privateRoomCode);
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader
            title="Stop Online"
            subtitle={isRealtime ? (isPrivate ? 'SALA PRIVADA' : 'SALA PÚBLICA') : 'PARTIDA ASSÍNCRONA'}
          />
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 64 }}>
              {phase === 'error' ? '📡' : isPrivate ? '🔒' : isRealtime ? '🏠' : '⏱️'}
            </ThemedText>
            <ThemedText type="subtitle" style={s.center}>{statusMsg}</ThemedText>

            {/* Private room code block */}
            {isPrivate && privateRoomCode && phase !== 'error' && (
              <View style={s.codeBlock}>
                <ThemedText style={s.codeLabel}>CÓDIGO DA SALA</ThemedText>
                <ThemedText style={s.codeText}>{privateRoomCode}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 12, textAlign: 'center' }}>
                  Compartilhe este código com seu amigo para ele entrar na sala.
                </ThemedText>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: C.purple }]}
                  onPress={() => Share.share({ message: `Entre na minha sala privada do Stop Católico!\nCódigo: ${privateRoomCode}` })}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnTxt}>📤  COMPARTILHAR CÓDIGO</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {phase === 'error' ? (
              <TouchableOpacity style={[s.btn, { backgroundColor: BRAND, marginTop: Spacing.four }]}
                onPress={() => setPhase('selecting')} activeOpacity={0.8}>
                <ThemedText style={s.btnTxt}>TENTAR NOVAMENTE</ThemedText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={s.ghostBtn} onPress={async () => {
              if (mmTimerRef.current) clearTimeout(mmTimerRef.current);
              if (roomIdRef.current) {
                await supabase.from('stop_rooms').delete()
                  .eq('id', roomIdRef.current).eq('status', 'waiting');
              }
              setPrivateRoomCode(null);
              setPhase('selecting');
            }} activeOpacity={0.8}>
              <ThemedText style={[s.btnTxt, { color: theme.textSecondary }]}>CANCELAR</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Spinning ───────────────────────────────────────────────────────────────
  if (phase === 'spinning') return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="SORTEANDO LETRA" />
        <View style={s.spinScreen}>
          <ThemedText themeColor="textSecondary" style={s.spinLabel}>
            {spinDone ? 'Sua letra é:' : 'Sorteando...'}
          </ThemedText>
          <Animated.View style={[s.spinCircle, { backgroundColor: BRAND, transform: [{ scale: scaleAnim }] }]}>
            <ThemedText style={s.spinLetterText}>{spinLetter}</ThemedText>
          </Animated.View>
          <ThemedText style={spinDone ? [s.spinGo, { color: BRAND }] : s.spinHint}
            themeColor={spinDone ? undefined : 'textSecondary'}>
            {spinDone ? 'Prepare-se! 🚀' : 'Aguarde...'}
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );

  // ── Validating answers ─────────────────────────────────────────────────────
  if (phase === 'validating') return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="VERIFICANDO" />
        <View style={s.centerFlex}>
          <ThemedText style={{ fontSize: 48, lineHeight: 56 }}>🔍</ThemedText>
          <ThemedText type="subtitle" style={s.center}>Verificando respostas...</ThemedText>
          <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
            {aiLoading ? 'Consultando IA...' : waitingOpp ? 'Aguardando validação do adversário...' : 'Consultando banco de palavras...'}
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );

  // ── Waiting for opponent (realtime) ────────────────────────────────────────
  if (phase === 'waiting') return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="AGUARDANDO" />
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

  // ── Async submitted (P1 sent answers, waiting for P2) ─────────────────────
  if (phase === 'async_submitted') return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="RESPOSTAS ENVIADAS" />
        <View style={s.centerFlex}>
          <ThemedText style={{ fontSize: 64 }}>✅</ThemedText>
          <ThemedText type="subtitle" style={s.center}>Respostas enviadas!</ThemedText>
          <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
            O adversário tem 2 dias para responder.{'\n'}Volte para ver o resultado!
          </ThemedText>
          <TouchableOpacity style={[s.btn, { backgroundColor: BRAND, marginTop: Spacing.four }]}
            onPress={() => { setPhase('selecting'); fetchAsyncGames(); }} activeOpacity={0.8}>
            <ThemedText style={s.btnTxt}>VER MINHAS PARTIDAS</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result' && myResult) {
    const cats       = gameCatsRef.current;
    const isAbandon  = abandoned === 'me';
    const oppLeft    = abandoned === 'opp';
    const iWon       = isAbandon ? false : oppLeft ? true : (myResult.score > (oppResult?.score ?? 0));
    const tied       = !isAbandon && !oppLeft && myResult.score === (oppResult?.score ?? 0);
    const isAsync    = gameMode === 'async';

    let resEmoji = tied ? '🤝' : iWon ? '🏆' : isAbandon ? '🏳️' : '📿';
    let resMsg   = tied ? 'Empate!' : iWon ? 'Você ganhou!' : isAbandon ? 'Você abandonou' : 'Adversário ganhou!';
    let resColor = iWon ? C.green : tied ? C.gold : C.red;
    if (oppLeft) { resEmoji = '🏆'; resMsg = 'Adversário saiu — você ganhou!'; resColor = C.green; }

    const myRematch  = isPlayer1 ? p1Rematch : p2Rematch;
    const oppRematch = isPlayer1 ? p2Rematch : p1Rematch;

    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="RESULTADO" />
          <ScrollView contentContainerStyle={[s.resultScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>

            {coinDelta !== null && (
              <View style={[s.coinBadge, { backgroundColor: coinDelta >= 0 ? C.green : C.red }]}>
                <ThemedText style={s.coinBadgeTxt}>
                  {coinDelta >= 0 ? '+' : ''}{coinDelta} 🪙
                </ThemedText>
              </View>
            )}

            <View style={[s.resBanner, { backgroundColor: resColor + '22', borderColor: resColor }]}>
              <ThemedText style={{ fontSize: 40, lineHeight: 48 }}>{resEmoji}</ThemedText>
              <View style={{ gap: 2 }}>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', color: resColor, lineHeight: 26 }}>{resMsg}</ThemedText>
                {!isAbandon && !oppLeft && (
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                    Letra: {letter} · {myResult.score} vs {oppResult?.score ?? 0} pts
                  </ThemedText>
                )}
                {oppLeft && (
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                    {isAsync ? 'Prazo encerrado sem resposta' : 'Adversário abandonou a partida'}
                  </ThemedText>
                )}
              </View>
            </View>

            {!isAbandon && oppResult && (
              <>
                <View style={s.scoreRow}>
                  <ThemedView type="backgroundElement" style={[s.scoreCard, { borderColor: C.purple }]}>
                    <ThemedText style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: C.purple }}>VOCÊ</ThemedText>
                    <ThemedText style={{ fontSize: 30, fontWeight: '900', color: C.purple, lineHeight: 36 }}>{myResult.score}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{myResult.validCount}/{cats.length} válidas</ThemedText>
                  </ThemedView>
                  <ThemedText style={{ fontSize: 18, fontWeight: '800', color: theme.textSecondary }}>VS</ThemedText>
                  <ThemedView type="backgroundElement" style={[s.scoreCard, { borderColor: BRAND }]}>
                    <ThemedText style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: BRAND }}>ADVERSÁRIO</ThemedText>
                    <ThemedText style={{ fontSize: 30, fontWeight: '900', color: BRAND, lineHeight: 36 }}>
                      {oppLeft ? '—' : oppResult.score}
                    </ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                      {oppLeft ? 'Não respondeu' : `${oppResult.validCount}/${cats.length} válidas`}
                    </ThemedText>
                  </ThemedView>
                </View>

                <ThemedText style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textSecondary }}>
                  COMPARAÇÃO DE RESPOSTAS
                </ThemedText>
                {cats.map(c => {
                  const mine   = ((myResult.answers[c.key] ?? '') as string).trim();
                  const theirs = ((oppResult.answers[c.key] ?? '') as string).trim();
                  const myV    = mine.length   > 0 && mine[0].toUpperCase()   === letter;
                  const theirV = theirs.length > 0 && theirs[0].toUpperCase() === letter;
                  const myRes  = myBankMap[c.key];
                  const oppRes = oppBankMap[c.key];

                  const cellColor = (res: BankResult | undefined) =>
                    (res === 'valid' || res === 'ai_valid') ? C.green
                    : res === 'unverified'                  ? C.gold
                    : res === 'ai_invalid'                  ? C.red
                    : theme.textSecondary;

                  const cellBg = (res: BankResult | undefined, startsOk: boolean) =>
                    !res
                      ? (startsOk ? C.green : C.red) + '18'
                      : (res === 'valid' || res === 'ai_valid') ? C.green + '18'
                      : res === 'unverified'                    ? C.gold  + '22'
                      : res === 'ai_invalid'                    ? C.red   + '22'
                      : C.red + '18';

                  const Badge = ({ res: r }: { res: BankResult | undefined }) => {
                    if (!r) return null;
                    if (r === 'valid')      return <ThemedText style={s.compBadge}>✅ Reconhecida</ThemedText>;
                    if (r === 'ai_valid')   return <ThemedText style={s.compBadge}>✅ Válida (IA) 🤖</ThemedText>;
                    if (r === 'unverified') return <ThemedText style={[s.compBadge, { color: C.gold }]}>⚠️ Não verificada</ThemedText>;
                    if (r === 'ai_invalid') return <ThemedText style={[s.compBadge, { color: C.red }]}>❌ Não reconhecida</ThemedText>;
                    return null;
                  };

                  return (
                    <ThemedView key={c.key} type="backgroundElement" style={s.compCard}>
                      <View style={s.compHeader}>
                        <ThemedText type="smallBold" style={{ flex: 1 }}>{c.label}</ThemedText>
                      </View>
                      <View style={s.compAnswers}>
                        <View style={[s.compCell, { backgroundColor: cellBg(myRes, myV) }]}>
                          <ThemedText style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: C.purple }}>VOCÊ</ThemedText>
                          <ThemedText style={{ fontSize: 13, fontWeight: '600', color: cellColor(myRes) }}>
                            {mine || '—'}
                          </ThemedText>
                          <Badge res={myRes} />
                        </View>
                        <View style={[s.compCell, { backgroundColor: cellBg(oppRes, theirV) }]}>
                          <ThemedText style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: BRAND }}>ADVERSÁRIO</ThemedText>
                          <ThemedText style={{ fontSize: 13, fontWeight: '600', color: cellColor(oppRes) }}>
                            {theirs || (oppLeft ? '(não respondeu)' : '—')}
                          </ThemedText>
                          {!oppLeft && <Badge res={oppRes} />}
                        </View>
                      </View>
                    </ThemedView>
                  );
                })}
              </>
            )}

            {/* Rematch — only realtime, only if no abandon */}
            {!isAbandon && !oppLeft && !isAsync && (
              <>
                <TouchableOpacity
                  style={[s.btn, myRematch
                    ? { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: BRAND }
                    : { backgroundColor: BRAND }]}
                  onPress={myRematch ? undefined : requestRematch} activeOpacity={myRematch ? 1 : 0.8}>
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
              </>
            )}

            <TouchableOpacity style={s.ghostBtn} onPress={() => {
              setPhase('selecting'); setAbandoned(null);
              setMyResult(null); setOppResult(null);
              setP1Rematch(false); setP2Rematch(false);
              setCoinDelta(null); coinsAwardedRef.current = false;
              pendingResultsRef.current = null;
              setMyBankMap({}); setOppBankMap({}); setAiLoading(false);
              fetchAsyncGames();
            }} activeOpacity={0.8}>
              <ThemedText style={[s.btnTxt, { color: theme.textSecondary }]}>VOLTAR AO MENU</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  const isAsync = gameMode === 'async';
  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader
          title="Stop Online"
          subtitle={isAsync ? 'ASSÍNCRONO' : 'TEMPO REAL'}
          right={!isAsync ? (
            <ThemedText type="smallBold" style={{ color: timerColor, fontSize: 20 }}>{timeLeft}s</ThemedText>
          ) : undefined}
        />
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[s.playScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
            keyboardShouldPersistTaps="handled">

            {!isAsync && (
              <View style={[s.timerBar, { backgroundColor: theme.backgroundElement }]}>
                <View style={[s.timerFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
              </View>
            )}

            <View style={s.letterRow}>
              <View style={[s.letterCard, { backgroundColor: BRAND }]}>
                <ThemedText style={s.letterText}>{letter}</ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 13, lineHeight: 18, flex: 1 }}>
                {isAsync
                  ? 'Responda com calma. Clique em Enviar quando terminar.'
                  : 'Preencha as categorias com palavras que comecem com esta letra'}
              </ThemedText>
            </View>

            {gameCategories.map((cat, i) => (
              <ThemedView key={cat.key} type="backgroundElement" style={s.inputCard}>
                <View style={s.inputGroup}>
                  <ThemedText style={s.catLabel}>{cat.label}</ThemedText>
                  <TextInput
                    ref={ref => { inputRefs.current[cat.key] = ref; }}
                    style={[s.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                    value={answers[cat.key] ?? ''}
                    onChangeText={text => setAnswer(cat.key, text)}
                    placeholder={`${letter}...`}
                    placeholderTextColor={theme.textSecondary}
                    returnKeyType={i < gameCategories.length - 1 ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      const nextKey = gameCategories[i + 1]?.key;
                      if (nextKey) inputRefs.current[nextKey]?.focus();
                    }}
                    autoCapitalize="words" autoCorrect={false}
                  />
                </View>
              </ThemedView>
            ))}

            {isAsync ? (
              <TouchableOpacity style={[s.stopBtn, { backgroundColor: C.purple }]} onPress={callStop} activeOpacity={0.8}>
                <ThemedText style={s.stopTxt}>✅  ENVIAR RESPOSTAS</ThemedText>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[s.stopBtn, { backgroundColor: BRAND }]} onPress={callStop} activeOpacity={0.8}>
                  <ThemedText style={s.stopTxt}>🛑  STOP!</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[s.ghostBtn, { marginTop: 4 }]}
                  onPress={() => Alert.alert('Abandonar partida?', 'Você perderá automaticamente.',
                    [{ text: 'Ficar', style: 'cancel' },
                     { text: 'Abandonar', style: 'destructive', onPress: handleAbandon }]
                  )} activeOpacity={0.8}>
                  <ThemedText style={[s.btnTxt, { color: theme.textSecondary, fontSize: 13 }]}>ABANDONAR PARTIDA</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:       { flex: 1 },
  center:     { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },

  // Selection
  selectScroll: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignSelf: 'stretch' },
  catChip: {
    width: '47%', flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: Spacing.two, borderRadius: C.radius.md, borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  chipLabel: { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 16 },

  // Mode buttons
  modeRow: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' },
  modeBtn: {
    flex: 1, borderRadius: C.radius.lg, paddingVertical: Spacing.three,
    alignItems: 'center', gap: 4, elevation: 4, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  modeBtnTitle: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  modeBtnSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 10 },

  // Private room code (matchmaking screen)
  codeBlock: {
    alignSelf: 'stretch', alignItems: 'center', gap: Spacing.two,
    backgroundColor: C.purple + '18', borderRadius: C.radius.lg,
    borderWidth: 1.5, borderColor: C.purple + '55',
    padding: Spacing.three,
  },
  codeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: C.purple },
  codeText:  { fontSize: 42, fontWeight: '900', letterSpacing: 8, color: C.purple },

  // Code entry (selection screen)
  codeEntryRow: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch', alignItems: 'center' },
  codeInput: {
    flex: 1, borderWidth: 1.5, borderRadius: C.radius.md,
    paddingHorizontal: Spacing.three, paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    fontSize: 18, fontWeight: '800', letterSpacing: 4, textAlign: 'center',
  },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  sectionLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4' },
  refreshBtn:    { padding: 6 },

  // Room cards
  emptyCard:    { alignSelf: 'stretch', borderRadius: C.radius.md, padding: Spacing.three, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  roomCard:     { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: C.radius.md, padding: Spacing.three, borderWidth: 1, borderColor: C.border },
  roomCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  enterBtn:     { backgroundColor: BRAND, paddingHorizontal: 16, paddingVertical: 8, borderRadius: C.radius.pill },
  enterBtnTxt:  { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },

  // Async game cards
  asyncCard:     { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: C.radius.md, padding: Spacing.three, borderWidth: 1, borderColor: C.border },
  asyncCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },

  // Buttons
  btn:      { paddingHorizontal: Spacing.four, paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', alignSelf: 'stretch' },
  btnTxt:   { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  ghostBtn: { paddingVertical: 12, alignItems: 'center', alignSelf: 'stretch' },

  // Spin
  spinScreen:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  spinLabel:      { fontSize: 17, letterSpacing: 0.3 },
  spinCircle: {
    width: 180, height: 180, borderRadius: 45, alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 24,
  },
  spinLetterText: { fontSize: 110, fontWeight: '900', color: '#fff', lineHeight: 118 },
  spinGo:   { fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  spinHint: { fontSize: 13, opacity: 0.5 },

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
  catEmoji:   { fontSize: 22, width: 32, textAlign: 'center' },
  input: {
    borderWidth: 1.5, borderRadius: C.radius.sm, paddingHorizontal: Spacing.two,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6, fontSize: 15, fontWeight: '500',
  },
  stopBtn: { paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', marginTop: Spacing.one },
  stopTxt: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },

  // Result
  coinBadge: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: C.radius.pill, marginBottom: 4,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  coinBadgeTxt: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5, lineHeight: 28 },

  resultScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.two },
  resBanner:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: C.radius.lg, padding: Spacing.three, borderWidth: 1 },
  scoreRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  scoreCard:    { flex: 1, alignItems: 'center', gap: 2, borderRadius: C.radius.lg, padding: Spacing.three, borderWidth: 1 },
  compCard:     { borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.one, borderWidth: 1, borderColor: C.border },
  compHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  compAnswers:  { flexDirection: 'row', gap: Spacing.one },
  compCell:     { flex: 1, borderRadius: C.radius.sm, padding: Spacing.one, gap: 2 },
  compBadge:    { fontSize: 8, fontWeight: '800', color: C.green, letterSpacing: 0.3 },
});
