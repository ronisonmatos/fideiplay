// Idade calculada a partir de birth_date (coletado no cadastro para
// verificação LGPD) — reaproveitado para o gate de "recursos sociais" exigido
// pela Política para Famílias da Play Store (menor de 18 anos).
export function calcAgeFromISO(birthDateISO: string): number {
  const birth = new Date(birthDateISO);
  if (isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Considera menor de idade quem tem menos de 18 anos. Sem data de nascimento
// (ou data inválida) o retorno é `true` — interpretação conservadora exigida
// pela Política para Famílias: na dúvida, trata como menor e bloqueia o chat
// público, em vez de liberar por engano (ex.: conta de teste sem data).
export function isMinor(birthDateISO: string | null | undefined): boolean {
  if (!birthDateISO) return true;
  const age = calcAgeFromISO(birthDateISO);
  if (age < 0) return true;
  return age < 18;
}
