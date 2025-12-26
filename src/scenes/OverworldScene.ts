import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Slime } from '../entities/enemies/Slime';
import { Wisp } from '../entities/enemies/Wisp';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { PuzzleConfig, PuzzleSymbol } from '../content/PuzzleConfig';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class OverworldScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: (Slime | Wisp)[] = [];
  
  // Puzzle state
  private puzzleStones: Map<string, { current: PuzzleSymbol; visual: Phaser.GameObjects.Container }> = new Map();
  private puzzleSolved = false;
  private chestSpawned = false;
  
  // NPCs
  private gabiNPC: Phaser.GameObjects.Container | null = null;
  private tonyCompanion?: Phaser.GameObjects.Sprite;
  private tonyCompanionGlow?: Phaser.GameObjects.Arc;
  
  constructor() {
    super({ key: 'OverworldScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // Music timeline (hub):
    // - before meeting Gabi: '0'
    // - after meeting Gabi: '1'
    // - after library puzzle solved (key relic): '4'
    // - after Tony rescue heading north: '5'
    // - final village onward: 'silent_night'
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (!this.gameState.data.metGabi) musicManager.play('0');
    else if (this.gameState.data.bearDefeated && !this.gameState.data.finalActStarted) musicManager.play('5');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play('1');

    // Unified outdoor look (cool moonlit) + gentle ambience
    SceneFX.addOverlay(this, 'cool', { strength: 0.9, vignette: 0.08 });
    SceneFX.addParticles(this, 'cool', { density: 0.8, tint: 0xaaccff });
    SceneFX.addFog(this, 5, { alpha: 0.05, tint: 0x6a8aaa, scrollFactor: 0.12 });
    
    // Create overworld map
    this.createOverworldMap();
    
    // Create player
    const spawnX = this.gameState.data.spawnScene === 'OverworldScene' 
      ? this.gameState.data.spawnX 
      : 640;
    const spawnY = this.gameState.data.spawnScene === 'OverworldScene' 
      ? this.gameState.data.spawnY 
      : 800;
    
    this.player = new Player(this, spawnX, spawnY);

    // If Tony is part of the party (post-final boss), render him beside June in the hub.
    this.maybeCreateTonyCompanion();
    
    // Setup systems
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Setup NPCs (hub)
    this.setupGabi();
    
    // Spawn a couple enemies (optional, keeps hub alive)
    this.spawnEnemies();
    
    // Setup collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    
    // Setup interactions
    this.setupInteractions();
    
    // Camera
    this.cameras.main.setBounds(0, 0, 2560, 1920);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.physics.world.setBounds(0, 0, 2560, 1920);
  }
  
  update(): void {
    if (!this.dialogueSystem.isDialogueActive()) {
      // Handle input
      if (this.inputRouter.isAttackPressed()) {
        this.player.attack();
      }
      
      if (this.inputRouter.isInteractPressed()) {
        this.interactSystem.interact();
      }
      
      const movement = this.inputRouter.getMovementVector();
      this.player.move(movement.x, movement.y, movement.direction);
      
      // Update interact system
      this.interactSystem.update(this.player.x, this.player.y);
    } else {
      // In dialogue - stop movement
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      
      if (this.inputRouter.isConfirmPressed()) {
        this.dialogueSystem.advance();
      }
    }

    // Keep Tony positioned near June even during dialogue moments
    this.updateTonyCompanion();
    
    // Update player
    this.player.preUpdate(this.time.now, this.game.loop.delta);
    
    // Update enemies
    this.enemies.forEach(enemy => {
      if (enemy.active) {
        enemy.preUpdate(this.time.now, this.game.loop.delta);
        
        // Check collision with player
        if (this.physics.overlap(this.player, enemy)) {
          this.handleEnemyHitPlayer(enemy);
        }
        
        // Check collision with sword
        const sword = this.player.getSwordHitbox();
        if (sword && this.physics.overlap(sword, enemy)) {
          enemy.takeDamage(1, this.player.x, this.player.y);
        }
      }
    });
  }
  
  private createOverworldMap(): void {
    const width = 2560;
    const height = 1920;
    const tileSize = 32;
    const isWinter = this.gameState.data.winterBlessing;
    
    // === FLOOR BASE ===
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const variant = Math.random();
        const texture = isWinter
          ? (variant < 0.4 ? 'floor_snow' : variant < 0.7 ? 'floor_snow_1' : 'floor_snow_2')
          : (variant < 0.4 ? 'floor_grass' : variant < 0.7 ? 'floor_grass_1' : 'floor_grass_2');
        const tile = this.add.image(x, y, texture);
        tile.setOrigin(0, 0);
        tile.setDepth(0);
      }
    }
    
    // === PATHS (Guide player movement) ===
    const pathTiles = [
      // Path from cabin (y=880) upward
      {x:640,y:800}, {x:640,y:768}, {x:640,y:736}, {x:640,y:704}, {x:640,y:672},
      {x:640,y:640}, {x:640,y:608}, {x:640,y:576}, {x:640,y:544}, {x:640,y:512},
      // Curve toward Gabi (x=1280, y=480)
      {x:672,y:512}, {x:704,y:512}, {x:736,y:496}, {x:768,y:496}, {x:800,y:480},
      {x:832,y:480}, {x:864,y:480}, {x:896,y:480}, {x:928,y:480}, {x:960,y:480},
      {x:992,y:480}, {x:1024,y:480}, {x:1056,y:480}, {x:1088,y:480}, {x:1120,y:480},
      {x:1152,y:480}, {x:1184,y:480}, {x:1216,y:480}, {x:1248,y:480},
      // Path to puzzle stones (y=1280)
      {x:640,y:960}, {x:640,y:992}, {x:640,y:1024}, {x:640,y:1056}, {x:640,y:1088},
      {x:640,y:1120}, {x:640,y:1152}, {x:640,y:1184}, {x:640,y:1216}, {x:640,y:1248}
    ];
    
    pathTiles.forEach(pos => {
      const pathTile = this.add.image(pos.x, pos.y, isWinter ? 'floor_snow_path' : 'floor_path');
      pathTile.setOrigin(0, 0);
      pathTile.setDepth(1);
    });

    // Snowfall in winter mode (Hub only)
    if (isWinter) {
      const snow = this.add.particles(0, 0, 'particle', {
        x: { min: 0, max: 1280 },
        y: -20,
        lifespan: 9000,
        speedY: { min: 20, max: 70 },
        speedX: { min: -12, max: 12 },
        scale: { start: 0.22, end: 0.65 },
        alpha: { start: 0.8, end: 0.15 },
        frequency: 80,
        blendMode: 'ADD'
      });
      snow.setScrollFactor(0.2);
      snow.setDepth(9999);
    }
    
    // Walls
    this.walls = this.physics.add.staticGroup();
    
    // Outer boundary walls (invisible)
    this.createWallLine(0, 0, width, 32); // Top
    this.createWallLine(0, height - 32, width, 32); // Bottom
    this.createWallLine(0, 0, 32, height); // Left
    this.createWallLine(width - 32, 0, 32, height); // Right
    
    // === FOREST COMPOSITION (denser, more structured) ===
    const treesData = [
      // Top forest wall (dense border)
      {x:200,y:150}, {x:280,y:140}, {x:360,y:155}, {x:440,y:145}, {x:520,y:150},
      {x:600,y:140}, {x:680,y:150}, {x:760,y:145}, {x:840,y:155}, {x:920,y:140},
      {x:1000,y:150}, {x:1080,y:145}, {x:1160,y:140}, {x:1240,y:150}, {x:1320,y:145},
      {x:1400,y:155}, {x:1480,y:140}, {x:1560,y:150}, {x:1640,y:145}, {x:1720,y:150},
      {x:1800,y:140}, {x:1880,y:155}, {x:1960,y:145}, {x:2040,y:150}, {x:2120,y:140},
      {x:2200,y:150}, {x:2280,y:145}, {x:2360,y:155},
      // Left edge
      {x:150,y:240}, {x:155,y:320}, {x:145,y:400}, {x:150,y:480}, {x:145,y:560},
      {x:150,y:640}, {x:145,y:720}, {x:150,y:800}, {x:145,y:880}, {x:150,y:960},
      {x:145,y:1040}, {x:150,y:1120}, {x:145,y:1200}, {x:150,y:1280}, {x:145,y:1360},
      {x:150,y:1440}, {x:145,y:1520}, {x:150,y:1600}, {x:145,y:1680}, {x:150,y:1760},
      // Right edge
      {x:2400,y:240}, {x:2405,y:320}, {x:2395,y:400}, {x:2400,y:480}, {x:2395,y:560},
      {x:2400,y:640}, {x:2395,y:720}, {x:2400,y:800}, {x:2395,y:880}, {x:2400,y:960},
      {x:2395,y:1040}, {x:2400,y:1120}, {x:2395,y:1200}, {x:2400,y:1280}, {x:2395,y:1360},
      {x:2400,y:1440}, {x:2395,y:1520}, {x:2400,y:1600}, {x:2395,y:1680}, {x:2400,y:1760},
      // Bottom wall
      {x:240,y:1800}, {x:320,y:1810}, {x:400,y:1795}, {x:480,y:1805}, {x:560,y:1800},
      {x:640,y:1810}, {x:720,y:1795}, {x:800,y:1805}, {x:880,y:1800}, {x:960,y:1810},
      {x:1040,y:1795}, {x:1120,y:1805}, {x:1200,y:1800}, {x:1280,y:1810}, {x:1360,y:1795},
      {x:1440,y:1805}, {x:1520,y:1800}, {x:1600,y:1810}, {x:1680,y:1795}, {x:1760,y:1805},
      {x:1840,y:1800}, {x:1920,y:1810}, {x:2000,y:1795}, {x:2080,y:1805}, {x:2160,y:1800},
      {x:2240,y:1810}, {x:2320,y:1795},
      // Interior clusters
      {x:480,y:840}, {x:800,y:820}, {x:520,y:760},
      {x:1100,y:360}, {x:1460,y:360}, {x:1100,y:600}, {x:1460,y:600},
      {x:540,y:1180}, {x:740,y:1180}, {x:540,y:1380}, {x:740,y:1380},
      {x:900,y:680}, {x:1600,y:720}, {x:1100,y:920}, {x:1800,y:1100},
      {x:2000,y:640}, {x:2200,y:880}, {x:500,y:1500}, {x:1000,y:1600},
      {x:1800,y:1500}, {x:2100,y:1400}
    ];
    treesData.forEach((pos: {x:number, y:number}) => {
      const tree = this.add.image(pos.x, pos.y, 'tree');
      tree.setDepth(pos.y);
      const treeCollider = this.add.rectangle(pos.x, pos.y + 20, 40, 40);
      treeCollider.setVisible(false);
      this.walls.add(treeCollider);
    });
    
    // Rocks
    const rocksData = [
      {x:550,y:450},{x:1300,y:600},{x:700,y:1000},{x:1600,y:1300},{x:2100,y:800},
      {x:380,y:680}, {x:920,y:550}, {x:1700,y:450}, {x:2200,y:1100}
    ];
    rocksData.forEach((pos: {x:number, y:number}) => {
      const rock = this.add.image(pos.x, pos.y, 'rock');
      rock.setDepth(pos.y);
      const rockCollider = this.add.circle(pos.x, pos.y, 24);
      rockCollider.setVisible(false);
      this.walls.add(rockCollider);
    });
    
    // === MICRO-DETAILS (Environmental storytelling) ===
    const mushroomSpots = [
      {x:250,y:170}, {x:190,y:480}, {x:2350,y:720}, {x:600,y:1780},
      {x:520,y:800}, {x:1150,y:400}, {x:1800,y:1450}
    ];
    mushroomSpots.forEach(pos => {
      const mushroom = this.add.image(pos.x, pos.y, 'mushroom');
      mushroom.setDepth(pos.y);
      mushroom.setScale(0.8 + Math.random() * 0.4);
    });
    
    const logSpots = [{x:420,y:920}, {x:1350,y:520}, {x:1650,y:1150}];
    logSpots.forEach(pos => {
      const log = this.add.image(pos.x, pos.y, 'fallen_log');
      log.setDepth(pos.y);
    });
    
    for (let i = 0; i < 30; i++) {
      const x = 200 + Math.random() * 2160;
      const y = 200 + Math.random() * 1520;
      const pebbles = this.add.image(x, y, 'pebbles');
      pebbles.setDepth(1);
      pebbles.setAlpha(0.6);
    }

    // Extra ground life (Terraria-inspired density without cluttering readability)
    // In winter mode, swap to snow shrubs + avoid tall grass.
    for (let i = 0; i < 160; i++) {
      const x = 140 + Math.random() * 2280;
      const y = 160 + Math.random() * 1600;
      const r = Math.random();
      const key = isWinter ? (r < 0.85 ? 'bush' : 'flower') : (r < 0.68 ? 'tall_grass' : r < 0.92 ? 'flower' : 'bush');
      const deco = this.add.image(x, y, key);
      deco.setDepth(y);
      if (key === 'bush') deco.setScale(0.85 + Math.random() * 0.25).setAlpha(isWinter ? 0.80 : 0.95);
      else if (key === 'flower') deco.setScale(0.7 + Math.random() * 0.25).setAlpha(isWinter ? 0.75 : 0.95);
      else deco.setScale(0.8 + Math.random() * 0.4).setAlpha(0.75);
      if (isWinter) deco.setTint(0xeaf6ff);
    }

    // A few “mystery markers” to guide the eye (no collision)
    const symbols = [
      { x: 1280, y: 360 },
      { x: 980, y: 980 },
      { x: 1820, y: 1240 }
    ];
    symbols.forEach(s => {
      const c = this.add.image(s.x, s.y, 'carved_symbol').setDepth(s.y).setScale(2.2);
      c.setAlpha(0.55);
      c.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: c, alpha: { from: 0.40, to: 0.70 }, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
    });
    
    // Interior obstacles (trees, rocks)
    this.createObstacle(320, 320, 64, 64);
    this.createObstacle(640, 240, 48, 48);
    this.createObstacle(1120, 400, 64, 64);
    this.createObstacle(1920, 480, 80, 80);
    this.createObstacle(480, 960, 64, 64);
    this.createObstacle(1440, 1120, 96, 96);
    this.createObstacle(2240, 1280, 64, 64);
    this.createObstacle(800, 1520, 48, 48);
    
    // Path markers
    this.createPathMarker(640, 880, 'Cabin');
    this.createPathMarker(1280, 420, 'Gabi\'s Clearing');
    this.createPathMarker(640, 1220, 'Ancient Stones');
    this.createPathMarker(1920, 900, 'Sealed Gate');
    
    // === VISUAL LANDMARKS (HUB ONLY) ===
    this.createCabinExterior();
    this.createHubExitMarkers();

    // Winter blessing: hub becomes “Laponia-like” (snow village dressing, still performant)
    if (isWinter) {
      this.createWinterHubDressing();
    }
  }

  private createWinterHubDressing(): void {
    const w = 2560;
    const h = 1920;

    // A few houses near the top (reads like the “North village spilled into the hub”)
    const houseXs = [720, 980, 1280, 1580, 1860];
    houseXs.forEach((hx, i) => {
      const hy = 260 + (i % 2) * 30;
      const house = this.add.graphics();
      house.fillStyle(0x8b6446, 1);
      house.fillRect(hx - 70, hy, 140, 100);
      house.fillStyle(0x4a3020, 1);
      house.fillTriangle(hx - 95, hy, hx + 95, hy, hx, hy - 70);
      // warm windows
      house.fillStyle(0xffd700, 0.55);
      house.fillRect(hx - 40, hy + 30, 30, 30);
      house.fillRect(hx + 10, hy + 30, 30, 30);
      house.setDepth(hy + 100);
    });

    // Lanterns (warmth in snow)
    const lanterns = [
      { x: 1000, y: 520 },
      { x: 1280, y: 520 },
      { x: 1560, y: 520 },
      { x: 640, y: 980 },
      { x: 1920, y: 980 }
    ];
    lanterns.forEach(l => {
      const lamp = this.add.image(l.x, l.y, 'lamp').setDepth(l.y).setScale(1.7);
      const glow = this.add.circle(l.x, l.y - 10, 120, 0xfff1c2, 0.10).setDepth(2);
      glow.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: [lamp, glow], alpha: { from: 0.9, to: 1 }, yoyo: true, repeat: -1, duration: 1400 });
    });

    // Villagers (proper sprites) hanging around the hub’s main path and Gabi’s clearing
    const villagers = [
      { x: 1180, y: 540, key: 'villager_1' },
      { x: 1380, y: 560, key: 'villager_2' },
      { x: 1280, y: 620, key: 'villager_3' },
      { x: 1020, y: 900, key: 'villager_2' },
      { x: 1540, y: 900, key: 'villager_1' }
    ];
    villagers.forEach(v => {
      const s = this.add.sprite(v.x, v.y, v.key).setScale(2);
      s.setDepth(v.y);
      this.tweens.add({ targets: s, y: v.y - 6, yoyo: true, repeat: -1, duration: 900 + Math.random() * 700 });
    });

    // A big “LAPONIA” banner at the top so the hub reads like part of the village
    const t = this.add.text(w / 2, 40, 'LAPONIA', {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold'
    });
    t.setOrigin(0.5, 0.5);
    t.setDepth(50);
    t.setAlpha(0.9);
  }

  private createHubExitMarkers(): void {
    // Midpoint exits (N/S/E/W) so the hub reads like a Zelda “room”
    const w = 2560;
    const h = 1920;

    const g = this.add.graphics();
    g.setDepth(5);

    // Simple wooden signposts at each exit
    const signs = [
      { x: w / 2, y: 80, label: 'NORTH' },
      { x: w / 2, y: h - 80, label: 'SOUTH' },
      { x: 80, y: h / 2, label: 'WEST' },
      { x: w - 80, y: h / 2, label: 'EAST' }
    ];

    signs.forEach(s => {
      g.fillStyle(0x8b6446, 1);
      g.fillRect(s.x - 12, s.y - 20, 24, 30);
      g.fillStyle(0x6b4c35, 1);
      g.fillRect(s.x - 16, s.y - 32, 32, 14);
      const t = this.add.text(s.x, s.y - 25, s.label, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      });
      t.setOrigin(0.5, 0.5);
      t.setDepth(6);
    });
  }
  
  private createCabinExterior(): void {
    // Cabin location (where door leads)
    const cabinX = 640;
    const cabinY = 900;
    
    // CABIN STRUCTURE - cozy log cabin
    const cabinGraphics = this.add.graphics();
    
    // Main cabin walls (wood logs)
    cabinGraphics.fillStyle(0x7d5a3d, 1);
    cabinGraphics.fillRect(cabinX - 80, cabinY - 60, 160, 120);
    
    // Log texture
    cabinGraphics.lineStyle(2, 0x5a3f2a, 1);
    for (let i = 0; i < 120; i += 12) {
      cabinGraphics.lineBetween(cabinX - 80, cabinY - 60 + i, cabinX + 80, cabinY - 60 + i);
    }
    
    // Roof (triangular)
    cabinGraphics.fillStyle(0x4a3020, 1);
    cabinGraphics.fillTriangle(
      cabinX - 100, cabinY - 60,  // Left
      cabinX + 100, cabinY - 60,  // Right
      cabinX, cabinY - 120        // Peak
    );
    
    // Roof shingles
    cabinGraphics.lineStyle(1, 0x3a2010, 0.6);
    for (let i = 0; i < 60; i += 8) {
      cabinGraphics.lineBetween(cabinX - 100 + i, cabinY - 60, cabinX - 50 + i, cabinY - 90);
      cabinGraphics.lineBetween(cabinX + i, cabinY - 90, cabinX + 50 + i, cabinY - 60);
    }
    
    // Door (dark opening)
    cabinGraphics.fillStyle(0x2a1a10, 1);
    cabinGraphics.fillRect(cabinX - 20, cabinY + 20, 40, 40);
    
    // Door frame
    cabinGraphics.fillStyle(0x6b4423, 1);
    cabinGraphics.fillRect(cabinX - 24, cabinY + 20, 4, 40);
    cabinGraphics.fillRect(cabinX + 20, cabinY + 20, 4, 40);
    cabinGraphics.fillRect(cabinX - 24, cabinY + 20, 48, 4);
    
    // Windows (glowing warm)
    cabinGraphics.fillStyle(0xffa500, 0.8);
    cabinGraphics.fillRect(cabinX - 60, cabinY - 20, 24, 24);
    cabinGraphics.fillRect(cabinX + 36, cabinY - 20, 24, 24);
    
    // Window panes
    cabinGraphics.lineStyle(2, 0x8b6446, 1);
    cabinGraphics.lineBetween(cabinX - 48, cabinY - 20, cabinX - 48, cabinY + 4);
    cabinGraphics.lineBetween(cabinX - 60, cabinY - 8, cabinX - 36, cabinY - 8);
    cabinGraphics.lineBetween(cabinX + 48, cabinY - 20, cabinX + 48, cabinY + 4);
    cabinGraphics.lineBetween(cabinX + 36, cabinY - 8, cabinX + 60, cabinY - 8);
    
    // Chimney (with smoke)
    cabinGraphics.fillStyle(0x696969, 1);
    cabinGraphics.fillRect(cabinX + 40, cabinY - 100, 20, 50);
    
    // Smoke particles
    for (let i = 0; i < 5; i++) {
      cabinGraphics.fillStyle(0xcccccc, 0.3 - i * 0.05);
      cabinGraphics.fillCircle(cabinX + 50 + i * 8, cabinY - 120 - i * 15, 8 + i * 3);
    }
    
    cabinGraphics.setDepth(cabinY - 60);
    
    // Add a welcoming glow around cabin
    const cabinGlow = this.add.circle(cabinX, cabinY, 150, 0xffa500, 0.1);
    cabinGlow.setDepth(cabinY - 61);
  }
  
  private createBossGateStructure(): void {
    // Boss gate location
    const gateX = 1920;
    const gateY = 960;
    
    // ANCIENT STONE GATE - mysterious ruins
    const gateGraphics = this.add.graphics();
    
    // Left pillar
    gateGraphics.fillStyle(0x5a5a5a, 1);
    gateGraphics.fillRect(gateX - 80, gateY - 80, 30, 120);
    
    // Stone texture (left)
    gateGraphics.fillStyle(0x6a6a6a, 0.5);
    for (let i = 0; i < 120; i += 20) {
      gateGraphics.fillRect(gateX - 78, gateY - 80 + i, 26, 16);
    }
    
    // Right pillar
    gateGraphics.fillStyle(0x5a5a5a, 1);
    gateGraphics.fillRect(gateX + 50, gateY - 80, 30, 120);
    
    // Stone texture (right)
    gateGraphics.fillStyle(0x6a6a6a, 0.5);
    for (let i = 0; i < 120; i += 20) {
      gateGraphics.fillRect(gateX + 52, gateY - 80 + i, 26, 16);
    }
    
    // Top archway
    gateGraphics.fillStyle(0x5a5a5a, 1);
    gateGraphics.fillRect(gateX - 80, gateY - 80, 160, 20);
    
    // Arch detail
    gateGraphics.fillStyle(0x6a6a6a, 0.6);
    gateGraphics.fillRect(gateX - 78, gateY - 78, 156, 16);
    
    // Ancient carved symbols on archway
    gateGraphics.fillStyle(0x6a8aaa, 0.7);
    const symbolY = gateY - 70;
    // Symbol 1 (circle)
    gateGraphics.lineStyle(2, 0x6a8aaa, 0.7);
    gateGraphics.strokeCircle(gateX - 40, symbolY, 6);
    // Symbol 2 (star)
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x1 = gateX + Math.cos(angle) * 6;
      const y1 = symbolY + Math.sin(angle) * 6;
      const x2 = gateX + Math.cos(angle + Math.PI) * 3;
      const y2 = symbolY + Math.sin(angle + Math.PI) * 3;
      gateGraphics.lineBetween(x1, y1, x2, y2);
    }
    // Symbol 3 (crescent)
    gateGraphics.strokeCircle(gateX + 40, symbolY, 6);
    gateGraphics.fillStyle(0x3a4a5a, 1);
    gateGraphics.fillCircle(gateX + 42, symbolY, 5);
    
    // Sealed effect if not opened
    if (!this.gameState.data.hasKeyRelic) {
      // Dark barrier
      gateGraphics.fillStyle(0x1a1a2a, 0.8);
      gateGraphics.fillRect(gateX - 50, gateY - 60, 100, 100);
      
      // Magical runes glowing
      gateGraphics.fillStyle(0x6a8aaa, 0.5);
      gateGraphics.fillCircle(gateX, gateY, 30);
    } else {
      // Open passage (darker cave entrance)
      gateGraphics.fillStyle(0x0a0a0a, 0.9);
      gateGraphics.fillRect(gateX - 50, gateY - 60, 100, 100);
    }
    
    // Moss and age
    gateGraphics.fillStyle(0x3a5a3a, 0.4);
    for (let i = 0; i < 15; i++) {
      const mx = gateX - 80 + Math.random() * 160;
      const my = gateY - 80 + Math.random() * 120;
      gateGraphics.fillRect(mx, my, 4, 4);
    }
    
    gateGraphics.setDepth(gateY - 80);
    
    // Ominous glow
    const gateGlow = this.add.circle(gateX, gateY, 120, 0x6a8aaa, 0.15);
    gateGlow.setDepth(gateY - 81);
    
    // Pulse animation
    this.tweens.add({
      targets: gateGlow,
      alpha: 0.05,
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
  }
  
  
  private createWallLine(x: number, y: number, w: number, h: number): void {
    const wall = this.add.rectangle(x + w / 2, y + h / 2, w, h, GameConfig.COLORS.WALL);
    wall.setDepth(1);
    this.walls.add(wall);
  }
  
  private createObstacle(x: number, y: number, w: number, h: number): void {
    const obstacle = this.add.rectangle(x, y, w, h, GameConfig.COLORS.WALL);
    obstacle.setDepth(5);
    this.walls.add(obstacle);
  }
  
  private createPathMarker(x: number, y: number, label: string): void {
    const text = this.add.text(x, y, `◆ ${label}`, {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'Arial'
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(3);
  }
  
  private setupGabi(): void {
    if (this.gameState.data.gabrielRevealed) return;
    
    const gabiX = 1280;
    const gabiY = 480;
    
    // Use NPC sprite instead of container
    this.gabiNPC = this.add.container(gabiX, gabiY);
    const gabiSprite = this.add.sprite(0, 0, 'npc');
    gabiSprite.setScale(2);
    this.gabiNPC.add(gabiSprite);
    this.gabiNPC.setDepth(10);
  }
  
  private setupPuzzle(): void {
    const baseX = 640;
    const baseY = 1280;
    const spacing = 80;
    
    // Create three ancient stones (use puzzle_stone sprite)
    ['A', 'B', 'C'].forEach((id, index) => {
      const x = baseX + index * spacing;
      const y = baseY;
      
      const container = this.add.container(x, y);
      
      // Ancient puzzle stone (distinct from rocks)
      const stone = this.add.image(0, 0, 'puzzle_stone');
      container.add(stone);
      
      // Carved symbol (glowing)
      const symbol = this.add.text(0, 0, 'PINE', {
        fontSize: '11px',
        color: '#6a8aaa',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      });
      symbol.setOrigin(0.5, 0.5);
      container.add(symbol);
      
      // Subtle glow around symbol
      const glow = this.add.circle(0, 0, 18, 0x6a8aaa, 0.15);
      container.addAt(glow, 1);
      
      container.setDepth(8);
      
      this.puzzleStones.set(`stone${id}`, {
        current: 'PINE',
        visual: container
      });
    });
    
    // Hint notes (carved symbols)
    this.createNote(480, 1120, 1);
    this.createNote(800, 1120, 2);
    
    // Check if already solved
    if (this.gameState.data.hasKeyRelic) {
      this.puzzleSolved = true;
      this.chestSpawned = true;
    }
  }
  
  private createNote(x: number, y: number, _noteNum: number): void {
    const note = this.add.rectangle(x, y, 32, 32, 0xffffcc);
    note.setDepth(6);
  }
  
  private spawnEnemies(): void {
    // Spawn some slimes and wisps
    const enemySpawns = [
      { type: 'slime', x: 960, y: 640 },
      { type: 'slime', x: 1600, y: 800 },
      { type: 'wisp', x: 1760, y: 320 },
      { type: 'wisp', x: 1120, y: 1280 },
      { type: 'slime', x: 640, y: 480 }
    ];
    
    enemySpawns.forEach(spawn => {
      if (spawn.type === 'slime') {
        const slime = new Slime(this, spawn.x, spawn.y);
        this.enemies.push(slime);
      } else {
        const wisp = new Wisp(this, spawn.x, spawn.y);
        this.enemies.push(wisp);
      }
    });
  }
  
  private setupInteractions(): void {
    // Cabin door
    this.interactSystem.register({
      id: 'cabin-entrance',
      x: 640,
      y: 800,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para entrar a la cabaña',
      onInteract: () => {
        RoomTransitions.transition(this, 'CabinScene', 640, 600);
      }
    });

    // Hub exits (center of each edge) -> separate outdoor “rooms”
    this.interactSystem.register({
      id: 'hub-exit-north',
      x: 2560 / 2,
      y: 90,
      radius: 70,
      promptText: 'Presiona E para tomar el camino del Norte',
      onInteract: () => {
        const isWinter = this.gameState.data.winterBlessing;
        const hasMetGabi = this.gameState.data.metGabi;
        const westCourseComplete = this.gameState.data.bearDefeated;
        // Winter blessing: only HUB + NORTH remain active
        if (isWinter) {
          RoomTransitions.transition(this, 'NorthForestScene', 2560 / 2, 1920 - 140);
          return;
        }
        // Timeline gating:
        // 1) All exits locked until she talks to the old man (metGabi)
        if (!hasMetGabi) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'Debería hablar primero con ese anciano. Hay algo en él que se siente… importante.' }]);
          return;
        }
        // 2) North stays locked until West obstacle course is completed
        if (!westCourseComplete) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'El norte se siente… pesado. Como si no nos dejara pasar todavía. No hasta que resolvamos lo que pasó en el oeste.' }]);
          return;
        }
        RoomTransitions.transition(this, 'NorthForestScene', 2560 / 2, 1920 - 140);
      }
    });
    this.interactSystem.register({
      id: 'hub-exit-south',
      x: 2560 / 2,
      y: 1920 - 90,
      radius: 70,
      promptText: 'Presiona E para tomar el camino del Sur',
      onInteract: () => {
        const isWinter = this.gameState.data.winterBlessing;
        const hasMetGabi = this.gameState.data.metGabi;
        if (isWinter) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'El camino del sur… está sellado. Como si el bosque decidiera: hoy no.' }]);
          return;
        }
        if (!hasMetGabi) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'No. Primero hablo con el anciano. Luego elegimos dirección.' }]);
          return;
        }
        RoomTransitions.transition(this, 'SouthForestScene', 2560 / 2, 140);
      }
    });
    this.interactSystem.register({
      id: 'hub-exit-west',
      x: 90,
      y: 1920 / 2,
      radius: 70,
      promptText: 'Presiona E para tomar el camino del Oeste',
      onInteract: () => {
        const isWinter = this.gameState.data.winterBlessing;
        const hasMetGabi = this.gameState.data.metGabi;
        const hasGymKey = this.gameState.data.hasLibraryOutdoorKey;
        if (isWinter) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'El oeste está bloqueado. ¿Mágicamente? Claro. Ok.' }]);
          return;
        }
        // Timeline gating:
        // 1) All exits locked until she talks to the old man
        if (!hasMetGabi) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'Aún no. Primero tengo que hablar con el anciano.' }]);
          return;
        }
        // 2) West stays locked until gym key is obtained
        if (!hasGymKey) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'El oeste está… bloqueado. Tal vez la llave del gimnasio desbloquea más que una puerta.' }]);
          return;
        }
        RoomTransitions.transition(this, 'WestForestScene', 2560 - 140, 1920 / 2);
      }
    });
    this.interactSystem.register({
      id: 'hub-exit-east',
      x: 2560 - 90,
      y: 1920 / 2,
      radius: 70,
      promptText: 'Presiona E para tomar el camino del Este',
      onInteract: () => {
        const isWinter = this.gameState.data.winterBlessing;
        const hasMetGabi = this.gameState.data.metGabi;
        if (isWinter) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'El este está cerrado. La bendición solo abrió el camino a Laponia… y a casa.' }]);
          return;
        }
        if (!hasMetGabi) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'Debería hablar primero con el anciano. Luego exploramos.' }]);
          return;
        }
        RoomTransitions.transition(this, 'EastForestScene', 140, 1920 / 2);
      }
    });
    
    // Gabi
    if (!this.gameState.data.gabrielRevealed) {
      this.interactSystem.register({
        id: 'gabi-npc',
        x: 1280,
        y: 480,
        radius: GameConfig.INTERACT_RADIUS,
        promptText: 'Presiona E para hablar',
        onInteract: () => {
          // Final act: after village, do the final Gabi conversation
          if (this.gameState.data.finalBossDefeated && !this.gameState.data.gabrielRevealed) {
            this.dialogueSystem.start(DialogScript.gabiFinalWithCouple, () => {
              this.gameState.data.gabrielRevealed = true;
              this.gameState.setObjective('Vuelve a la cabaña.');
              RoomTransitions.transition(this, 'CabinScene', 640, 600);
            });
            return;
          }
          if (!this.gameState.data.metGabi) {
            this.gameState.data.metGabi = true;
            this.gameState.setObjective('Busca la biblioteca. Prueba el camino del Sur.');
            this.dialogueSystem.start(DialogScript.meetGabi);
          } else if (this.gameState.data.hasMemorySigil && !this.gameState.data.gabrielRevealed) {
            this.revealGabriel();
          } else if (!this.gameState.data.hasKeyRelic) {
            this.dialogueSystem.start([{
              speaker: 'Gabi',
              text: 'La biblioteca quizá tenga textos sobre estos símbolos...'
            }]);
          } else {
            this.dialogueSystem.start([{
              speaker: 'Gabi',
              text: 'Usa esa Reliquia Llave para abrir el portón sellado.'
            }]);
          }
        }
      });
    }
  }
  
  private cycleStoneSymbol(stoneId: string): void {
    const stoneData = this.puzzleStones.get(stoneId);
    if (!stoneData) return;
    
    const symbols = PuzzleConfig.symbols;
    const currentIndex = symbols.indexOf(stoneData.current);
    const nextIndex = (currentIndex + 1) % symbols.length;
    stoneData.current = symbols[nextIndex];
    
    // Update visual - container structure: [image(stone), glow, text(symbol)]
    const symbolText = stoneData.visual.list[2] as Phaser.GameObjects.Text;
    if (symbolText) {
      symbolText.setText(stoneData.current);
    }
    
    // Update glow color based on symbol
    const glow = stoneData.visual.list[1] as Phaser.GameObjects.Arc;
    if (glow) {
      glow.setFillStyle(0x6a8aaa, 0.15);
    }
    
    // Check solution
    this.checkPuzzleSolution();
  }
  
  private checkPuzzleSolution(): void {
    const stoneA = this.puzzleStones.get('stoneA')?.current;
    const stoneB = this.puzzleStones.get('stoneB')?.current;
    const stoneC = this.puzzleStones.get('stoneC')?.current;
    
    if (
      stoneA === PuzzleConfig.solution.stoneA &&
      stoneB === PuzzleConfig.solution.stoneB &&
      stoneC === PuzzleConfig.solution.stoneC
    ) {
      this.solvePuzzle();
    }
  }
  
  private solvePuzzle(): void {
    if (this.puzzleSolved) return;
    
    this.puzzleSolved = true;
    this.chestSpawned = true;
    
    // Play chime sound effect (visual feedback)
    this.cameras.main.flash(300, 255, 215, 0);
    
    this.dialogueSystem.start(DialogScript.puzzleSolved, () => {
      this.spawnChest();
    });
  }
  
  private spawnChest(): void {
    const chestX = 640;
    const chestY = 1440;
    
    // Create chest
    const chest = this.add.rectangle(chestX, chestY, 48, 32, 0x8b4513);
    chest.setDepth(7);
    
    const lock = this.add.rectangle(chestX, chestY, 12, 12, 0xffd700);
    lock.setDepth(8);
    
    // Add interaction
    this.interactSystem.register({
      id: 'puzzle-chest',
      x: chestX,
      y: chestY,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para abrir',
      onInteract: () => {
        if (!this.gameState.data.hasKeyRelic) {
          this.gameState.data.hasKeyRelic = true;
          this.gameState.setObjective('Encuentra el portón sellado en el bosque.');
          this.dialogueSystem.start(DialogScript.gotKeyRelic);
          
          // Remove chest
          chest.destroy();
          lock.destroy();
          this.interactSystem.unregister('puzzle-chest');
        }
      }
    });
  }
  
  private revealGabriel(): void {
    this.gameState.data.gabrielRevealed = true;
    this.gameState.data.hasNativityManger = true;
    this.gameState.setObjective('Regresa a la cabaña.');
    
    this.dialogueSystem.start(DialogScript.gabrielReveal, () => {
      // Remove Gabi from world
      if (this.gabiNPC) {
        this.gabiNPC.destroy();
        this.gabiNPC = null;
      }
      this.interactSystem.unregister('gabi-npc');
    });
  }
  
  private handleEnemyHitPlayer(enemy: Slime | Wisp): void {
    if (!this.player.isInvulnerable()) {
      this.player.takeDamage(enemy.getDamage(), enemy.x, enemy.y);
    }
  }
  
  private createLibraryExterior(): void {
    // Library location (south of map)
    const libX = 640;
    const libY = 1700;
    
    const libGraphics = this.add.graphics();
    
    // Main building (stone/brick)
    libGraphics.fillStyle(0x8b8680, 1);
    libGraphics.fillRect(libX - 100, libY - 80, 200, 140);
    
    // Brick pattern
    libGraphics.lineStyle(1, 0x696969, 0.5);
    for (let y = 0; y < 140; y += 14) {
      for (let x = 0; x < 200; x += 40) {
        const offset = (y / 14) % 2 === 0 ? 0 : 20;
        libGraphics.strokeRect(libX - 100 + x + offset, libY - 80 + y, 38, 12);
      }
    }
    
    // Roof
    libGraphics.fillStyle(0x4a3a3a, 1);
    libGraphics.fillTriangle(
      libX - 120, libY - 80,
      libX + 120, libY - 80,
      libX, libY - 140
    );
    
    // Door (large, scholarly)
    libGraphics.fillStyle(0x3a2010, 1);
    libGraphics.fillRect(libX - 25, libY + 20, 50, 40);
    
    // Door arch
    libGraphics.fillStyle(0x6b5a54, 1);
    libGraphics.fillRect(libX - 30, libY + 20, 60, 6);
    
    // Windows (many books visible)
    libGraphics.fillStyle(0x4a90e2, 0.3);
    libGraphics.fillRect(libX - 70, libY - 30, 30, 35);
    libGraphics.fillRect(libX + 40, libY - 30, 30, 35);
    
    // Lock if not unlocked
    if (!this.gameState.data.libraryUnlocked) {
      libGraphics.fillStyle(0xffd700, 1);
      libGraphics.fillCircle(libX, libY + 40, 8);
    }
    
    libGraphics.setDepth(libY - 80);
  }
  
  private createGymExterior(): void {
    // Gym location (northeast)
    const gymX = 2200;
    const gymY = 400;
    
    const gymGraphics = this.add.graphics();
    
    // Modern building (clean lines)
    gymGraphics.fillStyle(0xa9a9a9, 1);
    gymGraphics.fillRect(gymX - 90, gymY - 70, 180, 120);
    
    // Glass front (reflective blue)
    gymGraphics.fillStyle(0x4a90e2, 0.4);
    gymGraphics.fillRect(gymX - 80, gymY - 60, 160, 100);
    
    // Door (modern glass)
    gymGraphics.fillStyle(0x2a2a2a, 1);
    gymGraphics.fillRect(gymX - 20, gymY + 10, 40, 40);
    
    // Gym sign
    gymGraphics.fillStyle(0xff0000, 1);
    gymGraphics.fillRect(gymX - 40, gymY - 90, 80, 15);
    
    // Text "GYM"
    const gymText = this.add.text(gymX, gymY - 82, 'GYM', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    gymText.setOrigin(0.5, 0.5);
    gymText.setDepth(gymY);
    
    gymGraphics.setDepth(gymY - 70);
  }
  
  private createAnimalRescueExterior(): void {
    // Animal Rescue location (southwest)
    const rescueX = 450;
    const rescueY = 1900;
    
    const rescueGraphics = this.add.graphics();
    
    // Cozy small building (warm wood)
    rescueGraphics.fillStyle(0xd2b48c, 1);
    rescueGraphics.fillRect(rescueX - 70, rescueY - 60, 140, 100);
    
    // Roof (red/orange shingles)
    rescueGraphics.fillStyle(0xcd5c5c, 1);
    rescueGraphics.fillTriangle(
      rescueX - 85, rescueY - 60,
      rescueX + 85, rescueY - 60,
      rescueX, rescueY - 110
    );
    
    // Door
    rescueGraphics.fillStyle(0x8b4513, 1);
    rescueGraphics.fillRect(rescueX - 18, rescueY + 10, 36, 30);
    
    // Window with paw print
    rescueGraphics.fillStyle(0xffffff, 0.6);
    rescueGraphics.fillCircle(rescueX - 40, rescueY - 20, 15);
    rescueGraphics.fillCircle(rescueX + 40, rescueY - 20, 15);
    
    // Paw prints
    rescueGraphics.fillStyle(0xff8c42, 1);
    rescueGraphics.fillCircle(rescueX - 40, rescueY - 20, 5);
    rescueGraphics.fillCircle(rescueX + 40, rescueY - 20, 5);
    
    // Sign with heart
    rescueGraphics.fillStyle(0x8b4513, 1);
    rescueGraphics.fillRect(rescueX - 30, rescueY - 125, 60, 20);
    
    const rescueText = this.add.text(rescueX, rescueY - 115, '♥ RESCUE', {
      fontSize: '8px',
      color: '#ff0000',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    rescueText.setOrigin(0.5, 0.5);
    rescueText.setDepth(rescueY);
    
    rescueGraphics.setDepth(rescueY - 60);
  }

  private maybeCreateTonyCompanion(): void {
    // Tony should be visible for the “back to Gabi together” beat.
    if (!this.gameState.data.finalBossDefeated) return;
    if (this.gameState.data.endingComplete) return;

    const x = this.player.x + 60;
    const y = this.player.y + 40;
    this.tonyCompanion = this.add.sprite(x, y, 'tony');
    this.tonyCompanion.setScale(1.8);
    this.tonyCompanion.setDepth(y);

    this.tonyCompanionGlow = this.add.circle(x, y + 10, 26, 0xffd700, 0.08);
    this.tonyCompanionGlow.setDepth(y - 1);
    this.tweens.add({
      targets: this.tonyCompanionGlow,
      alpha: { from: 0.05, to: 0.12 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut'
    });
  }

  private updateTonyCompanion(): void {
    if (!this.tonyCompanion) return;

    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    const vx = pb.velocity.x;
    const vy = pb.velocity.y;

    let offsetX = -55;
    let offsetY = 40;
    if (Math.abs(vx) > Math.abs(vy)) offsetX = vx >= 0 ? -55 : 55;
    else offsetY = vy >= 0 ? -45 : 55;

    const targetX = this.player.x + offsetX;
    const targetY = this.player.y + offsetY;

    const dx = targetX - this.tonyCompanion.x;
    const dy = targetY - this.tonyCompanion.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const followSpeed = dist > 220 ? 6.5 : dist > 90 ? 3.5 : 2.0;
    this.tonyCompanion.x += dx * 0.02 * followSpeed;
    this.tonyCompanion.y += dy * 0.02 * followSpeed;
    this.tonyCompanion.setDepth(this.tonyCompanion.y);

    if (this.tonyCompanionGlow) {
      this.tonyCompanionGlow.x = this.tonyCompanion.x;
      this.tonyCompanionGlow.y = this.tonyCompanion.y + 10;
      this.tonyCompanionGlow.setDepth(this.tonyCompanion.y - 1);
    }
  }
}

