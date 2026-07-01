export const AVATAR_BASE_URL =
  'https://luvgzsvchwvuhlfmgmsq.supabase.co/storage/v1/object/public/Avatar_Santos/';

export const AVATARES_SANTOS = [
  { filename: 'Nossa_Senhora.png',               nome: 'Nossa Senhora' },
  { filename: 'Santa_Madre_Tereza_Caucutar.png', nome: 'Madre Teresa de Calcutá' },
  { filename: 'Santa_Terezinha.png',             nome: 'Santa Terezinha' },
  { filename: 'Sao_Bento.png',                   nome: 'São Bento' },
  { filename: 'Sao_FrassiscoAssis.png',          nome: 'São Francisco de Assis' },
  { filename: 'Sao_Joao_Batista.png',            nome: 'São João Batista' },
  { filename: 'Sao_Jose.png',                    nome: 'São José' },
  { filename: 'Sao_Joao_Paulo.png',              nome: 'São João Paulo II' },
  { filename: 'Sao_Carlos_A.png',                nome: 'São Carlos' },
  { filename: 'Joana_Darc.png',                  nome: "Joana D'Arc" },
] as const;

export type AvatarFilename = (typeof AVATARES_SANTOS)[number]['filename'];

export function getAvatarUrl(filename: string): string {
  return `${AVATAR_BASE_URL}${filename}`;
}

export function getAvatarNome(filename: string): string {
  return AVATARES_SANTOS.find(a => a.filename === filename)?.nome ?? '';
}

export function isSaintAvatar(value: string): boolean {
  return value.endsWith('.png');
}
