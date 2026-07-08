export type AlcanceEvento = 'cidade' | 'estado' | 'nacional';
export type PeriodoEvento = number;

export const ALCANCE_LABELS: Record<AlcanceEvento, string> = {
  cidade:   'Minha cidade',
  estado:   'Meu estado',
  nacional: 'Todo o Brasil',
};

// Preço cheio por dia (período de 7 a 14 dias)
export const PRECO_POR_DIA: Record<AlcanceEvento, number> = {
  cidade:   2.90,
  estado:   5.90,
  nacional: 11.90,
};

export const PERIODO_MIN = 7;
export const PERIODO_MAX = 60;

// Faixas de desconto: quanto mais dias, menor o valor por dia
const FAIXAS_DESCONTO = [
  { min: 30, desconto: 0.20 },
  { min: 15, desconto: 0.10 },
  { min: PERIODO_MIN, desconto: 0 },
] as const;

export function descontoPorPeriodo(dias: number): number {
  return FAIXAS_DESCONTO.find(f => dias >= f.min)?.desconto ?? 0;
}

export function calcularValorEvento(alcance: AlcanceEvento, dias: number): number {
  const fator = 1 - descontoPorPeriodo(dias);
  return Math.round(PRECO_POR_DIA[alcance] * dias * fator * 100) / 100;
}
