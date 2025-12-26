import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InputRouter } from '../systems/InputRouter';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class VillageCelebrationScene extends Phaser.Scene {
  private gameState: GameState;
  private dialogue!: DialogueSystem;
  private inputRouter!: InputRouter;
  private exiting = false;

  constructor() {
    super({ key: 'VillageCelebrationScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Final village scene until the end of the game
    musicManager.play('silent_night');
    this.dialogue = new DialogueSystem(this);
    this.inputRouter = new InputRouter(this);

    // Start “no-snow Christmas” with a colder grade; we’ll brighten/snow-up after the sermon.
    SceneFX.addOverlay(this, 'cool', { strength: 0.85, vignette: 0.06 });
    SceneFX.addParticles(this, 'cool', { density: 0.7, tint: 0xaaccff });

    // Cozy village backdrop (tile-based so it matches the rest of the game)
    for (let x = 0; x < 1280; x += 32) {
      for (let y = 0; y < 720; y += 32) {
        const tex = y < 360 ? 'floor_grass_2' : 'floor_grass';
        const t = this.add.image(x, y, tex).setOrigin(0, 0);
        t.setDepth(0);
        if (y < 300) t.setTint(0x6a8aaa); // moonlit sky-band tint
      }
    }
    this.add.text(640, 120, 'LAPONIA', { fontSize: '30px', color: '#ffffff', fontFamily: 'Georgia, serif', fontStyle: 'bold' }).setOrigin(0.5);

    // Houses
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 220;
      const house = this.add.graphics();
      house.fillStyle(0x8b6446, 1);
      house.fillRect(x - 60, 420, 120, 90);
      house.fillStyle(0x4a3020, 1);
      house.fillTriangle(x - 80, 420, x + 80, 420, x, 360);
      house.fillStyle(0xffd700, 0.5);
      house.fillRect(x - 35, 450, 25, 25);
      house.fillRect(x + 10, 450, 25, 25);
    }

    // Foreground bushes/flowers for depth
    for (let i = 0; i < 26; i++) {
      const x = 80 + Math.random() * 1120;
      const y = 520 + Math.random() * 160;
      const key = Math.random() < 0.65 ? 'bush' : 'flower';
      const d = this.add.image(x, y, key);
      d.setDepth(y);
      d.setScale(key === 'bush' ? 0.9 : 0.8);
      d.setAlpha(0.95);
    }

    // Crowd
    for (let i = 0; i < 12; i++) {
      const x = 180 + Math.random() * 920;
      const y = 560 + Math.random() * 120;
      const key = (i % 3) === 0 ? 'villager_1' : (i % 3) === 1 ? 'villager_2' : 'villager_3';
      const v = this.add.sprite(x, y, key).setScale(2);
      v.setDepth(y);
      this.tweens.add({ targets: v, y: y - 6, yoyo: true, repeat: -1, duration: 900 + Math.random() * 600 });
    }

    // June + Tony
    this.add.sprite(560, 520, 'player').setScale(2);
    this.add.sprite(720, 520, 'tony').setScale(2);

    if (!this.gameState.data.villageShown) {
      this.gameState.data.villageShown = true;
      // Part 1: villagers complain about no snow
      this.dialogue.start(DialogScript.laponiaNoSnow, () => {
        // Part 2: sermon + snow returns
        this.startSnowMiracle();
        // Auto-close the sermon, and ALSO schedule a hard fail-safe transition.
        // Some browsers / input edge-cases can leave the scene visually “stuck” even after the last line.
        this.scheduleExitFailsafe();
        this.dialogue.start(
          DialogScript.laponiaHeavenSermon,
          () => {
            this.exitToNorth();
          },
          { autoCloseMs: 1400 }
        );
      });
    }
  }

  private scheduleExitFailsafe(): void {
    // Force exit a bit after the snow miracle begins, regardless of dialogue state.
    this.time.delayedCall(6500, () => {
      this.exitToNorth();
    });
  }

  private exitToNorth(): void {
    if (this.exiting) return;
    this.exiting = true;

    // Ensure dialogue can't keep the scene alive.
    this.dialogue.close();

    // Winter blessing flips HUB + NORTH into winter and locks other forests for perf
    this.gameState.data.winterBlessing = true;
    this.gameState.data.finalBossDefeated = true;
    this.gameState.setObjective('Regresa con Gabi en el centro.');

    // IMPORTANT: exit this cinematic back into the NORTH map (now transformed into Laponia)
    RoomTransitions.transition(this, 'NorthForestScene', 2560 / 2, 1920 - 140);
  }

  private startSnowMiracle(): void {
    // Fade-in a snow tile layer on top of the existing grass to visually “turn on winter”
    const tiles: Phaser.GameObjects.Image[] = [];
    for (let x = 0; x < 1280; x += 32) {
      for (let y = 420; y < 720; y += 32) {
        const r = Math.random();
        const tex = r < 0.4 ? 'floor_snow' : r < 0.7 ? 'floor_snow_1' : 'floor_snow_2';
        const t = this.add.image(x, y, tex).setOrigin(0, 0);
        t.setDepth(1);
        t.setAlpha(0);
        tiles.push(t);
      }
    }
    this.tweens.add({ targets: tiles, alpha: 1, duration: 1200, ease: 'Sine.easeInOut' });

    // Snowfall
    const emitter = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: 1280 },
      y: -20,
      lifespan: 9000,
      speedY: { min: 20, max: 70 },
      speedX: { min: -12, max: 12 },
      scale: { start: 0.25, end: 0.7 },
      alpha: { start: 0.9, end: 0.2 },
      frequency: 85,
      blendMode: 'ADD'
    });
    emitter.setDepth(9999);

    // Add a warmer celebratory grade on top (keeps it magical + friendly)
    SceneFX.addOverlay(this, 'celebration', { strength: 1.0, vignette: 0.05 });
    SceneFX.addParticles(this, 'celebration', { density: 0.7, tint: 0xfff1c2 });
  }

  update(): void {
    if (this.dialogue.isDialogueActive()) {
      if (this.inputRouter.isConfirmPressed()) this.dialogue.advance();
    }
  }
}


