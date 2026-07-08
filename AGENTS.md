# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Tornar um usuário admin

O acesso admin (aba Admin, painel de banners, RLS) é controlado pela coluna `profiles.is_admin`.
Para promover um usuário, rode no SQL Editor do Supabase:

```sql
UPDATE profiles SET is_admin = true WHERE id = 'uuid-do-usuario';
```

# Eventos patrocinados por usuários

Usuários pagam para divulgar um evento próprio (retiro, missa, encontro) no
mesmo banner do feed (`components/banner-ad.tsx`, badge verde "EVENTO"),
passando por aprovação do admin. Migration: `supabase/migrations/add_eventos_patrocinados.sql`.

**Fluxo de status** (coluna `eventos_patrocinados.status`):

`aguardando_pagamento` → `aguardando_aprovacao` → `aprovado` → `ativo` → `encerrado`
(ou `rejeitado`, com reembolso automático, em qualquer ponto após o pagamento).

- **Criação** (`app/evento-patrocinado.tsx`, wizard de 3 etapas): a linha é criada em
  `aguardando_pagamento` *antes* de chamar `create-payment` — precisa existir um
  `evento_id` para vincular ao pagamento. Se o usuário abandonar antes de pagar, a
  linha fica órfã nesse status (sem limpeza automática).
- **Pagamento**: `create-payment`/`check-payment` (Edge Functions) foram generalizadas
  para aceitar `tipo: 'trilha' | 'evento'` (default `'trilha'`, 100% retrocompatível
  com a compra de trilhas) + `evento_id`. Quando o pagamento do evento é aprovado,
  o próprio `check-payment` sobe o status para `aguardando_aprovacao`, grava
  `valor_pago`/`payment_id` e notifica todos os admins.
- **Aprovação/rejeição** (`app/(tabs)/admin.tsx`, aba "Eventos"): aprovar seta
  `status='aprovado'`, `aprovado_por`, `aprovado_em` e calcula a **janela de exibição**
  (`exibicao_inicio = hoje`, `exibicao_fim = hoje + periodo` dias — independente das
  datas reais do evento, `data_inicio`/`data_fim`, escolhidas pelo usuário na etapa 1).
  Rejeitar abre um modal pedindo o motivo (obrigatório) e chama a Edge Function
  `reembolsar-evento`, que estorna via Mercado Pago, marca `status='rejeitado'` e
  notifica o usuário — se o reembolso falhar, grava `erro_reembolso` e avisa os admins,
  sem travar a rejeição.
- **Exibição no banner**: `lib/banner-ads.ts` mescla `banner_ads` (cadastro manual do
  admin) com `eventos_patrocinados` cujo `status IN ('aprovado','ativo')` e cuja janela
  `exibicao_inicio/exibicao_fim` cobre hoje — mesmo padrão de filtro por data já usado
  pelo banner. Impressões/cliques chamam `increment_evento_impressao/clique` (em vez
  de `increment_banner_impressao/clique`) via o campo `origem` do item.
- **Transição diária** (cron `atualizar-eventos-patrocinados`, 6h UTC): promove
  `aprovado → ativo` quando `exibicao_inicio` chega, `(aprovado|ativo) → encerrado`
  quando `exibicao_fim` passa, e agenda o aviso "encerra amanhã" (uma vez só, via
  `notificado_encerramento`).
- **Liga/desliga**: `app_config.eventos_patrocinados_ativo` (`'true'`/`'false'`,
  toggle na aba Config do admin). Quando desligado, o botão "🎪 Divulgar meu evento"
  some completamente das telas Trilhas e Conta (sem "Em breve").
- **Telas do usuário**: `app/evento-patrocinado.tsx` (criar) e `app/meus-eventos.tsx`
  (acompanhar status, impressões e cliques dos próprios eventos).
