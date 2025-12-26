import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogueSystem } from '../systems/DialogueSystem';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

type TrialEnemy = Phaser.Physics.Arcade.Sprite;

/**
 * Replaces the simple top-down TunnelScene with a Mario-style obstacle course.
 * This is the “basement tunnel” between Cabin and Library.
 *
 * - Entry from Cabin basement -> run to Library basement door
 * - Entry from Library basement -> run back to Cabin basement door (reverse direction)
 */
export class TunnelRunScene extends Phaser.Scene {
  private gameState: GameState;
  private dialogue!: DialogueSystem;

  private hero!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private eKey!: Phaser.Input.Keyboard.Key;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: TrialEnemy[] = [];
  private coins!: Phaser.Physics.Arcade.Group;

  private readonly TS = 16;
  private readonly TILES_W = 220;
  private readonly TILES_H = 15;
  private readonly W = this.TILES_W * this.TS;
  private readonly H = this.TILES_H * this.TS;

  private toLibrary = true;
  private finishing = false;

  constructor() {
    super({ key: 'TunnelRunScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Use the same music logic as other “in-between” areas
    if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play('2');

    this.dialogue = new DialogueSystem(this);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.physics.world.gravity.y = 1200;
    this.cameras.main.setBackgroundColor(0x070b12);
    this.cameras.main.setZoom(3);

    SceneFX.addOverlay(this, 'cave', { strength: 1.0, vignette: 0.10 });
    SceneFX.addParticles(this, 'cave', { density: 0.9, tint: 0xaaccff });

    this.toLibrary = this.gameState.data.tunnelRunFrom !== 'library';

    this.createBackdrop();
    this.createLevel();
    this.createHero();
    this.createEnemies();
    this.createGoal();

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, this.W, this.H);

    // Small hint once per entry
    this.time.delayedCall(250, () => {
      this.dialogue.start([
        {
          speaker: 'June',
          text: this.toLibrary
            ? 'El túnel… se siente vivo. Pero no voy a retroceder.'
            : 'Respira. Solo es un túnel. Solo… un túnel.'
        }
      ]);
    });
  }

  update(): void {
    if (this.dialogue.isDialogueActive()) {
      this.hero.setVelocityX(0);
      if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
        this.dialogue.advance();
      }
      return;
    }

    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const left = !!this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = !!this.cursors.right?.isDown || this.wasd.D.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.W);

    const speed = 230;
    if (left && !right) this.hero.setVelocityX(-speed);
    else if (right && !left) this.hero.setVelocityX(speed);
    else this.hero.setVelocityX(0);

    if (jumpPressed && onGround) this.hero.setVelocityY(-435);

    if (this.hero.y > this.H + 200) this.respawn();

    // Enemy pacing
    this.enemies = this.enemies.filter(e => e.active);
    this.enemies.forEach(e => {
      const b = e.body as Phaser.Physics.Arcade.Body;
      if (b.blocked.left) e.setVelocityX(95);
      if (b.blocked.right) e.setVelocityX(-95);
    });
  }

  private createBackdrop(): void {
    // Cave ceiling gradient band
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x070b12, 0x070b12, 0x0b1320, 0x101c30, 1);
    sky.fillRect(0, 0, this.W, 260);
    sky.setScrollFactor(0.12);

    // Crystals + fog
    for (let i = 0; i < 12; i++) {
      const x = 60 + Math.random() * (this.W - 120);
      const y = 80 + Math.random() * 160;
      const c = this.add.image(x, y, 'crystal');
      c.setAlpha(0.18 + Math.random() * 0.14);
      c.setScale(0.6 + Math.random() * 0.9);
      c.setTint(0xaaccff);
      c.setScrollFactor(0.20);
      c.setBlendMode(Phaser.BlendModes.SCREEN);
    }

    for (let i = 0; i < 10; i++) {
      const x = Math.random() * this.W;
      const y = 40 + Math.random() * 200;
      const fog = this.add.image(x, y, 'fog_blob');
      fog.setAlpha(0.05 + Math.random() * 0.06);
      fog.setScale(0.55 + Math.random() * 0.85);
      fog.setScrollFactor(0.22);
      fog.setTint(0xaaccff);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: fog,
        x: x + (-120 + Math.random() * 240),
        y: y + (-12 + Math.random() * 24),
        yoyo: true,
        repeat: -1,
        duration: 9000 + Math.random() * 5000,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private createLevel(): void {
    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

    // Ground (cave floor) with a few pits
    const gaps = new Set<number>();
    [34, 35, 36].forEach(x => gaps.add(x));
    [70, 71].forEach(x => gaps.add(x));
    [112, 113, 114].forEach(x => gaps.add(x));
    [156, 157].forEach(x => gaps.add(x));
    [190, 191, 192].forEach(x => gaps.add(x));

    for (let x = 0; x < this.TILES_W; x++) {
      if (gaps.has(x)) continue;
      this.placeSolid(x, 14, 'G');
    }
    for (let y = 0; y <= 14; y++) {
      this.placeX(0, y);
      this.placeX(219, y);
    }
    // Ceiling chunks
    for (let x = 0; x < this.TILES_W; x++) {
      if (x % 7 === 0) this.placeX(x, 2);
      if (x % 11 === 0) this.placeX(x, 3);
    }

    // Platforms (cave “parkour”)
    for (let x = 12; x <= 22; x++) this.placeX(x, 10);
    for (let x = 44; x <= 54; x++) this.placeX(x, 9);
    for (let x = 82; x <= 94; x++) this.placeX(x, 8);
    for (let x = 122; x <= 132; x++) this.placeX(x, 10);
    for (let x = 168; x <= 178; x++) this.placeX(x, 8);

    // Spike pits
    this.addSpikePit(34, 14, 3);
    this.addSpikePit(112, 14, 3);
    this.addSpikePit(190, 14, 3);

    // Coins guide the player
    for (let x = 12; x <= 22; x += 2) this.spawnCoin(x, 9);
    for (let x = 82; x <= 94; x += 2) this.spawnCoin(x, 7);
    for (let x = 168; x <= 178; x += 2) this.spawnCoin(x, 7);
  }

  private createHero(): void {
    // Use June sprite; Tony never uses this tunnel in the story beats, but keep it consistent.
    const startX = this.toLibrary ? 32 : (this.W - 32);
    this.hero = this.physics.add.sprite(startX, 13 * this.TS, 'player');
    this.hero.setScale(1.35);
    this.hero.setCollideWorldBounds(true);
    (this.hero.body as Phaser.Physics.Arcade.Body).setSize(18, 24).setOffset(7, 6);

    this.physics.add.collider(this.hero, this.platforms);
    this.physics.add.collider(this.hero, this.hazards, () => this.respawn());

    // Coins pickup (tiny reward)
    this.physics.add.overlap(this.hero, this.coins, (_h, coin) => {
      coin.destroy();
    });
  }

  private createEnemies(): void {
    // A few slimes as hazards
    const spawn = (tx: number, ty: number, vx: number) => {
      const e = this.physics.add.sprite(tx * this.TS + 8, ty * this.TS, 'slime');
      e.setTint(0x8b4513);
      e.setScale(1.1);
      e.setVelocityX(vx);
      e.setCollideWorldBounds(true);
      (e.body as Phaser.Physics.Arcade.Body).setSize(20, 14).setOffset(6, 14);
      this.enemies.push(e);
    };

    spawn(50, 13, -95);
    spawn(90, 7, -85);
    spawn(130, 9, -85);
    spawn(176, 7, -85);

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.hero, this.enemies, () => this.respawn());
  }

  private createGoal(): void {
    const endX = this.toLibrary ? (214 * this.TS + 8) : (6 * this.TS + 8);
    const endY = 13 * this.TS;

    const door = this.add.image(endX, endY, 'door').setScale(0.75).setDepth(20);
    door.setTint(this.toLibrary ? 0xaaccff : 0xffc07a);
    const glow = this.add.circle(endX, endY, 22, this.toLibrary ? 0xaaccff : 0xffc07a, 0.18).setDepth(19);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.26 }, yoyo: true, repeat: -1, duration: 900 });

    const label = this.add.text(endX, 6 * this.TS - 20, this.toLibrary ? 'BIBLIOTECA' : 'CABAÑA', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(11);

    const zone = this.add.rectangle(endX, endY, 28, 44);
    zone.setVisible(false);
    this.physics.add.existing(zone, true);
    this.physics.add.overlap(this.hero, zone as any, () => {
      if (this.finishing) return;
      this.finishing = true;
      if (this.toLibrary) {
        RoomTransitions.transition(this, 'LibraryScene', 200, 650);
      } else {
        RoomTransitions.transition(this, 'CabinScene', 640, 600);
      }
    });
  }

  private respawn(): void {
    this.cameras.main.shake(120, 0.005);
    const x = this.toLibrary ? 32 : (this.W - 32);
    this.hero.setPosition(x, 13 * this.TS);
    this.hero.setVelocity(0, 0);
  }

  private spawnCoin(tx: number, ty: number): void {
    const c = this.coins.create(tx * this.TS + 8, ty * this.TS + 8, 'key');
    c.setTint(0xffd700);
    c.setScale(1.0);
  }

  private addSpikePit(startX: number, groundY: number, widthTiles: number): void {
    const x = startX * this.TS;
    const y = groundY * this.TS;
    const w = widthTiles * this.TS;

    const g = this.add.graphics();
    g.fillStyle(0x9b1c31, 1);
    g.fillRect(x, y - 6, w, 6);
    for (let i = 0; i < w; i += 8) {
      g.fillStyle(0xff3b5c, 1);
      g.fillTriangle(x + i, y - 6, x + i + 4, y - 14, x + i + 8, y - 6);
    }
    g.setDepth(8);

    const hz = this.add.rectangle(x + w / 2, y - 10, w, 16);
    hz.setVisible(false);
    this.hazards.add(hz);
  }

  private placeSolid(tx: number, ty: number, kind: 'G' | 'X'): void {
    const x = tx * this.TS;
    const y = ty * this.TS;
    const g = this.add.graphics();
    const base = kind === 'G' ? 0x2a2038 : 0x3e3e44;

    g.fillStyle(base, 1);
    g.fillRect(x, y, this.TS, this.TS);
    const inner = Phaser.Display.Color.IntegerToColor(base).brighten(15).color;
    g.fillStyle(inner, 0.95);
    g.fillRect(x + 2, y + 2, this.TS - 4, this.TS - 4);
    g.lineStyle(1, 0x000000, 0.35);
    g.strokeRect(x + 0.5, y + 0.5, this.TS - 1, this.TS - 1);

    if (kind === 'G') {
      // Subtle “wet stone” highlight
      g.fillStyle(0x6a8aaa, 0.12);
      g.fillRect(x + 1, y + 1, this.TS - 2, 2);
    }
    g.setDepth(6);

    const c = this.add.rectangle(x + 8, y + 8, this.TS, this.TS);
    c.setVisible(false);
    this.platforms.add(c);
  }

  private placeX(tx: number, ty: number): void {
    this.placeSolid(tx, ty, 'X');
  }
}


