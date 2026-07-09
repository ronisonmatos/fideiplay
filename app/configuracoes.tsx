import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Appearance,
  KeyboardAvoidingView,
  Modal,
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
import { useRef, useState } from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AvatarImage } from '@/components/avatar-image';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notifications-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useConvite } from '@/hooks/use-convite';
import { useTheme } from '@/hooks/use-theme';
import { aplicarConvite } from '@/lib/convites';
import { restaurarComprasApple } from '@/lib/iap';
import { trilhaIdDoProduct } from '@/lib/iap-products';
import { supabase } from '@/lib/supabase';
import { AVATARES_SANTOS, getAvatarNome } from '@/constants/avatares';

// No Expo Go, Application.native* retorna a versão do app Expo Go (host nativo),
// não a do nosso projeto — por isso a versão em si vem sempre do app.json via
// Constants, e o build number nativo só é usado fora do Expo Go.
const isExpoGo   = Constants.appOwnership === 'expo';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const APP_BUILD   = isExpoGo ? null : Application.nativeBuildVersion;

export default function ConfiguracoesScreen() {
  const theme       = useTheme();
  const colorScheme = useColorScheme();
  const { user, profile, refreshProfile, refreshTrilhas } = useAuth();
  const isDark      = colorScheme === 'dark';

  const { muteChat, setMuteChat } = useNotifications();
  const { convidarAmigo, gerando: gerandoConvite } = useConvite();
  const [codigoConvite, setCodigoConvite] = useState('');
  const [aplicandoConvite, setAplicandoConvite] = useState(false);
  const [message,       setMessage]       = useState('');
  const [sending,       setSending]       = useState(false);
  const [avatarModal,   setAvatarModal]   = useState(false);
  const [savingAvatar,  setSavingAvatar]  = useState(false);
  const [pickedAvatar,  setPickedAvatar]  = useState<string | null>(null);
  const [restaurando,   setRestaurando]   = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Exigência da Apple para non-consumables — usuário precisa conseguir
  // recuperar uma trilha comprada antes (reinstall, troca de aparelho).
  async function handleRestaurarCompras() {
    setRestaurando(true);
    try {
      const purchases = await restaurarComprasApple();
      let liberadas = 0;
      for (const purchase of purchases) {
        const trilhaId = trilhaIdDoProduct(purchase.productId);
        if (!trilhaId) continue;
        const { data } = await supabase.functions.invoke('verify-apple-iap', {
          body: { transactionId: purchase.transactionId, productId: purchase.productId, trilhaId },
        });
        if (data?.status === 'approved') liberadas++;
      }
      await refreshTrilhas();
      Alert.alert(
        liberadas > 0 ? 'Compras restauradas' : 'Nenhuma compra encontrada',
        liberadas > 0
          ? `${liberadas} trilha${liberadas > 1 ? 's' : ''} restaurada${liberadas > 1 ? 's' : ''} com sucesso.`
          : 'Não encontramos nenhuma compra anterior associada a esta conta Apple.',
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível restaurar suas compras. Tente novamente.');
    } finally {
      setRestaurando(false);
    }
  }

  async function handleSaveAvatar() {
    const chosen = pickedAvatar ?? profile?.avatar_emoji;
    if (!chosen || !user) return;
    setSavingAvatar(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_emoji: chosen })
      .eq('id', user.id);
    setSavingAvatar(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } else {
      await refreshProfile();
      setAvatarModal(false);
      setPickedAvatar(null);
    }
  }

  async function handleAplicarCodigoConvite() {
    const codigo = codigoConvite.trim().toUpperCase();
    if (!codigo || !user) return;
    setAplicandoConvite(true);
    const ok = await aplicarConvite(codigo, user.id);
    setAplicandoConvite(false);
    if (ok) {
      await refreshProfile();
      setCodigoConvite('');
      Alert.alert('Convite aplicado! 🎉', 'Você e quem te convidou ganharam moedas.');
    } else {
      Alert.alert('Código inválido', 'Esse código já foi usado, não existe ou é seu próprio convite.');
    }
  }

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    Appearance.setColorScheme(next);
    AsyncStorage.setItem('@santosplay:theme', next).catch(() => {});
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

  const currentAvatar = pickedAvatar ?? profile?.avatar_emoji ?? '';

  return (
    <ThemedView style={s.fill}>

      {/* Modal de troca de avatar */}
      <Modal
        visible={avatarModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAvatarModal(false)}>
        <View style={s.modalOverlay}>
          <ThemedView style={s.modalSheet}>
            {/* Handle */}
            <View style={s.modalHandle} />

            <ThemedText style={[s.modalTitle, { color: theme.text }]}>Escolha seu Santo Patrono</ThemedText>

            {/* Preview do selecionado */}
            <View style={s.modalPreview}>
              <AvatarImage value={currentAvatar} size={72} borderColor={C.purple} />
              <ThemedText style={[s.modalSelectedName, { color: C.purple }]}>
                {getAvatarNome(currentAvatar) || currentAvatar}
              </ThemedText>
            </View>

            {/* Grade de avatares */}
            <ScrollView contentContainerStyle={s.avatarGrid} showsVerticalScrollIndicator={false}>
              {AVATARES_SANTOS.map(a => {
                const selected = currentAvatar === a.filename;
                return (
                  <TouchableOpacity
                    key={a.filename}
                    onPress={() => setPickedAvatar(a.filename)}
                    style={[s.avatarBtn, { borderColor: selected ? C.purple : 'transparent' }]}
                    activeOpacity={0.75}>
                    <AvatarImage value={a.filename} size={56} />
                    <ThemedText style={[s.avatarBtnLabel, { color: selected ? C.purple : theme.textSecondary }]} numberOfLines={2}>
                      {a.nome}
                    </ThemedText>
                    {selected && <View style={s.avatarDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Ações */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setAvatarModal(false); setPickedAvatar(null); }} activeOpacity={0.7}>
                <ThemedText style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { opacity: savingAvatar ? 0.6 : 1 }]}
                onPress={handleSaveAvatar}
                disabled={savingAvatar}
                activeOpacity={0.8}>
                <ThemedText style={s.saveBtnText}>{savingAvatar ? 'SALVANDO...' : 'SALVAR'}</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <SafeAreaView style={s.fill} edges={['top']}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <ThemedText style={[s.backArrow, { color: theme.text }]}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Configurações</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView
          style={s.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[s.scroll, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Meu Perfil */}
          {user && profile && (
            <>
              <ThemedText style={s.sectionLabel}>MEU PERFIL</ThemedText>
              <ThemedView type="backgroundElement" style={s.card}>
                <TouchableOpacity style={s.row} onPress={() => { setPickedAvatar(null); setAvatarModal(true); }} activeOpacity={0.75}>
                  <View style={s.rowLeft}>
                    <AvatarImage value={profile.avatar_emoji} size={44} borderColor={C.purple} />
                    <View>
                      <ThemedText type="smallBold">Meu Santo Patrono</ThemedText>
                      <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                        {getAvatarNome(profile.avatar_emoji) || profile.avatar_emoji}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={{ color: C.purple, fontWeight: '700' }}>Trocar</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </>
          )}

          {/* Convide amigos */}
          {user && (
            <>
              <ThemedText style={s.sectionLabel}>CONVIDE AMIGOS</ThemedText>
              <ThemedView type="backgroundElement" style={s.card}>
                <View style={s.rowLeft}>
                  <ThemedText style={{ fontSize: 22 }}>🎁</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">Convide e ganhe moedas</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                      Você e seu amigo ganham 30 🪙 cada quando ele entrar pelo seu link
                    </ThemedText>
                  </View>
                </View>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 11, marginTop: Spacing.two, lineHeight: 16 }}>
                  1️⃣ Seu amigo baixa o app SantosPlay{'\n'}
                  2️⃣ Depois, abre o link que você mandou (ou digita o código aqui embaixo) pra confirmar o convite
                </ThemedText>
                <TouchableOpacity
                  style={[s.sendBtn, { marginTop: Spacing.two, opacity: gerandoConvite ? 0.6 : 1 }]}
                  onPress={convidarAmigo}
                  disabled={gerandoConvite}
                  activeOpacity={0.8}>
                  <ThemedText style={s.sendBtnText}>
                    {gerandoConvite ? 'GERANDO LINK...' : 'CONVIDAR AMIGO'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ThemedView type="backgroundElement" style={[s.card, { marginTop: Spacing.two }]}>
                <ThemedText type="smallBold">Tenho um código de convite</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 12, marginTop: 2, marginBottom: Spacing.two }}>
                  Recebeu um código de um amigo? Digite abaixo pra resgatar seu bônus.
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  <TextInput
                    style={[s.codigoInput, { color: theme.text, borderColor: C.border }]}
                    placeholder="CÓDIGO"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={codigoConvite}
                    onChangeText={setCodigoConvite}
                  />
                  <TouchableOpacity
                    style={[s.sendBtn, { flex: 0, paddingHorizontal: Spacing.three, opacity: aplicandoConvite || !codigoConvite.trim() ? 0.6 : 1 }]}
                    onPress={handleAplicarCodigoConvite}
                    disabled={aplicandoConvite || !codigoConvite.trim()}
                    activeOpacity={0.8}>
                    <ThemedText style={s.sendBtnText}>{aplicandoConvite ? '...' : 'APLICAR'}</ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </>
          )}

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

          {/* Compras (iOS) */}
          {Platform.OS === 'ios' && user && (
            <>
              <ThemedText style={s.sectionLabel}>COMPRAS</ThemedText>
              <ThemedView type="backgroundElement" style={s.card}>
                <View style={s.rowLeft}>
                  <ThemedText style={{ fontSize: 22 }}>🔄</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">Restaurar compras</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                      Já comprou uma trilha antes? Recupere aqui após reinstalar o app ou trocar de aparelho.
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.sendBtn, { marginTop: Spacing.two, opacity: restaurando ? 0.6 : 1 }]}
                  onPress={handleRestaurarCompras}
                  disabled={restaurando}
                  activeOpacity={0.8}>
                  <ThemedText style={s.sendBtnText}>
                    {restaurando ? 'RESTAURANDO...' : 'RESTAURAR COMPRAS'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </>
          )}

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
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
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

          <ThemedText style={s.versionTxt}>
            SantosPlay v{APP_VERSION}{APP_BUILD ? ` (${APP_BUILD})` : ''}
          </ThemedText>

        </ScrollView>
        </KeyboardAvoidingView>
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
  codigoInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: C.radius.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  versionTxt:  { fontSize: 11, color: '#9B97D4', textAlign: 'center', marginTop: Spacing.two, opacity: 0.55 },

  // Modal de avatar
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingBottom: 32,
    paddingTop: Spacing.two,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 17, fontWeight: '800', textAlign: 'center',
    marginBottom: Spacing.three,
  },
  modalPreview: {
    alignItems: 'center', gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  modalSelectedName: {
    fontSize: 15, fontWeight: '800', textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.two, paddingBottom: Spacing.three,
  },
  avatarBtn: {
    width: '28%',
    alignItems: 'center', gap: 4,
    borderWidth: 2.5, borderRadius: C.radius.md,
    padding: Spacing.one,
    position: 'relative',
  },
  avatarBtnLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  avatarDot: {
    position: 'absolute', top: 4, right: 4,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.purple,
    borderWidth: 1.5, borderColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row', gap: Spacing.two,
    marginTop: Spacing.two,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: C.radius.pill, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border,
  },
  saveBtn: {
    flex: 2, backgroundColor: C.purple,
    paddingVertical: 13,
    borderRadius: C.radius.pill, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
