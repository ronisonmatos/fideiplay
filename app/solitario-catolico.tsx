import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  Easing,
  FadeOutUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { GameHeader } from '@/components/game-header';
import { GameRewardBanner } from '@/components/game-reward-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, C, Colors, Spacing } from '@/constants/theme';
import { ECONOMY } from '@/constants/economy';
import { MAX_LEVEL, xpDoNivelAtual, type CartaSolitario } from '@/constants/solitario-niveis';
import { useGameStore } from '@/context/game-store';
import { useGameLevels } from '@/context/game-levels-context';
import { useSolitario } from '@/hooks/use-solitario';
import { playClickSound } from '@/lib/click-sound';

const FELT_GREEN = '#1a3a2a';
const CARD_W = 84;
const CARD_H = 110; // proporção próxima da arte das cartas (337×443px), evita distorcer
const PEEK = 28;
const COLUNA_WIDTH = CARD_W + Spacing.two;

function formatTempo(ms: number): string {
  const totalSeg = Math.floor(ms / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  return `${min}:${String(seg).padStart(2, '0')}`;
}

// ── Confete de vitória (roxo/dourado) ──────────────────────────────────────────
function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const cor = index % 2 === 0 ? C.purple : C.gold;
  const left = `${(index * 37) % 100}%`;

  useEffect(() => {
    const delay = (index * 53) % 600;
    const duration = 1800 + ((index * 97) % 900);
    translateY.value = withDelay(delay, withTiming(440, { duration, easing: Easing.in(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming(((index % 5) - 2) * 28, { duration }));
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1));
    opacity.value = withDelay(delay + duration - 300, withTiming(0, { duration: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return <Animated.View pointerEvents="none" style={[s.confettiPiece, { left: left as `${number}%`, backgroundColor: cor }, style]} />;
}

function Confetti() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 26 }, (_, i) => <ConfettiPiece key={i} index={i} />)}
    </View>
  );
}

// ── Cartas ──────────────────────────────────────────────────────────────────
function FaceDownIndicator({ quantidade }: { quantidade: number }) {
  if (quantidade === 0) return <View style={s.faceDownSlot} />;
  return (
    <View style={[s.card, s.faceDown]}>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require('@/assets/images/fundo_carta.png')} style={s.faceDownImage} resizeMode="stretch" />
      <View style={s.montebadge}>
        <ThemedText style={s.montebadgeText}>{quantidade}</ThemedText>
      </View>
    </View>
  );
}

interface FaceUpCardProps {
  carta: CartaSolitario;
  usaImagem: boolean;
  selecionada: boolean;
  destaque: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

function FaceUpCard({ carta, usaImagem, selecionada, destaque, onPress, style }: FaceUpCardProps) {
  return (
    <Animated.View exiting={FadeOutUp.duration(450)} style={style}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          s.card,
          s.faceUp,
          selecionada && s.faceUpSelecionada,
          destaque && s.faceUpDestaque,
        ]}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image
          source={carta.isCategoria
            ? require('@/assets/images/fundo_carta_categoria.png')
            : require('@/assets/images/frente_carta.png')}
          style={s.faceUpBg}
          resizeMode="stretch"
        />
        <View style={s.faceUpOverlay}>
          <View style={s.faceUpConteudo}>
            {carta.isCategoria ? (
              <>
                <ThemedText style={s.faceUpIcone}>{carta.icone}</ThemedText>
                <ThemedText style={s.faceUpNome} numberOfLines={3}>{carta.nome}</ThemedText>
              </>
            ) : usaImagem && carta.imagemUrl ? (
              <Animated.Image source={{ uri: carta.imagemUrl }} style={s.cardImage} resizeMode="cover" />
            ) : (
              <ThemedText style={s.faceUpNome} numberOfLines={3}>{carta.nome}</ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SolitarioCatolicoScreen() {
  const { reportResult } = useGameStore();
  const { isLevelComplete, markLevelComplete } = useGameLevels();
  const solitario = useSolitario();
  const {
    GAME_ID, fase, nivelAtual, colunas, selecionada, movimentosRestantes, movimentosIniciais,
    podeDesfazer, dicaAtual, dicasUsadas, ultimoGrupo, tempoGastoMs, saldoMoedas, ganhar,
    iniciarNivel, sair, selecionarCarta, desfazer, dica,
  } = solitario;

  const [coinsGanhas, setCoinsGanhas] = useState<number | null>(null);
  const rewardedLevelRef = useRef<string | null>(null);

  // Progressão é sempre sequencial — sem grade de seleção de nível. O próximo
  // nível é sempre o primeiro ainda não concluído; se tudo já foi concluído,
  // recomeça do 1 (permite rejogar do início em vez de travar no fim).
  const proximoNivel = useMemo(() => {
    for (let n = 1; n <= MAX_LEVEL; n++) {
      if (!isLevelComplete(GAME_ID, `nivel-${n}`)) return n;
    }
    return 1;
  }, [isLevelComplete, GAME_ID]);

  // Recompensa é por nível concluído (não por sessão inteira) — o guard precisa ser
  // pelo id do nível, não um ref fixo, já que a tela permanece montada entre níveis.
  useEffect(() => {
    if (fase !== 'vitoria' || !nivelAtual || rewardedLevelRef.current === nivelAtual.id) return;
    rewardedLevelRef.current = nivelAtual.id;
    setCoinsGanhas(null);

    reportResult({ gameId: GAME_ID, score: xpDoNivelAtual(nivelAtual.numero) });
    markLevelComplete(GAME_ID, nivelAtual.id);

    const semDica = dicasUsadas === 0;
    const sobrouMovimentos = movimentosIniciais > 0 && (movimentosRestantes / movimentosIniciais) > 0.2;
    const total = ECONOMY.SOLITARIO_COMPLETAR
      + (semDica ? ECONOMY.SOLITARIO_BONUS_SEM_DICA : 0)
      + (sobrouMovimentos ? ECONOMY.SOLITARIO_BONUS_MOVIMENTOS : 0);

    ganhar(total, 'Paciência Católica — nível concluído')
      .then(ok => setCoinsGanhas(ok ? total : 0))
      .catch(() => setCoinsGanhas(0));
  }, [fase, nivelAtual, dicasUsadas, movimentosRestantes, movimentosIniciais, reportResult, markLevelComplete, ganhar, GAME_ID]);

  const iniciar = useCallback((numero: number) => {
    playClickSound();
    setCoinsGanhas(null);
    iniciarNivel(numero);
  }, [iniciarNivel]);

  const voltarAoMenu = useCallback(() => {
    sair();
  }, [sair]);

  // ── Introdução ────────────────────────────────────────────────────────────
  if (fase === 'idle') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Paciência Católica" subtitle="CARTAS" />
          <View style={[s.center, { paddingBottom: BottomTabInset + Spacing.four }]}>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <Image source={require('@/assets/images/solitario_catolico.png')} style={s.gameIcon} resizeMode="contain" />
            <ThemedText type="subtitle" style={s.textCenter}>Paciência Católica</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.textCenter, s.desc]}>
              Agrupe 4 cartas da mesma categoria para elas sumirem do tabuleiro.{'\n'}
              Limpe todas as cartas antes de acabar os movimentos!
            </ThemedText>
            <ThemedText style={[s.textCenter, s.nivelAtualTxt, { color: C.purple }]}>
              Nível {proximoNivel} de {MAX_LEVEL}
            </ThemedText>
            <TouchableOpacity style={s.primaryBtn} onPress={() => iniciar(proximoNivel)} activeOpacity={0.8}>
              <ThemedText style={s.primaryBtnText}>JOGAR</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Carregando ────────────────────────────────────────────────────────────
  if (fase === 'carregando') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Paciência Católica" onBack={voltarAoMenu} />
          <View style={s.center}><ActivityIndicator color={C.purple} size="large" /></View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Nível indisponível (banco sem conteúdo suficiente) ───────────────────
  if (fase === 'indisponivel') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Paciência Católica" onBack={voltarAoMenu} />
          <View style={s.center}>
            <ThemedText style={{ fontSize: 44, lineHeight: 52 }}>🗂️</ThemedText>
            <ThemedText type="subtitle" style={s.textCenter}>Nível indisponível</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.textCenter, s.desc]}>
              Ainda não há cartas suficientes cadastradas para este nível. Tente novamente mais tarde.
            </ThemedText>
            <TouchableOpacity style={s.primaryBtn} onPress={voltarAoMenu} activeOpacity={0.8}>
              <ThemedText style={s.primaryBtnText}>VOLTAR</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Erro ──────────────────────────────────────────────────────────────────
  if (fase === 'erro') {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Paciência Católica" onBack={voltarAoMenu} />
          <View style={s.center}>
            <ThemedText style={{ fontSize: 44, lineHeight: 52 }}>⚠️</ThemedText>
            <ThemedText type="subtitle" style={s.textCenter}>Algo deu errado</ThemedText>
            <ThemedText themeColor="textSecondary" style={[s.textCenter, s.desc]}>
              Não foi possível carregar o nível. Verifique sua conexão e tente novamente.
            </ThemedText>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => nivelAtual && iniciar(nivelAtual.numero)}
              activeOpacity={0.8}>
              <ThemedText style={s.primaryBtnText}>TENTAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Vitória ───────────────────────────────────────────────────────────────
  if (fase === 'vitoria' && nivelAtual) {
    const movimentosUsados = movimentosIniciais - movimentosRestantes;
    const ultimoNivel = nivelAtual.numero >= MAX_LEVEL;
    return (
      <ThemedView style={s.fill}>
        <Confetti />
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Paciência Católica" />
          <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={s.resultCard}>
              <ThemedText style={s.resultEmoji}>🎉</ThemedText>
              <ThemedText style={s.resultTitle}>Tabuleiro limpo!</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.resultSub}>
                Nível {nivelAtual.numero} · {movimentosUsados} movimentos usados · {formatTempo(tempoGastoMs)}
              </ThemedText>
            </View>
            <GameRewardBanner xp={xpDoNivelAtual(nivelAtual.numero)} coins={coinsGanhas} />
            {ultimoNivel ? (
              <TouchableOpacity style={[s.btn, { backgroundColor: C.green }]} onPress={voltarAoMenu} activeOpacity={0.85}>
                <ThemedText style={s.btnText}>🏆 JOGO CONCLUÍDO — VOLTAR AO MENU</ThemedText>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[s.btn, { backgroundColor: C.purple }]} onPress={() => iniciar(nivelAtual.numero + 1)} activeOpacity={0.85}>
                  <ThemedText style={s.btnText}>PRÓXIMO NÍVEL</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[s.outlineBtn, { borderColor: C.purple }]} onPress={voltarAoMenu} activeOpacity={0.85}>
                  <ThemedText style={[s.outlineBtnText, { color: C.purple }]}>VOLTAR AO MENU</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Derrota ───────────────────────────────────────────────────────────────
  if (fase === 'derrota' && nivelAtual) {
    return (
      <ThemedView style={s.fill}>
        <SafeAreaView style={s.fill} edges={['top']}>
          <GameHeader title="Paciência Católica" />
          <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: BottomTabInset + Spacing.four }]}>
            <View style={s.resultCard}>
              <ThemedText style={s.resultEmoji}>📿</ThemedText>
              <ThemedText style={[s.resultTitle, { color: C.red }]}>Sem mais jogadas</ThemedText>
              <ThemedText themeColor="textSecondary" style={s.resultSub}>
                &quot;Tudo posso naquele que me fortalece.&quot; — São Paulo (Fl 4,13){'\n'}
                Respire fundo e tente de novo.
              </ThemedText>
            </View>
            <TouchableOpacity style={[s.btn, { backgroundColor: C.purple }]} onPress={() => iniciar(nivelAtual.numero)} activeOpacity={0.85}>
              <ThemedText style={s.btnText}>TENTAR NOVAMENTE</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[s.outlineBtn, { borderColor: C.purple }]} onPress={voltarAoMenu} activeOpacity={0.85}>
              <ThemedText style={[s.outlineBtnText, { color: C.purple }]}>VOLTAR</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Jogando ───────────────────────────────────────────────────────────────
  if (!nivelAtual) return null;

  return (
    <View style={[s.fill, { backgroundColor: FELT_GREEN }]}>
      <SafeAreaView style={s.fill} edges={['top']}>
        <View style={s.jogandoHeader}>
          <TouchableOpacity onPress={voltarAoMenu} hitSlop={12} style={s.backBtnFelt}>
            <ThemedText style={s.backArrowFelt}>←</ThemedText>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <ThemedText style={s.feltTitle}>Nível {nivelAtual.numero}</ThemedText>
            <ThemedText style={s.feltSubtitle}>{movimentosRestantes} movimentos</ThemedText>
          </View>
          <View style={s.moedasBadge}>
            <ThemedText style={s.moedasBadgeText}>🪙 {saldoMoedas}</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={[s.tabuleiro, { paddingBottom: BottomTabInset + 96 }]}>
          <View style={s.colunasRow}>
            {colunas.map((coluna, idx) => {
              const topoIdx = coluna.pilha.length - 1;
              const emDestaque = dicaAtual && (dicaAtual.origem === idx || dicaAtual.destino === idx);
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => selecionarCarta(idx)}
                  style={[s.coluna, { width: COLUNA_WIDTH }]}>
                  <FaceDownIndicator quantidade={coluna.monte.length} />
                  <View style={[s.pilhaWrap, { minHeight: CARD_H + PEEK * 3 }]}>
                    {coluna.pilha.length === 0 && (
                      <View style={[s.emptySlot, emDestaque && s.emptySlotDestaque]} />
                    )}
                    {coluna.pilha.map((carta, cIdx) => (
                      <FaceUpCard
                        key={carta.id}
                        carta={carta}
                        usaImagem={nivelAtual.usaImagem}
                        selecionada={selecionada === idx && cIdx === topoIdx}
                        destaque={!!emDestaque && cIdx === topoIdx}
                        onPress={() => selecionarCarta(idx)}
                        style={{ position: 'absolute', top: cIdx * PEEK }}
                      />
                    ))}
                  </View>
                  {ultimoGrupo?.colunaIndex === idx && (
                    <Animated.View
                      entering={ZoomIn.duration(200)}
                      exiting={FadeOutUp.duration(400)}
                      pointerEvents="none"
                      style={[s.glow, { backgroundColor: ultimoGrupo.cor + '55' }]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[s.controles, { paddingBottom: Spacing.three }]}>
          <TouchableOpacity
            onPress={desfazer}
            disabled={!podeDesfazer}
            activeOpacity={0.8}
            style={[s.controleBtn, !podeDesfazer && s.controleBtnDesabilitado]}>
            <ThemedText style={s.controleBtnText}>↩️ {ECONOMY.SOLITARIO_DESFAZER} 🪙</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={dica} activeOpacity={0.8} style={s.controleBtn}>
            <ThemedText style={s.controleBtnText}>💡 {ECONOMY.SOLITARIO_DICA} 🪙</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/ad-reward')} activeOpacity={0.8} style={s.controleBtn}>
            <ThemedText style={s.controleBtnText}>📺 +{ECONOMY.ASSISTIR_ANUNCIO} 🪙</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.five, gap: Spacing.three },
  textCenter: { textAlign: 'center' },
  desc: { fontSize: 15, lineHeight: 22 },
  gameIcon: { width: 96, height: 96 },
  scroll: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three, alignItems: 'center' },

  primaryBtn: {
    backgroundColor: C.purple, paddingHorizontal: Spacing.five, paddingVertical: 14,
    borderRadius: C.radius.pill, marginTop: Spacing.one, alignItems: 'center', alignSelf: 'stretch',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1.1 },
  btn: { alignSelf: 'stretch', paddingVertical: 16, borderRadius: C.radius.pill, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 1, fontSize: 14 },
  outlineBtn: { alignSelf: 'stretch', paddingVertical: 14, borderRadius: C.radius.pill, alignItems: 'center', borderWidth: 1.5 },
  outlineBtnText: { fontWeight: '700', fontSize: 14 },
  nivelAtualTxt: { fontSize: 15, fontWeight: '800' },

  resultCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  resultEmoji: { fontSize: 52, lineHeight: 64 },
  resultTitle: { fontSize: 24, fontWeight: '800' },
  resultSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // ── Tabuleiro (felt) ──
  jogandoHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  backBtnFelt: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrowFelt: { color: '#E8E6FF', fontSize: 24, fontWeight: '700' },
  feltTitle: { color: '#E8E6FF', fontSize: 15, fontWeight: '800' },
  feltSubtitle: { color: '#9B97D4', fontSize: 12, marginTop: 2 },
  moedasBadge: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: C.radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  moedasBadgeText: { color: C.gold, fontWeight: '800', fontSize: 13 },

  tabuleiro: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  colunasRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  coluna: { alignItems: 'center', gap: Spacing.two },
  pilhaWrap: { width: CARD_W, alignItems: 'center' },
  emptySlot: {
    width: CARD_W, height: CARD_H, borderRadius: C.radius.md,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(232,230,255,0.35)',
  },
  emptySlotDestaque: { borderColor: C.gold, borderWidth: 2 },
  glow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: C.radius.lg,
  },

  card: { width: CARD_W, height: CARD_H, borderRadius: C.radius.md, alignItems: 'center', justifyContent: 'center' },
  faceDownSlot: { width: CARD_W, height: CARD_H * 0.3 },
  faceDown: {
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1, borderColor: 'rgba(239,159,39,0.4)',
    overflow: 'hidden',
  },
  faceDownImage: { width: '100%', height: '100%' },
  montebadge: {
    position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1,
  },
  montebadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  faceUp: {
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  faceUpBg: { width: '100%', height: '100%' },
  faceUpOverlay: { ...StyleSheet.absoluteFillObject },
  faceUpConteudo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  faceUpSelecionada: { borderColor: C.gold, borderWidth: 3 },
  faceUpDestaque: { borderColor: C.gold, borderWidth: 2.5 },
  faceUpNome: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: '#221F33' },
  faceUpIcone: { fontSize: 22, lineHeight: 26, marginBottom: 4 },
  cardImage: { width: '100%', height: '100%', borderRadius: C.radius.sm },

  controles: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.three,
    paddingTop: Spacing.two, paddingHorizontal: Spacing.three,
  },
  controleBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: C.radius.pill,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  controleBtnDesabilitado: { opacity: 0.4 },
  controleBtnText: { color: '#E8E6FF', fontWeight: '700', fontSize: 13 },

  confettiPiece: { position: 'absolute', top: 0, width: 8, height: 14, borderRadius: 2 },
});
