jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '@/lib/supabase';
import { validateWithBank } from '@/lib/stop-bank';
import type { StopCategory } from '@/constants/stop-categories';

const mockFrom = supabase.from as jest.Mock;

const cat = (key: string): StopCategory => ({ key, label: key, emoji: '', validLetters: [] });

function mockBankRows(rows: { category: string; word: string }[]) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        in: () => Promise.resolve({ data: rows }),
      }),
    }),
  });
}

describe('validateWithBank', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('retorna objeto vazio quando não há categorias', async () => {
    const result = await validateWithBank('S', { santo: 'Silvestre' }, []);
    expect(result).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('marca como invalid quando a resposta está vazia', async () => {
    mockBankRows([]);
    const result = await validateWithBank('S', { santo: '' }, [cat('santo')]);
    expect(result).toEqual({ santo: 'invalid' });
  });

  it('marca como invalid quando a resposta não começa com a letra sorteada', async () => {
    mockBankRows([]);
    const result = await validateWithBank('S', { santo: 'Ana' }, [cat('santo')]);
    expect(result).toEqual({ santo: 'invalid' });
  });

  it('marca como valid quando a resposta está no banco (ignorando acento/caixa)', async () => {
    mockBankRows([{ category: 'santo', word: 'São Paulo' }]);
    const result = await validateWithBank('S', { santo: '  sao PAULO  ' }, [cat('santo')]);
    expect(result).toEqual({ santo: 'valid' });
  });

  it('marca como unverified quando começa com a letra certa mas não está no banco', async () => {
    mockBankRows([{ category: 'santo', word: 'São Paulo' }]);
    const result = await validateWithBank('S', { santo: 'Silvestre' }, [cat('santo')]);
    expect(result).toEqual({ santo: 'unverified' });
  });

  it('valida múltiplas categorias independentemente', async () => {
    mockBankRows([
      { category: 'santo', word: 'Silvestre' },
      { category: 'pecado', word: 'Soberba' },
    ]);
    const result = await validateWithBank(
      'S',
      { santo: 'Silvestre', pecado: '', atributo_deus: 'Amor' },
      [cat('santo'), cat('pecado'), cat('atributo_deus')],
    );
    expect(result).toEqual({ santo: 'valid', pecado: 'invalid', atributo_deus: 'invalid' });
  });
});
