// Filtro client-side de palavras ofensivas no chat da Comunidade — só dá
// feedback imediato antes do round-trip; a fonte de verdade é o trigger
// Postgres `check_chat_banned_words` (supabase/migrations/add_chat_word_filter.sql),
// que lê de uma tabela e é resistente a um client modificado. Manter esta
// lista razoavelmente em sincronia com a tabela `chat_banned_words`, mas uma
// dessincronia é só degradação de UX, nunca risco de segurança.
const TERMOS_PROIBIDOS = ['idiota', 'burro', 'imbecil', 'estupido'];

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/(.)\1{2,}/g, '$1$1');
}

export function contemPalavraProibida(texto: string): boolean {
  const norm = normalizar(texto);
  return TERMOS_PROIBIDOS.some(t => norm.includes(t));
}
