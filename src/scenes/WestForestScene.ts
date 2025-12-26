import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Slime } from '../entities/enemies/Slime';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { SceneFX } from '../visual/SceneFX';

export class WestForestScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Slime[] = [];
  private tonyVisual?: Phaser.GameObjects.Sprite;

  private readonly W = 2560;
  private readonly H = 1920;

  constructor() {
    super({ key: 'WestForestScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Timeline: after library solved use '4', during Tony rescue arc use rescue_tony, after final village use silent_night
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.tonySnatchedByBear && !this.gameState.data.bearDefeated) musicManager.play('rescue_tony');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play(this.gameState.data.metGabi ? '1' : '0');

    SceneFX.addOverlay(this, 'cool', { strength: 0.95, vignette: 0.09 });
    SceneFX.addParticles(this, 'cool', { density: 0.85, tint: 0xaaccff });
    SceneFX.addFog(this, 8, { alpha: 0.06, tint: 0x6a8aaa, scrollFactor: 0.12 });

    this.createForestMap();

    const spawnX = this.gameState.data.spawnScene === 'WestForestScene' ? this.gameState.data.spawnX : this.W - 140;
    const spawnY = this.gameState.data.spawnScene === 'WestForestScene' ? this.gameState.data.spawnY : this.H / 2;

    this.player = new Player(this, spawnX, spawnY);

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);

    this.spawnEnemies();

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);

    this.setupInteractions();

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.physics.world.setBounds(0, 0, this.W, this.H);
  }

  update(): void {
    if (!this.dialogueSystem.isDialogueActive()) {
      if (this.inputRouter.isAttackPressed()) this.player.attack();
      if (this.inputRouter.isInteractPressed()) this.interactSystem.interact();

      const mv = this.inputRouter.getMovementVector();
      this.player.move(mv.x, mv.y, mv.direction);
      this.interactSystem.update(this.player.x, this.player.y);
    } else {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
    }

    this.player.preUpdate(this.time.now, this.game.loop.delta);

    this.enemies.forEach(e => {
      if (!e.active) return;
      e.preUpdate(this.time.now, this.game.loop.delta);
      if (this.physics.overlap(this.player, e) && !this.player.isInvulnerable()) {
        this.player.takeDamage(e.getDamage(), e.x, e.y);
      }
      const sword = this.player.getSwordHitbox();
      if (sword && this.physics.overlap(sword, e)) e.takeDamage(1, this.player.x, this.player.y);
    });
  }

  private createForestMap(): void {
    const tileSize = 32;
    const width = this.W;
    const height = this.H;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const r = Math.random();
        const texture = r < 0.4 ? 'floor_grass' : r < 0.7 ? 'floor_grass_1' : 'floor_grass_2';
        const tile = this.add.image(x, y, texture).setOrigin(0, 0);
        tile.setDepth(0);
      }
    }

    // Path from east entrance to rescue house
    for (let x = width - 200; x > 700; x -= 32) {
      const tile = this.add.image(x, height / 2, 'floor_path').setOrigin(0.5, 0.5);
      tile.setDepth(1);
    }

    // Ground life (thicker forest + mystery)
    for (let i = 0; i < 260; i++) {
      const x = 120 + Math.random() * (width - 240);
      const y = 120 + Math.random() * (height - 240);
      const r = Math.random();
      const key = r < 0.7 ? 'tall_grass' : r < 0.9 ? 'flower' : 'bush';
      const deco = this.add.image(x, y, key);
      deco.setDepth(y);
      if (key === 'bush') deco.setScale(0.9 + Math.random() * 0.25).setAlpha(0.95);
      else if (key === 'flower') deco.setScale(0.7 + Math.random() * 0.25).setAlpha(0.95);
      else deco.setScale(0.8 + Math.random() * 0.4).setAlpha(0.75);
    }

    this.walls = this.physics.add.staticGroup();
    const wallThickness = 64;
    const wallRects = [
      { x: width / 2, y: wallThickness / 2, w: width, h: wallThickness },
      { x: width / 2, y: height - wallThickness / 2, w: width, h: wallThickness },
      { x: wallThickness / 2, y: height / 2, w: wallThickness, h: height },
      { x: width - wallThickness / 2, y: height / 2, w: wallThickness, h: height }
    ];
    wallRects.forEach(r => {
      const c = this.add.rectangle(r.x, r.y, r.w, r.h);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Dense treeline framing + a warm rescue clearing
    this.placeTreeWallWithGaps();
    this.placeRescueClearingDetails();

    // Rescue exterior landmark (west-mid-ish)
    this.createRescueExterior(520, height / 2 - 10);

    // Tony clearing landmark (deeper)
    this.createTonyClearing(1800, 520);
  }

  private createTonyClearing(x: number, y: number): void {
    // Small clearing ringed by trees
    const ring = [
      { x: x - 160, y: y - 120 }, { x: x, y: y - 140 }, { x: x + 160, y: y - 120 },
      { x: x - 200, y: y }, { x: x + 200, y: y },
      { x: x - 160, y: y + 120 }, { x: x, y: y + 140 }, { x: x + 160, y: y + 120 }
    ];
    ring.forEach(p => this.addTree(p.x, p.y));

    // Chopping stump + log
    const stump = this.add.circle(x - 60, y + 40, 18, 0x6b4c35, 1);
    stump.setDepth(y + 41);
    const log = this.add.image(x - 20, y + 60, 'fallen_log');
    log.setDepth(y + 60);

    // Tony sprite
    this.tonyVisual = this.add.sprite(x, y, 'tony');
    this.tonyVisual.setScale(2);
    this.tonyVisual.setDepth(y + 2);

    // Gentle idle bob
    this.tweens.add({
      targets: this.tonyVisual,
      y: { from: y - 2, to: y + 2 },
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private placeTreeWallWithGaps(): void {
    const topY = 150;
    const bottomY = this.H - 150;
    const leftX = 150;
    const rightX = this.W - 150;

    const centerY = this.H / 2;
    const gapHalf = 180; // keep east return corridor open at mid-right

    // Top / Bottom rows
    for (let x = 220; x < this.W - 220; x += 80) this.addTree(x, topY);
    for (let x = 220; x < this.W - 220; x += 80) this.addTree(x, bottomY);

    // Left column (no gap)
    for (let y = 260; y < this.H - 260; y += 80) this.addTree(leftX, y);

    // Right column (leave gap around center for exit)
    for (let y = 260; y < this.H - 260; y += 80) {
      if (Math.abs(y - centerY) < gapHalf) continue;
      this.addTree(rightX, y);
    }

    // Interior clusters shaping the path to rescue
    const clusters = [
      { x: 1500, y: centerY - 260 },
      { x: 1320, y: centerY + 260 },
      { x: 980, y: centerY - 120 }
    ];
    clusters.forEach(c => {
      this.addTree(c.x, c.y);
      this.addTree(c.x + 60, c.y + 40);
      this.addTree(c.x - 50, c.y + 70);
    });
  }

  private placeRescueClearingDetails(): void {
    const cx = 520;
    const cy = this.H / 2 - 10;

    // Stones around clearing (not blocking the door line)
    const rocks = [
      { x: cx + 220, y: cy + 140 },
      { x: cx + 240, y: cy - 160 },
      { x: cx + 320, y: cy + 10 }
    ];
    rocks.forEach(r => this.addRock(r.x, r.y));

    // Cozy details
    this.addDetail('fallen_log', cx + 420, cy + 180, 1);
    this.addDetail('mushroom', cx + 360, cy - 220, 0.9);

    // Pebbles scatter
    for (let i = 0; i < 18; i++) {
      this.addDetail('pebbles', 220 + Math.random() * (this.W - 440), 220 + Math.random() * (this.H - 440), 1);
    }

    // Tiny “animal” critters (non-blocking) to make it feel alive
    this.spawnCritter(cx + 260, cy + 220, 0x8b4513);
    this.spawnCritter(cx + 320, cy + 240, 0xff8c42);
  }

  private spawnCritter(x: number, y: number, color: number): void {
    const critter = this.add.circle(x, y, 6, color, 0.95);
    critter.setDepth(y + 1);
    this.tweens.add({
      targets: critter,
      y: { from: y, to: y - 6 },
      duration: 900 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private addTree(x: number, y: number): void {
    const tree = this.add.image(x, y, 'tree');
    tree.setDepth(y);
    const collider = this.add.rectangle(x, y + 20, 40, 40);
    collider.setVisible(false);
    this.walls.add(collider);
  }

  private addRock(x: number, y: number): void {
    const rock = this.add.image(x, y, 'rock');
    rock.setDepth(y);
    const collider = this.add.circle(x, y, 24);
    collider.setVisible(false);
    this.walls.add(collider);
  }

  private addDetail(texture: 'mushroom' | 'fallen_log' | 'carved_symbol' | 'pebbles', x: number, y: number, scale = 1): void {
    const o = this.add.image(x, y, texture);
    o.setDepth(Math.max(1, y - 2));
    o.setScale(scale);
    if (texture === 'pebbles') o.setAlpha(0.6);
  }

  private createRescueExterior(rescueX: number, rescueY: number): void {
    const g = this.add.graphics();

    g.fillStyle(0xd2b48c, 1);
    g.fillRect(rescueX - 70, rescueY - 60, 140, 100);

    g.fillStyle(0xcd5c5c, 1);
    g.fillTriangle(rescueX - 85, rescueY - 60, rescueX + 85, rescueY - 60, rescueX, rescueY - 110);

    g.fillStyle(0x8b4513, 1);
    g.fillRect(rescueX - 18, rescueY + 10, 36, 30);

    g.fillStyle(0x8b4513, 1);
    g.fillRect(rescueX - 30, rescueY - 125, 60, 20);
    const t = this.add.text(rescueX, rescueY - 115, '♥ RESCUE', {
      fontSize: '8px',
      color: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    t.setOrigin(0.5, 0.5);
    t.setDepth(rescueY + 1);

    g.setDepth(rescueY);
  }

  private spawnEnemies(): void {
    this.enemies.push(new Slime(this, 1400, 820));
    this.enemies.push(new Slime(this, 1100, 1080));
  }

  private setupInteractions(): void {
    // East exit back to hub (center-right)
    this.interactSystem.register({
      id: 'to-hub-east',
      x: this.W - 90,
      y: this.H / 2,
      radius: 70,
      promptText: 'Presiona E para volver (camino del Este)',
      onInteract: () => RoomTransitions.transition(this, 'OverworldScene', 140, this.H / 2)
    });

    // Rescue entrance
    this.interactSystem.register({
      id: 'west-rescue-entrance',
      x: 520,
      y: this.H / 2 - 10,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para entrar al refugio',
      onInteract: () => RoomTransitions.transition(this, 'AnimalRescueScene', 640, 600)
    });

    // Tony deep in the west woods (only if bear quest not finished)
    if (!this.gameState.data.bearDefeated) {
      this.interactSystem.register({
        id: 'tony-woods',
        x: 1800,
        y: 520,
        radius: 90,
        promptText: ifThen(this.gameState.data.tonySnatchedByBear, 'Presiona E', 'Presiona E para hablar'),
        onInteract: () => {
          if (this.gameState.data.tonySnatchedByBear) {
            this.dialogueSystem.start([{ speaker: 'June', text: 'Tony… aguanta. Ya voy.' }], () => {
              RoomTransitions.transition(this, 'RescueTonyRunScene', 120, 620);
            });
            return;
          }

          this.gameState.data.tonyFoundInWoods = true;
          this.dialogueSystem.start(DialogScript.tonyFoundWoods, () => {
            // IMPORTANT: Make the “RUN!” beat bulletproof by auto-advancing and forcing the transition.
            // Some players won’t press an extra confirm on the last line, so we drive it on a timer.
            this.dialogueSystem.start(DialogScript.tonyBearSnatch);

            // Auto-advance through the 3 lines, then transition.
            this.time.delayedCall(600, () => this.dialogueSystem.advance());
            this.time.delayedCall(1200, () => this.dialogueSystem.advance());
            this.time.delayedCall(1800, () => {
              if (this.gameState.data.tonySnatchedByBear) return;
              // Ensure dialogue is closed before switching scenes.
              this.dialogueSystem.close();
              this.gameState.data.tonySnatchedByBear = true;
              this.gameState.setObjective('¡Persigue al oso!');
              RoomTransitions.transition(this, 'RescueTonyRunScene', 120, 620);
            });
          });
        }
      });
    }
  }
}

function ifThen(cond: boolean, a: string, b: string): string {
  return cond ? a : b;
}


