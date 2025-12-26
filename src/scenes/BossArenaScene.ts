import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { ForgettingStag } from '../entities/boss/ForgettingStag';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class BossArenaScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private boss: ForgettingStag | null = null;
  private bossHpBar: Phaser.GameObjects.Graphics | null = null;
  
  constructor() {
    super({ key: 'BossArenaScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // Mini-boss arena (keep it aligned to timeline; post-library typically)
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else if (!this.gameState.data.metGabi) musicManager.play('0');
    else musicManager.play('1');

    SceneFX.addOverlay(this, 'boss');
    SceneFX.addParticles(this, 'boss');
    
    // Create arena
    this.createArena();
    
    // Create player
    this.player = new Player(this, 640, 600);
    
    // Setup systems
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Spawn boss (if not defeated)
    if (!this.gameState.data.bossDefeated) {
      this.spawnBoss();
    } else {
      // Boss already defeated - show exit door immediately
      this.createExitDoor();
    }
    
    // Setup collisions
    this.physics.add.collider(this.player, this.walls);
    
    if (this.boss) {
      this.physics.add.collider(this.boss as any, this.walls, () => {
        if (this.boss) {
          this.boss.onHitObstacle();
        }
      });
      
      // Also check collision with obstacles
      this.obstacles.forEach(obstacle => {
        if (this.boss) {
          this.physics.add.overlap(this.boss as any, obstacle, () => {
            if (this.boss) {
              this.boss.onHitObstacle();
            }
          });
        }
      });
    }
    
    // Camera
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, 1280, 720);
    
    // Create HP bar
    if (this.boss) {
      this.createBossHpBar();
    }
  }
  
  update(): void {
    const isInDialogue = this.dialogueSystem.isDialogueActive();
    
    if (!isInDialogue) {
      // Handle input
      if (this.inputRouter.isAttackPressed()) {
        this.player.attack();
      }
      
      if (this.inputRouter.isInteractPressed()) {
        console.log('E pressed, calling interact...');
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
    
    // Update player
    this.player.preUpdate(this.time.now, this.game.loop.delta);
    
    // Update boss
    if (this.boss && this.boss.active) {
      this.boss.preUpdate(this.time.now, this.game.loop.delta);
      
      // Check collision with player
      if (this.physics.overlap(this.player, this.boss as any)) {
        this.handleBossHitPlayer();
      }
      
      // Check collision with sword
      const sword = this.player.getSwordHitbox();
      if (sword && this.physics.overlap(sword, this.boss as any)) {
        if (this.boss.isVulnerable()) {
          this.boss.takeDamage(1, this.player.x, this.player.y);
          this.updateBossHpBar();
        }
      }
      
      // Update HP bar
      this.updateBossHpBar();
    }
  }
  
  private createArena(): void {
    const width = 1280;
    const height = 720;
    
    // Floor (stone tiles with a purple tint for “ruin” mood)
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        const t = this.add.image(x, y, 'floor_stone').setOrigin(0, 0);
        t.setDepth(0);
        if (Math.random() < 0.08) t.setTint(0x6a4a8a);
      }
    }
    // Banners for visual framing
    this.add.image(120, 120, 'banner').setDepth(2).setScale(1.0);
    this.add.image(width - 120, 120, 'banner').setDepth(2).setScale(1.0).setFlipX(true);
    
    // Walls
    this.walls = this.physics.add.staticGroup();
    
    // Boundary walls
    this.createWall(0, 0, width, 48);
    this.createWall(0, height - 48, width, 48);
    this.createWall(0, 0, 48, height);
    this.createWall(width - 48, 0, 48, height);
    
    // Interior obstacles (for boss stun mechanic)
    this.createArenaObstacle(300, 250, 64, 64);
    this.createArenaObstacle(980, 250, 64, 64);
    this.createArenaObstacle(640, 480, 80, 80);
    this.createArenaObstacle(200, 550, 48, 48);
    this.createArenaObstacle(1080, 550, 48, 48);
  }
  
  private createWall(x: number, y: number, w: number, h: number): void {
    // Tile the wall area with stone wall texture (keep collider via staticGroup)
    for (let tx = x; tx < x + w; tx += 32) {
      for (let ty = y; ty < y + h; ty += 32) {
        const wt = this.add.image(tx, ty, 'wall_stone').setOrigin(0, 0);
        wt.setDepth(1);
        wt.setTint(0x3a2a4a);
      }
    }
    const collider = this.add.rectangle(x + w / 2, y + h / 2, w, h);
    collider.setVisible(false);
    this.walls.add(collider);
  }
  
  private createArenaObstacle(x: number, y: number, w: number, h: number): void {
    // Visual obstacle: rock + crystal accent; collider remains the rectangle itself.
    const rock = this.add.image(x, y, 'rock').setDepth(5).setScale(1.6);
    rock.setTint(0x4a3a5a);
    const crystal = this.add.image(x, y - 18, 'crystal').setDepth(6).setScale(1.2);
    const glow = this.add.circle(x, y - 14, 40, 0x9fd3ff, 0.10).setDepth(4);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: [crystal, glow], alpha: { from: 0.75, to: 1 }, yoyo: true, repeat: -1, duration: 1100 });

    const obstacle = this.add.rectangle(x, y, w, h);
    obstacle.setVisible(false);
    this.physics.add.existing(obstacle, true);
    this.obstacles.push(obstacle);
  }
  
  private spawnBoss(): void {
    this.boss = new ForgettingStag(this, 640, 180);
    
    // Listen for boss defeat
    this.boss.on('defeated', () => {
      this.onBossDefeated();
    });
  }
  
  private createBossHpBar(): void {
    this.bossHpBar = this.add.graphics();
    this.bossHpBar.setDepth(1000);
    this.updateBossHpBar();
  }
  
  private updateBossHpBar(): void {
    if (!this.bossHpBar || !this.boss) return;
    
    this.bossHpBar.clear();
    
    const barWidth = 400;
    const barHeight = 24;
    const x = 440;
    const y = 30;
    
    // Background
    this.bossHpBar.fillStyle(0x000000, 0.8);
    this.bossHpBar.fillRect(x, y, barWidth, barHeight);
    
    // Border
    this.bossHpBar.lineStyle(2, 0xffffff, 1);
    this.bossHpBar.strokeRect(x, y, barWidth, barHeight);
    
    // HP fill
    const hpPercent = this.boss.getHpPercent();
    const fillWidth = (barWidth - 4) * hpPercent;
    
    const hpColor = hpPercent > 0.5 ? 0x8b00ff : 0xff0000;
    this.bossHpBar.fillStyle(hpColor, 1);
    this.bossHpBar.fillRect(x + 2, y + 2, fillWidth, barHeight - 4);
    
    // Boss name
    if (!this.bossHpBar.getData('nameText')) {
      const nameText = this.add.text(640, 15, 'Forgetting Stag', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      });
      nameText.setOrigin(0.5, 0.5);
      nameText.setDepth(1001);
      this.bossHpBar.setData('nameText', nameText);
    }
  }
  
  private handleBossHitPlayer(): void {
    if (!this.player.isInvulnerable() && this.boss) {
      this.player.takeDamage(this.boss.getDamage(), this.boss.x, this.boss.y);
    }
  }
  
  private onBossDefeated(): void {
    this.gameState.data.bossDefeated = true;
    this.gameState.data.hasMemorySigil = true;
    this.gameState.setObjective('Regresa con Gabi con el Sigilo de Memoria.');
    
    // Clear HP bar
    if (this.bossHpBar) {
      this.bossHpBar.clear();
      const nameText = this.bossHpBar.getData('nameText');
      if (nameText) {
        nameText.destroy();
      }
    }
    
    // Show victory dialogue
    this.time.delayedCall(1000, () => {
      this.dialogueSystem.start(DialogScript.bossDefeated, () => {
        // Add exit door
        this.createExitDoor();
      });
    });
  }
  
  private createExitDoor(): void {
    const doorX = 640;
    const doorY = 640; // Moved up from 700 to be more accessible
    
    // Visual door (sprite)
    const door = this.add.image(doorX, doorY, 'door').setDepth(10).setScale(2);
    
    // Add a glowing effect so it's obvious
    const glow = this.add.circle(doorX, doorY, 50, 0xffd700, 0.3);
    glow.setDepth(9);
    
    // Pulsing glow animation
    this.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    console.log('Exit door created at:', doorX, doorY);
    
    // Register with interact system - larger radius for easier interaction
    this.interactSystem.register({
      id: 'boss-exit-door',
      x: doorX,
      y: doorY,
      radius: 80, // Increased from default for easier access
      promptText: 'Presiona E para salir',
      onInteract: () => {
        console.log('Door interaction triggered!');
        musicManager.stop(); // Stop boss music
        RoomTransitions.transition(this, 'OverworldScene', 1920, 900);
      }
    });
    
    console.log('Exit door registered with InteractSystem');
  }
}

