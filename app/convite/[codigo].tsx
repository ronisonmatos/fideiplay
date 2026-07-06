import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { C, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { aplicarConvite, salvarConvitePendente } from '@/lib/convites';

type Status = 'processando' | 'sucesso' | 'erro' | 'precisa_login';

// Aberta via santosplay://convite/{codigo} (ou navegação interna) — só funciona
// quando o app já está instalado, seguindo o esquema customizado do app.json.
export default function ConviteScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const { user, loading, refreshProfile } = useAuth();
  const [status, setStatus] = useState<Status>('processando');

  useEffect(() => {
    if (loading || !codigo) return;

    (async () => {
      if (!user) {
        await salvarConvitePendente(codigo);
        setStatus('precisa_login');
        setTimeout(() => router.replace('/(auth)/register'), 1500);
        return;
      }

      const ok = await aplicarConvite(codigo, user.id);
      if (ok) {
        await refreshProfile();
        setStatus('sucesso');
      } else {
        setStatus('erro');
      }
      setTimeout(() => router.replace('/(tabs)'), 2000);
    })();
  }, [loading, user, codigo, refreshProfile]);

  const mensagem = {
    processando:  'Aplicando seu convite...',
    sucesso:      'Convite aplicado! Você ganhou moedas 🪙',
    erro:         'Esse convite já foi usado ou não é válido.',
    precisa_login: 'Crie sua conta para receber o bônus do convite!',
  }[status];

  const emoji = {
    processando:  '⏳',
    sucesso:      '🎉',
    erro:         '🤔',
    precisa_login: '🔐',
  }[status];

  return (
    <ThemedView style={s.fill}>
      {status === 'processando' && <ActivityIndicator size="large" color={C.purple} />}
      <ThemedText style={s.emoji}>{emoji}</ThemedText>
      <ThemedText type="subtitle" style={s.center}>{mensagem}</ThemedText>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  emoji: { fontSize: 40, lineHeight: 48 },
  center: { textAlign: 'center' },
});
