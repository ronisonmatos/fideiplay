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

export function isMinor(birthDateISO: string | null | undefined): boolean {
  if (!birthDateISO) return false;
  const age = calcAgeFromISO(birthDateISO);
  return age >= 0 && age < 18;
}
