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

export class CabinScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  
  private isFirstVisit = true;
  private hasShownEnding = false;
  private tonySprite: Phaser.GameObjects.Sprite | null = null;
  private christmasTree: Phaser.GameObjects.Image | null = null;
  private isDecoratingTree = false;
  private setTreeDecoratedOnce = false;
  
  constructor() {
    super({ key: 'CabinScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // Music timeline:
    // - before meeting Gabi: '0'
    // - after final village (winter blessing): 'silent_night' until end
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : (this.gameState.data.metGabi ? '1' : '0'));
    
    // Create tilemap (cabin interior)
    this.createCabinMap();
    
    // Create player
    const spawnX = this.gameState.data.spawnScene === 'CabinScene' 
      ? this.gameState.data.spawnX 
      : 640;
    const spawnY = this.gameState.data.spawnScene === 'CabinScene' 
      ? this.gameState.data.spawnY 
      : 360;
    
    this.player = new Player(this, spawnX, spawnY);
    
    // Setup systems
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Setup collisions
    this.physics.add.collider(this.player, this.walls);
    
    // Setup interactions
    this.setupInteractions();
    
    // Camera
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Show intro dialogue on first visit
    if (this.isFirstVisit && !this.gameState.data.metGabi) {
      this.time.delayedCall(500, () => {
        this.dialogueSystem.start(DialogScript.cabinStart);
      });
      this.isFirstVisit = false;
    }
    
    // Check for ending
    if (this.gameState.data.gabrielRevealed && !this.hasShownEnding) {
      this.checkForEnding();
    }
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
    
    // Check for restart
    if (this.hasShownEnding && this.inputRouter.isEnterPressed()) {
      this.restartGame();
    }
    
    this.player.preUpdate(this.time.now, this.game.loop.delta);
  }
  
  private createCabinMap(): void {
    const width = 1280;
    const height = 720;
    const tileSize = 32;
    
    // Create tiled wood floor (subtle variation for richness)
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const tile = this.add.image(x, y, 'floor_wood');
        tile.setOrigin(0, 0);
        tile.setDepth(0);
        const r = Math.random();
        if (r < 0.06) tile.setTint(0xf2e3c8);
        else if (r < 0.10) tile.setTint(0xe8d2b0);
      }
    }
    
    // Rug (sprite, richer than the old Graphics rectangle)
    const rug = this.add.image(640, 460, 'rug_cabin');
    rug.setDepth(1);
    rug.setScale(480 / 256, 320 / 192);
    
    // Windows + cozy ambience
    const win1 = this.add.image(240, 120, 'window_snow').setDepth(2).setScale(0.9);
    const win2 = this.add.image(1040, 120, 'window_snow').setDepth(2).setScale(0.9);
    win1.setAlpha(0.95);
    win2.setAlpha(0.95);
    
    // Warm light overlay (subtle)
    const warm = this.add.rectangle(640, 360, 1280, 720, 0xffb36b, 0.07);
    warm.setDepth(900);
    warm.setBlendMode(Phaser.BlendModes.SCREEN);
    
    // Walls (as tiles)
    this.walls = this.physics.add.staticGroup();
    
    const wallData = [
      // Top wall
      { x: 0, y: 0, w: 1280, h: 64 },
      // Bottom wall - left side of door
      { x: 0, y: 656, w: 576, h: 64 },
      // Bottom wall - right side of door
      { x: 704, y: 656, w: 576, h: 64 },
      // Left wall
      { x: 0, y: 64, w: 64, h: 592 },
      // Right wall
      { x: 1216, y: 64, w: 64, h: 592 }
    ];
    
    wallData.forEach(wallSection => {
      // Create tiled walls
      for (let x = wallSection.x; x < wallSection.x + wallSection.w; x += tileSize) {
        for (let y = wallSection.y; y < wallSection.y + wallSection.w; y += tileSize) {
          if (x < wallSection.x + wallSection.w && y < wallSection.y + wallSection.h) {
            const wallTile = this.add.image(x, y, 'wall_wood');
            wallTile.setOrigin(0, 0);
            wallTile.setDepth(1);
          }
        }
      }
      
      // Add collision
      const collider = this.add.rectangle(
        wallSection.x + wallSection.w / 2, 
        wallSection.y + wallSection.h / 2, 
        wallSection.w, 
        wallSection.h
      );
      collider.setOrigin(0.5, 0.5);
      collider.setVisible(false);
      this.walls.add(collider);
    });
    
    // Door (bottom center)
    const doorX = 640;
    const doorY = 688;
    const door = this.add.image(doorX, doorY, 'door');
    door.setScale(2);
    door.setDepth(2);
    
    // Basement door (bottom left corner)
    const basementDoor = this.add.rectangle(150, 650, 50, 30, 0x3a2a1a);
    basementDoor.setDepth(2);
    const basementLock = this.add.circle(150, 650, 5, 0xffd700);
    basementLock.setDepth(3);
    if (this.gameState.data.hasLibraryUndergroundKey) {
      basementLock.setVisible(false);
    }
    
    // Christmas tree - only show if Tony has arrived
    if (this.gameState.data.gabrielRevealed) {
      this.createChristmasTree(300, 300);
    }
    
    // Gift box
    this.createGiftBox(980, 300);
    
    // Add furniture for cozy cabin feel
    this.addCabinFurniture();
  }
  
  private addCabinFurniture(): void {
    // === DESIGN PHILOSOPHY: Warm, lived-in, cozy ===
    // Every object tells a story of comfort and home
    
    // FIREPLACE - warm focal point
    const fireplaceGraphics = this.add.graphics();
    
    // Stone base
    fireplaceGraphics.fillStyle(0x5a5a5a, 1);
    fireplaceGraphics.fillRect(1120, 180, 140, 160);
    
    // Individual stones
    fireplaceGraphics.fillStyle(0x6a6a6a, 0.8);
    fireplaceGraphics.fillRect(1122, 182, 40, 30);
    fireplaceGraphics.fillRect(1166, 182, 38, 28);
    fireplaceGraphics.fillRect(1208, 182, 35, 32);
    fireplaceGraphics.fillRect(1122, 216, 42, 34);
    fireplaceGraphics.fillRect(1170, 218, 36, 30);
    fireplaceGraphics.fillRect(1210, 220, 38, 28);
    
    // Hearth opening
    fireplaceGraphics.fillStyle(0x2a2a2a, 1);
    fireplaceGraphics.fillRect(1140, 260, 100, 60);
    
    // Fire - layered glow
    fireplaceGraphics.fillStyle(0xff6600, 1);
    fireplaceGraphics.fillCircle(1190, 300, 24);
    fireplaceGraphics.fillCircle(1170, 305, 18);
    fireplaceGraphics.fillCircle(1210, 305, 16);
    
    fireplaceGraphics.fillStyle(0xff9933, 0.9);
    fireplaceGraphics.fillCircle(1190, 295, 18);
    fireplaceGraphics.fillCircle(1175, 300, 14);
    fireplaceGraphics.fillCircle(1205, 300, 12);
    
    fireplaceGraphics.fillStyle(0xffcc66, 0.8);
    fireplaceGraphics.fillCircle(1190, 290, 14);
    fireplaceGraphics.fillCircle(1180, 295, 10);
    fireplaceGraphics.fillCircle(1200, 295, 8);
    
    // Ambient glow
    fireplaceGraphics.fillStyle(0xffa500, 0.15);
    fireplaceGraphics.fillCircle(1190, 290, 80);
    
    // Logs
    fireplaceGraphics.fillStyle(0x4a3020, 1);
    fireplaceGraphics.fillRect(1160, 310, 60, 8);
    fireplaceGraphics.fillRect(1170, 302, 50, 8);
    
    fireplaceGraphics.setDepth(4);

    // Extra set dressing (richer interior, still non-blocking)
    this.add.image(170, 230, 'bookshelf').setDepth(5).setScale(0.9);
    this.add.image(360, 240, 'table_wood').setDepth(5).setScale(1.1);
    this.add.image(300, 260, 'chair_wood').setDepth(5).setScale(1.2);

    const lamp1 = this.add.image(520, 250, 'lamp').setDepth(6).setScale(1.2);
    const glow1 = this.add.circle(520, 250, 90, 0xffe8b0, 0.10).setDepth(2);
    glow1.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: [lamp1, glow1], alpha: { from: 0.92, to: 1 }, yoyo: true, repeat: -1, duration: 1200 });

    const lamp2 = this.add.image(980, 210, 'lamp').setDepth(6).setScale(1.1);
    const glow2 = this.add.circle(980, 210, 90, 0xffe8b0, 0.10).setDepth(2);
    glow2.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: [lamp2, glow2], alpha: { from: 0.92, to: 1 }, yoyo: true, repeat: -1, duration: 1300 });

    this.add.image(1180, 420, 'plant_pot').setDepth(6).setScale(1.4);
    
    // TABLE - sturdy wooden table
    const tableGraphics = this.add.graphics();
    
    // Tabletop - rich wood
    tableGraphics.fillStyle(0x8b6446, 1);
    tableGraphics.fillRect(480, 380, 160, 100);
    
    // Wood grain highlights
    tableGraphics.fillStyle(0x9d7556, 0.6);
    tableGraphics.fillRect(485, 385, 150, 40);
    
    // Edge shadow
    tableGraphics.fillStyle(0x6b4c32, 0.7);
    tableGraphics.fillRect(480, 470, 160, 10);
    tableGraphics.fillRect(630, 380, 10, 100);
    
    // Table legs
    tableGraphics.fillStyle(0x7a5c42, 1);
    tableGraphics.fillRect(490, 480, 12, 40);
    tableGraphics.fillRect(618, 480, 12, 40);
    
    // Knots in wood
    tableGraphics.fillStyle(0x5a4432, 0.6);
    tableGraphics.fillCircle(520, 410, 4);
    tableGraphics.fillCircle(590, 440, 3);
    
    tableGraphics.setDepth(4);
    
    // CHAIRS - simple stools
    const chairGraphics = this.add.graphics();
    
    // Left chair
    chairGraphics.fillStyle(0x7a5c42, 1);
    chairGraphics.fillRect(440, 410, 32, 36);
    chairGraphics.fillStyle(0x8b6d4d, 0.7);
    chairGraphics.fillRect(442, 412, 28, 16);
    // Legs
    chairGraphics.fillStyle(0x6b4c32, 1);
    chairGraphics.fillRect(444, 446, 8, 24);
    chairGraphics.fillRect(456, 446, 8, 24);
    
    // Right chair
    chairGraphics.fillStyle(0x7a5c42, 1);
    chairGraphics.fillRect(660, 410, 32, 36);
    chairGraphics.fillStyle(0x8b6d4d, 0.7);
    chairGraphics.fillRect(662, 412, 28, 16);
    // Legs
    chairGraphics.fillStyle(0x6b4c32, 1);
    chairGraphics.fillRect(664, 446, 8, 24);
    chairGraphics.fillRect(676, 446, 8, 24);
    
    chairGraphics.setDepth(4);
    
    // SHELVES - wall decoration
    const shelfGraphics = this.add.graphics();
    
    shelfGraphics.fillStyle(0x7a5c42, 1);
    shelfGraphics.fillRect(150, 200, 120, 10);
    shelfGraphics.fillRect(150, 260, 120, 10);
    
    // Items on shelves (mugs, bottles)
    shelfGraphics.fillStyle(0x8b4513, 0.9);
    shelfGraphics.fillRect(160, 192, 12, 8);
    shelfGraphics.fillRect(190, 192, 12, 8);
    shelfGraphics.fillRect(220, 192, 12, 8);
    
    shelfGraphics.fillStyle(0x006400, 0.8);
    shelfGraphics.fillRect(165, 252, 8, 8);
    shelfGraphics.fillRect(195, 252, 8, 8);
    
    shelfGraphics.setDepth(4);
    
    // MICRO-DETAILS: Environmental storytelling
    
    // Small candles
    const candleGraphics = this.add.graphics();
    candleGraphics.fillStyle(0xf4e4c4, 1);
    candleGraphics.fillRect(554, 390, 6, 12);
    candleGraphics.fillRect(900, 320, 6, 12);
    // Flames
    candleGraphics.fillStyle(0xffa500, 0.9);
    candleGraphics.fillCircle(557, 387, 4);
    candleGraphics.fillCircle(903, 317, 4);
    candleGraphics.fillStyle(0xffff99, 0.7);
    candleGraphics.fillCircle(557, 385, 3);
    candleGraphics.fillCircle(903, 315, 3);
    // Glow
    candleGraphics.fillStyle(0xffa500, 0.1);
    candleGraphics.fillCircle(557, 387, 20);
    candleGraphics.fillCircle(903, 317, 20);
    candleGraphics.setDepth(6);
  }
  
  private createChristmasTree(x: number, y: number): void {
    this.christmasTree = this.add.image(x, y, 'tree_christmas');
    this.christmasTree.setDepth(5);
  }
  
  private createGiftBox(x: number, y: number): void {
    const box = this.add.image(x, y, 'gift');
    box.setScale(2);
    box.setDepth(5);
  }
  
  private setupInteractions(): void {
    // Door to overworld
    this.interactSystem.register({
      id: 'cabin-door',
      x: 640,
      y: 660,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para salir',
      onInteract: () => {
        // Spawn outside at the cabin in the hub
        RoomTransitions.transition(this, 'OverworldScene', 640, 820);
      }
    });
    
    // Basement entrance (requires underground key)
    this.interactSystem.register({
      id: 'basement-door',
      x: 150,
      y: 650,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: this.gameState.data.hasLibraryUndergroundKey ? 'Presiona E para bajar al sótano' : 'Presiona E (cerrado)',
      onInteract: () => {
        if (this.gameState.data.hasLibraryUndergroundKey) {
          this.gameState.data.tunnelRunFrom = 'cabin';
          RoomTransitions.transition(this, 'TunnelRunScene', 120, 620);
        } else {
          this.dialogueSystem.start([
            {
              speaker: 'June',
              text: "El túnel del sótano está cerrado. ¿Dónde dejé esa llave?"
            }
          ]);
        }
      }
    });
    
    // Christmas tree
    this.interactSystem.register({
      id: 'christmas-tree',
      x: 300,
      y: 300,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para examinar',
      onInteract: () => {
        this.dialogueSystem.start(DialogScript.christmasTree);
      }
    });
    
    // Gift box
    this.interactSystem.register({
      id: 'gift-box',
      x: 980,
      y: 300,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para abrir',
      onInteract: () => {
        if (this.gameState.data.gabrielRevealed && this.gameState.data.hasGiftKeys && this.gameState.data.treeDecorated && !this.gameState.data.endingComplete) {
          this.openGift();
        } else {
          if (!this.gameState.data.hasGiftKeys) {
            this.dialogueSystem.start([{ speaker: 'June', text: "Todavía no tenemos las llaves de esta caja de regalo." }]);
          } else if (!this.gameState.data.treeDecorated) {
            this.dialogueSystem.start([{ speaker: 'June', text: "Todavía no. Primero el árbol. Luego el regalo." }]);
          } else {
            this.dialogueSystem.start(DialogScript.lockedGift);
          }
        }
      }
    });
  }
  
  private checkForEnding(): void {
    // Tony appears near the door
    if (!this.tonySprite) {
      this.tonySprite = this.add.sprite(400, 400, 'tony');
      this.tonySprite.setScale(2);
      this.tonySprite.setDepth(10);
    }
    
    // Tony talks, then they decorate the tree together
    this.time.delayedCall(1000, () => {
      this.dialogueSystem.start(DialogScript.cabinEnding, () => {
        // After dialogue, start tree decoration animation
        this.playTreeDecorationAnimation();
      });
    });
  }
  
  private playTreeDecorationAnimation(): void {
    if (this.isDecoratingTree) return;
    this.isDecoratingTree = true;
    
    // Freeze player movement during animation
    this.player.move(0, 0, null);
    
    const treeX = 300;
    const treeY = 300;
    
    // Show message
    const decorateText = this.add.text(640, 100, 'Decorando el árbol juntos...', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
      fontFamily: 'Arial'
    });
    decorateText.setOrigin(0.5, 0.5);
    decorateText.setDepth(1000);
    decorateText.setScrollFactor(0);
    
    // Move June and Tony to tree
    const juneTargetX = treeX + 60;
    const juneTargetY = treeY + 40;
    const tonyTargetX = treeX - 60;
    const tonyTargetY = treeY + 40;
    
    // Animate characters moving to tree
    this.tweens.add({
      targets: this.player,
      x: juneTargetX,
      y: juneTargetY,
      duration: 1500,
      ease: 'Power2'
    });
    
    if (this.tonySprite) {
      this.tweens.add({
        targets: this.tonySprite,
        x: tonyTargetX,
        y: tonyTargetY,
        duration: 1500,
        ease: 'Power2'
      });
    }
    
    // After moving, create the tree with sparkle effect
    this.time.delayedCall(1500, () => {
      // Create bare tree first (no decorations)
      const bareTree = this.add.graphics();
      bareTree.fillStyle(0x6b4423, 1);
      bareTree.fillRect(treeX - 6, treeY + 30, 12, 24);
      bareTree.fillStyle(0x1a4a1a, 1);
      bareTree.fillTriangle(treeX, treeY - 10, treeX - 30, treeY + 20, treeX + 30, treeY + 20);
      bareTree.fillTriangle(treeX, treeY + 5, treeX - 25, treeY + 30, treeX + 25, treeY + 30);
      bareTree.fillTriangle(treeX, treeY + 15, treeX - 20, treeY + 40, treeX + 20, treeY + 40);
      bareTree.setDepth(4);
      
      // Add decorations one by one with sparkles
      const ornamentPositions = [
        {x: treeX - 15, y: treeY + 10, c: 0xff0000},
        {x: treeX + 15, y: treeY + 8, c: 0x0000ff},
        {x: treeX, y: treeY + 18, c: 0xffd700},
        {x: treeX - 10, y: treeY + 25, c: 0xff69b4},
        {x: treeX + 12, y: treeY + 23, c: 0xff0000},
        {x: treeX - 8, y: treeY + 35, c: 0x0000ff},
        {x: treeX + 10, y: treeY + 32, c: 0xffd700}
      ];
      
      let ornamentIndex = 0;
      const addOrnament = () => {
        if (ornamentIndex >= ornamentPositions.length) {
          // All ornaments placed, add star
          this.time.delayedCall(300, () => {
            const star = this.add.star(treeX, treeY - 15, 5, 6, 10, 0xffd700);
            star.setDepth(6);
            
            // Sparkle effect
            const sparkle = this.add.circle(treeX, treeY - 15, 20, 0xffff00, 0.6);
            sparkle.setDepth(7);
            this.tweens.add({
              targets: sparkle,
              alpha: 0,
              scale: 2,
              duration: 800,
              onComplete: () => sparkle.destroy()
            });
            
            // Finish animation
            this.time.delayedCall(1000, () => {
              bareTree.destroy();
              decorateText.destroy();
              
              // Replace with fully decorated tree sprite
              this.createChristmasTree(treeX, treeY);
              
              // Show completion message
              const doneText = this.add.text(640, 360, 'The tree looks beautiful!', {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#00000088',
                padding: { x: 20, y: 10 },
                fontFamily: 'Arial'
              });
              doneText.setOrigin(0.5, 0.5);
              doneText.setDepth(1000);
              doneText.setScrollFactor(0);
              
              this.time.delayedCall(2000, () => {
                doneText.destroy();
                this.isDecoratingTree = false;
                if (!this.setTreeDecoratedOnce) {
                  this.setTreeDecoratedOnce = true;
                  this.gameState.data.treeDecorated = true;
                }
                // Now player can open the gift!
              });
            });
          });
          return;
        }
        
        const pos = ornamentPositions[ornamentIndex];
        const ornament = this.add.circle(pos.x, pos.y, 3, pos.c);
        ornament.setDepth(5);
        
        // Sparkle effect
        const sparkle = this.add.circle(pos.x, pos.y, 10, 0xffffff, 0.8);
        sparkle.setDepth(6);
        this.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 1.5,
          duration: 400,
          onComplete: () => sparkle.destroy()
        });
        
        ornamentIndex++;
        this.time.delayedCall(400, addOrnament);
      };
      
      addOrnament();
    });
  }
  
  private openGift(): void {
    this.gameState.data.endingComplete = true;
    this.hasShownEnding = true;
    
    this.dialogueSystem.start(DialogScript.giftOpened, () => {
      // Show end screen
      const uiScene = this.scene.get('UIScene') as any;
      if (uiScene && uiScene.showEndScreen) {
        uiScene.showEndScreen();
      }
    });
  }
  
  private restartGame(): void {
    this.gameState.reset();
    this.hasShownEnding = false;
    this.isFirstVisit = true;
    this.setTreeDecoratedOnce = false;
    this.scene.restart();
  }
}

