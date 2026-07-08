import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { ALCANCE_LABELS, PERIODOS, PRECOS_EVENTOS, type AlcanceEvento, type PeriodoEvento } from '@/constants/eventos-precos';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { criarEvento, fetchEventosPatrocinadosAtivo } from '@/lib/eventos-patrocinados';

type Etapa = 1 | 2 | 3;
type AbaPagamento = 'pix' | 'card';
type Fase = 'idle' | 'loading' | 'pix_aguardando' | 'card_aguardando' | 'sucesso' | 'erro';

function formatBR(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Evita o shift de timezone de `new Date('AAAA-MM-DD')` (interpretado como UTC)
function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

async function uploadEventoImagem(uri: string, fileName?: string | null, mimeType?: string | null): Promise<string> {
  const ext  = (fileName?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `eventos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await new File(uri).bytes();
  const { error } = await supabase.storage
    .from('ads')
    .upload(path, bytes, { contentType: mimeType || 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('ads').getPublicUrl(path);
  return data.publicUrl;
}

export default function EventoPatrocinadoScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();

  const [checandoConfig, setChecandoConfig] = useState(true);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    fetchEventosPatrocinadosAtivo().then(v => { setAtivo(v); setChecandoConfig(false); });
  }, []);

  // ── Etapa 1 ────────────────────────────────────────────────────────────────
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState<string | null>(null);
  const [dataFim, setDataFim] = useState<string | null>(null);
  const [localEvento, setLocalEvento] = useState('');
  const [linkExterno, setLinkExterno] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [uploadingImagem, setUploadingImagem] = useState(false);

  // ── Etapa 2 ────────────────────────────────────────────────────────────────
  const [alcance, setAlcance] = useState<AlcanceEvento>('cidade');
  const [cidade, setCidade] = useState(profile?.cidade ?? '');
  const [estado, setEstado] = useState(profile?.estado ?? '');
  const [periodo, setPeriodo] = useState<PeriodoEvento>(7);

  const valor = PRECOS_EVENTOS[alcance][periodo];

  // ── Etapa 3 — pagamento (mesmo padrão de app/pagamento.tsx, sem aba moedas) ──
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaPagamento>('pix');
  const [fase, setFase] = useState<Fase>('idle');
  const [pixCode, setPixCode] = useState('');
  const [pixBase64, setPixBase64] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => pararPolling(), []);
  function pararPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  async function handlePickImagem() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Autorize o acesso às fotos para escolher uma imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingImagem(true);
    try {
      const url = await uploadEventoImagem(asset.uri, asset.fileName, asset.mimeType);
      setImagemUrl(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      setUploadingImagem(false);
    }
  }

  function irParaEtapa2() {
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert('Preencha tudo', 'Título e descrição são obrigatórios.');
      return;
    }
    if (!dataInicio || !dataFim) {
      Alert.alert('Preencha as datas', 'Informe o início e o fim do evento.');
      return;
    }
    if (dataFim < dataInicio) {
      Alert.alert('Datas inválidas', 'A data de fim deve ser depois da data de início.');
      return;
    }
    setEtapa(2);
  }

  function irParaEtapa3() {
    if (alcance === 'cidade' && !cidade.trim()) {
      Alert.alert('Confirme a cidade', 'Informe a cidade onde o evento será divulgado.');
      return;
    }
    if (alcance === 'estado' && !estado.trim()) {
      Alert.alert('Confirme o estado', 'Informe o estado onde o evento será divulgado.');
      return;
    }
    setEtapa(3);
  }

  // Cria o evento (uma única vez — reaproveitado em caso de nova tentativa de pagamento)
  async function garantirEventoId(): Promise<string | null> {
    if (eventoId) return eventoId;
    if (!user) return null;
    const { id, error } = await criarEvento({
      usuarioId:   user.id,
      titulo:      titulo.trim(),
      descricao:   descricao.trim(),
      imagemUrl:   imagemUrl || null,
      linkExterno: linkExterno.trim() || null,
      dataInicio:  dataInicio!,
      dataFim:     dataFim!,
      localEvento: localEvento.trim(),
      alcance,
      estados:     alcance === 'estado' ? [estado.trim().toUpperCase()] : [],
      cidades:     alcance === 'cidade' ? [cidade.trim().toUpperCase()] : [],
      periodo,
    });
    if (error || !id) return null;
    setEventoId(id);
    return id;
  }

  function iniciarPolling(paymentId: number, idEvento: string) {
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('check-payment', {
          body: { payment_id: paymentId, tipo: 'evento', evento_id: idEvento },
        });
        if (data?.status === 'approved') {
          pararPolling();
          setFase('sucesso');
        } else if (data?.status === 'rejected' || data?.status === 'cancelled') {
          pararPolling();
          setErroMsg('Pagamento não aprovado. Tente novamente.');
          setFase('erro');
        }
      } catch { /* segue tentando no próximo tick */ }
    }, 5000);
  }

  async function pagarPix() {
    setFase('loading');
    try {
      const id = await garantirEventoId();
      if (!id) throw new Error('Não foi possível registrar o evento. Tente novamente.');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { method: 'pix', tipo: 'evento', evento_id: id, evento_titulo: titulo.trim(), preco: valor },
      });
      if (error) throw new Error(error?.message ?? 'Erro ao gerar PIX');
      if (!data?.qr_code) throw new Error('Erro ao gerar PIX');
      setPixCode(data.qr_code);
      setPixBase64(data.qr_code_base64 ?? '');
      setFase('pix_aguardando');
      iniciarPolling(data.payment_id, id);
    } catch (e: unknown) {
      setErroMsg(String(e));
      setFase('erro');
    }
  }

  async function pagarCartao() {
    setFase('loading');
    try {
      const id = await garantirEventoId();
      if (!id) throw new Error('Não foi possível registrar o evento. Tente novamente.');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { method: 'card', tipo: 'evento', evento_id: id, evento_titulo: titulo.trim(), preco: valor },
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
    if (!eventoId) return;
    setFase('loading');
    const { data } = await supabase
      .from('payments')
      .select('mp_id, status')
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.status === 'approved') {
      setFase('sucesso');
      return;
    }
    if (data?.mp_id) {
      const { data: chk } = await supabase.functions.invoke('check-payment', {
        body: { payment_id: data.mp_id, tipo: 'evento', evento_id: eventoId },
      });
      if (chk?.status === 'approved') {
        setFase('sucesso');
        return;
      }
    }
    setErroMsg('Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.');
    setFase('erro');
  }

  // ── Gates ──────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 48, lineHeight: 56 }}>🎪</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Entre na sua conta</ThemedText>
            <ThemedText themeColor="textSecondary" style={s.center}>
              Você precisa estar logado para divulgar um evento.
            </ThemedText>
            <TouchableOpacity style={s.btnPrincipal} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
              <ThemedText style={s.btnText}>ENTRAR</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (checandoConfig) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={s.centerFlex}>
            <ActivityIndicator color={C.purple} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!ativo) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <View style={[s.header, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ThemedText style={{ fontSize: 22 }}>←</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[s.headerTitle, { color: theme.text }]}>Divulgar evento</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.centerFlex}>
            <ThemedText style={{ fontSize: 48, lineHeight: 56 }}>🚧</ThemedText>
            <ThemedText type="subtitle" style={s.center}>Em breve</ThemedText>
            <ThemedText themeColor="textSecondary" style={s.center}>
              A divulgação de eventos por usuários está temporariamente indisponível.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[s.header, { borderBottomColor: C.border }]}>
            <TouchableOpacity
              onPress={() => (etapa === 1 || fase !== 'idle' ? router.back() : setEtapa((etapa - 1) as Etapa))}
              style={s.backBtn}>
              <ThemedText style={{ fontSize: 22 }}>←</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[s.headerTitle, { color: theme.text }]}>
              {fase !== 'idle' ? 'Pagamento' : `Divulgar evento — ${etapa}/3`}
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

            {fase === 'idle' && etapa === 1 && (
              <>
                <ThemedText style={s.sectionLabel}>DADOS DO EVENTO</ThemedText>
                <TextInput
                  style={[s.input, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                  value={titulo}
                  onChangeText={t => setTitulo(t.slice(0, 50))}
                  placeholder="Título (máx. 50 caracteres)"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={50}
                />
                <TextInput
                  style={[s.textarea, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                  value={descricao}
                  onChangeText={t => setDescricao(t.slice(0, 200))}
                  placeholder="Descrição (máx. 200 caracteres)"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={200}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  <View style={{ flex: 1 }}>
                    <DateField label="Início" value={dataInicio} onChange={setDataInicio} minimumDate={new Date()} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DateField label="Fim" value={dataFim} onChange={setDataFim} minimumDate={dataInicio ? isoToLocalDate(dataInicio) : new Date()} />
                  </View>
                </View>
                <TextInput
                  style={[s.input, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                  value={localEvento}
                  onChangeText={setLocalEvento}
                  placeholder="Local do evento (ex.: Paróquia São José — Joinville/SC)"
                  placeholderTextColor={theme.textSecondary}
                />
                <TextInput
                  style={[s.input, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                  value={linkExterno}
                  onChangeText={setLinkExterno}
                  placeholder="Link externo (opcional — WhatsApp, site...)"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />

                {imagemUrl ? <Image source={{ uri: imagemUrl }} style={s.imagemPreview} /> : null}
                <TouchableOpacity style={s.galleryBtn} onPress={handlePickImagem} disabled={uploadingImagem} activeOpacity={0.8}>
                  {uploadingImagem
                    ? <ActivityIndicator color={C.purple} size="small" />
                    : <ThemedText style={{ color: C.purple, fontWeight: '700', fontSize: 13 }}>
                        {imagemUrl ? '🖼️ Trocar imagem (opcional)' : '🖼️ Adicionar imagem (opcional)'}
                      </ThemedText>}
                </TouchableOpacity>

                <TouchableOpacity style={s.btnPrincipal} onPress={irParaEtapa2} activeOpacity={0.8}>
                  <ThemedText style={s.btnText}>CONTINUAR</ThemedText>
                </TouchableOpacity>
              </>
            )}

            {fase === 'idle' && etapa === 2 && (
              <>
                <ThemedText style={s.sectionLabel}>ALCANCE</ThemedText>
                <View style={{ gap: Spacing.two }}>
                  {(Object.keys(ALCANCE_LABELS) as AlcanceEvento[]).map(key => (
                    <TouchableOpacity
                      key={key}
                      style={[s.alcanceCard, alcance === key && s.alcanceCardActive, { borderColor: alcance === key ? C.purple : C.border }]}
                      onPress={() => setAlcance(key)}
                      activeOpacity={0.85}>
                      <ThemedText style={{ fontSize: 22 }}>{key === 'cidade' ? '🏘️' : key === 'estado' ? '🗺️' : '🇧🇷'}</ThemedText>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontWeight: '800' }}>{ALCANCE_LABELS[key]}</ThemedText>
                      </View>
                      {alcance === key && <ThemedText style={{ color: C.purple, fontSize: 18 }}>✓</ThemedText>}
                    </TouchableOpacity>
                  ))}
                </View>

                {alcance === 'cidade' && (
                  <TextInput
                    style={[s.input, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                    value={cidade}
                    onChangeText={setCidade}
                    placeholder="Sua cidade"
                    placeholderTextColor={theme.textSecondary}
                  />
                )}
                {alcance === 'estado' && (
                  <TextInput
                    style={[s.input, { color: theme.text, borderColor: C.border, backgroundColor: theme.backgroundElement }]}
                    value={estado}
                    onChangeText={setEstado}
                    placeholder="Sua sigla de estado (ex.: SC)"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                )}

                <ThemedText style={s.sectionLabel}>PERÍODO</ThemedText>
                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  {PERIODOS.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[s.periodoBtn, periodo === p && { backgroundColor: C.purple, borderColor: C.purple }]}
                      onPress={() => setPeriodo(p)}
                      activeOpacity={0.85}>
                      <ThemedText style={{ fontWeight: '800', color: periodo === p ? '#fff' : theme.text }}>{p} dias</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[s.valorBox, { borderColor: C.gold + '55', backgroundColor: C.gold + '15' }]}>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Valor do anúncio</ThemedText>
                  <ThemedText style={{ color: C.gold, fontSize: 28, lineHeight: 34, fontWeight: '900' }}>
                    R$ {valor.toFixed(2).replace('.', ',')}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                    O banner fica no ar por {periodo} dias a partir da aprovação
                  </ThemedText>
                </View>

                <TouchableOpacity style={s.btnPrincipal} onPress={irParaEtapa3} activeOpacity={0.8}>
                  <ThemedText style={s.btnText}>CONTINUAR</ThemedText>
                </TouchableOpacity>
              </>
            )}

            {fase === 'idle' && etapa === 3 && (
              <>
                <ThemedText style={s.sectionLabel}>RESUMO</ThemedText>
                <ThemedView type="backgroundElement" style={s.resumoCard}>
                  <ThemedText style={{ fontWeight: '800', fontSize: 16 }}>{titulo}</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {ALCANCE_LABELS[alcance]} · {periodo} dias
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                    Evento: {formatBR(dataInicio)} até {formatBR(dataFim)}
                  </ThemedText>
                  <View style={[s.divider, { backgroundColor: C.border }]} />
                  <ThemedText style={{ color: C.gold, fontSize: 22, fontWeight: '900' }}>
                    R$ {valor.toFixed(2).replace('.', ',')}
                  </ThemedText>
                </ThemedView>

                <View style={[s.avisoBox, { backgroundColor: C.purple + '12', borderColor: C.purple + '33' }]}>
                  <ThemedText style={{ fontSize: 18 }}>ℹ️</ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 13, flex: 1 }}>
                    Após o pagamento, seu evento entra em fila de aprovação. A análise é feita em até 24 horas.
                    Se rejeitado, o valor é reembolsado integralmente.
                  </ThemedText>
                </View>

                <View style={[s.tabs, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
                  {(['pix', 'card'] as AbaPagamento[]).map(a => (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setAba(a)}
                      style={[s.tab, aba === a && { backgroundColor: C.purple }]}>
                      <ThemedText style={{ fontSize: 14, fontWeight: '700', color: aba === a ? '#fff' : theme.textSecondary }}>
                        {a === 'pix' ? '📱 PIX' : '💳 Cartão'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={s.btnPrincipal}
                  onPress={aba === 'pix' ? pagarPix : pagarCartao}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnText}>PAGAR R$ {valor.toFixed(2).replace('.', ',')}</ThemedText>
                </TouchableOpacity>
              </>
            )}

            {fase === 'loading' && (
              <View style={s.centerFlex}>
                <ActivityIndicator color={C.purple} size="large" />
              </View>
            )}

            {fase === 'pix_aguardando' && (
              <View style={s.pixContainer}>
                <ThemedText style={{ fontSize: 18, fontWeight: '800', textAlign: 'center', color: theme.text }}>
                  Escaneie o QR Code
                </ThemedText>
                {pixBase64 ? (
                  <Image source={{ uri: `data:image/png;base64,${pixBase64}` }} style={s.qrImage} resizeMode="contain" />
                ) : (
                  <View style={[s.qrPlaceholder, { backgroundColor: theme.backgroundElement }]}>
                    <ActivityIndicator color={C.purple} />
                  </View>
                )}
                <TouchableOpacity
                  style={[s.pixCopyBox, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}
                  onPress={() => Share.share({ message: pixCode })}
                  activeOpacity={0.75}>
                  <ThemedText style={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: theme.text }} numberOfLines={2}>
                    {pixCode}
                  </ThemedText>
                  <ThemedText style={{ color: C.purple, fontSize: 12, fontWeight: '700', marginTop: 6 }}>
                    Toque para compartilhar/copiar
                  </ThemedText>
                </TouchableOpacity>
                <View style={[s.avisoBox, { backgroundColor: C.gold + '12', borderColor: C.gold + '33' }]}>
                  <ActivityIndicator color={C.gold} size="small" />
                  <ThemedText style={{ color: C.gold, fontSize: 13, fontWeight: '600' }}>
                    Aguardando confirmação do pagamento...
                  </ThemedText>
                </View>
              </View>
            )}

            {fase === 'card_aguardando' && (
              <View style={s.pixContainer}>
                <ThemedText style={{ fontSize: 48, textAlign: 'center' }}>💳</ThemedText>
                <ThemedText style={{ fontSize: 18, fontWeight: '800', textAlign: 'center', color: theme.text }}>
                  Pagamento realizado?
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center' }}>
                  Após concluir o pagamento no Mercado Pago, toque no botão abaixo para confirmar.
                </ThemedText>
                <TouchableOpacity style={s.btnPrincipal} onPress={verificarCartao} activeOpacity={0.8}>
                  <ThemedText style={s.btnText}>VERIFICAR PAGAMENTO</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {fase === 'sucesso' && (
              <View style={s.pixContainer}>
                <ThemedText style={{ fontSize: 64, textAlign: 'center' }}>🎉</ThemedText>
                <ThemedText style={{ fontSize: 20, fontWeight: '800', textAlign: 'center', color: C.green }}>
                  Pagamento confirmado!
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center' }}>
                  Seu evento entrou na fila de aprovação. Você será avisado assim que for analisado.
                </ThemedText>
                <TouchableOpacity
                  style={s.btnPrincipal}
                  onPress={() => { router.back(); router.push('/meus-eventos'); }}
                  activeOpacity={0.8}>
                  <ThemedText style={s.btnText}>VER MEUS EVENTOS</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {fase === 'erro' && (
              <View style={s.pixContainer}>
                <ThemedText style={{ fontSize: 48, textAlign: 'center' }}>😕</ThemedText>
                <ThemedText style={{ fontSize: 18, fontWeight: '800', textAlign: 'center', color: C.red }}>
                  Algo deu errado
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center' }}>{erroMsg}</ThemedText>
                <TouchableOpacity style={s.btnPrincipal} onPress={() => setFase('idle')} activeOpacity={0.8}>
                  <ThemedText style={s.btnText}>TENTAR NOVAMENTE</ThemedText>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  centerFlex: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four },
  center: { textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: Spacing.four, gap: Spacing.three },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4', textTransform: 'uppercase' },

  input: { borderWidth: 1.5, borderRadius: C.radius.pill, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  textarea: { borderWidth: 1.5, borderRadius: C.radius.md, padding: Spacing.three, fontSize: 14, minHeight: 90 },

  imagemPreview: { width: '100%', height: 140, borderRadius: C.radius.md },
  galleryBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: C.radius.pill, borderWidth: 1.5, borderColor: C.purple + '88' },

  alcanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    padding: Spacing.three, borderRadius: C.radius.lg, borderWidth: 1.5,
  },
  alcanceCardActive: { backgroundColor: C.purple + '12' },

  periodoBtn: { flex: 1, paddingVertical: 12, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  valorBox: { borderRadius: C.radius.lg, borderWidth: 1.5, padding: Spacing.three, gap: 4, alignItems: 'center' },

  resumoCard: { borderRadius: C.radius.lg, padding: Spacing.three, gap: 4 },
  divider: { height: 1, marginVertical: 4 },
  avisoBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 10, borderWidth: 1 },

  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },

  btnPrincipal: { backgroundColor: C.purple, paddingVertical: 16, borderRadius: 99, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  pixContainer: { gap: Spacing.three, alignItems: 'stretch' },
  qrImage: { width: 220, height: 220, alignSelf: 'center' },
  qrPlaceholder: { width: 220, height: 220, alignSelf: 'center', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pixCopyBox: { borderRadius: 12, borderWidth: 1, padding: Spacing.three, alignItems: 'center' },
});
