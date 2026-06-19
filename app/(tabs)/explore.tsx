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
import { BottomTabInset, Spacing } from '@/constants/theme';
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
  { id: 'biblista', emoji: '📖', title: 'Biblista', desc: 'Acerte 5 versículos seguidos' },
  { id: 'apostolo', emoji: '✝️', title: 'Apóstolo', desc: 'Complete a Peregrinação Virtual' },
  { id: 'stopMestre', emoji: '🛑', title: 'Stop Mestre', desc: 'Preencha tudo no Stop Católico' },
  { id: 'conhecedor', emoji: '🏆', title: 'Conhecedor', desc: 'Acerte 10/10 no Quiz dos Santos' },
  { id: 'relampago', emoji: '⏱️', title: 'Relâmpago', desc: 'Desafio Litúrgico com 30s sobrando' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
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

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); setError('');
  };

  const goTo = (v: AuthView) => { resetForm(); setView(v); };

  const handleLogin = () => {
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    setUser({ name: email.split('@')[0], email, totalScore: 0, gamesPlayed: 0 });
    resetForm();
    setView('main');
  };

  const handleRegister = () => {
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!validateEmail(email)) { setError('E-mail inválido.'); return; }
    if (password.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setUser({ name: name.trim(), email, totalScore: 0, gamesPlayed: 0 });
    resetForm();
    setView('main');
  };

  const handleLogout = () => { setUser(null); setView('main'); };

  const toggleTheme = () => { Appearance.setColorScheme(isDark ? 'light' : 'dark'); };

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement },
  ];

  if (view === 'login') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={[styles.formScroll, { paddingBottom: BottomTabInset + Spacing.five }]} keyboardShouldPersistTaps="handled">
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
                  <ThemedText style={styles.fieldLabel}>E-mail</ThemedText>
                  <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor={theme.textSecondary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Senha</ThemedText>
                  <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" />
                </View>
                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.8}>
                  <ThemedText style={styles.primaryBtnText}>Entrar</ThemedText>
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
            <ScrollView contentContainerStyle={[styles.formScroll, { paddingBottom: BottomTabInset + Spacing.five }]} keyboardShouldPersistTaps="handled">
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
                  <ThemedText style={styles.fieldLabel}>Nome</ThemedText>
                  <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={theme.textSecondary} autoCapitalize="words" autoCorrect={false} />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>E-mail</ThemedText>
                  <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor={theme.textSecondary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Senha</ThemedText>
                  <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" />
                </View>
                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Confirmar senha</ThemedText>
                  <TextInput style={inputStyle} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a senha" placeholderTextColor={theme.textSecondary} secureTextEntry autoCapitalize="none" />
                </View>
                {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} activeOpacity={0.8}>
                  <ThemedText style={styles.primaryBtnText}>Criar conta</ThemedText>
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
              <View style={[styles.avatar, { backgroundColor: '#208AEF' }]}>
                <ThemedText style={styles.avatarText}>{initials}</ThemedText>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="subtitle" style={{ fontSize: 22 }}>{user.name}</ThemedText>
                <ThemedText themeColor="textSecondary" style={{ fontSize: 13 }}>{user.email}</ThemedText>
              </View>
            </View>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>PONTUAÇÃO</ThemedText>
            <View style={styles.scoreRow}>
              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <ThemedText style={styles.scoreEmoji}>🏆</ThemedText>
                <ThemedText type="subtitle" style={styles.scoreValue}>{totalScore}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.scoreLabel}>Pontos totais</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.scoreCard}>
                <ThemedText style={styles.scoreEmoji}>🎮</ThemedText>
                <ThemedText type="subtitle" style={styles.scoreValue}>{gamesPlayed}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.scoreLabel}>Jogos jogados</ThemedText>
              </ThemedView>
            </View>
            {gamesPlayed === 0 && (
              <ThemedText themeColor="textSecondary" style={styles.emptyScore}>Jogue para acumular pontos! 🙏</ThemedText>
            )}
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>CONQUISTAS</ThemedText>
            <View style={styles.achievementGrid}>
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <ThemedView key={a.title} type="backgroundElement" style={[styles.achievementCard, unlocked && styles.achievementUnlocked]}>
                    <ThemedText style={[styles.achievementEmoji, !unlocked && styles.locked]}>{a.emoji}</ThemedText>
                    <ThemedText type="smallBold" style={[styles.achievementTitle, !unlocked && styles.locked]}>{a.title}</ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.achievementDesc}>{a.desc}</ThemedText>
                    {unlocked
                      ? <ThemedText style={styles.lockIcon}>✅</ThemedText>
                      : <ThemedText style={styles.lockIcon}>🔒</ThemedText>}
                  </ThemedView>
                );
              })}
            </View>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>PREFERÊNCIAS</ThemedText>
            <ThemedView type="backgroundElement" style={styles.prefCard}>
              <View style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <ThemedText style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</ThemedText>
                  <View>
                    <ThemedText type="smallBold">Tema</ThemedText>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}</ThemedText>
                  </View>
                </View>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: '#208AEF' }} thumbColor="#ffffff" />
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
            <View style={[styles.heroLogo, { backgroundColor: '#208AEF' }]}>
              <ThemedText style={styles.heroLogoText}>✝</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.textCenter}>Minha Conta</ThemedText>
            <ThemedText themeColor="textSecondary" style={[styles.textCenter, styles.heroDesc]}>
              Entre ou crie uma conta para salvar seus pontos, conquistas e competir no ranking.
            </ThemedText>
          </View>
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => goTo('login')} activeOpacity={0.8}>
              <ThemedText style={styles.primaryBtnText}>Entrar</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.backgroundElement }]} onPress={() => goTo('register')} activeOpacity={0.8}>
              <ThemedText style={styles.secondaryBtnText}>Criar conta</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>PREFERÊNCIAS</ThemedText>
          <ThemedView type="backgroundElement" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefLeft}>
                <ThemedText style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</ThemedText>
                <View>
                  <ThemedText type="smallBold">Tema</ThemedText>
                  <ThemedText themeColor="textSecondary" style={{ fontSize: 12 }}>{isDark ? 'Modo escuro ativo' : 'Modo claro ativo'}</ThemedText>
                </View>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: '#208AEF' }} thumbColor="#ffffff" />
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
  formScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginBottom: Spacing.one },
  backArrow: { fontSize: 20 },
  formDesc: { fontSize: 14, lineHeight: 20, marginTop: -Spacing.two },
  fields: { gap: Spacing.two },
  fieldGroup: { gap: Spacing.one },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
  },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#208AEF', paddingVertical: Spacing.three, borderRadius: 99, alignItems: 'center', marginTop: Spacing.one },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', paddingVertical: Spacing.one },
  linkText: { fontSize: 14 },
  link: { color: '#208AEF', fontWeight: '600' },
  mainScroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  sectionLabel: { letterSpacing: 1.1 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileInfo: { gap: 2 },
  scoreRow: { flexDirection: 'row', gap: Spacing.two },
  scoreCard: { flex: 1, borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center', gap: 4 },
  scoreEmoji: { fontSize: 28 },
  scoreValue: { fontSize: 28 },
  scoreLabel: { fontSize: 12, textAlign: 'center' },
  emptyScore: { fontSize: 13, textAlign: 'center', marginTop: -Spacing.one },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  achievementCard: { width: '47%', borderRadius: Spacing.two, padding: Spacing.two, gap: 3 },
  achievementUnlocked: { borderWidth: 1.5, borderColor: '#208AEF44' },
  achievementEmoji: { fontSize: 26 },
  achievementTitle: { fontSize: 13 },
  achievementDesc: { fontSize: 11, lineHeight: 15 },
  lockIcon: { fontSize: 14, position: 'absolute', top: 8, right: 8 },
  locked: { opacity: 0.4 },
  prefCard: { borderRadius: Spacing.three, padding: Spacing.three },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logoutBtn: { borderWidth: 1.5, borderColor: '#EF4444', paddingVertical: Spacing.three, borderRadius: 99, alignItems: 'center', marginTop: Spacing.one },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  loggedOutHero: { alignItems: 'center', paddingTop: Spacing.four, gap: Spacing.two },
  heroLogo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  heroLogoText: { color: '#fff', fontSize: 32 },
  heroDesc: { fontSize: 14, lineHeight: 20 },
  authButtons: { gap: Spacing.two },
  secondaryBtn: { borderWidth: 1.5, paddingVertical: Spacing.three, borderRadius: 99, alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '700' },
});
