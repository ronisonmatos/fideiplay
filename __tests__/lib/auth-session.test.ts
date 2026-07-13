import { recoverSessionWithRetry, type AuthClientLike } from '@/lib/auth-session';
import type { Session } from '@supabase/supabase-js';

const fakeSession = { access_token: 'tok', user: { id: 'user-1' } } as unknown as Session;

// sleep instantâneo pros testes não esperarem o backoff real
const noSleep = jest.fn(async () => {});

function makeAuth(overrides: Partial<AuthClientLike> = {}): AuthClientLike {
  return {
    getSession: jest.fn(async () => ({ data: { session: null } })),
    refreshSession: jest.fn(async () => ({ data: { session: null }, error: null })),
    ...overrides,
  };
}

beforeEach(() => {
  noSleep.mockClear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  (console.warn as jest.Mock).mockRestore();
});

describe('recoverSessionWithRetry', () => {
  it('retorna a sessão direto quando getSession já tem uma válida', async () => {
    const auth = makeAuth({ getSession: jest.fn(async () => ({ data: { session: fakeSession } })) });
    const result = await recoverSessionWithRetry(auth, { sleep: noSleep });
    expect(result).toBe(fakeSession);
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(noSleep).not.toHaveBeenCalled();
  });

  it('recupera via refreshSession quando getSession vem vazia', async () => {
    const auth = makeAuth({
      refreshSession: jest.fn(async () => ({ data: { session: fakeSession }, error: null })),
    });
    const result = await recoverSessionWithRetry(auth, { sleep: noSleep });
    expect(result).toBe(fakeSession);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('insiste após falhas transitórias de rede e recupera com backoff crescente', async () => {
    const refreshSession = jest.fn()
      .mockResolvedValueOnce({ data: { session: null }, error: { message: 'Network request failed' } })
      .mockResolvedValueOnce({ data: { session: null }, error: { message: 'Network request failed' } })
      .mockResolvedValueOnce({ data: { session: fakeSession }, error: null });
    const auth = makeAuth({ refreshSession });

    const result = await recoverSessionWithRetry(auth, { sleep: noSleep, baseDelayMs: 1500 });

    expect(result).toBe(fakeSession);
    expect(refreshSession).toHaveBeenCalledTimes(3);
    // Backoff cresce: 1500ms depois da 1ª falha, 3000ms depois da 2ª
    expect(noSleep).toHaveBeenNthCalledWith(1, 1500);
    expect(noSleep).toHaveBeenNthCalledWith(2, 3000);
  });

  it('desiste imediatamente quando o refresh token é inválido (logout real)', async () => {
    const auth = makeAuth({
      refreshSession: jest.fn(async () => ({
        data: { session: null },
        error: { message: 'Invalid Refresh Token: Refresh Token Not Found' },
      })),
    });
    const result = await recoverSessionWithRetry(auth, { sleep: noSleep });
    expect(result).toBeNull();
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(noSleep).not.toHaveBeenCalled();
  });

  it('desiste imediatamente para visitante sem sessão armazenada', async () => {
    const auth = makeAuth({
      refreshSession: jest.fn(async () => ({
        data: { session: null },
        error: { message: 'Auth session missing!' },
      })),
    });
    const result = await recoverSessionWithRetry(auth, { sleep: noSleep });
    expect(result).toBeNull();
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(noSleep).not.toHaveBeenCalled();
  });

  it('retorna null após esgotar as tentativas com falha persistente', async () => {
    const auth = makeAuth({
      refreshSession: jest.fn(async () => ({
        data: { session: null },
        error: { message: 'Network request failed' },
      })),
    });
    const result = await recoverSessionWithRetry(auth, { attempts: 4, sleep: noSleep });
    expect(result).toBeNull();
    expect(auth.refreshSession).toHaveBeenCalledTimes(4);
    // Não dorme depois da última tentativa
    expect(noSleep).toHaveBeenCalledTimes(3);
  });

  it('recupera se a sessão reaparecer no getSession de uma tentativa seguinte', async () => {
    const getSession = jest.fn()
      .mockResolvedValueOnce({ data: { session: null } })
      .mockResolvedValueOnce({ data: { session: fakeSession } });
    const refreshSession = jest.fn(async () => ({
      data: { session: null },
      error: { message: 'Network request failed' },
    }));
    const auth = makeAuth({ getSession, refreshSession });

    const result = await recoverSessionWithRetry(auth, { sleep: noSleep });
    expect(result).toBe(fakeSession);
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });
});
