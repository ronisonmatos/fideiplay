import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Appearance,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notifications-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

const APP_VERSION = '1.0.0';

export default function ConfiguracoesScreen() {
  const theme       = useTheme();
  const colorScheme = useColorScheme();
  const { user }    = useAuth();
  const isDark      = colorScheme === 'dark';

  const { muteChat, setMuteChat } = useNotifications();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    Appearance.setColorScheme(next);
    AsyncStorage.setItem('@fideiplay:theme', next).catch(() => {});
  };

  async function handleSendSupport() {
    const trimmed = message.trim();
    if (!trimmed) { Alert.alert('Mensagem vazia', 'Escreva uma mensagem antes de enviar.'); return; }
    setSending(true);
    const { error } = await supabase.from('support_messages').insert({
      user_id:  user?.id ?? null,
      email:    user?.email ?? null,
      message:  trimmed,
    });
    setSending(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível enviar. Tente novamente.');
    } else {
      setMessage('');
      Alert.alert('Enviado!', 'Sua mensagem foi enviada. Responderemos em breve. 🙏');
    }
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <ThemedText style={[s.backArrow, { color: theme.text }]}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Configurações</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}>

          {/* Aparência */}
          <ThemedText style={s.sectionLabel}>APARÊNCIA</ThemedText>
          <ThemedView type="backgroundElement" style={s.card}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <ThemedText style={{ fontSize: 22 }}>{isDark ? '🌙' : '☀️'}</ThemedText>
                <View>
                  <ThemedText type="smallBold">Tema</ThemedText>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#3a3a5c', true: C.purple }}
                thumbColor="#ffffff"
              />
            </View>
          </ThemedView>

          {/* Chat */}
          <ThemedText style={s.sectionLabel}>CHAT</ThemedText>
          <ThemedView type="backgroundElement" style={s.card}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <ThemedText style={{ fontSize: 22 }}>🔕</ThemedText>
                <View>
                  <ThemedText type="smallBold">Silenciar chat</ThemedText>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {muteChat ? 'Notificações desativadas' : 'Notificar novas mensagens'}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={muteChat}
                onValueChange={setMuteChat}
                trackColor={{ false: '#3a3a5c', true: C.purple }}
                thumbColor="#ffffff"
              />
            </View>
          </ThemedView>

          {/* Versão */}
          <ThemedText style={s.sectionLabel}>SOBRE O APP</ThemedText>
          <ThemedView type="backgroundElement" style={s.card}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <ThemedText style={{ fontSize: 22 }}>📱</ThemedText>
                <View>
                  <ThemedText type="smallBold">Versão do app</ThemedText>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    FideiPlay v{APP_VERSION}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Suporte */}
          <ThemedText style={s.sectionLabel}>SUPORTE</ThemedText>
          <ThemedView type="backgroundElement" style={s.card}>
            <View style={{ gap: Spacing.two }}>
              <View style={s.rowLeft}>
                <ThemedText style={{ fontSize: 22 }}>💬</ThemedText>
                <View>
                  <ThemedText type="smallBold">Enviar mensagem</ThemedText>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    Dúvidas, sugestões ou problemas
                  </ThemedText>
                </View>
              </View>
              <TextInput
                style={[s.textArea, {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: C.border,
                }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Escreva sua mensagem aqui..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <ThemedText themeColor="textSecondary" style={{ fontSize: 11, textAlign: 'right' }}>
                {message.length}/500
              </ThemedText>
              <TouchableOpacity
                style={[s.sendBtn, { opacity: sending ? 0.6 : 1 }]}
                onPress={handleSendSupport}
                disabled={sending}
                activeOpacity={0.8}>
                <ThemedText style={s.sendBtnText}>
                  {sending ? 'ENVIANDO...' : 'ENVIAR MENSAGEM'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  backBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backArrow:   { fontSize: 26 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    color: '#9B97D4', textTransform: 'uppercase',
  },
  card: {
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
  },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  textArea: {
    borderWidth: 1.5,
    borderRadius: C.radius.md,
    padding: Spacing.two,
    fontSize: 14,
    minHeight: 100,
    ...Platform.select({ android: { textAlignVertical: 'top' } }),
  },
  sendBtn: {
    backgroundColor: C.purple,
    paddingVertical: 13,
    borderRadius: C.radius.pill,
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
