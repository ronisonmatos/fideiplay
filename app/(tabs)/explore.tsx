import {
  ActivityIndicator,
  Alert,
  Animated,
  Appearance,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useGameStore } from '@/context/game-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { getWeeklyRanking, RankingEntry } from '@/lib/score-events';

const ACHIEVEMENTS = [
  { id: 'primeiroPasso', emoji: '🎯', title: 'Primeiro Passo', desc: 'Complete qualquer jogo' },
  { id: 'biblista',      emoji: '📖', title: 'Biblista',       desc: 'Acerte 5 versículos seguidos' },
  { id: 'apostolo',      emoji: '✝️', title: 'Apóstolo',       desc: 'Complete a Peregrinação Virtual' },
  { id: 'stopMestre',    emoji: '🛑', title: 'Stop Mestre',    desc: 'Preencha tudo no Stop Católico' },
  { id: 'conhecedor',    emoji: '🏆', title: 'Conhecedor',     desc: 'Acerte 10/10 no Quiz dos Santos' },
  { id: 'relampago',     emoji: '⏱️', title: 'Relâmpago',      desc: 'Desafio Litúrgico com 30s sobrando' },
];

function PrefsCard({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <>
      <ThemedText style={styles.sectionLabel}>PREFERÊNCIAS</ThemedText>
      <ThemedView type="backgroundElement" style={styles.prefCard}>
        <View style={styles.prefRow}>
          <View style={styles.prefLeft}>
            <ThemedText style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</ThemedText>
            <View>
              <ThemedText type="smallBold">Tema</ThemedText>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                {isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}
              </ThemedText>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={onToggle}
            trackColor={{ false: '#3a3a5c', true: C.purple }}
            thumbColor="#ffffff"
          />
        </View>
      </ThemedView>
    </>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function ContaScreen() {
  const theme        = useTheme();
  const colorScheme  = useColorScheme();
  const isDark       = colorScheme === 'dark';
  const { totalScore, gamesPlayed, unlockedAchievements } = useGameStore();
  const { user, profile, refreshProfile, signOut, loading } = useAuth();

  const [ranking,      setRanking]      = useState<RankingEntry[]>([]);
  const [rankingLoad,  setRankingLoad]  = useState(false);
  const [justClaimed,  setJustClaimed]  = useState(false);
  const [claiming,     setClaiming]     = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const TWO_HOURS   = 2 * 60 * 60 * 1000;
  const lastReward  = profile?.last_coin_reward ? new Date(profile.last_coin_reward) : null;
  const eligible    = !lastReward || (Date.now() - lastReward.getTime()) >= TWO_HOURS;
  const msLeft      = lastReward && !eligible ? TWO_HOURS - (Date.now() - lastReward.getTime()) : 0;
  const hoursLeft   = Math.floor(msLeft / (60 * 60 * 1000));
  const minutesLeft = Math.ceil((msLeft % (60 * 60 * 1000)) / 60000);

  const toggleTheme = () => Appearance.setColorScheme(isDark ? 'light' : 'dark');

  const loadRanking = useCallback(async () => {
    setRankingLoad(true);
    const data = await getWeeklyRanking();
    setRanking(data);
    setRankingLoad(false);
  }, []);

  const showRewardToast = useCallback(() => {
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setJustClaimed(false));
  }, [toastOpacity]);

  const claimReward = useCallback(async () => {
    if (claiming || !user) return;
    setClaiming(true);
    const { data, error } = await supabase.rpc('claim_daily_reward', { p_user_id: user.id });
    const result = typeof data === 'number' ? data : -1;
    if (!error && result > 0) {
      await refreshProfile();
      setJustClaimed(true);
      showRewardToast();
    } else {
      Alert.alert(
        'Erro ao resgatar',
        error?.message ?? 'Não foi possível resgatar. Verifique se o SQL foi executado no Supabase (ranking-schema.sql).',
      );
    }
    setClaiming(false);
  }, [claiming, user, refreshProfile, showRewardToast]);

  useFocusEffect(useCallback(() => {
    loadRanking();
  }, [loadRanking]));

  if (loading) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <View style={styles.centerFlex}>
            <ActivityIndicator color={C.purple} size="large" />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  if (user && profile) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <ScrollView contentContainerStyle={[styles.mainScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>

            {/* Profile header */}
            <View style={styles.profileHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: C.purple }]}>
                <ThemedText style={styles.avatarEmoji}>{profile.avatar_emoji}</ThemedText>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="subtitle" style={{ fontSize: 22 }}>{profile.name}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>{user.email}</ThemedText>
              </View>
            </View>

            {/* Moedas */}
            <ThemedView type="backgroundElement" style={styles.coinCard}>
              <View style={styles.coinLeft}>
                <Image source={require('@/assets/images/moedas.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
                <View>
                  <ThemedText type="smallBold" style={{ fontSize: 11, letterSpacing: 1, color: '#9B97D4' }}>
                    SUAS MOEDAS
                  </ThemedText>
                  <ThemedText style={{ fontSize: 36, fontWeight: '900', color: C.gold, lineHeight: 42 }}>
                    {profile.coins ?? 0}
                  </ThemedText>
                </View>
              </View>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 12, textAlign: 'right', maxWidth: 120 }}>
                Ganhe jogando,{'\n'}gaste em itens
              </ThemedText>
            </ThemedView>

            {/* Daily reward toast */}
            {justClaimed && (
              <Animated.View style={[styles.rewardToast, { opacity: toastOpacity }]}>
                <ThemedText style={styles.rewardToastText}>🪙 +5 moedas resgatadas!</ThemedText>
              </Animated.View>
            )}

            {/* Daily reward card — always visible; dimmed when not yet eligible */}
            <TouchableOpacity
              style={[styles.rewardCard, !eligible && { opacity: 0.4 }]}
              onPress={claimReward}
              activeOpacity={0.8}
              disabled={!eligible || claiming}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.rewardTitle}>🪙 Bônus de 2 horas</ThemedText>
                <ThemedText style={styles.rewardSub}>
                  {eligible
                    ? 'Toque para resgatar +5 moedas'
                    : `Disponível em ${hoursLeft}h ${minutesLeft}min`}
                </ThemedText>
              </View>
              <View style={styles.rewardBtn}>
                <ThemedText style={styles.rewardBtnText}>{claiming ? '...' : 'RESGATAR'}</ThemedText>
              </View>
            </TouchableOpacity>

            {/* Score */}
            <ThemedText style={styles.sectionLabel}>PONTUAÇÃO</ThemedText>
            <View style={styles.scoreRow}>
              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <Image source={require('@/assets/images/trofeu.png')} style={styles.scoreImg} resizeMode="contain" />
                <ThemedText type="subtitle" style={[styles.scoreValue, { color: C.gold }]}>{totalScore}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.scoreSmall}>Pontos totais</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <ThemedText style={styles.scoreEmoji}>🎮</ThemedText>
                <ThemedText type="subtitle" style={[styles.scoreValue, { color: C.purple }]}>{gamesPlayed}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.scoreSmall}>Jogos jogados</ThemedText>
              </ThemedView>
            </View>
            {gamesPlayed === 0 && (
              <ThemedText themeColor="textSecondary" style={styles.emptyScore}>Jogue para acumular pontos! 🙏</ThemedText>
            )}

            {/* Weekly ranking */}
            <ThemedText style={styles.sectionLabel}>RANKING SEMANAL</ThemedText>
            <ThemedView type="backgroundElement" style={styles.rankCard}>
              {rankingLoad ? (
                <ActivityIndicator color={C.purple} style={{ paddingVertical: 16 }} />
              ) : ranking.length === 0 ? (
                <ThemedText themeColor="textSecondary" style={styles.rankEmpty}>
                  Nenhuma pontuação essa semana ainda.{'\n'}Jogue o Stop para aparecer aqui! 🛑
                </ThemedText>
              ) : (
                ranking.map((entry, i) => {
                  const isMe = entry.user_id === user?.id;
                  return (
                    <View
                      key={entry.user_id}
                      style={[
                        styles.rankRow,
                        isMe && styles.rankRowMe,
                        i < ranking.length - 1 && styles.rankRowBorder,
                      ]}>
                      <ThemedText style={styles.rankPos}>
                        {i < 3 ? MEDAL[i] : `${i + 1}.`}
                      </ThemedText>
                      <ThemedText style={styles.rankAvatar}>{entry.avatar_emoji}</ThemedText>
                      <ThemedText style={[styles.rankName, isMe && { color: C.purple, fontWeight: '800' }]}
                        numberOfLines={1}>
                        {entry.name}{isMe ? ' (você)' : ''}
                      </ThemedText>
                      <ThemedText style={[styles.rankScore, i === 0 && { color: C.gold }]}>
                        {entry.weekly_score} pts
                      </ThemedText>
                    </View>
                  );
                })
              )}
            </ThemedView>

            {/* Achievements */}
            <ThemedText style={styles.sectionLabel}>CONQUISTAS</ThemedText>
            <View style={styles.achievementGrid}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <ThemedView
                    key={a.id}
                    type="backgroundElement"
                    style={[styles.achievementCard, unlocked && { borderColor: C.purple + '55' }]}>
                    <ThemedText style={[styles.achievementEmoji, !unlocked && styles.locked]}>{a.emoji}</ThemedText>
                    <ThemedText type="smallBold" style={[styles.achievementTitle, !unlocked && styles.locked]}>{a.title}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.achievementDesc}>{a.desc}</ThemedText>
                    <ThemedText style={styles.lockIcon}>{unlocked ? '✅' : '🔒'}</ThemedText>
                  </ThemedView>
                );
              })}
            </View>

            <PrefsCard isDark={isDark} onToggle={toggleTheme} />

            <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.75}>
              <ThemedText style={styles.logoutText}>Sair da conta</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Guest / not logged in ─────────────────────────────────────────────────
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView contentContainerStyle={[styles.mainScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>

          <View style={styles.loggedOutHero}>
            <View style={[styles.heroLogo, { backgroundColor: C.purple }]}>
              <ThemedText style={styles.heroLogoText}>✝</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.textCenter}>Minha Conta</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.heroDesc]}>
              Entre ou crie uma conta para salvar seus pontos, conquistas e competir no ranking.
            </ThemedText>
          </View>

          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>ENTRAR</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
              <ThemedText style={styles.secondaryBtnText}>CRIAR CONTA</ThemedText>
            </TouchableOpacity>
          </View>

          <PrefsCard isDark={isDark} onToggle={toggleTheme} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill:         { flex: 1 },
  centerFlex:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textCenter:   { textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    color: '#9B97D4', textTransform: 'uppercase',
  },
  mainScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },

  // Profile
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  avatarCircle:  { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji:   { fontSize: 32 },
  profileInfo:   { gap: 2 },

  // Coins
  coinCard: {
    borderRadius: C.radius.lg, padding: Spacing.three,
    borderWidth: 2, borderColor: C.gold + '55',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  coinLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },

  // Score
  scoreRow: { flexDirection: 'row', gap: Spacing.two },
  scoreCard: {
    flex: 1, borderRadius: C.radius.lg, padding: Spacing.three,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.border,
  },
  scoreEmoji: { fontSize: 28 },
  scoreImg:   { width: 32, height: 32 },
  scoreValue: { fontSize: 28 },
  scoreSmall: { fontSize: 12, textAlign: 'center' },
  emptyScore: { fontSize: 13, textAlign: 'center', marginTop: -Spacing.one },

  // Achievements
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  achievementCard: {
    width: '47%', borderRadius: C.radius.md, padding: Spacing.two,
    gap: 3, borderWidth: 1, borderColor: C.border,
  },
  achievementEmoji: { fontSize: 26 },
  achievementTitle: { fontSize: 13 },
  achievementDesc:  { fontSize: 11, lineHeight: 15 },
  lockIcon:         { fontSize: 14, position: 'absolute', top: 8, right: 8 },
  locked:           { opacity: 0.35 },

  // Preferences
  prefCard: { borderRadius: C.radius.lg, padding: Spacing.three, borderWidth: 1, borderColor: C.border },
  prefRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },

  // Logout
  logoutBtn: {
    borderWidth: 1, borderColor: C.red + '88',
    paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center',
  },
  logoutText: { color: C.red, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },

  // Daily reward
  rewardCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.gold + '22', borderRadius: C.radius.lg,
    borderWidth: 1.5, borderColor: C.gold + '88',
    padding: Spacing.three, gap: Spacing.two,
  },
  rewardTitle:   { fontSize: 14, fontWeight: '800', color: C.gold },
  rewardSub:     { fontSize: 12, color: C.gold + 'cc', marginTop: 2 },
  rewardBtn: {
    backgroundColor: C.gold, borderRadius: C.radius.pill,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  rewardBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  rewardToast: {
    backgroundColor: C.gold, borderRadius: C.radius.lg,
    padding: Spacing.two, alignItems: 'center',
  },
  rewardToastText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Ranking
  rankCard: {
    borderRadius: C.radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: Spacing.three, gap: Spacing.two,
  },
  rankRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  rankRowMe:     { backgroundColor: C.purple + '12' },
  rankPos:       { fontSize: 18, width: 28, textAlign: 'center' },
  rankAvatar:    { fontSize: 18 },
  rankName:      { flex: 1, fontSize: 14 },
  rankScore:     { fontSize: 14, fontWeight: '800', color: C.purple },
  rankEmpty:     { textAlign: 'center', fontSize: 13, lineHeight: 20, padding: Spacing.three },

  // Guest hero
  loggedOutHero: { alignItems: 'center', paddingTop: Spacing.four, gap: Spacing.two },
  heroLogo: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.one, shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  heroLogoText: { color: '#fff', fontSize: 32 },
  heroDesc:     { fontSize: 14, lineHeight: 20 },

  authButtons: { gap: Spacing.two },
  primaryBtn: {
    backgroundColor: C.purple, paddingVertical: 14, borderRadius: C.radius.pill,
    alignItems: 'center', shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: C.purple + '88',
    paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: C.purple, letterSpacing: 1.0 },
});
