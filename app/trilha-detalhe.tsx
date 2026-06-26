import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { TRILHAS } from '@/data/trilhas';
import { useTheme } from '@/hooks/use-theme';

const STORAGE_KEY = '@santosplay:trilhas_progresso';

interface Progresso {
  licoesConcluidas: string[];
  xpTotal: number;
}

export default function TrilhaDetalheScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const trilha = TRILHAS.find(t => t.id === Number(id));
  const [progresso, setProgresso] = useState<Progresso>({ licoesConcluidas: [], xpTotal: 0 });

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then(raw => {
        if (raw) setProgresso(JSON.parse(raw));
      });
    }, []),
  );

  if (!trilha) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>← Voltar</ThemedText>
          </TouchableOpacity>
          <ThemedText style={{ textAlign: 'center', marginTop: 40 }}>Trilha não encontrada.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const chavesDaConcluidas = new Set(
    progresso.licoesConcluidas.filter(k => k.startsWith(`${trilha.id}-`)).map(k => Number(k.split('-')[1])),
  );
  const concluidas = chavesDaConcluidas.size;
  const pct = trilha.totalLicoes > 0 ? concluidas / trilha.totalLicoes : 0;
  const xpGanho = concluidas * 80;

  const proximaLicaoId = trilha.licoes.find(l => !chavesDaConcluidas.has(l.id))?.id ?? null;

  function statusLicao(licaoId: number): 'concluida' | 'atual' | 'bloqueada' {
    if (chavesDaConcluidas.has(licaoId)) return 'concluida';
    if (licaoId === proximaLicaoId) return 'atual';
    return 'bloqueada';
  }

  function navegar(licaoId: number) {
    const status = statusLicao(licaoId);
    if (status === 'bloqueada') return;
    router.push(`/licao?trilhaId=${trilha!.id}&licaoId=${licaoId}`);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: BottomTabInset + 100 }]}>

          {/* Header card */}
          <View style={[styles.headerCard, { backgroundColor: C.purple + '18', borderColor: C.purple + '55' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ThemedText style={styles.backText}>←</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.headerIcon}>{trilha.icone}</ThemedText>
            <ThemedText style={[styles.headerTitulo, { color: theme.text }]}>{trilha.titulo}</ThemedText>
            <ThemedText style={[styles.headerDesc, { color: theme.textSecondary }]}>{trilha.descricao}</ThemedText>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: C.purple }]}>{trilha.totalLicoes}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Lições</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: C.border }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: C.gold }]}>{xpGanho}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>XP ganho</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: C.border }]} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statValue, { color: C.green }]}>{concluidas}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Concluídas</ThemedText>
              </View>
            </View>

            {/* Barra de progresso */}
            <View style={[styles.barBg, { backgroundColor: C.purple + '33' }]}>
              <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
            </View>
            <ThemedText style={[styles.pctText, { color: theme.textSecondary }]}>
              {Math.round(pct * 100)}% completo
            </ThemedText>
          </View>

          {/* Lista de lições */}
          <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>LIÇÕES</ThemedText>
          <View style={styles.licoesList}>
            {trilha.licoes.map((licao, idx) => {
              const status = statusLicao(licao.id);
              const isAtual = status === 'atual';
              const isConcluida = status === 'concluida';
              const isBloqueada = status === 'bloqueada';

              return (
                <TouchableOpacity
                  key={licao.id}
                  onPress={() => navegar(licao.id)}
                  activeOpacity={isBloqueada ? 1 : 0.8}
                  style={[
                    styles.licaoCard,
                    { backgroundColor: theme.backgroundElement, borderColor: C.border },
                    isAtual && { backgroundColor: C.purple + '22', borderColor: C.purple },
                    isBloqueada && { opacity: 0.45 },
                  ]}>
                  <View style={[styles.licaoNum, {
                    backgroundColor: isConcluida ? C.green + '22' : isAtual ? C.purple + '33' : '#ffffff11',
                    borderColor: isConcluida ? C.green : isAtual ? C.purple : C.border,
                  }]}>
                    <ThemedText style={[styles.licaoNumText, {
                      color: isConcluida ? C.green : isAtual ? C.purple : theme.textSecondary,
                    }]}>
                      {isConcluida ? '✓' : isBloqueada ? '🔒' : idx + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.licaoInfo}>
                    <ThemedText style={[styles.licaoTitulo, {
                      color: theme.text,
                      fontWeight: isAtual ? '800' : '600',
                    }]}>
                      {isAtual ? '▶ ' : ''}{licao.titulo}
                    </ThemedText>
                    <ThemedText style={[styles.licaoVersiculo, { color: theme.textSecondary }]}>
                      {licao.versiculo}
                    </ThemedText>
                  </View>
                  <View style={[styles.xpBadge, { backgroundColor: C.gold + '22' }]}>
                    <ThemedText style={styles.xpText}>+{licao.xp} XP</ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>

        {/* CTA fixo */}
        {proximaLicaoId !== null && (
          <View style={[styles.ctaWrapper, { backgroundColor: theme.background }]}>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: C.purple }]}
              onPress={() => router.push(`/licao?trilhaId=${trilha.id}&licaoId=${proximaLicaoId}`)}
              activeOpacity={0.85}>
              <ThemedText style={styles.ctaText}>CONTINUAR TRILHA</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        {proximaLicaoId === null && concluidas === trilha.totalLicoes && (
          <View style={[styles.ctaWrapper, { backgroundColor: theme.background }]}>
            <View style={[styles.ctaBtn, { backgroundColor: C.green }]}>
              <ThemedText style={styles.ctaText}>✅ TRILHA CONCLUÍDA</ThemedText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  backBtn: { alignSelf: 'flex-start', marginBottom: Spacing.two, padding: Spacing.two },
  backText: { fontSize: 22, fontWeight: '700', color: C.purple },
  headerCard: {
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1.5,
    gap: Spacing.two,
    alignItems: 'center',
  },
  headerIcon: { fontSize: 48, lineHeight: 60 },
  headerTitulo: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  headerDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: 4 },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.purple },
  pctText: { fontSize: 12, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.3 },
  licoesList: { gap: Spacing.two },
  licaoCard: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  licaoNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  licaoNumText: { fontSize: 16, fontWeight: '800' },
  licaoInfo: { flex: 1, gap: 2 },
  licaoTitulo: { fontSize: 14, lineHeight: 20 },
  licaoVersiculo: { fontSize: 12 },
  xpBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  xpText: { color: C.gold, fontSize: 12, fontWeight: '700' },
  ctaWrapper: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ctaBtn: {
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
});
