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

export class TunnelScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Slime[] = [];
  
  constructor() {
    super({ key: 'TunnelScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // After finding the library, tunnel is part of that exploration
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else musicManager.play('2');

    SceneFX.addOverlay(this, 'cave');
    SceneFX.addParticles(this, 'cave');
    
    // Create tunnel map
    this.createTunnelMap();
    
    // Create player
    const spawnX = this.gameState.data.spawnScene === 'TunnelScene' 
      ? this.gameState.data.spawnX 
      : 640;
    const spawnY = this.gameState.data.spawnScene === 'TunnelScene' 
      ? this.gameState.data.spawnY 
      : 100; // Default to north entrance
    
    this.player = new Player(this, spawnX, spawnY);
    
    // Setup systems
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Spawn enemies
    this.spawnEnemies();
    
    // Setup collisions
    this.physics.add.collider(this.player, this.walls);
    this.enemies.forEach(enemy => {
      this.physics.add.collider(enemy, this.walls);
    });
    
    // Setup interactions
    this.setupInteractions();
    
    // Camera
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Discovery dialogue
    if (!this.gameState.data.tunnelDiscovered) {
      this.gameState.data.tunnelDiscovered = true;
      this.time.delayedCall(500, () => {
        this.dialogueSystem.start([
          {
            speaker: 'June',
            text: "An underground tunnel! This must be how I got to the library before."
          }
        ]);
      });
    }
  }
  
  update(): void {
    if (!this.dialogueSystem.isDialogueActive()) {
      if (this.inputRouter.isAttackPressed()) {
        this.player.attack();
      }
      
      if (this.inputRouter.isInteractPressed()) {
        this.interactSystem.interact();
      }
      
      const movement = this.inputRouter.getMovementVector();
      this.player.move(movement.x, movement.y, movement.direction);
      
      this.interactSystem.update(this.player.x, this.player.y);
      
      // Update enemies
      this.enemies = this.enemies.filter(enemy => enemy.active);
      this.enemies.forEach(enemy => {
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
      });
    } else {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      
      if (this.inputRouter.isConfirmPressed()) {
        this.dialogueSystem.advance();
      }
    }
    
    this.player.preUpdate(this.time.now, this.game.loop.delta);
  }
  
  private handleEnemyHitPlayer(enemy: Slime): void {
    if (!this.player.isInvulnerable()) {
      this.player.takeDamage(1, enemy.x, enemy.y);
    }
  }
  
  private createTunnelMap(): void {
    const width = 1280;
    const height = 720;
    const tileSize = 32;
    
    // Dark stone floor (tile texture)
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const tile = this.add.image(x, y, 'floor_stone').setOrigin(0, 0);
        tile.setDepth(0);
        // Add some variation
        if (Math.random() < 0.12) tile.setTint(0x6a6a6a);
      }
    }
    
    this.walls = this.physics.add.staticGroup();
    
    // Create tunnel corridor (vertical)
    const corridorWidth = 320;
    const corridorX = (width - corridorWidth) / 2;
    
    // Left wall
    for (let y = 0; y < height; y += tileSize) {
      const wallTile = this.add.image(corridorX - tileSize, y, 'wall_stone').setOrigin(0, 0);
      wallTile.setDepth(1);
      
      // Add invisible collider
      const collider = this.add.rectangle(corridorX - tileSize, y + 16, tileSize, tileSize);
      collider.setVisible(false);
      this.walls.add(collider);
    }
    
    // Right wall
    for (let y = 0; y < height; y += tileSize) {
      const wallTile = this.add.image(corridorX + corridorWidth + tileSize, y, 'wall_stone').setOrigin(0, 0);
      wallTile.setDepth(1);
      
      // Add invisible collider
      const collider = this.add.rectangle(corridorX + corridorWidth + tileSize, y + 16, tileSize, tileSize);
      collider.setVisible(false);
      this.walls.add(collider);
    }
    
    // Top exit area
    const northExit = this.add.rectangle(640, 50, 128, 64, 0x4a4a4a);
    northExit.setDepth(2);
    
    // Bottom exit area
    const southExit = this.add.rectangle(640, 670, 128, 64, 0x4a4a4a);
    southExit.setDepth(2);

    // Crystals + fog blobs (purely visual)
    const crystals = [
      { x: corridorX - 12, y: 240 },
      { x: corridorX + corridorWidth + tileSize + 12, y: 420 }
    ];
    crystals.forEach(c => {
      const cr = this.add.image(c.x, c.y, 'crystal').setDepth(c.y).setScale(1.3);
      const glow = this.add.circle(c.x, c.y + 8, 40, 0x9fd3ff, 0.10).setDepth(c.y - 1);
      glow.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: [cr, glow], alpha: { from: 0.8, to: 1 }, yoyo: true, repeat: -1, duration: 1100 });
    });

    for (let i = 0; i < 4; i++) {
      const x = corridorX + 40 + Math.random() * (corridorWidth - 80);
      const y = 120 + Math.random() * 480;
      const fog = this.add.image(x, y, 'fog_blob').setDepth(2);
      fog.setAlpha(0.05 + Math.random() * 0.05);
      fog.setScale(0.8 + Math.random() * 1.2);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: fog, x: x + (-40 + Math.random() * 80), y: y + (-20 + Math.random() * 40), yoyo: true, repeat: -1, duration: 8000 + Math.random() * 4000, ease: 'Sine.easeInOut' });
    }
    
    // Add torches for atmosphere
    this.addTorch(corridorX + 40, 150);
    this.addTorch(corridorX + corridorWidth - 40, 150);
    this.addTorch(corridorX + 40, 360);
    this.addTorch(corridorX + corridorWidth - 40, 360);
    this.addTorch(corridorX + 40, 570);
    this.addTorch(corridorX + corridorWidth - 40, 570);
    
    // Add some atmospheric details
    this.addMoss(corridorX + 80, 200);
    this.addMoss(corridorX + corridorWidth - 120, 450);
    this.addCrack(corridorX + 160, 300);
  }
  
  private addTorch(x: number, y: number): void {
    // Torch holder
    const holder = this.add.rectangle(x, y, 8, 24, 0x4a4a4a);
    holder.setDepth(3);
    
    // Flame
    const flame = this.add.circle(x, y - 16, 8, 0xff6600, 0.8);
    flame.setDepth(4);
    
    // Flicker animation
    this.tweens.add({
      targets: flame,
      alpha: { from: 0.6, to: 1 },
      scale: { from: 0.9, to: 1.1 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 300 + Math.random() * 200
    });
    
    // Glow
    const glow = this.add.circle(x, y - 16, 40, 0xff6600, 0.1);
    glow.setDepth(2);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.15 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 400
    });
  }
  
  private addMoss(x: number, y: number): void {
    const moss = this.add.circle(x, y, 16, 0x2d5016, 0.6);
    moss.setDepth(1);
  }
  
  private addCrack(x: number, y: number): void {
    const crack = this.add.graphics();
    crack.lineStyle(2, 0x1a1a1a, 0.5);
    crack.beginPath();
    crack.moveTo(x, y);
    crack.lineTo(x + 30, y + 20);
    crack.lineTo(x + 40, y + 10);
    crack.strokePath();
    crack.setDepth(1);
  }
  
  private spawnEnemies(): void {
    // Just a couple slimes in the tunnel
    if (!this.gameState.data.libraryUnlocked) {
      const slime1 = new Slime(this, 640, 250);
      this.enemies.push(slime1);
      
      const slime2 = new Slime(this, 640, 470);
      this.enemies.push(slime2);
    }
  }
  
  private setupInteractions(): void {
    // North exit (to cabin basement)
    this.interactSystem.register({
      id: 'tunnel-north-exit',
      x: 640,
      y: 50,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para ir a la cabaña',
      onInteract: () => {
        RoomTransitions.transition(this, 'CabinScene', 640, 600); // Basement spawn
      }
    });
    
    // South exit (to library basement)
    this.interactSystem.register({
      id: 'tunnel-south-exit',
      x: 640,
      y: 670,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para ir a la biblioteca',
      onInteract: () => {
        RoomTransitions.transition(this, 'LibraryScene', 200, 650);
      }
    });
  }
}

