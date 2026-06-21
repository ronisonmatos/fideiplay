import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
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

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, setGuest } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return; }

    setLoading(true);
    setError(null);

    const err = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);

    if (err) {
      if (err.includes('Invalid login') || err.includes('invalid')) {
        setError('E-mail ou senha incorretos.');
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
          <View style={s.inner}>

            {/* Logo */}
            <View style={s.logoBlock}>
              <Image source={require('@/assets/images/logo_SantosPlay.png')} style={s.logo} resizeMode="contain" />
              <ThemedText style={[s.subtitle, { color: theme.textSecondary }]}>
                Bem-vindo de volta!
              </ThemedText>
            </View>

            {/* Inputs */}
            <View style={s.form}>
              <View style={s.field}>
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

              <View style={s.field}>
                <ThemedText style={[s.label, { color: theme.textSecondary }]}>SENHA</ThemedText>
                <TextInput
                  style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}>
                <ThemedText style={s.btnTxt}>
                  {loading ? 'ENTRANDO...' : 'ENTRAR'}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View style={s.footer}>
              <ThemedText style={[s.footerTxt, { color: theme.textSecondary }]}>
                Não tem conta?{' '}
              </ThemedText>
              <TouchableOpacity onPress={() => router.replace('/(auth)/register')} activeOpacity={0.7}>
                <ThemedText style={[s.footerTxt, { color: C.purple, fontWeight: '700' }]}>
                  Criar conta
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Skip auth */}
            <TouchableOpacity
              style={s.skipBtn}
              onPress={() => { setGuest(true); router.replace('/(tabs)'); }}
              activeOpacity={0.6}>
              <ThemedText style={[s.skipTxt, { color: theme.textSecondary }]}>
                Cadastrar depois
              </ThemedText>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:      { flex: 1 },
  inner:     { flex: 1, paddingHorizontal: Spacing.four, justifyContent: 'center', gap: Spacing.five },
  logoBlock: { alignItems: 'center', gap: Spacing.one },
  logo:      { width: 140, height: 140 },
  subtitle:  { fontSize: 14, textAlign: 'center' },
  form:      { gap: Spacing.three },
  field:     { gap: Spacing.one },
  label:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
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
  footer:    { flexDirection: 'row', justifyContent: 'center' },
  footerTxt: { fontSize: 14 },
  skipBtn:   { alignItems: 'center', paddingTop: Spacing.one },
  skipTxt:   { fontSize: 13 },
});
