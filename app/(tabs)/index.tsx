import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth-context';

const FILTER_TAGS = ['Todos', 'Quiz', 'Bíblia', 'Aventura', 'Vocabulário', 'Liturgia'];

const GAMES = [
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/quiz.png') as number,
    title: 'Quiz dos Santos',
    tag: 'Quiz',
    tagColor: C.gold,
    xp: 340,
    desc: '10 perguntas · Santos e suas histórias',
    route: '/quiz-santos' as const,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/frase_misteriosa.png') as number,
    title: 'Versículo Misterioso',
    tag: 'Bíblia',
    tagColor: C.purple,
    xp: 250,
    desc: '5 versículos · Descubra progressivamente',
    route: '/versiculo-misterioso' as const,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/peregrinacao.png') as number,
    title: 'Peregrinação Virtual',
    tag: 'Aventura',
    tagColor: C.green,
    xp: 400,
    desc: '5 santuários · Perguntas por etapa',
    route: '/peregrinacao' as const,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/palavra_cruzada.png') as number,
    title: 'Palavras da Fé',
    tag: 'Vocabulário',
    tagColor: '#3B82F6',
    xp: 200,
    desc: '5 palavras · Caça-palavras bíblico',
    route: '/palavras-fe' as const,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/desafio_calendário_liturgico.png') as number,
    title: 'Desafio Litúrgico',
    tag: 'Liturgia',
    tagColor: C.red,
    xp: 300,
    desc: '10 questões · 60 segundos',
    route: '/desafio-liturgico' as const,
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('@/assets/images/stop.png') as number,
    title: 'Stop Católico',
    tag: 'Vocabulário',
    tagColor: C.gold,
    xp: 280,
    desc: '6 categorias · Letra sorteada',
    route: '/stop-catolico' as const,
  },
];

const MISSION = GAMES[0];
const STREAK = 7;

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
  const { user, profile } = useAuth();

  const cardBorder = scheme === 'dark' ? C.border : 'rgba(0,0,0,0.08)';
  const streakBg   = scheme === 'dark' ? '#2E1A08' : C.gold + '22';

  const filtered = activeTag === 'Todos' ? GAMES : GAMES.filter(g => g.tag === activeTag);
  const rows = chunkArray(filtered, 2);
  const cardWidth = (width - Spacing.four * 2 - Spacing.two) / 2;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: BottomTabInset + Spacing.five },
          ]}>

          {/* ── Header: saudação + streak + sino ── */}
          <View style={styles.header}>
            <View>
              <ThemedText style={[styles.greeting, { color: colors.textSecondary }]}>
                {user && profile ? `Olá, ${profile.name}! 👋` : 'Olá 👋'}
              </ThemedText>
              <ThemedText style={[styles.appName, { color: colors.text }]}>Salve Maria! 🕊️</ThemedText>
            </View>
            <View style={styles.headerRight}>
              <View style={[styles.streakBadge, { backgroundColor: streakBg }]}>
                <ThemedText style={styles.streakText}>🔥 {STREAK}</ThemedText>
              </View>
              <TouchableOpacity style={styles.bellWrap} activeOpacity={0.7}>
                <Image source={require('@/assets/images/sino.png')} style={styles.bellIcon} resizeMode="contain" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── MISSÃO DO DIA ── */}
          <View>
            <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>MISSÃO DO DIA</ThemedText>
            <TouchableOpacity
              onPress={() => router.push(MISSION.route)}
              activeOpacity={0.85}
              style={[styles.missionCard, { backgroundColor: colors.backgroundSelected }]}>
              {/* left: info */}
              <View style={styles.missionInfo}>
                <View style={styles.missionTagRow}>
                  <View style={[styles.missionTag, { backgroundColor: MISSION.tagColor + '33' }]}>
                    <ThemedText style={[styles.missionTagText, { color: MISSION.tagColor }]}>
                      {MISSION.tag.toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.countdownPill}>
                    <ThemedText style={styles.countdownText}>{countdown}</ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.missionTitle, { color: colors.text }]}>{MISSION.title}</ThemedText>
                <ThemedText style={[styles.missionDesc, { color: colors.textSecondary }]}>{MISSION.desc}</ThemedText>
                <TouchableOpacity
                  onPress={() => router.push(MISSION.route)}
                  style={styles.missionBtn}
                  activeOpacity={0.8}>
                  <ThemedText style={styles.missionBtnText}>JOGAR</ThemedText>
                </TouchableOpacity>
              </View>
              {/* right: icon */}
              <Image source={MISSION.image} style={styles.missionEmoji} resizeMode="contain" />
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
                      <ThemedText style={styles.gridXp}>+{game.xp} XP</ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
                {row.length === 1 && <View style={{ width: cardWidth }} />}
              </View>
            ))}
          </View>

        </ScrollView>
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
  appName: { fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 4 },
  streakBadge: {
    borderRadius: C.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.gold + '55',
  },
  streakText: { fontSize: 14, fontWeight: '700', color: C.gold },
  bellWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { width: 22, height: 22 },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },

  /* ── Section label ── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },

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
