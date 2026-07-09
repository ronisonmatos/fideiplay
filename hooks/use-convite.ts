import { useCallback, useState } from 'react';
import { Alert, Share } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { criarConvite, type ConviteGerado } from '@/lib/convites';

export function useConvite() {
  const { user } = useAuth();
  const [gerando, setGerando] = useState(false);

  const gerarLinkConvite = useCallback(async (): Promise<ConviteGerado | null> => {
    if (!user?.id) return null;
    setGerando(true);
    try {
      return await criarConvite(user.id);
    } finally {
      setGerando(false);
    }
  }, [user?.id]);

  // Manda as duas formas de convite: o link (abre o app se instalado, senão
  // cai na loja) e o código puro (o amigo pode digitar em "Tenho um código
  // de convite" dentro do app, caso o link falhe por qualquer motivo).
  const compartilharConvite = useCallback(async ({ codigo, link }: ConviteGerado): Promise<void> => {
    try {
      await Share.share({
        message:
          'Venha aprender a fé católica jogando comigo no SantosPlay! 🙏✝️\n\n' +
          'Pra resgatar seu bônus de boas-vindas:\n' +
          '1️⃣ Baixe o app SantosPlay na loja do seu celular\n' +
          '2️⃣ Abra este link pra confirmar o convite:\n' +
          link + '\n\n' +
          'Se o link não abrir, dentro do app vá em Configurações > "Tenho um código de convite" ' +
          `e digite: ${codigo}`,
      });
    } catch { /* usuário cancelou o compartilhamento — nada a fazer */ }
  }, []);

  // Fluxo completo: gera o link (avisa se atingiu o limite) e já abre o compartilhamento nativo.
  const convidarAmigo = useCallback(async (): Promise<void> => {
    const convite = await gerarLinkConvite();
    if (!convite) {
      Alert.alert('Limite atingido', 'Você já usou todos os seus convites disponíveis.');
      return;
    }
    await compartilharConvite(convite);
  }, [gerarLinkConvite, compartilharConvite]);

  return { gerarLinkConvite, compartilharConvite, convidarAmigo, gerando };
}
