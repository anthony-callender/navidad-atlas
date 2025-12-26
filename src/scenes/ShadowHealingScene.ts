import Phaser from 'phaser';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InputRouter } from '../systems/InputRouter';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';
import { GameState } from '../game/GameState';

export class ShadowHealingScene extends Phaser.Scene {
  private dialogue!: DialogueSystem;
  private inputRouter!: InputRouter;
  private gameState: GameState;
  private exiting = false;

  // Sprites for simple “hug” animation
  private june!: Phaser.GameObjects.Sprite;
  private juneShadow!: Phaser.GameObjects.Sprite;
  private tony!: Phaser.GameObjects.Sprite;
  private tonyShadow!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: 'ShadowHealingScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Emotional “both” track
    musicManager.play('rescue_both');

    this.dialogue = new DialogueSystem(this);
    this.inputRouter = new InputRouter(this);

    // Split background (left/right)
    const W = 1280;
    const H = 720;
    this.cameras.main.setBounds(0, 0, W, H);

    // Left: June
    this.add.rectangle(W * 0.25, H * 0.5, W * 0.5, H, 0x0b1020, 1);
    // Right: Tony
    this.add.rectangle(W * 0.75, H * 0.5, W * 0.5, H, 0x120b18, 1);
    // Divider
    this.add.rectangle(W * 0.5, H * 0.5, 6, H, 0xffffff, 0.08);

    // Subtle mood overlay
    SceneFX.addOverlay(this, 'boss', { strength: 0.9, vignette: 0.10 });
    SceneFX.addParticles(this, 'boss', { density: 0.55, tint: 0xbbaaff });

    // Titles
    this.add.text(W * 0.25, 80, 'JUNE', { fontSize: '18px', color: '#ffffff', fontFamily: 'Georgia, serif', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W * 0.75, 80, 'TONY', { fontSize: '18px', color: '#ffffff', fontFamily: 'Georgia, serif', fontStyle: 'bold' }).setOrigin(0.5);

    // Characters (normal + shadow)
    this.june = this.add.sprite(W * 0.25 - 120, H * 0.5 + 30, 'player').setScale(2).setDepth(10);
    this.juneShadow = this.add.sprite(W * 0.25 + 120, H * 0.5 + 30, 'player').setScale(2).setDepth(9);
    this.juneShadow.setTint(0x2a0f3a).setAlpha(0.92);

    this.tony = this.add.sprite(W * 0.75 - 120, H * 0.5 + 30, 'tony').setScale(2).setDepth(10);
    this.tonyShadow = this.add.sprite(W * 0.75 + 120, H * 0.5 + 30, 'tony').setScale(2).setDepth(9);
    this.tonyShadow.setTint(0x1b0a22).setAlpha(0.92);

    // Shadow “aura”
    const auraJune = this.add.circle(this.juneShadow.x, this.juneShadow.y + 10, 70, 0xb067ff, 0.10).setDepth(8);
    const auraTony = this.add.circle(this.tonyShadow.x, this.tonyShadow.y + 10, 70, 0xff6bb2, 0.10).setDepth(8);
    this.tweens.add({ targets: auraJune, alpha: { from: 0.06, to: 0.14 }, yoyo: true, repeat: -1, duration: 1100 });
    this.tweens.add({ targets: auraTony, alpha: { from: 0.06, to: 0.14 }, yoyo: true, repeat: -1, duration: 1100 });

    // Begin long dialogue
    this.dialogue.start(DialogScript.shadowHealing, () => {
      this.playHugSequence();
    });
  }

  update(): void {
    if (this.dialogue.isDialogueActive()) {
      if (this.inputRouter.isConfirmPressed()) this.dialogue.advance();
    }
  }

  private playHugSequence(): void {
    // Move shadows inward slightly, then “hug” (overlap)
    this.tweens.add({
      targets: [this.juneShadow],
      x: this.june.x + 30,
      duration: 700,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: [this.tonyShadow],
      x: this.tony.x + 30,
      duration: 700,
      ease: 'Sine.easeInOut'
    });

    // Spawn “inner figures” and bring them into the hug
    this.time.delayedCall(750, () => {
      // June side: wise woman + child
      const wise = this.add.sprite(this.juneShadow.x - 70, this.juneShadow.y + 10, 'npc').setScale(1.7).setDepth(9);
      wise.setTint(0x9ad9ff).setAlpha(0.85);
      const child = this.add.sprite(this.juneShadow.x + 70, this.juneShadow.y + 10, 'player').setScale(1.35).setDepth(9);
      child.setTint(0xffffff).setAlpha(0.80);

      // Tony side: mastermind tony + child tony
      const mastermind = this.add.sprite(this.tonyShadow.x - 70, this.tonyShadow.y + 10, 'tony').setScale(1.55).setDepth(9);
      mastermind.setTint(0xffe8a3).setAlpha(0.85);
      const childTony = this.add.sprite(this.tonyShadow.x + 70, this.tonyShadow.y + 10, 'tony').setScale(1.30).setDepth(9);
      childTony.setTint(0xffffff).setAlpha(0.80);

      const pullIn = (targets: Phaser.GameObjects.GameObject[], x: number) => {
        this.tweens.add({ targets, x, duration: 600, ease: 'Sine.easeInOut' });
      };
      pullIn([wise, child], this.june.x + 30);
      pullIn([mastermind, childTony], this.tony.x + 30);

      // Small “soften” effect (shadow becomes lighter)
      this.tweens.add({ targets: [this.juneShadow], alpha: { from: 0.92, to: 0.70 }, duration: 700, yoyo: true, repeat: 0 });
      this.tweens.add({ targets: [this.tonyShadow], alpha: { from: 0.92, to: 0.70 }, duration: 700, yoyo: true, repeat: 0 });

      // After inner hug, June+Tony hug each other
      this.time.delayedCall(1200, () => this.playCoupleHug());
    });
  }

  private playCoupleHug(): void {
    const W = 1280;
    const H = 720;

    // Fade shadows out gently
    this.tweens.add({ targets: [this.juneShadow, this.tonyShadow], alpha: 0.0, duration: 650, ease: 'Sine.easeInOut' });

    // Move June/Tony toward the center, then show final lines and exit
    this.tweens.add({ targets: this.june, x: W * 0.5 - 40, duration: 800, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.tony, x: W * 0.5 + 40, duration: 800, ease: 'Sine.easeInOut' });

    this.time.delayedCall(900, () => {
      // “Hug” overlap
      this.tweens.add({ targets: this.june, x: W * 0.5 - 10, duration: 350, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this.tony, x: W * 0.5 + 10, duration: 350, ease: 'Sine.easeInOut' });

      // Final affirmation dialogue, then proceed
      this.dialogue.start(DialogScript.shadowHealingFinal, () => {
        if (this.exiting) return;
        this.exiting = true;
        // Continue to village scene
        RoomTransitions.transition(this, 'VillageCelebrationScene', 640, 360);
      }, { autoCloseMs: 1800 });
    });
  }
}


