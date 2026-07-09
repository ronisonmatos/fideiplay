import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import Constants from 'expo-constants';

// react-native-share só existe em dev build/produção. No Expo Go, o simples
// require() do módulo (mesmo dinâmico) já loga um Invariant Violation, porque
// NativeRNShare.ts chama TurboModuleRegistry.getEnforcing no topo do arquivo
// — então nem tentamos carregar o módulo lá, vamos direto pro fallback de texto.
const isExpoGo = Constants.appOwnership === 'expo';

import { RadarChart } from '@/components/radar-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Spacing } from '@/constants/theme';
import {
  NIVEIS,
  TEMAS,
  TEMPO_POR_QUESTAO,
  TOTAL_QUESTOES,
  TRILHA_SUGERIDA_POR_TEMA,
  nivelGeralPorMedia,
} from '@/constants/teste-conhecimento';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useTesteConhecimento, type ResultadoTeste } from '@/hooks/use-teste-conhecimento';
import { fetchUltimoResultado, type TesteConhecimentoRow } from '@/lib/teste-conhecimento';

export default function TesteConhecimentoScreen() {
  const { user } = useAuth();
  const {
    fase, carregando, questaoAtual, indice, temaAtual, posicaoNoTema,
    selecionado, respondida, resultado,
    iniciarTeste, responder, salvarResultado,
  } = useTesteConhecimento();

  const [ultimoResultado, setUltimoResultado] = useState<TesteConhecimentoRow | null>(null);
  const [carregandoUltimo, setCarregandoUltimo] = useState(true);
  const salvouRef = useRef(false);

  useFocusEffect(useCallback(() => {
    if (!user?.id) { setCarregandoUltimo(false); return; }
    setCarregandoUltimo(true);
    fetchUltimoResultado(user.id).then(r => { setUltimoResultado(r); setCarregandoUltimo(false); });
  }, [user?.id]));

  useEffect(() => {
    if (fase === 'resultado' && !salvouRef.current && user?.id) {
      salvouRef.current = true;
      salvarResultado(user.id);
    }
    if (fase === 'jogando') salvouRef.current = false;
  }, [fase, user?.id, salvarResultado]);

  if (fase === 'jogando') {
    return (
      <TesteJogo
        questaoAtual={questaoAtual}
        indice={indice}
        temaAtual={temaAtual}
        posicaoNoTema={posicaoNoTema}
        selecionado={selecionado}
        respondida={respondida}
        onResponder={responder}
      />
    );
  }

  if (fase === 'resultado' && resultado) {
    return <TesteResultado resultado={resultado} />;
  }

  return (
    <TesteInicio
      carregando={carregando || carregandoUltimo}
      ultimoResultado={ultimoResultado}
      onIniciar={iniciarTeste}
    />
  );
}

// ── Início ───────────────────────────────────────────────────────────────────

function mesmoDiaLocal(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function TesteInicio({
  carregando, ultimoResultado, onIniciar,
}: {
  carregando: boolean;
  ultimoResultado: TesteConhecimentoRow | null;
  onIniciar: () => void;
}) {
  const theme = useTheme();
  const nivelAnterior = ultimoResultado ? NIVEIS.find(n => n.id === ultimoResultado.nivel_geral) : null;
  // Limite de 1 teste pontuado por dia (evita "farmar" o percentil refazendo
  // até sair um resultado melhor) — só afeta refazer, o primeiro teste do dia
  // (ultimoResultado null) nunca é bloqueado.
  const jaFezHoje = ultimoResultado ? mesmoDiaLocal(new Date(ultimoResultado.concluido_em), new Date()) : false;

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ThemedText style={{ fontSize: 22 }}>←</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Teste de Conhecimento</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={[s.introScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
          <Image source={require('@/assets/images/teste-conhecimento.png')} style={{ width: 64, height: 64, alignSelf: 'center' }} resizeMode="contain" />
          <ThemedText type="subtitle" style={s.center}>Teste seu nível de católico</ThemedText>
          <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 14, lineHeight: 20 }]}>
            30 perguntas sobre 6 temas fundamentais da fé católica. Descubra seu perfil.
          </ThemedText>

          <View style={s.temasGrid}>
            {TEMAS.map(tema => (
              <View key={tema.id} style={[s.temaCard, { borderColor: C.border, backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>{tema.icone}</ThemedText>
                <ThemedText style={{ fontSize: 12, fontWeight: '700', color: theme.text, textAlign: 'center' }}>{tema.label}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12 }]}>
            {TOTAL_QUESTOES} questões · ~10 minutos · 1 tentativa pontuada por dia
          </ThemedText>

          {carregando ? (
            <ActivityIndicator color={C.purple} style={{ marginTop: Spacing.two }} />
          ) : ultimoResultado && nivelAnterior ? (
            <View style={[s.resultadoAnteriorCard, { borderColor: nivelAnterior.cor + '55', backgroundColor: nivelAnterior.cor + '15' }]}>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                SEU ÚLTIMO RESULTADO
              </ThemedText>
              <ThemedText style={{ color: nivelAnterior.cor, fontSize: 18, fontWeight: '900' }}>{nivelAnterior.label}</ThemedText>
              {jaFezHoje ? (
                <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 12, marginTop: 4 }]}>
                  Você já fez o teste hoje — volte amanhã pra tentar de novo!
                </ThemedText>
              ) : (
                <TouchableOpacity style={[s.btnSecundario, { borderColor: nivelAnterior.cor }]} onPress={onIniciar} activeOpacity={0.85}>
                  <ThemedText style={{ color: nivelAnterior.cor, fontWeight: '800', fontSize: 13 }}>REFAZER O TESTE</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={s.btnPrincipal} onPress={onIniciar} activeOpacity={0.85}>
              <ThemedText style={s.btnPrincipalText}>INICIAR O TESTE</ThemedText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Jogo ─────────────────────────────────────────────────────────────────────

function TesteJogo({
  questaoAtual, indice, temaAtual, posicaoNoTema, selecionado, respondida, onResponder,
}: {
  questaoAtual: ReturnType<typeof useTesteConhecimento>['questaoAtual'];
  indice: number;
  temaAtual: (typeof TEMAS)[number];
  posicaoNoTema: number;
  selecionado: number | null;
  respondida: boolean;
  onResponder: (i: number | null) => void;
}) {
  const theme = useTheme();
  const [tempoRestante, setTempoRestante] = useState(TEMPO_POR_QUESTAO);

  useEffect(() => {
    if (respondida || !questaoAtual) return;
    setTempoRestante(TEMPO_POR_QUESTAO);
    const id = setInterval(() => {
      setTempoRestante(t => {
        if (t <= 1) {
          clearInterval(id);
          onResponder(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, respondida]);

  if (!questaoAtual) return null;

  const corTimer = tempoRestante > 10 ? C.green : tempoRestante > 5 ? C.gold : C.red;

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={[s.jogoHeader, { borderBottomColor: C.border }]}>
          <View style={s.progressWrap}>
            <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>
              Questão {indice + 1} de {TOTAL_QUESTOES}
            </ThemedText>
            <View style={[s.progressBar, { backgroundColor: theme.backgroundElement }]}>
              <View style={[s.progressFill, { width: `${((indice + 1) / TOTAL_QUESTOES) * 100}%` }]} />
            </View>
          </View>
          <View style={[s.timerBadge, { borderColor: corTimer }]}>
            <ThemedText style={{ color: corTimer, fontWeight: '900', fontSize: 15 }}>{tempoRestante}</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={[s.jogoBody, { paddingBottom: BottomTabInset + Spacing.four }]}>
          <ThemedText themeColor="textSecondary" style={{ fontSize: 11, fontWeight: '700' }}>
            {temaAtual.icone} {temaAtual.label} · {posicaoNoTema}/5
          </ThemedText>

          <ThemedText style={[s.pergunta, { color: theme.text }]}>{questaoAtual.pergunta}</ThemedText>

          <View style={{ gap: Spacing.two }}>
            {questaoAtual.opcoes.map((opt, i) => {
              const isCorrect  = i === questaoAtual.correta;
              const isSelected = i === selecionado;

              let bg: string = theme.backgroundElement;
              let borderColor: string = C.border;
              let textColor: string = theme.text;

              if (respondida) {
                if (isCorrect)       { bg = C.green; borderColor = C.green; textColor = '#fff'; }
                else if (isSelected) { bg = C.red;   borderColor = C.red;   textColor = '#fff'; }
              }

              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => onResponder(i)}
                  disabled={respondida}
                  activeOpacity={0.8}
                  style={[s.opcao, { backgroundColor: bg, borderColor }]}>
                  <ThemedText style={[s.opcaoLetra, { color: textColor }]}>{String.fromCharCode(65 + i)}</ThemedText>
                  <ThemedText style={[s.opcaoTexto, { color: textColor }]}>{opt}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {respondida && questaoAtual.explicacao && (
            <View style={[s.explicacaoBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 12, lineHeight: 17 }}>
                {questaoAtual.explicacao}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Resultado ────────────────────────────────────────────────────────────────

function TesteResultado({ resultado }: { resultado: ResultadoTeste }) {
  const theme = useTheme();
  const { nivelGeral, mediaPct, percentil, porTema } = resultado;

  const ordenado = [...porTema].sort((a, b) => b.pct - a.pct);
  const melhores = ordenado.slice(0, 3);
  const piores   = ordenado.slice(3, 6).sort((a, b) => a.pct - b.pct);

  const temaFraco = ordenado.find(t => t.nivel.label === 'Iniciante');
  const trilhaSugeridaId = temaFraco ? TRILHA_SUGERIDA_POR_TEMA[temaFraco.tema] : null;
  const labelTemaFraco = temaFraco ? TEMAS.find(t => t.id === temaFraco.tema)?.label : null;

  const shareCardRef = useRef<View>(null);

  const mensagemTexto = `Fiz o Teste de Conhecimento Católico no SantosPlay e sou um ${nivelGeral.label}! ✝️ Teste você também: santosplay.app`;

  // Captura o cartão com marca (bloco de nível + radar) como imagem e manda
  // texto + imagem juntos pelo share nativo. Nem o Share do React Native nem
  // o expo-sharing suportam isso no Android (o primeiro força text/plain e
  // ignora arquivo; o segundo manda só o arquivo, sem texto) — react-native-share
  // monta o Intent.ACTION_SEND com EXTRA_STREAM + EXTRA_TEXT nos dois, daí a lib à parte.
  async function compartilhar() {
    try {
      if (isExpoGo) throw new Error('react-native-share indisponível no Expo Go');
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1, result: 'data-uri' });
      const { default: RNShare } = await import('react-native-share');
      await RNShare.open({ url: uri, message: mensagemTexto, type: 'image/png', failOnCancel: false });
    } catch {
      Share.share({ message: mensagemTexto }).catch(() => {});
    }
  }

  return (
    <ThemedView style={s.fill}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={[s.header, { borderBottomColor: C.border }]}>
          <View style={{ width: 40 }} />
          <ThemedText style={[s.headerTitle, { color: theme.text }]}>Seu resultado</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={[s.resultadoScroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
          {/* Bloco 1+2 — cartão com marca, capturado como imagem no compartilhamento */}
          <View ref={shareCardRef} collapsable={false} style={s.shareCard}>
            <View style={s.shareCardBrand}>
              <Image source={require('@/assets/images/logo_SantosPlay.png')} style={s.shareCardLogo} resizeMode="contain" />
              <ThemedText style={s.shareCardBrandText}>SantosPlay</ThemedText>
            </View>

            <View style={[s.nivelCard, { backgroundColor: '#26215C' }]}>
              <ThemedText style={{ color: '#9B97D4', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>SEU NÍVEL</ThemedText>
              <ThemedText style={{ color: nivelGeral.cor, fontSize: 26, fontWeight: '900' }}>{nivelGeral.label}</ThemedText>
              {percentil !== null && (
                <ThemedText style={{ color: '#9B97D4', fontSize: 12 }}>
                  Melhor que {percentil}% dos usuários
                </ThemedText>
              )}
            </View>

            <RadarChart temas={TEMAS} valores={TEMAS.map(t => porTema.find(p => p.tema === t.id)?.pct ?? 0)} />

            <ThemedText style={s.shareCardFooter}>Teste seu conhecimento católico grátis — SantosPlay</ThemedText>
          </View>

          {/* Bloco 3 — melhores/piores */}
          <View style={{ gap: Spacing.three }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText style={s.sectionLabel}>PONTOS FORTES</ThemedText>
              {melhores.map(t => <BarraTema key={t.tema} tema={t} />)}
            </View>
            <View style={{ gap: Spacing.one }}>
              <ThemedText style={s.sectionLabel}>A DESENVOLVER</ThemedText>
              {piores.map(t => <BarraTema key={t.tema} tema={t} />)}
            </View>
          </View>

          {/* Bloco 4 — CTA */}
          {temaFraco && trilhaSugeridaId && (
            <TouchableOpacity
              style={[s.ctaCard, { borderColor: C.purple + '55', backgroundColor: C.purple + '12' }]}
              onPress={() => router.push(`/trilha-detalhe?id=${trilhaSugeridaId}` as any)}
              activeOpacity={0.85}>
              <ThemedText style={{ color: theme.text, fontSize: 13, fontWeight: '700', flex: 1 }}>
                Quer evoluir em {labelTemaFraco}? Comece a trilha gratuita →
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.btnPrincipal} onPress={compartilhar} activeOpacity={0.85}>
            <ThemedText style={s.btnPrincipalText}>COMPARTILHAR RESULTADO</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnSecundario, { borderColor: C.border, alignSelf: 'stretch', alignItems: 'center' }]} onPress={() => router.back()} activeOpacity={0.85}>
            <ThemedText style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 13 }}>VOLTAR AO INÍCIO</ThemedText>
          </TouchableOpacity>

          <ThemedText themeColor="textSecondary" style={[s.center, { fontSize: 11 }]}>
            {mediaPct}% de aproveitamento geral
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function BarraTema({ tema }: { tema: ResultadoTeste['porTema'][number] }) {
  const theme = useTheme();
  const label = TEMAS.find(t => t.id === tema.tema);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ThemedText style={{ fontSize: 12, color: theme.text }}>{label?.icone} {label?.label}</ThemedText>
        <ThemedText style={{ fontSize: 12, fontWeight: '800', color: tema.nivel.cor }}>{tema.nivel.label}</ThemedText>
      </View>
      <View style={[s.barraBg, { backgroundColor: theme.backgroundElement }]}>
        <View style={[s.barraFill, { width: `${tema.pct}%`, backgroundColor: tema.nivel.cor }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  introScroll: { padding: Spacing.four, gap: Spacing.three },
  temasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center' },
  temaCard: {
    width: '30%', aspectRatio: 1, borderRadius: C.radius.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 4, padding: 4,
  },

  resultadoAnteriorCard: { borderRadius: C.radius.lg, borderWidth: 1.5, padding: Spacing.three, gap: 6, alignItems: 'center' },

  btnPrincipal: { backgroundColor: C.purple, paddingVertical: 16, borderRadius: 99, alignItems: 'center' },
  btnPrincipalText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  btnSecundario: { borderWidth: 1.5, paddingVertical: 12, borderRadius: 99, alignItems: 'center', alignSelf: 'stretch' },

  jogoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1,
  },
  progressWrap: { flex: 1, gap: 4 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: C.purple },
  timerBadge: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  jogoBody: { padding: Spacing.four, gap: Spacing.three },
  pergunta: { fontSize: 19, lineHeight: 26, fontWeight: '700' },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: C.radius.md, borderWidth: 1.5 },
  opcaoLetra: { fontSize: 14, fontWeight: '800', width: 20 },
  opcaoTexto: { flex: 1, fontSize: 14, lineHeight: 19 },
  explicacaoBox: { borderRadius: C.radius.md, padding: Spacing.three },

  resultadoScroll: { padding: Spacing.four, gap: Spacing.four },
  shareCard: { backgroundColor: '#15123A', borderRadius: C.radius.lg, padding: Spacing.four, gap: Spacing.three, alignItems: 'center' },
  shareCardBrand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  shareCardLogo: { width: 28, height: 28 },
  shareCardBrandText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  shareCardFooter: { color: '#9B97D4', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  nivelCard: { borderRadius: C.radius.lg, padding: Spacing.four, alignItems: 'center', gap: 4, alignSelf: 'stretch' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#9B97D4', textTransform: 'uppercase' },
  barraBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barraFill: { height: 8, borderRadius: 4 },
  ctaCard: { borderRadius: C.radius.lg, borderWidth: 1.5, padding: Spacing.three, flexDirection: 'row', alignItems: 'center' },
});
