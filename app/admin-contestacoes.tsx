import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AvatarImage } from '@/components/avatar-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type FilterStatus = 'pending' | 'approved' | 'rejected';

interface Contest {
  id: string;
  user_id: string;
  room_id: string | null;
  category_key: string;
  letter: string;
  answer: string;
  original_result: string;
  game_mode: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  profiles: {
    name: string;
    avatar_emoji: string;
  } | null;
}

const RESULT_LABEL: Record<string, string> = {
  invalid:    'Inválida (banco)',
  ai_invalid: 'Não reconhecida (IA)',
  unverified: 'Não verificada',
};

const RESULT_ICON: Record<string, string> = {
  invalid:    '❌',
  ai_invalid: '🤖',
  unverified: '⏳',
};

const STATUS_COLOR: Record<string, string> = {
  pending:  C.gold,
  approved: C.green,
  rejected: C.red,
};

const STATUS_LABEL: Record<string, string> = {
  pending:  'Pendente',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

const STATUS_ICON: Record<string, string> = {
  pending:  '⏳',
  approved: '✅',
  rejected: '❌',
};

export default function AdminContestacoesScreen() {
  const theme   = useTheme();
  const { user, profile } = useAuth();

  const [filter,     setFilter]     = useState<FilterStatus>('pending');
  const [contests,   setContests]   = useState<Contest[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [acting,     setActing]     = useState<string | null>(null);

  // Todos os hooks ANTES do return condicional (regra dos hooks)
  const fetchContests = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from('stop_contests')
      .select('*, profiles(name, avatar_emoji)')
      .eq('status', filter)
      .order('created_at', { ascending: filter === 'pending' })
      .limit(50);

    if (!error && data) setContests(data as Contest[]);
    setLoading(false);
    setRefreshing(false);
  }, [filter, profile?.is_admin]);

  useEffect(() => {
    if (profile?.is_admin) fetchContests();
  }, [fetchContests, profile?.is_admin]);

  const handleApprove = useCallback(async (contest: Contest) => {
    Alert.alert(
      'Aprovar contestação?',
      `"${contest.answer}" em ${contest.category_key.toUpperCase()} (letra ${contest.letter}) — o jogador receberá 10 pts.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            setActing(contest.id);
            try {
              await supabase
                .from('stop_contests')
                .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
                .eq('id', contest.id);

              await supabase.rpc('add_coins', {
                p_user_id: contest.user_id,
                p_amount: 10,
                p_motivo: 'stop_contest_approved',
              });

              try {
                await supabase.from('notifications').insert({
                  user_id: contest.user_id,
                  title:   '✅ Contestação aprovada!',
                  body:    `Sua palavra "${contest.answer}" (${contest.letter} — ${contest.category_key}) foi aprovada. +10 🪙`,
                });
              } catch { /* notificação é best-effort */ }

              setContests(prev => prev.filter(c => c.id !== contest.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível processar. Tente novamente.');
            } finally {
              setActing(null);
            }
          },
        },
      ],
    );
  }, [user]);

  const handleReject = useCallback(async (contest: Contest) => {
    Alert.alert(
      'Rejeitar contestação?',
      `"${contest.answer}" permanecerá inválida. Nenhum ponto será concedido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            setActing(contest.id);
            try {
              await supabase
                .from('stop_contests')
                .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
                .eq('id', contest.id);

              try {
                await supabase.from('notifications').insert({
                  user_id: contest.user_id,
                  title:   '❌ Contestação rejeitada',
                  body:    `Sua palavra "${contest.answer}" (${contest.letter} — ${contest.category_key}) não foi aceita desta vez.`,
                });
              } catch { /* notificação é best-effort */ }

              setContests(prev => prev.filter(c => c.id !== contest.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível processar. Tente novamente.');
            } finally {
              setActing(null);
            }
          },
        },
      ],
    );
  }, [user]);

  // Gate: só admin
  if (!profile?.is_admin) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={[s.header, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
              <ThemedText style={{ fontSize: 26, color: theme.text }}>←</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[s.headerTitle, { color: theme.text }]}>Admin</ThemedText>
            <View style={{ width: 44 }} />
          </View>
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 48 }}>🔒</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Acesso restrito</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
              Esta área é exclusiva para administradores.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <ThemedText style={{ fontSize: 26, color: theme.text }}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Contestações Stop</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        {/* Filtros */}
        <View style={[s.filterRow, { borderBottomColor: C.border }]}>
          {(['pending', 'approved', 'rejected'] as FilterStatus[]).map(f => {
            const active = filter === f;
            const color  = active ? STATUS_COLOR[f] : theme.textSecondary;
            return (
              <TouchableOpacity
                key={f}
                style={[s.filterBtn, active && { borderBottomWidth: 2, borderBottomColor: STATUS_COLOR[f] }]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}>
                <ThemedText style={{ fontSize: 18, lineHeight: 22 }}>{STATUS_ICON[f]}</ThemedText>
                <ThemedText style={[s.filterTxt, { color }]}>{STATUS_LABEL[f]}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={s.centerFlex}>
            <ActivityIndicator color={C.purple} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.scroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchContests(true); }}
                tintColor={C.purple}
              />
            }>
            {contests.length === 0 ? (
              <View style={s.emptyWrap}>
                <View style={[s.emptyIconWrap, { backgroundColor: STATUS_COLOR[filter] + '18' }]}>
                  <ThemedText style={s.emptyIcon}>{STATUS_ICON[filter]}</ThemedText>
                </View>
                <ThemedText type="smallBold" style={[s.center, { color: STATUS_COLOR[filter] }]}>
                  {filter === 'pending'  ? 'Nenhuma pendente'  :
                   filter === 'approved' ? 'Nenhuma aprovada'  : 'Nenhuma rejeitada'}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
                  {filter === 'pending'
                    ? 'Todas as contestações já foram revisadas.'
                    : 'Nenhuma contestação encontrada neste filtro.'}
                </ThemedText>
              </View>
            ) : contests.map(c => {
              const isActing = acting === c.id;
              const statusColor = STATUS_COLOR[c.status] ?? theme.textSecondary;

              return (
                <ThemedView key={c.id} type="backgroundElement" style={s.card}>
                  {/* Jogador */}
                  <View style={s.playerRow}>
                    <AvatarImage value={c.profiles?.avatar_emoji ?? '👤'} size={36} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {c.profiles?.name ?? 'Usuário desconhecido'}
                      </ThemedText>
                      <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                        {c.game_mode === 'online' ? '🌐 Online' : '🎲 Solo'} · {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </ThemedText>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
                      <ThemedText style={[s.statusTxt, { color: statusColor }]}>
                        {STATUS_ICON[c.status]} {STATUS_LABEL[c.status]}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Resposta */}
                  <View style={[s.answerBox, { backgroundColor: theme.background }]}>
                    <View style={s.answerMeta}>
                      {/* Letra */}
                      <View style={[s.letterCircle, { backgroundColor: C.purple }]}>
                        <ThemedText style={s.letterTxt}>{c.letter}</ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          {c.category_key}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>
                          {c.answer}
                        </ThemedText>
                      </View>
                      {/* Ícone do resultado original */}
                      <View style={[s.resultIconWrap, { backgroundColor: theme.backgroundElement }]}>
                        <ThemedText style={s.resultIcon}>
                          {RESULT_ICON[c.original_result] ?? '❓'}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[s.verdictBadge, { backgroundColor: statusColor + '1A' }]}>
                      <ThemedText style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
                        Sistema: {RESULT_LABEL[c.original_result] ?? c.original_result}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Ações — só para pendentes */}
                  {c.status === 'pending' && (
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={[s.rejectBtn, isActing && { opacity: 0.5 }]}
                        disabled={isActing}
                        activeOpacity={0.8}
                        onPress={() => handleReject(c)}>
                        {isActing
                          ? <ActivityIndicator size="small" color={C.red} />
                          : <ThemedText style={s.rejectTxt}>❌  Rejeitar</ThemedText>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.approveBtn, isActing && { opacity: 0.5 }]}
                        disabled={isActing}
                        activeOpacity={0.8}
                        onPress={() => handleApprove(c)}>
                        {isActing
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <ThemedText style={s.approveTxt}>✅  Aprovar  +10 🪙</ThemedText>}
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Data revisão */}
                  {c.reviewed_at && (
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 10, textAlign: 'right', marginTop: 4 }}>
                      Revisado em {new Date(c.reviewed_at).toLocaleDateString('pt-BR')}
                    </ThemedText>
                  )}
                </ThemedView>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:       { flex: 1 },
  center:     { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: 1, minHeight: 56,
  },
  backBtn:     { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },

  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  filterTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  scroll:    { padding: Spacing.three, gap: Spacing.two },
  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingTop: 60, paddingHorizontal: Spacing.four },
  emptyIconWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyIcon: { fontSize: 40, lineHeight: 52 },

  card: { borderRadius: C.radius.lg, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: C.border },

  playerRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },
  statusTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  answerBox:  { borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.one },
  answerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },

  letterCircle: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  letterTxt: {
    fontSize: 24, fontWeight: '900', color: '#fff',
    includeFontPadding: false,
  },

  resultIconWrap: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  resultIcon: { fontSize: 20 },

  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },

  actionRow:  { flexDirection: 'row', gap: Spacing.two, marginTop: 4 },
  rejectBtn:  { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5, borderColor: C.red + '88' },
  rejectTxt:  { fontSize: 13, fontWeight: '800', color: C.red },
  approveBtn: { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', backgroundColor: C.green },
  approveTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
