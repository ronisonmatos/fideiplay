import { Platform } from 'react-native';

// Pagamentos com dinheiro real (PIX, cartão, Apple IAP e a divulgação paga de
// eventos) ficam DESABILITADOS no iOS até:
//   1. a primeira aprovação do app na App Store; e
//   2. os produtos de compra estarem configurados/aprovados no App Store Connect.
//
// Enquanto isso, o iOS não expõe nenhum caminho de compra com dinheiro real —
// evita rejeição na revisão da Apple (Guideline 3.1.1). O desbloqueio de trilha
// por MOEDAS (ganhas jogando, sem dinheiro real) continua liberado nas duas
// plataformas.
//
// Para reativar no iOS depois, basta trocar esta linha por `true` (ou remover a
// checagem de plataforma).
export const PAGAMENTOS_REAIS_HABILITADOS = Platform.OS !== 'ios';
