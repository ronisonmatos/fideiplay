import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { Bloco, TRILHAS } from '@/data/trilhas';
import { useTheme } from '@/hooks/use-theme';
import { pushProgress } from '@/lib/progress-sync';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '@santosplay:trilhas_progresso';

interface Progresso {
  licoesConcluidas: string[];
  xpTotal: number;
}

type Fase = 'conteudo' | 'quiz' | 'conclusao';

function BlocoConteudo({ bloco, theme }: { bloco: Bloco; theme: ReturnType<typeof useTheme> }) {
  const scheme = useColorScheme() ?? 'dark';

  if (bloco.tipo === 'versiculo') {
    return (
      <View style={[styles.blocoVersiculo, { backgroundColor: C.purple + '12', borderColor: C.purple }]}>
        <ThemedText style={[styles.blocoVersiculoText, { color: theme.text }]}>{bloco.texto}</ThemedText>
      </View>
    );
  }
  if (bloco.tipo === 'destaque') {
    const destaqueBg = scheme === 'dark' ? '#26215C' : C.purple + '18';
    return (
      <View style={[styles.blocoDestaque, { backgroundColor: destaqueBg, borderColor: C.purple + '55' }]}>
        <ThemedText style={styles.blocoDestaqueIcon}>💡</ThemedText>
        <ThemedText style={[styles.blocoDestaqueText, { color: theme.text }]}>{bloco.texto}</ThemedText>
      </View>
    );
  }
  if (bloco.tipo === 'curiosidade') {
    return (
      <View style={[styles.blocoCurio, { backgroundColor: C.green + '12', borderColor: C.green + '55' }]}>
        <ThemedText style={styles.blocoCurioIcon}>🔍</ThemedText>
        <ThemedText style={[styles.blocoCurioText, { color: theme.text }]}>{bloco.texto}</ThemedText>
      </View>
    );
  }
  return (
    <View style={[styles.blocoTexto, { backgroundColor: theme.backgroundElement, borderColor: C.border }]}>
      <ThemedText style={[styles.blocoTextoText, { color: theme.text }]}>{bloco.texto}</ThemedText>
    </View>
  );
}

export default function LicaoScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { trilhaId, licaoId } = useLocalSearchParams<{ trilhaId: string; licaoId: string }>();
  const trilha = TRILHAS.find(t => t.id === Number(trilhaId));
  const licao = trilha?.licoes.find(l => l.id === Number(licaoId));

  const [fase, setFase] = useState<Fase>('conteudo');
  const [perguntaIdx, setPerguntaIdx] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fase === 'conclusao') {
      Animated.spring(xpAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
      const isLastLesson = trilha ? !trilha.licoes.some(l => l.id === (licao?.id ?? 0) + 1) : false;
      if (isLastLesson) {
        setShowFeedback(true);
        setStarRating(0);
      }
    }
  }, [fase, xpAnim, trilha, licao]);

  if (!trilha || !licao) {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>← Voltar</ThemedText>
          </TouchableOpacity>
          <ThemedText style={{ textAlign: 'center', marginTop: 40 }}>Lição não encontrada.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const pergunta = licao.perguntas[perguntaIdx];
  const totalPassos = fase === 'conteudo' ? 1 : licao.perguntas.length;
  const passoAtual = fase === 'conteudo' ? 0 : perguntaIdx;

  async function concluirLicao() {
    if (user?.id) {
      const key = `${trilhaId}-${licaoId}`;
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const prog: Progresso = raw ? JSON.parse(raw) : { licoesConcluidas: [], xpTotal: 0 };
      if (!prog.licoesConcluidas.includes(key)) {
        prog.licoesConcluidas.push(key);
        prog.xpTotal += licao.xp;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
        pushProgress(user.id).catch((e: unknown) => console.warn('[licao] pushProgress error:', e));
      }
    }
    setFase('conclusao');
  }

  function responder(idx: number) {
    if (respostaSelecionada !== null) return;
    setRespostaSelecionada(idx);
    setMostrarExplicacao(true);
  }

  function proximaPergunta() {
    if (perguntaIdx + 1 < licao!.perguntas.length) {
      setPerguntaIdx(prev => prev + 1);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
    } else {
      concluirLicao();
    }
  }

  async function submitFeedback(stars: number) {
    setSendingFeedback(true);
    const { error } = await supabase.from('licao_feedback').insert({
      user_id:   user?.id ?? null,
      trilha_id: Number(trilhaId),
      licao_id:  Number(licaoId),
      stars,
    });
    setSendingFeedback(false);
    if (error) {
      console.error('[licao_feedback]', error.message, error.code);
      Alert.alert('Erro ao enviar', `Não foi possível salvar: ${error.message}`);
      return;
    }
    setShowFeedback(false);
  }

  function irParaProximaLicao() {
    const proxId = licao!.id + 1;
    const temProxima = trilha!.licoes.some(l => l.id === proxId);
    if (temProxima) {
      router.replace(`/licao?trilhaId=${trilhaId}&licaoId=${proxId}`);
    } else {
      router.back();
    }
  }

  const OPCOES_LABEL = ['A', 'B', 'C', 'D'];

  // ── Fase: conclusão ─────────────────────────────────────────────────────────
  if (fase === 'conclusao') {
    const proxId = licao.id + 1;
    const temProxima = trilha.licoes.some(l => l.id === proxId);
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.conclusaoContainer]} edges={['top', 'bottom']}>
          <View style={styles.conclusaoContent}>
            <ThemedText style={styles.conclusaoEmoji}>🎉</ThemedText>
            <ThemedText style={[styles.conclusaoTitulo, { color: theme.text }]}>Lição Concluída!</ThemedText>
            <ThemedText style={[styles.conclusaoSubtitulo, { color: theme.textSecondary }]}>
              {licao.titulo}
            </ThemedText>
            <Animated.View style={[styles.xpCard, {
              backgroundColor: C.gold + '22',
              borderColor: C.gold + '66',
              transform: [{ scale: xpAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
            }]}>
              <ThemedText style={styles.xpCardText}>+{licao.xp} XP</ThemedText>
            </Animated.View>
          </View>
          <View style={styles.conclusaoBtns}>
            {temProxima ? (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.purple }]} onPress={irParaProximaLicao} activeOpacity={0.85}>
                <ThemedText style={styles.primaryBtnText}>PRÓXIMA LIÇÃO →</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.green }]} onPress={() => router.back()} activeOpacity={0.85}>
                <ThemedText style={styles.primaryBtnText}>✅ VOLTAR ÀS TRILHAS</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <ThemedText style={[styles.linkBtn, { color: theme.textSecondary }]}>Voltar à trilha</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Modal de feedback com estrelas */}
        <Modal
          visible={showFeedback}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFeedback(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.modalEmoji}>⭐</ThemedText>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Como foi essa lição?</ThemedText>
              <ThemedText style={[styles.modalSub, { color: theme.textSecondary }]}>
                Sua avaliação nos ajuda a melhorar o conteúdo
              </ThemedText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setStarRating(n)} activeOpacity={0.7} style={styles.starBtn}>
                    <ThemedText style={[styles.starIcon, { opacity: n <= starRating ? 1 : 0.3 }]}>⭐</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={[styles.modalSendBtn, { opacity: starRating === 0 || sendingFeedback ? 0.5 : 1 }]}
                  onPress={() => submitFeedback(starRating)}
                  disabled={starRating === 0 || sendingFeedback}
                  activeOpacity={0.8}>
                  <ThemedText style={styles.modalSendText}>
                    {sendingFeedback ? 'ENVIANDO...' : 'ENVIAR'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFeedback(false)} activeOpacity={0.7}>
                  <ThemedText style={[styles.modalSkipText, { color: theme.textSecondary }]}>Pular</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    );
  }

  // ── Fase: conteúdo ───────────────────────────────────────────────────────────
  if (fase === 'conteudo') {
    return (
      <ThemedView style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top']}>
          {/* Header */}
          <View style={[styles.topBar, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ThemedText style={styles.backText}>←</ThemedText>
            </TouchableOpacity>
            <View style={styles.barContainer}>
              <View style={[styles.barBg, { backgroundColor: C.purple + '22' }]}>
                <View style={[styles.barFill, { width: '15%' }]} />
              </View>
            </View>
            <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]}>Conteúdo</ThemedText>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}>
            <ThemedText style={[styles.licaoTitulo, { color: theme.text }]}>{licao.titulo}</ThemedText>
            <ThemedText style={[styles.licaoVersiculo, { color: C.purple }]}>{licao.versiculo}</ThemedText>
            {licao.conteudo.map((bloco, i) => (
              <BlocoConteudo key={i} bloco={bloco} theme={theme} />
            ))}
          </ScrollView>

          <View style={[styles.ctaWrapper, { backgroundColor: theme.background, borderTopColor: C.border }]}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: C.purple }]}
              onPress={() => setFase('quiz')}
              activeOpacity={0.85}>
              <ThemedText style={styles.primaryBtnText}>INICIAR QUIZ →</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Fase: quiz ───────────────────────────────────────────────────────────────
  const isCorreta = respostaSelecionada === pergunta.correta;

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        {/* Header */}
        <View style={[styles.topBar, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>←</ThemedText>
          </TouchableOpacity>
          <View style={styles.barContainer}>
            <View style={[styles.barBg, { backgroundColor: C.purple + '22' }]}>
              <View style={[styles.barFill, { width: `${((perguntaIdx + 1) / licao.perguntas.length) * 100}%` }]} />
            </View>
          </View>
          <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]}>
            {perguntaIdx + 1}/{licao.perguntas.length}
          </ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}>
          <ThemedText style={[styles.quizTitulo, { color: theme.textSecondary }]}>
            Pergunta {perguntaIdx + 1} de {licao.perguntas.length}
          </ThemedText>
          <ThemedText style={[styles.quizPergunta, { color: theme.text }]}>{pergunta.pergunta}</ThemedText>

          <View style={styles.opcoesContainer}>
            {pergunta.opcoes.map((opcao, idx) => {
              let bgColor = theme.backgroundElement;
              let borderColor = C.border;
              let textColor = theme.text;

              if (respostaSelecionada !== null) {
                if (idx === pergunta.correta) {
                  bgColor = C.green + '22';
                  borderColor = C.green;
                  textColor = C.green;
                } else if (idx === respostaSelecionada && idx !== pergunta.correta) {
                  bgColor = C.red + '22';
                  borderColor = C.red;
                  textColor = C.red;
                }
              } else if (respostaSelecionada === null) {
                bgColor = theme.backgroundElement;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => responder(idx)}
                  activeOpacity={respostaSelecionada !== null ? 1 : 0.8}
                  style={[styles.opcaoBtn, { backgroundColor: bgColor, borderColor }]}>
                  <View style={[styles.opcaoLabel, { backgroundColor: borderColor + '33', borderColor }]}>
                    <ThemedText style={[styles.opcaoLabelText, { color: textColor }]}>{OPCOES_LABEL[idx]}</ThemedText>
                  </View>
                  <ThemedText style={[styles.opcaoText, { color: textColor, flex: 1 }]}>{opcao}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {mostrarExplicacao && (
            <View style={[styles.explicacaoBox, {
              backgroundColor: isCorreta ? C.green + '15' : C.red + '15',
              borderColor: isCorreta ? C.green + '66' : C.red + '66',
            }]}>
              <ThemedText style={[styles.explicacaoIcon]}>
                {isCorreta ? '✅' : '❌'}
              </ThemedText>
              <ThemedText style={[styles.explicacaoTitulo, { color: isCorreta ? C.green : C.red }]}>
                {isCorreta ? 'Correto!' : 'Incorreto'}
              </ThemedText>
              <ThemedText style={[styles.explicacaoText, { color: theme.text }]}>{pergunta.explicacao}</ThemedText>
            </View>
          )}
        </ScrollView>

        {mostrarExplicacao && (
          <View style={[styles.ctaWrapper, { backgroundColor: theme.background, borderTopColor: C.border }]}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: C.purple }]}
              onPress={proximaPergunta}
              activeOpacity={0.85}>
              <ThemedText style={styles.primaryBtnText}>
                {perguntaIdx + 1 < licao.perguntas.length ? 'PRÓXIMA PERGUNTA →' : 'CONCLUIR LIÇÃO →'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  backBtn: { padding: Spacing.two },
  backText: { fontSize: 24, fontWeight: '700', color: C.purple },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderBottomWidth: 1,
  },
  barContainer: { flex: 1 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.purple },
  barLabel: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  licaoTitulo: { fontSize: 24, fontWeight: '900', lineHeight: 30 },
  licaoVersiculo: { fontSize: 13, fontWeight: '700' },
  blocoTexto: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
  },
  blocoTextoText: { fontSize: 15, lineHeight: 24 },
  blocoVersiculo: {
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderWidth: 1,
  },
  blocoVersiculoText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  blocoDestaque: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
  blocoDestaqueIcon: { fontSize: 20 },
  blocoDestaqueText: { fontSize: 15, lineHeight: 24 },
  blocoCurio: {
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
  blocoCurioIcon: { fontSize: 20 },
  blocoCurioText: { fontSize: 15, lineHeight: 24 },
  ctaWrapper: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  primaryBtn: {
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  quizTitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  quizPergunta: { fontSize: 20, fontWeight: '800', lineHeight: 28 },
  opcoesContainer: { gap: Spacing.two },
  opcaoBtn: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  opcaoLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoLabelText: { fontSize: 13, fontWeight: '900' },
  opcaoText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  explicacaoBox: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
  explicacaoIcon: { fontSize: 24, lineHeight: 32 },
  explicacaoTitulo: { fontSize: 16, fontWeight: '800' },
  explicacaoText: { fontSize: 14, lineHeight: 22 },
  conclusaoContainer: { justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.four },
  conclusaoContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  conclusaoEmoji: { fontSize: 72, lineHeight: 86 },
  conclusaoTitulo: { fontSize: 28, fontWeight: '900', textAlign: 'center', lineHeight: 36 },
  conclusaoSubtitulo: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  xpCard: {
    borderRadius: 99,
    borderWidth: 2,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  xpCardText: { color: C.gold, fontSize: 28, fontWeight: '900', lineHeight: 36 },
  conclusaoBtns: { gap: Spacing.two, width: '100%' },
  linkBtn: { textAlign: 'center', fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  // Feedback modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalCard: {
    borderRadius: 20,
    padding: Spacing.four,
    width: '100%',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalEmoji:    { fontSize: 40, lineHeight: 50 },
  modalTitle:    { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalSub:      { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  starsRow:      { flexDirection: 'row', gap: 8, marginVertical: Spacing.one },
  starBtn:       { padding: 4 },
  starIcon:      { fontSize: 36, lineHeight: 44 },
  modalBtns:     { gap: Spacing.one, width: '100%', alignItems: 'center', marginTop: Spacing.one },
  modalSendBtn: {
    backgroundColor: C.purple,
    paddingVertical: 13,
    paddingHorizontal: 40,
    borderRadius: 99,
    alignItems: 'center',
    width: '100%',
  },
  modalSendText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  modalSkipText: { fontSize: 13, paddingVertical: 8 },
});
