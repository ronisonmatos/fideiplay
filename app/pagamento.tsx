import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { TRILHAS } from '@/data/trilhas';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';

type Aba = 'pix' | 'card' | 'moedas';
type Fase = 'idle' | 'loading' | 'pix_aguardando' | 'card_aguardando' | 'sucesso' | 'erro';

export default function PagamentoScreen() {
  const { trilhaId, titulo, preco: precoStr, coinsPrice: coinsPriceStr } = useLocalSearchParams<{
    trilhaId: string;
    titulo: string;
    preco: string;
    coinsPrice?: string;
  }>();
  const trilha = TRILHAS.find(t => t.id === Number(trilhaId));
  const preco = parseFloat(precoStr ?? '1.00');
  const coinsPrice = parseInt(coinsPriceStr ?? '0', 10);
  const { refreshTrilhas, profile, refreshProfile } = useAuth();
  const theme = useTheme();

  const [aba, setAba] = useState<Aba>(coinsPrice > 0 ? 'moedas' : 'pix');
  const [fase, setFase] = useState<Fase>('idle');
  const [pixCode, setPixCode] = useState('');
  const [pixBase64, setPixBase64] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [erroMsg, setErroMsg] = useState('');
  const xpAnim = useRef(new Animated.Value(0)).current;
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => pararPolling(), []);

  function pararPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  function animarXP() {
    Animated.timing(xpAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }

  function iniciarPolling(pmtId: number) {
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-payment', {
          body: { payment_id: pmtId, trilha_id: Number(trilhaId) },
        });
        if (data?.status === 'approved') {
          pararPolling();
          await refreshTrilhas();
          animarXP();
          setFase('sucesso');
        } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
          pararPolling();
          setErroMsg('Pagamento não aprovado. Tente novamente.');
          setFase('erro');
        }
      } catch (_) {}
    }, 5000);
  }

  async function pagarPix() {
    setFase('loading');
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { trilha_id: Number(trilhaId), method: 'pix', trilha_titulo: titulo, preco },
      });
      console.log('[pagarPix] data:', JSON.stringify(data));
      console.log('[pagarPix] error:', JSON.stringify(error));
      if (error) {
        try {
          const body = await (error as any).context?.json?.();
          console.log('[pagarPix] error body:', JSON.stringify(body));
        } catch (_) {}
        throw new Error(error?.message ?? 'Erro ao gerar PIX');
      }
      if (!data?.qr_code) throw new Error(JSON.stringify(data) ?? 'Erro ao gerar PIX');
      setPixCode(data.qr_code);
      setPixBase64(data.qr_code_base64 ?? '');
      setPaymentId(data.payment_id);
      setFase('pix_aguardando');
      iniciarPolling(data.payment_id);
    } catch (e: unknown) {
      setErroMsg(String(e));
      setFase('erro');
    }
  }

  async function pagarCartao() {
    setFase('loading');
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { trilha_id: Number(trilhaId), method: 'card', trilha_titulo: titulo, preco },
      });
      if (error || !data?.checkout_url) throw new Error(error?.message ?? 'Erro ao criar pagamento');
      setFase('card_aguardando');
      await WebBrowser.openBrowserAsync(data.checkout_url);
    } catch (e: unknown) {
      setErroMsg(String(e));
      setFase('erro');
    }
  }

  async function verificarCartao() {
    setFase('loading');
    const { data } = await supabase
      .from('payments')
      .select('mp_id, status')
      .eq('trilha_id', Number(trilhaId))
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.status === 'approved') {
      await refreshTrilhas();
      animarXP();
      setFase('sucesso');
      return;
    }
    if (data?.mp_id) {
      const { data: chk } = await supabase.functions.invoke('check-payment', {
        body: { payment_id: data.mp_id, trilha_id: Number(trilhaId) },
      });
      if (chk?.status === 'approved') {
        await refreshTrilhas();
        animarXP();
        setFase('sucesso');
        return;
      }
    }
    setErroMsg('Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.');
    setFase('erro');
  }

  async function comprarComMoedas() {
    setFase('loading');
    try {
      const { data, error } = await supabase.rpc('buy_trilha_with_coins', {
        p_trilha_id: Number(trilhaId),
      });
      if (error) throw new Error(error.message);
      if (data === 'success' || data === 'already_unlocked') {
        await Promise.all([refreshTrilhas(), refreshProfile()]);
        animarXP();
        setFase('sucesso');
      } else if (data === 'insufficient_coins') {
        setErroMsg(`Moedas insuficientes. Você tem ${profile?.coins ?? 0} moedas e precisa de ${coinsPrice}.`);
        setFase('erro');
      } else {
        throw new Error(`Resposta inesperada: ${data}`);
      }
    } catch (e: unknown) {
      setErroMsg(String(e));
      setFase('erro');
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => { pararPolling(); router.back(); }} style={s.backBtn}>
            <ThemedText style={{ fontSize: 22 }}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Pagamento</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.trilhaCard, { backgroundColor: theme.backgroundElement, borderColor: C.purple + '55' }]}>
            <ThemedText style={s.trilhaIcone}>{trilha?.icone ?? '📿'}</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={[s.trilhaTitulo, { color: theme.text }]}>{titulo}</ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                {trilha?.totalLicoes} lições · {trilha?.xpTotal} XP
              </ThemedText>
            </View>
            <ThemedText style={[s.preco, { color: C.gold }]}>
              R$ {preco.toFixed(2).replace('.', ',')}
            </ThemedText>
          </View>

          {(fase === 'idle' || fase === 'loading') && (
            <>
              <View style={[s.tabs, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
                {(coinsPrice > 0
                  ? ['moedas', 'pix', 'card'] as Aba[]
                  : ['pix', 'card'] as Aba[]
                ).map(a => (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setAba(a)}
                    style={[s.tab, aba === a && { backgroundColor: a === 'moedas' ? C.gold : C.purple }]}>
                    {a === 'moedas' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Image source={require('@/assets/images/moedas.png')} style={s.coinIconTab} resizeMode="contain" />
                        <ThemedText style={[s.tabText, { color: aba === a ? '#fff' : theme.textSecondary }]}>Moedas</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={[s.tabText, { color: aba === a ? '#fff' : theme.textSecondary }]}>
                        {a === 'pix' ? '📱 PIX' : '💳 Cartão'}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {aba === 'moedas' ? (
                <View style={s.abaContent}>
                  <ThemedText style={[s.abaTitle, { color: theme.text }]}>Comprar com Moedas</ThemedText>
                  <View style={[s.coinBalanceRow, { backgroundColor: C.gold + '15', borderColor: C.gold + '44' }]}>
                    <Image source={require('@/assets/images/moedas.png')} style={s.coinIcon} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Seu saldo atual</ThemedText>
                      <ThemedText style={{ color: C.gold, fontSize: 20, fontWeight: '900' }}>
                        {profile?.coins ?? 0} moedas
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[s.infoRow, { backgroundColor: C.purple + '12', borderColor: C.purple + '33' }]}>
                    <ThemedText style={{ fontSize: 18 }}>⚡</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13, flex: 1 }}>
                      Trilha liberada imediatamente, sem pagamento externo
                    </ThemedText>
                  </View>
                  {(profile?.coins ?? 0) < coinsPrice && (
                    <View style={[s.infoRow, { backgroundColor: C.red + '12', borderColor: C.red + '33' }]}>
                      <ThemedText style={{ fontSize: 18 }}>⚠️</ThemedText>
                      <ThemedText style={{ color: C.red, fontSize: 13, flex: 1 }}>
                        Você precisa de mais {coinsPrice - (profile?.coins ?? 0)} moedas. Ganhe moedas jogando ou assistindo anúncios.
                      </ThemedText>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.btnPrincipal, { backgroundColor: C.gold }, (fase === 'loading' || (profile?.coins ?? 0) < coinsPrice) && { opacity: 0.5 }]}
                    onPress={comprarComMoedas}
                    disabled={fase === 'loading' || (profile?.coins ?? 0) < coinsPrice}
                    activeOpacity={0.8}>
                    {fase === 'loading'
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Image source={require('@/assets/images/moedas.png')} style={s.coinIconBtn} resizeMode="contain" />
                          <ThemedText style={s.btnText}>COMPRAR POR {coinsPrice} MOEDAS</ThemedText>
                        </View>
                      )}
                  </TouchableOpacity>
                </View>
              ) : aba === 'pix' ? (
                <View style={s.abaContent}>
                  <ThemedText style={[s.abaTitle, { color: theme.text }]}>Pague com PIX</ThemedText>
                  <ThemedText style={[s.abaDesc, { color: theme.textSecondary }]}>
                    Aprovação instantânea · Sem taxas extras · Seguro
                  </ThemedText>
                  <View style={[s.infoRow, { backgroundColor: C.green + '12', borderColor: C.green + '33' }]}>
                    <ThemedText style={{ fontSize: 18 }}>⚡</ThemedText>
                    <ThemedText style={{ color: C.green, fontSize: 13, flex: 1 }}>
                      Trilha liberada em segundos após o pagamento
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[s.btnPrincipal, { backgroundColor: C.green }, fase === 'loading' && { opacity: 0.6 }]}
                    onPress={pagarPix}
                    disabled={fase === 'loading'}
                    activeOpacity={0.8}>
                    {fase === 'loading'
                      ? <ActivityIndicator color="#fff" />
                      : <ThemedText style={s.btnText}>GERAR QR CODE PIX</ThemedText>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.abaContent}>
                  <ThemedText style={[s.abaTitle, { color: theme.text }]}>Pague com Cartão</ThemedText>
                  <ThemedText style={[s.abaDesc, { color: theme.textSecondary }]}>
                    Crédito ou débito · Parcelamento disponível
                  </ThemedText>
                  <View style={[s.infoRow, { backgroundColor: C.purple + '12', borderColor: C.purple + '33' }]}>
                    <ThemedText style={{ fontSize: 18 }}>🔒</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 13, flex: 1 }}>
                      Você será redirecionado para o checkout seguro do Mercado Pago
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[s.btnPrincipal, { backgroundColor: C.purple }, fase === 'loading' && { opacity: 0.6 }]}
                    onPress={pagarCartao}
                    disabled={fase === 'loading'}
                    activeOpacity={0.8}>
                    {fase === 'loading'
                      ? <ActivityIndicator color="#fff" />
                      : <ThemedText style={s.btnText}>PAGAR COM CARTÃO</ThemedText>}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {fase === 'pix_aguardando' && (
            <View style={s.pixContainer}>
              <ThemedText style={[s.abaTitle, { color: theme.text, textAlign: 'center' }]}>
                Escaneie o QR Code
              </ThemedText>
              {pixBase64 ? (
                <Image
                  source={{ uri: `data:image/png;base64,${pixBase64}` }}
                  style={s.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={[s.qrPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                  <ActivityIndicator color={C.purple} />
                </View>
              )}
              <ThemedText style={[s.pixLabel, { color: theme.textSecondary }]}>
                Ou copie o código abaixo:
              </ThemedText>
              <TouchableOpacity
                style={[s.pixCopyBox, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}
                onPress={() => Share.share({ message: pixCode })}
                activeOpacity={0.75}>
                <ThemedText style={[s.pixCode, { color: theme.text }]} numberOfLines={2}>
                  {pixCode}
                </ThemedText>
                <ThemedText style={{ color: C.purple, fontSize: 12, fontWeight: '700', marginTop: 6 }}>
                  Toque para compartilhar/copiar
                </ThemedText>
              </TouchableOpacity>
              <View style={[s.aguardandoRow, { backgroundColor: C.gold + '12', borderColor: C.gold + '33' }]}>
                <ActivityIndicator color={C.gold} size="small" />
                <ThemedText style={{ color: C.gold, fontSize: 13, fontWeight: '600' }}>
                  Aguardando confirmação do pagamento...
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[s.btnSecundario, { borderColor: C.border }]}
                onPress={() => { pararPolling(); setFase('idle'); }}
                activeOpacity={0.7}>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>Cancelar</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {fase === 'card_aguardando' && (
            <View style={s.pixContainer}>
              <ThemedText style={{ fontSize: 48, textAlign: 'center' }}>💳</ThemedText>
              <ThemedText style={[s.abaTitle, { color: theme.text, textAlign: 'center' }]}>
                Pagamento realizado?
              </ThemedText>
              <ThemedText style={[s.abaDesc, { color: theme.textSecondary, textAlign: 'center' }]}>
                Após concluir o pagamento no Mercado Pago, toque no botão abaixo para liberar sua trilha.
              </ThemedText>
              <TouchableOpacity
                style={[s.btnPrincipal, { backgroundColor: C.purple }]}
                onPress={verificarCartao}
                activeOpacity={0.8}>
                <ThemedText style={s.btnText}>VERIFICAR PAGAMENTO</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnSecundario, { borderColor: C.border, marginTop: Spacing.two }]}
                onPress={() => setFase('idle')}
                activeOpacity={0.7}>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 14 }}>Voltar</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {fase === 'sucesso' && (
            <View style={s.pixContainer}>
              <ThemedText style={{ fontSize: 64, lineHeight: 78, textAlign: 'center' }}>🎉</ThemedText>
              <ThemedText style={[s.abaTitle, { color: C.green, textAlign: 'center' }]}>
                Trilha Desbloqueada!
              </ThemedText>
              <ThemedText style={[s.abaDesc, { color: theme.textSecondary, textAlign: 'center' }]}>
                {titulo} já está disponível para você estudar.
              </ThemedText>
              <Animated.View style={[s.xpBadge, {
                opacity: xpAnim,
                transform: [{ scale: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              }]}>
                <ThemedText style={s.xpText}>
                  🎓 {trilha?.totalLicoes} lições · {trilha?.xpTotal} XP disponíveis
                </ThemedText>
              </Animated.View>
              <TouchableOpacity
                style={[s.btnPrincipal, { backgroundColor: C.purple }]}
                onPress={() => {
                  router.back();
                  router.push(`/trilha-detalhe?id=${trilhaId}`);
                }}
                activeOpacity={0.8}>
                <ThemedText style={s.btnText}>COMEÇAR AGORA</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {fase === 'erro' && (
            <View style={s.pixContainer}>
              <ThemedText style={{ fontSize: 48, textAlign: 'center' }}>😕</ThemedText>
              <ThemedText style={[s.abaTitle, { color: C.red, textAlign: 'center' }]}>
                Algo deu errado
              </ThemedText>
              <ThemedText style={[s.abaDesc, { color: theme.textSecondary, textAlign: 'center' }]}>
                {erroMsg}
              </ThemedText>
              <TouchableOpacity
                style={[s.btnPrincipal, { backgroundColor: C.purple }]}
                onPress={() => setFase('idle')}
                activeOpacity={0.8}>
                <ThemedText style={s.btnText}>TENTAR NOVAMENTE</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  trilhaCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three, borderRadius: 16, borderWidth: 1,
  },
  trilhaIcone: { fontSize: 36, lineHeight: 44 },
  trilhaTitulo: { fontSize: 16, fontWeight: '800' },
  preco: { fontSize: 20, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  abaContent: { gap: Spacing.three },
  abaTitle: { fontSize: 20, fontWeight: '800' },
  abaDesc: { fontSize: 14, lineHeight: 20 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.two, borderRadius: 10, borderWidth: 1,
  },
  coinBalanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three, borderRadius: 14, borderWidth: 1,
  },
  coinIcon:    { width: 36, height: 36 },
  coinIconTab: { width: 18, height: 18 },
  coinIconBtn: { width: 22, height: 22 },
  btnPrincipal: { paddingVertical: 16, borderRadius: 99, alignItems: 'center' },
  btnSecundario: { paddingVertical: 14, borderRadius: 99, alignItems: 'center', borderWidth: 1 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  pixContainer: { gap: Spacing.three, alignItems: 'stretch' },
  qrImage: { width: 220, height: 220, alignSelf: 'center' },
  qrPlaceholder: {
    width: 220, height: 220, alignSelf: 'center',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  pixLabel: { fontSize: 13, textAlign: 'center' },
  pixCopyBox: { borderRadius: 12, borderWidth: 1, padding: Spacing.three, alignItems: 'center' },
  pixCode: { fontSize: 11, fontFamily: 'monospace', textAlign: 'center', lineHeight: 16 },
  aguardandoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.two, borderRadius: 10, borderWidth: 1,
  },
  xpBadge: {
    backgroundColor: C.purple + '22', borderWidth: 1, borderColor: C.purple + '55',
    borderRadius: 12, padding: Spacing.three, alignItems: 'center',
  },
  xpText: { color: C.purple, fontWeight: '800', fontSize: 14 },
});
