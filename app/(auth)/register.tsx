import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { supabase } from '@/lib/supabase';

const AVATARS = ['🙏', '✝️', '📖', '🕊️', '⭐', '🏆', '👼', '🌟'];

async function fetchLegalUrls(): Promise<{ termos: string; privacidade: string }> {
  const { data } = await supabase
    .from('app_config')
    .select('key, value')
    .in('key', ['url_termos', 'url_privacidade']);

  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;

  return {
    termos:      map['url_termos']      ?? '',
    privacidade: map['url_privacidade'] ?? '',
  };
}

function maskDate(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function calcAge(date: string): number {
  const [dd, mm, yyyy] = date.split('/').map(Number);
  if (!dd || !mm || !yyyy || yyyy < 1900 || yyyy > new Date().getFullYear()) return -1;
  const birth = new Date(yyyy, mm - 1, dd);
  if (isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function toISODate(date: string): string {
  const [dd, mm, yyyy] = date.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

export default function RegisterScreen() {
  const theme = useTheme();
  const { signUp, setGuest } = useAuth();

  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [avatar,        setAvatar]        = useState('🙏');
  const [birthDate,     setBirthDate]     = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [urlTermos,     setUrlTermos]     = useState('');
  const [urlPriv,       setUrlPriv]       = useState('');

  useEffect(() => {
    fetchLegalUrls().then(({ termos, privacidade }) => {
      setUrlTermos(termos);
      setUrlPriv(privacidade);
    }).catch(() => {});
  }, []);

  async function handleRegister() {
    setError(null);

    if (!name.trim())         { setError('Digite seu nome.'); return; }
    if (!email.trim())        { setError('Digite seu e-mail.'); return; }
    if (password.length < 6)  { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    if (birthDate.length < 10){ setError('Digite sua data de nascimento completa.'); return; }

    const age = calcAge(birthDate);
    if (age < 0)  { setError('Data de nascimento inválida.'); return; }
    if (age < 13) { setError('É necessário ter pelo menos 13 anos para se cadastrar (LGPD).'); return; }
    if (!acceptedTerms) { setError('Você precisa aceitar os Termos de Uso e a Política de Privacidade.'); return; }

    setLoading(true);
    const err = await signUp(
      email.trim().toLowerCase(),
      password,
      name.trim(),
      avatar,
      toISODate(birthDate),
    );
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
              <Image source={require('@/assets/images/logo_SantosPlay.png')} style={s.logo} resizeMode="contain" />
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

            {/* Nome */}
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

            {/* E-mail */}
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

            {/* Senha */}
            <View style={s.section}>
              <ThemedText style={[s.label, { color: theme.textSecondary }]}>SENHA</ThemedText>
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

            {/* Data de nascimento */}
            <View style={s.section}>
              <ThemedText style={[s.label, { color: theme.textSecondary }]}>DATA DE NASCIMENTO</ThemedText>
              <TextInput
                style={[s.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
                value={birthDate}
                onChangeText={v => setBirthDate(maskDate(v))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <ThemedText style={[s.inputHint, { color: theme.textSecondary }]}>
                Necessário para verificação de idade (LGPD)
              </ThemedText>
            </View>

            {/* Aceite de termos */}
            <TouchableOpacity
              style={s.termsRow}
              onPress={() => setAcceptedTerms(v => !v)}
              activeOpacity={0.75}>
              <View style={[
                s.checkbox,
                { borderColor: acceptedTerms ? C.purple : theme.textSecondary },
                acceptedTerms && { backgroundColor: C.purple },
              ]}>
                {acceptedTerms && <ThemedText style={s.checkmark}>✓</ThemedText>}
              </View>
              <View style={s.termsText}>
                <ThemedText style={[s.termsBase, { color: theme.text }]}>
                  Li e aceito os{' '}
                  <ThemedText
                    style={[s.termsLink, { color: C.purple, opacity: urlTermos ? 1 : 0.5 }]}
                    onPress={() => urlTermos && Linking.openURL(urlTermos)}>
                    Termos de Uso
                  </ThemedText>
                  {' '}e a{' '}
                  <ThemedText
                    style={[s.termsLink, { color: C.purple, opacity: urlPriv ? 1 : 0.5 }]}
                    onPress={() => urlPriv && Linking.openURL(urlPriv)}>
                    Política de Privacidade
                  </ThemedText>
                  , incluindo o tratamento dos meus dados pessoais.
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Aviso LGPD */}
            <View style={[s.lgpdNotice, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
              <ThemedText style={[s.lgpdText, { color: theme.textSecondary }]}>
                🔒 Seus dados são protegidos pela Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
                Coletamos apenas o necessário para o funcionamento do app.
              </ThemedText>
            </View>

            {/* Erro */}
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

            {/* Skip auth */}
            <TouchableOpacity
              style={s.skipBtn}
              onPress={() => { setGuest(true); router.replace('/(tabs)'); }}
              activeOpacity={0.6}>
              <ThemedText style={[s.skipTxt, { color: theme.textSecondary }]}>
                Cadastrar depois
              </ThemedText>
            </TouchableOpacity>

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
  logo:       { width: 140, height: 140 },
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
  inputHint: { fontSize: 11, marginTop: 2 },

  // Checkbox de termos
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 17 },
  termsText: { flex: 1 },
  termsBase: { fontSize: 13, lineHeight: 20 },
  termsLink: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },

  // Aviso LGPD
  lgpdNotice: {
    borderRadius: C.radius.md,
    borderWidth: 1,
    padding: Spacing.two,
  },
  lgpdText: { fontSize: 12, lineHeight: 18 },

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
  skipBtn:   { alignItems: 'center', paddingTop: Spacing.one },
  skipTxt:   { fontSize: 13 },
});
