import { Audio } from 'expo-av';

let _chat: Audio.Sound | null = null;
let _chatLoading = false;

async function loadChat() {
  if (_chat || _chatLoading) return;
  _chatLoading = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/assets/audio/mixkit-positive-interface-beep-221.wav'),
      { shouldPlay: false, volume: 1 },
    );
    _chat = sound;
  } catch {}
  _chatLoading = false;
}

export async function playChatSound(): Promise<void> {
  try {
    await loadChat();
    if (!_chat) return;
    await _chat.setPositionAsync(0);
    await _chat.playAsync();
  } catch {}
}

let _system: Audio.Sound | null = null;
let _systemLoading = false;

async function loadSystem() {
  if (_system || _systemLoading) return;
  _systemLoading = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
    const { sound } = await Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/assets/audio/mixkit-church-bell-calling-603_EHLlPLOM.wav'),
      { shouldPlay: false, volume: 1 },
    );
    _system = sound;
  } catch {}
  _systemLoading = false;
}

export async function playSystemSound(): Promise<void> {
  try {
    await loadSystem();
    if (!_system) return;
    await _system.setPositionAsync(0);
    await _system.playAsync();
  } catch {}
}
