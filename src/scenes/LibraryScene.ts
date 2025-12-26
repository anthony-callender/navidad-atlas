import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogScriptES as DialogScript } from '../content/DialogScriptES';
import { PuzzleConfig, PuzzleSymbol } from '../content/PuzzleConfig';
import { musicManager } from '../audio/MusicManager';

export class LibraryScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  
  private puzzleStones: Map<string, { current: PuzzleSymbol, visual: Phaser.GameObjects.Container }> = new Map();
  private puzzleSolved = false;
  private chestSpawned = false;
  
  constructor() {
    super({ key: 'LibraryScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // After entering library
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : '3');
    
    // Setup systems FIRST (before creating map and puzzle)
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Create library interior
    this.createLibraryMap();
    
    // Create player
    const spawnX = this.gameState.data.spawnScene === 'LibraryScene' 
      ? this.gameState.data.spawnX 
      : 640;
    const spawnY = this.gameState.data.spawnScene === 'LibraryScene' 
      ? this.gameState.data.spawnY 
      : 600;
    
    this.player = new Player(this, spawnX, spawnY);
    
    // Setup collisions
    this.physics.add.collider(this.player, this.walls);
    
    // Setup puzzle
    this.setupPuzzle();
    
    // Setup interactions
    this.setupInteractions();
    
    // Camera
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
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
    } else {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      
      if (this.inputRouter.isConfirmPressed()) {
        this.dialogueSystem.advance();
      }
    }
    
    this.player.preUpdate(this.time.now, this.game.loop.delta);
  }
  
  private createLibraryMap(): void {
    const width = 1280;
    const height = 720;
    const tileSize = 32;
    
    // Dark hardwood floor (tile texture)
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const tile = this.add.image(x, y, 'floor_wood_dark').setOrigin(0, 0);
        tile.setDepth(0);
        if (Math.random() < 0.05) tile.setTint(0xd6c4a6);
      }
    }
    
    // Library rug (sprite)
    const rug = this.add.image(640, 410, 'rug_library');
    rug.setDepth(1);
    rug.setScale(480 / 256, 320 / 192);
    
    // Soft dust motes / ambience
    for (let i = 0; i < 18; i++) {
      const p = this.add.image(200 + Math.random() * 880, 120 + Math.random() * 420, 'particle');
      p.setDepth(2);
      p.setAlpha(0.08 + Math.random() * 0.10);
      p.setScale(1 + Math.random() * 1.4);
      p.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: p,
        y: p.y - (20 + Math.random() * 60),
        x: p.x + (-20 + Math.random() * 40),
        alpha: { from: p.alpha, to: 0 },
        duration: 5000 + Math.random() * 4000,
        repeat: -1,
        delay: Math.random() * 2000
      });
    }
    
    this.walls = this.physics.add.staticGroup();
    
    // Walls
    // IMPORTANT: bottom wall has DOOR GAPS so the player can reach/interact with exits.
    // Front door is at x=640, Basement door is at x=200.
    const wallData = [
      // Top wall
      { x: 0, y: 0, w: 1280, h: 64 },
      // Bottom wall segments (y=656..720)
      { x: 0, y: 656, w: 140, h: 64 },      // left-most segment
      { x: 260, y: 656, w: 316, h: 64 },    // between basement gap and front door gap
      { x: 704, y: 656, w: 576, h: 64 },    // right side of front door gap
      // Side walls
      { x: 0, y: 64, w: 64, h: 592 },
      { x: 1216, y: 64, w: 64, h: 592 }
    ];
    
    wallData.forEach(wall => {
      const rect = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, 0x3a2010);
      rect.setDepth(1);
      
      // Add invisible collider
      const collider = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h);
      collider.setVisible(false);
      this.walls.add(collider);
    });
    
    // Bookshelves (sprites)
    this.add.image(200, 240, 'bookshelf').setDepth(3).setScale(0.8);
    this.add.image(200, 440, 'bookshelf').setDepth(3).setScale(0.8);
    this.add.image(1080, 240, 'bookshelf').setDepth(3).setScale(0.8);
    this.add.image(1080, 440, 'bookshelf').setDepth(3).setScale(0.8);
    
    // Reading tables (sprites) + chairs
    this.add.image(360, 190, 'table_wood').setDepth(4).setScale(0.9);
    this.add.image(920, 190, 'table_wood').setDepth(4).setScale(0.9);
    this.add.image(300, 210, 'chair_wood').setDepth(4).setScale(1.0);
    this.add.image(980, 210, 'chair_wood').setDepth(4).setScale(1.0);
    
    // Lamps (warm pools)
    const lampA = this.add.image(520, 170, 'lamp').setDepth(5).setScale(1.0);
    const glowA = this.add.circle(520, 170, 110, 0xffe8b0, 0.08).setDepth(2);
    glowA.setBlendMode(Phaser.BlendModes.SCREEN);
    const lampB = this.add.image(760, 170, 'lamp').setDepth(5).setScale(1.0);
    const glowB = this.add.circle(760, 170, 110, 0xffe8b0, 0.08).setDepth(2);
    glowB.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: [lampA, glowA], alpha: { from: 0.92, to: 1 }, yoyo: true, repeat: -1, duration: 1500 });
    this.tweens.add({ targets: [lampB, glowB], alpha: { from: 0.92, to: 1 }, yoyo: true, repeat: -1, duration: 1600 });
    
    // Exit doors
    const frontDoor = this.add.image(640, 688, 'door').setDepth(2).setScale(2);
    const basementDoor = this.add.image(200, 688, 'door').setDepth(2).setScale(2).setTint(0x9b8b7a);
  }
  
  // Bookshelves are now sprite-based (see `createLibraryMap`), so we keep no extra method here.
  
  private setupPuzzle(): void {
    const baseX = 640;
    const baseY = 400;
    const spacing = 100;
    
    ['A', 'B', 'C'].forEach((id, index) => {
      const x = baseX + (index - 1) * spacing;
      const y = baseY;
      
      const container = this.add.container(x, y);
      
      const stone = this.add.image(0, 0, 'puzzle_stone');
      container.add(stone);
      
      const symbol = this.add.text(0, 0, 'PINE', {
        fontSize: '11px',
        color: '#6a8aaa',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      });
      symbol.setOrigin(0.5, 0.5);
      container.add(symbol);
      
      const glow = this.add.circle(0, 0, 18, 0x6a8aaa, 0.15);
      container.addAt(glow, 1);
      
      container.setDepth(8);
      
      this.puzzleStones.set(`stone${id}`, {
        current: 'PINE',
        visual: container
      });
      
      // Register interaction
      this.interactSystem.register({
        id: `puzzle-stone-${id}`,
        x: container.x,
        y: container.y,
        radius: GameConfig.INTERACT_RADIUS,
        promptText: 'Presiona E para cambiar el símbolo',
        onInteract: () => {
          if (!this.puzzleSolved) {
            this.cycleStoneSymbol(`stone${id}`);
          }
        }
      });
    });
    
    // Hint books
    this.createHintBook(300, 200, 1);
    this.createHintBook(900, 200, 2);
    
    // Check if already solved
    if (this.gameState.data.hasKeyRelic) {
      this.puzzleSolved = true;
      this.chestSpawned = false; // Chest already taken
    }
  }
  
  private createHintBook(x: number, y: number, noteNum: number): void {
    const book = this.add.rectangle(x, y, 30, 40, 0x8b4513);
    book.setDepth(5);
    
    this.interactSystem.register({
      id: `hint-book-${noteNum}`,
      x,
      y,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para leer',
      onInteract: () => {
        if (noteNum === 1) {
          this.dialogueSystem.start(DialogScript.puzzleHint1);
        } else {
          this.dialogueSystem.start(DialogScript.puzzleHint2);
        }
      }
    });
  }
  
  private cycleStoneSymbol(stoneId: string): void {
    const stoneData = this.puzzleStones.get(stoneId);
    if (!stoneData) return;
    
    const symbols = PuzzleConfig.symbols;
    const currentIndex = symbols.indexOf(stoneData.current);
    const nextIndex = (currentIndex + 1) % symbols.length;
    stoneData.current = symbols[nextIndex];
    
    const symbolText = stoneData.visual.list[2] as Phaser.GameObjects.Text;
    if (symbolText) {
      symbolText.setText(stoneData.current);
    }
    
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
    
    this.dialogueSystem.start(DialogScript.puzzleSolved, () => {
      this.spawnChest();
    });
  }
  
  private spawnChest(): void {
    const chestX = 640;
    const chestY = 500;
    
    const chest = this.add.rectangle(chestX, chestY, 48, 32, 0x8b4513);
    chest.setDepth(7);
    
    const lock = this.add.rectangle(chestX, chestY, 12, 12, 0xffd700);
    lock.setDepth(8);
    
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
          
          chest.destroy();
          lock.destroy();
          this.interactSystem.unregister('puzzle-chest');
        }
      }
    });
  }
  
  private setupInteractions(): void {
    // Front door (to overworld)
    this.interactSystem.register({
      id: 'library-front-door',
      x: 640,
      y: 688,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para salir',
      onInteract: () => {
        // Library exterior sits in the South outdoor room now
        RoomTransitions.transition(this, 'SouthForestScene', 1280, 1320);
      }
    });
    
    // Basement door (to tunnel)
    this.interactSystem.register({
      id: 'library-basement-door',
      x: 200,
      y: 688,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para ir al sótano',
      onInteract: () => {
        this.gameState.data.tunnelRunFrom = 'library';
        RoomTransitions.transition(this, 'TunnelRunScene', 120, 620);
      }
    });
  }
}

