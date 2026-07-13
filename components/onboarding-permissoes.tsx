import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { C } from '@/constants/theme';
import {
  isOnboardingPermissoesConcluido,
  marcarOnboardingPermissoesConcluido,
} from '@/lib/onboarding';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  setupNotificationChannel,
} from '@/lib/notifications';

const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

// Decide se o onboarding de permissões deve aparecer. Reutilizado pelo AuthGate
// para NÃO disparar as permissões automaticamente quando as telas de contexto
// vão assumir esse papel.
export async function deveMostrarOnboardingPermissoes(): Promise<boolean> {
  // Web não tem esse fluxo; Expo Go Android não suporta push (SDK 53+).
  if (Platform.OS === 'web' || isExpoGoAndroid) return false;
  if (await isOnboardingPermissoesConcluido()) return false;

  // Instalação já existente (atualização do app): se qualquer permissão já foi
  // concedida antes, o usuário não é "novo" — não repete o onboarding.
  try {
    const notif = await Notifications.getPermissionsAsync();
    if (notif.status === 'granted') return false;
    const loc = await Location.getForegroundPermissionsAsync();
    if (loc.granted) return false;
  } catch {
    /* se a checagem falhar, mostra mesmo assim — melhor pedir do que nunca pedir */
  }
  return true;
}

// Data de exemplo (3 dias à frente) pro banner de evento parecer real.
function exemploDataEvento() {
  const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return { dia: String(d.getDate()).padStart(2, '0'), mes: MESES[d.getMonth()] };
}

export default function OnboardingPermissoes() {
  const [visivel, setVisivel] = useState(false);
  const [passo, setPasso]     = useState<0 | 1>(0);
  const [pedindo, setPedindo] = useState(false);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let ativo = true;
    deveMostrarOnboardingPermissoes().then(mostrar => {
      if (ativo && mostrar) setVisivel(true);
    });
    return () => { ativo = false; };
  }, []);

  // Anima a entrada do conteúdo de cada passo (fade + slide up).
  useEffect(() => {
    if (!visivel) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [visivel, passo, anim]);

  // Enquanto o onboarding está na tela, o botão voltar do Android não deve
  // navegar a stack por baixo — consome o evento sem fazer nada.
  useEffect(() => {
    if (!visivel) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [visivel]);

  if (!visivel) return null;

  const concluir = async () => {
    await marcarOnboardingPermissoesConcluido();
    setVisivel(false);
  };

  const irParaLocalizacao = () => setPasso(1);

  const ativarNotificacoes = async () => {
    setPedindo(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        await setupNotificationChannel().catch(() => {});
        await scheduleDailyReminder().catch(() => {});
      }
    } finally {
      setPedindo(false);
      irParaLocalizacao();
    }
  };

  const permitirLocalizacao = async () => {
    setPedindo(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {
      /* segue mesmo se falhar — usuário pode ativar depois em Configurações */
    } finally {
      setPedindo(false);
      concluir();
    }
  };

  const animStyle = {
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={['#2A2266', '#12102E']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {passo === 0 ? (
            <PassoNotificacoes anim={animStyle} />
          ) : (
            <PassoLocalizacao anim={animStyle} />
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={[styles.dot, passo === 0 && styles.dotAtivo]} />
            <View style={[styles.dot, passo === 1 && styles.dotAtivo]} />
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, pedindo && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={pedindo}
            onPress={passo === 0 ? ativarNotificacoes : permitirLocalizacao}>
            {pedindo ? (
              <ActivityIndicator size="small" color="#241505" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {passo === 0 ? '🔔  Ativar notificações' : '📍  Permitir localização'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            activeOpacity={0.7}
            disabled={pedindo}
            onPress={passo === 0 ? irParaLocalizacao : concluir}>
            <Text style={styles.btnGhostText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Passo 1 — Notificações ────────────────────────────────────────────────────
function PassoNotificacoes({ anim }: { anim: object }) {
  return (
    <Animated.View style={[styles.stepBody, anim]}>
      <View style={styles.mockZone}>
        <View style={styles.notifCard}>
          <Image source={require('@/assets/images/Icone_512x512.png')} style={styles.notifIcon} />
          <View style={styles.notifTextCol}>
            <View style={styles.notifTopRow}>
              <Text style={styles.notifApp}>SantosPlay</Text>
              <Text style={styles.notifTime}>agora</Text>
            </View>
            <Text style={styles.notifTitle}>🎉 Nova trilha liberada!</Text>
            <Text style={styles.notifBody} numberOfLines={2}>
              Novo jogo disponível: Quiz dos Santos. Venha testar sua fé e ganhar moedas!
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.eyebrow}>PASSO 1 DE 2</Text>
      <Text style={styles.title}>Não perca nenhuma novidade</Text>
      <Text style={styles.desc}>
        Ative as notificações para saber na hora quando liberarmos uma nova trilha,
        um novo jogo ou um bônus de moedas esperando por você.
      </Text>
    </Animated.View>
  );
}

// ── Passo 2 — Localização ─────────────────────────────────────────────────────
function PassoLocalizacao({ anim }: { anim: object }) {
  const { dia, mes } = exemploDataEvento();
  return (
    <Animated.View style={[styles.stepBody, anim]}>
      <View style={styles.mockZone}>
        <View style={styles.bannerCard}>
          <View style={styles.dateBox}>
            <View style={styles.dateMonthBar}>
              <Text style={styles.dateMonthText}>{mes}</Text>
            </View>
            <Text style={styles.dateDayText}>{dia}</Text>
          </View>

          <View style={styles.bannerInfo}>
            <Text style={styles.bannerLabel}>EVENTO</Text>
            <Text style={styles.bannerTitle} numberOfLines={1}>Missa e quermesse da padroeira</Text>
            <Text style={styles.bannerLocal} numberOfLines={1}>📍 Paróquia São José · 2 km de você</Text>
          </View>

          <View style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Saiba mais</Text>
          </View>
        </View>
        <Text style={styles.mockHint}>Evento próximo a você</Text>
      </View>

      <Text style={styles.eyebrow}>PASSO 2 DE 2</Text>
      <Text style={styles.title}>Descubra eventos perto de você</Text>
      <Text style={styles.desc}>
        Permita o acesso à localização para mostrarmos missas, retiros e festas
        católicas que acontecem na sua região.
      </Text>
    </Animated.View>
  );
}

const CORES_MISSA = { borda: 'rgba(24,95,165,0.5)', fundo: 'rgba(24,95,165,0.16)', label: '#5FA8E8' };

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 900 },
  safe: { flex: 1, paddingHorizontal: 28 },
  content: { flex: 1, justifyContent: 'center' },

  stepBody: { alignItems: 'center' },

  // Zona do exemplo (mockup)
  mockZone: { width: '100%', alignItems: 'center', marginBottom: 40 },

  // Card de notificação (mock estilo SO)
  notifCard: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 14,
  },
  notifIcon: { width: 44, height: 44, borderRadius: 10 },
  notifTextCol: { flex: 1, gap: 3 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifApp: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  notifTime: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  notifTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  notifBody: { color: 'rgba(255,255,255,0.72)', fontSize: 12.5, lineHeight: 17 },

  // Banner de evento (mock)
  bannerCard: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: CORES_MISSA.borda,
    backgroundColor: CORES_MISSA.fundo,
    borderRadius: 14,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dateMonthBar: { width: '100%', paddingVertical: 2, alignItems: 'center', backgroundColor: CORES_MISSA.label },
  dateMonthText: { fontSize: 9, fontWeight: '800', color: '#0d0d1e', letterSpacing: 0.5 },
  dateDayText: { flex: 1, fontSize: 22, fontWeight: '800', textAlign: 'center', textAlignVertical: 'center', color: '#fff' },
  bannerInfo: { flex: 1, gap: 2 },
  bannerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, color: CORES_MISSA.label },
  bannerTitle: { fontSize: 12, fontWeight: '700', color: '#fff' },
  bannerLocal: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  bannerBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: CORES_MISSA.label + '30' },
  bannerBtnText: { fontSize: 9, fontWeight: '700', color: CORES_MISSA.label },
  mockHint: { marginTop: 10, color: 'rgba(255,255,255,0.45)', fontSize: 11, fontStyle: 'italic' },

  // Texto do passo
  eyebrow: { color: C.gold, fontSize: 11.5, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  desc: { color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 22, textAlign: 'center', maxWidth: 320 },

  // Rodapé (dots + botões)
  footer: { gap: 12, paddingBottom: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotAtivo: { backgroundColor: C.gold, width: 20 },

  btnPrimary: {
    backgroundColor: C.gold,
    borderRadius: 99,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { color: '#241505', fontSize: 16, fontWeight: '800' },
  btnGhost: { height: 44, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
});
