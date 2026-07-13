import AsyncStorage from '@react-native-async-storage/async-storage';

// Marca que o usuário já passou pelas telas de contexto de permissão
// (notificação + localização). O sufixo _v1 permite reexibir o onboarding no
// futuro sem colidir com a flag antiga, caso a gente adicione novas permissões.
export const ONBOARDING_PERMISSOES_KEY = '@santosplay:onboarding_permissoes_v1';

export async function isOnboardingPermissoesConcluido(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_PERMISSOES_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function marcarOnboardingPermissoesConcluido(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_PERMISSOES_KEY, 'true');
  } catch {
    /* best-effort — na pior das hipóteses o onboarding reaparece no próximo boot */
  }
}
