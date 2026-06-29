import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';

import { GameHeader } from '@/components/game-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { ALL_LETTERS, ALL_STOP_CATEGORIES, computeAvailableLetters, StopCategory } from '@/constants/stop-categories';
import { supabase } from '@/lib/supabase';
import { validateWithBank, validateWithAI, BankResult } from '@/lib/stop-bank';
import { recordScoreEvent } from '@/lib/score-events';
import { loadBankHints, getAIHint, HintMap } from '@/lib/stop-hints';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useGamePacks, mergeStopCategories } from '@/hooks/use-game-packs';
import { useStopCategories } from '@/hooks/use-stop-categories';
import { CoinsAnimation } from '@/components/coins-animation';
import { AvatarImage } from '@/components/avatar-image';

const BRAND            = '#EF9F27';
const TIMER            = 90;
const SLOT_COUNT       = 6;
const SLOT_COLORS      = [C.purple, BRAND, C.green, '#4A9EDB', '#C97BD4', '#E05555'];
const ASYNC_DEADLINE_MS = 2 * 24 * 60 * 60 * 1000;

function pickSixKeys(cats: StopCategory[]): string[] {
  return [...cats].sort(() => Math.random() - 0.5).slice(0, SLOT_COUNT).map(c => c.key);
}
const ROOM_TIMEOUT_S   = 120; // 2 min para sala encher; depois inicia com quem entrou

const COINS = {
  WIN_RT:   20,
  DRAW_RT:  10,
  LOSE_RT:   0,
  WIN_AS:   15,
  DRAW_AS:   8,
  LOSE_AS:   0,
  ABANDON: -15,
  OPP_OUT:  25,
} as const;

const LETTERS     = ['A','B','C','D','E','F','G','H','I','J','L','M','N','O','P','R','S','T','U','V'];
const CODE_CHARS  = 'ABCDEFGHJKLMNPRSTV23456789';
const genRoomCode = () =>
  Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

function pickOnlineLetter(cats: StopCategory[]): string {
  const catValid  = computeAvailableLetters(cats);
  const pool      = catValid.filter(l => LETTERS.includes(l));
  const draw      = pool.length > 0 ? pool : LETTERS;
  return draw[Math.floor(Math.random() * draw.length)];
}

type Phase    = 'selecting' | 'matchmaking' | 'spinning' | 'playing' | 'waiting' | 'async_submitted' | 'validating' | 'result' | 'error';
type GameMode = 'realtime' | 'async';
type AnswerMap = Partial<Record<string, string>>;

interface PlayerInfo   { id: string; name: string; }
interface PlayerResult { answers: AnswerMap; score: number; validCount: number; }
interface MultiResult  {
  playerId: string; playerName: string; rank: number;
  answers: AnswerMap; score: number; validCount: number;
  bankMap: Partial<Record<string, BankResult>>;
}
interface RealtimeRoom {
  id: string; letter: string; player1_id: string | null; player1_name: string | null;
  created_at: string; max_players: number; player_count: number;
}
interface AsyncGame {
  id: string; letter: string; status: string;
  player1_id: string; player2_id: string | null;
  player1_name: string | null; player2_name: string | null;
  deadline: string | null;
  p1_elapsed_seconds: number | null;
  p1_dismissed_at: string | null;
  p2_dismissed_at: string | null;
  category_keys?: string[] | null;
}
interface PendingResults {
  meAnswers: AnswerMap; oppAnswers: AnswerMap; skipCoins?: boolean;
  oppName?: string;
  allSubmissions?: { player_id: string; answers: AnswerMap; score: number; valid_count: number }[];
}

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
  const { packs }      = useGamePacks('stop');
  const baseCategories = useStopCategories();
  const allCategories  = mergeStopCategories(baseCategories, packs, ALL_LETTERS) as StopCategory[];
  const allCategoriesRef = useRef<StopCategory[]>(ALL_STOP_CATEGORIES);
  useEffect(() => { allCategoriesRef.current = allCategories; }, [allCategories]);

  const playerIdRef   = useRef('');   playerIdRef.current   = user?.id ?? '';
  const playerNameRef = useRef('Jogador'); playerNameRef.current = profile?.name ?? 'Jogador';

  // ── Phase / mode / categories ──────────────────────────────────────────────
  const [phase,          setPhase]          = useState<Phase>('selecting');
  const phaseRef = useRef<Phase>('selecting'); phaseRef.current = phase;
  const [gameMode,       setGameMode]       = useState<GameMode>('realtime');
  const gameModeRef                         = useRef<GameMode>('realtime');
  const [statusMsg,      setStatusMsg]      = useState('');
  const [slots,          setSlots]          = useState<string[]>(() => pickSixKeys(ALL_STOP_CATEGORIES));
  const slotsRef = useRef<string[]>([]);
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  const [gameCategories, setGameCategories] = useState<StopCategory[]>([]);
  const gameCatsRef = useRef<StopCategory[]>([]);
  useEffect(() => { gameCatsRef.current = gameCategories; }, [gameCategories]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  // ── Game state ─────────────────────────────────────────────────────────────
  const [letter,        setLetter]        = useState('A');
  const [answers,       setAnswers]       = useState<AnswerMap>({});
  const [timeLeft,      setTimeLeft]      = useState(TIMER);
  const [myResult,      setMyResult]      = useState<PlayerResult | null>(null);
  const [oppResult,     setOppResult]     = useState<PlayerResult | null>(null);
  const [oppName,       setOppName]       = useState('Adversário');
  const [p1Rematch,     setP1Rematch]     = useState(false);
  const [p2Rematch,     setP2Rematch]     = useState(false);
  const [isPlayer1,     setIsPlayer1]     = useState(false);
  const [abandoned,     setAbandoned]     = useState<'me' | 'opp' | null>(null);
  const [coinDelta,     setCoinDelta]     = useState<number | null>(null);

  // ── Multi-player state ─────────────────────────────────────────────────────
  const [maxPlayers,    setMaxPlayers]    = useState(2);
  const maxPlayersRef   = useRef(2);
  useEffect(() => { maxPlayersRef.current = maxPlayers; }, [maxPlayers]);

  const [roomPlayers,   setRoomPlayers]   = useState<PlayerInfo[]>([]);
  const roomPlayersRef  = useRef<PlayerInfo[]>([]);
  useEffect(() => { roomPlayersRef.current = roomPlayers; }, [roomPlayers]);

  const [multiResults,  setMultiResults]  = useState<MultiResult[]>([]);

  // Countdown no matchmaking para salas com múltiplos jogadores
  const [mmTimeLeft,    setMmTimeLeft]    = useState(ROOM_TIMEOUT_S);
  const mmIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Room lists ─────────────────────────────────────────────────────────────
  const [realtimeRooms,   setRealtimeRooms]   = useState<RealtimeRoom[]>([]);
  const [loadingRooms,    setLoadingRooms]     = useState(false);
  const [asyncGames,      setAsyncGames]       = useState<AsyncGame[]>([]);
  const [loadingAsync,    setLoadingAsync]     = useState(false);
  const [dismissedIds,    setDismissedIds]     = useState<Set<string>>(() => new Set());
  const [privateRoomCode, setPrivateRoomCode]  = useState<string | null>(null);
  const [joinCodeInput,   setJoinCodeInput]    = useState('');
  const [myBankMap,   setMyBankMap]   = useState<Partial<Record<string, BankResult>>>({});
  const [oppBankMap,  setOppBankMap]  = useState<Partial<Record<string, BankResult>>>({});
  const [aiLoading,      setAiLoading]      = useState(false);
  const [waitingOpp,     setWaitingOpp]     = useState(false);
  const [validatingStep, setValidatingStep] = useState(0); // 0=banco 1=ia/save 2=aguardando adv
  const validatingAnim  = useRef(new Animated.Value(0)).current;
  const [hints,       setHints]       = useState<HintMap>({});
  const [loadingHint, setLoadingHint] = useState<string | null>(null);
  const [coinSpend,   setCoinSpend]   = useState<number | null>(null);
  const [stopPopup,   setStopPopup]   = useState<{ name: string; elapsed: number } | null>(null);
  const [validationQuote, setValidationQuote] = useState<{ text: string; author: string | null } | null>(null);
  const [oppId,             setOppId]           = useState<string | null>(null);
  const [playersAvatarMap,  setPlayersAvatarMap] = useState<Record<string, string>>({});
  const playersAvatarMapRef = useRef<Record<string, string>>({});
  useEffect(() => { playersAvatarMapRef.current = playersAvatarMap; }, [playersAvatarMap]);

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
  const joinRematchRoomRef  = useRef<((id: string) => Promise<void>) | null>(null);
  const doCreateRematchRef  = useRef<() => Promise<void>>(async () => {});
  const rematchCreatingRef  = useRef(false);
  const asyncTimeLimitRef   = useRef<number>(TIMER); // tempo que P1 usou → limite de P2
  const isCountUpRef        = useRef(false);         // true somente para P2 async
  const timeLeftRef         = useRef<number>(TIMER);
  const oppNameRef          = useRef('Adversário');
  const timerSoundRef       = useRef<Audio.Sound | null>(null);
  const isActiveGameRef     = useRef(false);
  const awardCoinsRef       = useRef<(delta: number) => void>(() => {});
  const coinsAwardedRef     = useRef(false);
  const pendingResultsRef       = useRef<PendingResults | null>(null);
  // Validação do adversário recebida via broadcast (realtime)
  const oppValidationBroadcastRef = useRef<Partial<Record<string, BankResult>> | null>(null);
  // N-player: jogadores ativos na partida em curso (snapshot no momento do start)
  const activePCountRef     = useRef(2);

  useEffect(() => { answersRef.current   = answers;  }, [answers]);
  useEffect(() => { letterRef.current   = letter;   }, [letter]);
  useEffect(() => { timeLeftRef.current = timeLeft;  }, [timeLeft]);
  useEffect(() => { oppNameRef.current  = oppName;   }, [oppName]);

  // ── Animação da barra de validação ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'validating') { validatingAnim.setValue(0); return; }
    // step 0 = banco, step 1 = IA/salvar, step 2 = aguardando adversário
    const targets   = [0.45, 0.88, 0.95];
    const durations = [1200, 3500, 18000];
    Animated.timing(validatingAnim, {
      toValue:         targets[validatingStep] ?? 0.95,
      duration:        durations[validatingStep] ?? 3500,
      easing:          Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [phase, validatingStep, validatingAnim]);

  // ── Sons de resultado ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'result' || !myResult) return;
    const isAbandon   = abandoned === 'me';
    const oppLeft     = abandoned === 'opp';
    const isMulti     = multiResults.length > 2;
    const myRank      = multiResults.find(r => r.playerId === (user?.id ?? ''))?.rank ?? 1;
    const tiedAtFirst = isMulti && myRank === 1 && multiResults.filter(r => r.rank === 1).length > 1;
    const iWon = isMulti ? (myRank === 1 && !tiedAtFirst) : (isAbandon ? false : oppLeft ? true : (myResult.score > (oppResult?.score ?? 0)));
    const tied = (!isMulti && !isAbandon && !oppLeft && myResult.score === (oppResult?.score ?? 0)) || tiedAtFirst;

    const file = iWon || oppLeft
      ? require('@/assets/audio/floraphonic-marimba-win-f-2-209688.mp3')
      : tied ? null
      : require('@/assets/audio/freesound_community-negative_beeps-6008.mp3');

    if (!file) return;
    let sound: Audio.Sound | null = null;
    Audio.Sound.createAsync(file, { shouldPlay: true, volume: 0.9 })
      .then(({ sound: s }) => { sound = s; }).catch(() => {});
    return () => {
      sound?.stopAsync().catch(() => {});
      sound?.unloadAsync().catch(() => {});
    };
  }, [phase, myResult, oppResult, abandoned, multiResults, user?.id]);

  // ── Frase aleatória na tela de validação ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'validating') return;
    supabase
      .from('stop_validation_quotes')
      .select('text, author')
      .eq('active', true)
      .limit(100)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setValidationQuote(data[Math.floor(Math.random() * data.length)]);
      });
  }, [phase]);

  // ── Fetch avatares ao entrar no resultado ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'result') return;
    const myId = playerIdRef.current;
    const ids: string[] = [];
    if (oppId) ids.push(oppId);
    multiResults.forEach(r => { if (r.playerId !== myId) ids.push(r.playerId); });
    const missing = ids.filter(id => id && !playersAvatarMapRef.current[id]);
    if (missing.length === 0) return;
    supabase.from('profiles').select('id, avatar_emoji').in('id', missing)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const updates: Record<string, string> = {};
          for (const p of data) updates[p.id] = p.avatar_emoji ?? '👤';
          setPlayersAvatarMap(prev => ({ ...prev, ...updates }));
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, oppId, multiResults]);

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

  // ── Timer ─────────────────────────────────────────────────────────────────
  const stopTimerSound = useCallback(async () => {
    if (timerSoundRef.current) {
      await timerSoundRef.current.stopAsync().catch(() => {});
      await timerSoundRef.current.unloadAsync().catch(() => {});
      timerSoundRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopTimerSound();
  }, [stopTimerSound]);

  useEffect(() => {
    if (phase !== 'playing') return;
    setTimeLeft(TIMER);

    Audio.Sound.createAsync(
      require('@/assets/audio/som_relogio_stop.mp3'),
      { shouldPlay: true, volume: 0.7 },
    ).then(({ sound }) => {
      timerSoundRef.current = sound;
    }).catch(() => {});

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        // P2 async: popup quando o timer bate no mesmo valor que P1 tinha ao dar Stop
        if (isCountUpRef.current && asyncTimeLimitRef.current < TIMER && next <= (TIMER - asyncTimeLimitRef.current)) {
          stopTimer();
          setStopPopup({ name: oppNameRef.current, elapsed: asyncTimeLimitRef.current });
          return TIMER - asyncTimeLimitRef.current;
        }
        if (next <= 0) { stopTimer(); doSubmitRef.current(); return 0; }
        return next;
      });
    }, 1000);
    return stopTimer;
  }, [phase, stopTimer]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => {
    stopTimer();
    spinTimeouts.current.forEach(clearTimeout);
    channelRef.current?.unsubscribe();
    if (mmTimerRef.current) clearTimeout(mmTimerRef.current);
    if (mmIntervalRef.current) clearInterval(mmIntervalRef.current);
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
    refs.push(setTimeout(() => { setLetter(targetLetter); setTimeLeft(TIMER); setPhase('playing'); }, lastT + 1100));
    setPhase('spinning');
  }, [scaleAnim]);

  // ── Award coins (idempotent via coinsAwardedRef) ──────────────────────────
  const awardCoins = useCallback(async (delta: number) => {
    if (coinsAwardedRef.current) return;
    coinsAwardedRef.current = true;
    setCoinDelta(delta);
    if (!user?.id || delta === 0) return;
    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: delta, p_motivo: 'stop_online' });
    refreshProfile();
  }, [user, refreshProfile]);

  useEffect(() => { awardCoinsRef.current = awardCoins; }, [awardCoins]);

  // ── Check all players submitted ────────────────────────────────────────────
  // Funciona tanto para 1v1 (needed=2) quanto para N jogadores
  const checkBothSubmitted = useCallback(async (rId: string) => {
    if (phaseRef.current === 'validating' || phaseRef.current === 'result') return;
    // Não processa resultado se o jogador ainda está no matchmaking (nunca jogou)
    if (phaseRef.current === 'matchmaking') return;

    const needed = activePCountRef.current;
    const { data } = await supabase
      .from('stop_answers').select('*').eq('room_id', rId).eq('submitted', true);
    if (!data || data.length < needed) return;

    const me  = data.find(r => r.player_id === playerIdRef.current);
    const opp = data.find(r => r.player_id !== playerIdRef.current);
    if (!me) return;

    if (opp?.player_id) setOppId(opp.player_id);
    const oppPlayerName = roomPlayersRef.current.find(p => p.id !== playerIdRef.current)?.name ?? 'Adversário';
    setOppName(oppPlayerName);
    setAbandoned(null);
    pendingResultsRef.current = {
      meAnswers:      me.answers,
      oppAnswers:     opp?.answers ?? {},
      oppName:        oppPlayerName,
      allSubmissions: data,
    };
    setPhase('validating');
  }, []);

  // ── Helper: inicia a partida quando a sala fica ativa ─────────────────────
  const startMatchFromRoom = useCallback((roomLetter: string, players: PlayerInfo[]) => {
    if (mmTimerRef.current) { clearTimeout(mmTimerRef.current); mmTimerRef.current = null; }
    if (mmIntervalRef.current) { clearInterval(mmIntervalRef.current); mmIntervalRef.current = null; }
    isMatchedRef.current = true;
    // snapshot do número real de jogadores que entraram
    activePCountRef.current = Math.max(players.length, 2);
    setRoomPlayers(players);
    roomPlayersRef.current = players;
    if (isP1Ref.current) {
      setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast', event: 'cats_sync',
          payload: { cats: gameCatsRef.current.map(c => c.key) },
        });
      }, 600);
    }
    startSpin(roomLetter);
  }, [startSpin]);

  // ── Subscribe to room (realtime) ───────────────────────────────────────────
  const subscribeToRoom = useCallback((rId: string) => {
    channelRef.current?.unsubscribe();
    channelRef.current = supabase
      .channel(`stop_room_${rId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stop_rooms', filter: `id=eq.${rId}` },
        (payload) => {
          const room = payload.new as Record<string, unknown>;

          // Sala ativada (cheia OU host iniciou com quem entrou) → TODOS começam
          if (room.status === 'active' && !isMatchedRef.current) {
            const players: PlayerInfo[] = Array.isArray(room.players)
              ? (room.players as PlayerInfo[])
              : [];
            const opp = players.find(p => p.id !== playerIdRef.current);
            if (opp) { setOppName(opp.name); setOppId(opp.id); }
            startMatchFromRoom(room.letter as string, players);
          }

          // Atualiza lista de jogadores para mostrar no matchmaking (P1 que espera)
          if (room.players && !isMatchedRef.current) {
            const players: PlayerInfo[] = Array.isArray(room.players)
              ? (room.players as PlayerInfo[])
              : [];
            setRoomPlayers(players);
            roomPlayersRef.current = players;
            setStatusMsg(`${players.length}/${room.max_players ?? maxPlayersRef.current} jogadores`);
          }

          // Para 1v1: adversário abandonou → eu ganho
          if (room.status === 'abandoned'
              && room.abandoned_by !== playerIdRef.current
              && !abandonedRef.current
              && activePCountRef.current === 2) {
            stopTimer();
            const ans = answersRef.current;
            const { score, validCount } = calcScore(ans, letterRef.current, gameCatsRef.current);
            setMyResult({ answers: ans, score, validCount });
            setOppResult({ answers: {}, score: 0, validCount: 0 });
            setAbandoned('opp');
            awardCoinsRef.current(COINS.OPP_OUT + validCount * 2);
            setPhase('result');
          }

          setP1Rematch(Boolean(room.p1_rematch));
          setP2Rematch(Boolean(room.p2_rematch));
          // P1 cria sala de revanche quando ambos confirmam (resolve race condition)
          if (Boolean(room.p1_rematch) && Boolean(room.p2_rematch) && isP1Ref.current && !isMatchedRef.current) {
            doCreateRematchRef.current();
          }
          if (room.rematch_room_id && !isP1Ref.current) {
            joinRematchRoomRef.current?.(room.rematch_room_id as string);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stop_answers', filter: `room_id=eq.${rId}` },
        () => checkBothSubmitted(rId)
      )
      // Não-P1 recebe as categorias de P1 — preserva a ordem exata de P1
      .on('broadcast', { event: 'cats_sync' }, ({ payload }) => {
        const keys = (payload as { cats: string[] }).cats;
        const cats = keys.map(k => allCategoriesRef.current.find(c => c.key === k)).filter(Boolean) as StopCategory[];
        if (cats.length > 0) { setGameCategories(cats); gameCatsRef.current = cats; }
      })
      // Qualquer jogador clicou STOP → todos param
      .on('broadcast', { event: 'stop_signal' }, () => { doSubmitRef.current(); })
      // Validação do adversário chegou — armazena na ref para o run() usar
      .on('broadcast', { event: 'validation_result' }, ({ payload }) => {
        const p = payload as { playerId: string; validation: Partial<Record<string, BankResult>> };
        if (p.playerId !== playerIdRef.current) {
          oppValidationBroadcastRef.current = p.validation;
        }
      })
      // Notificação de abandono em 1v1
      .on('broadcast', { event: 'abandoned' }, () => {
        if (abandonedRef.current || activePCountRef.current > 2) return;
        stopTimer();
        const ans = answersRef.current;
        const { score, validCount } = calcScore(ans, letterRef.current, gameCatsRef.current);
        setMyResult({ answers: ans, score, validCount });
        setOppResult({ answers: {}, score: 0, validCount: 0 });
        setAbandoned('opp');
        awardCoinsRef.current(COINS.OPP_OUT + validCount * 2);
        setPhase('result');
      })
      .subscribe();
  }, [startMatchFromRoom, checkBothSubmitted, stopTimer]);

  // ── Rematch ────────────────────────────────────────────────────────────────
  const joinRematchRoom = useCallback(async (newRoomId: string) => {
    isMatchedRef.current = true;
    isCountUpRef.current = false; // revanche é sempre realtime
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

  // Criação efetiva da sala de revanche — idempotente via rematchCreatingRef
  const doCreateRematch = useCallback(async () => {
    if (rematchCreatingRef.current || !isP1Ref.current) return;
    rematchCreatingRef.current = true;
    isMatchedRef.current = true;
    const rId = roomIdRef.current;
    if (!rId) { rematchCreatingRef.current = false; return; }

    const { data: room } = await supabase
      .from('stop_rooms').select('player1_id,player2_id').eq('id', rId).single();
    if (!room) { rematchCreatingRef.current = false; return; }

    // Novas categorias e nova letra para a revanche
    const newSlotKeys = pickSixKeys(allCategoriesRef.current);
    const newCats = newSlotKeys
      .map(k => allCategoriesRef.current.find(c => c.key === k))
      .filter(Boolean) as StopCategory[];
    setSlots(newSlotKeys);
    setGameCategories(newCats);
    gameCatsRef.current = newCats;

    const newLetter = pickOnlineLetter(newCats);
    const { data: newRoom } = await supabase
      .from('stop_rooms')
      .insert({ letter: newLetter, status: 'active', mode: 'realtime',
                player1_id: room.player1_id, player1_name: playerNameRef.current,
                player2_id: room.player2_id })
      .select().single();
    if (!newRoom) { rematchCreatingRef.current = false; return; }

    await supabase.from('stop_rooms').update({ rematch_room_id: newRoom.id }).eq('id', rId);
    roomIdRef.current = newRoom.id;
    setLetter(newLetter); letterRef.current = newLetter;
    setP1Rematch(false); setP2Rematch(false);
    setAbandoned(null);
    subscribeToRoom(newRoom.id);
    // Envia novas categorias para P2 (aguarda subscription estar pronta)
    setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast', event: 'cats_sync',
        payload: { cats: newCats.map(c => c.key) },
      });
    }, 600);
    startSpin(newLetter);
  }, [startSpin, subscribeToRoom]);

  useEffect(() => { doCreateRematchRef.current = doCreateRematch; }, [doCreateRematch]);

  const requestRematch = useCallback(async () => {
    const rId = roomIdRef.current;
    if (!rId) return;
    const col = isP1Ref.current ? 'p1_rematch' : 'p2_rematch';
    await supabase.from('stop_rooms').update({ [col]: true }).eq('id', rId);
    if (isP1Ref.current) setP1Rematch(true); else setP2Rematch(true);

    if (!isP1Ref.current) return; // P2 aguarda P1 criar via subscription

    // P1: verifica imediatamente se P2 já marcou (clicou primeiro)
    const { data: room } = await supabase
      .from('stop_rooms').select('p1_rematch,p2_rematch').eq('id', rId).single();
    if (room?.p1_rematch && room?.p2_rematch) {
      doCreateRematchRef.current();
    }
    // Caso contrário, subscription dispara doCreateRematch quando P2 clicar
  }, []);

  // ── Abandon ────────────────────────────────────────────────────────────────
  const handleAbandon = useCallback(async () => {
    if (abandonedRef.current) return;
    abandonedRef.current = true;
    stopTimer();
    const rId = roomIdRef.current;
    const isMulti = activePCountRef.current > 2;

    if (rId) {
      if (isMulti) {
        // N-player: envia respostas vazias (score=0) para não travar a partida
        await supabase.from('stop_answers').upsert({
          room_id: rId, player_id: playerIdRef.current,
          answers: {}, score: 0, valid_count: 0, submitted: true,
        }, { onConflict: 'room_id,player_id' });
        awardCoinsRef.current(COINS.ABANDON);
        router.back(); // sai imediatamente sem mostrar resultado
        return;
      } else {
        channelRef.current?.send({ type: 'broadcast', event: 'abandoned', payload: {} });
        await supabase.from('stop_rooms')
          .update({ status: 'abandoned', abandoned_by: playerIdRef.current })
          .eq('id', rId);
      }
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
        // Salva o tempo que P1 utilizou para que P2 jogue no mesmo ritmo
        const elapsed = Math.max(1, TIMER - timeLeftRef.current);
        await supabase.from('stop_rooms')
          .update({ p1_elapsed_seconds: elapsed })
          .eq('id', rId);

        // Valida as respostas de P1 em background e salva no DB.
        // Quando P2 jogar (horas/dias depois), a validação já estará disponível.
        const bgLtr  = ltr;
        const bgCats = gameCatsRef.current;
        const bgAns  = ans;
        const bgRId  = rId;
        const bgId   = playerIdRef.current;
        ;(async () => {
          try {
            const bgMap = await validateWithBank(bgLtr, bgAns, bgCats);
            const finalBgMap = { ...bgMap };
            const bgUnverified = bgCats.filter(c => bgMap[c.key] === 'unverified');
            const bgPadreCat   = bgCats.find(c => c.key === 'padre' && finalBgMap['padre'] === 'valid');
            if (bgUnverified.length > 0 || bgPadreCat) {
              await Promise.all([
                ...bgUnverified.map(async (cat) => {
                  const a = (bgAns[cat.key] ?? '').trim();
                  if (!a) return;
                  const result = await validateWithAI(bgLtr, a, cat.key, cat.label);
                  if (result !== null) finalBgMap[cat.key] = result ? 'ai_valid' : 'ai_invalid';
                }),
                ...(bgPadreCat ? [(async () => {
                  const a = (bgAns['padre'] ?? '').trim();
                  if (!a) return;
                  const result = await validateWithAI(bgLtr, a, 'padre', bgPadreCat.label);
                  if (result === false) finalBgMap['padre'] = 'ai_invalid';
                })()] : []),
              ]);
            }
            await supabase.from('stop_answers')
              .update({ validation: finalBgMap })
              .eq('room_id', bgRId)
              .eq('player_id', bgId);
          } catch { /* falha silenciosa — fallback banco-only fica disponível */ }
        })();
      }
      // Verifica se o outro jogador já enviou — quem terminar por último fecha a partida
      const { data: bothAnswers } = await supabase
        .from('stop_answers').select('player_id').eq('room_id', rId).eq('submitted', true);
      if ((bothAnswers?.length ?? 0) >= 2) {
        await supabase.from('stop_rooms').update({ status: 'completed' }).eq('id', rId);
        checkBothSubmitted(rId);
      } else {
        setPhase('async_submitted');
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

  const handleShuffle = useCallback(async () => {
    if (!user || !profile || profile.coins < 5) {
      Alert.alert('Moedas insuficientes', 'Você precisa de 5 🪙 para sortear novas categorias.');
      return;
    }
    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -5 });
    setSlots(pickSixKeys(allCategoriesRef.current));
    setCoinSpend(-5);
    refreshProfile();
  }, [user, profile, refreshProfile]);

  const cycleCat = useCallback(async (slotIdx: number, dir: 1 | -1) => {
    if (!user || !profile) return;
    if (profile.coins < 1) {
      Alert.alert('Moedas insuficientes', 'Você precisa de 1 🪙 para trocar uma categoria.');
      return;
    }
    const cats         = allCategoriesRef.current;
    const currentSlots = slotsRef.current;
    const currentKey   = currentSlots[slotIdx];
    const usedKeys     = new Set(currentSlots.filter((_, i) => i !== slotIdx));
    let   nextIdx      = ((cats.findIndex(c => c.key === currentKey) + dir) + cats.length) % cats.length;
    let   attempts     = 0;
    while (usedKeys.has(cats[nextIdx].key) && attempts < cats.length) {
      nextIdx = ((nextIdx + dir) + cats.length) % cats.length;
      attempts++;
    }
    if (cats[nextIdx].key === currentKey) return; // nenhuma categoria disponível
    const newSlots = [...currentSlots];
    newSlots[slotIdx] = cats[nextIdx].key;
    setSlots(newSlots);
    setCoinSpend(-1);
    supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -1 }).then(() => refreshProfile());
  }, [user, profile, refreshProfile]);

  const handleHint = useCallback(async (cat: StopCategory) => {
    if (!user || !profile) return;
    if (profile.coins < 2) {
      Alert.alert('Moedas insuficientes', 'Você precisa de 2 🪙 para usar uma dica.');
      return;
    }
    if (loadingHint) return;
    setLoadingHint(cat.key);

    let word: string | null = hints[cat.key] ?? null;
    if (!word) {
      word = await getAIHint(letterRef.current, cat.key, cat.label);
      if (word) setHints(prev => ({ ...prev, [cat.key]: word! }));
    }

    if (phaseRef.current !== 'playing') { setLoadingHint(null); return; }

    if (!word) {
      Alert.alert('Dica indisponível', 'Não encontramos sugestão para essa categoria com essa letra.');
      setLoadingHint(null);
      return;
    }

    setAnswer(cat.key, word.slice(0, 3));
    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -2 });
    refreshProfile();
    setLoadingHint(null);
  }, [user, profile, hints, loadingHint, setAnswer, refreshProfile]);

  // ── Fetch room lists ───────────────────────────────────────────────────────
  const fetchRealtimeRooms = useCallback(async (silent = false) => {
    if (!playerIdRef.current) { setRealtimeRooms([]); return; }
    if (!silent) setLoadingRooms(true);
    const { data } = await supabase
      .from('stop_rooms')
      .select('id, letter, player1_id, player1_name, created_at, max_players, players')
      .eq('status', 'waiting').eq('mode', 'realtime').eq('visibility', 'public')
      .neq('player1_id', playerIdRef.current)
      .order('created_at', { ascending: true }).limit(10);
    const rooms = ((data ?? []) as any[]).map(r => ({
      ...r,
      player_count: Array.isArray(r.players) ? r.players.length : 1,
      max_players:  r.max_players ?? 2,
    })) as RealtimeRoom[];
    setRealtimeRooms(rooms);
    if (!silent) setLoadingRooms(false);
  }, []);

  const fetchAsyncGames = useCallback(async (silent = false) => {
    if (!playerIdRef.current) { setAsyncGames([]); return; }
    if (!silent) setLoadingAsync(true);
    const pid = playerIdRef.current;

    const { data } = await supabase
      .from('stop_rooms')
      .select('id, letter, player1_id, player2_id, player1_name, player2_name, deadline, status, p1_elapsed_seconds, p1_dismissed_at, p2_dismissed_at, category_keys')
      .eq('mode', 'async')
      .in('status', ['async_wait_p2', 'async_p2', 'completed'])
      .or(`player1_id.eq.${pid},player2_id.eq.${pid}`)
      .order('created_at', { ascending: false })
      .limit(20);

    const games = (data as AsyncGame[]) ?? [];

    // Auto-dismiss: partidas concluídas com prazo há mais de 7 dias
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const toAutoDismiss = games.filter(g => {
      if (g.status !== 'completed') return false;
      if (!g.deadline || g.deadline > sevenDaysAgo) return false;
      const isP1 = g.player1_id === pid;
      return isP1 ? !g.p1_dismissed_at : !g.p2_dismissed_at;
    });
    for (const g of toAutoDismiss) {
      const field = g.player1_id === pid ? 'p1_dismissed_at' : 'p2_dismissed_at';
      supabase.from('stop_rooms').update({ [field]: new Date().toISOString() }).eq('id', g.id).then(() => {});
    }
    const autoDismissedIds = new Set(toAutoDismiss.map(g => g.id));

    // Filtra: exclui partidas que o jogador atual já dispensou
    const filtered = games.filter(g => {
      if (autoDismissedIds.has(g.id)) return false;
      const isP1 = g.player1_id === pid;
      return isP1 ? !g.p1_dismissed_at : !g.p2_dismissed_at;
    });
    setAsyncGames(filtered);
    if (!silent) setLoadingAsync(false);

    const playerIds = [...new Set(filtered.flatMap(g =>
      [g.player1_id, g.player2_id].filter(Boolean) as string[]
    ))];
    if (playerIds.length > 0) {
      supabase.from('profiles').select('id, avatar_emoji').in('id', playerIds)
        .then(({ data: pData }) => {
          if (pData && pData.length > 0) {
            const updates: Record<string, string> = {};
            for (const p of pData) updates[p.id] = p.avatar_emoji ?? '👤';
            setPlayersAvatarMap(prev => ({ ...prev, ...updates }));
          }
        });
    }
  }, []);

  const dismissAsyncGame = useCallback(async (game: AsyncGame) => {
    const pid = playerIdRef.current;
    if (!pid) return;
    const field = game.player1_id === pid ? 'p1_dismissed_at' : 'p2_dismissed_at';
    const now = new Date().toISOString();
    setDismissedIds(prev => new Set([...prev, game.id]));
    await supabase.from('stop_rooms').update({ [field]: now }).eq('id', game.id);
    // Hard delete quando os dois dispensaram
    const otherField = field === 'p1_dismissed_at' ? 'p2_dismissed_at' : 'p1_dismissed_at';
    const otherDismissed = field === 'p1_dismissed_at' ? game.p2_dismissed_at : game.p1_dismissed_at;
    if (otherDismissed) {
      supabase.from('stop_rooms').delete().eq('id', game.id).then(() => {});
    }
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

  // Load word hints from bank when playing starts
  useEffect(() => {
    if (phase !== 'playing') return;
    setHints({});
    loadBankHints(letterRef.current, gameCatsRef.current).then(setHints);
  }, [phase]);

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

    // Limpa broadcast anterior antes de entrar na fase de validação
    oppValidationBroadcastRef.current = null;

    const run = async () => {
      const validationStartMs = Date.now();
      const MIN_VALIDATION_MS = 7000;
      const goToResult = () => {
        const elapsed   = Date.now() - validationStartMs;
        const remaining = Math.max(0, MIN_VALIDATION_MS - elapsed);
        setTimeout(() => setPhase('result'), remaining);
      };

      setAiLoading(false);
      setWaitingOpp(false);
      setValidatingStep(0);
      console.log('[StopOnline] Iniciando validação. letra:', ltr, 'categorias:', cats.map(c => c.key));

      // ── Step 1: Validate MY answers (bank + AI) ──────────────────────────
      const myMap = await validateWithBank(ltr, pending.meAnswers, cats);
      setMyBankMap(myMap);
      setValidatingStep(1);
      console.log('[StopOnline] Banco (minhas):', myMap);

      const finalMyMap = { ...myMap };
      const myUnverified = cats.filter(c => myMap[c.key] === 'unverified');
      // 'padre' já foi marcado como 'valid' no banco; verificamos apenas palavrão via IA
      const padreCat = cats.find(c => c.key === 'padre' && finalMyMap['padre'] === 'valid');
      console.log('[StopOnline] Não verificados (minhas):', myUnverified.map(c => `${c.key}="${pending.meAnswers[c.key]}"`));

      if (myUnverified.length > 0 || padreCat) {
        setAiLoading(true);
        await Promise.all([
          ...myUnverified.map(async (cat) => {
            const ans = (pending.meAnswers[cat.key] ?? '').trim();
            if (!ans) return;
            const result = await validateWithAI(ltr, ans, cat.key, cat.label);
            console.log(`[StopOnline] IA (minha) "${ans}": ${result === null ? 'null' : result ? 'VÁLIDA' : 'INVÁLIDA'}`);
            if (result !== null) finalMyMap[cat.key] = result ? 'ai_valid' : 'ai_invalid';
          }),
          ...(padreCat ? [(async () => {
            const ans = (pending.meAnswers['padre'] ?? '').trim();
            if (!ans) return;
            const result = await validateWithAI(ltr, ans, 'padre', padreCat.label);
            console.log(`[StopOnline] IA padre "${ans}": ${result === null ? 'null' : result ? 'não ofensiva' : 'OFENSIVA'}`);
            if (result === false) finalMyMap['padre'] = 'ai_invalid';
          })()] : []),
        ]);
        setMyBankMap(finalMyMap);
        setAiLoading(false);
      }

      // ── Step 2: Save MY validation to DB + broadcast para adversário ────────
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
      // Broadcast para que o adversário (realtime) receba sem precisar ler o DB
      if (gameModeRef.current === 'realtime' && rId && myId) {
        channelRef.current?.send({
          type: 'broadcast', event: 'validation_result',
          payload: { playerId: myId, validation: finalMyMap },
        });
      }

      // ── Step 3: Aguarda validação do adversário (broadcast ou DB) ───────────
      let finalOppMap: Partial<Record<string, BankResult>> = {};
      const hasOpp = Object.keys(pending.oppAnswers).length > 0;

      if (hasOpp) {
        setValidatingStep(2);
        // Aguarda até 15 s: broadcast chega primeiro (realtime), depois tenta DB
        const TIMEOUT_MS = 15000;
        const POLL_MS    = 400;
        const t0 = Date.now();
        while (Date.now() - t0 < TIMEOUT_MS) {
          if (oppValidationBroadcastRef.current) {
            finalOppMap = oppValidationBroadcastRef.current;
            oppValidationBroadcastRef.current = null;
            console.log('[StopOnline] Validation do adv recebida via broadcast');
            break;
          }
          if (rId && myId) {
            const { data } = await supabase
              .from('stop_answers').select('validation')
              .eq('room_id', rId).neq('player_id', myId).limit(1);
            const stored = data?.[0]?.validation;
            if (stored && Object.keys(stored).length > 0) {
              finalOppMap = stored as Partial<Record<string, BankResult>>;
              console.log('[StopOnline] Validation do adv lida do DB');
              break;
            }
          }
          await new Promise<void>(r => setTimeout(r, POLL_MS));
        }
        if (Object.keys(finalOppMap).length === 0) {
          console.warn('[StopOnline] Validation do adv não encontrada após timeout — usando banco apenas');
          finalOppMap = await validateWithBank(ltr, pending.oppAnswers, cats);
        }
      }

      setOppBankMap(finalOppMap);

      // ── Step 4: Score e resultado ────────────────────────────────────────
      const myVC = cats.filter(c => finalMyMap[c.key] === 'valid' || finalMyMap[c.key] === 'ai_valid').length;
      const myS  = myVC * 10 + (cats.length > 0 && myVC === cats.length ? 20 : 0);

      const isMulti = activePCountRef.current > 2 && !!pending.allSubmissions;

      if (isMulti && pending.allSubmissions) {
        // ── N jogadores: monta leaderboard ────────────────────────────────
        const allSubs = pending.allSubmissions;
        const playerMap = Object.fromEntries(
          roomPlayersRef.current.map(p => [p.id, p.name])
        );
        // Ordenar por pontuação e atribuir ranks com empate (standard competition ranking)
        const sortedSubs = [...allSubs].sort((a, b) => b.score - a.score);
        let currentRank = 1;
        const ranked: MultiResult[] = sortedSubs.map((sub, i) => {
          if (i > 0 && sub.score < sortedSubs[i - 1].score) currentRank = i + 1;
          return {
            playerId:   sub.player_id,
            playerName: playerMap[sub.player_id] ?? 'Jogador',
            answers:    sub.answers,
            score:      sub.score,
            validCount: sub.valid_count,
            bankMap:    sub.player_id === myId ? finalMyMap : {},
            rank:       currentRank,
          };
        });

        setMultiResults(ranked);
        const mine = ranked.find(r => r.playerId === myId);
        setMyResult({ answers: pending.meAnswers, score: mine?.score ?? myS, validCount: mine?.validCount ?? myVC });

        if (!pending.skipCoins) {
          const myRank     = mine?.rank ?? ranked.length;
          const topScore   = ranked[0]?.score ?? 0;
          const lastScore  = ranked[ranked.length - 1]?.score ?? 0;
          const tiedAtTop  = ranked.filter(r => r.score === topScore).length;
          const allTied    = tiedAtTop === ranked.length;
          let delta = 0;
          if (myRank === 1 && tiedAtTop === 1)          delta = COINS.WIN_RT;   // vencedor único
          else if (myRank === 1 && tiedAtTop > 1)       delta = COINS.DRAW_RT;  // empate no topo
          else if (mine?.score === lastScore && !allTied) delta = COINS.LOSE_RT; // último isolado
          awardCoinsRef.current(delta + myVC * 2);
          if (myS > 0 && myId) recordScoreEvent(myId, myS, 'stop_online').catch(() => {});
        }

      } else {
        // ── 1v1 / async: lógica original ──────────────────────────────────
        const oppVC = cats.filter(c => finalOppMap[c.key] === 'valid' || finalOppMap[c.key] === 'ai_valid').length;
        const oppS  = oppVC * 10 + (cats.length > 0 && oppVC === cats.length ? 20 : 0);
        console.log(`[StopOnline] Pontuação — eu: ${myS} (${myVC}) | adv: ${oppS} (${oppVC})`);

        setMyResult({ answers: pending.meAnswers,  score: myS,  validCount: myVC });
        setOppResult({ answers: pending.oppAnswers, score: oppS, validCount: oppVC });

        if (!pending.skipCoins) {
          const isAS  = gameModeRef.current === 'async';
          const delta = myS > oppS
            ? (isAS ? COINS.WIN_AS  : COINS.WIN_RT)
            : myS === oppS
              ? (isAS ? COINS.DRAW_AS : COINS.DRAW_RT)
              : (isAS ? COINS.LOSE_AS : COINS.LOSE_RT);
          awardCoinsRef.current(delta + myVC * 2);
          if (myS > 0 && myId) recordScoreEvent(myId, myS, 'stop_online').catch(() => {});
        }
      }

      goToResult();
    };

    run().catch((err) => {
      console.error('[StopOnline] Erro inesperado na validação:', err);
      goToResult();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Create realtime room ──────────────────────────────────────────────────
  const createRealtimeRoom = useCallback(async (visibility: 'public' | 'private', nPlayers = 2) => {
    if (!playerIdRef.current) return;
    const cats = slotsRef.current.map(k => allCategoriesRef.current.find(c => c.key === k)).filter(Boolean) as StopCategory[];
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('realtime'); gameModeRef.current = 'realtime';
    setPhase('matchmaking');
    setPrivateRoomCode(null);
    isMatchedRef.current      = false;
    asyncTimeLimitRef.current = TIMER;
    isCountUpRef.current      = false;

    const mp       = nPlayers;
    const isMulti  = mp > 2 && visibility === 'public';
    const p1Info   = [{ id: playerIdRef.current, name: playerNameRef.current }];
    const newLetter = pickOnlineLetter(cats);
    const roomCode  = visibility === 'private' ? genRoomCode() : null;

    setMaxPlayers(mp); maxPlayersRef.current = mp;
    activePCountRef.current = mp;
    const initialPlayers: PlayerInfo[] = [{ id: playerIdRef.current, name: playerNameRef.current }];
    setRoomPlayers(initialPlayers); roomPlayersRef.current = initialPlayers;

    if (isMulti) {
      setStatusMsg(`1/${mp} jogadores`);
      setMmTimeLeft(ROOM_TIMEOUT_S);
    } else {
      setStatusMsg(visibility === 'private' ? 'Sala privada criada!' : 'Aguardando adversário...');
    }

    const { data: newRoom, error } = await supabase
      .from('stop_rooms')
      .insert({
        letter: newLetter, player1_id: playerIdRef.current,
        player1_name: playerNameRef.current, mode: 'realtime',
        visibility, room_code: roomCode,
        max_players: mp,
        players: p1Info,
      })
      .select().single();

    if (error || !newRoom) { setPhase('error'); setStatusMsg('Erro ao criar sala.'); return; }

    roomIdRef.current = newRoom.id; isP1Ref.current = true; setIsPlayer1(true); isCountUpRef.current = false;
    setLetter(newLetter); letterRef.current = newLetter;
    if (roomCode) setPrivateRoomCode(roomCode);
    subscribeToRoom(newRoom.id);

    if (isMulti) {
      // Countdown: inicia a partida após ROOM_TIMEOUT_S ou quando sala encher
      mmIntervalRef.current = setInterval(() => {
        setMmTimeLeft(t => Math.max(0, t - 1));
      }, 1000);

      mmTimerRef.current = setTimeout(async () => {
        if (mmIntervalRef.current) { clearInterval(mmIntervalRef.current); mmIntervalRef.current = null; }
        if (isMatchedRef.current) return;
        const currentPlayers = roomPlayersRef.current;
        if (currentPlayers.length >= 2) {
          // Inicia com quem entrou
          activePCountRef.current = currentPlayers.length;
          await supabase.from('stop_rooms')
            .update({ status: 'active', max_players: currentPlayers.length })
            .eq('id', newRoom.id).eq('status', 'waiting');
          // A subscription vai disparar startMatchFromRoom para todos
        } else {
          await supabase.from('stop_rooms').delete().eq('id', newRoom.id);
          setPhase('error');
          setStatusMsg('Nenhum jogador entrou.\nA sala foi cancelada.');
        }
      }, ROOM_TIMEOUT_S * 1000);
    } else {
      // 1v1: timeout de 5 minutos
      mmTimerRef.current = setTimeout(async () => {
        if (!isMatchedRef.current) {
          await supabase.from('stop_rooms').delete()
            .eq('id', newRoom.id).eq('status', 'waiting');
          setPhase('error');
          setStatusMsg('Nenhum adversário entrou.\nTente novamente.');
        }
      }, 5 * 60_000);
    }
  }, [subscribeToRoom]);

  const handleCriarSalaPublica  = useCallback(() => createRealtimeRoom('public', maxPlayers),  [createRealtimeRoom, maxPlayers]);
  const handleCriarSalaPrivada  = useCallback(() => createRealtimeRoom('private', 2),           [createRealtimeRoom]);

  // ── Join a realtime room from list ─────────────────────────────────────────
  const joinRealtimeRoom = useCallback(async (room: RealtimeRoom) => {
    if (!playerIdRef.current) return;
    const cats = slotsRef.current.map(k => allCategoriesRef.current.find(c => c.key === k)).filter(Boolean) as StopCategory[];
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('realtime'); gameModeRef.current = 'realtime';
    isMatchedRef.current = false;
    setPhase('matchmaking'); setStatusMsg('Entrando na sala...');

    const { data: joinResult } = await supabase.rpc('join_stop_room', {
      p_room_id:     room.id,
      p_player_id:   playerIdRef.current,
      p_player_name: playerNameRef.current,
    });

    if (!joinResult?.ok) {
      setPhase('selecting'); fetchRealtimeRooms();
      return;
    }

    isP1Ref.current = false; setIsPlayer1(false);
    roomIdRef.current = room.id;
    setLetter(room.letter); letterRef.current = room.letter;
    setMaxPlayers(room.max_players); maxPlayersRef.current = room.max_players;
    activePCountRef.current = room.max_players;

    setOppName(room.player1_name ?? 'Adversário');
    if (room.player1_id) setOppId(room.player1_id);
    subscribeToRoom(room.id);

    if (joinResult.is_full) {
      // Sala cheia → P2 inicia diretamente (não pode confiar na subscription,
      // pois o evento 'active' pode ter disparado antes de P2 estar inscrito)
      startMatchFromRoom(room.letter, [
        { id: room.player1_id ?? '', name: room.player1_name ?? 'Adversário' },
        { id: playerIdRef.current, name: playerNameRef.current },
      ]);
    } else {
      // Ainda há vagas: aguarda mais jogadores ou timeout de P1
      setStatusMsg(`${joinResult.player_count}/${joinResult.max_players} jogadores`);
    }
  }, [subscribeToRoom, fetchRealtimeRooms, startMatchFromRoom]);

  // ── Join private room by code ─────────────────────────────────────────────
  const joinByCode = useCallback(async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
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
    await joinRealtimeRoom({ ...rooms[0], max_players: 2, player_count: 1 } as RealtimeRoom);
  }, [joinCodeInput, joinRealtimeRoom]);

  // ── Async flow (VAMOS JOGAR!) ──────────────────────────────────────────────
  // P2 só entra em partidas que P1 já terminou (p1_elapsed_seconds definido)
  const handleVamosJogar = useCallback(async () => {
    if (!playerIdRef.current) return;
    const cats = slotsRef.current.map(k => allCategoriesRef.current.find(c => c.key === k)).filter(Boolean) as StopCategory[];
    setGameCategories(cats); gameCatsRef.current = cats;
    setGameMode('async'); gameModeRef.current = 'async';
    setPhase('matchmaking'); setStatusMsg('Procurando partida...');
    isMatchedRef.current = false;

    // Busca a partida mais antiga onde P1 já terminou (p1_elapsed_seconds preenchido)
    const { data: available } = await supabase
      .from('stop_rooms').select('*')
      .eq('mode', 'async').eq('status', 'async_wait_p2')
      .is('player2_id', null)
      .neq('player1_id', playerIdRef.current)
      .gt('deadline', new Date().toISOString())
      .not('p1_elapsed_seconds', 'is', null)
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
        isCountUpRef.current = true;
        roomIdRef.current = room.id;
        setLetter(room.letter); letterRef.current = room.letter;
        setOppName(room.player1_name ?? 'Adversário');
        setOppId(room.player1_id);
        setStatusMsg('Partida encontrada! 🎯');
        const p1Keys: string[] = room.category_keys ?? [];
        if (p1Keys.length > 0) {
          const p1Cats = p1Keys.map(k => allCategoriesRef.current.find(c => c.key === k)).filter(Boolean) as StopCategory[];
          if (p1Cats.length > 0) { setGameCategories(p1Cats); gameCatsRef.current = p1Cats; }
        }
        asyncTimeLimitRef.current = (room.p1_elapsed_seconds > 0) ? room.p1_elapsed_seconds : TIMER;
        startSpin(room.letter);
        return;
      }
      // Outro jogador pegou antes — cria a própria sala
    }

    // P1: cria a sala e joga. Fica visível para P2 somente após P1 terminar.
    const newLetter = pickOnlineLetter(cats);
    const deadline  = new Date(Date.now() + ASYNC_DEADLINE_MS).toISOString();
    const { data: newRoom, error } = await supabase
      .from('stop_rooms')
      .insert({ letter: newLetter, player1_id: playerIdRef.current,
                player1_name: playerNameRef.current, mode: 'async',
                status: 'async_wait_p2', deadline,
                category_keys: cats.map(c => c.key) })
      .select().single();

    if (error || !newRoom) { setPhase('error'); setStatusMsg('Erro ao criar partida.'); return; }

    roomIdRef.current = newRoom.id; isP1Ref.current = true; setIsPlayer1(true); isCountUpRef.current = false;
    setLetter(newLetter); letterRef.current = newLetter;
    startSpin(newLetter);
  }, [startSpin]);

  // ── Join a specific async game from list (as P2) ───────────────────────────
  const joinAsyncGame = useCallback(async (game: AsyncGame) => {
    if (!playerIdRef.current) return;
    if (game.deadline && new Date(game.deadline) < new Date()) {
      Alert.alert('Prazo expirado', 'Esta partida já expirou.');
      fetchAsyncGames(true); return;
    }
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
    isCountUpRef.current = true;
    roomIdRef.current = game.id;
    setLetter(game.letter); letterRef.current = game.letter;
    setOppName(game.player1_name ?? 'Adversário');
    setOppId(game.player1_id);
    // P1 sempre terminou antes de P2 entrar — busca categorias e tempo exato
    try {
      const { data: rd } = await supabase
        .from('stop_rooms').select('category_keys, p1_elapsed_seconds').eq('id', game.id).single();
      const p1Keys: string[] = (rd as { category_keys?: string[] | null } | null)?.category_keys ?? [];
      if (p1Keys.length > 0) {
        const p1Cats = p1Keys.map(k => allCategoriesRef.current.find(c => c.key === k)).filter(Boolean) as StopCategory[];
        if (p1Cats.length > 0) { setGameCategories(p1Cats); gameCatsRef.current = p1Cats; }
      }
      const p1Elapsed = (rd as { p1_elapsed_seconds?: number | null } | null)?.p1_elapsed_seconds;
      asyncTimeLimitRef.current = (p1Elapsed != null && p1Elapsed > 0) ? p1Elapsed : TIMER;
    } catch {
      asyncTimeLimitRef.current = TIMER;
    }
    startSpin(game.letter);
  }, [startSpin, fetchAsyncGames]);

  // ── View result of a completed async game ─────────────────────────────────
  const viewAsyncResult = useCallback(async (game: AsyncGame) => {
    const isExpired = game.deadline ? new Date(game.deadline) < new Date() : false;
    const pid = playerIdRef.current;

    const { data } = await supabase
      .from('stop_answers').select('*').eq('room_id', game.id).eq('submitted', true);

    const me  = data?.find(r => r.player_id === pid);
    const opp = data?.find(r => r.player_id !== pid);

    if (!me) { Alert.alert('Aguarde', 'Você ainda não enviou suas respostas.'); return; }

    // Reconstrói categorias na ordem original de P1 (via category_keys) ou fallback por chaves de resposta
    const catKeyOrder: string[] = game.category_keys && game.category_keys.length > 0
      ? game.category_keys
      : Object.keys(me.answers ?? {});
    const cats = catKeyOrder
      .map(k => allCategoriesRef.current.find(c => c.key === k))
      .filter(Boolean) as StopCategory[];

    roomIdRef.current = game.id;
    setLetter(game.letter); letterRef.current = game.letter;
    if (cats.length > 0) { setGameCategories(cats); gameCatsRef.current = cats; }
    setGameMode('async'); gameModeRef.current = 'async';

    setP1Rematch(false); setP2Rematch(false);

    if (opp) {
      const opponentName = (game.player1_id === pid ? game.player2_name : game.player1_name) ?? 'Adversário';
      const opponentId   = game.player1_id === pid ? game.player2_id : game.player1_id;
      setOppName(opponentName);
      if (opponentId) setOppId(opponentId);

      // Se ambos já têm validação salva no banco, vai direto ao resultado (sem re-validar com IA)
      const myVal  = me.validation  as Partial<Record<string, BankResult>> | null;
      const oppVal = opp.validation as Partial<Record<string, BankResult>> | null;
      if (myVal && Object.keys(myVal).length > 0 && oppVal && Object.keys(oppVal).length > 0) {
        setMyBankMap(myVal);
        setOppBankMap(oppVal);
        setAbandoned(null);
        const theCats = cats.length > 0 ? cats : gameCatsRef.current;
        const myVC  = theCats.filter(c => myVal[c.key]  === 'valid' || myVal[c.key]  === 'ai_valid').length;
        const myS   = myVC  * 10 + (theCats.length > 0 && myVC  === theCats.length ? 20 : 0);
        const oppVC = theCats.filter(c => oppVal[c.key] === 'valid' || oppVal[c.key] === 'ai_valid').length;
        const oppS  = oppVC * 10 + (theCats.length > 0 && oppVC === theCats.length ? 20 : 0);
        setMyResult({ answers: me.answers, score: myS, validCount: myVC });
        setOppResult({ answers: opp.answers, score: oppS, validCount: oppVC });
        const delta = myS > oppS ? COINS.WIN_AS : myS === oppS ? COINS.DRAW_AS : COINS.LOSE_AS;
        awardCoinsRef.current(delta + myVC * 2);
        if (myS > 0 && pid) recordScoreEvent(pid, myS, 'stop_online').catch(() => {});
        setPhase('result');
        return;
      }

      // Primeira vez visualizando — valida com IA e salva resultado no banco
      setAbandoned(null);
      pendingResultsRef.current = { meAnswers: me.answers, oppAnswers: opp.answers, oppName: opponentName };
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

  const timerPct   = (timeLeft / TIMER) * 100; // P1/realtime: countdown de TIMER
  const timerColor = timeLeft > 30 ? C.green : timeLeft > 15 ? C.gold : C.red;

  // Login gate
  if (!user) return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="MODO ONLINE" />
        <View style={s.centerFlex}>
          <ThemedText style={{ fontSize: 64, lineHeight: 78 }}>🔐</ThemedText>
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
    const canCycle = !!profile && profile.coins >= 1;
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader
            title="Stop Online"
            subtitle="CATEGORIAS"
            right={
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={{ fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: C.gold }}>MOEDAS</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image source={require('@/assets/images/moedas.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                  <ThemedText style={{ fontSize: 18, fontWeight: '900', color: C.gold, lineHeight: 22 }}>
                    {profile?.coins ?? 0}
                  </ThemedText>
                </View>
              </View>
            }
          />
          <CoinsAnimation
            amount={coinSpend ?? -1}
            visible={coinSpend !== null}
            onDone={() => setCoinSpend(null)}
          />
          <ScrollView contentContainerStyle={[s.selectScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
            showsVerticalScrollIndicator={false}>

            {/* Slot header */}
            <View style={s.selectHeader}>
              <ThemedText style={[s.selectTitle, { color: theme.text }]}>Categorias</ThemedText>
              <TouchableOpacity
                style={[s.shuffleBtn, (!profile || profile.coins < 5) && { opacity: 0.35 }]}
                onPress={handleShuffle}
                disabled={!profile || profile.coins < 5}
                activeOpacity={0.8}>
                <ThemedText style={s.shuffleBtnText}>🔀 Novas  −5 🪙</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12 }]}>
              Use ‹ › para trocar cada categoria  (−1 🪙)
            </ThemedText>

            {/* Slots */}
            <View style={s.slotsContainer}>
              {slots.map((key, idx) => {
                const cat   = allCategories.find(c => c.key === key) ?? ALL_STOP_CATEGORIES.find(c => c.key === key);
                const color = SLOT_COLORS[idx];
                if (!cat) return null;
                return (
                  <View key={idx}
                    style={[s.slotCard, { backgroundColor: theme.backgroundElement, borderColor: color + '44' }]}>
                    <View style={[s.slotAccent, { backgroundColor: color }]} />
                    <TouchableOpacity
                      style={[s.arrowBtn, { backgroundColor: color + '18', borderColor: color + '55' }]}
                      onPress={() => cycleCat(idx, -1)}
                      disabled={!canCycle}
                      activeOpacity={0.7}>
                      <ThemedText style={[s.arrowText, { color, opacity: canCycle ? 1 : 0.35 }]}>‹</ThemedText>
                    </TouchableOpacity>
                    <View style={s.slotCenter}>
                      <ThemedText style={[s.slotLabel, { color: theme.text }]} numberOfLines={2} adjustsFontSizeToFit>
                        {cat.label}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={[s.arrowBtn, { backgroundColor: color + '18', borderColor: color + '55' }]}
                      onPress={() => cycleCat(idx, 1)}
                      disabled={!canCycle}
                      activeOpacity={0.7}>
                      <ThemedText style={[s.arrowText, { color, opacity: canCycle ? 1 : 0.35 }]}>›</ThemedText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* ── Modo escolha ── */}
            {/* Picker de jogadores para sala pública */}
            <View style={s.playerPickerWrap}>
              <ThemedText style={s.playerPickerLabel}>SALA PÚBLICA — Nº DE JOGADORES</ThemedText>
              <View style={s.playerPickerRow}>
                {[2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[s.playerPickerBtn, maxPlayers === n && { backgroundColor: C.purple, borderColor: C.purple }]}
                    onPress={() => setMaxPlayers(n)}
                    activeOpacity={0.8}>
                    <ThemedText style={[s.playerPickerTxt, maxPlayers === n && { color: '#fff' }]}>
                      {n === 2 ? '1v1' : `${n}👤`}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.modeRow}>
              <TouchableOpacity style={[s.modeBtn, { backgroundColor: C.purple }]}
                onPress={handleCriarSalaPublica} activeOpacity={0.85}>
                <ThemedText style={{ fontSize: 20 }}>🏠</ThemedText>
                <ThemedText style={s.modeBtnTitle}>SALA PÚBLICA</ThemedText>
                <ThemedText style={s.modeBtnSub}>
                  {maxPlayers === 2 ? 'Qualquer um entra · 1v1' : `Até ${maxPlayers} jogadores`}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modeBtn, { backgroundColor: '#5B6EBF' }]}
                onPress={handleCriarSalaPrivada} activeOpacity={0.85}>
                <ThemedText style={{ fontSize: 20 }}>🔒</ThemedText>
                <ThemedText style={s.modeBtnTitle}>SALA PRIVADA</ThemedText>
                <ThemedText style={s.modeBtnSub}>Somente com código · 1v1</ThemedText>
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
                      {room.max_players === 2
                        ? 'Aguardando adversário'
                        : `${room.player_count}/${room.max_players} jogadores`}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity style={s.enterBtn}
                  onPress={() => joinRealtimeRoom(room)} activeOpacity={0.8}>
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
            {asyncGames.filter(g => !dismissedIds.has(g.id)).length === 0 ? (
              <ThemedView type="backgroundElement" style={s.emptyCard}>
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12 }]}>
                  Clique em "Vamos Jogar!" para entrar em uma partida.
                </ThemedText>
              </ThemedView>
            ) : asyncGames.filter(g => !dismissedIds.has(g.id)).map(game => {
              const pid    = playerIdRef.current;
              const amP1   = game.player1_id === pid;
              const amP2   = game.player2_id === pid;
              const isOpen = !amP1 && !amP2 && game.status === 'async_wait_p2' && (game.p1_elapsed_seconds ?? 0) > 0;
              const isDone = game.status === 'completed';
              const expired = game.deadline ? new Date(game.deadline) < new Date() : false;
              const opp    = amP1 ? (game.player2_name || '?') : (game.player1_name || '?');
              const dl     = fmtDeadline(game.deadline);

              let icon = '⏳', label = '', sub = dl, canAct = false;
              if (isDone) {
                icon = '🏁'; label = opp; sub = 'Concluído';
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
                icon = '✅'; label = opp; sub = 'Sua resposta enviada';
                canAct = isDone;
              }

              return (
                <Swipeable
                  key={game.id}
                  overshootRight={false}
                  containerStyle={{ alignSelf: 'stretch' }}
                  renderRightActions={() => (
                    <TouchableOpacity
                      style={s.deleteAction}
                      onPress={() => dismissAsyncGame(game)}
                      activeOpacity={0.8}
                    >
                      <ThemedText style={{ fontSize: 20 }}>🗑️</ThemedText>
                      <ThemedText style={s.deleteActionTxt}>Excluir</ThemedText>
                    </TouchableOpacity>
                  )}
                >
                  <ThemedView type="backgroundElement" style={s.asyncCard}>
                    <View style={s.asyncCardLeft}>
                      {(() => {
                        const oppPid = amP1 ? game.player2_id : game.player1_id;
                        const av = oppPid ? playersAvatarMap[oppPid] : null;
                        return av
                          ? <AvatarImage value={av} size={32} />
                          : <ThemedText style={{ fontSize: 22 }}>{icon}</ThemedText>;
                      })()}
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>{label}</ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>{sub}</ThemedText>
                      </View>
                    </View>
                    {isOpen && !expired ? (
                      <TouchableOpacity style={[s.enterBtn, s.asyncBtn]} onPress={() => joinAsyncGame(game)} activeOpacity={0.8}>
                        <ThemedText style={s.enterBtnTxt}>JOGAR</ThemedText>
                      </TouchableOpacity>
                    ) : canAct ? (
                      <TouchableOpacity style={[s.enterBtn, s.asyncBtn, { backgroundColor: C.purple }]}
                        onPress={() => viewAsyncResult(game)} activeOpacity={0.8}>
                        <ThemedText style={s.enterBtnTxt}>RESULTADO</ThemedText>
                      </TouchableOpacity>
                    ) : null}
                    <View style={s.asyncSwipeHint} pointerEvents="none" />
                  </ThemedView>
                </Swipeable>
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
    const isRealtime  = gameMode === 'realtime';
    const isPrivate   = Boolean(privateRoomCode);
    const isMultiRoom = isRealtime && !isPrivate && maxPlayers > 2;
    const mmPct       = (mmTimeLeft / ROOM_TIMEOUT_S) * 100;
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader
            title="Stop Online"
            subtitle={isRealtime ? (isPrivate ? 'SALA PRIVADA' : 'SALA PÚBLICA') : 'PARTIDA ASSÍNCRONA'}
          />
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 64, lineHeight: 78 }}>
              {phase === 'error' ? '📡' : isPrivate ? '🔒' : isRealtime ? '🏠' : '⏱️'}
            </ThemedText>
            <ThemedText type="subtitle" style={s.center}>{statusMsg}</ThemedText>

            {/* Barra de countdown para salas multi-player */}
            {isMultiRoom && phase !== 'error' && (
              <View style={{ alignSelf: 'stretch', gap: Spacing.two }}>
                <View style={[s.timerBar, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[s.timerFill, { width: `${mmPct}%`, backgroundColor: C.purple }]} />
                </View>
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12 }]}>
                  Inicia em {mmTimeLeft}s ou quando a sala encher
                </ThemedText>
                {/* Avatares dos jogadores que entraram */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {Array.from({ length: maxPlayers }).map((_, i) => {
                    const p = roomPlayers[i];
                    return (
                      <View key={i} style={[s.playerSlot, { borderColor: p ? C.purple : C.border }]}>
                        <ThemedText style={{ fontSize: 18 }}>{p ? '👤' : '○'}</ThemedText>
                        <ThemedText themeColor={p ? 'text' : 'textSecondary'} style={{ fontSize: 9, textAlign: 'center' }} numberOfLines={1}>
                          {p ? p.name : '...'}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Código da sala privada */}
            {isPrivate && privateRoomCode && phase !== 'error' && (
              <View style={s.codeBlock}>
                <ThemedText style={s.codeLabel}>CÓDIGO DA SALA</ThemedText>
                <ThemedText style={s.codeText} numberOfLines={1} adjustsFontSizeToFit>{privateRoomCode}</ThemedText>
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
              if (mmIntervalRef.current) { clearInterval(mmIntervalRef.current); mmIntervalRef.current = null; }
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
  if (phase === 'validating') {
    const barWidth = validatingAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    const stepMsg = validatingStep === 0
      ? 'Consultando banco de palavras...'
      : validatingStep === 1
        ? 'Analisando suas respostas...'
        : 'Verificando respostas do adversário...';
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="VERIFICANDO" />
          <View style={[s.centerFlex, { paddingHorizontal: Spacing.four, gap: Spacing.four }]}>

            <ThemedText style={{ fontSize: 56, lineHeight: 68 }}>🔍</ThemedText>

            <View style={{ alignItems: 'center', gap: Spacing.one }}>
              <ThemedText type="subtitle" style={s.center}>Verificando respostas</ThemedText>
              <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
                {stepMsg}
              </ThemedText>
            </View>

            {/* Barra de progresso */}
            <View style={{ alignSelf: 'stretch' }}>
              <View style={s.validatingTrack}>
                <Animated.View style={[s.validatingFill, { width: barWidth }]} />
              </View>
            </View>

            {/* Frase de santo / ensinamento */}
            {validationQuote && (
              <View style={s.quoteCard}>
                <ThemedText style={s.quoteText}>"{validationQuote.text}"</ThemedText>
                {validationQuote.author ? (
                  <ThemedText style={s.quoteAuthor}>— {validationQuote.author}</ThemedText>
                ) : null}
              </View>
            )}

          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Waiting for opponent (realtime) ────────────────────────────────────────
  if (phase === 'waiting') return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <GameHeader title="Stop Online" subtitle="AGUARDANDO" />
        <View style={s.centerFlex}>
          <ThemedText style={{ fontSize: 64, lineHeight: 78 }}>⏳</ThemedText>
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
          <ThemedText style={{ fontSize: 64, lineHeight: 78 }}>✅</ThemedText>
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
    const cats      = gameCatsRef.current;
    const isAbandon = abandoned === 'me';
    const oppLeft   = abandoned === 'opp';
    const isAsync   = gameMode === 'async';
    const isMulti   = multiResults.length > 2;
    const myRank    = multiResults.find(r => r.playerId === (user?.id ?? ''))?.rank ?? 1;

    const tiedAtFirst  = isMulti && myRank === 1 && multiResults.filter(r => r.rank === 1).length > 1;
    const iWon    = isMulti ? (myRank === 1 && !tiedAtFirst) : (isAbandon ? false : oppLeft ? true : (myResult.score > (oppResult?.score ?? 0)));
    const tied    = (!isMulti && !isAbandon && !oppLeft && myResult.score === (oppResult?.score ?? 0)) || tiedAtFirst;

    let resEmoji = isMulti
      ? (tiedAtFirst ? '🤝' : myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '😔')
      : (tied ? '🤝' : iWon ? '🏆' : isAbandon ? '🏳️' : '😔');
    let resMsg = isMulti
      ? (tiedAtFirst ? 'Empate!' : myRank === 1 ? 'Você ganhou!' : `${myRank}º lugar`)
      : (tied ? 'Empate!' : iWon ? 'Você ganhou!' : isAbandon ? 'Você abandonou' : 'Adversário ganhou!');
    let resColor = iWon ? C.green : tied ? C.gold : C.red;
    if (!isMulti && oppLeft) { resEmoji = '🏆'; resMsg = 'Adversário saiu — você ganhou!'; resColor = C.green; }

    const myRematch  = isPlayer1 ? p1Rematch : p2Rematch;
    const oppRematch = isPlayer1 ? p2Rematch : p1Rematch;

    const handleBack = () => {
      if (roomIdRef.current) {
        void supabase.rpc('mark_stop_result_seen', { p_room_id: roomIdRef.current });
      }
      if (isAsync && roomIdRef.current) {
        setDismissedIds(prev => new Set([...prev, roomIdRef.current!]));
      }
      setPhase('selecting'); setAbandoned(null);
      setMyResult(null); setOppResult(null); setMultiResults([]);
      setOppName('Adversário'); setOppId(null);
      setP1Rematch(false); setP2Rematch(false);
      setCoinDelta(null); coinsAwardedRef.current = false;
      pendingResultsRef.current = null;
      setMyBankMap({}); setOppBankMap({}); setAiLoading(false);
      fetchAsyncGames();
    };

    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Stop Online" subtitle="RESULTADO" />
          <ScrollView contentContainerStyle={[s.resultScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>

            <View style={[s.resBanner, { backgroundColor: resColor + '22', borderColor: resColor }]}>
              <ThemedText style={{ fontSize: 40, lineHeight: 48 }}>{resEmoji}</ThemedText>
              <View style={{ gap: 2 }}>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', color: resColor, lineHeight: 26 }}>{resMsg}</ThemedText>
                {!isAbandon && !oppLeft && !isMulti && (
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                    Letra: {letter} · {myResult.score} vs {oppResult?.score ?? 0} pts
                  </ThemedText>
                )}
                {!isAbandon && isMulti && (
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                    Letra: {letter} · {multiResults.length} jogadores
                  </ThemedText>
                )}
                {oppLeft && (
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>
                    {isAsync ? 'Prazo encerrado sem resposta' : 'Adversário abandonou a partida'}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* ── Leaderboard multi-player ── */}
            {isMulti && (
              <View style={{ gap: Spacing.one }}>
                <ThemedText style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textSecondary }}>
                  CLASSIFICAÇÃO
                </ThemedText>
                {multiResults.map(r => {
                  const isMe = r.playerId === (user?.id ?? '');
                  const rankEmoji = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}º`;
                  const av = isMe ? (profile?.avatar_emoji ?? '👤') : (playersAvatarMap[r.playerId] ?? '👤');
                  return (
                    <ThemedView key={r.playerId} type="backgroundElement"
                      style={[s.leaderRow, isMe && { borderColor: C.purple, borderWidth: 1.5 }]}>
                      <ThemedText style={{ fontSize: 20, width: 32 }}>{rankEmoji}</ThemedText>
                      <AvatarImage value={av} size={28} />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {r.playerName}{isMe ? ' (você)' : ''}
                        </ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                          {r.validCount}/{cats.length} válidas
                        </ThemedText>
                      </View>
                      <ThemedText style={{ fontSize: 22, fontWeight: '900',
                        color: r.rank === 1 ? C.green : r.rank === multiResults.length ? C.red : theme.text }}>
                        {r.score}
                      </ThemedText>
                    </ThemedView>
                  );
                })}
              </View>
            )}

            {/* ── Respostas dos participantes (multi-player) ── */}
            {isMulti && cats.length > 0 && (() => {
              const playerPairs: MultiResult[][] = [];
              for (let i = 0; i < multiResults.length; i += 2)
                playerPairs.push(multiResults.slice(i, i + 2));
              const rl = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}º`;
              return (
                <View style={{ gap: Spacing.two }}>
                  <ThemedText style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textSecondary }}>
                    RESPOSTAS DOS PARTICIPANTES
                  </ThemedText>
                  {playerPairs.map((pair, pairIdx) => {
                    const alone = pair.length === 1;
                    return (
                      <ThemedView key={pairIdx} type="backgroundElement"
                        style={[s.compCard, { padding: 0, overflow: 'hidden' }]}>
                        {/* Cabeçalho: nomes dos jogadores */}
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border }}>
                          {pair.map((r, i) => {
                            const isMe = r.playerId === (user?.id ?? '');
                            return (
                              <View key={r.playerId} style={[
                                { flex: 1, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center' },
                                !alone && i === 0 && { borderRightWidth: 1, borderRightColor: C.border },
                                isMe && { backgroundColor: C.purple + '15' },
                              ]}>
                                <ThemedText style={{ fontSize: 10, fontWeight: '900', letterSpacing: 0.6,
                                  color: isMe ? C.purple : BRAND }} numberOfLines={1}>
                                  {rl(r.rank)} {r.playerName.toUpperCase()}{isMe ? ' (VOCÊ)' : ''}
                                </ThemedText>
                                <ThemedText themeColor="textSecondary" style={{ fontSize: 10 }}>
                                  {r.score} pts · {r.validCount}/{cats.length} válidas
                                </ThemedText>
                              </View>
                            );
                          })}
                        </View>
                        {/* Linhas de categorias */}
                        {cats.map((cat, catIdx) => (
                          <View key={cat.key} style={[
                            catIdx > 0 && { borderTopWidth: 1, borderTopColor: C.border + '44' },
                          ]}>
                            <ThemedText style={{ fontSize: 9, fontWeight: '700', letterSpacing: 0.8,
                              color: theme.textSecondary, paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 }}>
                              {cat.label.toUpperCase()}
                            </ThemedText>
                            <View style={{ flexDirection: 'row', paddingBottom: 8 }}>
                              {pair.map((r, i) => {
                                const ans = ((r.answers[cat.key] ?? '') as string).trim();
                                const isMe = r.playerId === (user?.id ?? '');
                                const bm = r.bankMap[cat.key];
                                const color = bm === 'valid' || bm === 'ai_valid' ? C.green
                                  : bm === 'unverified' ? C.gold
                                  : bm === 'ai_invalid' ? C.red
                                  : !ans ? theme.textSecondary
                                  : ans[0].toUpperCase() === letter ? C.green : C.red;
                                return (
                                  <View key={r.playerId} style={[
                                    { flex: 1, paddingHorizontal: 10, gap: 1 },
                                    !alone && i === 0 && { borderRightWidth: 1, borderRightColor: C.border + '44' },
                                  ]}>
                                    <ThemedText style={{ fontSize: 14, fontWeight: '600', color }} numberOfLines={1}>
                                      {ans || '—'}
                                    </ThemedText>
                                    {bm === 'valid'      && <ThemedText style={s.compBadge}>✅ Reconhecida</ThemedText>}
                                    {bm === 'ai_valid'   && <ThemedText style={s.compBadge}>✅ Válida (IA)</ThemedText>}
                                    {bm === 'unverified' && <ThemedText style={[s.compBadge, { color: C.gold }]}>⚠️ Não verificada</ThemedText>}
                                    {bm === 'ai_invalid' && <ThemedText style={[s.compBadge, { color: C.red }]}>❌ Inválida</ThemedText>}
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        ))}
                      </ThemedView>
                    );
                  })}
                </View>
              );
            })()}

            {!isMulti && !isAbandon && oppResult && (
              <>
                {/* Mini ranking 1v1 */}
                {!oppLeft && (() => {
                  const ranked1v1 = [
                    { id: user?.id ?? '', name: profile?.name ?? 'Você', score: myResult.score, validCount: myResult.validCount, isMe: true },
                    { id: oppId ?? '', name: oppName, score: oppResult.score, validCount: oppResult.validCount, isMe: false },
                  ].sort((a, b) => b.score - a.score);
                  return (
                    <View style={{ gap: Spacing.one }}>
                      <ThemedText style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: theme.textSecondary }}>
                        CLASSIFICAÇÃO
                      </ThemedText>
                      {ranked1v1.map((r, i) => (
                        <ThemedView key={r.id || r.name} type="backgroundElement"
                          style={[s.leaderRow, r.isMe && { borderColor: C.purple, borderWidth: 1.5 }]}>
                          <ThemedText style={{ fontSize: 20, width: 32 }}>{i === 0 ? '🥇' : '🥈'}</ThemedText>
                          <AvatarImage
                            value={r.isMe ? (profile?.avatar_emoji ?? '👤') : (r.id ? (playersAvatarMap[r.id] ?? '👤') : '👤')}
                            size={28}
                          />
                          <View style={{ flex: 1 }}>
                            <ThemedText type="smallBold" numberOfLines={1}>
                              {r.name}{r.isMe ? ' (você)' : ''}
                            </ThemedText>
                            <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                              {r.validCount}/{cats.length} válidas
                            </ThemedText>
                          </View>
                          <ThemedText style={{ fontSize: 22, fontWeight: '900',
                            color: i === 0 ? C.green : theme.text }}>
                            {r.score}
                          </ThemedText>
                        </ThemedView>
                      ))}
                    </View>
                  );
                })()}

                <View style={s.scoreRow}>
                  <ThemedView type="backgroundElement" style={[s.scoreCard, { borderColor: C.purple }]}>
                    <AvatarImage value={profile?.avatar_emoji ?? '👤'} size={32} borderColor={C.purple} />
                    <ThemedText style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: C.purple }}>VOCÊ</ThemedText>
                    <ThemedText style={{ fontSize: 30, fontWeight: '900', color: C.purple, lineHeight: 36 }}>{myResult.score}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{myResult.validCount}/{cats.length} válidas</ThemedText>
                  </ThemedView>
                  <ThemedText style={{ fontSize: 18, fontWeight: '800', color: theme.textSecondary }}>VS</ThemedText>
                  <ThemedView type="backgroundElement" style={[s.scoreCard, { borderColor: BRAND }]}>
                    <AvatarImage value={oppId ? (playersAvatarMap[oppId] ?? '👤') : '👤'} size={32} borderColor={BRAND} />
                    <ThemedText style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: BRAND }} numberOfLines={1}>{oppName.toUpperCase()}</ThemedText>
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

                  const cellColor = (res: BankResult | undefined, hasAns: boolean) =>
                    !hasAns                                    ? theme.textSecondary
                    : (res === 'valid' || res === 'ai_valid') ? C.green
                    : res === 'unverified'                    ? C.gold
                    : res === 'ai_invalid'                    ? C.red
                    : theme.textSecondary;

                  const cellBg = (res: BankResult | undefined, startsOk: boolean, hasAns: boolean) =>
                    !hasAns                                      ? 'transparent'
                    : !res
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
                        <View style={[s.compCell, { backgroundColor: cellBg(myRes, myV, mine.length > 0) }]}>
                          <ThemedText style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: C.purple }}>VOCÊ</ThemedText>
                          <ThemedText style={{ fontSize: 13, fontWeight: '600', color: cellColor(myRes, mine.length > 0) }}>
                            {mine || '—'}
                          </ThemedText>
                          {mine.length > 0 && <Badge res={myRes} />}
                        </View>
                        <View style={[s.compCell, { backgroundColor: cellBg(oppRes, theirV, theirs.length > 0) }]}>
                          <ThemedText style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: BRAND }} numberOfLines={1}>{oppName.toUpperCase()}</ThemedText>
                          <ThemedText style={{ fontSize: 13, fontWeight: '600', color: cellColor(oppRes, theirs.length > 0) }}>
                            {theirs || (oppLeft ? '(não respondeu)' : '—')}
                          </ThemedText>
                          {!oppLeft && theirs.length > 0 && <Badge res={oppRes} />}
                        </View>
                      </View>
                    </ThemedView>
                  );
                })}
              </>
            )}

            {/* Rematch — só 1v1, sem abandono */}
            {!isMulti && !isAbandon && !oppLeft && !isAsync && (
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

            <TouchableOpacity style={s.ghostBtn} onPress={handleBack} activeOpacity={0.8}>
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
          right={<ThemedText type="smallBold" style={{ color: timerColor, fontSize: 20 }}>{timeLeft}s</ThemedText>}
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
                {isAsync
                  ? 'Preencha as categorias e clique em STOP quando terminar!'
                  : 'Preencha as categorias com palavras que comecem com esta letra'}
              </ThemedText>
            </View>

            {gameCategories.map((cat, i) => (
              <ThemedView key={cat.key} type="backgroundElement" style={s.inputCard}>
                <View style={s.inputGroup}>
                  <View style={s.inputHeader}>
                    <ThemedText style={s.catLabel}>{cat.label}</ThemedText>
                    <TouchableOpacity
                      onPress={() => handleHint(cat)}
                      disabled={!profile || profile.coins < 2 || !!loadingHint}
                      style={[s.hintBtn, (!profile || profile.coins < 2) && { opacity: 0.35 }]}
                      activeOpacity={0.7}>
                      <ThemedText style={s.hintBtnText}>
                        {loadingHint === cat.key ? '...' : '🪙 Dica −2'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
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

            <TouchableOpacity style={[s.stopBtn, { backgroundColor: BRAND }]} onPress={callStop} activeOpacity={0.8}>
              <Image source={require('@/assets/images/stop.png')} style={{ width: 26, height: 26, marginRight: 8 }} resizeMode="contain" />
              <ThemedText style={s.stopTxt}>STOP!</ThemedText>
            </TouchableOpacity>
            {!isAsync && (
              <TouchableOpacity style={[s.ghostBtn, { marginTop: 4 }]}
                onPress={() => Alert.alert('Abandonar partida?', 'Você perderá automaticamente.',
                  [{ text: 'Ficar', style: 'cancel' },
                   { text: 'Abandonar', style: 'destructive', onPress: handleAbandon }]
                )} activeOpacity={0.8}>
                <ThemedText style={[s.btnTxt, { color: theme.textSecondary, fontSize: 13 }]}>ABANDONAR PARTIDA</ThemedText>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Popup: tempo de P1 esgotou na tela de P2 */}
      {stopPopup && (
        <Modal transparent animationType="fade" statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
            <ThemedView type="backgroundElement" style={{ borderRadius: 20, padding: 28, alignItems: 'center', gap: 14, maxWidth: 320, width: '100%' }}>
              <Image source={require('@/assets/images/stop.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
              <ThemedText type="title" style={{ textAlign: 'center', fontSize: 20 }}>
                {stopPopup.name} clicou em Stop!
              </ThemedText>
              <ThemedText style={{ textAlign: 'center', color: BRAND, fontWeight: '800', fontSize: 15 }}>
                Tempo: {stopPopup.elapsed}s
              </ThemedText>
              <TouchableOpacity
                style={{ backgroundColor: BRAND, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28, marginTop: 6 }}
                activeOpacity={0.85}
                onPress={() => { setStopPopup(null); doSubmitRef.current(); }}>
                <ThemedText style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>VER RESULTADO</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:       { flex: 1 },
  center:     { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },

  // Selection
  selectScroll:   { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },
  selectHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  selectTitle:    { fontSize: 22, fontWeight: '900', letterSpacing: 0.2 },
  slotsContainer: { gap: Spacing.two, alignSelf: 'stretch' },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: C.radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 64,
  },
  slotAccent: { width: 4, alignSelf: 'stretch' },
  arrowBtn: {
    width: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'transparent',
  },
  arrowText: { fontSize: 28, fontWeight: '900', lineHeight: 34 },
  slotCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  slotLabel: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },

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
  codeText:  { fontSize: 38, fontWeight: '900', letterSpacing: 4, color: C.purple, lineHeight: 48 },

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
  asyncBtn:     { paddingHorizontal: 18, paddingVertical: 10, marginRight: 14 },
  enterBtnTxt:  { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },

  // Async game cards
  asyncCard:     { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: C.radius.md, padding: Spacing.three, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  asyncSwipeHint:{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 7, backgroundColor: C.red },
  deleteAction:  { backgroundColor: C.red, borderRadius: C.radius.md, marginLeft: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 4, minWidth: 76 },
  deleteActionTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
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
  validatingTrack: { height: 14, borderRadius: 7, backgroundColor: '#ffffff18', overflow: 'hidden' },
  validatingFill:  { height: 14, borderRadius: 7, backgroundColor: BRAND },
  quoteCard: {
    alignSelf: 'stretch',
    borderRadius: C.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: BRAND,
    backgroundColor: BRAND + '12',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  quoteText:   { fontSize: 14, fontStyle: 'italic', lineHeight: 21, textAlign: 'center' },
  quoteAuthor: { fontSize: 12, fontWeight: '700', color: BRAND, textAlign: 'right' },
  letterRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  letterCard: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontSize: 52, fontWeight: '900', color: '#fff', lineHeight: 60 },
  inputCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.two, borderWidth: 1, borderColor: C.border },
  inputGroup:  { flex: 1, gap: 3 },
  inputHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  catLabel:    { fontSize: 12, opacity: 0.65 },
  catEmoji:    { fontSize: 22, width: 32, textAlign: 'center' },
  hintBtn:     { backgroundColor: C.gold + '22', borderRadius: C.radius.pill, paddingVertical: 3, paddingHorizontal: 8 },
  hintBtnText: { fontSize: 11, fontWeight: '800', color: C.gold },
  shuffleBtn:     { borderWidth: 1.5, borderColor: C.purple + '88', borderRadius: C.radius.pill, paddingVertical: 7, paddingHorizontal: 12, alignItems: 'center' as const },
  shuffleBtnText: { color: C.purple, fontWeight: '800' as const, fontSize: 12, letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderRadius: C.radius.sm, paddingHorizontal: Spacing.two,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6, fontSize: 15, fontWeight: '500',
  },
  stopBtn: { paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: Spacing.one },
  stopTxt: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },

  // Player picker (selection screen)
  playerPickerWrap: { alignSelf: 'stretch', gap: Spacing.one },
  playerPickerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4' },
  playerPickerRow:   { flexDirection: 'row', gap: Spacing.two },
  playerPickerBtn: {
    flex: 1, paddingVertical: 10, borderRadius: C.radius.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, backgroundColor: 'transparent',
  },
  playerPickerTxt: { fontSize: 13, fontWeight: '800' },

  // Player slots (matchmaking)
  playerSlot: {
    alignItems: 'center', width: 56, paddingVertical: 8,
    borderRadius: C.radius.md, borderWidth: 1.5, gap: 2,
  },

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

  // Leaderboard
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderRadius: C.radius.md, padding: Spacing.two,
    borderWidth: 1, borderColor: C.border,
  },
});
