export const PRECOS_EVENTOS = {
  cidade: {
    7:  19.90,
    15: 29.90,
  },
  estado: {
    7:  39.90,
    15: 59.90,
  },
  nacional: {
    7:  79.90,
    15: 119.90,
  },
} as const;

export type AlcanceEvento = keyof typeof PRECOS_EVENTOS;
export type PeriodoEvento = keyof typeof PRECOS_EVENTOS['cidade'];

export const ALCANCE_LABELS: Record<AlcanceEvento, string> = {
  cidade:   'Minha cidade',
  estado:   'Meu estado',
  nacional: 'Todo o Brasil',
};

export const PERIODOS: PeriodoEvento[] = [7, 15];
