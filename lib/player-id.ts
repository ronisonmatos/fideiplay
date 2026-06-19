// ID único por sessão. Para persistência entre sessões, troque por AsyncStorage.
function genId() {
  const chars = 'ABCDEFGHJKLMNPRSTV0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export const PLAYER_ID = genId();
export const PLAYER_LABEL = `Jogador #${PLAYER_ID.slice(0, 4)}`;
