import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ONBOARDING_PERMISSOES_KEY,
  isOnboardingPermissoesConcluido,
  marcarOnboardingPermissoesConcluido,
} from '@/lib/onboarding';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  getItem.mockReset();
  setItem.mockReset();
});

describe('isOnboardingPermissoesConcluido', () => {
  it('retorna true quando a flag está salva como "true"', async () => {
    getItem.mockResolvedValue('true');
    expect(await isOnboardingPermissoesConcluido()).toBe(true);
    expect(getItem).toHaveBeenCalledWith(ONBOARDING_PERMISSOES_KEY);
  });

  it('retorna false quando não há flag salva (instalação nova)', async () => {
    getItem.mockResolvedValue(null);
    expect(await isOnboardingPermissoesConcluido()).toBe(false);
  });

  it('retorna false para qualquer valor diferente de "true"', async () => {
    getItem.mockResolvedValue('false');
    expect(await isOnboardingPermissoesConcluido()).toBe(false);
  });

  it('não propaga erro do AsyncStorage — assume não concluído', async () => {
    getItem.mockRejectedValue(new Error('storage indisponível'));
    expect(await isOnboardingPermissoesConcluido()).toBe(false);
  });
});

describe('marcarOnboardingPermissoesConcluido', () => {
  it('grava a flag como "true" na chave correta', async () => {
    setItem.mockResolvedValue(undefined);
    await marcarOnboardingPermissoesConcluido();
    expect(setItem).toHaveBeenCalledWith(ONBOARDING_PERMISSOES_KEY, 'true');
  });

  it('não propaga erro do AsyncStorage', async () => {
    setItem.mockRejectedValue(new Error('storage cheio'));
    await expect(marcarOnboardingPermissoesConcluido()).resolves.toBeUndefined();
  });
});
