import { useEffect, useRef } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';
import { useBannerAd } from '@/hooks/use-banner-ad';
import { useTheme } from '@/hooks/use-theme';
import { registerBannerClique, registerBannerImpressao } from '@/lib/banner-ads';

export function BannerAd() {
  const ad = useBannerAd();
  const theme = useTheme();
  const impressedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ad || impressedIdRef.current === ad.id) return;
    impressedIdRef.current = ad.id;
    registerBannerImpressao(ad.id);
  }, [ad]);

  if (!ad) return null;

  const handlePress = () => {
    registerBannerClique(ad.id);
    if (ad.link) Linking.openURL(ad.link).catch(() => {});
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: C.purple + '66' }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
        {ad.imagem_url ? (
          <Image source={{ uri: ad.imagem_url }} style={styles.iconImg} resizeMode="cover" />
        ) : (
          <ThemedText style={styles.iconFallback}>✝️</ThemedText>
        )}
      </View>

      <View style={styles.info}>
        <ThemedText style={styles.label}>ANÚNCIO</ThemedText>
        <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{ad.titulo}</ThemedText>
        {!!ad.descricao && (
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>{ad.descricao}</ThemedText>
        )}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={0.8}>
        <ThemedText style={styles.btnText}>Saiba mais</ThemedText>
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
    marginHorizontal: 24,
    marginBottom: 12,
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
  info: { flex: 1, gap: 2 },
  label: { fontSize: 9, fontWeight: '800', color: C.gold, letterSpacing: 0.5 },
  title: { fontSize: 11, fontWeight: '700' },
  desc: { fontSize: 9 },
  btn: {
    backgroundColor: C.purple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: { fontSize: 9, fontWeight: '700', color: '#fff' },
});
