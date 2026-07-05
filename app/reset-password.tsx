import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();

  const [validating, setValidating] = useState(true);
  const [linkError,  setLinkError]  = useState<string | null>(null);
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    (async () => {
      if (error_description) {
        setLinkError('Este link expirou ou já foi usado. Solicite um novo.');
        setValidating(false);
        return;
      }
      if (!code) {
        setLinkError('Link de recuperação inválido.');
        setValidating(false);
        return;
      }
      const { error: err } = await supabase.auth.exchangeCodeForSession(code);
      if (err) setLinkError('Este link expirou ou já foi usado. Solicite um novo.');
      setValidating(false);
    })();
  }, [code, error_description]);

  async function handleSubmit() {
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      await supabase.auth.signOut();
      setDone(true);
    }
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.inner}>

            <View style={s.header}>
              <ThemedText style={s.emoji}>🔒</ThemedText>
              <ThemedText style={[s.title, { color: theme.text }]}>Nova senha</ThemedText>
              {!validating && !linkError && !done && (
                <ThemedText style={[s.sub, { color: theme.textSecondary }]}>
                  Defina a nova senha para sua conta.
                </ThemedText>
              )}
            </View>

            {validating && (
              <ThemedText style={[s.sub, { color: theme.textSecondary }]}>Validando link...</ThemedText>
            )}

            {!validating && linkError && (
              <>
                <View style={[s.errorBox, { backgroundColor: C.red + '22', borderColor: C.red }]}>
                  <ThemedText style={{ color: C.red, fontSize: 13 }}>{linkError}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: C.purple }]}
                  onPress={() => router.replace('/(auth)/forgot-password')}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnTxt}>SOLICITAR NOVO LINK</ThemedText>
                </TouchableOpacity>
              </>
            )}

            {!validating && !linkError && !done && (
              <View style={s.form}>
                <View style={s.field}>
                  <ThemedText style={[s.label, { color: theme.textSecondary }]}>NOVA SENHA</ThemedText>
                  <TextInput
                    style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    returnKeyType="next"
                  />
                </View>

                <View style={s.field}>
                  <ThemedText style={[s.label, { color: theme.textSecondary }]}>CONFIRMAR SENHA</ThemedText>
                  <TextInput
                    style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repita a senha"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>

                {error ? (
                  <View style={[s.errorBox, { backgroundColor: C.red + '22', borderColor: C.red }]}>
                    <ThemedText style={{ color: C.red, fontSize: 13 }}>{error}</ThemedText>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[s.btn, { backgroundColor: C.purple, opacity: loading ? 0.6 : 1 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnTxt}>
                    {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {done && (
              <>
                <ThemedText style={[s.sub, { color: theme.textSecondary }]}>
                  Senha atualizada! Entre novamente com sua nova senha.
                </ThemedText>
                <TouchableOpacity
                  style={[s.btn, { backgroundColor: C.purple }]}
                  onPress={() => router.replace('/(auth)/login')}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnTxt}>IR PARA LOGIN</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill:     { flex: 1 },
  inner:    { flex: 1, paddingHorizontal: Spacing.four, justifyContent: 'center', gap: Spacing.four },
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
