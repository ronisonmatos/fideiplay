import { useCallback, useState } from 'react';
import { Alert, Share } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { criarConvite } from '@/lib/convites';

export function useConvite() {
  const { user } = useAuth();
  const [gerando, setGerando] = useState(false);

  const gerarLinkConvite = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    setGerando(true);
    try {
      return await criarConvite(user.id);
    } finally {
      setGerando(false);
    }
  }, [user?.id]);

  const compartilharConvite = useCallback(async (link: string): Promise<void> => {
    try {
      await Share.share({
        message:
          'Venha aprender a fé católica jogando comigo no SantosPlay! 🙏✝️\n\n' +
          'Pra resgatar seu bônus de boas-vindas:\n' +
          '1️⃣ Baixe o app SantosPlay na loja do seu celular\n' +
          '2️⃣ Depois, abra este link pra confirmar o convite:\n' +
          link,
      });
    } catch { /* usuário cancelou o compartilhamento — nada a fazer */ }
  }, []);

  // Fluxo completo: gera o link (avisa se atingiu o limite) e já abre o compartilhamento nativo.
  const convidarAmigo = useCallback(async (): Promise<void> => {
    const link = await gerarLinkConvite();
    if (!link) {
      Alert.alert('Limite atingido', 'Você já usou todos os seus convites disponíveis.');
      return;
    }
    await compartilharConvite(link);
  }, [gerarLinkConvite, compartilharConvite]);

  return { gerarLinkConvite, compartilharConvite, convidarAmigo, gerando };
}
