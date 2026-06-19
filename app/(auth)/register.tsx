import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const AVATARS = ['🙏', '✝️', '📖', '🕊️', '⭐', '🏆', '👼', '🌟'];

export default function RegisterScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [avatar,   setAvatar]   = useState('🙏');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleRegister() {
    if (!name.trim())     { setError('Digite seu nome.'); return; }
    if (!email.trim())    { setError('Digite seu e-mail.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }

    setLoading(true);
    setError(null);

    const err = await signUp(email.trim().toLowerCase(), password, name.trim(), avatar);
    setLoading(false);

    if (err) {
      if (err.includes('already registered') || err.includes('already been registered')) {
        setError('E-mail já cadastrado. Faça login.');
      } else if (err.includes('invalid')) {
        setError('E-mail inválido.');
      } else {
        setError(err);
      }
    }
    // AuthProvider detecta sessão e _layout redireciona automaticamente
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Logo */}
            <View style={s.logoBlock}>
              <ThemedText style={s.logoEmoji}>✝️</ThemedText>
              <ThemedText style={s.appName}>FideiPlay</ThemedText>
              <ThemedText style={[s.subtitle, { color: theme.textSecondary }]}>
                Crie sua conta e comece a jogar
              </ThemedText>
            </View>

            {/* Avatar picker */}
            <View style={s.section}>
              <ThemedText style={[s.label, { color: theme.textSecondary }]}>SEU AVATAR</ThemedText>
              <View style={s.avatarRow}>
                {AVATARS.map(a => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setAvatar(a)}
                    style={[
                      s.avatarBtn,
                      { backgroundColor: theme.backgroundElement },
                      avatar === a && { backgroundColor: C.purple, borderColor: C.purple },
                    ]}
                    activeOpacity={0.75}>
                    <ThemedText style={s.avatarEmoji}>{a}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Inputs */}
            <View style={s.section}>
              <ThemedText style={[s.label, { color: theme.textSecondary }]}>NOME</ThemedText>
              <TextInput
                style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                value={name}
                onChangeText={setName}
                placeholder="Como você quer ser chamado?"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={s.section}>
              <ThemedText style={[s.label, { color: theme.textSecondary }]}>E-MAIL</ThemedText>
              <TextInput
                style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={s.section}>
              <ThemedText style={[s.label, { color: theme.textSecondary }]}>SENHA</ThemedText>
              <TextInput
                style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            {/* Error */}
            {error ? (
              <View style={[s.errorBox, { backgroundColor: C.red + '22', borderColor: C.red }]}>
                <ThemedText style={{ color: C.red, fontSize: 13 }}>{error}</ThemedText>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: C.purple, opacity: loading ? 0.6 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}>
              <ThemedText style={s.btnTxt}>
                {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
              </ThemedText>
            </TouchableOpacity>

            {/* Login link */}
            <View style={s.footer}>
              <ThemedText style={[s.footerTxt, { color: theme.textSecondary }]}>
                Já tem uma conta?{' '}
              </ThemedText>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
                <ThemedText style={[s.footerTxt, { color: C.purple, fontWeight: '700' }]}>
                  Entrar
                </ThemedText>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:       { flex: 1 },
  scroll:     { paddingHorizontal: Spacing.four, paddingTop: Spacing.five, paddingBottom: Spacing.five, gap: Spacing.three },
  logoBlock:  { alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.two },
  logoEmoji:  { fontSize: 48 },
  appName:    { fontSize: 30, fontWeight: '900', letterSpacing: 0.5, color: C.purple },
  subtitle:   { fontSize: 14, textAlign: 'center' },
  section:    { gap: Spacing.one },
  label:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  avatarRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  avatarBtn:  { width: 48, height: 48, borderRadius: C.radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarEmoji:{ fontSize: 24 },
  input: {
    borderWidth: 1.5,
    borderRadius: C.radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    fontSize: 15,
  },
  errorBox: { borderWidth: 1, borderRadius: C.radius.md, padding: Spacing.two },
  btn: {
    paddingVertical: 15,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnTxt:    { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
  footer:    { flexDirection: 'row', justifyContent: 'center', paddingTop: Spacing.one },
  footerTxt: { fontSize: 14 },
});
