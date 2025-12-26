import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogueSystem } from '../systems/DialogueSystem';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

type TrialEnemy = Phaser.Physics.Arcade.Sprite;

/**
 * NEW: After June is kidnapped, Tony must clear a 2D platformer “run”
 * to reach the inner chamber (FinalInsideScene). The cave/cage/boss flow stays the same.
 */
export class RescueJuneRunScene extends Phaser.Scene {
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
  private coinCount = 0;
  private hudText!: Phaser.GameObjects.Text;

  private finishing = false;

  private readonly TS = 16;
  private readonly TILES_W = 220;
  private readonly TILES_H = 15;
  private readonly W = this.TILES_W * this.TS;
  private readonly H = this.TILES_H * this.TS;

  constructor() {
    super({ key: 'RescueJuneRunScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    musicManager.play(this.gameState.data.winterBlessing ? 'silent_night' : 'rescue_june');

    this.dialogue = new DialogueSystem(this);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.physics.world.gravity.y = 1250;
    this.cameras.main.setBackgroundColor(0x0b0f1f);
    this.cameras.main.setZoom(3);

    SceneFX.addOverlay(this, 'boss', { strength: 0.95, vignette: 0.10 });
    SceneFX.addParticles(this, 'boss', { density: 0.8, tint: 0xbbaaff });

    this.createBackdrop();
    this.createLevel();
    this.createHero('tony'); // Tony
    this.createEnemiesAndCoins();
    this.createGoal();

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, this.W, this.H);

    this.hudText = this.add.text(10, 10, 'MONEDAS: 0', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000);

    // Reset run state if coming fresh from capture
    if (!this.gameState.data.rescueJuneRunComplete) {
      this.gameState.setObjective('Como Tony: supera la carrera y llega a June.');
      this.time.delayedCall(250, () => {
        this.dialogue.start([
          { speaker: 'Tony', text: 'Ok. Respira.' },
          { speaker: 'Tony', text: 'No la voy a perder. No hoy.' },
          { speaker: 'Tony', text: 'June… aguanta.' }
        ]);
      });
    }
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

    if (jumpPressed && onGround) this.hero.setVelocityY(-430);

    if (this.hero.y > this.H + 200) this.respawn();

    this.enemies = this.enemies.filter(e => e.active);
    this.enemies.forEach(e => {
      const b = e.body as Phaser.Physics.Arcade.Body;
      if (b.blocked.left) e.setVelocityX(100);
      if (b.blocked.right) e.setVelocityX(-100);
    });
  }

  private createBackdrop(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x070b12, 0x070b12, 0x1b1630, 0x2a0f3a, 1);
    sky.fillRect(0, 0, this.W, 260);
    sky.setScrollFactor(0.12);

    // Violet “rift” glow
    const glow = this.add.rectangle(this.W * 0.6, 110, 260, 180, 0x8b00ff, 0.10);
    glow.setScrollFactor(0.18);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: glow, alpha: { from: 0.06, to: 0.14 }, yoyo: true, repeat: -1, duration: 1400 });

    for (let i = 0; i < 210; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * 220;
      const a = 0.28 + Math.random() * 0.55;
      this.add.circle(x, y, 1 + Math.random() * 1.7, 0xffffff, a).setScrollFactor(0.18);
    }

    const band = this.add.graphics();
    band.fillStyle(0x0b1020, 1);
    band.fillRect(0, 260, this.W, 220);
    band.setScrollFactor(0.35);

    for (let i = 0; i < 9; i++) {
      const x = Math.random() * this.W;
      const y = 40 + Math.random() * 160;
      const fog = this.add.image(x, y, 'fog_blob');
      fog.setAlpha(0.05 + Math.random() * 0.06);
      fog.setScale(0.45 + Math.random() * 0.8);
      fog.setScrollFactor(0.22);
      fog.setTint(0xbbaaff);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({
        targets: fog,
        x: x + (-120 + Math.random() * 240),
        y: y + (-10 + Math.random() * 20),
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

    const gaps = new Set<number>();
    [24, 25].forEach(x => gaps.add(x));
    [58, 59, 60].forEach(x => gaps.add(x));
    [90, 91, 92, 93].forEach(x => gaps.add(x));
    [128, 129, 130].forEach(x => gaps.add(x));
    [166, 167, 168, 169].forEach(x => gaps.add(x));

    for (let x = 0; x < this.TILES_W; x++) {
      if (gaps.has(x)) continue;
      this.placeSolid(x, 14, 'G');
    }
    for (let y = 0; y <= 14; y++) this.placeX(219, y);

    // Platforms
    for (let x = 12; x <= 20; x++) this.placeX(x, 11);
    for (let x = 40; x <= 48; x++) this.placeX(x, 9);
    for (let x = 74; x <= 82; x++) this.placeX(x, 8);
    for (let x = 108; x <= 116; x++) this.placeX(x, 10);
    for (let x = 140; x <= 148; x++) this.placeX(x, 9);
    for (let x = 174; x <= 182; x++) this.placeX(x, 8);

    // Hazards
    this.addSpikePit(58, 14, 3);
    this.addSpikePit(90, 14, 4);
    this.addSpikePit(166, 14, 4);

    // Coin line toward the “door”
    for (let x = 12; x <= 20; x += 2) this.spawnCoin(x, 10);
    for (let x = 74; x <= 82; x += 2) this.spawnCoin(x, 7);
    for (let x = 174; x <= 182; x += 2) this.spawnCoin(x, 7);
  }

  private createHero(texture: string): void {
    this.hero = this.physics.add.sprite(32, 13 * this.TS, texture);
    this.hero.setScale(1.35);
    this.hero.setCollideWorldBounds(true);
    (this.hero.body as Phaser.Physics.Arcade.Body).setSize(18, 24).setOffset(7, 6);

    this.physics.add.collider(this.hero, this.platforms);
    this.physics.add.collider(this.hero, this.hazards, () => this.respawn());
  }

  private createEnemiesAndCoins(): void {
    this.physics.add.overlap(this.hero, this.coins, (_h, coin) => {
      coin.destroy();
      this.coinCount++;
      this.hudText.setText(`MONEDAS: ${this.coinCount}`);
    });

    // Enemies
    this.spawnWalkerEnemy(46, 13, 0x8b4513, -100);
    this.spawnWalkerEnemy(80, 7, 0x3aa657, -95);
    this.spawnWalkerEnemy(112, 9, 0x8b4513, -95);
    this.spawnWalkerEnemy(146, 8, 0x8b4513, -95);
    this.spawnWalkerEnemy(180, 7, 0x3aa657, -95);

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.hero, this.enemies, (hObj, eObj) => {
      const h = hObj as Phaser.Physics.Arcade.Sprite;
      const e = eObj as Phaser.Physics.Arcade.Sprite;
      const heroBody = h.body as Phaser.Physics.Arcade.Body;
      const enemyBody = e.body as Phaser.Physics.Arcade.Body;
      const falling = heroBody.velocity.y > 120;
      const above = heroBody.bottom <= enemyBody.top + 10;
      if (falling && above) {
        e.disableBody(true, true);
        this.hero.setVelocityY(-320);
      } else {
        this.respawn();
      }
    });
  }

  private createGoal(): void {
    const doorX = 214 * this.TS + 8;
    const doorY = 13 * this.TS;

    const door = this.add.image(doorX, doorY, 'door').setScale(0.75).setDepth(20);
    door.setTint(0xbbaaff);
    const glow = this.add.circle(doorX, doorY, 22, 0x8b00ff, 0.18).setDepth(19);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.26 }, yoyo: true, repeat: -1, duration: 900 });

    const label = this.add.text(doorX, 6 * this.TS - 20, 'ENTRADA', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(11);

    const zone = this.add.rectangle(doorX, doorY, 28, 44);
    zone.setVisible(false);
    this.physics.add.existing(zone, true);

    this.physics.add.overlap(this.hero, zone as any, () => {
      if (this.finishing) return;
      this.finishing = true;
      this.gameState.data.rescueJuneRunComplete = true;
      // Enter the inner chamber (existing top-down cave/cage/boss room)
      RoomTransitions.transition(this, 'FinalInsideScene', 220, 560);
    });
  }

  private respawn(): void {
    this.cameras.main.shake(120, 0.005);
    this.hero.setPosition(32, 13 * this.TS);
    this.hero.setVelocity(0, 0);
  }

  private spawnCoin(tx: number, ty: number): void {
    const c = this.coins.create(tx * this.TS + 8, ty * this.TS + 8, 'key');
    c.setTint(0xffd700);
    c.setScale(1.0);
  }

  private spawnWalkerEnemy(tx: number, ty: number, tint: number, vx: number): void {
    const e = this.physics.add.sprite(tx * this.TS + 8, ty * this.TS, 'slime');
    e.setTint(tint);
    e.setScale(1.15);
    e.setVelocityX(vx);
    e.setBounce(0);
    e.setCollideWorldBounds(true);
    (e.body as Phaser.Physics.Arcade.Body).setSize(20, 14).setOffset(6, 14);
    this.enemies.push(e);
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

  private placeSolid(tx: number, ty: number, kind: 'G' | 'X' | 'B' | 'Q' | 'P'): void {
    const x = tx * this.TS;
    const y = ty * this.TS;
    const g = this.add.graphics();

    const base =
      kind === 'G' ? 0x2f241b :
      kind === 'X' ? 0x3e3e44 :
      kind === 'P' ? 0x1f6a36 :
      kind === 'Q' ? 0x9b7a2c :
      0x7a4a2a;

    g.fillStyle(base, 1);
    g.fillRect(x, y, this.TS, this.TS);
    const inner = Phaser.Display.Color.IntegerToColor(base).brighten(15).color;
    g.fillStyle(inner, 0.95);
    g.fillRect(x + 2, y + 2, this.TS - 4, this.TS - 4);
    g.lineStyle(1, 0x000000, 0.35);
    g.strokeRect(x + 0.5, y + 0.5, this.TS - 1, this.TS - 1);

    if (kind === 'G') {
      g.fillStyle(0x2e7a4a, 1);
      g.fillRect(x, y, this.TS, 3);
      g.fillStyle(0x4bd18b, 0.7);
      g.fillRect(x, y, this.TS, 1);
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


