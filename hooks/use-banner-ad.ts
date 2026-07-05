import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchActiveBannerAds, fetchBannerAtivo, type BannerAd } from '@/lib/banner-ads';

const LAST_AD_KEY = '@santosplay:ultimo_anuncio_id';

export function useBannerAd(): BannerAd | null {
  const [ad, setAd] = useState<BannerAd | null>(null);
  const adsRef = useRef<BannerAd[]>([]);

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
      adsRef.current = await fetchActiveBannerAds();
      await pickNext();
    } catch {
      setAd(null);
    }
  }, [pickNext]);

  useEffect(() => {
    load();
  }, [load]);

  // Só troca quando o app volta do background — nunca enquanto está em uso
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

  return ad;
}
