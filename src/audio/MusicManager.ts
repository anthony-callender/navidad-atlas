/**
 * MusicManager - File-based background music from /public/music
 * Tracks are mp3 files shipped in the repo (no external downloads).
 */

export type MusicTrackId =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | 'rescue_tony'
  | 'rescue_both'
  | 'rescue_june'
  | 'silent_night'
  | 'title_screen';

export class MusicManager {
  private currentId: MusicTrackId | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private volume = 0.35;
  private fadeTimer: number | null = null;

  public play(id: MusicTrackId, opts?: { loop?: boolean; volume?: number }): void {
    if (this.currentId === id && this.currentAudio) return;

    this.stop();

    const audio = new Audio(`/music/${id}.mp3`);
    audio.loop = opts?.loop ?? true;
    audio.volume = Math.max(0, Math.min(1, opts?.volume ?? this.volume));

    // Browsers may reject play() if not user-initiated; we just fail silently.
    audio.play().catch(() => {});

    this.currentId = id;
    this.currentAudio = audio;
  }

  public stop(): void {
    if (this.fadeTimer !== null) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }
    this.currentAudio = null;
    this.currentId = null;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) this.currentAudio.volume = this.volume;
  }

  public fadeOut(durationMs: number = 900): void {
    if (!this.currentAudio) return;
    const audio = this.currentAudio;
    const start = audio.volume;
    const steps = 18;
    const stepMs = Math.max(16, Math.floor(durationMs / steps));
    let i = 0;

    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    this.fadeTimer = window.setInterval(() => {
      i++;
      const t = i / steps;
      audio.volume = Math.max(0, start * (1 - t));
      if (i >= steps) {
        this.stop();
      }
    }, stepMs);
  }

  public getCurrent(): MusicTrackId | null {
    return this.currentId;
  }
}

export const musicManager = new MusicManager();

