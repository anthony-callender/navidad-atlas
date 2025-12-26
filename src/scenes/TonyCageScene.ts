import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class TonyCageScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  private tony!: Phaser.GameObjects.Sprite;
  private swordPickup?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'TonyCageScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // During Tony kidnap/rescue sequence
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_tony');

    SceneFX.addOverlay(this, 'cave');
    SceneFX.addParticles(this, 'cave');

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);

    this.createUndergroundRoom();

    this.player = new Player(this, 320, 520);
    this.physics.add.collider(this.player, this.walls);

    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Tony in cage
    this.tony = this.add.sprite(340, 360, 'tony');
    this.tony.setScale(2);
    this.tony.setDepth(10);

    // Talk to Tony (once)
    this.interactSystem.register({
      id: 'tony-cage-talk',
      x: 340,
      y: 380,
      radius: 90,
      promptText: 'Presiona E para hablar',
      onInteract: () => {
        // If we already had the heart-to-heart but the sword hasn't been granted yet,
        // allow re-triggering the sword beat (players often don't press an extra confirm on the last line).
        if (this.gameState.data.tonyRescuedFromCage && !this.gameState.data.bearSwordGranted) {
          this.spawnSwordPickup();
          return;
        }
        if (this.gameState.data.tonyRescuedFromCage) {
          this.dialogueSystem.start([{ speaker: 'Tony', text: 'Estoy aquí. Ve y termina esto.' }]);
          return;
        }

        // Auto-close after the final line so the callback always fires without requiring an extra E/Space press.
        this.dialogueSystem.start(
          DialogScript.tonyInCage,
          () => {
            this.gameState.data.tonyRescuedFromCage = true;
            this.spawnSwordPickup();
          },
          { autoCloseMs: 2800 }
        );
      }
    });

    // Door to bear
    this.interactSystem.register({
      id: 'to-bear-door',
      x: 1120,
      y: 520,
      radius: 80,
      promptText: 'Presiona E para avanzar',
      onInteract: () => {
        if (!this.gameState.data.bearSwordGranted) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'No voy a entrar ahí sin un arma.' }]);
          return;
        }
        RoomTransitions.transition(this, 'BearBossScene', 640, 560);
      }
    });
  }

  update(): void {
    if (this.dialogueSystem.isDialogueActive()) {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
      this.player.preUpdate(this.time.now, this.game.loop.delta);
      return;
    }

    // Disable attacking until sword granted (story beat)
    if (this.gameState.data.bearSwordGranted && this.inputRouter.isAttackPressed()) {
      this.player.attack();
    }

    if (this.inputRouter.isInteractPressed()) this.interactSystem.interact();

    const mv = this.inputRouter.getMovementVector();
    this.player.move(mv.x, mv.y, mv.direction);
    this.interactSystem.update(this.player.x, this.player.y);

    this.player.preUpdate(this.time.now, this.game.loop.delta);
  }

  private spawnSwordPickup(): void {
    if (this.gameState.data.bearSwordGranted) return;

    // Auto-close after last line so the sword spawn isn't blocked on extra input.
    this.dialogueSystem.start(DialogScript.diracSwordAppears, () => {
      this.swordPickup = this.add.image(640, 460, 'sword');
      this.swordPickup.setScale(1.4);
      this.swordPickup.setDepth(12);

      const glow = this.add.circle(640, 460, 40, 0xffd700, 0.18);
      glow.setDepth(11);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.22 },
        yoyo: true,
        repeat: -1,
        duration: 900
      });

      this.interactSystem.register({
        id: 'dirac-sword',
        x: 640,
        y: 460,
        radius: 80,
        promptText: 'Presiona E para tomar la espada',
        onInteract: () => {
          this.gameState.data.bearSwordGranted = true;
          this.gameState.setObjective('Enfrenta al oso.');
          this.swordPickup?.destroy();
          glow.destroy();
          this.interactSystem.unregister('dirac-sword');
          this.dialogueSystem.start([{ speaker: 'June', text: 'Ok. Esto es mío ahora.' }]);
        }
      });
    }, { autoCloseMs: 1200 });
  }

  private createUndergroundRoom(): void {
    // Stone floor
    for (let x = 0; x < 1280; x += 32) {
      for (let y = 0; y < 720; y += 32) {
        const r = Math.random();
        const color = r < 0.2 ? 0x2a2a2a : 0x3a3a3a;
        this.add.rectangle(x + 16, y + 16, 32, 32, color).setDepth(0);
      }
    }

    this.walls = this.physics.add.staticGroup();
    const wallRects = [
      { x: 640, y: 32, w: 1280, h: 64 },
      { x: 640, y: 688, w: 1280, h: 64 },
      { x: 32, y: 360, w: 64, h: 720 },
      { x: 1248, y: 360, w: 64, h: 720 }
    ];
    wallRects.forEach(r => {
      const c = this.add.rectangle(r.x, r.y, r.w, r.h);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Cage visuals (left side)
    const cage = this.add.graphics();
    cage.lineStyle(6, 0x7a7a7a, 1);
    cage.strokeRect(220, 280, 220, 200);
    cage.lineStyle(3, 0xaaaaaa, 1);
    for (let i = 0; i < 10; i++) {
      cage.lineBetween(240 + i * 18, 285, 240 + i * 18, 475);
    }
    cage.setDepth(9);

    // Door visuals (right side)
    const door = this.add.rectangle(1120, 520, 70, 100, 0x1a1a1a);
    door.setDepth(9);
    const doorFrame = this.add.rectangle(1120, 520, 80, 110, 0x6b4c35);
    doorFrame.setDepth(8);
  }
}


