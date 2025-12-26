import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameState } from '../game/GameState';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class FinalBossScene extends Phaser.Scene {
  public player!: Player; // Tony-controlled
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  private boss!: Phaser.Physics.Arcade.Sprite;
  private bossHp = 14;
  private bossInvuln = 0;
  private attackCooldown = 0;

  constructor() {
    super({ key: 'FinalBossScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // During June rescue arc (final boss)
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_june');

    SceneFX.addOverlay(this, 'boss');
    SceneFX.addParticles(this, 'boss');

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);

    this.createArena();

    this.player = new Player(this, 360, 560, 'tony');
    this.physics.add.collider(this.player, this.walls);

    // Boss (use existing boss sprite for now)
    this.boss = this.physics.add.sprite(920, 360, 'boss');
    this.boss.setScale(3.0);
    this.boss.setCollideWorldBounds(true);
    (this.boss.body as Phaser.Physics.Arcade.Body).setSize(40, 40).setOffset(12, 12);
    this.physics.add.collider(this.boss, this.walls);

    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  update(): void {
    if (this.dialogueSystem.isDialogueActive()) {
      this.player.move(0, 0, null);
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
      this.player.preUpdate(this.time.now, this.game.loop.delta);
      return;
    }

    const dt = this.game.loop.delta;
    this.bossInvuln = Math.max(0, this.bossInvuln - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.inputRouter.isAttackPressed()) this.player.attack();

    const mv = this.inputRouter.getMovementVector();
    this.player.move(mv.x, mv.y, mv.direction);
    this.player.preUpdate(this.time.now, this.game.loop.delta);

    // Sword overlap (dynamic)
    const sword = this.player.getSwordHitbox();
    if (sword && this.physics.overlap(sword, this.boss)) {
      this.tryHitBoss();
    }

    // Boss movement + slam
    const dx = this.player.x - this.boss.x;
    const dy = this.player.y - this.boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = this.bossHp <= 7 ? 160 : 120;
    this.boss.setVelocity((dx / (dist || 1)) * speed, (dy / (dist || 1)) * speed);

    if (dist < 90 && this.attackCooldown <= 0) {
      this.attackCooldown = this.bossHp <= 7 ? 650 : 900;
      this.cameras.main.shake(140, 0.006);
      if (!this.player.isInvulnerable()) {
        this.player.takeDamage(1, this.boss.x, this.boss.y);
      }
    }

    this.drawHp();
  }

  private drawHp(): void {
    const existing = this.children.getByName('finalHp') as Phaser.GameObjects.Text | null;
    const txt = `Final: ${this.bossHp}`;
    if (!existing) {
      const t = this.add.text(20, 20, txt, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 6 }
      });
      t.setName('finalHp');
      t.setScrollFactor(0);
      t.setDepth(1000);
    } else {
      existing.setText(txt);
    }
  }

  private tryHitBoss(): void {
    if (this.bossInvuln > 0) return;
    this.bossInvuln = 220;
    this.bossHp -= 1;

    this.boss.setTint(0xffcccc);
    this.time.delayedCall(120, () => this.boss.clearTint());

    if (this.bossHp <= 0) {
      this.onBossDefeated();
    }
  }

  private onBossDefeated(): void {
    this.gameState.data.finalBossDefeated = true;
    this.gameState.setObjective('Regresa con Gabi y luego vuelve a casa.');

    this.cameras.main.flash(350, 255, 215, 0);
    this.boss.disableBody(true, true);

    this.time.delayedCall(400, () => {
      this.dialogueSystem.start(DialogScript.finalBossAfter, () => {
        RoomTransitions.transition(this, 'ShadowHealingScene', 640, 360);
      });
    });
  }

  private createArena(): void {
    for (let x = 0; x < 1280; x += 32) {
      for (let y = 0; y < 720; y += 32) {
        const r = Math.random();
        const c = r < 0.2 ? 0x202020 : 0x2b2b2b;
        this.add.rectangle(x + 16, y + 16, 32, 32, c).setDepth(0);
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

    // Cage visual (June) - right side
    const cage = this.add.graphics();
    cage.lineStyle(6, 0x7a7a7a, 1);
    cage.strokeRect(980, 180, 220, 200);
    cage.lineStyle(3, 0xaaaaaa, 1);
    for (let i = 0; i < 10; i++) cage.lineBetween(1000 + i * 18, 185, 1000 + i * 18, 375);
    cage.setDepth(8);
    this.add.sprite(1090, 280, 'player').setScale(2).setDepth(7).setTint(0xccccff);
  }
}


