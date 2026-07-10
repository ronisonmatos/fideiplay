/// <reference types="jest" />
import { contemPalavraProibida, normalizar } from '@/lib/chat-filtro';

describe('normalizar', () => {
  it('remove acentos e coloca em minúsculas', () => {
    expect(normalizar('ESTÚPIDO')).toBe('estupido');
  });

  it('colapsa letras repetidas em sequência para no máximo duas', () => {
    expect(normalizar('idiotaaaaa')).toBe('idiotaa');
  });

  it('remove acentos também em texto sem termos proibidos', () => {
    expect(normalizar('Deus é bom')).toBe('deus e bom');
  });
});

describe('contemPalavraProibida', () => {
  it('detecta termo proibido em texto simples', () => {
    expect(contemPalavraProibida('você é um idiota')).toBe(true);
  });

  it('detecta termo proibido com acentuação e caixa diferentes', () => {
    expect(contemPalavraProibida('ESTÚPIDO demais')).toBe(true);
  });

  it('detecta termo proibido mesmo com letras repetidas (evasão comum)', () => {
    expect(contemPalavraProibida('seu burrrrooo')).toBe(true);
  });

  it('não sinaliza falso positivo em texto sem relação com os termos', () => {
    expect(contemPalavraProibida('que dia lindo')).toBe(false);
  });

  it('retorna false para texto vazio', () => {
    expect(contemPalavraProibida('')).toBe(false);
  });

  it('retorna false para texto sem termos proibidos', () => {
    expect(contemPalavraProibida('vamos rezar juntos hoje')).toBe(false);
  });
});
