import { createClient } from 'npm:@supabase/supabase-js';
import {
  AppStoreServerAPIClient,
  APIException,
  Environment,
  SignedDataVerifier,
} from 'npm:@apple/app-store-server-library';
import { Buffer } from 'node:buffer';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Mesmo mapa de lib/iap-products.ts — duplicado pois a function roda em Deno
// isolado e não pode importar arquivos do app cliente. Preço aqui só é usado
// pra registrar o valor em `payments`; quem manda de fato é o preço
// configurado nos produtos non-consumable no App Store Connect.
const TRILHA_PRODUCT_IDS: Record<number, string> = {
  4: 'trilha_liturgia_avancada',
  5: 'trilha_teologia_moral',
  8: 'trilha_sete_moradas_modulo1',
};
const TRILHA_PRECO: Record<number, number> = { 4: 9.90, 5: 9.90, 8: 9.90 };

// Apple Root CA - G3 (DER, base64), baixado de
// https://www.apple.com/certificateauthority/AppleRootCA-G3.cer em 2026-07-09.
// SHA-256 fingerprint conferido contra o publicado pela Apple:
// 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79
const APPLE_ROOT_CA_G3_BASE64 =
  'MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM6BgD56KyKA==';

function rootCertBuffer(): Buffer {
  const bin = atob(APPLE_ROOT_CA_G3_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return Buffer.from(bytes);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token ?? '');
    if (authError || !user) return json({ error: 'Não autorizado' }, 401);

    const { transactionId, productId, trilhaId } = await req.json() as {
      transactionId: string;
      productId: string;
      trilhaId: number;
    };
    if (!transactionId || !productId || !trilhaId) return json({ error: 'Parâmetros inválidos' }, 400);
    if (TRILHA_PRODUCT_IDS[trilhaId] !== productId) return json({ error: 'productId não corresponde à trilha' }, 400);

    const privateKey = Deno.env.get('APPLE_IAP_PRIVATE_KEY')!;
    const keyId      = Deno.env.get('APPLE_IAP_KEY_ID')!;
    const issuerId   = Deno.env.get('APPLE_IAP_ISSUER_ID')!;
    const bundleId   = Deno.env.get('APPLE_BUNDLE_ID')!;

    // Tenta produção primeiro; compras feitas via sandbox tester/TestFlight
    // nunca existem no ambiente de produção da Apple, então um 404 ali cai
    // pra sandbox — mesmo padrão recomendado pela documentação da Apple.
    let signedTransactionInfo: string | undefined;
    let environment = Environment.PRODUCTION;
    try {
      const prodClient = new AppStoreServerAPIClient(privateKey, keyId, issuerId, bundleId, Environment.PRODUCTION);
      signedTransactionInfo = (await prodClient.getTransactionInfo(transactionId)).signedTransactionInfo;
    } catch (e) {
      if (e instanceof APIException && e.httpStatusCode === 404) {
        environment = Environment.SANDBOX;
        const sandboxClient = new AppStoreServerAPIClient(privateKey, keyId, issuerId, bundleId, Environment.SANDBOX);
        signedTransactionInfo = (await sandboxClient.getTransactionInfo(transactionId)).signedTransactionInfo;
      } else {
        throw e;
      }
    }
    if (!signedTransactionInfo) return json({ error: 'Transação não encontrada na Apple' }, 404);

    // SignedDataVerifier confere a assinatura JWS + a cadeia de certificados
    // (x5c) até o Apple Root CA G3, garantindo que o payload realmente veio
    // da Apple e não foi forjado por um client modificado.
    const verifier = new SignedDataVerifier([rootCertBuffer()], true, environment, bundleId);
    const payload = await verifier.verifyAndDecodeTransaction(signedTransactionInfo);

    if (payload.bundleId !== bundleId) return json({ error: 'bundleId não confere' }, 400);
    if (payload.productId !== productId) return json({ error: 'productId não confere' }, 400);
    if (payload.revocationDate) return json({ error: 'Transação revogada/reembolsada pela Apple' }, 400);

    // Idempotente: se já existe pagamento aprovado com esse transactionId
    // (nova tentativa de restore, ou o client chamou de novo por engano),
    // não duplica — só garante que user_trilhas está populado.
    const { data: existente } = await supabase
      .from('payments')
      .select('status')
      .eq('apple_transaction_id', transactionId)
      .maybeSingle();

    if (existente?.status !== 'approved') {
      await supabase.from('payments').upsert({
        user_id:              user.id,
        trilha_id:            trilhaId,
        tipo:                 'trilha',
        apple_transaction_id: transactionId,
        status:               'approved',
        method:               'apple_iap',
        amount:               TRILHA_PRECO[trilhaId] ?? 9.90,
      }, { onConflict: 'apple_transaction_id' });
    }

    await supabase.from('user_trilhas').upsert(
      { user_id: user.id, trilha_id: trilhaId, origem: 'apple_iap' },
      { onConflict: 'user_id,trilha_id' },
    );

    return json({ status: 'approved' });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
