import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Slime } from '../entities/enemies/Slime';
import { Wisp } from '../entities/enemies/Wisp';
import { GameState } from '../game/GameState';
import { GameConfig } from '../game/GameConfig';
import { InputRouter } from '../systems/InputRouter';
import { DialogueSystem } from '../systems/DialogueSystem';
import { InteractSystem } from '../systems/InteractSystem';
import { RoomTransitions } from '../systems/RoomTransitions';
import { musicManager } from '../audio/MusicManager';
import { SceneFX } from '../visual/SceneFX';

export class NorthForestScene extends Phaser.Scene {
  public player!: Player;
  private inputRouter!: InputRouter;
  private dialogueSystem!: DialogueSystem;
  private interactSystem!: InteractSystem;
  private gameState: GameState;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: (Slime | Wisp)[] = [];
  private tonyFollower?: Phaser.GameObjects.Sprite;

  private readonly W = 2560;
  private readonly H = 1920;

  constructor() {
    super({ key: 'NorthForestScene' });
    this.gameState = GameState.getInstance();
  }

  create(): void {
    // Music timeline (north):
    // - heading north after rescuing Tony: '5'
    // - final village onward (winter blessing): 'silent_night'
    // - otherwise: '1' (post-Gabi) or '4' (post-library)
    if (this.gameState.data.winterBlessing) musicManager.play('silent_night');
    else if (this.gameState.data.bearDefeated && !this.gameState.data.finalActStarted && !this.gameState.data.finalBossDefeated) musicManager.play('5');
    else if (this.gameState.data.hasKeyRelic) musicManager.play('4');
    else if (!this.gameState.data.metGabi) musicManager.play('0');
    else musicManager.play('1');

    SceneFX.addOverlay(this, 'cool', { strength: 0.95, vignette: 0.09 });
    SceneFX.addParticles(this, 'cool', { density: 0.85, tint: 0xaaccff });
    SceneFX.addFog(this, 7, { alpha: 0.055, tint: 0x6a8aaa, scrollFactor: 0.12 });

    this.createForestMap();

    const spawnX = this.gameState.data.spawnScene === 'NorthForestScene' ? this.gameState.data.spawnX : this.W / 2;
    const spawnY = this.gameState.data.spawnScene === 'NorthForestScene' ? this.gameState.data.spawnY : this.H - 140;

    this.player = new Player(this, spawnX, spawnY);
    this.maybeCreateTonyFollower();

    this.inputRouter = new InputRouter(this);
    this.dialogueSystem = new DialogueSystem(this);
    this.interactSystem = new InteractSystem(this);

    this.spawnEnemies();

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.walls);

    this.setupInteractions();

    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.physics.world.setBounds(0, 0, this.W, this.H);
  }

  update(): void {
    if (!this.dialogueSystem.isDialogueActive()) {
      if (this.inputRouter.isAttackPressed()) this.player.attack();
      if (this.inputRouter.isInteractPressed()) this.interactSystem.interact();

      const mv = this.inputRouter.getMovementVector();
      this.player.move(mv.x, mv.y, mv.direction);
      this.interactSystem.update(this.player.x, this.player.y);

      this.updateTonyFollower();
    } else {
      this.player.move(0, 0, null);
      this.interactSystem.hidePrompt();
      if (this.inputRouter.isConfirmPressed()) this.dialogueSystem.advance();
    }

    this.player.preUpdate(this.time.now, this.game.loop.delta);

    this.enemies.forEach(e => {
      if (!e.active) return;
      e.preUpdate(this.time.now, this.game.loop.delta);

      if (this.physics.overlap(this.player, e) && !this.player.isInvulnerable()) {
        this.player.takeDamage(e.getDamage(), e.x, e.y);
      }

      const sword = this.player.getSwordHitbox();
      if (sword && this.physics.overlap(sword, e)) {
        e.takeDamage(1, this.player.x, this.player.y);
      }
    });
  }

  private createForestMap(): void {
    // If the winter blessing happened, the North map becomes the village of Laponia.
    if (this.gameState.data.winterBlessing) {
      this.createLaponiaVillageMap();
      return;
    }

    const tileSize = 32;
    const width = this.W;
    const height = this.H;

    // Grass base (3 variants)
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const r = Math.random();
        const texture = r < 0.4 ? 'floor_grass' : r < 0.7 ? 'floor_grass_1' : 'floor_grass_2';
        const tile = this.add.image(x, y, texture).setOrigin(0, 0);
        tile.setDepth(0);
      }
    }

    // Soft path from south entrance to boss gate
    for (let y = height - 200; y > 520; y -= 32) {
      const tile = this.add.image(width / 2, y, 'floor_path').setOrigin(0.5, 0.5);
      tile.setDepth(1);
    }

    // Ground life (dense but readable)
    for (let i = 0; i < 220; i++) {
      const x = 120 + Math.random() * (width - 240);
      const y = 120 + Math.random() * (height - 240);
      const r = Math.random();
      const key = r < 0.7 ? 'tall_grass' : r < 0.9 ? 'flower' : 'bush';
      const deco = this.add.image(x, y, key);
      deco.setDepth(y);
      if (key === 'bush') deco.setScale(0.9 + Math.random() * 0.25).setAlpha(0.95);
      else if (key === 'flower') deco.setScale(0.7 + Math.random() * 0.25).setAlpha(0.95);
      else deco.setScale(0.8 + Math.random() * 0.4).setAlpha(0.75);
    }

    // Forest boundary walls
    this.walls = this.physics.add.staticGroup();
    const wallThickness = 64;
    const wallRects = [
      { x: width / 2, y: wallThickness / 2, w: width, h: wallThickness },
      { x: width / 2, y: height - wallThickness / 2, w: width, h: wallThickness },
      { x: wallThickness / 2, y: height / 2, w: wallThickness, h: height },
      { x: width - wallThickness / 2, y: height / 2, w: wallThickness, h: height }
    ];
    wallRects.forEach(r => {
      const c = this.add.rectangle(r.x, r.y, r.w, r.h);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Dense trees/rocks for readability (corridor to the gate)
    this.placeTreeWallWithGaps();
    this.placeRocksAndDetails();

    // Boss gate landmark at top-center
    this.createBossGateStructure(width / 2, 420);
  }

  private createLaponiaVillageMap(): void {
    const tileSize = 32;
    const width = this.W;
    const height = this.H;

    // Snow ground
    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const r = Math.random();
        const texture = r < 0.4 ? 'floor_snow' : r < 0.7 ? 'floor_snow_1' : 'floor_snow_2';
        this.add.image(x, y, texture).setOrigin(0, 0).setDepth(0);
      }
    }

    // Packed snow path back to hub (bottom-center)
    for (let y = height - 200; y > 520; y -= 32) {
      this.add.image(width / 2, y, 'floor_snow_path').setOrigin(0.5, 0.5).setDepth(1);
    }

    // Snowfall
    const snow = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: 1280 },
      y: -20,
      lifespan: 9000,
      speedY: { min: 20, max: 70 },
      speedX: { min: -12, max: 12 },
      scale: { start: 0.22, end: 0.65 },
      alpha: { start: 0.8, end: 0.15 },
      frequency: 80,
      blendMode: 'ADD'
    });
    snow.setScrollFactor(0.2);
    snow.setDepth(9999);

    // Walls (keep boundaries)
    this.walls = this.physics.add.staticGroup();
    const wallThickness = 64;
    const wallRects = [
      { x: width / 2, y: wallThickness / 2, w: width, h: wallThickness },
      { x: width / 2, y: height - wallThickness / 2, w: width, h: wallThickness },
      { x: wallThickness / 2, y: height / 2, w: wallThickness, h: height },
      { x: width - wallThickness / 2, y: height / 2, w: wallThickness, h: height }
    ];
    wallRects.forEach(r => {
      const c = this.add.rectangle(r.x, r.y, r.w, r.h);
      c.setVisible(false);
      this.walls.add(c);
    });

    // Laponia title
    this.add.text(width / 2, 110, 'LAPONIA', {
      fontSize: '34px',
      color: '#ffffff',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);

    // Village houses (simple, readable silhouettes)
    for (let i = 0; i < 6; i++) {
      const hx = 520 + i * 260;
      const hy = 520 + (i % 2) * 40;
      const house = this.add.graphics();
      house.fillStyle(0x8b6446, 1);
      house.fillRect(hx - 70, hy, 140, 100);
      house.fillStyle(0x4a3020, 1);
      house.fillTriangle(hx - 95, hy, hx + 95, hy, hx, hy - 70);
      // warm windows
      house.fillStyle(0xffd700, 0.55);
      house.fillRect(hx - 40, hy + 30, 30, 30);
      house.fillRect(hx + 10, hy + 30, 30, 30);
      house.setDepth(hy + 100);
    }

    // Street lanterns (warm glows in the snow)
    const lanterns = [
      { x: width / 2 - 240, y: 820 },
      { x: width / 2 + 40, y: 920 },
      { x: width / 2 + 320, y: 780 }
    ];
    lanterns.forEach(l => {
      const lamp = this.add.image(l.x, l.y, 'lamp').setDepth(l.y).setScale(1.8);
      const glow = this.add.circle(l.x, l.y - 10, 120, 0xfff1c2, 0.10).setDepth(2);
      glow.setBlendMode(Phaser.BlendModes.SCREEN);
      this.tweens.add({ targets: [lamp, glow], alpha: { from: 0.9, to: 1 }, yoyo: true, repeat: -1, duration: 1400 });
    });

    // Villagers (proper sprites)
    const villagerSpots = [
      { x: width / 2 - 120, y: 980, key: 'villager_1' },
      { x: width / 2 + 80, y: 1040, key: 'villager_2' },
      { x: width / 2 + 220, y: 960, key: 'villager_3' },
      { x: width / 2 - 320, y: 1080, key: 'villager_2' },
      { x: width / 2 + 360, y: 1120, key: 'villager_1' }
    ];
    villagerSpots.forEach(v => {
      const s = this.add.sprite(v.x, v.y, v.key).setScale(2);
      s.setDepth(v.y);
      this.tweens.add({ targets: s, y: v.y - 6, yoyo: true, repeat: -1, duration: 900 + Math.random() * 700 });
    });

    // Decorations: bushes/flowers become snow shrubs
    for (let i = 0; i < 90; i++) {
      const x = 180 + Math.random() * (width - 360);
      const y = 420 + Math.random() * 1120;
      const key = Math.random() < 0.85 ? 'bush' : 'flower';
      const d = this.add.image(x, y, key);
      d.setDepth(y);
      d.setAlpha(0.8);
      d.setTint(0xeaf6ff);
      d.setScale(key === 'bush' ? 0.95 : 0.85);
    }
  }

  private placeTreeWallWithGaps(): void {
    // Create a dense “forest wall” around edges, leaving the south exit readable
    const topY = 150;
    const bottomY = this.H - 150;
    const leftX = 150;
    const rightX = this.W - 150;

    const gapHalf = 180; // keep exit corridor clear
    const centerX = this.W / 2;

    // Top row (no gap)
    for (let x = 220; x < this.W - 220; x += 80) this.addTree(x, topY);
    // Bottom row (leave gap at center for return-to-hub path)
    for (let x = 220; x < this.W - 220; x += 80) {
      if (Math.abs(x - centerX) < gapHalf) continue;
      this.addTree(x, bottomY);
    }
    // Left column
    for (let y = 260; y < this.H - 260; y += 80) this.addTree(leftX, y);
    // Right column
    for (let y = 260; y < this.H - 260; y += 80) this.addTree(rightX, y);

    // Interior clusters framing the main path
    const clusters = [
      { x: centerX - 240, y: 980 },
      { x: centerX + 260, y: 940 },
      { x: centerX - 300, y: 720 },
      { x: centerX + 320, y: 700 }
    ];
    clusters.forEach(c => {
      this.addTree(c.x, c.y);
      this.addTree(c.x + 60, c.y + 40);
      this.addTree(c.x - 50, c.y + 60);
    });
  }

  private placeRocksAndDetails(): void {
    const rocks = [
      { x: this.W / 2 - 360, y: 1260 },
      { x: this.W / 2 + 380, y: 1180 },
      { x: this.W / 2 - 420, y: 640 },
      { x: this.W / 2 + 420, y: 560 }
    ];
    rocks.forEach(r => this.addRock(r.x, r.y));

    // Micro details (doesn't block)
    const mushrooms = [
      { x: 360, y: 220 },
      { x: this.W - 380, y: 260 },
      { x: this.W / 2 - 180, y: 880 },
      { x: this.W / 2 + 140, y: 1040 }
    ];
    mushrooms.forEach(m => this.addDetail('mushroom', m.x, m.y, 0.8));

    for (let i = 0; i < 18; i++) {
      this.addDetail('pebbles', 200 + Math.random() * (this.W - 400), 220 + Math.random() * (this.H - 440), 1);
    }
  }

  private addTree(x: number, y: number): void {
    const tree = this.add.image(x, y, 'tree');
    tree.setDepth(y);
    const collider = this.add.rectangle(x, y + 20, 40, 40);
    collider.setVisible(false);
    this.walls.add(collider);
  }

  private addRock(x: number, y: number): void {
    const rock = this.add.image(x, y, 'rock');
    rock.setDepth(y);
    const collider = this.add.circle(x, y, 24);
    collider.setVisible(false);
    this.walls.add(collider);
  }

  private addDetail(texture: 'mushroom' | 'fallen_log' | 'carved_symbol' | 'pebbles', x: number, y: number, scale = 1): void {
    const o = this.add.image(x, y, texture);
    o.setDepth(Math.max(1, y - 2));
    o.setScale(scale);
    if (texture === 'pebbles') o.setAlpha(0.6);
  }

  private createBossGateStructure(gateX: number, gateY: number): void {
    const gateGraphics = this.add.graphics();

    // Left pillar
    gateGraphics.fillStyle(0x5a5a5a, 1);
    gateGraphics.fillRect(gateX - 80, gateY - 80, 30, 120);
    // Right pillar
    gateGraphics.fillStyle(0x5a5a5a, 1);
    gateGraphics.fillRect(gateX + 50, gateY - 80, 30, 120);

    // Top lintel
    gateGraphics.fillStyle(0x4a4a4a, 1);
    gateGraphics.fillRect(gateX - 85, gateY - 90, 170, 25);

    // Sealed door slab
    const sealed = !this.gameState.data.hasKeyRelic;
    gateGraphics.fillStyle(sealed ? 0x2a2a2a : 0x3a3a3a, 1);
    gateGraphics.fillRect(gateX - 45, gateY - 55, 90, 95);

    // Symbol glow if sealed
    if (sealed) {
      const glow = this.add.circle(gateX, gateY - 10, 70, 0x6a8aaa, 0.12);
      glow.setDepth(gateY - 1);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.06, to: 0.18 },
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        duration: 900
      });
    }

    gateGraphics.setDepth(gateY);
  }

  private spawnEnemies(): void {
    const spawns = [
      { t: 'slime', x: this.W / 2 - 220, y: 1100 },
      { t: 'wisp', x: this.W / 2 + 280, y: 860 },
      { t: 'slime', x: this.W / 2 + 120, y: 1320 }
    ];
    spawns.forEach(s => {
      if (s.t === 'slime') this.enemies.push(new Slime(this, s.x, s.y));
      else this.enemies.push(new Wisp(this, s.x, s.y));
    });
  }

  private setupInteractions(): void {
    // South exit back to hub (center-bottom)
    this.interactSystem.register({
      id: 'to-hub-south',
      x: this.W / 2,
      y: this.H - 90,
      radius: 70,
      promptText: 'Presiona E para volver (camino del Sur)',
      onInteract: () => RoomTransitions.transition(this, 'OverworldScene', this.W / 2, 140)
    });

    // Boss gate interaction
    this.interactSystem.register({
      id: 'north-boss-gate',
      x: this.W / 2,
      y: 420,
      radius: 90,
      promptText: this.gameState.data.finalBossDefeated
        ? 'Presiona E'
        : this.gameState.data.hasKeyRelic
          ? 'Presiona E para entrar'
          : 'Presiona E (sellado)',
      onInteract: () => {
        if (this.gameState.data.finalBossDefeated) {
          this.dialogueSystem.start([{ speaker: 'June', text: 'Está en silencio ahora. Por fin.' }]);
          return;
        }

        // Final act starts after bear is defeated + gate is unlocked (key relic)
        if (this.gameState.data.bearDefeated && this.gameState.data.hasKeyRelic && !this.gameState.data.finalActStarted) {
          // Tony found gift keys after bear
          this.gameState.data.hasGiftKeys = true;
          RoomTransitions.transition(this, 'FinalCaptureScene', 640, 360);
          return;
        }

        if (this.gameState.data.hasKeyRelic) {
          // If final act already started, continue as Tony inside.
          if (this.gameState.data.finalActStarted && !this.gameState.data.finalBossDefeated) {
            // If the new rescue run wasn't completed yet, do the platformer run first.
            if (!this.gameState.data.rescueJuneRunComplete) {
              RoomTransitions.transition(this, 'RescueJuneRunScene', 120, 620);
            } else {
              RoomTransitions.transition(this, 'FinalInsideScene', 220, 560);
            }
            return;
          }
          // Otherwise, keep existing mini-boss path available (optional)
          RoomTransitions.transition(this, 'BossArenaScene', 640, 560);
        } else {
          this.dialogueSystem.start([
            { speaker: 'June', text: "Ajá. Un portón enorme y ominoso. Definitivamente sellado." },
            { speaker: 'June', text: "Si voy a entrar ahí… voy a necesitar algo... especial." }
          ]);
        }
      }
    });
  }

  private maybeCreateTonyFollower(): void {
    // Tony tags along for the “head north together” beat, only after bear is defeated and before June is captured.
    if (!this.gameState.data.bearDefeated) return;
    if (this.gameState.data.finalActStarted) return;
    if (this.gameState.data.finalBossDefeated) return;

    const x = this.player.x + 60;
    const y = this.player.y + 40;
    this.tonyFollower = this.add.sprite(x, y, 'tony');
    this.tonyFollower.setScale(1.8);
    this.tonyFollower.setDepth(y);

    // Small visual “follow” glow so it reads as companion
    const glow = this.add.circle(x, y + 10, 26, 0xffd700, 0.10);
    glow.setDepth(y - 1);
    this.tweens.add({ targets: glow, alpha: { from: 0.06, to: 0.14 }, yoyo: true, repeat: -1, duration: 900 });
    this.tonyFollower.setData('glow', glow);
  }

  private updateTonyFollower(): void {
    if (!this.tonyFollower) return;

    const glow = this.tonyFollower.getData('glow') as Phaser.GameObjects.Arc | undefined;

    // Follow target: slightly behind the player based on velocity direction
    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    const vx = pb.velocity.x;
    const vy = pb.velocity.y;

    let offsetX = -55;
    let offsetY = 40;
    if (Math.abs(vx) > Math.abs(vy)) offsetX = vx >= 0 ? -55 : 55;
    else offsetY = vy >= 0 ? -45 : 55;

    const targetX = this.player.x + offsetX;
    const targetY = this.player.y + offsetY;

    const dx = targetX - this.tonyFollower.x;
    const dy = targetY - this.tonyFollower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Keep a minimum distance (don’t overlap)
    const followSpeed = dist > 220 ? 6.5 : dist > 90 ? 3.5 : 2.0;
    this.tonyFollower.x += dx * 0.02 * followSpeed;
    this.tonyFollower.y += dy * 0.02 * followSpeed;
    this.tonyFollower.setDepth(this.tonyFollower.y);

    if (glow) {
      glow.x = this.tonyFollower.x;
      glow.y = this.tonyFollower.y + 10;
      glow.setDepth(this.tonyFollower.y - 1);
    }
  }
}


