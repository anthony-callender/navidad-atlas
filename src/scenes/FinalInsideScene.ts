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

export class FinalInsideScene extends Phaser.Scene {
  public player!: Player; // Tony-controlled
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private cageTalked = false;

  constructor() {
    super({ key: 'FinalInsideScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // During June rescue arc
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_june');

    SceneFX.addOverlay(this, 'boss');
    SceneFX.addParticles(this, 'boss');

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);

    this.createRoom();

    // Tony is now the playable character
    this.player = new Player(this, 220, 560, 'tony');
    this.player.setDepth(20);

    this.physics.add.collider(this.player, this.walls);

    this.cameras.main.setBounds(0, 0, 2560, 720);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, 2560, 720);

    this.setupInteractions();
  }

  update(): void {
    if (this.dialogueSystem.isDialogueActive()) {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
      this.player.preUpdate(this.time.now, this.game.loop.delta);
      return;
    }

    if (this.inputRouter.isAttackPressed() && this.gameState.data.bearSwordGranted) {
      this.player.attack();
    }

    if (this.inputRouter.isInteractPressed()) this.interactSystem.interact();

    const mv = this.inputRouter.getMovementVector();
    this.player.move(mv.x, mv.y, mv.direction);
    this.interactSystem.update(this.player.x, this.player.y);

    this.player.preUpdate(this.time.now, this.game.loop.delta);
  }

  private setupInteractions(): void {
    // Final key (required to open boss door)
    if (!this.gameState.data.finalBossKeyFound) {
      this.interactSystem.register({
        id: 'final-key',
        x: 1380,
        y: 360,
        radius: 80,
        promptText: 'Presiona E para tomar la llave',
        onInteract: () => {
          this.gameState.data.finalBossKeyFound = true;
          this.gameState.setObjective('Abre la puerta del jefe final.');
          this.dialogueSystem.start([{ speaker: 'Tony', text: 'Llaves. Listo. Ahora… June.' }]);
          this.interactSystem.unregister('final-key');
        }
      });
    }

    // Boss door at far right
    this.interactSystem.register({
      id: 'final-door',
      x: 2400,
      y: 360,
      radius: 90,
      promptText: this.gameState.data.finalBossKeyFound ? 'Presiona E para abrir' : 'Presiona E (cerrado)',
      onInteract: () => {
        if (!this.gameState.data.finalBossKeyFound) {
          this.dialogueSystem.start([{ speaker: 'Tony', text: 'Cerrado. Necesito la llave.' }]);
          return;
        }
        RoomTransitions.transition(this, 'FinalBossScene', 640, 560);
      }
    });

    // June cage “in view” (mid-right)
    this.interactSystem.register({
      id: 'june-cage',
      x: 1900,
      y: 360,
      radius: 120,
      promptText: 'Presiona E',
      onInteract: () => {
        if (this.cageTalked) return;
        this.cageTalked = true;
        this.dialogueSystem.start(DialogScript.juneCageTalk);
      }
    });
  }

  private createRoom(): void {
    // Wide hallway obstacle course (2D top-down)
    for (let x = 0; x < 2560; x += 32) {
      for (let y = 0; y < 720; y += 32) {
        const t = this.add.image(x, y, 'floor_stone').setOrigin(0, 0).setDepth(0);
        const r = Math.random();
        if (r < 0.10) t.setTint(0x3a2a4a);
        else if (r < 0.14) t.setTint(0x2a2a2a);
      }
    }

    this.walls = this.physics.add.staticGroup();
    // Top/bottom walls
    const bounds = [
      { x: 1280, y: 32, w: 2560, h: 64 },
      { x: 1280, y: 688, w: 2560, h: 64 },
      { x: 32, y: 360, w: 64, h: 720 },
      { x: 2528, y: 360, w: 64, h: 720 }
    ];
    bounds.forEach(b => {
      const c = this.add.rectangle(b.x, b.y, b.w, b.h);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Pillar maze obstacles
    const pillars = [
      { x: 520, y: 220 }, { x: 680, y: 500 },
      { x: 860, y: 260 }, { x: 980, y: 460 },
      { x: 1160, y: 220 }, { x: 1320, y: 520 },
      { x: 1540, y: 260 }, { x: 1660, y: 460 },
      { x: 2100, y: 220 }, { x: 2220, y: 500 }
    ];
    pillars.forEach(p => {
      const rock = this.add.image(p.x, p.y, 'rock').setDepth(p.y).setScale(1.6).setTint(0x3a3a3a);
      this.add.image(p.x, p.y - 18, 'crystal').setDepth(p.y + 1).setScale(1.0).setAlpha(0.9);
      const c = this.add.rectangle(p.x, p.y, 70, 70);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Banners to frame the hallway
    this.add.image(220, 120, 'banner').setDepth(6).setScale(0.9);
    this.add.image(2340, 120, 'banner').setDepth(6).setScale(0.9).setFlipX(true);

    // Key visual
    if (!this.gameState.data.finalBossKeyFound) {
      const key = this.add.image(1380, 360, 'key_item').setScale(1.0).setDepth(10);
      const glow = this.add.circle(1380, 360, 44, 0xffd700, 0.18).setDepth(9);
      this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.22 }, yoyo: true, repeat: -1, duration: 900 });
    }

    // June cage visual
    const cage = this.add.graphics();
    cage.lineStyle(6, 0x7a7a7a, 1);
    cage.strokeRect(1820, 260, 220, 200);
    cage.lineStyle(3, 0xaaaaaa, 1);
    for (let i = 0; i < 10; i++) cage.lineBetween(1840 + i * 18, 265, 1840 + i * 18, 455);
    cage.setDepth(8);
    const june = this.add.sprite(1930, 360, 'player').setScale(2).setDepth(7).setTint(0xccccff);

    // Boss door visual
    const door = this.add.image(2400, 360, 'door').setScale(1.2).setDepth(12);
    const lock = this.add.circle(2400, 370, 10, 0xffd700, 0.6).setDepth(13);
    if (this.gameState.data.finalBossKeyFound) lock.setVisible(false);
  }
}


