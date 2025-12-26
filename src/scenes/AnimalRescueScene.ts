import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';

export class AnimalRescueScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  
  constructor() {
    super({ key: 'AnimalRescueScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // After talking with Gabi use '1', after library solved use '4'
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play(this.gameState.data.metGabi ? '1' : '0');
    
    // Setup systems FIRST (before creating map, as createRescueMap uses interactSystem)
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Create rescue house interior
    this.createRescueMap();
    
    // Create player
    const spawnX = this.gameState.data.spawnScene === 'AnimalRescueScene' 
      ? this.gameState.data.spawnX 
      : 640;
    const spawnY = this.gameState.data.spawnScene === 'AnimalRescueScene' 
      ? this.gameState.data.spawnY 
      : 650;
    
    this.player = new Player(this, spawnX, spawnY);
    
    // Setup collisions
    this.physics.add.collider(this.player, this.walls);
    
    // Setup interactions
    this.setupInteractions();
    
    // Camera
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Discovery dialogue
    if (!this.gameState.data.foundAnimalRescue) {
      this.gameState.data.foundAnimalRescue = true;
      this.time.delayedCall(500, () => {
        this.dialogueSystem.start([
          {
            speaker: 'June',
            text: "The rescue house! I volunteer here every weekend."
          },
          {
            speaker: 'June',
            text: "I hope the animals are okay without me today..."
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
    } else {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      
      if (this.inputRouter.isConfirmPressed()) {
        this.dialogueSystem.advance();
      }
    }
    
    this.player.preUpdate(this.time.now, this.game.loop.delta);
  }
  
  private createRescueMap(): void {
    const width = 1280;
    const height = 720;
    const tileSize = 32;
    
    // Warm tiled floor (texture)
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const tile = this.add.image(x, y, 'floor_tile_beige').setOrigin(0, 0);
        tile.setDepth(0);
        if (Math.random() < 0.06) tile.setTint(0xfff1d6);
      }
    }
    
    // Cozy warm light overlay
    const warm = this.add.rectangle(640, 360, 1280, 720, 0xffd7a1, 0.06);
    warm.setDepth(900);
    warm.setBlendMode(Phaser.BlendModes.SCREEN);
    
    this.walls = this.physics.add.staticGroup();
    
    // Walls
    const wallData = [
      { x: 0, y: 0, w: 1280, h: 64 },
      { x: 0, y: 656, w: 576, h: 64 }, // Left of door
      { x: 704, y: 656, w: 576, h: 64 }, // Right of door
      { x: 0, y: 64, w: 64, h: 592 },
      { x: 1216, y: 64, w: 64, h: 592 }
    ];
    
    wallData.forEach(wall => {
      const rect = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, 0x8b7355);
      rect.setDepth(2);
      
      // Add collision box
      const collider = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h);
      collider.setVisible(false);
      this.walls.add(collider);
    });
    
    // Kennels/Cages
    this.createKennel(200, 200, 'Buddy');
    this.createKennel(200, 400, 'Luna');
    this.createKennel(1000, 200, 'Max');
    this.createKennel(1000, 400, 'Bella');
    
    // Central desk area - KEY IS HERE
    this.createDesk(640, 360);
    
    // Supply shelves
    this.createSupplyShelf(640, 100);
    
    // Food/water station
    this.createFoodStation(400, 500);
    
    // Exit door
    const door = this.add.image(640, 688, 'door').setDepth(3).setScale(2).setTint(0xbfa58a);
  }
  
  private createKennel(x: number, y: number, petName: string): void {
    // Kennel structure (sprite)
    const kennel = this.add.image(x, y, 'kennel');
    kennel.setDepth(3);
    kennel.setScale(0.95);
    
    // Pet (sprite)
    const petKey = Math.random() > 0.5 ? 'pet_dog' : 'pet_cat';
    const pet = this.add.image(x, y + 10, petKey);
    pet.setDepth(4);
    pet.setScale(1.2);
    
    // Bed + bowl (small props)
    const bed = this.add.rectangle(x, y + 40, 60, 18, 0x8b0000, 0.35);
    bed.setDepth(3);
    const bowl = this.add.rectangle(x - 35, y + 45, 16, 8, 0x2b5f8a, 0.7);
    bowl.setDepth(3);
    
    // Name tag
    const nameTag = this.add.text(x, y - 80, petName, {
      fontSize: '14px',
      color: '#654321',
      fontFamily: 'Arial'
    });
    nameTag.setOrigin(0.5, 0.5);
    nameTag.setDepth(4);
    
    // Sleeping animation
    this.tweens.add({
      targets: pet,
      y: { from: pet.y - 2, to: pet.y + 2 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 1500
    });
    
    // Interaction
    this.interactSystem.register({
      id: `pet-${petName}`,
      x,
      y,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para acariciar',
      onInteract: () => {
        const messages = [
          `${petName} mueve la cola feliz.`,
          `${petName} ronronea contento.`,
          `${petName} se ve en paz.`,
          `${petName} duerme profundamente.`
        ];
        this.dialogueSystem.start([
          {
            speaker: 'June',
            text: messages[Math.floor(Math.random() * messages.length)]
          }
        ]);
      }
    });
  }
  
  private createDesk(x: number, y: number): void {
    // Desk surface
    const desk = this.add.rectangle(x, y, 150, 80, 0x8b4513);
    desk.setDepth(4);
    
    // Papers scattered
    const paper1 = this.add.rectangle(x - 30, y - 10, 30, 40, 0xffffff);
    paper1.setDepth(5);
    
    const paper2 = this.add.rectangle(x + 20, y + 10, 30, 40, 0xffffff);
    paper2.setDepth(5);
    paper2.setRotation(0.3);
    
    // KEY on desk (if not taken)
    if (!this.gameState.data.hasLibraryUndergroundKey) {
      const key = this.add.image(x, y, 'key_item');
      key.setScale(1.5);
      key.setDepth(6);
      
      // Sparkle effect
      const sparkle = this.add.circle(x, y, 20, 0xffd700, 0.3);
      sparkle.setDepth(5);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.2, to: 0.5 },
        scale: { from: 1, to: 1.3 },
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        duration: 800
      });
      
      // Register interaction
      this.interactSystem.register({
        id: 'library-underground-key',
        x: x,
        y: y,
        radius: GameConfig.INTERACT_RADIUS,
        promptText: 'Presiona E para tomar la llave',
        onInteract: () => {
          this.gameState.data.hasLibraryUndergroundKey = true;
          this.gameState.setObjective('Usa el túnel del sótano de la cabaña para llegar a la biblioteca.');
          
          key.destroy();
          sparkle.destroy();
          this.interactSystem.unregister('library-underground-key');
          
          this.dialogueSystem.start([
            {
              speaker: 'June',
              text: "¡La llave del túnel subterráneo! Sabía que la dejé en algún lado."
            },
            {
              speaker: 'June',
              text: "¡Puedo entrar a la biblioteca por el túnel del sótano debajo de la cabaña!"
            }
          ]);
        }
      });
    }
  }
  
  private createSupplyShelf(x: number, y: number): void {
    const shelf = this.add.graphics();
    shelf.fillStyle(0x6b4423, 1);
    shelf.fillRect(x - 100, y, 200, 50);
    shelf.fillRect(x - 95, y - 40, 190, 5);
    shelf.fillRect(x - 95, y - 20, 190, 5);
    shelf.setDepth(3);
    
    // Medicine bottles
    shelf.fillStyle(0xff0000, 1);
    shelf.fillRect(x - 70, y - 35, 10, 15);
    shelf.fillStyle(0x0000ff, 1);
    shelf.fillRect(x - 50, y - 35, 10, 15);
    shelf.fillStyle(0x00ff00, 1);
    shelf.fillRect(x - 30, y - 35, 10, 15);
  }
  
  private createFoodStation(x: number, y: number): void {
    // Food bowl (orange)
    const foodBowl = this.add.circle(x - 30, y, 20, 0xff8c42);
    foodBowl.setDepth(3);
    
    // Water bowl (blue)
    const waterBowl = this.add.circle(x + 30, y, 20, 0x4a90e2);
    waterBowl.setDepth(3);
    
    this.interactSystem.register({
      id: 'food-station',
      x,
      y,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para revisar',
      onInteract: () => {
        this.dialogueSystem.start([
          {
            speaker: 'June',
            text: "Los tazones de comida y agua todavía están llenos. Bien."
          }
        ]);
      }
    });
  }
  
  private setupInteractions(): void {
    // Exit door
    this.interactSystem.register({
      id: 'rescue-exit',
      x: 640,
      y: 688,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para salir',
      onInteract: () => {
        // Rescue sits in the West outdoor room now
        RoomTransitions.transition(this, 'WestForestScene', 780, 960);
      }
    });
  }
}

