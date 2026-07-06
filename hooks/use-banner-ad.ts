import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchActiveBannerAds, fetchBannerAtivo, type BannerAd } from '@/lib/banner-ads';
import { useLocalizacao } from '@/hooks/use-location';

const LAST_AD_KEY = '@santosplay:ultimo_anuncio_id';

export function useBannerAd(): BannerAd | null {
  const [ad, setAd] = useState<BannerAd | null>(null);
  const adsRef = useRef<BannerAd[]>([]);
  const { localizacao } = useLocalizacao();

  const pickNext = useCallback(async () => {
    const ads = adsRef.current;
    if (ads.length === 0) {
      setAd(null);
      return;
    }
    if (ads.length === 1) {
      setAd(ads[0]);
      return;
    }

    let lastId: string | null = null;
    try {
      lastId = await AsyncStorage.getItem(LAST_AD_KEY);
    } catch { /* segue sem histórico */ }

    const lastIndex = ads.findIndex(a => a.id === lastId);
    const next = ads[(lastIndex + 1) % ads.length];
    setAd(next);
    try {
      await AsyncStorage.setItem(LAST_AD_KEY, next.id);
    } catch { /* best-effort */ }
  }, []);

  const load = useCallback(async () => {
    try {
      const ativo = await fetchBannerAtivo();
      if (!ativo) {
        adsRef.current = [];
        setAd(null);
        return;
      }
      adsRef.current = await fetchActiveBannerAds({
        estado: localizacao?.estado ?? null,
        cidade: localizacao?.cidade ?? null,
      });
      await pickNext();
    } catch {
      setAd(null);
    }
  }, [pickNext, localizacao]);

  // Troca o anúncio toda vez que a tela recebe foco (nunca duas vezes seguidas o mesmo)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return ad;
}
