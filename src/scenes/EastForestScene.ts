import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Wisp } from '../entities/enemies/Wisp';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class EastForestScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Wisp[] = [];

  private readonly W = 2560;
  private readonly H = 1920;

  constructor() {
    super({ key: 'EastForestScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Timeline: after talking with Gabi use '1', after library solved use '4'
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play(this.gameState.data.metGabi ? '1' : '0');

    SceneFX.addOverlay(this, 'cool', { strength: 0.95, vignette: 0.09 });
    SceneFX.addParticles(this, 'cool', { density: 0.85, tint: 0xaaccff });
    SceneFX.addFog(this, 7, { alpha: 0.055, tint: 0x6a8aaa, scrollFactor: 0.12 });

    this.createForestMap();

    const spawnX = this.gameState.data.spawnScene === 'EastForestScene' ? this.gameState.data.spawnX : 140;
    const spawnY = this.gameState.data.spawnScene === 'EastForestScene' ? this.gameState.data.spawnY : this.H / 2;

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

    // Path from west entrance into gym + to lake
    for (let x = 200; x < 1700; x += 32) {
      const tile = this.add.image(x, height / 2, 'floor_path').setOrigin(0.5, 0.5);
      tile.setDepth(1);
    }
    for (let y = height / 2; y < 1550; y += 32) {
      const tile = this.add.image(1700, y, 'floor_path').setOrigin(0.5, 0.5);
      tile.setDepth(1);
    }

    // Ground life (thicker forest feel)
    for (let i = 0; i < 240; i++) {
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

    // Gym exterior (east-mid)
    this.createGymExterior(2100, height / 2 - 40);

    // Lake landmark (southeast)
    this.createLake(1850, 1550);

    // Dense forest framing + shoreline blockers so water feels real
    this.placeTreeWallWithGaps();
    this.placeLakeBlockers(1850, 1550);
    this.placeDetails();

    // Trial portal landmark (a weird carved arch)
    this.createTrialPortal(980, 420);
  }

  private createTrialPortal(x: number, y: number): void {
    const g = this.add.graphics();
    // Stone arch
    g.fillStyle(0x5a5a5a, 1);
    g.fillRect(x - 40, y - 20, 18, 80);
    g.fillRect(x + 22, y - 20, 18, 80);
    g.fillRect(x - 40, y - 30, 80, 18);

    // Inner glow
    const glow = this.add.circle(x, y + 20, 44, 0x6a8aaa, 0.18);
    glow.setDepth(y + 1);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.28 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 900
    });

    // Symbol
    const sym = this.add.image(x, y + 15, 'carved_symbol');
    sym.setDepth(y + 2);

    g.setDepth(y);
  }

  private placeTreeWallWithGaps(): void {
    const topY = 150;
    const bottomY = this.H - 150;
    const leftX = 150;
    const rightX = this.W - 150;

    const centerY = this.H / 2;
    const gapHalf = 180; // keep west return corridor open at mid-left

    // Top / Bottom rows
    for (let x = 220; x < this.W - 220; x += 80) this.addTree(x, topY);
    for (let x = 220; x < this.W - 220; x += 80) this.addTree(x, bottomY);

    // Left column (leave gap around center for exit)
    for (let y = 260; y < this.H - 260; y += 80) {
      if (Math.abs(y - centerY) < gapHalf) continue;
      this.addTree(leftX, y);
    }
    // Right column (no gap)
    for (let y = 260; y < this.H - 260; y += 80) this.addTree(rightX, y);

    // Interior clusters guiding toward gym + lake path split
    const clusters = [
      { x: 980, y: 520 },
      { x: 1220, y: 760 },
      { x: 1460, y: 980 }
    ];
    clusters.forEach(c => {
      this.addTree(c.x, c.y);
      this.addTree(c.x + 60, c.y + 40);
      this.addTree(c.x - 50, c.y + 70);
    });
  }

  private placeLakeBlockers(cx: number, cy: number): void {
    // Approximate the ellipse with a handful of circles so the player can't walk into the water
    const points = [
      { x: cx - 180, y: cy - 60, r: 60 },
      { x: cx + 180, y: cy - 60, r: 60 },
      { x: cx - 220, y: cy + 40, r: 70 },
      { x: cx + 220, y: cy + 40, r: 70 },
      { x: cx, y: cy, r: 90 },
      { x: cx, y: cy - 110, r: 60 },
      { x: cx, y: cy + 110, r: 60 }
    ];
    points.forEach(p => {
      const c = this.add.circle(p.x, p.y, p.r);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Add a few rocks on the shore for readability
    this.addRock(cx - 300, cy + 120);
    this.addRock(cx + 280, cy + 130);
    this.addRock(cx - 220, cy - 160);
  }

  private placeDetails(): void {
    // Mushrooms near the path + pebbles scatter
    const mushrooms = [
      { x: 520, y: 620 },
      { x: 880, y: 920 },
      { x: 1450, y: 1260 },
      { x: 1950, y: 1420 }
    ];
    mushrooms.forEach(m => this.addDetail('mushroom', m.x, m.y, 0.85));

    for (let i = 0; i < 20; i++) {
      this.addDetail('pebbles', 220 + Math.random() * (this.W - 440), 220 + Math.random() * (this.H - 440), 1);
    }

    // Tiny birds/critters near the lake (non-blocking)
    this.spawnCritter(1720, 1460, 0xffffff);
    this.spawnCritter(1760, 1500, 0xffffff);
  }

  private spawnCritter(x: number, y: number, color: number): void {
    const critter = this.add.circle(x, y, 5, color, 0.9);
    critter.setDepth(y + 1);
    this.tweens.add({
      targets: critter,
      x: { from: x, to: x + (Math.random() > 0.5 ? 10 : -10) },
      y: { from: y, to: y - 6 },
      duration: 800 + Math.random() * 400,
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

  private createGymExterior(gymX: number, gymY: number): void {
    const g = this.add.graphics();
    g.fillStyle(0xa9a9a9, 1);
    g.fillRect(gymX - 90, gymY - 70, 180, 120);
    g.fillStyle(0x4a90e2, 0.35);
    g.fillRect(gymX - 80, gymY - 60, 160, 100);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(gymX - 20, gymY + 10, 40, 40);
    g.fillStyle(0xff0000, 1);
    g.fillRect(gymX - 40, gymY - 90, 80, 15);
    const t = this.add.text(gymX, gymY - 82, 'GYM', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    t.setOrigin(0.5, 0.5);
    t.setDepth(gymY + 1);
    g.setDepth(gymY);
  }

  private createLake(cx: number, cy: number): void {
    const water = this.add.graphics();
    water.fillStyle(0x2f5f8f, 0.9);
    water.fillEllipse(cx, cy, 520, 300);
    water.fillStyle(0x3b78b5, 0.6);
    water.fillEllipse(cx - 30, cy - 20, 460, 250);
    water.setDepth(cy - 1);

    const shore = this.add.graphics();
    shore.lineStyle(10, 0xc2b280, 0.7);
    shore.strokeEllipse(cx, cy, 540, 320);
    shore.setDepth(cy);

    // Dock
    const dock = this.add.graphics();
    dock.fillStyle(0x8b6446, 1);
    dock.fillRect(cx - 40, cy - 170, 80, 70);
    dock.fillStyle(0x6b4c35, 1);
    dock.fillRect(cx - 36, cy - 170, 8, 70);
    dock.fillRect(cx - 20, cy - 170, 8, 70);
    dock.fillRect(cx - 4, cy - 170, 8, 70);
    dock.fillRect(cx + 12, cy - 170, 8, 70);
    dock.fillRect(cx + 28, cy - 170, 8, 70);
    dock.setDepth(cy + 1);
  }

  private spawnEnemies(): void {
    this.enemies.push(new Wisp(this, 1100, 720));
    this.enemies.push(new Wisp(this, 1500, 520));
  }

  private setupInteractions(): void {
    // West exit back to hub (center-left)
    this.interactSystem.register({
      id: 'to-hub-west',
      x: 90,
      y: this.H / 2,
      radius: 70,
      promptText: 'Presiona E para volver (camino del Oeste)',
      onInteract: () => RoomTransitions.transition(this, 'OverworldScene', this.W - 140, this.H / 2)
    });

    // Gym entrance
    this.interactSystem.register({
      id: 'east-gym-entrance',
      x: 2100,
      y: this.H / 2 - 40,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para entrar al gimnasio',
      onInteract: () => RoomTransitions.transition(this, 'GymScene', 640, 600)
    });

    // Lake interaction (flavor)
    this.interactSystem.register({
      id: 'east-lake',
      x: 1850,
      y: 1550,
      radius: 120,
      promptText: 'Presiona E para mirar el lago',
      onInteract: () => {
        this.dialogueSystem.start([
          { speaker: 'June', text: 'El lago está inmóvil. Como si contuviera la respiración.' },
          { speaker: 'June', text: 'Ok, eso fue dramático. Pero… sí. Está raramente silencioso.' }
        ]);
      }
    });

    // Platform Trial entrance (required before Gym key appears)
    this.interactSystem.register({
      id: 'platform-trial-entrance',
      x: 980,
      y: 420,
      radius: 80,
      promptText: this.gameState.data.platformTrialComplete ? 'Presiona E (prueba completada)' : 'Presiona E para entrar a la Prueba',
      onInteract: () => {
        if (this.gameState.data.platformTrialComplete) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'No. No vuelvo a hacer eso.' }]);
          return;
        }
        RoomTransitions.transition(this, 'PlatformTrialScene', 120, 620);
      }
    });
  }
}


