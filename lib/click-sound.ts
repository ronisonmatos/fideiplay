import { Audio } from 'expo-av';

// Clique usado nos botões principais dos jogos (iniciar, jogar novamente,
// avançar) — mesmo padrão de singleton lazy-load de lib/chat-sound.ts.
let _click: Audio.Sound | null = null;
let _clickLoading = false;

async function loadClick() {
  if (_click || _clickLoading) return;
  _clickLoading = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/assets/audio/mixkit-cool-interface-click-tone-2568.wav'),
      { shouldPlay: false, volume: 0.6 },
    );
    _click = sound;
  } catch {}
  _clickLoading = false;
}

export async function playClickSound(): Promise<void> {
  try {
    await loadClick();
    if (!_click) return;
    await _click.setPositionAsync(0);
    await _click.playAsync();
  } catch {}
}
