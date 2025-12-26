import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class BearChaseScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  private bearShadow!: Phaser.GameObjects.Ellipse;
  private bearX = 120;
  private readonly W = 2560;
  private readonly H = 1920;

  constructor() {
    super({ key: 'BearChaseScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // During Tony kidnap/rescue sequence
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_tony');

    SceneFX.addOverlay(this, 'cool');
    SceneFX.addParticles(this, 'cool');

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);

    this.createCourse();

    this.player = new Player(this, 220, 960);

    this.physics.add.collider(this.player, this.walls);

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, this.W, this.H);

    // Bear pressure (a “shadow” that advances)
    this.bearShadow = this.add.ellipse(this.bearX, 960, 120, 70, 0x000000, 0.25);
    this.bearShadow.setDepth(1);

    this.dialogueSystem.start([
      { speaker: 'June', text: 'Tony!!' },
      { speaker: 'June', text: 'Okay. Okay. Just… don’t get caught.' }
    ]);
  }

  update(): void {
    if (this.dialogueSystem.isDialogueActive()) {
      this.player.move(0, 0, null);
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
      return;
    }

    // No attacking during chase
    if (this.inputRouter.isInteractPressed()) this.interactSystem.interact();

    const mv = this.inputRouter.getMovementVector();
    this.player.move(mv.x, mv.y, mv.direction);
    this.interactSystem.update(this.player.x, this.player.y);

    this.player.preUpdate(this.time.now, this.game.loop.delta);

    // Advance bear shadow slowly; faster if player stalls
    const playerSpeedFactor = Math.max(0, 1 - Math.abs((this.player.body as Phaser.Physics.Arcade.Body).velocity.x) / GameConfig.PLAYER_SPEED);
    this.bearX += 1.4 + playerSpeedFactor * 1.2;
    this.bearShadow.x = this.bearX;
    this.bearShadow.y = this.player.y;

    // Caught?
    if (this.bearX > this.player.x - 80) {
      this.cameras.main.shake(150, 0.008);
      this.dialogueSystem.start([{ speaker: 'June', text: 'No. Otra vez. ¡MUÉVETE!' }], () => {
        this.resetRun();
      });
    }

    // Finish zone (far right)
    if (this.player.x > this.W - 160) {
      RoomTransitions.transition(this, 'TonyCageScene', 320, 520);
    }
  }

  private resetRun(): void {
    this.player.setPosition(220, 960);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.bearX = 120;
  }

  private createCourse(): void {
    const tileSize = 32;
    // Grass base
    for (let x = 0; x < this.W; x += tileSize) {
      for (let y = 0; y < this.H; y += tileSize) {
        const r = Math.random();
        const texture = r < 0.4 ? 'floor_grass' : r < 0.7 ? 'floor_grass_1' : 'floor_grass_2';
        this.add.image(x, y, texture).setOrigin(0, 0).setDepth(0);
      }
    }

    this.walls = this.physics.add.staticGroup();

    // Corridor walls via tree lines
    for (let x = 120; x < this.W - 120; x += 80) {
      this.addTree(x, 420);
      this.addTree(x, 1500);
    }

    // Obstacles in the lane
    const rocks = [
      { x: 720, y: 900 }, { x: 980, y: 1100 }, { x: 1240, y: 820 },
      { x: 1600, y: 1040 }, { x: 1900, y: 880 }, { x: 2140, y: 1120 }
    ];
    rocks.forEach(r => this.addRock(r.x, r.y));

    const logs = [
      { x: 860, y: 980 }, { x: 1400, y: 960 }, { x: 2000, y: 980 }
    ];
    logs.forEach(l => {
      const log = this.add.image(l.x, l.y, 'fallen_log');
      log.setDepth(l.y);
      const c = this.add.rectangle(l.x, l.y + 10, 80, 30);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Exit marker
    const exit = this.add.text(this.W - 240, 520, 'TO THE CAVE →', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 10, y: 6 },
      fontFamily: 'Arial'
    });
    exit.setDepth(5);
  }

  private addTree(x: number, y: number): void {
    const tree = this.add.image(x, y, 'tree');
    tree.setDepth(y);
    const c = this.add.rectangle(x, y + 20, 40, 40);
    c.setVisible(false);
    this.walls.add(c);
  }

  private addRock(x: number, y: number): void {
    const rock = this.add.image(x, y, 'rock');
    rock.setDepth(y);
    const c = this.add.circle(x, y, 24);
    c.setVisible(false);
    this.walls.add(c);
  }
}


