import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState, useEffect } from 'react';

import { BannerAd } from '@/components/banner-ad';
import { GuestBanner } from '@/components/guest-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Colors, Spacing } from '@/constants/theme';
import { GAMES } from '@/constants/games';
import { ALL_QUESTIONS as QUIZ_QUESTIONS } from '@/constants/quiz-questions';
import { ALL_QUESTIONS as LITURGICO_QUESTIONS } from '@/constants/liturgico-questions';
import { ALL_FRASES } from '@/constants/versiculo-frases';
import { PUZZLE_THEMES } from '@/constants/puzzle-themes';
import { SANCTUARIES } from '@/constants/sanctuaries';
import { LATIM_BOGGLE_LEVELS } from '@/constants/latim-boggle-levels';
import { getDailyMission, getLast7DaysStars } from '@/lib/daily-mission';
import {
  MAX_XP_STOP,
  maxXpLatim,
  maxXpLiturgico,
  maxXpPalavras,
  maxXpPeregrinacao,
  maxXpQuiz,
  maxXpVersiculo,
} from '@/lib/game-xp';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGamePacks } from '@/hooks/use-game-packs';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useNotifications } from '@/context/notifications-context';

const FILTER_TAGS = ['Todos', 'Quiz', 'Bíblia', 'Aventura', 'Vocabulário', 'Liturgia'];
const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function useCountdown() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60_000) / 1_000).toString().padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function chunkArray<T>(arr: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push([...arr.slice(i, i + size)]);
  }
  return result;
}

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();
  const countdown = useCountdown();
  const [activeTag, setActiveTag] = useState('Todos');
  const [mission, setMission] = useState(getDailyMission);

  // Atualiza a missão quando vira meia-noite sem precisar reiniciar o app
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    const t = setTimeout(() => setMission(getDailyMission()), msUntilMidnight);
    return () => clearTimeout(t);
  }, [mission]);
  const { user, profile, refreshProfile } = useAuth();
  const { unreadCount } = useNotifications();
  const { missionDaysPlayed } = useGameStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile().catch(() => {});
    setRefreshing(false);
  }, [refreshProfile]);

  // XP real de cada jogo — máximo alcançável considerando também os packs do
  // banco (game_packs), não um número fixo. Ver lib/game-xp.ts.
  const { packs: quizPacks }      = useGamePacks('quiz');
  const { packs: versiculoPacks } = useGamePacks('versiculo');
  const { packs: peregrinacaoPacks } = useGamePacks('peregrinacao');
  const { packs: palavrasPacks }  = useGamePacks('palavras');
  const { packs: liturgicoPacks } = useGamePacks('liturgico');
  const { packs: latimPacks }     = useGamePacks('latim');

  const xpByGameId = useMemo<Record<string, number>>(() => ({
    'quiz-santos':        maxXpQuiz(QUIZ_QUESTIONS, quizPacks),
    'versiculo':          maxXpVersiculo(ALL_FRASES, versiculoPacks),
    'peregrinacao':       maxXpPeregrinacao(SANCTUARIES, peregrinacaoPacks),
    'palavras-fe':        maxXpPalavras(PUZZLE_THEMES, palavrasPacks),
    'desafio-liturgico':  maxXpLiturgico(LITURGICO_QUESTIONS, liturgicoPacks),
    'stop-solo':          MAX_XP_STOP,
    'latim-boggle':       maxXpLatim(LATIM_BOGGLE_LEVELS, latimPacks),
  }), [quizPacks, versiculoPacks, peregrinacaoPacks, palavrasPacks, liturgicoPacks, latimPacks]);

  const cardBorder = scheme === 'dark' ? C.border : 'rgba(0,0,0,0.08)';
  const weekStars  = getLast7DaysStars(missionDaysPlayed);

  const filtered = activeTag === 'Todos' ? GAMES : GAMES.filter(g => g.tag === activeTag);
  const rows = chunkArray(filtered, 2);
  const cardWidth = (width - Spacing.four * 2 - Spacing.two) / 2;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <GuestBanner />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + Spacing.five }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} colors={[C.purple]} />
          }>

          {/* ── Header: saudação + streak + sino ── */}
          <View style={styles.header}>
            <View>
              <ThemedText style={[styles.greeting, { color: colors.textSecondary }]}>
                {user && profile ? `Olá, ${profile.name}! 👋` : 'Olá 👋'}
              </ThemedText>
              <ThemedText style={[styles.appName, { color: colors.text }]}>Salve Maria! 🕊️</ThemedText>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.bellWrap}
                activeOpacity={0.7}
                onPress={() => router.push('/notifications')}>
                <Image source={require('@/assets/images/sino.png')} style={styles.bellIcon} resizeMode="contain" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <ThemedText style={styles.notifBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── SEQUÊNCIA DA MISSÃO DO DIA (7 estrelas, uma por dia) ── */}
          <View style={styles.streakRow}>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              SEQUÊNCIA DA MISSÃO DO DIA
            </ThemedText>
            <View style={styles.starsRow}>
              {weekStars.map((lit, i) => {
                const isToday = i === 6;
                const dow = (new Date().getDay() - (6 - i) + 7) % 7;
                return (
                  <View key={i} style={styles.starItem}>
                    <ThemedText style={[styles.starEmoji, { opacity: lit ? 1 : 0.28 }]}>
                      ⭐
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.starLabel,
                        { color: isToday ? C.gold : colors.textSecondary, fontWeight: isToday ? '800' : '600' },
                      ]}>
                      {WEEKDAY_LETTERS[dow]}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── MISSÃO DO DIA ── */}
          <View>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>MISSÃO DO DIA</ThemedText>
            <TouchableOpacity
              onPress={() => router.push(mission.route)}
              activeOpacity={0.85}
              style={[styles.missionCard, { backgroundColor: colors.backgroundSelected }]}>
              {/* left: info */}
              <View style={styles.missionInfo}>
                <View style={styles.missionTagRow}>
                  <View style={[styles.missionTag, { backgroundColor: mission.tagColor + '33' }]}>
                    <ThemedText style={[styles.missionTagText, { color: mission.tagColor }]}>
                      {mission.tag.toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.countdownPill}>
                    <ThemedText style={styles.countdownText}>{countdown}</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.missionTitle, { color: colors.text }]}>{mission.title}</ThemedText>
                <ThemedText style={[styles.missionDesc, { color: colors.textSecondary }]}>{mission.desc}</ThemedText>
                <TouchableOpacity
                  onPress={() => router.push(mission.route)}
                  style={styles.missionBtn}
                  activeOpacity={0.8}>
                  <ThemedText style={styles.missionBtnText}>JOGAR</ThemedText>
                </TouchableOpacity>
              </View>
              {/* right: icon */}
              <Image source={mission.image} style={styles.missionEmoji} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* ── JOGOS ── */}
          <View>
            {/* chips */}
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: Spacing.two }]}>JOGOS</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={{ marginBottom: Spacing.three }}>
              {FILTER_TAGS.map(tag => {
                const active = tag === activeTag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setActiveTag(tag)}
                    style={[
                      styles.chip,
                      active
                        ? { backgroundColor: C.purple }
                        : {
                            backgroundColor: colors.backgroundElement,
                            borderWidth: 1,
                            borderColor: C.border,
                          },
                    ]}
                    activeOpacity={0.75}>
                    <ThemedText style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>
                      {tag}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* grid */}
            {rows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map(game => (
                  <TouchableOpacity
                    key={game.title}
                    onPress={() => router.push(game.route)}
                    activeOpacity={0.82}
                    style={[styles.gridCard, { width: cardWidth, backgroundColor: colors.backgroundElement, borderColor: cardBorder }]}>
                    {/* icon top */}
                    <View style={styles.gridEmojiWrap}>
                      <Image source={game.image} style={styles.gridImg} resizeMode="contain" />
                    </View>
                    {/* info bottom */}
                    <View style={styles.gridInfo}>
                      <ThemedText style={[styles.gridTitle, { color: colors.text }]}>{game.title}</ThemedText>
                      <ThemedText style={styles.gridXp}>+{xpByGameId[game.gameId] ?? 0} XP</ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
                {row.length === 1 && <View style={{ width: cardWidth }} />}
              </View>
            ))}
          </View>

        </ScrollView>

        {/* Fixo acima da tab bar — fora do ScrollView; some sem ocupar espaço se não houver anúncio */}
        <BannerAd />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 13, fontWeight: '500' },
  appName: { fontSize: 26, fontWeight: '800', letterSpacing: 0.2, lineHeight: 34 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 4 },
  bellWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { width: 22, height: 22 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },

  /* ── Section label ── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },

  /* ── Sequência da Missão do Dia ── */
  streakRow: { gap: Spacing.two },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  starItem: { alignItems: 'center', gap: 2 },
  starEmoji: { fontSize: 24, lineHeight: 28 },
  starLabel: { fontSize: 11 },

  /* ── Missão do Dia ── */
  missionCard: {
    borderRadius: C.radius.lg,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C.purple + '55',
    minHeight: 170,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  missionInfo: { flex: 1, gap: Spacing.two },
  missionTagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  missionTag: {
    alignSelf: 'flex-start',
    borderRadius: C.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  missionTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  countdownPill: {
    backgroundColor: C.green + '22',
    borderRadius: C.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.green + '55',
  },
  countdownText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  missionDesc: { fontSize: 12, lineHeight: 16 },
  missionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.purple,
    borderRadius: C.radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 10,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  missionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  missionEmoji: { width: 88, height: 88, marginLeft: Spacing.two },

  /* ── Chips ── */
  chips: { gap: Spacing.two, paddingVertical: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: C.radius.pill },
  chipText: { fontSize: 13, fontWeight: '600' },

  /* ── Game Grid ── */
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  gridCard: {
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    minHeight: 160,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  gridEmojiWrap: { height: 72, justifyContent: 'center' },
  gridImg: { width: 64, height: 64 },
  gridInfo: { gap: 2 },
  gridTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  gridXp: { color: C.gold, fontSize: 12, fontWeight: '700' },
});
