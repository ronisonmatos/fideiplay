import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CORES_CATEGORIA } from '@/constants/banner-config';
import { C } from '@/constants/theme';
import { useBannerAd } from '@/hooks/use-banner-ad';
import { useTheme } from '@/hooks/use-theme';
import { registerBannerClique, registerBannerImpressao } from '@/lib/banner-ads';
import type { BannerAd as BannerAdData } from '@/lib/banner-ads';

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const EASE_EVENTO = Easing.bezier(0.22, 0.61, 0.36, 1);
// Âmbar (mesmo tom do rótulo "ANÚNCIO" em app/ad-reward.tsx) — antes era roxo,
// a cor de destaque usada em botões/badges do resto do app inteiro, o que
// deixava o card comercial visualmente indistinguível do próprio conteúdo do
// jogo (Requisitos de formato de anúncios para famílias, Play Store).
const BORDA_COMERCIAL_REPOUSO = 'rgba(239,159,39,0.5)';
const BORDA_COMERCIAL_PICO = 'rgba(239,159,39,0.95)';

// Flags de módulo (não de componente): persistem entre montagens de <BannerAd/> em
// telas diferentes, garantindo que a animação de entrada só rode uma vez por sessão
// — a partir daí, toda troca de anúncio usa a versão rápida (fade + slide de 8px).
let bannerJaAnimouNaSessao = false;

export function BannerAd() {
  const ad = useBannerAd();
  const theme = useTheme();
  const impressedIdRef = useRef<string | null>(null);

  const fadeAnim      = useRef(new Animated.Value(bannerJaAnimouNaSessao ? 1 : 0)).current;
  const translateAnim = useRef(new Animated.Value(bannerJaAnimouNaSessao ? 0 : 12)).current;
  // Só usado no pulse de borda do anúncio comercial — não roda com native driver
  // porque borderColor/borderWidth não são suportados pelo native driver.
  const borderProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ad || impressedIdRef.current === ad.id) return;
    const primeiroAdDestaInstancia = impressedIdRef.current === null;
    impressedIdRef.current = ad.id;
    registerBannerImpressao(ad.id, ad.origem);

    if (!bannerJaAnimouNaSessao) {
      bannerJaAnimouNaSessao = true;

      if (ad.tipo === 'evento') {
        // Animação 5: fade + slide up de 12px
        fadeAnim.setValue(0);
        translateAnim.setValue(12);
        Animated.timing(translateAnim, { toValue: 0, duration: 400, easing: EASE_EVENTO, useNativeDriver: true }).start();
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, easing: EASE_EVENTO, useNativeDriver: true }).start();
      } else {
        // Animação 4: aparece instantâneo, depois pulse na borda
        fadeAnim.setValue(1);
        translateAnim.setValue(0);
        borderProgress.setValue(0);
        setTimeout(() => {
          Animated.timing(borderProgress, { toValue: 1, duration: 150, useNativeDriver: false }).start(() => {
            Animated.timing(borderProgress, { toValue: 0, duration: 400, useNativeDriver: false }).start();
          });
        }, 50);
      }
    } else if (!primeiroAdDestaInstancia) {
      // Troca de anúncio (sessão já animou antes): fade + slide rápido, sem pulse
      fadeAnim.setValue(0.3);
      translateAnim.setValue(8);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      Animated.timing(translateAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    } else {
      // Primeira exibição desta instância, mas outra tela já animou antes nesta sessão
      fadeAnim.setValue(1);
      translateAnim.setValue(0);
    }
  }, [ad, fadeAnim, translateAnim, borderProgress]);

  if (!ad) return null;

  const isEvento = ad.tipo === 'evento';
  const cores = isEvento ? (CORES_CATEGORIA[ad.categoria] ?? CORES_CATEGORIA.outro) : CORES_CATEGORIA.comercial;
  // Ambos os tipos usam o tom da própria categoria — nunca o fundo neutro do
  // tema, pra publicidade sempre ficar visualmente distinta dos cards de
  // conteúdo do app (jogos, trilhas etc.), que usam theme.backgroundElement puro.
  const cardBg = cores.fundo;

  const borderAnim = !isEvento ? {
    color: borderProgress.interpolate({ inputRange: [0, 1], outputRange: [BORDA_COMERCIAL_REPOUSO, BORDA_COMERCIAL_PICO] }),
    width: borderProgress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }),
  } : null;

  const handlePress = () => {
    registerBannerClique(ad.id, ad.origem);
    if (ad.link) Linking.openURL(ad.link).catch(() => {});
  };

  let dia: string | null = null;
  let mes: string | null = null;
  let diasAteEvento: number | null = null;
  if (isEvento && ad.data_evento) {
    const dataEvento = new Date(`${ad.data_evento}T00:00:00`);
    dia = String(dataEvento.getDate()).padStart(2, '0');
    mes = MESES[dataEvento.getMonth()];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    diasAteEvento = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }

  const layout: 'horizontal' | 'data_destaque' =
    diasAteEvento !== null && diasAteEvento <= 7 ? 'data_destaque' : 'horizontal';

  const props = { ad, isEvento, cores, cardBg, borderAnim, theme, onPress: handlePress };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}>
      {layout === 'data_destaque' && dia && mes
        ? <BannerDataDestaque {...props} dia={dia} mes={mes} />
        : <BannerHorizontal {...props} dia={dia} mes={mes} />}
    </Animated.View>
  );
}

interface LayoutProps {
  ad:         BannerAdData;
  isEvento:   boolean;
  cores:      { borda: string; fundo: string; texto: string; label: string };
  cardBg:     string;
  borderAnim: { color: Animated.AnimatedInterpolation<string>; width: Animated.AnimatedInterpolation<number> } | null;
  theme:      ReturnType<typeof useTheme>;
  onPress:    () => void;
  dia:        string | null;
  mes:        string | null;
}

// Bloco de data (dia grande + mês abreviado), na cor da categoria — usado no
// lugar de um ícone genérico sempre que o anúncio é um evento com data.
function DateBlock({ dia, mes, cores, theme }: { dia: string; mes: string; cores: LayoutProps['cores']; theme: LayoutProps['theme'] }) {
  return (
    <View style={[styles.iconBox, styles.calendarBox, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.calendarMonthBar, { backgroundColor: cores.label }]}>
        <ThemedText style={styles.calendarMonthText}>{mes}</ThemedText>
      </View>
      <ThemedText style={[styles.calendarDayText, { color: cores.label }]}>{dia}</ThemedText>
    </View>
  );
}

// Layout A — padrão: data/imagem à esquerda, texto no meio, botão à direita.
// Usado para anúncios comerciais e eventos a mais de 7 dias de distância.
function BannerHorizontal({ ad, isEvento, cores, cardBg, borderAnim, theme, onPress, dia, mes }: LayoutProps) {
  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: cardBg },
        borderAnim ? { borderColor: borderAnim.color, borderWidth: borderAnim.width } : { borderColor: cores.borda },
      ]}>
      {ad.imagem_url ? (
        <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
          <Image source={{ uri: ad.imagem_url }} style={styles.iconImg} resizeMode="cover" />
        </View>
      ) : dia && mes ? (
        <DateBlock dia={dia} mes={mes} cores={cores} theme={theme} />
      ) : (
        <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.iconFallback}>{isEvento ? '📅' : '✝️'}</ThemedText>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.labelBadge}>
          <ThemedText style={styles.labelBadgeText} numberOfLines={1}>
            {isEvento ? 'PATROCINADO' : 'ANÚNCIO'}
          </ThemedText>
        </View>
        <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{ad.titulo}</ThemedText>
        {isEvento && ad.local_evento ? (
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>{ad.local_evento}</ThemedText>
        ) : !isEvento && !!ad.descricao ? (
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>{ad.descricao}</ThemedText>
        ) : null}
      </View>

      <TouchableOpacity style={[styles.btn, { backgroundColor: cores.label + '26' }]} onPress={onPress} activeOpacity={0.8}>
        <ThemedText style={[styles.btnText, { color: cores.label }]}>Saiba mais</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Layout B — data em destaque: usado quando o evento está a menos de 7 dias,
// pra transmitir urgência sem precisar de texto "Urgente" ou similar.
function BannerDataDestaque({ ad, cores, cardBg, theme, dia, mes, onPress }: LayoutProps) {
  if (!dia || !mes) return null;
  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cores.borda }]}>
      <DateBlock dia={dia} mes={mes} cores={cores} theme={theme} />

      <View style={styles.info}>
        <View style={styles.labelBadge}>
          <ThemedText style={styles.labelBadgeText} numberOfLines={1}>PATROCINADO</ThemedText>
        </View>
        <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{ad.titulo}</ThemedText>
        {ad.local_evento ? (
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>{ad.local_evento}</ThemedText>
        ) : null}
      </View>

      <TouchableOpacity style={[styles.btn, { backgroundColor: cores.label + '26' }]} onPress={onPress} activeOpacity={0.8}>
        <ThemedText style={[styles.btnText, { color: cores.label }]}>Saiba mais</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 'auto',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImg: { width: '100%', height: '100%' },
  iconFallback: { fontSize: 22 },
  calendarBox: {
    justifyContent: 'flex-start',
  },
  calendarMonthBar: {
    width: '100%',
    paddingVertical: 2,
    alignItems: 'center',
  },
  calendarMonthText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  calendarDayText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  info: { flex: 1, gap: 2 },
  // Selo sólido (não só texto colorido) — mesma linguagem visual do badge
  // "ANÚNCIO" em app/ad-reward.tsx, pra ficar claro que é publicidade/conteúdo
  // patrocinado mesmo numa olhada rápida.
  labelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.gold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginBottom: 1,
  },
  labelBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, color: '#fff' },
  title: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 9 },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: { fontSize: 9, fontWeight: '700' },
});
