// Mapa trilhaId -> productId da Apple, fonte única no client. Os productIds
// precisam bater exatamente com os produtos non-consumable cadastrados no
// App Store Connect (ação manual, feita pelo usuário) e com o mapa
// duplicado em supabase/functions/verify-apple-iap/index.ts (a function
// roda em Deno isolado, não pode importar este arquivo).
export const TRILHA_PRODUCT_IDS: Record<number, string> = {
  4: 'trilha_liturgia_avancada',
  5: 'trilha_teologia_moral',
  8: 'trilha_sete_moradas_modulo1',
};

export function productIdDaTrilha(trilhaId: number): string | null {
  return TRILHA_PRODUCT_IDS[trilhaId] ?? null;
}

// Usado em "restaurar compras" — a Apple devolve productIds, não trilhaIds.
export function trilhaIdDoProduct(productId: string): number | null {
  const entry = Object.entries(TRILHA_PRODUCT_IDS).find(([, pid]) => pid === productId);
  return entry ? Number(entry[0]) : null;
}
