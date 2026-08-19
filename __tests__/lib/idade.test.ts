/// <reference types="jest" />
import { calcAgeFromISO, isMinor } from '@/lib/idade';

// Data ISO (YYYY-MM-DD) deslocada em anos/dias a partir de hoje, para testar o
// cálculo de idade sem depender de datas fixas (não quebra com o passar do tempo).
function isoShift(years: number, days = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('calcAgeFromISO', () => {
  it('calcula a idade de quem nasceu há exatamente 25 anos', () => {
    expect(calcAgeFromISO(isoShift(25))).toBe(25);
  });

  it('ainda não conta o aniversário que só acontece amanhã', () => {
    expect(calcAgeFromISO(isoShift(18, 1))).toBe(17);
  });

  it('conta o ano quando o aniversário já passou', () => {
    expect(calcAgeFromISO(isoShift(18, -1))).toBe(18);
  });

  it('retorna -1 para data inválida', () => {
    expect(calcAgeFromISO('não-é-data')).toBe(-1);
  });
});

describe('isMinor', () => {
  // Regra da Política para Famílias: na dúvida, trata como menor e bloqueia o
  // chat público — nunca libera por engano.
  it('trata ausência de data de nascimento como menor (conservador)', () => {
    expect(isMinor(null)).toBe(true);
    expect(isMinor(undefined)).toBe(true);
    expect(isMinor('')).toBe(true);
  });

  it('trata data inválida como menor', () => {
    expect(isMinor('não-é-data')).toBe(true);
  });

  it('considera menor quem tem menos de 18 anos', () => {
    expect(isMinor(isoShift(13))).toBe(true);
    expect(isMinor(isoShift(17))).toBe(true);
    expect(isMinor(isoShift(18, 1))).toBe(true); // faz 18 só amanhã
  });

  it('considera adulto quem tem 18 anos ou mais', () => {
    expect(isMinor(isoShift(18, -1))).toBe(false); // fez 18 ontem
    expect(isMinor(isoShift(30))).toBe(false);
  });
});
