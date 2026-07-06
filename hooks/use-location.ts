import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = '@santosplay:localizacao';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface LocalizacaoInfo {
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
  fonte: 'gps' | 'perfil' | 'cache';
}

interface LocalizacaoCache extends Omit<LocalizacaoInfo, 'fonte'> {
  salvoEm: number;
}

export function useLocalizacao() {
  const { profile, isGuest, refreshProfile } = useAuth();
  const [localizacao, setLocalizacao] = useState<LocalizacaoInfo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const jaCarregouRef = useRef(false);

  const fromPerfil = useCallback((): LocalizacaoInfo | null => {
    if (!profile?.cidade && !profile?.estado) return null;
    return {
      cidade: profile.cidade ?? null,
      estado: profile.estado ?? null,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      fonte: 'perfil',
    };
  }, [profile]);

  const salvarCache = useCallback(async (info: LocalizacaoInfo) => {
    try {
      const cache: LocalizacaoCache = {
        cidade: info.cidade,
        estado: info.estado,
        latitude: info.latitude,
        longitude: info.longitude,
        salvoEm: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { /* best-effort */ }
  }, []);

  const buscarViaGps = useCallback(async (): Promise<LocalizacaoInfo | null> => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted) return null;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [endereco] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const info: LocalizacaoInfo = {
        cidade: endereco?.city?.toUpperCase() ?? null,
        estado: endereco?.region?.toUpperCase() ?? null,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        fonte: 'gps',
      };

      if (!isGuest && profile?.id) {
        try {
          await supabase
            .from('profiles')
            .update({
              cidade: info.cidade,
              estado: info.estado,
              latitude: info.latitude,
              longitude: info.longitude,
              localizacao_atualizada_em: new Date().toISOString(),
            })
            .eq('id', profile.id);
          refreshProfile().catch(() => {});
        } catch { /* best-effort — cache local ainda funciona sem isso */ }
      }

      return info;
    } catch {
      return null;
    }
  }, [isGuest, profile?.id, refreshProfile]);

  const carregar = useCallback(async (forcar: boolean) => {
    setCarregando(true);
    try {
      if (!forcar) {
        try {
          const raw = await AsyncStorage.getItem(CACHE_KEY);
          if (raw) {
            const cache = JSON.parse(raw) as LocalizacaoCache;
            if (Date.now() - cache.salvoEm < CACHE_TTL_MS) {
              setLocalizacao({ ...cache, fonte: 'cache' });
              return;
            }
          }
        } catch { /* cache corrompido — segue pro GPS */ }
      }

      const viaGps = await buscarViaGps();
      if (viaGps) {
        setLocalizacao(viaGps);
        await salvarCache(viaGps);
        return;
      }

      setLocalizacao(fromPerfil());
    } finally {
      setCarregando(false);
    }
  }, [buscarViaGps, fromPerfil, salvarCache]);

  // Roda uma vez em background — nunca bloqueia a tela esperando o GPS.
  useEffect(() => {
    if (jaCarregouRef.current) return;
    jaCarregouRef.current = true;
    carregar(false).catch(() => {});
  }, [carregar]);

  const solicitarPermissao = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (granted) await carregar(true);
      return granted;
    } catch {
      return false;
    }
  }, [carregar]);

  const atualizarLocalizacao = useCallback(() => carregar(true), [carregar]);

  const limparLocalizacao = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch { /* best-effort */ }
    if (!isGuest && profile?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ cidade: null, estado: null, latitude: null, longitude: null, localizacao_atualizada_em: null })
          .eq('id', profile.id);
        refreshProfile().catch(() => {});
      } catch { /* best-effort */ }
    }
    setLocalizacao(null);
  }, [isGuest, profile?.id, refreshProfile]);

  return { localizacao, carregando, solicitarPermissao, atualizarLocalizacao, limparLocalizacao };
}
