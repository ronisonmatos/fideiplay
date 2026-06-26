import { useState } from 'react';
import {
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
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleReset() {
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'santosplay://reset-password',
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.inner}>

            <TouchableOpacity onPress={() => router.back()} style={s.backRow} activeOpacity={0.7}>
              <ThemedText style={{ color: C.purple, fontSize: 22 }}>←</ThemedText>
              <ThemedText style={{ color: C.purple, fontSize: 14, fontWeight: '700' }}>Voltar</ThemedText>
            </TouchableOpacity>

            <View style={s.header}>
              <ThemedText style={s.emoji}>🔑</ThemedText>
              <ThemedText style={[s.title, { color: theme.text }]}>Recuperar senha</ThemedText>
              <ThemedText style={[s.sub, { color: theme.textSecondary }]}>
                {sent
                  ? 'Verifique seu e-mail. Enviamos um link para redefinir sua senha.'
                  : 'Informe seu e-mail cadastrado e enviaremos um link de recuperação.'}
              </ThemedText>
            </View>

            {!sent && (
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
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                  />
                </View>

                {error ? (
                  <View style={[s.errorBox, { backgroundColor: C.red + '22', borderColor: C.red }]}>
                    <ThemedText style={{ color: C.red, fontSize: 13 }}>{error}</ThemedText>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[s.btn, { backgroundColor: C.purple, opacity: loading ? 0.6 : 1 }]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnTxt}>
                    {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {sent && (
              <TouchableOpacity
                style={[s.btn, { backgroundColor: C.purple }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}>
                <ThemedText style={s.btnTxt}>VOLTAR AO LOGIN</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:     { flex: 1 },
  inner:    { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.four },
  backRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  header:   { alignItems: 'center', gap: Spacing.two },
  emoji:    { fontSize: 52, lineHeight: 64, textAlign: 'center' },
  title:    { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sub:      { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  form:     { gap: Spacing.three },
  field:    { gap: Spacing.one },
  label:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
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
  },
  btnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
});
