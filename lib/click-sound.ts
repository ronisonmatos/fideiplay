import { Audio } from 'expo-av';

// Clique usado nos botões principais dos jogos (iniciar, jogar novamente,
// avançar) — mesmo padrão de singleton lazy-load de lib/chat-sound.ts.
let _click: Audio.Sound | null = null;
let _clickLoading: Promise<void> | null = null;

async function loadClick() {
  if (_click) return;
  if (!_clickLoading) {
    _clickLoading = (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
        const { sound } = await Audio.Sound.createAsync(
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('@/assets/audio/mixkit-cool-interface-click-tone-2568.wav'),
          { shouldPlay: false, volume: 0.6 },
        );
        _click = sound;
      } catch {}
    })();
  }
  await _clickLoading;
}

// Chamado uma vez na inicialização do app (ver app/_layout.tsx) pra evitar
// que o primeiro clique do usuário sofra o atraso de carregar o áudio.
export async function preloadClickSound(): Promise<void> {
  await loadClick();
}

export async function playClickSound(): Promise<void> {
  try {
    await loadClick();
    if (!_click) return;
    // replayAsync reseta a posição e dá play numa única chamada nativa — usar
    // setPositionAsync + playAsync em sequência (duas viagens à ponte nativa)
    // é o que causava o atraso perceptível a cada clique.
    await _click.replayAsync();
  } catch {}
}
