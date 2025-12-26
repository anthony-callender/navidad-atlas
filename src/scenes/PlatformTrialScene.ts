import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { DialogueSystem } from '../systems/DialogueSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

type TrialEnemy = Phaser.Physics.Arcade.Sprite;

export class PlatformTrialScene extends Phaser.Scene {
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
  private solidsByKey: Map<string, 'G' | 'X' | 'B' | 'Q' | 'P'> = new Map();
  private bricksByKey: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private questionsByKey: Map<string, { used: boolean; kind: 'mushroom' | 'coin' }> = new Map();
  private pipeWarpZone?: Phaser.GameObjects.Rectangle;
  private powered = false;
  private coinCount = 0;
  private hudText!: Phaser.GameObjects.Text;
  private finishing = false;
  private shownNeedKey = false;

  private readonly TS = 16;
  private readonly TILES_W = 220;
  private readonly TILES_H = 15;
  private readonly W = this.TILES_W * this.TS;
  private readonly H = this.TILES_H * this.TS;

  private introShown = false;

  constructor() {
    super({ key: 'PlatformTrialScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Platform trial is a side activity during the midgame
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else musicManager.play(this.gameState.data.metGabi ? '1' : '0');

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
    this.cameras.main.setBackgroundColor(0x1b2440);
    this.cameras.main.setZoom(3);

    SceneFX.addOverlay(this, 'cool');
    SceneFX.addParticles(this, 'cool');

    this.createBackdrop();
    this.createLevel();
    this.createHero();
    this.createEnemiesAndCoins();
    this.createGoal();

    // Camera follows hero across a wide level
    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, this.W, this.H);

    this.hudText = this.add.text(10, 10, 'MONEDAS: 0', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000);

    if (!this.gameState.data.platformTrialComplete && !this.introShown) {
      this.introShown = true;
      this.time.delayedCall(250, () => {
        this.dialogue.start([
          { speaker: 'June', text: 'Okay… a side-path that turns into a weird “trial.”' },
          { speaker: 'June', text: 'Fine. I can jump. I can do… whatever this is.' }
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

    const speed = 220;
    if (left && !right) this.hero.setVelocityX(-speed);
    else if (right && !left) this.hero.setVelocityX(speed);
    else this.hero.setVelocityX(0);

    if (jumpPressed && onGround) {
      this.hero.setVelocityY(-420);
    }

    // Hit blocks from below (B/Q) by checking the tile above the hero when moving up
    if (body.velocity.y < -40) {
      this.checkHeadBump();
    }

    // Pipe warp: press DOWN while standing on the pipe top
    if (this.pipeWarpZone) {
      const downPressed = Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.wasd.S);
      if (downPressed && this.physics.overlap(this.hero, this.pipeWarpZone as any)) {
        RoomTransitions.transition(this, 'PlatformBonusScene', 80, 200);
        return;
      }
    }

    // Respawn if you fall
    if (this.hero.y > this.H + 200) this.respawn();

    // Stomp enemies
    this.enemies = this.enemies.filter(e => e.active);
    this.enemies.forEach(e => {
      // Simple pacing
      const body = e.body as Phaser.Physics.Arcade.Body;
      if (body.blocked.left) e.setVelocityX(90);
      if (body.blocked.right) e.setVelocityX(-90);
    });
  }

  private createBackdrop(): void {
    // Rich night-sky gradient (Terraria-ish readability)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0b1530, 0x0b1530, 0x1b2440, 0x251a3a, 1);
    sky.fillRect(0, 0, this.W, 260);
    sky.setScrollFactor(0.12);

    // Moon + soft glow
    const moonGlow = this.add.circle(this.W * 0.18, 90, 70, 0xaaccff, 0.12);
    moonGlow.setScrollFactor(0.16);
    moonGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    const moon = this.add.circle(this.W * 0.18, 90, 22, 0xe9f6ff, 0.9);
    moon.setScrollFactor(0.16);

    // Stars
    for (let i = 0; i < 190; i++) {
      const x = Math.random() * this.W;
      const y = Math.random() * 220;
      const a = 0.35 + Math.random() * 0.55;
      const s = this.add.circle(x, y, 1 + Math.random() * 1.7, 0xffffff, a);
      s.setScrollFactor(0.18);
    }

    // Far silhouettes (hills + treeline) with parallax
    const hills = this.add.graphics();
    hills.fillStyle(0x121a2f, 1);
    hills.fillRect(0, 220, this.W, 260);
    hills.setScrollFactor(0.28);

    const band = this.add.graphics();
    band.fillStyle(0x0f152a, 1);
    band.fillRect(0, 260, this.W, 220);
    band.setScrollFactor(0.35);

    // Slow drifting “clouds” (reuse fog_blob)
    for (let i = 0; i < 8; i++) {
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

    // BASE GROUND: Fill G from x=0..219 at y=14, with gaps per spec
    const gaps = new Set<number>();
    [30, 31].forEach(x => gaps.add(x));
    [66, 67, 68].forEach(x => gaps.add(x));
    [186, 187, 188, 189].forEach(x => gaps.add(x));

    for (let x = 0; x < this.TILES_W; x++) {
      if (gaps.has(x)) continue;
      this.placeSolid(x, 14, 'G');
    }

    // SECTION 1: Q + bricks
    this.placeQuestion(16, 10, 'mushroom');
    this.placeBrick(15, 10);
    this.placeBrick(17, 10);
    this.placeBrick(22, 9);
    this.placeBrick(23, 9);
    this.placeBrick(24, 9);

    // SECTION 2: Pipe at x=50 height 3 (y=12..14)
    this.placePipe(50, 12, 3);
    this.placePipe(51, 12, 3);
    // Pipe warp zone (top of pipe)
    this.pipeWarpZone = this.add.rectangle(50 * this.TS + 16, 12 * this.TS - 4, 2 * this.TS, 10);
    this.pipeWarpZone.setVisible(false);
    this.physics.add.existing(this.pipeWarpZone, true);

    // SECTION 3: Stair-step blocks at x=90
    this.placeX(90, 13);
    this.placeX(91, 12); this.placeX(91, 13);
    this.placeX(92, 11); this.placeX(92, 12); this.placeX(92, 13);
    this.placeX(93, 10); this.placeX(93, 11); this.placeX(93, 12); this.placeX(93, 13);

    // Q/Bricks above to encourage jumping
    this.placeQuestion(102, 10, 'coin');
    this.placeBrick(101, 10);
    this.placeBrick(103, 10);

    // Pipe pair at x=126 height 2 (y=13..14) and x=136 height 4 (y=11..14)
    this.placePipe(126, 13, 2); this.placePipe(127, 13, 2);
    this.placePipe(136, 11, 4); this.placePipe(137, 11, 4);

    // SECTION 4: Reward brick ceiling y=8 for x=160..168 + Q at (164,8)
    for (let x = 160; x <= 168; x++) this.placeBrick(x, 8);
    this.placeQuestion(164, 8, 'coin');

    // Final gap landing pad: X at (190,13)(191,13)
    this.placeX(190, 13);
    this.placeX(191, 13);

    // IMPORTANT: No big end staircase here.
    // Reason: if the player overshoots the door area before grabbing the pipe key, they must still be able to run back.
    // We'll keep the end area flat and add a right-side boundary wall so you can't fall off the world.
    for (let y = 0; y <= 14; y++) this.placeX(219, y);

    // Hazard strips to “mark” the bigger gaps (visual only)
    this.addGapMarker(66, 14, 3);
    this.addGapMarker(186, 14, 4);
  }

  private createHero(): void {
    // Spawn just above ground, tile coords ~ (2, 13)
    this.hero = this.physics.add.sprite(32, 13 * this.TS, 'player');
    this.hero.setScale(1.4);
    this.hero.setCollideWorldBounds(true);
    (this.hero.body as Phaser.Physics.Arcade.Body).setSize(18, 24).setOffset(7, 6);

    this.physics.add.collider(this.hero, this.platforms);
    this.physics.add.collider(this.hero, this.hazards, () => this.respawn());
  }

  private createEnemiesAndCoins(): void {
    // Coins
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

    // Section 2 coin arc over pipe: (48,9)(49,8)(50,8)(51,8)(52,9)
    this.spawnCoin(48, 9);
    this.spawnCoin(49, 8);
    this.spawnCoin(50, 8);
    this.spawnCoin(51, 8);
    this.spawnCoin(52, 9);

    // Coins between pipes: x=130..133 at y=9
    [130, 131, 132, 133].forEach(x => this.spawnCoin(x, 9));

    this.physics.add.overlap(this.hero, this.coins, (_h, coin) => {
      coin.destroy();
      this.coinCount++;
      this.hudText.setText(`MONEDAS: ${this.coinCount}`);
    });

    // Enemies (goomba/koopa equivalents using 'slime' tint)
    this.spawnWalkerEnemy(20, 13, 0x8b4513, -90); // goomba
    this.spawnWalkerEnemy(46, 13, 0x8b4513, -90); // goomba
    this.spawnWalkerEnemy(110, 13, 0x3aa657, -90); // koopa-ish
    this.spawnWalkerEnemy(118, 13, 0x8b4513, -90); // goomba
    this.spawnWalkerEnemy(156, 13, 0x8b4513, -90);
    this.spawnWalkerEnemy(164, 13, 0x3aa657, -90);
    this.spawnWalkerEnemy(172, 13, 0x8b4513, -90);

    this.physics.add.collider(this.enemies, this.platforms);

    // Hero contact with enemy: stomp from above = kill, else respawn
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
    // End Door (replaces flag) — requires cave key from the pipe room
    const doorX = 214 * this.TS + 8;
    const doorY = 13 * this.TS;

    const door = this.add.image(doorX, doorY, 'door');
    door.setDepth(20);
    door.setScale(0.7);

    const glow = this.add.circle(doorX, doorY, 20, 0xffd700, 0.18);
    glow.setDepth(19);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.08, to: 0.22 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 900
    });

    const doorZone = this.add.rectangle(doorX, doorY, 24, 40);
    doorZone.setVisible(false);
    this.physics.add.existing(doorZone, true);

    this.physics.add.overlap(this.hero, doorZone as any, () => {
      if (this.finishing) return;

      if (this.gameState.data.platformCaveKeyFound) {
        this.completeTrial();
        return;
      }

      if (this.shownNeedKey) return;
      this.shownNeedKey = true;
      this.dialogue.start([
        { speaker: 'June', text: 'A locked door. Great. Love that for me.' },
        { speaker: 'June', text: 'There was a pipe back there… and a “cave” full of shiny things.' },
        { speaker: 'June', text: 'If there’s a key, it’s probably hiding down that tube.' }
      ]);
    });

    const txt = this.add.text(doorX - 140, 6 * this.TS - 20, 'FIND THE KEY • UNLOCK THE DOOR', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    txt.setDepth(11);
  }

  private completeTrial(): void {
    if (this.finishing) return;
    this.finishing = true;
    if (this.gameState.data.platformTrialComplete) return;

    this.gameState.data.platformTrialComplete = true;
    this.gameState.setObjective('Vuelve al gimnasio por la llave.');

    this.dialogue.start(
      [
        { speaker: 'June', text: '…Okay. That counted. I think.' },
        { speaker: 'June', text: 'If the universe wanted me to jump around like that, it could’ve just asked.' }
      ],
      () => {
        // Return to EastForest near the portal
        RoomTransitions.transition(this, 'EastForestScene', 980, 420);
      }
    );
  }

  private respawn(): void {
    // Soft respawn (don’t change global health/progression)
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

  private addGapMarker(startX: number, y: number, widthTiles: number): void {
    const x = startX * this.TS;
    const yPx = y * this.TS;
    const w = widthTiles * this.TS;
    const g = this.add.graphics();
    g.fillStyle(0x0b0f1f, 0.9);
    g.fillRect(x, yPx, w, this.TS);
    g.setDepth(1);
  }

  private placeSolid(tx: number, ty: number, kind: 'G' | 'X' | 'B' | 'Q' | 'P'): void {
    const key = `${tx},${ty}`;
    this.solidsByKey.set(key, kind);

    // Visual
    const x = tx * this.TS;
    const y = ty * this.TS;
    const g = this.add.graphics();

    // Tile palette (original, readable)
    const base =
      kind === 'G' ? 0x2f241b : // dirt
      kind === 'X' ? 0x3e3e44 : // stone
      kind === 'P' ? 0x1f6a36 : // pipe green
      kind === 'Q' ? 0x9b7a2c : // question/brick warm
      0x7a4a2a; // brick

    // Base
    g.fillStyle(base, 1);
    g.fillRect(x, y, this.TS, this.TS);

    // Inner shading + highlight for “chunky” SNES readability
    const inner = Phaser.Display.Color.IntegerToColor(base).brighten(15).color;
    g.fillStyle(inner, 0.95);
    g.fillRect(x + 2, y + 2, this.TS - 4, this.TS - 4);
    g.lineStyle(1, 0x000000, 0.35);
    g.strokeRect(x + 0.5, y + 0.5, this.TS - 1, this.TS - 1);

    // Kind-specific details
    if (kind === 'G') {
      // Grass lip on top
      g.fillStyle(0x2e7a4a, 1);
      g.fillRect(x, y, this.TS, 3);
      g.fillStyle(0x4bd18b, 0.7);
      g.fillRect(x, y, this.TS, 1);
    }

    if (kind === 'X') {
      // Speckles
      g.fillStyle(0x6a6a72, 0.6);
      g.fillRect(x + 4, y + 5, 2, 2);
      g.fillRect(x + 10, y + 9, 2, 2);
      g.fillRect(x + 6, y + 11, 1, 1);
    }

    if (kind === 'B') {
      // Brick seams
      g.lineStyle(1, 0x000000, 0.20);
      g.lineBetween(x + 1, y + 6, x + this.TS - 2, y + 6);
      g.lineBetween(x + 1, y + 11, x + this.TS - 2, y + 11);
      g.lineBetween(x + 8, y + 2, x + 8, y + 6);
      g.lineBetween(x + 5, y + 6, x + 5, y + 11);
      g.lineBetween(x + 11, y + 11, x + 11, y + this.TS - 2);
    }

    if (kind === 'P') {
      // Pipe rim + highlight
      g.fillStyle(0x2aa65a, 0.8);
      g.fillRect(x + 3, y + 2, 3, this.TS - 4);
      g.fillStyle(0x0f3a1f, 0.35);
      g.fillRect(x + this.TS - 5, y + 2, 2, this.TS - 4);
    }

    if (kind === 'Q') {
      // Question face
      g.fillStyle(0xffd700, 0.18);
      g.fillRect(x + 2, y + 2, this.TS - 4, this.TS - 4);
      const t = this.add.text(x + 5, y + 1, '?', { fontSize: '12px', color: '#fff2a8', fontFamily: 'Arial', fontStyle: 'bold' });
      t.setDepth(7);
    }

    g.setDepth(6);

    // Physics tile
    const c = this.add.rectangle(x + 8, y + 8, this.TS, this.TS);
    c.setVisible(false);
    this.platforms.add(c);

    // Track brick visuals for breaking/used-state
    if (kind === 'B') this.bricksByKey.set(key, c);
  }

  private placeX(tx: number, ty: number): void {
    this.placeSolid(tx, ty, 'X');
  }

  private placeBrick(tx: number, ty: number): void {
    const key = `${tx},${ty}`;
    this.placeSolid(tx, ty, 'B');
    // Mark for breaking (visual is in graphics; collider is stored)
    const collider = this.bricksByKey.get(key);
    if (collider) collider.setData('breakable', true);
  }

  private placeQuestion(tx: number, ty: number, kind: 'mushroom' | 'coin'): void {
    const key = `${tx},${ty}`;
    this.placeSolid(tx, ty, 'Q');
    this.questionsByKey.set(key, { used: false, kind });
  }

  private placePipe(tx: number, topY: number, heightTiles: number): void {
    for (let y = topY; y < topY + heightTiles; y++) this.placeSolid(tx, y, 'P');
  }

  private checkHeadBump(): void {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const headX = body.center.x;
    const headY = body.top - 2;

    const tx = Math.floor(headX / this.TS);
    const ty = Math.floor(headY / this.TS);
    const key = `${tx},${ty}`;
    const kind = this.solidsByKey.get(key);
    if (!kind) return;

    // Brick
    if (kind === 'B') {
      if (this.powered) {
        this.breakTile(tx, ty);
      } else {
        this.bumpEffect(tx, ty);
      }
      return;
    }

    // Question block
    if (kind === 'Q') {
      const q = this.questionsByKey.get(key);
      if (!q || q.used) return;
      q.used = true;
      this.bumpEffect(tx, ty);
      if (q.kind === 'mushroom' && !this.powered) {
        this.spawnPowerUp(tx, ty - 1);
      } else {
        this.spawnCoinPickup(tx, ty - 1);
      }
      return;
    }
  }

  private bumpEffect(tx: number, ty: number): void {
    const x = tx * this.TS + 8;
    const y = ty * this.TS + 8;
    const p = this.add.circle(x, y, 6, 0xffffff, 0.6);
    p.setDepth(20);
    this.tweens.add({
      targets: p,
      alpha: 0,
      scale: 1.6,
      duration: 220,
      onComplete: () => p.destroy()
    });
  }

  private spawnCoinPickup(tx: number, ty: number): void {
    const coin = this.physics.add.image(tx * this.TS + 8, ty * this.TS + 8, 'key');
    coin.setTint(0xffd700);
    coin.setScale(1.0);
    coin.setVelocityY(-220);
    coin.setAccelerationY(900);
    coin.setDepth(20);
    this.time.delayedCall(350, () => coin.destroy());
    this.coinCount++;
    this.hudText.setText(`MONEDAS: ${this.coinCount}`);
  }

  private spawnPowerUp(tx: number, ty: number): void {
    const p = this.physics.add.sprite(tx * this.TS + 8, ty * this.TS + 8, 'key_item');
    p.setScale(0.7);
    p.setDepth(20);
    p.setVelocityY(-180);
    p.setBounce(0);
    p.setCollideWorldBounds(true);
    this.physics.add.collider(p, this.platforms);
    this.physics.add.overlap(this.hero, p, () => {
      p.destroy();
      this.powered = true;
      this.hero.setTint(0xffe8a3);
      this.dialogue.start([{ speaker: 'June', text: 'Ok. Me siento… un poquito más capaz.' }]);
    });
  }

  private breakTile(tx: number, ty: number): void {
    const key = `${tx},${ty}`;
    this.solidsByKey.delete(key);
    this.bricksByKey.delete(key);

    // Remove collider tile by destroying the last matching static body in that spot:
    // (Simpler approach: just add a one-shot “hole” effect and leave collider; but we want it truly breakable.)
    // We'll scan static bodies and destroy the one at that center.
    const cx = tx * this.TS + 8;
    const cy = ty * this.TS + 8;
    this.platforms.getChildren().forEach(obj => {
      const r = obj as Phaser.GameObjects.Rectangle;
      if (Math.abs(r.x - cx) < 0.5 && Math.abs(r.y - cy) < 0.5) {
        r.destroy();
      }
    });

    // Visual shards
    for (let i = 0; i < 4; i++) {
      const s = this.add.rectangle(cx, cy, 4, 4, 0xdeb887);
      s.setDepth(30);
      this.tweens.add({
        targets: s,
        x: cx + (Math.random() * 40 - 20),
        y: cy + (Math.random() * 40 - 40),
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => s.destroy()
      });
    }
  }
}


