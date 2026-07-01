/**
 * Redistribui as respostas corretas das perguntas das trilhas.
 * Padrão por lição: Q1=posição 0, Q2=posição 2, Q3=posição 1
 * Faz o swap das opcoes para que a resposta correta fique na posição certa.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'data', 'trilhas.ts');

let content = readFileSync(filePath, 'utf8');

// Encontra blocos de perguntas: cada objeto { pergunta:..., opcoes:..., correta:..., explicacao:... }
// Estratégia: processa o texto linha a linha, identificando blocos de questão pelo padrão

// Regex para encontrar cada bloco de questão completo (multiline)
// Captura: o texto antes das opcoes, as 4 opcoes, o correta e a explicacao
const questionBlockRegex = /([ \t]+\{[\s\S]*?pergunta: ['"][\s\S]*?opcoes: \[)([\s\S]*?)(\],\s*\n[ \t]+correta: )(0)(,[\s\S]*?explicacao: ['"][\s\S]*?['"],?\s*\n[ \t]+\})/g;

let questionIndex = 0; // 0=Q1, 1=Q2, 2=Q3 (dentro de cada lição)

// Precisamos processar por lição. Vamos encontrar cada bloco 'perguntas: ['
// e dentro dele processar as 3 questões na ordem

// Abordagem: substituir cada ocorrência de bloco de questão completo
// mantendo controle do índice dentro de cada grupo de 3

const perguntasBlockRegex = /perguntas: \[([\s\S]*?)\],\s*\n(\s+xp:)/g;

content = content.replace(perguntasBlockRegex, (fullMatch, perguntasContent, xpPart) => {
  // Dentro de perguntasContent, encontrar os 3 objetos de questão
  let qIdx = 0;

  // Regex para um objeto de questão individual
  const singleQuestionRegex = /(\{[\s\S]*?pergunta: ['"][\s\S]*?opcoes: \[)([\s\S]*?)(\],\s*\n\s+correta: )(0)(,[\s\S]*?explicacao: ['"][\s\S]*?['"]\s*,?\s*\n\s+\})/g;

  const modifiedPerguntas = perguntasContent.replace(singleQuestionRegex, (qMatch, beforeOpcoes, opcoesCont, beforeCorreta, corretaVal, afterCorreta) => {
    const position = qIdx % 3; // 0=Q1, 1=Q2, 2=Q3
    qIdx++;

    if (position === 0) {
      // Q1: manter correta: 0
      return qMatch;
    }

    // Extrair as 4 opções — podem ser multilinha ou inline
    // Formato inline: 'opA', 'opB', 'opC', 'opD'
    // Formato multilinha:
    //   'opA',
    //   'opB',
    //   'opC',
    //   'opD',

    // Extrair todas as strings entre aspas simples ou duplas na lista de opções
    const optionMatches = [...opcoesCont.matchAll(/(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)];

    if (optionMatches.length !== 4) {
      // Não conseguiu parsear, retorna sem mudança
      return qMatch;
    }

    const opts = optionMatches.map(m => m[0]); // mantém as aspas originais
    const [a, b, c, d] = opts;

    if (position === 1) {
      // Q2: mover correto (índice 0) para índice 2
      // Nova ordem: [c, b, a, d], correta: 2
      let newOpcoesCont = opcoesCont;
      // Substituir cada opção pela nova ordem
      for (let i = 0; i < 4; i++) {
        newOpcoesCont = newOpcoesCont.replace(optionMatches[i][0], `__PLACEHOLDER_${i}__`);
      }
      newOpcoesCont = newOpcoesCont
        .replace('__PLACEHOLDER_0__', c)
        .replace('__PLACEHOLDER_1__', b)
        .replace('__PLACEHOLDER_2__', a)
        .replace('__PLACEHOLDER_3__', d);
      return `${beforeOpcoes}${newOpcoesCont}${beforeCorreta}2${afterCorreta}`;
    } else {
      // Q3: mover correto (índice 0) para índice 1
      // Nova ordem: [b, a, c, d], correta: 1
      let newOpcoesCont = opcoesCont;
      for (let i = 0; i < 4; i++) {
        newOpcoesCont = newOpcoesCont.replace(optionMatches[i][0], `__PLACEHOLDER_${i}__`);
      }
      newOpcoesCont = newOpcoesCont
        .replace('__PLACEHOLDER_0__', b)
        .replace('__PLACEHOLDER_1__', a)
        .replace('__PLACEHOLDER_2__', c)
        .replace('__PLACEHOLDER_3__', d);
      return `${beforeOpcoes}${newOpcoesCont}${beforeCorreta}1${afterCorreta}`;
    }
  });

  return `perguntas: [${modifiedPerguntas}],\n${xpPart}`;
});

writeFileSync(filePath, content, 'utf8');

// Verificar resultado
const resultContent = readFileSync(filePath, 'utf8');
const correta0Count = (resultContent.match(/correta: 0,/g) || []).length;
const correta1Count = (resultContent.match(/correta: 1,/g) || []).length;
const correta2Count = (resultContent.match(/correta: 2,/g) || []).length;
const correta3Count = (resultContent.match(/correta: 3,/g) || []).length;

console.log('Distribuição de respostas corretas:');
console.log(`  correta: 0 → ${correta0Count} questões`);
console.log(`  correta: 1 → ${correta1Count} questões`);
console.log(`  correta: 2 → ${correta2Count} questões`);
console.log(`  correta: 3 → ${correta3Count} questões`);
console.log(`  Total: ${correta0Count + correta1Count + correta2Count + correta3Count} questões`);
