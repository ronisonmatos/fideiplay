import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { AvatarImage } from '@/components/avatar-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { TRILHAS } from '@/data/trilhas';
import {
  type AdminUserResult,
  listUserTrilhas,
  revokeTrilha,
  searchUsers,
  unlockTrilha,
} from '@/lib/admin-trilhas';

const TRILHAS_PREMIUM = TRILHAS.filter(t => !t.gratis);

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AdminSection   = 'contests' | 'support' | 'trilhas';
type FilterStatus   = 'pending' | 'approved' | 'rejected';
type SupportFilter  = 'unread' | 'all';

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
  profiles: { name: string; avatar_emoji: string } | null;
}

interface SupportMsg {
  id: string;
  user_id: string | null;
  email: string | null;
  message: string;
  created_at: string;
  read: boolean;
  reply: string | null;
  replied_at: string | null;
}

// ─── Labels / ícones ──────────────────────────────────────────────────────────

const RESULT_LABEL: Record<string, string> = {
  invalid:    'Inválida (banco)',
  ai_invalid: 'Não reconhecida (IA)',
  unverified: 'Não verificada',
};
const RESULT_ICON: Record<string, string> = {
  invalid: '❌', ai_invalid: '🤖', unverified: '⏳',
};
const STATUS_COLOR: Record<string, string> = {
  pending: C.gold, approved: C.green, rejected: C.red,
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada',
};
const STATUS_ICON: Record<string, string> = {
  pending: '⏳', approved: '✅', rejected: '❌',
};

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function AdminTab() {
  const theme = useTheme();
  const { user, profile } = useAuth();

  const [section, setSection] = useState<AdminSection>('contests');

  // ── Estado: Contestações ──────────────────────────────────────────────────
  const [filter,     setFilter]     = useState<FilterStatus>('pending');
  const [contests,   setContests]   = useState<Contest[]>([]);
  const [cLoading,   setCLoading]   = useState(false);
  const [cRefresh,   setCRefresh]   = useState(false);
  const [acting,     setActing]     = useState<string | null>(null);
  const [cError,     setCError]     = useState<string | null>(null);

  // ── Estado: Suporte ───────────────────────────────────────────────────────
  const [sfilt,      setSfilt]      = useState<SupportFilter>('unread');
  const [msgs,       setMsgs]       = useState<SupportMsg[]>([]);
  const [sLoading,   setSLoading]   = useState(false);
  const [sRefresh,   setSRefresh]   = useState(false);
  const [sError,     setSError]     = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [replyText,  setReplyText]  = useState('');
  const [sending,    setSending]    = useState<string | null>(null);

  // ── Estado: Trilhas (busca de usuário + liberação manual) ────────────────
  const [uQuery,       setUQuery]       = useState('');
  const [uResults,     setUResults]     = useState<AdminUserResult[]>([]);
  const [uLoading,     setULoading]     = useState(false);
  const [uError,       setUError]       = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserResult | null>(null);
  const [userTrilhas,  setUserTrilhas]  = useState<Set<number>>(new Set());
  const [tLoading,     setTLoading]     = useState(false);
  const [toggling,     setToggling]     = useState<number | null>(null);

  // ── Fetch: Contestações ───────────────────────────────────────────────────
  const fetchContests = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setCLoading(true);
    setCError(null);
    const { data, error } = await supabase
      .from('stop_contests')
      .select('*, profiles!user_id(name, avatar_emoji)')
      .eq('status', filter)
      .order('created_at', { ascending: filter === 'pending' })
      .limit(50);
    if (error) setCError(error.message);
    else setContests((data ?? []) as Contest[]);
    setCLoading(false);
    setCRefresh(false);
  }, [filter, profile?.is_admin]);

  // ── Fetch: Suporte ────────────────────────────────────────────────────────
  const fetchSupport = useCallback(async (silent = false) => {
    if (!profile?.is_admin) return;
    if (!silent) setSLoading(true);
    setSError(null);
    let q = supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);
    if (sfilt === 'unread') q = q.eq('read', false);
    const { data, error } = await q;
    if (error) setSError(error.message);
    else setMsgs((data ?? []) as SupportMsg[]);
    setSLoading(false);
    setSRefresh(false);
  }, [sfilt, profile?.is_admin]);

  // Recarrega ao focar a aba
  useFocusEffect(useCallback(() => {
    if (section === 'contests') fetchContests();
    else fetchSupport();
  }, [section, fetchContests, fetchSupport]));

  // ── Ações: Contestações ───────────────────────────────────────────────────
  const handleApprove = useCallback(async (c: Contest) => {
    Alert.alert(
      'Aprovar contestação?',
      `"${c.answer}" em ${c.category_key.toUpperCase()} (letra ${c.letter}) — o jogador receberá 10 pts.`,
      [{ text: 'Cancelar', style: 'cancel' }, {
        text: 'Aprovar',
        onPress: async () => {
          setActing(c.id);
          try {
            await supabase.from('stop_contests')
              .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
              .eq('id', c.id);
            await supabase.rpc('add_coins', { p_user_id: c.user_id, p_amount: 10, p_motivo: 'stop_contest_approved' });

            // Adiciona a palavra ao banco do Stop
            const word = c.answer.trim();
            const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
            await supabase.from('stop_word_bank').upsert(
              { category: c.category_key, letter: c.letter.toUpperCase(), word: capitalizedWord },
              { onConflict: 'category,letter,word', ignoreDuplicates: true },
            );

            try {
              await supabase.from('notifications').insert({
                user_id: c.user_id,
                title: '✅ Contestação aprovada!',
                body: `Sua palavra "${c.answer}" (${c.letter} — ${c.category_key}) foi aprovada e adicionada ao banco. +10 🪙`,
              });
            } catch { /* best-effort */ }
            setContests(prev => prev.filter(x => x.id !== c.id));
          } catch { Alert.alert('Erro', 'Não foi possível processar. Tente novamente.'); }
          finally { setActing(null); }
        },
      }],
    );
  }, [user]);

  const handleReject = useCallback(async (c: Contest) => {
    Alert.alert(
      'Rejeitar contestação?',
      `"${c.answer}" permanecerá inválida. Nenhum ponto será concedido.`,
      [{ text: 'Cancelar', style: 'cancel' }, {
        text: 'Rejeitar', style: 'destructive',
        onPress: async () => {
          setActing(c.id);
          try {
            await supabase.from('stop_contests')
              .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
              .eq('id', c.id);
            try {
              await supabase.from('notifications').insert({
                user_id: c.user_id,
                title: '❌ Contestação rejeitada',
                body: `Sua palavra "${c.answer}" (${c.letter} — ${c.category_key}) não foi aceita desta vez.`,
              });
            } catch { /* best-effort */ }
            setContests(prev => prev.filter(x => x.id !== c.id));
          } catch { Alert.alert('Erro', 'Não foi possível processar. Tente novamente.'); }
          finally { setActing(null); }
        },
      }],
    );
  }, [user]);

  // ── Ações: Suporte ────────────────────────────────────────────────────────
  const handleSendReply = useCallback(async (msg: SupportMsg) => {
    const text = replyText.trim();
    if (!text) return;
    setSending(msg.id);
    try {
      await supabase.from('support_messages').update({
        reply: text,
        replied_at: new Date().toISOString(),
        replied_by: user!.id,
        read: true,
      }).eq('id', msg.id);

      // Notifica o usuário no app (se tiver conta)
      if (msg.user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: msg.user_id,
            title: '💬 Resposta do suporte',
            body: text.length > 100 ? text.slice(0, 97) + '…' : text,
          });
        } catch { /* best-effort */ }
      }

      setMsgs(prev => prev.map(m =>
        m.id === msg.id ? { ...m, read: true, reply: text, replied_at: new Date().toISOString() } : m,
      ));
      setExpanded(null);
      setReplyText('');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a resposta.');
    } finally {
      setSending(null);
    }
  }, [user, replyText]);

  const handleMarkRead = useCallback(async (id: string) => {
    await supabase.from('support_messages').update({ read: true }).eq('id', id);
    setMsgs(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }, []);

  const handleDeleteMsg = useCallback((id: string) => {
    Alert.alert(
      'Excluir mensagem?',
      'A mensagem será removida permanentemente do banco de dados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('support_messages').delete().eq('id', id);
            if (error) {
              Alert.alert('Erro', 'Não foi possível excluir a mensagem.');
            } else {
              setMsgs(prev => prev.filter(m => m.id !== id));
            }
          },
        },
      ],
    );
  }, []);

  // ── Ações: Trilhas ────────────────────────────────────────────────────────
  const handleSearchUsers = useCallback(async () => {
    const q = uQuery.trim();
    if (!q) return;
    setULoading(true);
    setUError(null);
    const { data, error } = await searchUsers(q);
    if (error) setUError(error);
    setUResults(data);
    setULoading(false);
  }, [uQuery]);

  const handleSelectUser = useCallback(async (u: AdminUserResult) => {
    setSelectedUser(u);
    setUserTrilhas(new Set());
    setTLoading(true);
    const { trilhaIds, error } = await listUserTrilhas(u.id);
    if (error) Alert.alert('Erro', error);
    setUserTrilhas(trilhaIds);
    setTLoading(false);
  }, []);

  const handleBackToSearch = useCallback(() => {
    setSelectedUser(null);
    setUserTrilhas(new Set());
  }, []);

  const handleToggleTrilha = useCallback(async (trilhaId: number, currentlyUnlocked: boolean) => {
    if (!selectedUser) return;
    setToggling(trilhaId);
    const { ok, error } = currentlyUnlocked
      ? await revokeTrilha(selectedUser.id, trilhaId)
      : await unlockTrilha(selectedUser.id, trilhaId);
    if (ok) {
      setUserTrilhas(prev => {
        const next = new Set(prev);
        if (currentlyUnlocked) next.delete(trilhaId); else next.add(trilhaId);
        return next;
      });
    } else {
      Alert.alert('Erro', error ?? 'Não foi possível atualizar.');
    }
    setToggling(null);
  }, [selectedUser]);

  // ── Gate ──────────────────────────────────────────────────────────────────
  if (!profile?.is_admin) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 48, lineHeight: 56 }}>🔒</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Acesso restrito</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>

        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Admin</ThemedText>
        </View>

        {/* Seletor de seção */}
        <View style={[s.sectionRow, { borderBottomColor: C.border, backgroundColor: theme.backgroundElement }]}>
          {([
            { key: 'contests', label: 'Contestações', icon: '✋' },
            { key: 'support',  label: 'Suporte',       icon: '💬' },
            { key: 'trilhas',  label: 'Trilhas',       icon: '🔓' },
          ] as { key: AdminSection; label: string; icon: string }[]).map(({ key, label, icon }) => {
            const active = section === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.sectionBtn, active && { borderBottomWidth: 2.5, borderBottomColor: C.purple }]}
                onPress={() => setSection(key)}
                activeOpacity={0.7}>
                <ThemedText style={{ fontSize: 20, lineHeight: 24 }}>{icon}</ThemedText>
                <ThemedText style={[s.sectionTxt, { color: active ? C.purple : theme.textSecondary }]}>
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ══ SEÇÃO: CONTESTAÇÕES ══ */}
        {section === 'contests' && (
          <>
            {/* Sub-filtros */}
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
                    <ThemedText style={{ fontSize: 16, lineHeight: 20 }}>{STATUS_ICON[f]}</ThemedText>
                    <ThemedText style={[s.filterTxt, { color }]}>{STATUS_LABEL[f]}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {cLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : cError ? (
              <ErrorState message={cError} onRetry={() => fetchContests()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={cRefresh}
                    onRefresh={() => { setCRefresh(true); fetchContests(true); }}
                    tintColor={C.purple}
                  />
                }>
                {contests.length === 0 ? (
                  <EmptyState icon={STATUS_ICON[filter]} color={STATUS_COLOR[filter]}
                    title={filter === 'pending' ? 'Nenhuma pendente' : filter === 'approved' ? 'Nenhuma aprovada' : 'Nenhuma rejeitada'}
                    subtitle={filter === 'pending' ? 'Todas as contestações já foram revisadas.' : 'Nenhuma contestação encontrada neste filtro.'} />
                ) : contests.map(c => {
                  const isActing    = acting === c.id;
                  const statusColor = STATUS_COLOR[c.status] ?? theme.textSecondary;
                  return (
                    <ThemedView key={c.id} type="backgroundElement" style={s.card}>
                      <View style={s.playerRow}>
                        <AvatarImage value={c.profiles?.avatar_emoji ?? '👤'} size={36} />
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>{c.profiles?.name ?? 'Usuário desconhecido'}</ThemedText>
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

                      <View style={[s.answerBox, { backgroundColor: theme.background }]}>
                        <View style={s.answerMeta}>
                          <View style={[s.letterCircle, { backgroundColor: C.purple }]}>
                            <ThemedText style={s.letterTxt}>{c.letter}</ThemedText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              {c.category_key}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{c.answer}</ThemedText>
                          </View>
                          <View style={[s.resultIconWrap, { backgroundColor: theme.backgroundElement }]}>
                            <ThemedText style={{ fontSize: 20, lineHeight: 24 }}>{RESULT_ICON[c.original_result] ?? '❓'}</ThemedText>
                          </View>
                        </View>
                        <View style={[s.verdictBadge, { backgroundColor: statusColor + '1A' }]}>
                          <ThemedText style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
                            Sistema: {RESULT_LABEL[c.original_result] ?? c.original_result}
                          </ThemedText>
                        </View>
                      </View>

                      {c.status === 'pending' && (
                        <View style={s.actionRow}>
                          <TouchableOpacity style={[s.rejectBtn, isActing && { opacity: 0.5 }]} disabled={isActing} activeOpacity={0.8} onPress={() => handleReject(c)}>
                            {isActing ? <ActivityIndicator size="small" color={C.red} /> : <ThemedText style={s.rejectTxt}>❌  Rejeitar</ThemedText>}
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.approveBtn, isActing && { opacity: 0.5 }]} disabled={isActing} activeOpacity={0.8} onPress={() => handleApprove(c)}>
                            {isActing ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText style={s.approveTxt}>✅  Aprovar  +10 🪙</ThemedText>}
                          </TouchableOpacity>
                        </View>
                      )}
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
          </>
        )}

        {/* ══ SEÇÃO: SUPORTE ══ */}
        {section === 'support' && (
          <>
            {/* Sub-filtros */}
            <View style={[s.filterRow, { borderBottomColor: C.border }]}>
              {([
                { key: 'unread', label: 'Não lidas', icon: '🔴' },
                { key: 'all',    label: 'Todas',     icon: '📋' },
              ] as { key: SupportFilter; label: string; icon: string }[]).map(({ key, label, icon }) => {
                const active = sfilt === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[s.filterBtn, active && { borderBottomWidth: 2, borderBottomColor: C.purple }]}
                    onPress={() => setSfilt(key)}
                    activeOpacity={0.7}>
                    <ThemedText style={{ fontSize: 16, lineHeight: 20 }}>{icon}</ThemedText>
                    <ThemedText style={[s.filterTxt, { color: active ? C.purple : theme.textSecondary }]}>{label}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {sLoading ? (
              <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
            ) : sError ? (
              <ErrorState message={sError} onRetry={() => fetchSupport()} />
            ) : (
              <ScrollView
                contentContainerStyle={s.scroll}
                refreshControl={
                  <RefreshControl
                    refreshing={sRefresh}
                    onRefresh={() => { setSRefresh(true); fetchSupport(true); }}
                    tintColor={C.purple}
                  />
                }>
                {msgs.length === 0 ? (
                  <EmptyState icon={sfilt === 'unread' ? '✅' : '📭'} color={C.green}
                    title={sfilt === 'unread' ? 'Nenhuma mensagem nova' : 'Nenhuma mensagem encontrada'}
                    subtitle="Puxe para baixo para atualizar." />
                ) : msgs.map(msg => {
                  const isExpanded = expanded === msg.id;
                  const isSending  = sending === msg.id;
                  return (
                    <ThemedView key={msg.id} type="backgroundElement" style={s.card}>
                      {/* Cabeçalho */}
                      <View style={s.playerRow}>
                        <View style={[s.supportAvatar, { backgroundColor: msg.read ? theme.background : C.purple + '22' }]}>
                          <ThemedText style={{ fontSize: 20, lineHeight: 24 }}>👤</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold" numberOfLines={1}>
                            {msg.email ?? 'Anônimo'}
                          </ThemedText>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                            {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </ThemedText>
                        </View>
                        {!msg.read && (
                          <View style={s.unreadDot} />
                        )}
                        {msg.reply && (
                          <View style={[s.statusBadge, { backgroundColor: C.green + '22' }]}>
                            <ThemedText style={[s.statusTxt, { color: C.green }]}>✅ Respondida</ThemedText>
                          </View>
                        )}
                      </View>

                      {/* Mensagem */}
                      <View style={[s.msgBox, { backgroundColor: theme.background }]}>
                        <ThemedText style={{ fontSize: 14, lineHeight: 20, color: theme.text }}>
                          {msg.message}
                        </ThemedText>
                      </View>

                      {/* Resposta já enviada */}
                      {msg.reply && (
                        <View style={[s.replyBox, { borderLeftColor: C.purple }]}>
                          <ThemedText themeColor="textSecondary" style={{ fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                            SUA RESPOSTA · {msg.replied_at ? new Date(msg.replied_at).toLocaleDateString('pt-BR') : ''}
                          </ThemedText>
                          <ThemedText style={{ fontSize: 13, lineHeight: 18, color: theme.text }}>
                            {msg.reply}
                          </ThemedText>
                        </View>
                      )}

                      {/* Ações */}
                      {!msg.reply && (
                        <>
                          {isExpanded ? (
                            <View style={s.replyForm}>
                              <TextInput
                                style={[s.replyInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                                value={replyText}
                                onChangeText={setReplyText}
                                placeholder="Escreva sua resposta..."
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                autoFocus
                              />
                              <View style={s.replyActions}>
                                <TouchableOpacity
                                  style={s.cancelReplyBtn}
                                  onPress={() => { setExpanded(null); setReplyText(''); }}
                                  activeOpacity={0.7}>
                                  <ThemedText themeColor="textSecondary" style={{ fontSize: 13, fontWeight: '600' }}>Cancelar</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[s.sendReplyBtn, (!replyText.trim() || isSending) && { opacity: 0.5 }]}
                                  onPress={() => handleSendReply(msg)}
                                  disabled={!replyText.trim() || isSending}
                                  activeOpacity={0.8}>
                                  {isSending
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Enviar resposta</ThemedText>}
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={s.respondBtn}
                              onPress={() => {
                                if (!msg.read) handleMarkRead(msg.id);
                                setExpanded(msg.id);
                                setReplyText('');
                              }}
                              activeOpacity={0.8}>
                              <ThemedText style={{ color: C.purple, fontSize: 13, fontWeight: '800' }}>💬 Responder</ThemedText>
                            </TouchableOpacity>
                          )}
                        </>
                      )}

                      {/* Rodapé: marcar lida + excluir */}
                      <View style={s.msgFooter}>
                        {!msg.reply && !isExpanded && !msg.read && (
                          <TouchableOpacity onPress={() => handleMarkRead(msg.id)} activeOpacity={0.7}>
                            <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                              Marcar como lida
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity onPress={() => handleDeleteMsg(msg.id)} activeOpacity={0.7} hitSlop={8}>
                          <ThemedText style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>🗑 Excluir</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}

        {/* ══ SEÇÃO: TRILHAS ══ */}
        {section === 'trilhas' && (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {!selectedUser && (
              <>
                <ThemedView type="backgroundElement" style={s.card}>
                  <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TextInput
                      style={[s.searchInput, { color: theme.text, backgroundColor: theme.background, borderColor: C.border }]}
                      value={uQuery}
                      onChangeText={setUQuery}
                      placeholder="Nome ou e-mail do usuário"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      returnKeyType="search"
                      onSubmitEditing={handleSearchUsers}
                    />
                    <TouchableOpacity
                      style={[s.searchBtn, uLoading && { opacity: 0.6 }]}
                      onPress={handleSearchUsers}
                      disabled={uLoading}
                      activeOpacity={0.8}>
                      {uLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Buscar</ThemedText>}
                    </TouchableOpacity>
                  </View>
                </ThemedView>

                {uError ? (
                  <ErrorState message={uError} onRetry={handleSearchUsers} />
                ) : uResults.length === 0 ? (
                  <EmptyState icon="🔍" color={C.purple}
                    title="Buscar usuário"
                    subtitle="Digite o nome ou e-mail e toque em Buscar para liberar trilhas premium." />
                ) : uResults.map(u => (
                  <TouchableOpacity key={u.id} onPress={() => handleSelectUser(u)} activeOpacity={0.75}>
                    <ThemedView type="backgroundElement" style={[s.card, s.playerRow]}>
                      <AvatarImage value={u.avatar_emoji} size={40} />
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {u.name}{u.is_admin ? '  👑' : ''}
                        </ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }} numberOfLines={1}>
                          {u.email}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ color: C.purple, fontWeight: '700' }}>Ver →</ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {selectedUser && (
              <>
                <TouchableOpacity onPress={handleBackToSearch} activeOpacity={0.7} style={s.backToSearch}>
                  <ThemedText style={{ color: C.purple, fontWeight: '700' }}>← Voltar para busca</ThemedText>
                </TouchableOpacity>

                <ThemedView type="backgroundElement" style={[s.card, s.playerRow]}>
                  <AvatarImage value={selectedUser.avatar_emoji} size={44} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">{selectedUser.name}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{selectedUser.email}</ThemedText>
                  </View>
                </ThemedView>

                <ThemedText style={s.sectionLabel}>TRILHAS PREMIUM</ThemedText>

                {tLoading ? (
                  <View style={s.centerFlex}><ActivityIndicator color={C.purple} /></View>
                ) : TRILHAS_PREMIUM.map(trilha => {
                  const unlocked   = userTrilhas.has(trilha.id);
                  const isToggling = toggling === trilha.id;
                  return (
                    <ThemedView key={trilha.id} type="backgroundElement" style={[s.card, s.playerRow]}>
                      <ThemedText style={{ fontSize: 22 }}>{trilha.icone}</ThemedText>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">{trilha.titulo}</ThemedText>
                        <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                          {unlocked ? 'Liberada' : 'Bloqueada'}
                        </ThemedText>
                      </View>
                      {isToggling ? (
                        <ActivityIndicator size="small" color={C.purple} />
                      ) : (
                        <Switch
                          value={unlocked}
                          onValueChange={() => handleToggleTrilha(trilha.id, unlocked)}
                          trackColor={{ false: '#3a3a5c', true: C.purple }}
                          thumbColor="#ffffff"
                        />
                      )}
                    </ThemedView>
                  );
                })}
              </>
            )}
          </ScrollView>
        )}

      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function EmptyState({ icon, color, title, subtitle }: { icon: string; color: string; title: string; subtitle: string }) {
  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyIconWrap, { backgroundColor: color + '18' }]}>
        <ThemedText style={s.emptyIcon}>{icon}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={[s.center, { color }]}>{title}</ThemedText>
      <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>{subtitle}</ThemedText>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={s.centerFlex}>
      <ThemedText style={{ fontSize: 36, lineHeight: 44 }}>⚠️</ThemedText>
      <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>{message}</ThemedText>
      <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={s.retryBtn}>
        <ThemedText style={{ color: C.purple, fontWeight: '700', fontSize: 14 }}>Tentar novamente</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill:       { flex: 1 },
  center:     { textAlign: 'center' },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },

  header: {
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: 1, minHeight: 56, justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },

  // Seletor de seção
  sectionRow: { flexDirection: 'row', borderBottomWidth: 1 },
  sectionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  sectionTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Sub-filtros
  filterRow: { flexDirection: 'row', borderBottomWidth: 1 },
  filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, gap: 3 },
  filterTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  scroll:    { padding: Spacing.three, gap: Spacing.two },
  emptyWrap: { alignItems: 'center', gap: Spacing.two, paddingTop: 60, paddingHorizontal: Spacing.four },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  emptyIcon: { fontSize: 40, lineHeight: 52 },
  retryBtn:  { marginTop: Spacing.one, paddingVertical: 10, paddingHorizontal: 24, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.purple },

  // Card geral
  card:        { borderRadius: C.radius.lg, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: C.border },
  playerRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },
  statusTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Contestações
  answerBox:    { borderRadius: C.radius.md, padding: Spacing.two, gap: Spacing.one },
  answerMeta:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  letterCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  letterTxt:    { fontSize: 24, fontWeight: '900', color: '#fff', includeFontPadding: false },
  resultIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  verdictBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: C.radius.pill },
  actionRow:    { flexDirection: 'row', gap: Spacing.two, marginTop: 4 },
  rejectBtn:    { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5, borderColor: C.red + '88' },
  rejectTxt:    { fontSize: 13, fontWeight: '800', color: C.red },
  approveBtn:   { flex: 1, paddingVertical: 10, borderRadius: C.radius.pill, alignItems: 'center', backgroundColor: C.green },
  approveTxt:   { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Suporte
  supportAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  unreadDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  msgBox:        { borderRadius: C.radius.md, padding: Spacing.two },
  replyBox:      { borderLeftWidth: 3, paddingLeft: Spacing.two, gap: 2 },
  replyForm:     { gap: Spacing.two },
  replyInput:    { borderWidth: 1.5, borderRadius: C.radius.md, padding: Spacing.two, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  replyActions:  { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
  cancelReplyBtn:{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.border },
  sendReplyBtn:  { paddingVertical: 8, paddingHorizontal: 20, borderRadius: C.radius.pill, backgroundColor: C.purple },
  respondBtn:    { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.purple + '88' },
  msgFooter:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },

  // Trilhas
  sectionLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4', textTransform: 'uppercase', marginTop: Spacing.one },
  searchInput:   { flex: 1, borderWidth: 1.5, borderRadius: C.radius.pill, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  searchBtn:     { paddingHorizontal: 20, borderRadius: C.radius.pill, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  backToSearch:  { alignSelf: 'flex-start', marginBottom: Spacing.one },
});
