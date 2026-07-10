jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { isContestable } from '@/lib/stop-contests';

describe('isContestable', () => {
  it('permite contestar resposta marcada como invalid', () => {
    expect(isContestable('invalid', 'Silvestre')).toBe(true);
  });

  it('permite contestar resposta marcada como ai_invalid', () => {
    expect(isContestable('ai_invalid', 'Silvestre')).toBe(true);
  });

  it('permite contestar resposta marcada como unverified', () => {
    expect(isContestable('unverified', 'Silvestre')).toBe(true);
  });

  it('não permite contestar resposta já validada (valid)', () => {
    expect(isContestable('valid', 'Silvestre')).toBe(false);
  });

  it('não permite contestar resposta já validada pela IA (ai_valid)', () => {
    expect(isContestable('ai_valid', 'Silvestre')).toBe(false);
  });

  it('não permite contestar quando a resposta está vazia', () => {
    expect(isContestable('invalid', '')).toBe(false);
    expect(isContestable('invalid', '   ')).toBe(false);
  });

  it('não permite contestar quando o resultado é undefined', () => {
    expect(isContestable(undefined, 'Silvestre')).toBe(false);
  });
});
