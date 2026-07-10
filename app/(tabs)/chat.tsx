import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AvatarImage } from '@/components/avatar-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notifications-context';
import { useChatMensagens, type MensagemChat } from '@/hooks/use-chat-mensagens';
import { useTheme } from '@/hooks/use-theme';
import { askChatAI } from '@/lib/chat-ai';
import { contemPalavraProibida } from '@/lib/chat-filtro';
import { playChatSound } from '@/lib/chat-sound';
import { sendChatOSNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

const MAX_LEN      = 200;
const HISTORY_24H  = 24 * 60 * 60 * 1000;

const AI_COMMAND = '/ia ';

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const aiHistoryKey = (userId: string) => `chat_ai_history_${userId}`;

const USER_COLORS = [C.purple, C.green, C.gold, '#E24B4A', '#3B82F6', '#EC4899', '#0891B2'];

function userColor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) & 0xffff;
  return USER_COLORS[h % USER_COLORS.length];
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}

interface HistoryMessage {
  id:         string;
  user_id:    string | null;
  user_name:  string | null;
  content:    string | null;
  sent_at:    string;
  deleted_at: string | null;
  deleted_by_name: string | null;
}

// Troca com a IA católica (/ia) — nunca gravada no banco/chat público, mas
// persistida no aparelho (AsyncStorage) até o usuário excluir manualmente.
interface AiItem {
  id:        string;
  question:  string;
  answer:    string | null;
  error:     string | null;
  createdAt: string;
}

type FeedItem =
  | { kind: 'chat'; key: string; createdAt: string; msg: MensagemChat }
  | { kind: 'ai';   key: string; createdAt: string; item: AiItem }
  | { kind: 'date'; key: string; createdAt: string; label: string };

function fmtDateSep(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

// ── Marcador de data entre mensagens de dias diferentes ─────────────────────
const DateSeparator = memo(function DateSeparator({ label }: { label: string }) {
  return (
    <View style={s.dateSep}>
      <View style={[s.dateSepLine, { backgroundColor: C.border }]} />
      <ThemedText themeColor="textSecondary" style={s.dateSepLabel}>{label}</ThemedText>
      <View style={[s.dateSepLine, { backgroundColor: C.border }]} />
    </View>
  );
});

// ── Bolha de mensagem — memoizada (evita re-render ao rolar a lista) ────────
const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  isAdmin,
  onDelete,
  onReport,
  onBlock,
}: {
  msg: MensagemChat;
  isOwn: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onReport: (msg: MensagemChat) => void;
  onBlock: (userId: string, userName: string) => void;
}) {
  const theme = useTheme();

  const uColor    = userColor(msg.user_id);
  const bubbleBg  = isOwn ? C.purple : uColor + '28';
  const borderCol = isOwn ? 'transparent' : uColor;
  const textColor = isOwn ? '#fff' : theme.text;
  const timeColor = isOwn ? 'rgba(255,255,255,0.55)' : theme.textSecondary;
  const canDelete = isOwn || isAdmin;

  function confirmDelete() {
    Alert.alert(
      isOwn ? 'Excluir mensagem?' : `Excluir mensagem de ${msg.user_name}?`,
      isOwn
        ? 'Ela some do chat para todo mundo agora.'
        : 'Ação de admin: ela some do chat para todo mundo agora e fica registrado que você excluiu.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(msg.id) },
      ],
    );
  }

  // Mensagem de terceiro (sem ser admin): não tem opção de excluir, mas
  // ganha denúncia/bloqueio — obrigatório pela política de UGC da Apple.
  function openThirdPartyMenu() {
    Alert.alert(
      msg.user_name,
      'O que você deseja fazer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Denunciar', onPress: () => onReport(msg) },
        { text: 'Bloquear usuário', style: 'destructive', onPress: () => onBlock(msg.user_id, msg.user_name) },
      ],
    );
  }

  return (
    <View style={[s.bubbleWrap, isOwn ? s.bubbleRight : s.bubbleLeft, s.bubbleRow]}>
      {!isOwn && (
        <AvatarImage value={msg.avatar_emoji || '🙏'} size={28} borderColor={uColor} />
      )}
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={canDelete ? confirmDelete : openThirdPartyMenu}
        style={[
          s.bubble,
          { backgroundColor: bubbleBg, borderLeftColor: borderCol },
          !isOwn && s.bubbleBorderLeft,
        ]}>
        {!isOwn && (
          <ThemedText style={[s.bubbleName, { color: uColor }]} numberOfLines={1}>
            {msg.user_name}
          </ThemedText>
        )}
        <ThemedText style={[s.bubbleText, { color: textColor }]}>
          {msg.content}
        </ThemedText>
        <View style={s.bubbleFooter}>
          <ThemedText style={[s.bubbleTime, { color: timeColor }]}>
            {fmtTime(msg.created_at)}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </View>
  );
});

// Markdown inline simples (**negrito**, *itálico*/_itálico_) — a resposta da
// IA vem com essa formatação em texto puro e precisa virar Text estilizado.
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<Text key={i++} style={{ fontWeight: '800' }}>{match[1]}</Text>);
    } else {
      parts.push(<Text key={i++} style={{ fontStyle: 'italic' }}>{match[2] ?? match[3]}</Text>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// ── Troca com a IA católica (/ia) — visível só para quem perguntou ──────────
const AiBubble = memo(function AiBubble({ item, onDelete }: { item: AiItem; onDelete: (id: string) => void }) {
  const theme = useTheme();

  function handleShare() {
    if (!item.answer) return;
    Share.share({ message: `${item.question}\n\n${item.answer}` }).catch(() => {});
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir esta conversa com a IA?',
      'Ela some do seu histórico neste aparelho.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={confirmDelete}
        style={[s.bubbleWrap, s.bubbleRight]}>
        <View style={[s.bubble, { backgroundColor: C.purple }]}>
          <ThemedText style={[s.bubbleText, { color: '#fff' }]}>{item.question}</ThemedText>
        </View>
      </TouchableOpacity>
      <View style={[s.bubbleWrap, s.bubbleLeft]}>
        <View style={[s.bubble, s.bubbleBorderLeft, { backgroundColor: C.gold + '22', borderLeftColor: C.gold }]}>
          <View style={s.aiHeaderRow}>
            <ThemedText style={[s.bubbleName, { color: C.gold }]}>🤖 Catequista</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {item.answer && (
                <TouchableOpacity onPress={handleShare} hitSlop={8} activeOpacity={0.7}>
                  <ThemedText style={{ fontSize: 13, color: theme.textSecondary }}>↗ Compartilhar</ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={confirmDelete} hitSlop={8} activeOpacity={0.7}>
                <ThemedText style={{ fontSize: 13, color: C.red }}>🗑 Excluir</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          {item.error ? (
            <ThemedText style={[s.bubbleText, { color: C.red }]}>{item.error}</ThemedText>
          ) : item.answer ? (
            <ThemedText style={[s.bubbleText, { color: theme.text }]}>{renderInlineMarkdown(item.answer)}</ThemedText>
          ) : (
            <ActivityIndicator size="small" color={C.gold} style={{ alignSelf: 'flex-start', marginVertical: 4 }} />
          )}
          <ThemedText themeColor="textSecondary" style={{ fontSize: 9, marginTop: 4 }}>
            Visível só para você · pode conter imprecisões
          </ThemedText>
        </View>
      </View>
    </View>
  );
});

// ── Tela principal ────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const theme   = useTheme();
  const { user, profile } = useAuth();
  const { addChatNotification, markAllRead, muteChat } = useNotifications();

  const {
    mensagens, carregandoMais, temMais,
    carregarInicial, carregarMais, novaMensagem, removerMensagem,
    carregarBloqueios, bloquearUsuario,
  } = useChatMensagens();
  const [inputText,       setInputText]       = useState('');
  const [sending,         setSending]         = useState(false);
  const [historyVisible,  setHistoryVisible]  = useState(false);
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const [aiItems,         setAiItems]         = useState<AiItem[]>([]);

  const listRef      = useRef<FlatList>(null);
  const channelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isFocused    = useRef(false);
  const aiLoadedRef  = useRef(false);
  const muteChatRef           = useRef(muteChat);
  const addChatNotificationRef = useRef(addChatNotification);

  useEffect(() => { muteChatRef.current = muteChat; }, [muteChat]);
  useEffect(() => { addChatNotificationRef.current = addChatNotification; }, [addChatNotification]);

  // Histórico da IA: persistido no aparelho, permanece até o usuário excluir.
  useEffect(() => {
    aiLoadedRef.current = false;
    if (!user) { setAiItems([]); return; }
    AsyncStorage.getItem(aiHistoryKey(user.id)).then(raw => {
      setAiItems(raw ? JSON.parse(raw) : []);
      aiLoadedRef.current = true;
    }).catch(() => { aiLoadedRef.current = true; });
  }, [user]);

  useEffect(() => {
    if (!user || !aiLoadedRef.current) return;
    AsyncStorage.setItem(aiHistoryKey(user.id), JSON.stringify(aiItems)).catch(() => {});
  }, [user, aiItems]);

  const handleDeleteAiItem = useCallback((id: string) => {
    setAiItems(prev => prev.filter(it => it.id !== id));
  }, []);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    carregarBloqueios(user.id).then(carregarInicial);

    const channel = supabase
      .channel('community_chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          const msg = payload.new as MensagemChat;
          novaMensagem(msg);
          if (msg.user_id !== user?.id) {
            if (!muteChatRef.current) {
              playChatSound().catch(() => {});
            }
            addChatNotificationRef.current(msg.user_name, msg.content);
            if (!isFocused.current && !muteChatRef.current) {
              sendChatOSNotification(msg.user_name, msg.content).catch(() => {});
            }
          }
        },
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_messages' },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          removerMensagem(id);
        },
      )
      .on('broadcast',
        { event: 'message_deleted' },
        ({ payload }) => {
          removerMensagem(payload.id);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [user, carregarBloqueios, carregarInicial, novaMensagem, removerMensagem]);

  // Ao focar: marca notificações do chat como lidas
  useFocusEffect(useCallback(() => {
    isFocused.current = true;
    markAllRead();
    return () => { isFocused.current = false; };
  }, [markAllRead]));

  // Exclusão manual (long-press na própria bolha, ou em qualquer bolha se
  // admin) — soft delete: marca deleted_at em vez de apagar a linha,
  // mensagens ficam guardadas indefinidamente. deleted_by/deleted_by_name
  // registram quem excluiu, útil quando é um admin excluindo msg de outro.
  const handleDeleteMessage = useCallback((id: string) => {
    removerMensagem(id);
    channelRef.current?.send({ type: 'broadcast', event: 'message_deleted', payload: { id } });
    supabase.from('community_messages')
      .update({
        deleted_at:      new Date().toISOString(),
        deleted_by:      user?.id ?? null,
        deleted_by_name: profile?.name ?? null,
      })
      .eq('id', id)
      .then(() => {});
  }, [removerMensagem, user, profile]);

  // ── Denúncia e bloqueio (exigência Apple Guideline 1.2 — UGC) ────────────────
  const handleReportMessage = useCallback((msg: MensagemChat) => {
    if (!user || !profile) return;
    Alert.alert(
      `Denunciar mensagem de ${msg.user_name}?`,
      'Um admin vai revisar essa mensagem.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denunciar',
          style: 'destructive',
          onPress: () => {
            supabase.from('message_reports').insert({
              message_id:         msg.id,
              reported_content:   msg.content,
              reporter_id:        user.id,
              reporter_name:      profile.name ?? 'Jogador',
              reported_user_id:   msg.user_id,
              reported_user_name: msg.user_name,
            }).then(({ error }) => {
              if (error?.code === '23505') Alert.alert('Você já denunciou essa mensagem', 'Um admin ainda vai revisar sua denúncia.');
              else if (error) Alert.alert('Erro', 'Não foi possível enviar a denúncia. Tente novamente.');
              else Alert.alert('Denúncia enviada', 'Obrigado, um admin vai revisar.');
            });
          },
        },
      ],
    );
  }, [user, profile]);

  const handleBlockUser = useCallback((userId: string, userName: string) => {
    if (!user) return;
    Alert.alert(
      `Bloquear ${userName}?`,
      'Você não vai mais ver mensagens dessa pessoa no chat.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            const ok = await bloquearUsuario(user.id, userId);
            if (!ok) Alert.alert('Erro', 'Não foi possível bloquear. Tente novamente.');
          },
        },
      ],
    );
  }, [user, bloquearUsuario]);

  // ── Histórico admin ───────────────────────────────────────────────────────
  // Consulta community_messages direto (não é apagada fisicamente, só soft
  // delete) — inclui mensagens já excluídas pra fins de moderação, via a
  // policy "admin_reads_all_messages". Não depende mais de um log separado
  // guardando conteúdo por 6 meses.
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryVisible(true);
    const since = new Date(Date.now() - HISTORY_24H).toISOString();
    const { data } = await supabase
      .from('community_messages')
      .select('id, user_id, user_name, content, sent_at:created_at, deleted_at, deleted_by_name')
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    setHistoryMessages((data ?? []) as HistoryMessage[]);
    setHistoryLoading(false);
  }, []);

  // ── Envio ─────────────────────────────────────────────────────────────────
  // Envia de fato a mensagem no chat público (separado do handleSend pra
  // poder pedir confirmação antes, sem duplicar a lógica de envio).
  const sendPlainMessage = useCallback(async (text: string) => {
    if (!user || !profile) return;

    // Filtro client-side — só feedback imediato; o trigger no banco
    // (check_chat_banned_words) é a fonte de verdade e barra mesmo que este
    // filtro seja contornado.
    if (contemPalavraProibida(text)) {
      Alert.alert('Mensagem não permitida', 'Essa mensagem contém um termo não permitido no chat da comunidade.');
      return;
    }

    setSending(true);
    setInputText('');

    const { error } = await supabase.from('community_messages').insert({
      user_id:      user.id,
      user_name:    profile.name ?? 'Jogador',
      avatar_emoji: profile.avatar_emoji ?? null,
      content:      text,
    });

    if (error) {
      Alert.alert(
        error.code === 'P0001' ? 'Mensagem não permitida' : 'Erro',
        error.code === 'P0001'
          ? 'Essa mensagem contém um termo não permitido no chat da comunidade.'
          : 'Não foi possível enviar a mensagem. Tente novamente.',
      );
      setInputText(text);
    } else {
      // Log de auditoria só com metadado (quem + quando) — sem conteúdo, por
      // design (Marco Civil não exige o texto, e content aqui violaria a
      // exclusão manual da mensagem original).
      supabase.from('community_message_log').insert({ user_id: user.id }).then(() => {});
      // Lista é invertida — "voltar ao fim" é offset 0, não scrollToEnd
      setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 150);
    }

    setSending(false);
  }, [user, profile]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !user || !profile || sending) return;

    // Comando de histórico — somente admins
    if (text === '/historico24') {
      setInputText('');
      if (!profile.is_admin) {
        Alert.alert('Acesso negado', 'Este comando é exclusivo para administradores.');
        return;
      }
      fetchHistory();
      return;
    }

    // Comando de IA católica — resposta privada (não entra no chat público)
    if (text.toLowerCase().startsWith(AI_COMMAND)) {
      const question = text.slice(AI_COMMAND.length).trim();
      setInputText('');
      if (!question) {
        Alert.alert('Pergunte algo', 'Use assim: /ia Quem foi Santo Agostinho?');
        return;
      }

      const id = `ai-${Date.now()}`;
      setAiItems(prev => [...prev, { id, question, answer: null, error: null, createdAt: new Date().toISOString() }]);
      setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);

      const { answer, error } = await askChatAI(question);

      if (error || !answer) {
        setAiItems(prev => prev.map(it => it.id === id
          ? { ...it, error: 'Não foi possível responder agora. Tente de novo em instantes.' }
          : it));
      } else {
        setAiItems(prev => prev.map(it => it.id === id ? { ...it, answer } : it));
      }
      setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 150);
      return;
    }

    // Mensagem igual a um e-mail é quase sempre engano (autofill do teclado
    // preenchendo o campo sem querer) — confirma antes de expor no chat público.
    if (EMAIL_LIKE.test(text)) {
      Alert.alert(
        'Enviar seu e-mail no chat?',
        'Essa mensagem parece ser um endereço de e-mail. Tem certeza que quer enviar isso pra todo mundo ver?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar mesmo assim', style: 'destructive', onPress: () => sendPlainMessage(text) },
        ],
      );
      return;
    }

    await sendPlainMessage(text);
  }, [inputText, user, profile, sending, fetchHistory, sendPlainMessage]);

  // Mescla chat público + trocas com a IA (local, só para quem perguntou) — ascendente,
  // com marcador de data inserido sempre que muda o dia entre uma mensagem e a anterior.
  const feed: FeedItem[] = useMemo(() => {
    const chatItems: FeedItem[] = mensagens.map(m => ({ kind: 'chat', key: `c-${m.id}`, createdAt: m.created_at, msg: m }));
    const aiFeedItems: FeedItem[] = aiItems.map(a => ({ kind: 'ai', key: `a-${a.id}`, createdAt: a.createdAt, item: a }));
    const ordenado = [...chatItems, ...aiFeedItems].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const comSeparadores: FeedItem[] = [];
    let diaAnterior: string | null = null;
    for (const item of ordenado) {
      const dia = new Date(item.createdAt).toDateString();
      if (dia !== diaAnterior) {
        comSeparadores.push({ kind: 'date', key: `d-${dia}`, createdAt: item.createdAt, label: fmtDateSep(item.createdAt) });
        diaAnterior = dia;
      }
      comSeparadores.push(item);
    }
    return comSeparadores;
  }, [mensagens, aiItems]);

  // FlatList é `inverted` (mais recente embaixo) — precisa do array na ordem contrária
  const invertedFeed: FeedItem[] = useMemo(() => [...feed].reverse(), [feed]);

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={[s.header, { borderBottomColor: C.border, borderBottomWidth: 1 }]}>
            <ThemedText style={s.headerTitle}>💬 Comunidade</ThemedText>
          </View>
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 56, lineHeight: 70 }}>🔐</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Login necessário</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
              Faça login para participar da comunidade.
            </ThemedText>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: C.purple, marginTop: Spacing.four }]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}>
              <ThemedText style={s.btnTxt}>FAZER LOGIN</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const coins     = profile?.coins ?? 0;
  const canSend   = inputText.trim().length > 0 && !sending;
  const charsLeft = MAX_LEN - inputText.length;

  // ── Modal de histórico ────────────────────────────────────────────────────
  const renderHistory = () => (
    <Modal
      visible={historyVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setHistoryVisible(false)}>
      <View style={[s.histModal, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[s.histHeader, { borderBottomColor: C.border, borderBottomWidth: 1 }]}>
          <View>
            <ThemedText style={{ fontSize: 17, fontWeight: '800' }}>📋 Histórico 24h</ThemedText>
            {!historyLoading && (
              <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                {historyMessages.length} mensagem{historyMessages.length !== 1 ? 's' : ''}
              </ThemedText>
            )}
          </View>
          <TouchableOpacity onPress={() => setHistoryVisible(false)} style={s.histClose} activeOpacity={0.7}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', color: theme.textSecondary }}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        {historyLoading ? (
          <View style={s.histEmpty}>
            <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>Carregando...</ThemedText>
          </View>
        ) : historyMessages.length === 0 ? (
          <View style={s.histEmpty}>
            <ThemedText style={{ fontSize: 40, lineHeight: 50 }}>💬</ThemedText>
            <ThemedText themeColor="textSecondary" style={{ fontSize: 13, textAlign: 'center' }}>
              Nenhuma mensagem nas últimas 24h.
            </ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.histList}>
            {historyMessages.map((msg, i) => {
              const uColor = msg.user_id ? userColor(msg.user_id) : C.purple;
              const prevMsg = historyMessages[i - 1];
              const showDateSep = !prevMsg ||
                new Date(msg.sent_at).toDateString() !== new Date(prevMsg.sent_at).toDateString();
              return (
                <View key={msg.id}>
                  {showDateSep && (
                    <View style={s.histDateSep}>
                      <View style={[s.histDateLine, { backgroundColor: C.border }]} />
                      <ThemedText themeColor="textSecondary" style={s.histDateLabel}>
                        {new Date(msg.sent_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </ThemedText>
                      <View style={[s.histDateLine, { backgroundColor: C.border }]} />
                    </View>
                  )}
                  <View style={s.histRow}>
                    <ThemedText style={[s.histTime, { color: theme.textSecondary }]}>
                      {fmtDateTime(msg.sent_at)}
                    </ThemedText>
                    <View style={[s.histBubble, { borderLeftColor: uColor, backgroundColor: uColor + '18' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ThemedText style={[s.histName, { color: uColor }]} numberOfLines={1}>
                          {msg.user_name ?? 'Jogador'}
                        </ThemedText>
                        {msg.deleted_at && (
                          <ThemedText style={{ fontSize: 9, fontWeight: '700', color: C.red }}>
                            EXCLUÍDA{msg.deleted_by_name ? ` · por ${msg.deleted_by_name}` : ''}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText style={[s.histContent, { color: theme.text }]}>
                        {msg.content ?? '—'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <ThemedView style={s.fill}>
      {renderHistory()}
      <SafeAreaView style={s.fill} edges={['top']}>
        <KeyboardAvoidingView
          style={s.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* Header */}
          <View style={[s.header, { borderBottomColor: C.border, borderBottomWidth: 1 }]}>
            <View>
              <ThemedText style={s.headerTitle}>💬 Comunidade</ThemedText>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
                SANTOSPLAY
              </ThemedText>
            </View>
            <View style={s.coinBadge}>
              <Image source={require('@/assets/images/moedas.png')} style={s.coinIcon} />
              <ThemedText style={s.coinBadgeText}>{coins}</ThemedText>
            </View>
          </View>

          {/* Banner de info */}
          <View style={[s.ephemeralBanner, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText themeColor="textSecondary" style={s.ephemeralText}>
              🤖 /ia sua pergunta
            </ThemedText>
          </View>

          {/* Lista — invertida (mais recente embaixo); onEndReached aqui corresponde
              ao topo visual, carregando mensagens mais antigas ao chegar perto dele. */}
          <FlatList
            ref={listRef}
            inverted
            data={invertedFeed}
            keyExtractor={f => f.key}
            renderItem={({ item }) => item.kind === 'chat' ? (
              <MessageBubble
                msg={item.msg}
                isOwn={item.msg.user_id === user.id}
                isAdmin={!!profile?.is_admin}
                onDelete={handleDeleteMessage}
                onReport={handleReportMessage}
                onBlock={handleBlockUser}
              />
            ) : item.kind === 'ai' ? (
              <AiBubble item={item.item} onDelete={handleDeleteAiItem} />
            ) : (
              <DateSeparator label={item.label} />
            )}
            contentContainerStyle={[s.listContent, { paddingBottom: BottomTabInset + 8 }]}
            onEndReached={carregarMais}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              carregandoMais ? (
                <View style={s.paginationFooter}>
                  <ActivityIndicator size="small" color={C.purple} />
                </View>
              ) : !temMais && mensagens.length > 0 ? (
                <View style={s.paginationFooter}>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>Início da conversa</ThemedText>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 13 }]}>
                  Nenhuma mensagem ainda.{'\n'}Seja o primeiro a falar!
                </ThemedText>
              </View>
            }
          />

          {/* Input */}
          <View style={[s.inputBar, {
            backgroundColor: theme.backgroundElement,
            borderTopColor: C.border,
            borderTopWidth: 1,
          }]}>
            <TextInput
              style={[s.input, { color: theme.text, backgroundColor: theme.background }]}
              value={inputText}
              onChangeText={t => setInputText(t.slice(0, MAX_LEN))}
              placeholder="Escreva uma mensagem..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={MAX_LEN}
            />

            <View style={s.inputRight}>
              {inputText.length > 150 && (
                <ThemedText style={[s.charCount, { color: charsLeft < 20 ? C.red : theme.textSecondary }]}>
                  {charsLeft}
                </ThemedText>
              )}

              <TouchableOpacity
                style={[s.sendBtn, {
                  backgroundColor: canSend ? C.purple : theme.backgroundSelected,
                  opacity: canSend ? 1 : 0.5,
                }]}
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.8}>
                <ThemedText style={s.sendBtnText}>{sending ? '⏳' : '➤'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:       { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  center:     { textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(239,159,39,0.15)',
  },
  coinBadgeText: { fontSize: 13, fontWeight: '700', color: C.gold },
  coinIcon: { width: 18, height: 18, resizeMode: 'contain' },

  ephemeralBanner: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  ephemeralText: { fontSize: 11 },

  listContent: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    gap: 6,
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  paginationFooter: {
    alignItems: 'center',
    paddingVertical: 10,
  },

  dateSep:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dateSepLine:  { flex: 1, height: 1 },
  dateSepLabel: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  bubbleWrap:  { maxWidth: '80%' },
  bubbleRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  bubbleLeft:  { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },

  bubble: {
    flexShrink: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  bubbleBorderLeft: {
    borderLeftWidth: 3,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  bubbleName:   { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  aiHeaderRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  bubbleText:   { fontSize: 15, lineHeight: 21 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  bubbleTime:   { fontSize: 10, fontWeight: '500', flexShrink: 0 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    paddingBottom: Platform.OS === 'ios' ? Spacing.two : Spacing.three,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 100,
  },
  inputRight: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  charCount: { fontSize: 10 },

  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },

  btn:    { paddingHorizontal: Spacing.five, paddingVertical: Spacing.two + 4, borderRadius: 99 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal de histórico admin
  histModal:  { flex: 1 },
  histHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  histClose:  { padding: 6 },
  histEmpty:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  histList:   { paddingHorizontal: 12, paddingVertical: 12, gap: 4 },

  histDateSep:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  histDateLine: { flex: 1, height: 1 },
  histDateLabel: { fontSize: 11, fontWeight: '600' },

  histRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 2 },
  histTime:   { fontSize: 10, fontWeight: '500', marginTop: 4, width: 40, flexShrink: 0 },
  histBubble: { flex: 1, borderLeftWidth: 3, borderRadius: 8, borderTopLeftRadius: 2, padding: 8, gap: 2 },
  histName:   { fontSize: 11, fontWeight: '800' },
  histContent: { fontSize: 14, lineHeight: 20 },
});
