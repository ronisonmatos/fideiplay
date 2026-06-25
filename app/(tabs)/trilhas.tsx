import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GuestBanner } from '@/components/guest-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { TRILHAS } from '@/data/trilhas';
import { useTheme } from '@/hooks/use-theme';

const STORAGE_KEY = '@santosplay:trilhas_progresso';

interface Progresso {
  licoesConcluidas: string[];
  xpTotal: number;
}

const TRILHAS_GRATIS = TRILHAS.filter(t => t.gratis);
const TRILHAS_PREMIUM = TRILHAS.filter(t => !t.gratis);

export default function TrilhasScreen() {
  const theme = useTheme();
  const { trilhasDesbloqueadas, refreshTrilhas } = useAuth();
  const [progresso,  setProgresso]  = useState<Progresso>({ licoesConcluidas: [], xpTotal: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setProgresso(JSON.parse(raw));
    await refreshTrilhas().catch(() => {});
  }, [refreshTrilhas]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const trilhasAcessiveis = [
    ...TRILHAS_GRATIS,
    ...TRILHAS_PREMIUM.filter(t => trilhasDesbloqueadas.includes(t.id)),
  ];

  const totalLicoesAcessiveis = trilhasAcessiveis.reduce((sum, t) => sum + t.totalLicoes, 0);
  const totalConcluidas = progresso.licoesConcluidas.length;
  const progressoGeral = totalLicoesAcessiveis > 0 ? totalConcluidas / totalLicoesAcessiveis : 0;

  function licoesDaTrilha(trilhaId: number) {
    return progresso.licoesConcluidas.filter(k => k.startsWith(`${trilhaId}-`)).length;
  }

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

          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>TRILHAS</ThemedText>
              <ThemedText style={[styles.title, { color: theme.text }]}>Bom estudo! 📖</ThemedText>
            </View>
            {progresso.xpTotal > 0 && (
              <View style={[styles.xpBadge, { backgroundColor: C.gold + '22', borderColor: C.gold + '55' }]}>
                <ThemedText style={styles.xpText}>✨ {progresso.xpTotal} XP</ThemedText>
              </View>
            )}
          </View>

          {/* Progresso geral */}
          <View style={[styles.progressCard, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
            <View style={styles.progressTop}>
              <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>PROGRESSO GERAL</ThemedText>
              <ThemedText style={[styles.progressCount, { color: C.purple }]}>
                {totalConcluidas}/{totalLicoesAcessiveis} lições
              </ThemedText>
            </View>
            <View style={[styles.barBg, { backgroundColor: C.purple + '22' }]}>
              <View style={[styles.barFill, { width: `${progressoGeral * 100}%`, backgroundColor: C.purple }]} />
            </View>
          </View>

          {/* Trilhas disponíveis (gratuitas) */}
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>DISPONÍVEIS</ThemedText>
          {TRILHAS_GRATIS.map(trilha => {
            const concluidas = licoesDaTrilha(trilha.id);
            const pct = trilha.totalLicoes > 0 ? concluidas / trilha.totalLicoes : 0;
            return (
              <TouchableOpacity
                key={trilha.id}
                onPress={() => router.push(`/trilha-detalhe?id=${trilha.id}`)}
                activeOpacity={0.82}
                style={[styles.trilhaCard, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
                <View style={styles.trilhaTop}>
                  <ThemedText style={styles.trilhaIcon}>{trilha.icone}</ThemedText>
                  <View style={styles.trilhaInfo}>
                    <View style={styles.trilhaTitleRow}>
                      <ThemedText style={[styles.trilhaTitulo, { color: theme.text }]}>{trilha.titulo}</ThemedText>
                      <View style={[styles.badge, { backgroundColor: C.green + '22', borderColor: C.green + '55' }]}>
                        <ThemedText style={[styles.badgeText, { color: C.green }]}>Gratuita</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.trilhaDesc, { color: theme.textSecondary }]}>{trilha.descricao}</ThemedText>
                    <ThemedText style={[styles.trilhaMeta, { color: theme.textSecondary }]}>
                      {trilha.nivel} · {concluidas}/{trilha.totalLicoes} lições · {trilha.xpTotal} XP
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.barBg, { backgroundColor: C.purple + '22', marginTop: Spacing.two }]}>
                  <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: C.purple }]} />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Trilhas premium */}
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.two }]}>PREMIUM</ThemedText>
          {TRILHAS_PREMIUM.map(trilha => {
            const desbloqueada = trilhasDesbloqueadas.includes(trilha.id);
            const concluidas = licoesDaTrilha(trilha.id);
            const pct = trilha.totalLicoes > 0 ? concluidas / trilha.totalLicoes : 0;

            if (desbloqueada) {
              return (
                <TouchableOpacity
                  key={trilha.id}
                  onPress={() => router.push(`/trilha-detalhe?id=${trilha.id}`)}
                  activeOpacity={0.82}
                  style={[styles.trilhaCard, { backgroundColor: theme.backgroundElement, borderColor: C.green + '55' }]}>
                  <View style={styles.trilhaTop}>
                    <ThemedText style={styles.trilhaIcon}>{trilha.icone}</ThemedText>
                    <View style={styles.trilhaInfo}>
                      <View style={styles.trilhaTitleRow}>
                        <ThemedText style={[styles.trilhaTitulo, { color: theme.text }]}>{trilha.titulo}</ThemedText>
                        <View style={[styles.badge, { backgroundColor: C.green + '22', borderColor: C.green + '55' }]}>
                          <ThemedText style={[styles.badgeText, { color: C.green }]}>✓ Desbloqueada</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.trilhaDesc, { color: theme.textSecondary }]}>{trilha.descricao}</ThemedText>
                      <ThemedText style={[styles.trilhaMeta, { color: theme.textSecondary }]}>
                        {trilha.nivel} · {concluidas}/{trilha.totalLicoes} lições · {trilha.xpTotal} XP
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: C.purple + '22', marginTop: Spacing.two }]}>
                    <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: C.purple }]} />
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={trilha.id}
                onPress={() => router.push(
                  `/pagamento?trilhaId=${trilha.id}&titulo=${encodeURIComponent(trilha.titulo)}&preco=${trilha.preco ?? 9.90}`
                )}
                activeOpacity={0.75}
                style={[styles.trilhaCard, styles.trilhaLocked, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
                <View style={styles.trilhaTop}>
                  <ThemedText style={[styles.trilhaIcon, styles.lockedOpacity]}>{trilha.icone}</ThemedText>
                  <View style={styles.trilhaInfo}>
                    <View style={styles.trilhaTitleRow}>
                      <ThemedText style={[styles.trilhaTitulo, { color: theme.text }, styles.lockedOpacity]}>{trilha.titulo}</ThemedText>
                      <View style={[styles.badge, { backgroundColor: C.gold + '22', borderColor: C.gold + '55' }]}>
                        <ThemedText style={[styles.badgeText, { color: C.gold }]}>⭐ Premium</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={[styles.trilhaDesc, { color: theme.textSecondary }, styles.lockedOpacity]}>{trilha.descricao}</ThemedText>
                    <ThemedText style={[styles.trilhaMeta, { color: theme.textSecondary }, styles.lockedOpacity]}>
                      {trilha.nivel} · {trilha.totalLicoes} lições · R$ {trilha.preco?.toFixed(2).replace('.', ',')}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

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
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: 0.2, marginTop: 2 },
  xpBadge: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  xpText: { fontSize: 14, fontWeight: '700', color: C.gold },
  progressCard: {
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  progressCount: { fontSize: 14, fontWeight: '800' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  trilhaCard: {
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
  },
  trilhaLocked: { opacity: 0.7 },
  lockedOpacity: { opacity: 0.5 },
  trilhaTop: { flexDirection: 'row', gap: Spacing.two },
  trilhaIcon: { fontSize: 36, lineHeight: 44 },
  trilhaInfo: { flex: 1, gap: 3 },
  trilhaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  trilhaTitulo: { fontSize: 16, fontWeight: '800' },
  trilhaDesc: { fontSize: 13, lineHeight: 18 },
  trilhaMeta: { fontSize: 12 },
  badge: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
