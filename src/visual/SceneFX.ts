import Phaser from 'phaser';

export type SceneMood = 'warm' | 'cool' | 'cave' | 'boss' | 'celebration' | 'platform' | 'bright';

export type OverlayOptions = {
  /** Multiplies the base grade alpha (default 1). */
  strength?: number;
  /** Vignette alpha (default 0.10). */
  vignette?: number;
};

export type ParticleOptions = {
  /** Multiplies the base particle count (default 1). */
  density?: number;
  /** Optional tint to apply to particles. */
  tint?: number;
};

export class SceneFX {
  private static getQualityScale(): number {
    // Default: full FX. Reduce slightly for “reduced motion” or very low core counts.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w: any = window;
      const reduced = !!w?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 8) : 8;
      if (reduced) return 0.55;
      if (cores <= 4) return 0.75;
      return 1;
    } catch {
      return 1;
    }
  }

  public static addOverlay(scene: Phaser.Scene, mood: SceneMood, options?: OverlayOptions): void {
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const strength = options?.strength ?? 1;

    // A very light color grade to unify the look.
    const grade =
      mood === 'warm'
        ? scene.add.rectangle(w / 2, h / 2, w, h, 0xffc07a, 0.06 * strength)
        : mood === 'cool'
          ? scene.add.rectangle(w / 2, h / 2, w, h, 0x7dc6ff, 0.05 * strength)
          : mood === 'cave'
            ? scene.add.rectangle(w / 2, h / 2, w, h, 0x6a8aaa, 0.04 * strength)
            : mood === 'boss'
              ? scene.add.rectangle(w / 2, h / 2, w, h, 0x8b00ff, 0.04 * strength)
              : mood === 'celebration'
                ? scene.add.rectangle(w / 2, h / 2, w, h, 0xfff1c2, 0.05 * strength)
                : mood === 'bright'
                  ? scene.add.rectangle(w / 2, h / 2, w, h, 0xffffff, 0.045 * strength)
                : scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0);

    grade.setScrollFactor(0);
    grade.setDepth(10000);
    grade.setBlendMode(Phaser.BlendModes.SCREEN);

    // Subtle vignette helps “production” readability.
    const vignetteAlpha = options?.vignette ?? 0.10;
    const vignette = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, vignetteAlpha);
    vignette.setScrollFactor(0);
    vignette.setDepth(9999);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  public static addParticles(scene: Phaser.Scene, mood: SceneMood, options?: ParticleOptions): void {
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const q = SceneFX.getQualityScale();
    const density = (options?.density ?? 1) * q;

    const baseCount =
      mood === 'boss' ? 16 :
        mood === 'cave' ? 14 :
          mood === 'warm' ? 10 :
            mood === 'cool' ? 12 :
              mood === 'celebration' ? 18 :
                mood === 'bright' ? 10 : 8;

    const count = Math.max(3, Math.round(baseCount * density));

    for (let i = 0; i < count; i++) {
      const p = scene.add.image(Math.random() * w, Math.random() * h, 'particle');
      p.setScrollFactor(0.1); // gentle parallax; stays mostly camera-fixed
      p.setDepth(9000);
      p.setAlpha(mood === 'boss' ? 0.06 : 0.08 + Math.random() * 0.10);
      p.setScale(1 + Math.random() * 1.8);
      p.setBlendMode(Phaser.BlendModes.SCREEN);
      if (options?.tint !== undefined) p.setTint(options.tint);

      const driftX = (-30 + Math.random() * 60);
      const driftY = (-40 + Math.random() * 80);
      const dur = 5000 + Math.random() * 6000;

      scene.tweens.add({
        targets: p,
        x: p.x + driftX,
        y: p.y + driftY,
        alpha: { from: p.alpha, to: 0 },
        duration: dur,
        repeat: -1,
        delay: Math.random() * 2000
      });
    }
  }

  public static addFog(scene: Phaser.Scene, count: number, options?: { alpha?: number; tint?: number; scrollFactor?: number }): void {
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;
    const q = SceneFX.getQualityScale();
    const n = Math.max(2, Math.round(count * q));
    const a = options?.alpha ?? 0.06;
    const tint = options?.tint;
    const sf = options?.scrollFactor ?? 0.15;

    for (let i = 0; i < n; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const fog = scene.add.image(x, y, 'fog_blob');
      fog.setDepth(8500);
      fog.setAlpha(a * (0.7 + Math.random() * 0.8));
      fog.setScale(0.6 + Math.random() * 1.2);
      fog.setScrollFactor(sf);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);
      if (tint !== undefined) fog.setTint(tint);
      scene.tweens.add({
        targets: fog,
        x: x + (-80 + Math.random() * 160),
        y: y + (-40 + Math.random() * 80),
        yoyo: true,
        repeat: -1,
        duration: 9000 + Math.random() * 5000,
        ease: 'Sine.easeInOut'
      });
    }
  }
}


