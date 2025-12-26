import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { RoomTransitions } from '../systems/RoomTransitions';
import { DialogueSystem } from '../systems/DialogueSystem';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

type TrialEnemy = Phaser.Physics.Arcade.Sprite;

/**
 * NEW: After Tony is snatched, June must run through a harder 2D platformer course
 * to reach the cave (TonyCageScene). This replaces the old top-down BearChaseScene.
 */
export class RescueTonyRunScene extends Phaser.Scene {
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
    super({ key: 'RescueTonyRunScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    musicManager.play('rescue_tony');

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
    this.cameras.main.setBackgroundColor(0x0b1020);
    this.cameras.main.setZoom(3);

    SceneFX.addOverlay(this, 'cool', { strength: 1.0, vignette: 0.08 });
    SceneFX.addParticles(this, 'cool', { density: 0.9, tint: 0xaaccff });

    this.createBackdrop();
    this.createLevel();
    this.createHero('player'); // June
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

    // Story nudge (once)
    if (!this.gameState.data.rescueTonyRunComplete) {
      this.gameState.setObjective('Corre a la cueva. Tony está en peligro.');
      this.time.delayedCall(250, () => {
        this.dialogue.start([
          { speaker: 'June', text: 'Tony… no. No, no, no.' },
          { speaker: 'June', text: 'Si el bosque quiere una carrera, va a tener una carrera.' },
          { speaker: 'June', text: 'Cueva. Ahora.' }
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

    const speed = 235;
    if (left && !right) this.hero.setVelocityX(-speed);
    else if (right && !left) this.hero.setVelocityX(speed);
    else this.hero.setVelocityX(0);

    if (jumpPressed && onGround) this.hero.setVelocityY(-440);

    // Respawn if you fall
    if (this.hero.y > this.H + 200) this.respawn();

    // Basic enemy pacing
    this.enemies = this.enemies.filter(e => e.active);
    this.enemies.forEach(e => {
      const b = e.body as Phaser.Physics.Arcade.Body;
      if (b.blocked.left) e.setVelocityX(105);
      if (b.blocked.right) e.setVelocityX(-105);
    });
  }

  private createBackdrop(): void {
    // Night gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x08122a, 0x08122a, 0x1b2440, 0x251a3a, 1);
    sky.fillRect(0, 0, this.W, 260);
    sky.setScrollFactor(0.12);

    // Moon
    const moonGlow = this.add.circle(this.W * 0.22, 90, 72, 0xaaccff, 0.12);
    moonGlow.setScrollFactor(0.16);
    moonGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.circle(this.W * 0.22, 90, 22, 0xe9f6ff, 0.92).setScrollFactor(0.16);

    // Stars
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * 220;
      const a = 0.30 + Math.random() * 0.60;
      this.add.circle(x, y, 1 + Math.random() * 1.7, 0xffffff, a).setScrollFactor(0.18);
    }

    // Distant band
    const hills = this.add.graphics();
    hills.fillStyle(0x101a33, 1);
    hills.fillRect(0, 220, this.W, 260);
    hills.setScrollFactor(0.28);

    const band = this.add.graphics();
    band.fillStyle(0x0b1020, 1);
    band.fillRect(0, 260, this.W, 220);
    band.setScrollFactor(0.35);

    // Drifting fog
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * this.W;
      const y = 40 + Math.random() * 160;
      const fog = this.add.image(x, y, 'fog_blob');
      fog.setAlpha(0.05 + Math.random() * 0.06);
      fog.setScale(0.45 + Math.random() * 0.75);
      fog.setScrollFactor(0.22);
      fog.setTint(0xaaccff);
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

    // Ground with frequent gaps (harder than the east trial)
    const gaps = new Set<number>();
    // small early gaps
    [18, 19, 20].forEach(x => gaps.add(x));
    [42, 43].forEach(x => gaps.add(x));
    [66, 67, 68, 69].forEach(x => gaps.add(x));
    // mid game longer gaps
    [96, 97, 98, 99, 100].forEach(x => gaps.add(x));
    [132, 133, 134, 135].forEach(x => gaps.add(x));
    [162, 163, 164, 165, 166].forEach(x => gaps.add(x));
    // pre-finale
    [186, 187, 188, 189].forEach(x => gaps.add(x));

    for (let x = 0; x < this.TILES_W; x++) {
      if (gaps.has(x)) continue;
      this.placeSolid(x, 14, 'G');
    }

    // Right-side boundary so you can’t fall off world
    for (let y = 0; y <= 14; y++) this.placeX(219, y);

    // Platforms / jumps (advanced)
    for (let x = 10; x <= 16; x++) this.placeX(x, 11);
    for (let x = 26; x <= 34; x++) this.placeX(x, 9);
    for (let x = 52; x <= 60; x++) this.placeX(x, 10);
    for (let x = 74; x <= 82; x++) this.placeX(x, 8);
    for (let x = 110; x <= 118; x++) this.placeX(x, 9);
    for (let x = 142; x <= 150; x++) this.placeX(x, 8);
    for (let x = 170; x <= 178; x++) this.placeX(x, 10);

    // “Brick” reward ceiling + Q blocks
    for (let x = 120; x <= 128; x++) this.placeBrick(x, 6);
    this.placeQuestion(124, 6, 'coin');
    this.placeQuestion(126, 6, 'mushroom');

    // Spikes marking some pits (hazard zones)
    this.addSpikePit(18, 14, 3);
    this.addSpikePit(66, 14, 4);
    this.addSpikePit(96, 14, 5);
    this.addSpikePit(162, 14, 5);

    // Coins guide route
    for (let x = 12; x <= 16; x++) this.spawnCoin(x, 10);
    for (let x = 26; x <= 34; x += 2) this.spawnCoin(x, 8);
    for (let x = 74; x <= 82; x += 2) this.spawnCoin(x, 7);
    for (let x = 170; x <= 178; x += 2) this.spawnCoin(x, 9);
  }

  private createHero(texture: string): void {
    this.hero = this.physics.add.sprite(32, 13 * this.TS, texture);
    this.hero.setScale(1.4);
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

    // Enemies (denser)
    this.spawnWalkerEnemy(30, 13, 0x8b4513, -105);
    this.spawnWalkerEnemy(56, 13, 0x3aa657, -105);
    this.spawnWalkerEnemy(78, 7, 0x8b4513, -95);
    this.spawnWalkerEnemy(112, 8, 0x8b4513, -95);
    this.spawnWalkerEnemy(146, 7, 0x3aa657, -95);
    this.spawnWalkerEnemy(176, 9, 0x8b4513, -95);

    this.physics.add.collider(this.enemies, this.platforms);

    // Stomp vs hit
    this.physics.add.overlap(this.hero, this.enemies, (hObj, eObj) => {
      const h = hObj as Phaser.Physics.Arcade.Sprite;
      const e = eObj as Phaser.Physics.Arcade.Sprite;
      const heroBody = h.body as Phaser.Physics.Arcade.Body;
      const enemyBody = e.body as Phaser.Physics.Arcade.Body;
      const falling = heroBody.velocity.y > 120;
      const above = heroBody.bottom <= enemyBody.top + 10;
      if (falling && above) {
        e.disableBody(true, true);
        this.hero.setVelocityY(-330);
      } else {
        this.respawn();
      }
    });
  }

  private createGoal(): void {
    const caveX = 214 * this.TS + 8;
    const caveY = 13 * this.TS;

    // Cave “entrance” (door sprite + stone frame)
    const door = this.add.image(caveX, caveY, 'door').setScale(0.75).setDepth(20);
    door.setTint(0x6a8aaa);

    const glow = this.add.circle(caveX, caveY, 22, 0xaaccff, 0.18).setDepth(19);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({ targets: glow, alpha: { from: 0.08, to: 0.26 }, yoyo: true, repeat: -1, duration: 900 });

    const label = this.add.text(caveX, 6 * this.TS - 20, 'CUEVA', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(11);

    const zone = this.add.rectangle(caveX, caveY, 28, 44);
    zone.setVisible(false);
    this.physics.add.existing(zone, true);

    this.physics.add.overlap(this.hero, zone as any, () => {
      if (this.finishing) return;
      this.finishing = true;
      this.gameState.data.rescueTonyRunComplete = true;
      RoomTransitions.transition(this, 'TonyCageScene', 320, 520);
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

    // Visual spikes
    const g = this.add.graphics();
    g.fillStyle(0x9b1c31, 1);
    g.fillRect(x, y - 6, w, 6);
    for (let i = 0; i < w; i += 8) {
      g.fillStyle(0xff3b5c, 1);
      g.fillTriangle(x + i, y - 6, x + i + 4, y - 14, x + i + 8, y - 6);
    }
    g.setDepth(8);

    // Hazard collider
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
    if (kind === 'B') {
      g.lineStyle(1, 0x000000, 0.20);
      g.lineBetween(x + 1, y + 6, x + this.TS - 2, y + 6);
      g.lineBetween(x + 1, y + 11, x + this.TS - 2, y + 11);
    }
    if (kind === 'Q') {
      g.fillStyle(0xffd700, 0.18);
      g.fillRect(x + 2, y + 2, this.TS - 4, this.TS - 4);
      this.add.text(x + 5, y + 1, '?', { fontSize: '12px', color: '#fff2a8', fontFamily: 'Arial', fontStyle: 'bold' }).setDepth(7);
    }

    g.setDepth(6);

    const c = this.add.rectangle(x + 8, y + 8, this.TS, this.TS);
    c.setVisible(false);
    this.platforms.add(c);
  }

  private placeX(tx: number, ty: number): void {
    this.placeSolid(tx, ty, 'X');
  }

  private placeBrick(tx: number, ty: number): void {
    this.placeSolid(tx, ty, 'B');
  }

  private placeQuestion(tx: number, ty: number, kind: 'mushroom' | 'coin'): void {
    this.placeSolid(tx, ty, 'Q');
    // We don’t need the full power-up system here; keep as visual “reward” block.
    // (The east Trial already teaches Q/B behavior.)
    if (kind === 'coin') this.spawnCoin(tx, ty - 1);
  }
}


