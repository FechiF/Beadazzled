'use client';

import type { VoiceId, Word } from '@/src/config';

type BufferKey = string;

function getAudioPath(voice: VoiceId, word: Word): string {
  return `/audio/${voice}/${word}.mp3`;
}

/**
 * Thin wrapper around a single shared AudioContext.
 *
 * Playback is scheduled with AudioBufferSourceNode, which is
 * NOT subject to the per-call autoplay-gesture restriction
 * that HTMLMediaElement.play() has. Only the context's
 * running state is gated by a gesture, and unlock() handles
 * that once, up front.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private buffers = new Map<BufferKey, AudioBuffer>();
  private pending = new Map<BufferKey, Promise<AudioBuffer>>();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      this.ctx = new AudioContextClass();
    }

    return this.ctx;
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /**
   * MUST be called synchronously from within a user gesture
   * handler (e.g. the Start button's onClick). Resumes the
   * context and, by starting a silent buffer, fully unlocks
   * it on iOS Safari as well.
   */
  async unlock(): Promise<void> {
    const ctx = this.getContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();

    source.buffer = silentBuffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private async loadBuffer(voice: VoiceId, word: Word): Promise<AudioBuffer> {
    const key = `${voice}/${word}`;

    const cached = this.buffers.get(key);
    if (cached) return cached;

    const pending = this.pending.get(key);
    if (pending) return pending;

    const promise = fetch(getAudioPath(voice, word))
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => this.getContext().decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        this.buffers.set(key, audioBuffer);
        this.pending.delete(key);
        return audioBuffer;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Fetching + decoding do NOT require a user gesture, so this
   * is safe to call from an effect on mount / voice change to
   * "warm up" playback before Start is pressed.
   */
  async preloadVoice(voice: VoiceId, words: readonly Word[]): Promise<void> {
    await Promise.all(words.map((word) => this.loadBuffer(voice, word)));
  }

  getBuffer(voice: VoiceId, word: Word): AudioBuffer | null {
    return this.buffers.get(`${voice}/${word}`) ?? null;
  }

  /**
   * Schedule a buffer to start at an absolute AudioContext
   * time. Returns the source node so the caller can stop it
   * early (e.g. on Reset).
   */
  schedule(
    buffer: AudioBuffer,
    when: number,
    onEnded?: () => void,
  ): AudioBufferSourceNode {
    const ctx = this.getContext();
    const source = ctx.createBufferSource();

    source.buffer = buffer;
    source.connect(ctx.destination);

    source.onended = () => {
      source.disconnect();
      onEnded?.();
    };

    source.start(when);
    return source;
  }

  stopAll(sources: AudioBufferSourceNode[]): void {
    for (const source of sources) {
      source.onended = null;

      try {
        source.stop();
      } catch {
        // Already stopped / never started - ignore.
      }

      source.disconnect();
    }
  }

  dispose(): void {
    this.ctx?.close();
    this.ctx = null;
    this.buffers.clear();
    this.pending.clear();
  }
}

export const audioEngine = new AudioEngine();
