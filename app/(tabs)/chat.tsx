import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notifications-context';
import { useTheme } from '@/hooks/use-theme';
import { askChatAI } from '@/lib/chat-ai';
import { playChatSound } from '@/lib/chat-sound';
import { sendChatOSNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

const EXPIRE_MS    = 60 * 60 * 1000;  // 1 hora
const FADE_MS      = 30 * 1000;
const MAX_LEN      = 200;
const HISTORY_24H  = 24 * 60 * 60 * 1000;

const AI_COMMAND = '/ia ';
const AI_COST    = 20;

const USER_COLORS = [C.purple, C.green, C.gold, '#E24B4A', '#3B82F6', '#EC4899', '#0891B2'];

function userColor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) & 0xffff;
  return USER_COLORS[h % USER_COLORS.length];
}

function msLeft(expiresAt: string): number {
  return new Date(expiresAt).getTime() - Date.now();
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

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  expires_at: string;
}

interface HistoryMessage {
  id:        string;
  user_id:   string | null;
  user_name: string | null;
  content:   string | null;
  sent_at:   string;
}

// Troca com a IA católica (/ia) — só local, nunca gravada no banco/chat público.
interface AiItem {
  id:        string;
  question:  string;
  answer:    string | null;
  error:     string | null;
  createdAt: string;
}

type FeedItem =
  | { kind: 'chat'; key: string; createdAt: string; msg: ChatMessage }
  | { kind: 'ai';   key: string; createdAt: string; item: AiItem };

// ── Bolha com animação de expiração ──────────────────────────────────────────
function MessageBubble({
  msg,
  isOwn,
  onExpired,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onExpired: (id: string) => void;
}) {
  const theme      = useTheme();
  const opacity    = useRef(new Animated.Value(1)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const doneRef    = useRef(false);

  // Barra de progresso via state (mais confiável que Animated % width)
  const [barPct, setBarPct] = useState(() =>
    Math.min(1, Math.max(0, msLeft(msg.expires_at) / EXPIRE_MS))
  );

  useEffect(() => {
    const left = msLeft(msg.expires_at);
    if (left <= 0) { onExpired(msg.id); return; }

    // Atualiza a barra a cada 5s — suficiente para 1h de duração
    const barInterval = setInterval(() => {
      const ratio = Math.max(0, msLeft(msg.expires_at) / EXPIRE_MS);
      setBarPct(ratio);
    }, 5000);

    // Fade gradual começa nos últimos 30s
    const fadeDelay = Math.max(0, left - FADE_MS);
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0.18,
        duration: Math.min(left, FADE_MS) - 800,
        useNativeDriver: true,
      }).start();
    }, fadeDelay);

    // Animação final: dissolve + sobe + some
    const expireTimer = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0,    duration: 600, useNativeDriver: true }),
        Animated.timing(scale,      { toValue: 0.88, duration: 600, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -14,  duration: 600, useNativeDriver: true }),
      ]).start(() => onExpired(msg.id));
    }, left);

    return () => {
      clearInterval(barInterval);
      clearTimeout(fadeTimer);
      clearTimeout(expireTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.expires_at]);

  const barColor  = barPct > 0.5 ? C.green : barPct > 0.2 ? C.gold : C.red;
  const uColor    = userColor(msg.user_id);
  const bubbleBg  = isOwn ? C.purple : uColor + '28';
  const borderCol = isOwn ? 'transparent' : uColor;
  const textColor = isOwn ? '#fff' : theme.text;
  const timeColor = isOwn ? 'rgba(255,255,255,0.55)' : theme.textSecondary;

  return (
    <Animated.View
      style={[
        s.bubbleWrap,
        isOwn ? s.bubbleRight : s.bubbleLeft,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}>
      <View style={[
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
        {/* Horário + barra de expiração */}
        <View style={s.bubbleFooter}>
          <ThemedText style={[s.bubbleTime, { color: timeColor }]}>
            {fmtTime(msg.created_at)}
          </ThemedText>
          <View style={[s.barBg, {
            flex: 1,
            backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.backgroundSelected,
          }]}>
            <View style={[s.barFill, {
              width: `${barPct * 100}%`,
              backgroundColor: isOwn ? 'rgba(255,255,255,0.75)' : barColor,
            }]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

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
function AiBubble({ item }: { item: AiItem }) {
  const theme = useTheme();

  function handleShare() {
    if (!item.answer) return;
    Share.share({ message: `${item.question}\n\n${item.answer}` }).catch(() => {});
  }

  return (
    <View style={{ gap: 6 }}>
      <View style={[s.bubbleWrap, s.bubbleRight]}>
        <View style={[s.bubble, { backgroundColor: C.purple }]}>
          <ThemedText style={[s.bubbleText, { color: '#fff' }]}>{item.question}</ThemedText>
        </View>
      </View>
      <View style={[s.bubbleWrap, s.bubbleLeft]}>
        <View style={[s.bubble, s.bubbleBorderLeft, { backgroundColor: C.gold + '22', borderLeftColor: C.gold }]}>
          <View style={s.aiHeaderRow}>
            <ThemedText style={[s.bubbleName, { color: C.gold }]}>🤖 IA Católica</ThemedText>
            {item.answer && (
              <TouchableOpacity onPress={handleShare} hitSlop={8} activeOpacity={0.7}>
                <ThemedText style={{ fontSize: 13, color: theme.textSecondary }}>↗ Compartilhar</ThemedText>
              </TouchableOpacity>
            )}
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
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const theme   = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const { addChatNotification, markAllRead, muteChat } = useNotifications();

  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [inputText,       setInputText]       = useState('');
  const [sending,         setSending]         = useState(false);
  const [historyVisible,  setHistoryVisible]  = useState(false);
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[]>([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const [aiItems,         setAiItems]         = useState<AiItem[]>([]);

  const listRef      = useRef<FlatList>(null);
  const channelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isFocused    = useRef(false);

  // Animação de moeda ao enviar
  const coinY       = useRef(new Animated.Value(0)).current;
  const coinOpacity = useRef(new Animated.Value(0)).current;
  const coinScale   = useRef(new Animated.Value(1)).current;
  const [coinVisible, setCoinVisible] = useState(false);

  const animateCoin = useCallback(() => {
    coinY.setValue(0);
    coinOpacity.setValue(1);
    coinScale.setValue(1);
    setCoinVisible(true);
    Animated.parallel([
      Animated.timing(coinY,    { toValue: -90, duration: 1100, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(coinScale, { toValue: 1.4, duration: 300, useNativeDriver: true }),
        Animated.timing(coinScale, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(coinOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start(() => setCoinVisible(false));
  }, [coinY, coinOpacity, coinScale]);

  // ── Carrega mensagens ─────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('id, user_id, user_name, content, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(80);
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadMessages();

    channelRef.current = supabase
      .channel('community_chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msLeft(msg.expires_at) <= 0) return;
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
          if (msg.user_id !== user?.id) {
            if (!muteChat) {
              playChatSound().catch(() => {});
            }
            if (!isFocused.current) {
              addChatNotification(msg.user_name, msg.content);
              if (!muteChat) {
                sendChatOSNotification(msg.user_name, msg.content).catch(() => {});
              }
            }
          }
        },
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_messages' },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setMessages(prev => prev.filter(m => m.id !== id));
        },
      )
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [user, loadMessages, addChatNotification, muteChat]);

  // Ao focar: limpa expiradas e marca notificações como lidas
  useFocusEffect(useCallback(() => {
    isFocused.current = true;
    setMessages(prev => prev.filter(m => msLeft(m.expires_at) > 0));
    markAllRead();
    return () => { isFocused.current = false; };
  }, [markAllRead]));

  // Callback do MessageBubble: remove do estado + limpa do banco
  const handleExpired = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    supabase.from('community_messages').delete().eq('id', id).then(() => {});
  }, []);

  // ── Histórico admin ───────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryVisible(true);
    const since = new Date(Date.now() - HISTORY_24H).toISOString();
    const { data } = await supabase
      .from('community_message_log')
      .select('id, user_id, user_name, content, sent_at')
      .gte('sent_at', since)
      .not('content', 'is', null)
      .order('sent_at', { ascending: true });
    setHistoryMessages((data ?? []) as HistoryMessage[]);
    setHistoryLoading(false);
  }, []);

  // ── Envio ─────────────────────────────────────────────────────────────────
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
      if ((profile.coins ?? 0) < AI_COST) {
        Alert.alert('Moedas insuficientes', `Você precisa de ${AI_COST} 🪙 para perguntar à IA.\n\nGanhe moedas jogando!`);
        return;
      }

      const id = `ai-${Date.now()}`;
      setAiItems(prev => [...prev, { id, question, answer: null, error: null, createdAt: new Date().toISOString() }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

      await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -AI_COST });
      refreshProfile();

      const { answer, error } = await askChatAI(question);

      if (error || !answer) {
        await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: AI_COST });
        refreshProfile();
        setAiItems(prev => prev.map(it => it.id === id
          ? { ...it, error: 'Não foi possível responder agora. Tente de novo em instantes.' }
          : it));
      } else {
        setAiItems(prev => prev.map(it => it.id === id ? { ...it, answer } : it));
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
      return;
    }

    if ((profile.coins ?? 0) < 1) {
      Alert.alert('Moedas insuficientes', 'Você precisa de 1 🪙 para enviar uma mensagem.\n\nGanhe moedas jogando!');
      return;
    }

    setSending(true);
    setInputText('');
    animateCoin();

    await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: -1 });
    refreshProfile();

    const { error } = await supabase.from('community_messages').insert({
      user_id:    user.id,
      user_name:  profile.name ?? 'Jogador',
      content:    text,
      expires_at: new Date(Date.now() + EXPIRE_MS).toISOString(),
    });

    if (error) {
      await supabase.rpc('add_coins', { p_user_id: user.id, p_amount: 1 });
      refreshProfile();
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
      setInputText(text);
    } else {
      supabase.from('community_message_log').insert({
        user_id:   user.id,
        user_name: profile.name ?? 'Jogador',
        content:   text,
      }).then(() => {});
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }

    setSending(false);
  }, [inputText, user, profile, sending, animateCoin, refreshProfile, fetchHistory]);

  // Mescla chat público + trocas com a IA (local, só para quem perguntou)
  const feed: FeedItem[] = useMemo(() => {
    const chatItems: FeedItem[] = messages.map(m => ({ kind: 'chat', key: `c-${m.id}`, createdAt: m.created_at, msg: m }));
    const aiFeedItems: FeedItem[] = aiItems.map(a => ({ kind: 'ai', key: `a-${a.id}`, createdAt: a.createdAt, item: a }));
    return [...chatItems, ...aiFeedItems].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [messages, aiItems]);

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
  const canSend   = inputText.trim().length > 0 && coins >= 1 && !sending;
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
                      <ThemedText style={[s.histName, { color: uColor }]} numberOfLines={1}>
                        {msg.user_name ?? 'Jogador'}
                      </ThemedText>
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

          {/* Banner efêmero */}
          <View style={[s.ephemeralBanner, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText themeColor="textSecondary" style={s.ephemeralText}>
              ⏳ Mensagens somem em 1h · 🤖 /ia sua pergunta ({AI_COST}🪙)
            </ThemedText>
          </View>

          {/* Lista */}
          <FlatList
            ref={listRef}
            data={feed}
            keyExtractor={f => f.key}
            renderItem={({ item }) => item.kind === 'chat' ? (
              <MessageBubble
                msg={item.msg}
                isOwn={item.msg.user_id === user.id}
                onExpired={handleExpired}
              />
            ) : (
              <AiBubble item={item.item} />
            )}
            contentContainerStyle={[s.listContent, { paddingBottom: BottomTabInset + 8 }]}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
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

              <View>
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


                {/* Moeda flutuando */}
                {coinVisible && (
                  <Animated.View
                    pointerEvents="none"
                    style={[s.floatingCoin, {
                      opacity: coinOpacity,
                      transform: [{ translateY: coinY }, { scale: coinScale }],
                    }]}>
                    <ThemedText style={s.floatingCoinText}>🪙</ThemedText>
                  </Animated.View>
                )}
              </View>
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

  bubbleWrap:  { maxWidth: '80%' },
  bubbleLeft:  { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },

  bubble: {
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

  barBg:   { height: 2, borderRadius: 1, overflow: 'hidden' },
  barFill: { height: 2, borderRadius: 1 },

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
  sendCost:    { fontSize: 9, color: C.gold, textAlign: 'center' },

  floatingCoin: {
    position: 'absolute',
    bottom: 44,
    alignSelf: 'center',
    zIndex: 99,
  },
  floatingCoinText: { fontSize: 22 },

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
