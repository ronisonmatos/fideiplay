import { useState } from 'react';
import {
  Appearance,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import { useGameStore } from '@/context/game-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

interface User {
  name: string;
  email: string;
  totalScore: number;
  gamesPlayed: number;
}

type AuthView = 'main' | 'login' | 'register';

const ACHIEVEMENTS = [
  { id: 'primeiroPasso', emoji: '🎯', title: 'Primeiro Passo', desc: 'Complete qualquer jogo' },
  { id: 'biblista',      emoji: '📖', title: 'Biblista',       desc: 'Acerte 5 versículos seguidos' },
  { id: 'apostolo',      emoji: '✝️', title: 'Apóstolo',       desc: 'Complete a Peregrinação Virtual' },
  { id: 'stopMestre',    emoji: '🛑', title: 'Stop Mestre',    desc: 'Preencha tudo no Stop Católico' },
  { id: 'conhecedor',    emoji: '🏆', title: 'Conhecedor',     desc: 'Acerte 10/10 no Quiz dos Santos' },
  { id: 'relampago',     emoji: '⏱️', title: 'Relâmpago',      desc: 'Desafio Litúrgico com 30s sobrando' },
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContaScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { totalScore, gamesPlayed, unlockedAchievements } = useGameStore();

  const [view, setView] = useState<AuthView>('main');
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => { setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setError(''); };
  const goTo = (v: AuthView) => { resetForm(); setView(v); };

  const handleLogin = () => {
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    setUser({ name: email.split('@')[0], email, totalScore: 0, gamesPlayed: 0 });
    resetForm(); setView('main');
  };

  const handleRegister = () => {
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setUser({ name: name.trim(), email, totalScore: 0, gamesPlayed: 0 });
    resetForm(); setView('main');
  };

  const handleLogout = () => { setUser(null); setView('main'); };
  const toggleTheme = () => { Appearance.setColorScheme(isDark ? 'light' : 'dark'); };

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      borderColor: C.border,
      backgroundColor: theme.backgroundElement,
    },
  ];

  if (view === 'login') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerStyle={[styles.formScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
              keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => goTo('main')} style={styles.backRow}>
                <ThemedText style={styles.backArrow}>←</ThemedText>
                <ThemedText themeColor="textSecondary">Voltar</ThemedText>
              </TouchableOpacity>
              <ThemedText type="subtitle">Entrar</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.formDesc}>
                Acesse sua conta para salvar seus pontos e conquistas.
              </ThemedText>
              <View style={styles.fields}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>E-MAIL</ThemedText>
                  <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor={theme.textSecondary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>SENHA</ThemedText>
                  <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" />
                </View>
                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.8}>
                  <ThemedText style={styles.primaryBtnText}>ENTRAR</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => goTo('register')} style={styles.linkRow}>
                  <ThemedText themeColor="textSecondary" style={styles.linkText}>
                    Não tem conta? <ThemedText style={styles.link}>Criar conta</ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (view === 'register') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              contentContainerStyle={[styles.formScroll, { paddingBottom: BottomTabInset + Spacing.five }]}
              keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => goTo('main')} style={styles.backRow}>
                <ThemedText style={styles.backArrow}>←</ThemedText>
                <ThemedText themeColor="textSecondary">Voltar</ThemedText>
              </TouchableOpacity>
              <ThemedText type="subtitle">Criar conta</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.formDesc}>
                Registre-se para salvar seus pontos e competir no ranking.
              </ThemedText>
              <View style={styles.fields}>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>NOME</ThemedText>
                  <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={theme.textSecondary} autoCapitalize="words" autoCorrect={false} />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>E-MAIL</ThemedText>
                  <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor={theme.textSecondary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>SENHA</ThemedText>
                  <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>CONFIRMAR SENHA</ThemedText>
                  <TextInput style={inputStyle} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a senha" placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" />
                </View>
                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} activeOpacity={0.8}>
                  <ThemedText style={styles.primaryBtnText}>CRIAR CONTA</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => goTo('login')} style={styles.linkRow}>
                  <ThemedText themeColor="textSecondary" style={styles.linkText}>
                    Já tem conta? <ThemedText style={styles.link}>Entrar</ThemedText>
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (user) {
    const initials = getInitials(user.name);
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <ScrollView contentContainerStyle={[styles.mainScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: C.purple }]}>
                <ThemedText style={styles.avatarText}>{initials}</ThemedText>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="subtitle" style={{ fontSize: 22 }}>{user.name}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>{user.email}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.sectionLabel}>PONTUAÇÃO</ThemedText>
            <View style={styles.scoreRow}>
              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <ThemedText style={styles.scoreEmoji}>🏆</ThemedText>
                <ThemedText type="subtitle" style={[styles.scoreValue, { color: C.gold }]}>{totalScore}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.scoreSmall}>Pontos totais</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <ThemedText style={styles.scoreEmoji}>🎮</ThemedText>
                <ThemedText type="subtitle" style={[styles.scoreValue, { color: C.purple }]}>{gamesPlayed}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.scoreSmall}>Jogos jogados</ThemedText>
              </ThemedView>
            </View>
            {gamesPlayed === 0 && (
              <ThemedText themeColor="textSecondary" style={styles.emptyScore}>Jogue para acumular pontos! 🙏</ThemedText>
            )}

            <ThemedText style={styles.sectionLabel}>CONQUISTAS</ThemedText>
            <View style={styles.achievementGrid}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <ThemedView
                    key={a.title}
                    type="backgroundElement"
                    style={[
                      styles.achievementCard,
                      unlocked && { borderWidth: 1, borderColor: C.purple + '55' },
                    ]}>
                    <ThemedText style={[styles.achievementEmoji, !unlocked && styles.locked]}>{a.emoji}</ThemedText>
                    <ThemedText type="smallBold" style={[styles.achievementTitle, !unlocked && styles.locked]}>{a.title}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.achievementDesc}>{a.desc}</ThemedText>
                    <ThemedText style={styles.lockIcon}>{unlocked ? '✅' : '🔒'}</ThemedText>
                  </ThemedView>
                );
              })}
            </View>

            <ThemedText style={styles.sectionLabel}>PREFERÊNCIAS</ThemedText>
            <ThemedView type="backgroundElement" style={styles.prefCard}>
              <View style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <ThemedText style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</ThemedText>
                  <View>
                    <ThemedText type="smallBold">Tema</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                      {isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}
                    </ThemedText>
                  </View>
                </View>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#3a3a5c', true: C.purple }} thumbColor="#ffffff" />
              </View>
            </ThemedView>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
              <ThemedText style={styles.logoutText}>Sair da conta</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView contentContainerStyle={[styles.mainScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
          <View style={styles.loggedOutHero}>
            <View style={[styles.heroLogo, { backgroundColor: C.purple }]}>
              <ThemedText style={styles.heroLogoText}>✝</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.textCenter}>Minha Conta</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.heroDesc]}>
              Entre ou crie uma conta para salvar seus pontos, conquistas e competir no ranking.
            </ThemedText>
          </View>
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo('login')} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>ENTRAR</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => goTo('register')} activeOpacity={0.8}>
              <ThemedText style={styles.secondaryBtnText}>CRIAR CONTA</ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.sectionLabel}>PREFERÊNCIAS</ThemedText>
          <ThemedView type="backgroundElement" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <ThemedText style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</ThemedText>
                <View>
                  <ThemedText type="smallBold">Tema</ThemedText>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}
                  </ThemedText>
                </View>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#3a3a5c', true: C.purple }} thumbColor="#ffffff" />
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  textCenter: { textAlign: 'center' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#9B97D4',
    textTransform: 'uppercase',
  },
  formScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.one },
  backArrow: { fontSize: 20 },
  formDesc: { fontSize: 14, lineHeight: 20, marginTop: -Spacing.two },
  fields: { gap: Spacing.two },
  fieldGroup: { gap: Spacing.one },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, color: '#9B97D4' },
  input: {
    borderWidth: 1,
    borderRadius: C.radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 15,
  },
  errorText: { color: C.red, fontSize: 13, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: C.purple,
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.one,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.2 },
  linkRow: { alignItems: 'center', paddingVertical: Spacing.one },
  linkText: { fontSize: 14 },
  link: { color: C.purple, fontWeight: '600' },
  mainScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileInfo: { gap: 2 },
  scoreRow: { flexDirection: 'row', gap: Spacing.two },
  scoreCard: {
    flex: 1,
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  scoreEmoji: { fontSize: 28 },
  scoreValue: { fontSize: 28 },
  scoreSmall: { fontSize: 12, textAlign: 'center' },
  emptyScore: { fontSize: 13, textAlign: 'center', marginTop: -Spacing.one },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  achievementCard: {
    width: '47%',
    borderRadius: C.radius.md,
    padding: Spacing.two,
    gap: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  achievementEmoji: { fontSize: 26 },
  achievementTitle: { fontSize: 13 },
  achievementDesc: { fontSize: 11, lineHeight: 15 },
  lockIcon: { fontSize: 14, position: 'absolute', top: 8, right: 8 },
  locked: { opacity: 0.35 },
  prefCard: {
    borderRadius: C.radius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: C.border,
  },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logoutBtn: {
    borderWidth: 1,
    borderColor: C.red + '88',
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  logoutText: { color: C.red, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  loggedOutHero: { alignItems: 'center', paddingTop: Spacing.four, gap: Spacing.two },
  heroLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  heroLogoText: { color: '#fff', fontSize: 32 },
  heroDesc: { fontSize: 14, lineHeight: 20 },
  authButtons: { gap: Spacing.two },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: C.purple + '88',
    paddingVertical: 14,
    borderRadius: C.radius.pill,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: C.purple, letterSpacing: 1.0 },
});
