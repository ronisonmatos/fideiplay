jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

import { montarProvaAleatoria, type QuestaoTeste } from '@/lib/teste-conhecimento';
import { QUESTOES_POR_TEMA, TEMAS, TOTAL_QUESTOES } from '@/constants/teste-conhecimento';

let seq = 0;
function questao(tema: string, dificuldade: string, correta = 1): QuestaoTeste {
  seq += 1;
  return {
    id: `q${seq}`,
    tema,
    pergunta: `Pergunta ${seq} de ${tema}`,
    opcoes: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
    correta,
    explicacao: null,
    dificuldade,
  };
}

// Banco "cheio": 3 fáceis, 3 médias e 2 difíceis por tema — mais que o mix 2/2/1.
function bancoCompleto(): QuestaoTeste[] {
  const banco: QuestaoTeste[] = [];
  for (const tema of TEMAS) {
    for (let i = 0; i < 3; i++) banco.push(questao(tema.id, 'facil'));
    for (let i = 0; i < 3; i++) banco.push(questao(tema.id, 'medio'));
    for (let i = 0; i < 2; i++) banco.push(questao(tema.id, 'dificil'));
  }
  return banco;
}

describe('montarProvaAleatoria', () => {
  beforeEach(() => { seq = 0; });

  it('monta a prova completa quando o banco tem questões suficientes', () => {
    const prova = montarProvaAleatoria(bancoCompleto());
    expect(prova).toHaveLength(TOTAL_QUESTOES);
  });

  it('mantém as questões agrupadas em blocos por tema', () => {
    const prova = montarProvaAleatoria(bancoCompleto());
    for (let i = 0; i < prova.length; i += QUESTOES_POR_TEMA) {
      const bloco = prova.slice(i, i + QUESTOES_POR_TEMA);
      const temasDoBloco = new Set(bloco.map(q => q.tema));
      expect(temasDoBloco.size).toBe(1);
    }
  });

  it('cada bloco respeita o mix de dificuldade 2 fáceis / 2 médias / 1 difícil', () => {
    const prova = montarProvaAleatoria(bancoCompleto());
    for (let i = 0; i < prova.length; i += QUESTOES_POR_TEMA) {
      const bloco = prova.slice(i, i + QUESTOES_POR_TEMA);
      const porNivel = { facil: 0, medio: 0, dificil: 0 } as Record<string, number>;
      for (const q of bloco) porNivel[q.dificuldade] += 1;
      expect(porNivel.facil).toBe(2);
      expect(porNivel.medio).toBe(2);
      expect(porNivel.dificil).toBe(1);
    }
  });

  it('não repete a mesma questão na prova', () => {
    const prova = montarProvaAleatoria(bancoCompleto());
    const ids = prova.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('após o embaralhamento das alternativas, "correta" continua apontando para a resposta certa', () => {
    // No banco original, a correta é sempre a opção de índice 1 ('Opção B').
    const prova = montarProvaAleatoria(bancoCompleto());
    for (const q of prova) {
      expect(q.opcoes[q.correta]).toBe('Opção B');
      expect(q.opcoes).toHaveLength(4);
    }
  });

  it('completa o bloco com outras dificuldades quando falta o mix ideal', () => {
    // Tema só com questões fáceis: mesmo sem médias/difíceis, o bloco fecha em 5.
    const banco: QuestaoTeste[] = [];
    for (const tema of TEMAS) {
      for (let i = 0; i < 6; i++) banco.push(questao(tema.id, 'facil'));
    }
    const prova = montarProvaAleatoria(banco);
    expect(prova).toHaveLength(TOTAL_QUESTOES);
  });

  it('com banco menor que o bloco, devolve o que existe sem duplicar', () => {
    const banco: QuestaoTeste[] = [];
    for (const tema of TEMAS) {
      banco.push(questao(tema.id, 'facil'));
      banco.push(questao(tema.id, 'medio'));
    }
    const prova = montarProvaAleatoria(banco);
    expect(prova).toHaveLength(TEMAS.length * 2);
    expect(new Set(prova.map(q => q.id)).size).toBe(prova.length);
  });

  it('com banco vazio, devolve prova vazia sem quebrar', () => {
    expect(montarProvaAleatoria([])).toEqual([]);
  });
});
