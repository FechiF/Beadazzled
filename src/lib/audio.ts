import { VoiceConfig, WORDS } from '@/src/config';

export function getAudioPath(voice: VoiceConfig['id'], word: string): string {
  return `/audio/${voice}/${word}.mp3`;
}

export function preloadVoiceAudio(voice: VoiceConfig): HTMLAudioElement[] {
  return WORDS.map((word: string) => {
    const audio = new Audio(getAudioPath(voice.id, word));

    audio.preload = 'auto';

    return audio;
  });
}

export function createAudio(
  voice: VoiceConfig['id'],
  word: string,
): HTMLAudioElement {
  const audio = new Audio(getAudioPath(voice, word));

  audio.preload = 'auto';

  return audio;
}

export function stopAudio(audio: HTMLAudioElement | null): void {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
