// dev-only: valida que os níveis de constants/latim-boggle-levels.ts (incluindo
// níveis de exemplo colados aqui para testar um pack antes de inserir no banco)
// conseguem gerar uma grade válida via lib/word-grid.ts — a mesma função usada
// em tempo real pelo app. Rodar após editar níveis ou montar um pack novo:
//   node scripts/verify-latim-boggle.js
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const Module = require('module');

function loadTsModule(relativePath) {
  const srcPath = path.join(__dirname, '..', relativePath);
  const source = fs.readFileSync(srcPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  });
  const mod = new Module(srcPath);
  mod.filename = srcPath;
  mod.paths = Module._nodeModulePaths(path.dirname(srcPath));
  mod._compile(outputText, srcPath);
  return mod.exports;
}

const { LATIM_BOGGLE_LEVELS } = loadTsModule('constants/latim-boggle-levels.ts');
const { placeWordsAsRows } = loadTsModule('lib/word-grid.ts');

let ok = true;
for (const level of LATIM_BOGGLE_LEVELS) {
  const words = level.words.map(w => w.word);
  const longest = Math.max(...words.map(w => w.length));
  if (longest > level.gridSize) {
    console.error(`[${level.id}] palavra de ${longest} letras não cabe numa grade ${level.gridSize}x${level.gridSize}`);
    ok = false;
    continue;
  }
  const rows = placeWordsAsRows(words, level.gridSize, 30);
  if (!rows) {
    console.error(`[${level.id}] não foi possível posicionar [${words.join(', ')}] numa grade ${level.gridSize}x${level.gridSize} em 30 tentativas`);
    ok = false;
  }
}

if (ok) {
  console.log(`OK — ${LATIM_BOGGLE_LEVELS.length} níveis, todas as palavras couberam e geraram grade válida.`);
} else {
  console.log('Existem problemas acima — ajuste as palavras/gridSize antes de usar em produção.');
  process.exitCode = 1;
}
