export interface Tema {
  id:     string;
  label:  string;
  icone:  string;
}

export const TEMAS: Tema[] = [
  { id: 'teologia', label: 'Teologia',          icone: '🎓' },
  { id: 'liturgia', label: 'Liturgia',           icone: '⛪' },
  { id: 'biblia',   label: 'Bíblia Sagrada',     icone: '📖' },
  { id: 'historia', label: 'História da Igreja', icone: '📜' },
  { id: 'moral',    label: 'Teologia Moral',     icone: '⚖️' },
  { id: 'santos',   label: 'Santos',             icone: '✝️' },
];

export interface NivelGeral {
  id:    string;
  label: string;
  min:   number;
  max:   number;
  cor:   string;
}

export const NIVEIS: NivelGeral[] = [
  { id: 'iniciante',     label: 'Católico Iniciante',     min: 0,  max: 39,  cor: '#E24B4A' },
  { id: 'basico',        label: 'Católico Básico',        min: 40, max: 54,  cor: '#EF9F27' },
  { id: 'intermediario', label: 'Católico Intermediário', min: 55, max: 74,  cor: '#534AB7' },
  { id: 'avancado',      label: 'Católico Avançado',      min: 75, max: 89,  cor: '#1D9E75' },
  { id: 'doutor',        label: 'Doutor da Fé',           min: 90, max: 100, cor: '#EF9F27' },
];

export interface NivelTema {
  label: string;
  min:   number;
  max:   number;
  cor:   string;
}

export const NIVEIS_TEMA: NivelTema[] = [
  { label: 'Iniciante', min: 0,  max: 49,  cor: '#E24B4A' },
  { label: 'Médio',     min: 50, max: 74,  cor: '#EF9F27' },
  { label: 'Avançado',  min: 75, max: 100, cor: '#1D9E75' },
];

export const QUESTOES_POR_TEMA = 5;
export const TOTAL_QUESTOES = 30;
export const TEMPO_POR_QUESTAO = 20;

export function nivelGeralPorMedia(mediaPct: number): NivelGeral {
  return NIVEIS.find(n => mediaPct >= n.min && mediaPct <= n.max) ?? NIVEIS[0];
}

export function nivelTemaPorPct(pct: number): NivelTema {
  return NIVEIS_TEMA.find(n => pct >= n.min && pct <= n.max) ?? NIVEIS_TEMA[0];
}

// Trilha gratuita sugerida como próximo passo quando um tema sai "Iniciante"
// no resultado — nem todo tema tem trilha dedicada gratuita hoje, então cai
// para a Catequese (id 1) como base geral.
export const TRILHA_SUGERIDA_POR_TEMA: Record<string, number> = {
  teologia: 1,
  liturgia: 2,
  biblia:   1,
  historia: 7,
  moral:    1,
  santos:   1,
};
