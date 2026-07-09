// Wrapper isolando expo-iap do resto do app — se durante o teste real em
// dispositivo aparecer alguma incompatibilidade, a troca de biblioteca
// (ex. para react-native-iap) fica localizada só aqui.
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Product,
  type Purchase,
} from 'expo-iap';

// expo-iap exporta dois tipos `PurchaseError` diferentes (um em types.ts,
// outro em utils/errorMapping.ts usado de fato por purchaseErrorListener) —
// extrai o tipo certo direto da assinatura da função em vez de importar
// o nome ambíguo.
type PurchaseErrorListenerParam = Parameters<typeof purchaseErrorListener>[0];
type PurchaseError = Parameters<PurchaseErrorListenerParam>[0];

export async function iniciarConexaoIAP(): Promise<void> {
  await initConnection();
}

export async function encerrarConexaoIAP(): Promise<void> {
  await endConnection();
}

export async function buscarProdutoIAP(productId: string): Promise<Product | null> {
  const produtos = await fetchProducts({ skus: [productId], type: 'in-app' });
  return (produtos?.[0] as Product | undefined) ?? null;
}

// O resultado da compra chega pelos listeners, não pelo retorno de
// requestPurchase (é uma API orientada a evento) — ouvirCompras registra os
// dois listeners e devolve uma função de cleanup única.
export function ouvirCompras(
  onSuccess: (purchase: Purchase) => void,
  onError: (error: PurchaseError) => void,
): () => void {
  const subSuccess = purchaseUpdatedListener(onSuccess);
  const subError = purchaseErrorListener(onError);
  return () => { subSuccess.remove(); subError.remove(); };
}

export async function comprarProdutoIAP(productId: string): Promise<void> {
  await requestPurchase({ request: { apple: { sku: productId } }, type: 'in-app' });
}

// Chamar só depois que o backend confirmar a compra (verify-apple-iap) —
// remove a transação da fila do StoreKit.
export async function finalizarCompraIAP(purchase: Purchase): Promise<void> {
  await finishTransaction({ purchase, isConsumable: false });
}

// Exigência da Apple para non-consumables: usuário precisa conseguir
// recuperar uma compra feita antes (reinstall, troca de aparelho).
export async function restaurarComprasApple(): Promise<Purchase[]> {
  await restorePurchases();
  return (await getAvailablePurchases()) as Purchase[];
}
