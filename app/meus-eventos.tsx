import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { ALCANCE_LABELS } from '@/constants/eventos-precos';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { listMeusEventos, type EventoPatrocinado } from '@/lib/eventos-patrocinados';

const STATUS_BADGE: Record<EventoPatrocinado['status'], { label: string; emoji: string; color: string }> = {
  aguardando_pagamento: { label: 'Aguardando pagamento', emoji: '🟠', color: C.gold },
  aguardando_aprovacao: { label: 'Em análise',           emoji: '🟡', color: C.gold },
  aprovado:             { label: 'No ar',                emoji: '🟢', color: C.green },
  ativo:                { label: 'No ar',                emoji: '🟢', color: C.green },
  rejeitado:            { label: 'Rejeitado',            emoji: '🔴', color: C.red },
  encerrado:            { label: 'Encerrado',            emoji: '⚫', color: '#8a8a9a' },
};

function formatBR(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function MeusEventosScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [eventos, setEventos] = useState<EventoPatrocinado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setEventos(await listMeusEventos(user.id));
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
  }, [load]);

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ThemedText style={{ fontSize: 22 }}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Meus eventos</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} colors={[C.purple]} />}>

          <TouchableOpacity style={s.novoBtn} onPress={() => router.push('/evento-patrocinado')} activeOpacity={0.85}>
            <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>🎪 Divulgar novo evento</ThemedText>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color={C.purple} style={{ paddingVertical: 32 }} />
          ) : eventos.length === 0 ? (
            <View style={s.emptyWrap}>
              <ThemedText style={{ fontSize: 40, lineHeight: 52 }}>🎪</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.center}>
                Você ainda não divulgou nenhum evento.
              </ThemedText>
            </View>
          ) : (
            eventos.map(evento => {
              const badge = STATUS_BADGE[evento.status];
              const noAr = evento.status === 'aprovado' || evento.status === 'ativo';
              return (
                <ThemedView key={evento.id} type="backgroundElement" style={s.card}>
                  <View style={s.cardTop}>
                    <ThemedText style={{ fontWeight: '800', fontSize: 15, flex: 1 }} numberOfLines={1}>
                      {evento.titulo}
                    </ThemedText>
                    <View style={[s.badge, { backgroundColor: badge.color + '22' }]}>
                      <ThemedText style={{ fontSize: 11, fontWeight: '800', color: badge.color }}>
                        {badge.emoji} {badge.label}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {ALCANCE_LABELS[evento.alcance]} · {evento.periodo} dias
                  </ThemedText>

                  {evento.imagem_url ? (
                    <Image source={{ uri: evento.imagem_url }} style={s.thumb} resizeMode="cover" />
                  ) : null}

                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {evento.exibicao_inicio && evento.exibicao_fim
                      ? `Exibição: ${formatBR(evento.exibicao_inicio)} até ${formatBR(evento.exibicao_fim)}`
                      : 'Período de exibição definido após a aprovação'}
                  </ThemedText>

                  {evento.status === 'rejeitado' && evento.motivo_rejeicao && (
                    <View style={[s.motivoBox, { backgroundColor: C.red + '12', borderColor: C.red + '33' }]}>
                      <ThemedText style={{ color: C.red, fontSize: 12 }}>Motivo: {evento.motivo_rejeicao}</ThemedText>
                    </View>
                  )}

                  {noAr && (
                    <View style={s.statsRow}>
                      <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                        👁️ {evento.impressoes} impressões
                      </ThemedText>
                      <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                        👆 {evento.cliques} cliques
                      </ThemedText>
                    </View>
                  )}
                </ThemedView>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  center: { textAlign: 'center' },
  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingTop: 60, paddingHorizontal: Spacing.four },

  novoBtn: { backgroundColor: C.purple, paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center' },

  card: { borderRadius: C.radius.lg, padding: Spacing.three, gap: 6, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },
  thumb: { width: '100%', height: 100, borderRadius: C.radius.md },
  motivoBox: { padding: Spacing.two, borderRadius: 10, borderWidth: 1 },
  statsRow: { flexDirection: 'row', gap: Spacing.three, marginTop: 2 },
});
