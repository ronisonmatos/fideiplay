import { ActivityIndicator, Animated, Image, Linking, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { fetchRandomAd, type Ad } from '@/lib/ads';
import { supabase } from '@/lib/supabase';

type Phase = 'loading' | 'ad' | 'claiming' | 'success' | 'error' | 'no_ads';

export default function AdRewardScreen() {
  const { user, refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  const [phase,       setPhase]       = useState<Phase>('loading');
  const [ad,          setAd]          = useState<Ad | null>(null);
  const [countdown,   setCountdown]   = useState(0);
  const [canSkip,     setCanSkip]     = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [isPaused,    setIsPaused]    = useState(false);
  const barAnim     = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef    = useRef<Video>(null);
  const adRef       = useRef<Ad | null>(null);
  const countdownRef = useRef(0);

  // Carrega anúncio aleatório
  useEffect(() => {
    fetchRandomAd().then(loaded => {
      if (!loaded) { setPhase('no_ads'); return; }
      adRef.current = loaded;
      setAd(loaded);
      setCountdown(loaded.duration);
      setPhase('ad');
    });
  }, []);

  const handleAdCompleted = useCallback(async () => {
    if (!user?.id) { router.back(); return; }
    setPhase('claiming');
    try {
      const { data } = await supabase.rpc('claim_ad_reward', {
        p_user_id: user.id,
        p_ad_id:   adRef.current?.id ?? null,
      });
      const result = data as { ok: boolean; reason?: string; coins_earned?: number };
      if (!result?.ok) {
        setErrorMsg(
          result?.reason === 'limit_reached'
            ? 'Você atingiu o limite de 3 vídeos por dia.\nVolte amanhã!'
            : 'Não foi possível resgatar. Tente novamente.',
        );
        setPhase('error');
      } else {
        setCoinsEarned(result.coins_earned ?? adRef.current?.coins ?? 15);
        await refreshProfile();
        setPhase('success');
      }
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet.');
      setPhase('error');
    }
  }, [user?.id, refreshProfile]);

  // Inicia timer quando o anúncio estiver pronto
  useEffect(() => {
    if (phase !== 'ad' || !ad) return;
    const dur    = ad.duration;
    const skipAt = ad.skip_after;

    Animated.timing(barAnim, {
      toValue: 0, duration: dur * 1000, useNativeDriver: false,
    }).start();

    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        const next = c - 1;
        if (next <= 0) { clearInterval(intervalRef.current!); return 0; }
        if (dur - next >= skipAt) setCanSkip(true);
        return next;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Sincroniza ref com state para uso nas funções de pausa
  useEffect(() => { countdownRef.current = countdown; }, [countdown]);

  // Completa quando countdown chega a 0
  useEffect(() => {
    if (phase === 'ad' && countdown === 0 && ad) handleAdCompleted();
  }, [countdown, phase, ad, handleAdCompleted]);

  function handlePressIn() {
    if (phase !== 'ad') return;
    setIsPaused(true);
    barAnim.stopAnimation();
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (adRef.current?.media_type === 'video') videoRef.current?.pauseAsync().catch(() => {});
  }

  function handlePressOut() {
    if (phase !== 'ad') return;
    setIsPaused(false);
    const remaining = countdownRef.current;
    if (remaining <= 0) return;
    // Retoma animação a partir do ponto atual
    Animated.timing(barAnim, {
      toValue: 0, duration: remaining * 1000, useNativeDriver: false,
    }).start();
    // Retoma countdown
    const skipAt = adRef.current?.skip_after ?? 5;
    const dur    = adRef.current?.duration ?? 15;
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        const next = c - 1;
        if (next <= 0) { clearInterval(intervalRef.current!); return 0; }
        if (dur - next >= skipAt) setCanSkip(true);
        return next;
      });
    }, 1000);
    if (adRef.current?.media_type === 'video') videoRef.current?.playAsync().catch(() => {});
  }

  function handleSkip() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    barAnim.stopAnimation();
    router.back();
  }

  function handleDone() {
    if (params.returnTo) router.replace(params.returnTo as never);
    else router.back();
  }

  // ── Estados de resultado ────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <View style={[s.fill, s.center, { backgroundColor: '#0d0d1a' }]}>
        <ThemedText style={s.resultEmoji}>🪙</ThemedText>
        <ThemedText style={s.resultTitle}>+{coinsEarned} moedas!</ThemedText>
        <ThemedText style={s.resultSub}>Obrigado por assistir</ThemedText>
        <TouchableOpacity style={s.doneBtn} onPress={handleDone} activeOpacity={0.85}>
          <ThemedText style={s.doneBtnText}>CONTINUAR</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[s.fill, s.center, { backgroundColor: '#0d0d1a' }]}>
        <ThemedText style={{ fontSize: 48, lineHeight: 58 }}>😕</ThemedText>
        <ThemedText style={[s.resultTitle, { color: C.red }]}>Ops!</ThemedText>
        <ThemedText style={[s.resultSub, { textAlign: 'center' }]}>{errorMsg}</ThemedText>
        <TouchableOpacity style={[s.doneBtn, { backgroundColor: C.red }]} onPress={handleDone} activeOpacity={0.85}>
          <ThemedText style={s.doneBtnText}>VOLTAR</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'claiming' || phase === 'loading') {
    return (
      <View style={[s.fill, s.center, { backgroundColor: '#0d0d1a' }]}>
        <ActivityIndicator size="large" color={C.gold} />
        <ThemedText style={[s.resultSub, { marginTop: 12 }]}>
          {phase === 'loading' ? 'Carregando anúncio...' : 'Resgatando moedas...'}
        </ThemedText>
      </View>
    );
  }

  if (phase === 'no_ads') {
    return (
      <View style={[s.fill, s.center, { backgroundColor: '#0d0d1a' }]}>
        <ThemedText style={{ fontSize: 48, lineHeight: 58 }}>📭</ThemedText>
        <ThemedText style={[s.resultTitle, { fontSize: 20 }]}>Sem anúncios no momento</ThemedText>
        <ThemedText style={s.resultSub}>Tente novamente mais tarde.</ThemedText>
        <TouchableOpacity style={[s.doneBtn, { backgroundColor: C.purple }]} onPress={handleDone} activeOpacity={0.85}>
          <ThemedText style={s.doneBtnText}>VOLTAR</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!ad) return null;

  // ── Tela do anúncio ─────────────────────────────────────────────────────────
  return (
    <View style={[s.fill, { backgroundColor: '#000' }]}>

      {/* Mídia (ocupa tela toda) */}
      {ad.media_type === 'video' ? (
        <Video
          ref={videoRef}
          source={{ uri: ad.media_url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
          useNativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: ad.media_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      )}

      {/* Gradiente topo */}
      <View style={s.gradientTop} pointerEvents="none" />
      {/* Gradiente base */}
      <View style={s.gradientBottom} pointerEvents="none" />

      <SafeAreaView style={s.fill} edges={['top', 'bottom']}>

        {/* Barra de progresso */}
        <View style={s.progressBg}>
          <Animated.View style={[s.progressFill, { flex: barAnim }]} />
          <Animated.View style={[s.progressEmpty, {
            flex: barAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }]} />
        </View>

        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.adBadge}>
            <ThemedText style={s.adBadgeText}>ANÚNCIO</ThemedText>
          </View>
          <View style={s.topRight}>
            <View style={s.countdownPill}>
              <ThemedText style={s.countdownText}>{countdown}s</ThemedText>
            </View>
            {canSkip && (
              <TouchableOpacity onPress={handleSkip} style={s.skipBtn} activeOpacity={0.75}>
                <ThemedText style={s.skipText}>✕ Pular</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Área pressável — segura para pausar */}
        <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}>
        </Pressable>

        {/* Rodapé do anúncio */}
        <View style={s.footer}>
          {/* Info do anunciante */}
          <View style={s.adInfo}>
            <ThemedText style={s.adTitle} numberOfLines={1}>{ad.title}</ThemedText>
            {ad.description ? (
              <ThemedText style={s.adDesc} numberOfLines={2}>{ad.description}</ThemedText>
            ) : null}
          </View>

          {/* CTA + recompensa */}
          <View style={s.ctaRow}>
            <View style={s.rewardBadge}>
              <ThemedText style={s.rewardCoins}>🪙 +{ad.coins}</ThemedText>
              <ThemedText style={s.rewardLabel}>ao assistir</ThemedText>
            </View>
            {ad.cta_url ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(ad.cta_url!).catch(() => {})}
                style={s.ctaBtn}
                activeOpacity={0.85}>
                <ThemedText style={s.ctaBtnText}>{ad.cta_text}</ThemedText>
                <ThemedText style={s.ctaArrow}>→</ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  fill:   { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },

  // Gradientes simulados
  gradientTop: {
    ...StyleSheet.absoluteFillObject,
    bottom: undefined,
    height: 160,
    backgroundColor: 'transparent',
    // sombra manual via camadas
    borderTopWidth: 0,
    opacity: 1,
    background: 'linear-gradient(#000, transparent)',
  },
  gradientBottom: {
    ...StyleSheet.absoluteFillObject,
    top: undefined,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  // Progresso
  progressBg:    { height: 3, flexDirection: 'row' },
  progressFill:  { backgroundColor: C.gold },
  progressEmpty: { backgroundColor: 'rgba(255,255,255,0.2)' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  adBadge: {
    backgroundColor: C.gold,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countdownPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  skipBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  skipText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },

  // Rodapé
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  adInfo: { gap: 3 },
  adTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  adDesc:  { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rewardBadge: { alignItems: 'flex-start' },
  rewardCoins: { color: C.gold, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  rewardLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.gold,
    borderRadius: 99,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  ctaArrow:   { color: '#fff', fontSize: 16, fontWeight: '900' },

  // Pausa

  // Resultado
  resultEmoji: { fontSize: 72, lineHeight: 86 },
  resultTitle: { color: C.gold, fontSize: 32, fontWeight: '900', lineHeight: 42, textAlign: 'center' },
  resultSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' },
  doneBtn: {
    backgroundColor: C.gold,
    borderRadius: 99,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
