import Phaser from 'phaser';
import { musicManager } from '../audio/MusicManager';
import { GameState } from '../game/GameState';
import { SceneFX } from '../visual/SceneFX';

export class TitleScene extends Phaser.Scene {
  private gameState: GameState;
  constructor() {
    super({ key: 'TitleScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // Title screen music
    musicManager.play('title_screen');
    const width = 1280;
    const height = 720;
    
    // Bright, friendly, Terraria-inspired title backdrop (daytime!)
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x7dd8ff, 0x7dd8ff, 0xcdf3ff, 0xeafcff, 1);
    gradient.fillRect(0, 0, width, height);
    
    // Sun + glow
    const sunGlow = this.add.circle(180, 150, 120, 0xfff1c2, 0.22);
    sunGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    const sun = this.add.circle(180, 150, 46, 0xfff1c2, 1);
    this.tweens.add({ targets: sunGlow, alpha: { from: 0.12, to: 0.26 }, yoyo: true, repeat: -1, duration: 1600 });
    
    // Clouds (reuse fog_blob as a soft pixel cloud)
    for (let i = 0; i < 7; i++) {
      const x = Math.random() * width;
      const y = 60 + Math.random() * 220;
      const cloud = this.add.image(x, y, 'fog_blob');
      cloud.setTint(0xffffff);
      cloud.setAlpha(0.14 + Math.random() * 0.12);
      cloud.setScale(0.55 + Math.random() * 0.8);
      cloud.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: cloud,
        x: x + (120 + Math.random() * 220),
        y: y + (-10 + Math.random() * 20),
        duration: 12000 + Math.random() * 9000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Far hills
    const hills = this.add.graphics();
    hills.fillStyle(0x2a7a7a, 0.45);
    hills.fillEllipse(300, 520, 700, 320);
    hills.fillEllipse(900, 540, 820, 360);
    hills.fillStyle(0x1f5f5f, 0.30);
    hills.fillEllipse(620, 560, 900, 420);
    
    // Ground tiles (bright grass)
    for (let x = 0; x < width; x += 32) {
      for (let y = 420; y < height; y += 32) {
        const r = Math.random();
        const tex = r < 0.4 ? 'floor_grass' : r < 0.7 ? 'floor_grass_1' : 'floor_grass_2';
        const t = this.add.image(x, y, tex).setOrigin(0, 0);
        t.setDepth(0);
      }
    }
    
    // Foreground plants/flowers (fun + alive)
    for (let i = 0; i < 60; i++) {
      const x = 40 + Math.random() * (width - 80);
      const y = 450 + Math.random() * 240;
      const key = Math.random() < 0.7 ? 'tall_grass' : 'flower';
      const d = this.add.image(x, y, key);
      d.setDepth(y);
      d.setAlpha(key === 'flower' ? 0.98 : 0.85);
      d.setScale(key === 'flower' ? 0.9 : 0.8 + Math.random() * 0.5);
    }
    
    // A few trees for “Terraria forest” vibe
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 220;
      const y = 520 + Math.random() * 40;
      this.add.image(x, y, 'tree').setDepth(y).setScale(0.9);
    }
    
    // Friendly ambient sparkles (not snow)
    SceneFX.addOverlay(this, 'bright', { strength: 1.0, vignette: 0.05 });
    SceneFX.addParticles(this, 'bright', { density: 0.8, tint: 0xfff1c2 });
    
    // Title "Navidad Atlas" with beautiful styling
    const titleY = 220;
    
    // Title shadow
    const titleShadow = this.add.text(width / 2 + 4, titleY + 4, 'Navidad Atlas', {
      fontSize: '72px',
      fontFamily: 'Georgia, serif',
      color: '#000000',
      fontStyle: 'bold italic'
    });
    titleShadow.setOrigin(0.5, 0.5);
    titleShadow.setAlpha(0.5);
    
    // Main title with gradient effect
    const title = this.add.text(width / 2, titleY, 'Navidad Atlas', {
      fontSize: '72px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      fontStyle: 'bold italic',
      stroke: '#ffd700',
      strokeThickness: 3
    });
    title.setOrigin(0.5, 0.5);
    
    // Title glow
    const titleGlow = this.add.circle(width / 2, titleY, 180, 0xffd700, 0.15);
    titleGlow.setDepth(-1);
    
    // Pulsing glow animation
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.05,
      scale: 1.2,
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // Friendly “bounce in” for the title
    title.setScale(0.92);
    this.tweens.add({
      targets: title,
      scale: 1.0,
      duration: 700,
      ease: 'Back.easeOut'
    });
    
    // Subtitle
    const subtitle = this.add.text(width / 2, titleY + 80, 'Una aventura navideña de misterio', {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#1f2d3a',
      fontStyle: 'italic',
      stroke: '#ffffff',
      strokeThickness: 2
    });
    subtitle.setOrigin(0.5, 0.5);
    
    // Start + Restart buttons (side-by-side)
    const buttonsY = height / 2 + 100;

    const startButton = this.add.text(width / 2 - 150, buttonsY, 'JUGAR', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#1f7a3aff',
      padding: { x: 30, y: 15 }
    });
    startButton.setOrigin(0.5, 0.5);
    startButton.setInteractive({ useHandCursor: true });

    const restartButton = this.add.text(width / 2 + 150, buttonsY, 'NUEVA PARTIDA', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#2b5f8aff',
      padding: { x: 30, y: 15 }
    });
    restartButton.setOrigin(0.5, 0.5);
    restartButton.setInteractive({ useHandCursor: true });
    
    // Button glow effect
    const startGlow = this.add.rectangle(width / 2 - 150, buttonsY, 270, 70, 0xffffff, 0.18);
    startGlow.setDepth(-1);
    const restartGlow = this.add.rectangle(width / 2 + 150, buttonsY, 270, 70, 0xffffff, 0.18);
    restartGlow.setDepth(-1);
    
    // Pulsing button animation
    this.tweens.add({
      targets: [startButton, startGlow, restartButton, restartGlow],
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Credits
    const credits = this.add.text(width / 2, height - 60, 'Hecho con cariño | Música: original | Arte: original', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888'
    });
    credits.setOrigin(0.5, 0.5);
    
    // Controls hint
    const controls = this.add.text(width / 2, height - 30, 'Controles: WASD/Flechas = mover | Espacio = atacar | E = interactuar', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888'
    });
    controls.setOrigin(0.5, 0.5);
    
    // Start game function
    const startGame = () => {
      // Initialize audio context (browser requirement)
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        ctx.resume();
      } catch (e) {
        console.warn('Audio context init failed:', e);
      }

      // After a user gesture, try again to ensure title music is allowed (autoplay policy).
      musicManager.play('title_screen');
      
      // Fade out and start
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CabinScene');
        this.scene.launch('UIScene');
      });
    };

    const restartGame = () => {
      // Clear progress + save
      this.gameState.reset();
      // Stop any music (safe even if none is playing)
      musicManager.stop();

      // Small feedback pulse
      this.cameras.main.flash(250, 255, 215, 0);

      const msg = this.add.text(width / 2, buttonsY + 80, '¡Partida reiniciada!', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 14, y: 8 }
      });
      msg.setOrigin(0.5, 0.5);
      this.time.delayedCall(900, () => msg.destroy());
    };
    
    // Click or keyboard to start
    startButton.on('pointerdown', startGame);
    startButton.on('pointerover', () => {
      startButton.setStyle({ color: '#ffd700' });
    });
    startButton.on('pointerout', () => {
      startButton.setStyle({ color: '#ffffff' });
    });

    restartButton.on('pointerdown', restartGame);
    restartButton.on('pointerover', () => {
      restartButton.setStyle({ color: '#ffd700' });
    });
    restartButton.on('pointerout', () => {
      restartButton.setStyle({ color: '#ffffff' });
    });
    
    this.input.keyboard?.once('keydown', startGame);

    // If autoplay was blocked, a simple click anywhere should enable music.
    // (Avoid interfering with clicking the PLAY button by letting the button handler run.)
    this.input.on('pointerdown', () => {
      musicManager.play('title_screen');
    });
    
    // Fade in
    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }
}

