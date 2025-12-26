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

export class BearBossScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  private bear!: Phaser.Physics.Arcade.Sprite;
  private bearHp = 10;
  private bearInvuln = 0;
  private swipeCooldown = 0;

  constructor() {
    super({ key: 'BearBossScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // During Tony kidnap/rescue sequence
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_tony');

    SceneFX.addOverlay(this, 'boss');
    SceneFX.addParticles(this, 'boss');

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);

    this.createArena();

    this.player = new Player(this, 360, 560);
    this.physics.add.collider(this.player, this.walls);

    // Bear
    this.bear = this.physics.add.sprite(920, 520, 'bear');
    this.bear.setScale(2.4);
    this.bear.setDepth(10);
    this.bear.setCollideWorldBounds(true);
    // Make the hitbox reasonably forgiving (sprite is scaled up)
    (this.bear.body as Phaser.Physics.Arcade.Body).setSize(34, 34).setOffset(15, 14);

    this.physics.add.collider(this.bear, this.walls);

    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update(): void {
    if (this.dialogueSystem.isDialogueActive()) {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
      this.player.preUpdate(this.time.now, this.game.loop.delta);
      return;
    }

    if (this.inputRouter.isAttackPressed()) {
      // Allow attacking (bear fight requires sword anyway; damage is gated in tryHitBear)
      this.player.attack();
    }

    const mv = this.inputRouter.getMovementVector();
    this.player.move(mv.x, mv.y, mv.direction);
    this.player.preUpdate(this.time.now, this.game.loop.delta);

    // IMPORTANT: Player's sword hitbox only exists while attacking.
    // Registering overlap in create() won't work (it was null), so we check overlap dynamically.
    const sword = this.player.getSwordHitbox();
    if (sword && this.physics.overlap(sword, this.bear)) {
      this.tryHitBear();
    }

    // Boss AI: walk toward player, occasional swipe
    const dt = this.game.loop.delta;
    this.bearInvuln = Math.max(0, this.bearInvuln - dt);
    this.swipeCooldown = Math.max(0, this.swipeCooldown - dt);

    const dx = this.player.x - this.bear.x;
    const dy = this.player.y - this.bear.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = this.bearHp <= 5 ? 150 : 110;
    const vx = (dx / (dist || 1)) * speed;
    const vy = (dy / (dist || 1)) * speed;
    this.bear.setVelocity(vx, vy);

    // Swipe if close
    if (dist < 80 && this.swipeCooldown <= 0) {
      this.swipeCooldown = this.bearHp <= 5 ? 700 : 1000;
      this.cameras.main.shake(120, 0.004);
      if (!this.player.isInvulnerable()) {
        this.player.takeDamage(1, this.bear.x, this.bear.y);
      }
    }

    // Simple HP readout
    this.drawHp();
  }

  private drawHp(): void {
    // lightweight text
    const existing = this.children.getByName('bearHpText') as Phaser.GameObjects.Text | null;
    const txt = `Bear: ${this.bearHp}`;
    if (!existing) {
      const t = this.add.text(20, 20, txt, { fontSize: '18px', color: '#ffffff', fontFamily: 'Arial', backgroundColor: '#00000088', padding: { x: 10, y: 6 } });
      t.setName('bearHpText');
      t.setScrollFactor(0);
      t.setDepth(1000);
    } else {
      existing.setText(txt);
    }
  }

  private tryHitBear(): void {
    if (!this.gameState.data.bearSwordGranted) return;
    if (this.bearInvuln > 0) return;
    this.bearInvuln = 220;
    this.bearHp -= 1;

    this.bear.setTint(0xffcccc);
    this.time.delayedCall(120, () => this.bear.clearTint());

    // Knockback
    const dx = this.bear.x - this.player.x;
    const dy = this.bear.y - this.player.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.bear.setVelocity((dx / d) * 260, (dy / d) * 260);

    if (this.bearHp <= 0) {
      this.onBearDefeated();
    }
  }

  private onBearDefeated(): void {
    this.gameState.data.bearDefeated = true;
    // Story: Tony promises to find the gift keys after the bear.
    this.gameState.data.hasGiftKeys = true;
    this.gameState.setObjective('Ve al norte, al portón antiguo.');

    // Death effect
    this.cameras.main.flash(300, 255, 215, 0);
    this.bear.disableBody(true, true);

    this.time.delayedCall(500, () => {
      this.dialogueSystem.start(DialogScript.afterBearDefeated, () => {
        // Back to West woods (near Tony area)
        RoomTransitions.transition(this, 'WestForestScene', 1800, 520);
      });
    });
  }

  private createArena(): void {
    // Floor
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

    // Pillars for dodging
    const pillars = [
      { x: 640, y: 260 }, { x: 520, y: 420 }, { x: 760, y: 500 }
    ];
    pillars.forEach(p => {
      this.add.rectangle(p.x, p.y, 60, 60, 0x555555).setDepth(p.y);
      const c = this.add.rectangle(p.x, p.y, 60, 60);
      c.setVisible(false);
      this.walls.add(c);
    });
  }
}


