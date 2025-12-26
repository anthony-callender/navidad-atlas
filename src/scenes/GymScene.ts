import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';

export class GymScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  
  constructor() {
    super({ key: 'GymScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // After talking with Gabi (gym stage) OR after library solved (post-4)
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play(this.gameState.data.metGabi ? '1' : '0');
    
    // Setup systems FIRST (before creating map)
    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);
    
    // Create gym interior
    this.createGymMap();
    
    // Create player
    const spawnX = this.gameState.data.spawnScene === 'GymScene' 
      ? this.gameState.data.spawnX 
      : 640;
    const spawnY = this.gameState.data.spawnScene === 'GymScene' 
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
    if (!this.gameState.data.foundGym) {
      this.gameState.data.foundGym = true;
      this.time.delayedCall(500, () => {
        this.dialogueSystem.start([
          {
            speaker: 'June',
            text: "My gym! I haven't been here in... wow, way too long."
          },
          {
            speaker: 'June',
            text: "Maybe I left something important here?"
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
  
  private createGymMap(): void {
    const width = 1280;
    const height = 720;
    const tileSize = 32;
    
    // Rubber floor (tile texture)
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const tile = this.add.image(x, y, 'floor_rubber').setOrigin(0, 0);
        tile.setDepth(0);
        if (Math.random() < 0.05) tile.setTint(0x5f6670);
      }
    }
    
    // Gym mat zone (sprite, modern + clean)
    const mat = this.add.image(640, 360, 'rug_gym');
    mat.setDepth(1);
    mat.setScale(600 / 256, 400 / 192);
    
    // Cool overhead lighting
    const cool = this.add.rectangle(640, 360, 1280, 720, 0x7dc6ff, 0.05);
    cool.setDepth(900);
    cool.setBlendMode(Phaser.BlendModes.SCREEN);
    
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
      const rect = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h, 0x505050);
      rect.setDepth(2);
      
      // Add collision box
      const collider = this.add.rectangle(wall.x + wall.w / 2, wall.y + wall.h / 2, wall.w, wall.h);
      collider.setVisible(false);
      this.walls.add(collider);
    });
    
    // Equipment
    this.createEquipment();
    
    // Mirror wall (left side)
    this.createMirrorWall(100, 200);
    
    // Locker bench (right side) - KEY IS HERE
    this.createLockerBench(1050, 360);
    
    // Exit door
    const door = this.add.image(640, 688, 'door').setDepth(3).setScale(2).setTint(0xbfa58a);
  }
  
  private createEquipment(): void {
    // Treadmill (sprite)
    const treadmill = this.add.image(280, 260, 'gym_treadmill').setDepth(4).setScale(1.15);
    this.tweens.add({ targets: treadmill, y: { from: treadmill.y - 1, to: treadmill.y + 1 }, yoyo: true, repeat: -1, duration: 900 });
    
    // Weight bench (sprite-ish using existing table for shape)
    this.add.image(500, 285, 'table_wood').setDepth(4).setScale(0.7).setTint(0x2a2a2a);
    this.add.rectangle(500, 240, 90, 16, 0xaaaaaa, 0.9).setDepth(5);
    this.add.rectangle(460, 240, 18, 18, 0xaaaaaa, 0.95).setDepth(5);
    this.add.rectangle(540, 240, 18, 18, 0xaaaaaa, 0.95).setDepth(5);
    
    // Yoga mats
    this.createYogaMat(300, 500, 0xff69b4);
    this.createYogaMat(400, 500, 0x9370db);
    this.createYogaMat(500, 500, 0x00ced1);
    
    // Exercise ball
    const ball = this.add.circle(800, 300, 40, 0xff1493);
    ball.setDepth(4);
  }
  
  private createYogaMat(x: number, y: number, color: number): void {
    const mat = this.add.rectangle(x, y, 60, 120, color);
    mat.setDepth(3);
  }
  
  private createMirrorWall(x: number, y: number): void {
    this.add.image(x, y, 'gym_mirror').setDepth(2).setScale(1.1);
  }
  
  private createLockerBench(x: number, y: number): void {
    // Lockers (sprite)
    this.add.image(x, y, 'gym_locker').setDepth(4).setScale(1.0);
    
    // Bench
    const bench = this.add.rectangle(x, y + 150, 100, 30, 0x8b4513);
    bench.setDepth(4);
    
    // KEY on bench (if not taken) — gated by platform trial
    if (!this.gameState.data.hasLibraryOutdoorKey) {
      if (!this.gameState.data.platformTrialComplete) {
        const lock = this.add.circle(x, y + 150, 18, 0xffd700, 0.35);
        lock.setDepth(5);
        this.tweens.add({
          targets: lock,
          alpha: { from: 0.2, to: 0.5 },
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          duration: 900
        });

        this.interactSystem.register({
          id: 'library-outdoor-key-locked',
          x,
          y: y + 150,
          radius: GameConfig.INTERACT_RADIUS,
          promptText: 'Presiona E (cerrado)',
          onInteract: () => {
            this.dialogueSystem.start([
              { speaker: 'June', text: '¿Mi casillero… está cerrado? ¿Desde cuándo?' },
              { speaker: 'June', text: 'Afuera hay un arco raro brillando… tal vez es algún tipo de “prueba”.' }
            ]);
            this.gameState.setObjective('Completa la Prueba extraña en el bosque del Este.');
          }
        });
        return;
      }

      const key = this.add.image(x, y + 150, 'key_item');
      key.setScale(1.5);
      key.setDepth(5);
      
      // Sparkle effect
      const sparkle = this.add.circle(x, y + 150, 20, 0xffd700, 0.3);
      sparkle.setDepth(4);
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
        id: 'library-outdoor-key',
        x: x,
        y: y + 150,
        radius: GameConfig.INTERACT_RADIUS,
        promptText: 'Presiona E para tomar la llave',
        onInteract: () => {
          this.gameState.data.hasLibraryOutdoorKey = true;
          this.gameState.setObjective('Lleva la llave de la biblioteca a la entrada.');
          
          key.destroy();
          sparkle.destroy();
          this.interactSystem.unregister('library-outdoor-key');
          
          this.dialogueSystem.start([
            {
              speaker: 'June',
              text: "¡La llave de la biblioteca! Estuvo en mi casillero del gimnasio todo este tiempo."
            },
            {
              speaker: 'June',
              text: "Clásico de mí. Al menos ahora puedo llegar a esos textos antiguos que mencionó Gabi."
            }
          ]);
        }
      });
    }
  }
  
  private setupInteractions(): void {
    // Exit door
    this.interactSystem.register({
      id: 'gym-exit',
      x: 640,
      y: 688,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para salir',
      onInteract: () => {
        // Gym sits in the East outdoor room now
        RoomTransitions.transition(this, 'EastForestScene', 1980, 920);
      }
    });
    
    // Fun interactions
    this.interactSystem.register({
      id: 'treadmill',
      x: 290,
      y: 260,
      radius: GameConfig.INTERACT_RADIUS,
      promptText: 'Presiona E para usar',
      onInteract: () => {
        this.dialogueSystem.start([
          {
            speaker: 'June',
            text: "Ahora no. ¡Primero tengo un misterio que resolver!"
          }
        ]);
      }
    });
  }
}

