export type CategoriaEvento = 'retiro' | 'festa' | 'missa' | 'curso' | 'novena' | 'caravana' | 'outro';

export const CATEGORIAS_EVENTO: { value: CategoriaEvento; label: string }[] = [
  { value: 'retiro',   label: 'Retiro espiritual' },
  { value: 'festa',    label: 'Festa / celebração' },
  { value: 'missa',    label: 'Missa especial' },
  { value: 'curso',    label: 'Curso / formação' },
  { value: 'novena',   label: 'Novena / devoção' },
  { value: 'caravana', label: 'Caravana / excursão' },
  { value: 'outro',    label: 'Outro' },
];

interface CorCategoria {
  borda: string;
  fundo: string;
  texto: string;
  label: string;
}

export const CORES_CATEGORIA: Record<CategoriaEvento | 'comercial', CorCategoria> = {
  retiro:    { borda: 'rgba(83,74,183,0.5)',   fundo: 'rgba(83,74,183,0.12)',  texto: '#7F77DD', label: '#534AB7' },
  festa:     { borda: 'rgba(239,159,39,0.5)',  fundo: 'rgba(239,159,39,0.12)', texto: '#EF9F27', label: '#BA7517' },
  missa:     { borda: 'rgba(24,95,165,0.5)',   fundo: 'rgba(24,95,165,0.12)',  texto: '#378ADD', label: '#185FA5' },
  curso:     { borda: 'rgba(29,158,117,0.5)',  fundo: 'rgba(29,158,117,0.12)', texto: '#5DCAA5', label: '#1D9E75' },
  novena:    { borda: 'rgba(153,60,29,0.5)',   fundo: 'rgba(153,60,29,0.12)',  texto: '#F0997B', label: '#993C1D' },
  caravana:  { borda: 'rgba(0,150,136,0.5)',   fundo: 'rgba(0,150,136,0.12)',  texto: '#4DB6AC', label: '#00897B' },
  outro:     { borda: 'rgba(29,158,117,0.35)', fundo: 'rgba(29,158,117,0.08)', texto: '#5DCAA5', label: '#1D9E75' },
  // Tom âmbar (mesma cor do rótulo "ANÚNCIO" em app/ad-reward.tsx) — de propósito
  // diferente do resto do app (que usa roxo/fundo neutro), pra publicidade nunca
  // se confundir visualmente com o conteúdo do jogo (Requisitos de formato de
  // anúncios para famílias, Play Store).
  comercial: { borda: 'rgba(239,159,39,0.55)', fundo: 'rgba(239,159,39,0.14)', texto: '#EF9F27', label: '#EF9F27' },
};
