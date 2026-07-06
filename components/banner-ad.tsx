import { useEffect, useRef } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { C } from '@/constants/theme';
import { useBannerAd } from '@/hooks/use-banner-ad';
import { useTheme } from '@/hooks/use-theme';
import { registerBannerClique, registerBannerImpressao } from '@/lib/banner-ads';

const EVENTO_COR = 'rgba(29,158,117,0.35)';
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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

  const isEvento = ad.tipo === 'evento';

  const handlePress = () => {
    registerBannerClique(ad.id);
    if (ad.link) Linking.openURL(ad.link).catch(() => {});
  };

  let dia: string | null = null;
  let mes: string | null = null;
  if (isEvento && ad.data_evento) {
    const data = new Date(`${ad.data_evento}T00:00:00`);
    dia = String(data.getDate()).padStart(2, '0');
    mes = MESES[data.getMonth()];
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: isEvento ? EVENTO_COR : C.purple + '66' }]}>
      {isEvento && dia && mes ? (
        <View style={[styles.iconBox, styles.calendarBox, { backgroundColor: theme.backgroundSelected }]}>
          <View style={styles.calendarMonthBar}>
            <ThemedText style={styles.calendarMonthText}>{mes}</ThemedText>
          </View>
          <ThemedText style={[styles.calendarDayText, { color: C.green }]}>{dia}</ThemedText>
        </View>
      ) : (
        <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
          {ad.imagem_url ? (
            <Image source={{ uri: ad.imagem_url }} style={styles.iconImg} resizeMode="cover" />
          ) : (
            <ThemedText style={styles.iconFallback}>{isEvento ? '📅' : '✝️'}</ThemedText>
          )}
        </View>
      )}

      <View style={styles.info}>
        <ThemedText style={[styles.label, { color: isEvento ? C.green : C.gold }]}>
          {isEvento ? 'EVENTO' : 'ANÚNCIO'}
        </ThemedText>
        <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>{ad.titulo}</ThemedText>
        {isEvento && ad.local_evento ? (
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>{ad.local_evento}</ThemedText>
        ) : !isEvento && !!ad.descricao ? (
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>{ad.descricao}</ThemedText>
        ) : null}
      </View>

      <TouchableOpacity style={[styles.btn, isEvento && { backgroundColor: C.green }]} onPress={handlePress} activeOpacity={0.8}>
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
    backgroundColor: C.green,
    paddingVertical: 2,
    alignItems: 'center',
  },
  calendarMonthText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  calendarDayText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  info: { flex: 1, gap: 2 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
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
