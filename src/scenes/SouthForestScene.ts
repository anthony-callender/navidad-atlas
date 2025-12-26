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
import { SceneFX } from '../visual/SceneFX';

export class SouthForestScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Slime[] = [];

  private readonly W = 2560;
  private readonly H = 1920;

  constructor() {
    super({ key: 'SouthForestScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // After finding the library area
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else musicManager.play('2');

    SceneFX.addOverlay(this, 'cool', { strength: 0.95, vignette: 0.09 });
    SceneFX.addParticles(this, 'cool', { density: 0.85, tint: 0xaaccff });
    SceneFX.addFog(this, 7, { alpha: 0.055, tint: 0x6a8aaa, scrollFactor: 0.12 });

    this.createForestMap();

    const spawnX = this.gameState.data.spawnScene === 'SouthForestScene' ? this.gameState.data.spawnX : this.W / 2;
    const spawnY = this.gameState.data.spawnScene === 'SouthForestScene' ? this.gameState.data.spawnY : 140;

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

    // Path from north entrance to library
    for (let y = 200; y < 1320; y += 32) {
      const tile = this.add.image(width / 2, y, 'floor_path').setOrigin(0.5, 0.5);
      tile.setDepth(1);
    }

    // Ground life (books-in-the-woods vibe)
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

    // Dense forest framing + a clearer library clearing
    this.placeTreeWallWithGaps();
    this.placeLibraryClearingDetails();

    // Library exterior landmark (south-center)
    this.createLibraryExterior(width / 2, 1480);
  }

  private placeTreeWallWithGaps(): void {
    const topY = 150;
    const bottomY = this.H - 150;
    const leftX = 150;
    const rightX = this.W - 150;

    const centerX = this.W / 2;
    const gapHalf = 180; // keep north exit open

    // Top (leave gap at center for hub return)
    for (let x = 220; x < this.W - 220; x += 80) {
      if (Math.abs(x - centerX) < gapHalf) continue;
      this.addTree(x, topY);
    }
    // Bottom (no gap; just a dense treeline beyond library)
    for (let x = 220; x < this.W - 220; x += 80) this.addTree(x, bottomY);
    // Left/Right
    for (let y = 260; y < this.H - 260; y += 80) this.addTree(leftX, y);
    for (let y = 260; y < this.H - 260; y += 80) this.addTree(rightX, y);

    // Interior clusters shaping the main path (north -> library)
    const clusters = [
      { x: centerX - 260, y: 520 },
      { x: centerX + 260, y: 520 },
      { x: centerX - 320, y: 860 },
      { x: centerX + 320, y: 860 }
    ];
    clusters.forEach(c => {
      this.addTree(c.x, c.y);
      this.addTree(c.x + 60, c.y + 40);
      this.addTree(c.x - 50, c.y + 70);
    });
  }

  private placeLibraryClearingDetails(): void {
    const cx = this.W / 2;
    const cy = 1480;

    // Rocks defining the clearing edges (don’t block door line)
    const rocks = [
      { x: cx - 240, y: cy + 140 },
      { x: cx + 240, y: cy + 140 },
      { x: cx - 320, y: cy + 20 },
      { x: cx + 320, y: cy + 20 }
    ];
    rocks.forEach(r => this.addRock(r.x, r.y));

    // Mystery flavor: carved symbol stone near the path
    this.addDetail('carved_symbol', cx - 180, cy - 120, 1);
    this.addDetail('fallen_log', cx + 220, cy - 40, 1);

    for (let i = 0; i < 22; i++) {
      this.addDetail('pebbles', 220 + Math.random() * (this.W - 440), 220 + Math.random() * (this.H - 440), 1);
    }

    const mushrooms = [
      { x: cx - 420, y: 980 },
      { x: cx + 420, y: 980 },
      { x: cx - 110, y: 620 },
      { x: cx + 160, y: 760 }
    ];
    mushrooms.forEach(m => this.addDetail('mushroom', m.x, m.y, 0.85));
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

  private createLibraryExterior(libX: number, libY: number): void {
    const libGraphics = this.add.graphics();

    libGraphics.fillStyle(0x8b8680, 1);
    libGraphics.fillRect(libX - 110, libY - 85, 220, 150);

    libGraphics.fillStyle(0x4a3a3a, 1);
    libGraphics.fillTriangle(libX - 130, libY - 85, libX + 130, libY - 85, libX, libY - 150);

    libGraphics.fillStyle(0x3a2010, 1);
    libGraphics.fillRect(libX - 28, libY + 20, 56, 46);

    libGraphics.fillStyle(0x4a90e2, 0.25);
    libGraphics.fillRect(libX - 85, libY - 35, 35, 40);
    libGraphics.fillRect(libX + 50, libY - 35, 35, 40);

    if (!this.gameState.data.libraryUnlocked) {
      libGraphics.fillStyle(0xffd700, 1);
      libGraphics.fillCircle(libX, libY + 45, 8);
    }

    libGraphics.setDepth(libY);
  }

  private spawnEnemies(): void {
    this.enemies.push(new Slime(this, this.W / 2 - 250, 900));
    this.enemies.push(new Slime(this, this.W / 2 + 220, 1040));
  }

  private setupInteractions(): void {
    // North exit back to hub (center-top)
    this.interactSystem.register({
      id: 'to-hub-north',
      x: this.W / 2,
      y: 90,
      radius: 70,
      promptText: 'Presiona E para volver (camino del Norte)',
      onInteract: () => RoomTransitions.transition(this, 'OverworldScene', this.W / 2, this.H - 140)
    });

    // Library entrance
    const hasAnyLibraryKey = this.gameState.data.hasLibraryOutdoorKey || this.gameState.data.hasLibraryUndergroundKey;
    this.interactSystem.register({
      id: 'south-library-entrance',
      x: this.W / 2,
      y: 1480,
      radius: 90,
      promptText: hasAnyLibraryKey ? 'Presiona E para entrar a la biblioteca' : 'Presiona E (cerrado - necesitas una llave)',
      onInteract: () => {
        if (!hasAnyLibraryKey) {
          this.dialogueSystem.start([
            { speaker: 'June', text: 'Cerrado. Claro que sí.' },
            { speaker: 'June', text: 'Puedo revisar mi gimnasio o el refugio. Uno de esos tiene que tener una llave.' }
          ]);
          this.gameState.setObjective('Encuentra una llave para abrir la biblioteca.');
          return;
        }

        this.gameState.data.libraryUnlocked = true;
        RoomTransitions.transition(this, 'LibraryScene', 640, 600);
      }
    });
  }
}


