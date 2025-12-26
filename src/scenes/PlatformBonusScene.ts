import Phaser from 'phaser';
import { GameState } from '../game/GameState';
import { RoomTransitions } from '../systems/RoomTransitions';
import { SceneFX } from '../visual/SceneFX';
import { DialogueSystem } from '../systems/DialogueSystem';

export class PlatformBonusScene extends Phaser.Scene {
  private gameState: GameState;
  private dialogue!: DialogueSystem;
  private hero!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.Group;
  private noteZone!: Phaser.GameObjects.Rectangle;
  private keyZone!: Phaser.GameObjects.Rectangle;
  private keySprite?: Phaser.GameObjects.Image;
  private keyGlow?: Phaser.GameObjects.Arc;
  private eKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private showing = false;
  private promptText?: Phaser.GameObjects.Text;

  private readonly TS = 16;
  private readonly TILES_W = 40;
  private readonly TILES_H = 15;
  private readonly W = this.TILES_W * this.TS;
  private readonly H = this.TILES_H * this.TS;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  constructor() {
    super({ key: 'PlatformBonusScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    this.physics.world.gravity.y = 900;
    this.cameras.main.setBackgroundColor(0x1b2440);
    this.cameras.main.setZoom(3);

    SceneFX.addOverlay(this, 'cave');
    SceneFX.addParticles(this, 'cave');
    this.dialogue = new DialogueSystem(this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.platforms = this.physics.add.staticGroup();
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });

    // Background hidden message (backwards)
    const bg = this.add.text(this.W / 2, 80, 'reve naht erom uoy evol', {
      fontSize: '22px',
      color: '#8aa6c8',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic'
    });
    bg.setOrigin(0.5, 0.5);
    bg.setAlpha(0.22);
    bg.setScrollFactor(0.6);

    // Slow drifting fog behind gameplay (purely visual)
    for (let i = 0; i < 5; i++) {
      const fx = 40 + Math.random() * (this.W - 80);
      const fy = 40 + Math.random() * (this.H - 80);
      const fog = this.add.image(fx, fy, 'fog_blob');
      fog.setAlpha(0.05 + Math.random() * 0.06);
      fog.setScale(0.5 + Math.random() * 0.9);
      fog.setScrollFactor(0.4);
      fog.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: fog, x: fx + (-40 + Math.random() * 80), y: fy + (-20 + Math.random() * 40), yoyo: true, repeat: -1, duration: 7000 + Math.random() * 4000, ease: 'Sine.easeInOut' });
    }

    // Ground
    for (let x = 0; x < this.TILES_W; x++) {
      this.addSolidTile(x, 14, 0x3b2a1f);
    }

    // Optional ceiling
    for (let x = 0; x < this.TILES_W; x++) {
      this.addSolidTile(x, 2, 0x2a2038);
    }

    // “Bunch of keys” (coins) rectangle: x=10..25, y=6..10
    for (let x = 10; x <= 25; x++) {
      for (let y = 6; y <= 10; y++) {
        const coin = this.coins.create(x * this.TS + 8, y * this.TS + 8, 'key');
        coin.setTint(0xffd700);
        coin.setScale(1.0);
      }
    }

    // Extra obstacles (simple platforming inside the cave)
    // Small mid platforms
    for (let x = 4; x <= 12; x++) this.addSolidTile(x, 11, 0x2a2038);
    for (let x = 16; x <= 22; x++) this.addSolidTile(x, 9, 0x2a2038);
    for (let x = 26; x <= 32; x++) this.addSolidTile(x, 11, 0x2a2038);

    // Spike strip hazard
    const spikes = this.add.graphics();
    spikes.fillStyle(0x9b1c31, 1);
    spikes.fillRect(12 * this.TS, 14 * this.TS - 6, 8 * this.TS, 6);
    for (let i = 0; i < 8 * this.TS; i += 8) {
      spikes.fillStyle(0xff3b5c, 1);
      spikes.fillTriangle(12 * this.TS + i, 14 * this.TS - 6, 12 * this.TS + i + 4, 14 * this.TS - 14, 12 * this.TS + i + 8, 14 * this.TS - 6);
    }
    spikes.setDepth(8);
    const spikeZone = this.add.rectangle(16 * this.TS, 14 * this.TS - 10, 8 * this.TS, 16);
    spikeZone.setVisible(false);
    this.physics.add.existing(spikeZone, true);

    // Exit pipe at x=34 height 3 (y=12..14) and x=35
    this.drawPipe(34, 12, 3);
    this.drawPipe(35, 12, 3);

    // Hero
    this.hero = this.physics.add.sprite(80, 200, 'player');
    this.hero.setScale(1.4);
    this.hero.setCollideWorldBounds(true);
    (this.hero.body as Phaser.Physics.Arcade.Body).setSize(18, 24).setOffset(7, 6);

    this.physics.add.collider(this.hero, this.platforms);
    this.physics.add.overlap(this.hero, this.coins, (_h, c) => c.destroy());
    this.physics.add.overlap(this.hero, spikeZone as any, () => {
      this.hero.setPosition(80, 200);
      this.hero.setVelocity(0, 0);
      this.cameras.main.shake(120, 0.006);
    });

    // Note (Dirac equation + riddle) — place on an actually reachable platform
    // Platform row exists at y=11 for x=4..12, so put note just above it.
    const noteTX = 10;
    const noteTY = 10;
    const note = this.add.rectangle(noteTX * this.TS + 8, noteTY * this.TS + 8, 18, 14, 0xffffcc, 1);
    note.setDepth(9);
    const noteInk = this.add.text(noteTX * this.TS + 8, noteTY * this.TS + 8, 'NOTE', { fontSize: '8px', color: '#2a2a2a', fontFamily: 'Arial', fontStyle: 'bold' });
    noteInk.setOrigin(0.5, 0.5);
    noteInk.setDepth(10);
    this.noteZone = this.add.rectangle(noteTX * this.TS + 8, noteTY * this.TS + 8, 28, 28);
    this.noteZone.setVisible(false);
    this.physics.add.existing(this.noteZone, true);

    // Key item (required for end door)
    // Put key closer to the pipe corridor so it's reachable and obvious.
    const keyTX = 22;
    const keyTY = 8;
    this.keySprite = this.add.image(keyTX * this.TS + 8, keyTY * this.TS + 8, 'key_item');
    this.keySprite.setScale(0.55);
    this.keySprite.setDepth(10);
    this.keyGlow = this.add.circle(keyTX * this.TS + 8, keyTY * this.TS + 8, 14, 0xffd700, 0.25);
    this.keyGlow.setDepth(9);
    this.tweens.add({ targets: this.keyGlow, alpha: { from: 0.12, to: 0.35 }, yoyo: true, repeat: -1, duration: 700 });
    this.keyZone = this.add.rectangle(keyTX * this.TS + 8, keyTY * this.TS + 8, 30, 30);
    this.keyZone.setVisible(false);
    this.physics.add.existing(this.keyZone, true);

    // Exit sensor on pipe top
    const exitZone = this.add.rectangle(34 * this.TS + 16, 12 * this.TS - 2, 2 * this.TS, 10);
    exitZone.setVisible(false);
    this.physics.add.existing(exitZone, true);
    this.physics.add.overlap(this.hero, exitZone as any, () => {
      // Return to main trial near x=72
      RoomTransitions.transition(this, 'PlatformTrialScene', 72 * this.TS + 8, 12 * this.TS);
    });

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.hero, true, 0.15, 0.15);
    this.physics.world.setBounds(0, 0, this.W, this.H);

    this.add.text(10, 10, 'CUEVA', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000);

    this.add.text(10, 26, 'Toca NOTA/LLAVE para interactuar', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0).setAlpha(0.8).setDepth(1000);

    // Small on-screen prompt (only shown when standing near something)
    this.promptText = this.add.text(this.W / 2, this.H - 40, 'Presiona E', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 6 }
    });
    this.promptText.setOrigin(0.5, 0.5);
    this.promptText.setScrollFactor(0);
    this.promptText.setDepth(1500);
    this.promptText.setVisible(false);
  }

  update(): void {
    if (this.dialogue.isDialogueActive()) {
      // Freeze while reading
      this.hero.setVelocity(0, 0);
      if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.dialogue.advance();
      }
      return;
    }
    // Interactions (note + key): show prompt when in range, and allow E to activate.
    const nearNote = !!this.noteZone && this.physics.overlap(this.hero, this.noteZone as any);
    const nearKey = !!this.keyZone && this.physics.overlap(this.hero, this.keyZone as any);
    if (this.promptText && !this.showing) {
      this.promptText.setVisible(nearNote || nearKey);
      if (nearNote) this.promptText.setText('Presiona E para leer la nota');
      else if (nearKey) this.promptText.setText('Presiona E para tomar la llave');
    }

    // Auto-open note the first time you touch it (so it never feels “ungettable”)
    if (!this.showing && nearNote && !this.gameState.data.platformCaveNoteRead) {
      this.openNote();
    }

    if (!this.showing && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (nearNote) {
        this.openNote();
      } else if (nearKey) {
        if (!this.gameState.data.platformCaveKeyFound) {
          this.gameState.data.platformCaveKeyFound = true;
          this.gameState.setObjective('Regresa a la Prueba y abre la puerta.');
          this.keySprite?.destroy();
          this.keyGlow?.destroy();
          this.keyZone.destroy();
          this.keyZone = undefined as any;
        }
      }
    }

    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const left = !!this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = !!this.cursors.right?.isDown || this.wasd.D.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.cursors.space!) || Phaser.Input.Keyboard.JustDown(this.wasd.W);

    const speed = 220;
    if (left && !right) this.hero.setVelocityX(-speed);
    else if (right && !left) this.hero.setVelocityX(speed);
    else this.hero.setVelocityX(0);

    if (jumpPressed && onGround) this.hero.setVelocityY(-420);

    if (this.hero.y > this.H + 200) {
      this.hero.setPosition(80, 200);
      this.hero.setVelocity(0, 0);
    }
  }

  private openNote(): void {
    if (this.showing) return;
    this.showing = true;
    this.gameState.data.platformCaveNoteRead = true;
    this.gameState.setObjective('Encuentra la llave de la cueva y luego abre la puerta al final de la Prueba.');

    // Read the note as a proper dialogue sequence (simple + reliable)
    const lines = [
      { speaker: 'Nota', text: 'DIRAC:\n(i γ^μ ∂_μ − m) ψ = 0' },
      { speaker: 'Nota', text: 'ACERTIJO:\n“Dos estados. Una pieza faltante.\nEncuentra a quien completa la medición.”' },
      { speaker: 'Nota', text: '— Tony está en el bosque.\n— Tony es crucial para resolver este misterio.' },
      { speaker: 'June', text: '…Ok. Tony primero. Luego el resto del misterio.' }
    ];

    this.dialogue.start(lines, () => {
      this.showing = false;
    });
  }

  private addSolidTile(tx: number, ty: number, color: number): void {
    const x = tx * this.TS;
    const y = ty * this.TS;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(x, y, this.TS, this.TS);
    g.setDepth(5);

    const c = this.add.rectangle(x + 8, y + 8, this.TS, this.TS);
    c.setVisible(false);
    this.platforms.add(c);
  }

  private drawPipe(tx: number, topY: number, heightTiles: number): void {
    const g = this.add.graphics();
    for (let y = topY; y < topY + heightTiles; y++) {
      const xPx = tx * this.TS;
      const yPx = y * this.TS;
      g.fillStyle(0x2d7a3e, 1);
      g.fillRect(xPx, yPx, this.TS, this.TS);
      g.fillStyle(0x3aa657, 0.7);
      g.fillRect(xPx + 2, yPx + 2, this.TS - 4, this.TS - 4);

      const c = this.add.rectangle(xPx + 8, yPx + 8, this.TS, this.TS);
      c.setVisible(false);
      this.platforms.add(c);
    }
    g.setDepth(6);
  }
}


