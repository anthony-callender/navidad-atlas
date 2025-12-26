import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InputRouter } from '../systems/InputRouter';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class FinalCaptureScene extends Phaser.Scene {
  private gameState: GameState;
  private dialogue!: DialogueSystem;
  private inputRouter!: InputRouter;

  constructor() {
    super({ key: 'FinalCaptureScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // During June kidnap / rescue June arc
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_june');

    SceneFX.addOverlay(this, 'boss');
    SceneFX.addParticles(this, 'boss');
    this.dialogue = new DialogueSystem(this);
    this.inputRouter = new InputRouter(this);

    // Simple cinematic background
    this.add.rectangle(640, 360, 1280, 720, 0x0b0f1f, 1);
    const fog = this.add.rectangle(640, 360, 1280, 720, 0x6a8aaa, 0.08);
    this.tweens.add({ targets: fog, alpha: { from: 0.05, to: 0.12 }, yoyo: true, repeat: -1, duration: 1200 });

    const june = this.add.sprite(520, 420, 'player').setScale(2).setDepth(5);
    const tony = this.add.sprite(760, 420, 'tony').setScale(2).setDepth(5);

    const gate = this.add.rectangle(640, 220, 220, 240, 0x1a1a1a, 1).setDepth(4);
    this.add.text(640, 220, 'NORTH GATE', { fontSize: '16px', color: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);

    const runCapture = () => {
      // Capture animation
      this.cameras.main.shake(200, 0.01);
      this.tweens.add({
        targets: june,
        y: june.y - 120,
        alpha: 0,
        duration: 700,
        ease: 'Sine.easeInOut'
      });
      this.time.delayedCall(700, () => {
        this.gameState.data.finalActStarted = true;
        this.gameState.data.juneCaptured = true;
        this.gameState.setObjective('Como Tony: entra, encuentra la llave, salva a June.');
        // Auto-close after the last line so the transition always fires without requiring an extra confirm.
        this.dialogue.start(DialogScript.finalTonyResolve, () => {
          this.gameState.data.rescueJuneRunComplete = false;
          RoomTransitions.transition(this, 'RescueJuneRunScene', 120, 620);
        }, { autoCloseMs: 1400 });
      });
    };

    this.dialogue.start(DialogScript.finalGateArrival, () => {
      // Bulletproof: auto-advance the 3-line capture beat then force the capture
      this.dialogue.start(DialogScript.finalJuneCaptured);
      this.time.delayedCall(600, () => this.dialogue.advance());
      this.time.delayedCall(1200, () => this.dialogue.advance());
      this.time.delayedCall(1800, () => {
        this.dialogue.close();
        runCapture();
      });
    });
  }

  update(): void {
    if (this.dialogue.isDialogueActive()) {
      if (this.inputRouter.isConfirmPressed()) this.dialogue.advance();
    }
  }
}


