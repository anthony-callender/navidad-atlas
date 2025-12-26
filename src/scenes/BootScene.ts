import Phaser from 'phaser';
import { musicManager } from '../audio/MusicManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
  
  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Navidad Atlas...', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    percentText.setOrigin(0.5, 0.5);
    
    // Update loading bar
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffd700, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    // Load LPC Atlas2 tiles (you downloaded these!)
    this.load.image('atlas_build', 'Atlas2/build_atlas.png');
    this.load.image('atlas_objects', 'Atlas2/obj_misk_atlas.png');
    
    // For now, we'll generate character sprites programmatically
    // This will look MUCH better than tree sprites
    this.generatePlayerSprite();
    this.generateEnemySprites();
    this.generateItemSprites();
  }
  
  create(): void {
    // Start with title screen
    this.scene.start('TitleScene');
  }
  
  private generatePlayerSprite(): void {
    // Create June (32x32) with directional + walk variants.
    // Terraria-inspired readability: chunky silhouette, strong outline, clear facing.
    const graphics = this.add.graphics();

    const drawJune = (direction: 'down' | 'up' | 'side', step: 0 | 1) => {
      graphics.clear();

      // Palette
      const hair = 0x101010; // black hair (requirement)
      const hairHi = 0x2a2a2a;
      const skin = 0xffd2b0;
      const coat = 0x2d2f7a; // winter coat
      const coatHi = 0x3b3fb0;
      const scarf = 0xc62828; // red scarf
      const boots = 0x2a1a10;

      // Shadow base
      graphics.fillStyle(0x000000, 0.18);
      graphics.fillEllipse(16, 28, 14, 6);

      // Legs (step alternation)
      graphics.fillStyle(boots, 1);
      if (step === 0) {
        graphics.fillRect(12, 25, 4, 6);
        graphics.fillRect(16, 26, 4, 5);
      } else {
        graphics.fillRect(12, 26, 4, 5);
        graphics.fillRect(16, 25, 4, 6);
      }

      // Body / coat
      graphics.fillStyle(coat, 1);
      graphics.fillRect(10, 14, 12, 12);
      graphics.fillStyle(coatHi, 0.5);
      graphics.fillRect(11, 15, 5, 10);
      
      // Coat outline + small details (adds “more pixels” / production feel)
      graphics.fillStyle(0x14163a, 0.55);
      graphics.fillRect(10, 14, 12, 1); // top edge
      graphics.fillRect(10, 14, 1, 12); // left edge
      graphics.fillRect(21, 14, 1, 12); // right edge
      graphics.fillRect(10, 25, 12, 1); // bottom edge
      // buttons
      graphics.fillStyle(0xd8d8d8, 0.8);
      graphics.fillRect(16, 16, 1, 1);
      graphics.fillRect(16, 19, 1, 1);
      graphics.fillRect(16, 22, 1, 1);

      // Scarf
      graphics.fillStyle(scarf, 1);
      graphics.fillRect(11, 13, 10, 3);
      graphics.fillRect(18, 16, 3, 6);

      // Head
      graphics.fillStyle(skin, 1);
      graphics.fillCircle(16, 9, 6);

      // Hair (black) — Hime cut:
      // blunt straight bangs + long straight side-locks (hime) + straight back mass.
      graphics.fillStyle(hair, 1);
      if (direction === 'down') {
        // Back mass behind head
        graphics.fillRect(11, 8, 10, 14);

        // Side-locks (straight panels to shoulders)
        graphics.fillRect(7, 9, 5, 14);
        graphics.fillRect(20, 9, 5, 14);
        graphics.fillRect(8, 22, 4, 4);
        graphics.fillRect(20, 22, 4, 4);

        // Top hair arch (smooth dome, less boxy)
        // Build the arch from overlapping circles/ellipse so it reads rounded in pixel art.
        graphics.fillEllipse(16, 6, 18, 11);
        graphics.fillCircle(10, 7, 5);
        graphics.fillCircle(22, 7, 5);
        // Slightly squared lower band to support bangs (keep it higher so face stays visible)
        graphics.fillRect(8, 6, 16, 2);

        // Bangs: keep thin so eyes are always readable
        graphics.fillRect(8, 8, 16, 1);     // bangs line (thin)
        graphics.fillRect(9, 9, 2, 4);      // temple left
        graphics.fillRect(21, 9, 2, 4);     // temple right

        // Repaint ONLY the LOWER face area (no erasing near the hairline).
        // This keeps the bangs clean while guaranteeing no “bald spot” at the top.
        graphics.fillStyle(skin, 1);
        // Slightly larger so eyes/cheeks are fully visible under bangs
        graphics.fillEllipse(16, 12.5, 11.5, 9.2);

        // Re-assert bangs edge + arch after the lower-face repaint
        graphics.fillStyle(hair, 1);
        graphics.fillRect(8, 8, 16, 1);
        graphics.fillCircle(16, 5, 5); // tiny dome topper to smooth the silhouette

        // Subtle highlight
        graphics.fillStyle(hairHi, 0.18);
        graphics.fillEllipse(14, 6, 5, 9);
      } else if (direction === 'up') {
        // Mostly hair (back view)
        graphics.fillEllipse(16, 7, 20, 14);
        graphics.fillRect(8, 7, 16, 15);
        // Side mass reads as straight locks
        graphics.fillRect(7, 9, 5, 14);
        graphics.fillRect(20, 9, 5, 14);
        graphics.fillStyle(hairHi, 0.22);
        graphics.fillEllipse(14, 8, 5, 12);
      } else {
        // Side view: bangs + one visible side-lock + back mass
        graphics.fillRect(11, 6, 10, 14); // back mass
        // For our base "side" sprite we assume FACING RIGHT.
        // Since Player flips this sprite for facing LEFT, we draw the long side-lock on the LEFT side here
        // so it reads correctly when facing right (hair falls behind, not in front of movement direction).
        // Slightly thicker so it covers the ear area while walking left/right.
        graphics.fillRect(6, 9, 9, 16);   // visible side-lock panel (hime side lock)
        graphics.fillCircle(10, 14, 4);   // rounded “ear cover” bulge
        // Smooth top arch on side view
        graphics.fillEllipse(16, 6, 16, 10);
        graphics.fillRect(10, 6, 12, 3);
        graphics.fillRect(10, 8, 12, 1);  // bangs line (thin)
        graphics.fillStyle(hairHi, 0.22);
        graphics.fillEllipse(12, 10, 3, 12);

        // Reveal more face under bangs on side view too
        graphics.fillStyle(skin, 1);
        graphics.fillEllipse(16, 12.5, 11.0, 9.0);
        graphics.fillStyle(hair, 1);
        graphics.fillRect(10, 8, 12, 1);

        // Re-assert side hair AFTER the face repaint so it always covers the ear.
        graphics.fillRect(6, 9, 9, 16);
        graphics.fillCircle(10, 14, 4);
        graphics.fillStyle(hairHi, 0.18);
        graphics.fillRect(8, 11, 2, 10);
      }

      // Face (directional)
      graphics.fillStyle(0x000000, 1);
      if (direction === 'down') {
        // Lowered a bit so hair never “covers” them
        graphics.fillCircle(14, 11, 1);
        graphics.fillCircle(18, 11, 1);
        graphics.fillRect(15, 14, 2, 1); // small mouth
        // tiny eye sparkle (adds crispness)
        graphics.fillStyle(0xffffff, 0.75);
        graphics.fillRect(13, 10, 1, 1);
        graphics.fillRect(17, 10, 1, 1);
        // blush
        graphics.fillStyle(0xff7aa8, 0.22);
        graphics.fillRect(12, 12, 2, 1);
        graphics.fillRect(18, 12, 2, 1);
      } else if (direction === 'up') {
        // back of head feel: no eyes, show hair bun/shine
        graphics.fillStyle(hairHi, 0.6);
        graphics.fillCircle(16, 8, 2);
      } else {
        // side: one eye
        graphics.fillCircle(18, 11, 1);
        graphics.fillRect(18, 14, 2, 1);
        graphics.fillStyle(0xffffff, 0.75);
        graphics.fillRect(17, 10, 1, 1);
        graphics.fillStyle(0xff7aa8, 0.22);
        graphics.fillRect(17, 12, 2, 1);
      }

      // Arms (simple)
      graphics.fillStyle(coat, 1);
      if (direction === 'up') {
        graphics.fillRect(9, 15, 3, 6);
        graphics.fillRect(20, 15, 3, 6);
      } else {
        graphics.fillRect(9, 16, 3, 6);
        graphics.fillRect(20, 16, 3, 6);
      }
    };

    const save = (key: string, direction: 'down' | 'up' | 'side', step: 0 | 1) => {
      const rt = this.add.renderTexture(0, 0, 32, 32);
      drawJune(direction, step);
      rt.draw(graphics, 0, 0);
      rt.saveTexture(key);
      rt.destroy();
    };

    save('player_down_0', 'down', 0);
    save('player_down_1', 'down', 1);
    save('player_up_0', 'up', 0);
    save('player_up_1', 'up', 1);
    save('player_side_0', 'side', 0);
    save('player_side_1', 'side', 1);

    // Back-compat: keep 'player' key as default idle (down)
    save('player', 'down', 0);

    graphics.destroy();
  }
  
  private generateEnemySprites(): void {
    // Slime - cute green blob
    let graphics = this.add.graphics();
    let renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    graphics.fillStyle(0x90ee90, 1);
    graphics.fillEllipse(16, 18, 20, 16);
    graphics.fillStyle(0x228b22, 0.5);
    graphics.fillEllipse(16, 20, 16, 12);
    // Eyes
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(12, 16, 2);
    graphics.fillCircle(20, 16, 2);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(13, 15, 1);
    graphics.fillCircle(21, 15, 1);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('slime');
    graphics.clear();
    renderTexture.destroy();
    
    // Wisp - purple ghost
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    graphics.fillStyle(0xda70d6, 0.8);
    graphics.fillCircle(16, 14, 10);
    graphics.fillStyle(0x9370db, 0.6);
    graphics.fillCircle(16, 16, 8);
    // Wispy tail
    graphics.fillTriangle(10, 22, 22, 22, 16, 28);
    // Eyes
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(12, 14, 3);
    graphics.fillCircle(20, 14, 3);
    graphics.fillStyle(0x4b0082, 1);
    graphics.fillCircle(12, 14, 2);
    graphics.fillCircle(20, 14, 2);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('wisp');
    graphics.clear();
    renderTexture.destroy();
    
    // Bear (32x32) - chunky dark silhouette with snout
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    // Body
    graphics.fillStyle(0x2a1a10, 1);
    graphics.fillEllipse(16, 20, 22, 18);
    // Head
    graphics.fillStyle(0x3a2418, 1);
    graphics.fillCircle(16, 12, 8);
    // Ears
    graphics.fillCircle(10, 7, 3);
    graphics.fillCircle(22, 7, 3);
    // Snout
    graphics.fillStyle(0x4a3020, 1);
    graphics.fillEllipse(16, 14, 10, 7);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(16, 15, 1.5);
    // Eyes
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(13, 11, 1);
    graphics.fillCircle(19, 11, 1);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(13, 11, 0.5);
    graphics.fillCircle(19, 11, 0.5);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('bear');
    graphics.clear();
    renderTexture.destroy();
    
    // Boss - large intimidating creature
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 64, 64);
    
    // Dark body
    graphics.fillStyle(0x4b0082, 1);
    graphics.fillEllipse(32, 40, 40, 35);
    // Head
    graphics.fillCircle(32, 24, 18);
    // Horns
    graphics.lineStyle(4, 0x8b008b);
    graphics.beginPath();
    graphics.moveTo(20, 20);
    graphics.lineTo(15, 10);
    graphics.moveTo(44, 20);
    graphics.lineTo(49, 10);
    graphics.strokePath();
    // Eyes (glowing)
    graphics.fillStyle(0xff00ff, 1);
    graphics.fillCircle(26, 24, 4);
    graphics.fillCircle(38, 24, 4);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('boss');
    graphics.clear();
    renderTexture.destroy();
    
    // NPC (Gabi) - fatherly old man with amnesia (warm robe, white beard)
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    // Shadow
    graphics.fillStyle(0x000000, 0.18);
    graphics.fillEllipse(16, 28, 14, 6);
    
    // Robe (deep blue) + trim
    graphics.fillStyle(0x2a3a6a, 1);
    graphics.fillRect(10, 14, 12, 16);
    graphics.fillStyle(0x3f568b, 0.5);
    graphics.fillRect(11, 15, 4, 14);
    graphics.fillStyle(0xc2b280, 1);
    graphics.fillRect(10, 14, 12, 2);
    
    // Head (aged skin)
    graphics.fillStyle(0xf2c6a0, 1);
    graphics.fillCircle(16, 10, 6);
    
    // Hair + beard (white/gray, fuller)
    graphics.fillStyle(0xe6e6e6, 1);
    graphics.fillCircle(13, 6, 4);
    graphics.fillCircle(19, 6, 4);
    graphics.fillRect(11, 6, 10, 3);
    graphics.fillEllipse(16, 16, 12, 10);
    graphics.fillStyle(0xcfcfcf, 0.8);
    graphics.fillEllipse(16, 17, 10, 8);
    
    // Eyes (kind)
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(14, 10, 1);
    graphics.fillCircle(18, 10, 1);
    // Brows
    graphics.fillStyle(0xcfcfcf, 1);
    graphics.fillRect(13, 8, 3, 1);
    graphics.fillRect(17, 8, 3, 1);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('npc');
    graphics.clear();
    renderTexture.destroy();
    
    // TONY - brown skin, curly hair (requirement)
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    // Shadow
    graphics.fillStyle(0x000000, 0.18);
    graphics.fillEllipse(16, 28, 14, 6);
    
    // Body - plaid flannel shirt (red/black)
    graphics.fillStyle(0xcc3333, 1);
    graphics.fillRect(8, 16, 16, 16);
    
    // Plaid pattern
    graphics.lineStyle(2, 0x330000, 0.6);
    graphics.lineBetween(8, 20, 24, 20);
    graphics.lineBetween(8, 26, 24, 26);
    graphics.lineStyle(2, 0x330000, 0.6);
    graphics.lineBetween(12, 16, 12, 32);
    graphics.lineBetween(20, 16, 20, 32);
    
    // Head - brown skin
    graphics.fillStyle(0x8d5524, 1);
    graphics.fillCircle(16, 9, 6);
    graphics.fillStyle(0xa66a3f, 0.6);
    graphics.fillCircle(14, 9, 2);
    
    // Curly hair (dark brown curls)
    graphics.fillStyle(0x2a1a10, 1);
    const curls = [
      { x: 11, y: 5 }, { x: 14, y: 4 }, { x: 17, y: 4 }, { x: 20, y: 5 },
      { x: 12, y: 7 }, { x: 16, y: 6 }, { x: 20, y: 7 }
    ];
    curls.forEach(c => graphics.fillCircle(c.x, c.y, 3));
    graphics.fillRect(10, 6, 12, 3);
    
    // Eyes
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(14, 9, 1);
    graphics.fillCircle(18, 9, 1);
    
    // Smile (friendly guy)
    graphics.lineStyle(1, 0x000000, 1);
    graphics.arc(16, 11, 3, 0, Math.PI);
    
    // Jeans
    graphics.fillStyle(0x4169e1, 1);
    graphics.fillRect(10, 28, 5, 4);
    graphics.fillRect(17, 28, 5, 4);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('tony');
    graphics.destroy();
    renderTexture.destroy();
  }
  
  private generateItemSprites(): void {
    // Heart
    let graphics = this.add.graphics();
    let renderTexture = this.add.renderTexture(0, 0, 16, 16);
    
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(5, 5, 4);
    graphics.fillCircle(11, 5, 4);
    graphics.fillTriangle(2, 6, 14, 6, 8, 14);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('heart');
    graphics.clear();
    renderTexture.destroy();
    
    // Sword
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 24, 24);
    
    graphics.fillStyle(0xc0c0c0, 1);
    graphics.fillRect(10, 4, 4, 16);
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(9, 18, 6, 4);
    graphics.fillStyle(0xffd700, 1);
    graphics.fillRect(8, 16, 8, 2);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('sword');
    graphics.clear();
    renderTexture.destroy();
    
    // Key
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 16, 16);
    
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(8, 5, 3);
    graphics.fillRect(7, 6, 2, 8);
    graphics.fillRect(9, 12, 3, 2);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('key');
    graphics.clear();
    renderTexture.destroy();
    
    // Key Item (larger, more prominent for discovery)
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(16, 10, 5);
    graphics.fillRect(14, 12, 4, 14);
    graphics.fillRect(18, 22, 6, 3);
    graphics.fillRect(18, 18, 4, 3);
    
    // Add shine effect
    graphics.fillStyle(0xffff00, 0.5);
    graphics.fillCircle(14, 8, 2);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('key_item');
    graphics.clear();
    renderTexture.destroy();
    
    // Gift/Chest
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 24, 24);
    
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(4, 8, 16, 12);
    graphics.fillStyle(0xffd700, 1);
    graphics.fillRect(11, 8, 2, 12);
    graphics.fillRect(4, 13, 16, 2);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('chest');
    renderTexture.saveTexture('gift');
    graphics.clear();
    renderTexture.destroy();
    
    // Door
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(8, 4, 16, 24);
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(10, 6, 12, 20);
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(19, 16, 2);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('door');
    graphics.clear();
    renderTexture.destroy();
    
    // Particle effect
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 8, 8);
    
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 3);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('particle');
    graphics.clear();
    renderTexture.destroy();
    
    // Now generate environment tiles
    this.generateEnvironmentTiles();
  }
  
  private generateEnvironmentTiles(): void {
    // DESIGN PHILOSOPHY: SNES-era clarity meets hand-crafted charm
    // Every tile must answer: "Can I walk here?" at a glance
    
    let graphics = this.add.graphics();
    let renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    // === GRASS TILE (3 variants for natural variety) ===
    // Cool moonlit greens, subtle noise, inviting paths
    for (let variant = 0; variant < 3; variant++) {
      graphics.clear();
      
      // Base grass - cool forest green
      const baseColor = variant === 0 ? 0x3a6b2a : variant === 1 ? 0x42752f : 0x3d6e2d;
      graphics.fillStyle(baseColor, 1);
      graphics.fillRect(0, 0, 32, 32);
      
      // Texture noise - small grass blades
      graphics.fillStyle(0x4d8035, 0.6);
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * 32;
        const y = Math.random() * 32;
        graphics.fillRect(x, y, 1, 2);
      }
      
      // Highlight tufts
      graphics.fillStyle(0x5a9642, 0.4);
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 28 + 2;
        const y = Math.random() * 28 + 2;
        graphics.fillRect(x, y, 2, 3);
      }
      
      // Shadow patches for depth
      graphics.fillStyle(0x2d5420, 0.3);
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 28 + 2;
        const y = Math.random() * 28 + 2;
        graphics.fillRect(x, y, 3, 2);
      }
      
      renderTexture.draw(graphics, 0, 0);
      renderTexture.saveTexture(variant === 0 ? 'floor_grass' : `floor_grass_${variant}`);
    }
    graphics.clear();
    renderTexture.destroy();

    // === SNOW TILE (3 variants) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    for (let variant = 0; variant < 3; variant++) {
      graphics.clear();
      const base = variant === 0 ? 0xeaf6ff : variant === 1 ? 0xe1f0ff : 0xdaf0ff;
      graphics.fillStyle(base, 1);
      graphics.fillRect(0, 0, 32, 32);
      // soft blue shadows
      graphics.fillStyle(0xbfd9ef, 0.35);
      for (let i = 0; i < 10; i++) graphics.fillCircle(4 + Math.random() * 24, 6 + Math.random() * 22, 2 + Math.random() * 2);
      // sparkle
      graphics.fillStyle(0xffffff, 0.55);
      for (let i = 0; i < 12; i++) graphics.fillRect(Math.random() * 31, Math.random() * 31, 1, 1);
      renderTexture.draw(graphics, 0, 0);
      renderTexture.saveTexture(variant === 0 ? 'floor_snow' : `floor_snow_${variant}`);
    }
    graphics.clear();
    renderTexture.destroy();

    // === PACKED SNOW PATH ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    graphics.fillStyle(0xd8ecff, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xb5d0ea, 0.35);
    graphics.fillRect(2, 6, 28, 6);
    graphics.fillRect(4, 18, 26, 6);
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillRect(6, 8, 18, 2);
    graphics.fillRect(8, 20, 16, 2);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('floor_snow_path');
    graphics.clear();
    renderTexture.destroy();
    
    // === DIRT PATH TILE ===
    // Warm, inviting, clearly walkable
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    graphics.fillStyle(0x8b7355, 1);
    graphics.fillRect(0, 0, 32, 32);
    
    // Rough texture
    graphics.fillStyle(0x9d8466, 0.5);
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 32;
      const y = Math.random() * 32;
      graphics.fillRect(x, y, 2, 1);
    }
    
    // Darker dirt clumps
    graphics.fillStyle(0x6b5544, 0.6);
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * 30 + 1;
      const y = Math.random() * 30 + 1;
      graphics.fillCircle(x, y, 2);
    }
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('floor_path');
    graphics.clear();
    renderTexture.destroy();

    // === STONE FLOOR (caves/ruins) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    graphics.fillStyle(0x4a4a4a, 1);
    graphics.fillRect(0, 0, 32, 32);
    // Stone cracks + noise
    graphics.lineStyle(1, 0x2a2a2a, 0.55);
    graphics.beginPath();
    graphics.moveTo(4, 10);
    graphics.lineTo(14, 6);
    graphics.lineTo(22, 12);
    graphics.lineTo(28, 8);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(6, 24);
    graphics.lineTo(16, 20);
    graphics.lineTo(26, 26);
    graphics.strokePath();
    graphics.fillStyle(0x5a5a5a, 0.35);
    for (let i = 0; i < 12; i++) graphics.fillRect(Math.random() * 30, Math.random() * 30, 2, 1);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('floor_stone');
    graphics.clear();
    renderTexture.destroy();

    // === STONE WALL (caves/ruins) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    graphics.fillStyle(0x2f2f2f, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x3a3a3a, 0.7);
    // Brick-ish blocks
    for (let y = 2; y < 32; y += 10) {
      for (let x = 2; x < 32; x += 14) {
        graphics.fillRect(x, y, 12, 8);
      }
    }
    graphics.lineStyle(1, 0x1a1a1a, 0.8);
    graphics.strokeRect(0, 0, 32, 32);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('wall_stone');
    graphics.clear();
    renderTexture.destroy();
    
    // === WOOD FLOOR (warm cabin interior) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    // Warm planks with grain
    graphics.fillStyle(0x9b7653, 1);
    graphics.fillRect(0, 0, 32, 32);
    
    // Plank separations
    graphics.lineStyle(2, 0x7a5c42, 1);
    graphics.lineBetween(0, 8, 32, 8);
    graphics.lineBetween(0, 16, 32, 16);
    graphics.lineBetween(0, 24, 32, 24);
    
    // Wood grain
    graphics.lineStyle(1, 0x8b6848, 0.4);
    for (let i = 0; i < 32; i += 4) {
      graphics.lineBetween(i, 0, i + 2, 32);
    }
    
    // Knots and character
    graphics.fillStyle(0x6b4c32, 0.5);
    graphics.fillCircle(10, 12, 2);
    graphics.fillCircle(24, 20, 1);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('floor_wood');
    graphics.clear();
    renderTexture.destroy();
    
    // === CABIN WALL (warm log construction) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    
    // Stacked log look
    graphics.fillStyle(0x7d5a3d, 1);
    graphics.fillRect(0, 0, 32, 16);
    graphics.fillStyle(0x8b6446, 1);
    graphics.fillRect(0, 16, 32, 16);
    
    // Log edges (darker)
    graphics.lineStyle(2, 0x5a3f2a, 1);
    graphics.lineBetween(0, 15, 32, 15);
    graphics.lineBetween(0, 16, 32, 16);
    
    // Wood grain texture
    graphics.lineStyle(1, 0x6b4d35, 0.3);
    for (let i = 0; i < 32; i += 3) {
      graphics.lineBetween(i, 0, i + 1, 16);
      graphics.lineBetween(i, 16, i + 1, 32);
    }
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('wall_wood');
    graphics.clear();
    renderTexture.destroy();
    
    // === TREE (chunky, readable, mysterious forest) ===
    // DESIGN: Thick trunk, rounded canopy, clear silhouette
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 64, 80);
    
    // Shadow (always render first for depth)
    graphics.fillStyle(0x1a2a1a, 0.4);
    graphics.fillEllipse(32, 72, 28, 12);
    
    // Trunk - chunky and readable
    graphics.fillStyle(0x5d4a37, 1);
    graphics.fillRect(24, 48, 16, 32);
    
    // Trunk highlight (left side)
    graphics.fillStyle(0x7a6149, 0.6);
    graphics.fillRect(24, 48, 6, 32);
    
    // Trunk shadow (right side)
    graphics.fillStyle(0x443426, 0.6);
    graphics.fillRect(34, 48, 6, 32);
    
    // Bark texture
    graphics.fillStyle(0x4a3a2a, 0.4);
    for (let i = 0; i < 5; i++) {
      graphics.fillRect(26, 50 + i * 6, 2, 3);
      graphics.fillRect(36, 52 + i * 6, 2, 3);
    }
    
    // Canopy - layered for depth (dark to light)
    // Bottom layer (shadow)
    graphics.fillStyle(0x2a5a2a, 1);
    graphics.fillCircle(32, 32, 24);
    
    // Mid layer
    graphics.fillStyle(0x357a35, 1);
    graphics.fillCircle(28, 28, 18);
    graphics.fillCircle(36, 28, 18);
    graphics.fillCircle(32, 24, 20);
    
    // Top layer (light hits here)
    graphics.fillStyle(0x4a9a4a, 1);
    graphics.fillCircle(30, 22, 14);
    graphics.fillCircle(36, 24, 12);
    
    // Highlight clumps (moonlight)
    graphics.fillStyle(0x6ab56a, 0.7);
    graphics.fillCircle(26, 20, 8);
    graphics.fillCircle(38, 22, 6);
    graphics.fillCircle(32, 18, 7);
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('tree');
    graphics.clear();
    renderTexture.destroy();
    
    // === ROCK/BOULDER (chunky, not spiky) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 48, 48);
    
    // Shadow
    graphics.fillStyle(0x1a1a1a, 0.4);
    graphics.fillEllipse(24, 40, 20, 8);
    
    // Base rock shape - irregular but readable
    graphics.fillStyle(0x6a6a6a, 1);
    graphics.fillCircle(24, 26, 16);
    graphics.fillCircle(20, 28, 12);
    graphics.fillCircle(28, 28, 12);
    
    // Mid tone
    graphics.fillStyle(0x808080, 0.9);
    graphics.fillCircle(22, 24, 14);
    graphics.fillCircle(26, 24, 12);
    
    // Highlight (top-left)
    graphics.fillStyle(0xa0a0a0, 0.7);
    graphics.fillCircle(20, 22, 10);
    graphics.fillCircle(24, 20, 8);
    
    // Dark cracks
    graphics.lineStyle(2, 0x4a4a4a, 0.8);
    graphics.lineBetween(18, 26, 22, 30);
    graphics.lineBetween(26, 24, 30, 28);
    
    // Texture spots
    graphics.fillStyle(0x5a5a5a, 0.5);
    for (let i = 0; i < 8; i++) {
      const x = 16 + Math.random() * 16;
      const y = 18 + Math.random() * 16;
      graphics.fillCircle(x, y, 1);
    }
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('rock');
    graphics.clear();
    renderTexture.destroy();
    
    // === PUZZLE STONE (ancient, glowing, intentional) ===
    // DESIGN: Clearly distinct from regular rocks, mysterious
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 48, 56);
    
    // Shadow
    graphics.fillStyle(0x1a1a2a, 0.5);
    graphics.fillEllipse(24, 48, 18, 8);
    
    // Stone base - weathered gray
    graphics.fillStyle(0x7a7a8a, 1);
    graphics.fillRect(12, 16, 24, 32);
    
    // Worn edges
    graphics.fillStyle(0x6a6a7a, 0.8);
    graphics.fillRect(13, 17, 22, 30);
    
    // Highlight edge (moonlight)
    graphics.fillStyle(0x9a9aaa, 0.6);
    graphics.fillRect(12, 16, 6, 32);
    
    // Ancient carved border
    graphics.lineStyle(2, 0x4a4a5a, 1);
    graphics.strokeRect(14, 18, 20, 28);
    
    // Symbol area (glowing slightly)
    graphics.fillStyle(0x5a7a9a, 0.3);
    graphics.fillRect(16, 22, 16, 20);
    
    // Glow effect
    graphics.fillStyle(0x6a8aaa, 0.2);
    graphics.fillCircle(24, 32, 14);
    
    // Moss/age texture
    graphics.fillStyle(0x4a6a4a, 0.3);
    for (let i = 0; i < 12; i++) {
      const x = 14 + Math.random() * 20;
      const y = 20 + Math.random() * 24;
      graphics.fillRect(x, y, 2, 2);
    }
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('puzzle_stone');
    graphics.clear();
    renderTexture.destroy();
    
    // === CHRISTMAS TREE (cozy, warm glow) ===
    graphics = this.add.graphics();
    renderTexture = this.add.renderTexture(0, 0, 64, 96);
    
    // Warm glow beneath
    graphics.fillStyle(0xffa500, 0.2);
    graphics.fillCircle(32, 80, 30);
    
    // Trunk
    graphics.fillStyle(0x6b4423, 1);
    graphics.fillRect(26, 68, 12, 24);
    graphics.fillStyle(0x5a3518, 0.6);
    graphics.fillRect(32, 68, 6, 24);
    
    // Tree layers - rich forest green
    graphics.fillStyle(0x1a4a1a, 1);
    graphics.fillTriangle(32, 12, 10, 40, 54, 40);
    graphics.fillStyle(0x1f5a1f, 1);
    graphics.fillTriangle(32, 28, 14, 52, 50, 52);
    graphics.fillStyle(0x247a24, 1);
    graphics.fillTriangle(32, 42, 18, 68, 46, 68);
    
    // Highlights
    graphics.fillStyle(0x3a9a3a, 0.4);
    graphics.fillTriangle(32, 16, 16, 38, 36, 38);
    graphics.fillTriangle(32, 32, 20, 50, 38, 50);
    
    // Star on top - bright gold
    const starPoints = [
      { x: 32, y: 8 },
      { x: 34, y: 14 }, { x: 40, y: 14 }, { x: 36, y: 18 },
      { x: 38, y: 24 }, { x: 32, y: 20 }, { x: 26, y: 24 },
      { x: 28, y: 18 }, { x: 24, y: 14 }, { x: 30, y: 14 }
    ];
    graphics.fillStyle(0xffd700, 1);
    graphics.fillPoints(starPoints, true);
    graphics.fillStyle(0xffea00, 0.6);
    graphics.fillCircle(32, 16, 6);
    
    // Ornaments - bright pops of color
    const ornaments = [
      { x: 24, y: 36, c: 0xff0000 },
      { x: 40, y: 34, c: 0x0000ff },
      { x: 32, y: 42, c: 0xffd700 },
      { x: 20, y: 48, c: 0xff69b4 },
      { x: 44, y: 46, c: 0xff0000 },
      { x: 28, y: 54, c: 0x0000ff },
      { x: 36, y: 56, c: 0xffd700 },
      { x: 24, y: 62, c: 0xff69b4 }
    ];
    
    ornaments.forEach(orb => {
      graphics.fillStyle(orb.c, 1);
      graphics.fillCircle(orb.x, orb.y, 3);
      graphics.fillStyle(0xffffff, 0.6);
      graphics.fillCircle(orb.x - 1, orb.y - 1, 1);
    });
    
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('tree_christmas');
    graphics.destroy();
    renderTexture.destroy();
    
    // Generate additional micro-details
    this.generateMicroDetails();
    // Generate interior props (cabin/library/gym/rescue)
    this.generateInteriorProps();
  }

  private generateInteriorProps(): void {
    // A compact “interior tileset” generated procedurally (no external downloads).
    // Goal: richer, production-feeling interiors without changing gameplay logic.

    const g = this.add.graphics();
    let rt: Phaser.GameObjects.RenderTexture;

    // === FLOORS (32x32) ===
    // Dark wood (library)
    rt = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.fillStyle(0x3a2418, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x2a1810, 0.6);
    g.lineBetween(0, 8, 32, 8);
    g.lineBetween(0, 16, 32, 16);
    g.lineBetween(0, 24, 32, 24);
    g.fillStyle(0x4b2f22, 0.25);
    for (let i = 0; i < 10; i++) g.fillRect(Math.random() * 30, Math.random() * 30, 2, 1);
    rt.draw(g, 0, 0);
    rt.saveTexture('floor_wood_dark');
    rt.destroy();

    // Beige tile (rescue)
    rt = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.fillStyle(0xd8c4a1, 1);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0xc2ad8b, 0.9);
    g.strokeRect(0, 0, 32, 32);
    g.lineBetween(0, 16, 32, 16);
    g.lineBetween(16, 0, 16, 32);
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(2, 2, 10, 4);
    rt.draw(g, 0, 0);
    rt.saveTexture('floor_tile_beige');
    rt.destroy();

    // Rubber (gym)
    rt = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.fillStyle(0x30343a, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x1f2227, 0.7);
    for (let y = 0; y < 32; y += 4) g.fillRect(0, y, 32, 1);
    g.fillStyle(0x4a4f57, 0.35);
    for (let i = 0; i < 16; i++) g.fillRect(Math.random() * 31, Math.random() * 31, 1, 1);
    rt.draw(g, 0, 0);
    rt.saveTexture('floor_rubber');
    rt.destroy();

    // === RUGS (256x192) ===
    // Cabin rug
    rt = this.add.renderTexture(0, 0, 256, 192);
    g.clear();
    g.fillStyle(0x6f0d0d, 1);
    g.fillRect(0, 0, 256, 192);
    g.lineStyle(10, 0xd8b25a, 1);
    g.strokeRect(10, 10, 236, 172);
    g.lineStyle(4, 0x2a0a0a, 0.55);
    for (let i = 0; i < 6; i++) g.strokeRect(22 + i * 10, 22 + i * 10, 212 - i * 20, 148 - i * 20);
    // simple “snowflake” motif
    g.lineStyle(6, 0xfff1d6, 0.45);
    g.strokeCircle(128, 96, 38);
    g.lineBetween(128, 60, 128, 132);
    g.lineBetween(92, 96, 164, 96);
    rt.draw(g, 0, 0);
    rt.saveTexture('rug_cabin');
    rt.destroy();

    // Library rug
    rt = this.add.renderTexture(0, 0, 256, 192);
    g.clear();
    g.fillStyle(0x2b1c12, 1);
    g.fillRect(0, 0, 256, 192);
    g.fillStyle(0x12304a, 1);
    g.fillRect(16, 16, 224, 160);
    g.lineStyle(10, 0xd0b070, 1);
    g.strokeRect(16, 16, 224, 160);
    g.lineStyle(4, 0x0a1b2a, 0.55);
    g.strokeCircle(128, 96, 44);
    g.lineBetween(128, 52, 128, 140);
    g.lineBetween(84, 96, 172, 96);
    rt.draw(g, 0, 0);
    rt.saveTexture('rug_library');
    rt.destroy();

    // Gym mat (large center accent)
    rt = this.add.renderTexture(0, 0, 256, 192);
    g.clear();
    g.fillStyle(0x1b4e85, 1);
    g.fillRect(0, 0, 256, 192);
    g.lineStyle(10, 0x7dc6ff, 0.85);
    g.strokeRect(10, 10, 236, 172);
    g.fillStyle(0x0b2b4f, 0.35);
    for (let i = 0; i < 14; i++) g.fillRect(12 + i * 18, 12, 6, 168);
    rt.draw(g, 0, 0);
    rt.saveTexture('rug_gym');
    rt.destroy();

    // === FURNITURE / PROPS ===
    // Bookshelf (128x192)
    rt = this.add.renderTexture(0, 0, 128, 192);
    g.clear();
    g.fillStyle(0x5a3a24, 1);
    g.fillRect(0, 0, 128, 192);
    g.fillStyle(0x3b2416, 1);
    g.fillRect(6, 6, 116, 180);
    g.lineStyle(4, 0x2a1810, 1);
    g.lineBetween(8, 44, 120, 44);
    g.lineBetween(8, 88, 120, 88);
    g.lineBetween(8, 132, 120, 132);
    // books (colorful spines)
    const colors = [0xc94c4c, 0x4a90e2, 0x6ab04c, 0xf9ca24, 0x9b59b6, 0xf0932b];
    for (let shelf = 0; shelf < 4; shelf++) {
      for (let i = 0; i < 14; i++) {
        const x = 10 + i * 8;
        const y = 14 + shelf * 44;
        const c = colors[(Math.random() * colors.length) | 0];
        g.fillStyle(c, 1);
        g.fillRect(x, y + 4, 6, 28 + (Math.random() * 6) | 0);
        g.fillStyle(0xffffff, 0.12);
        g.fillRect(x + 1, y + 6, 1, 20);
      }
    }
    rt.draw(g, 0, 0);
    rt.saveTexture('bookshelf');
    rt.destroy();

    // Table (128x64)
    rt = this.add.renderTexture(0, 0, 128, 64);
    g.clear();
    g.fillStyle(0x6b4423, 1);
    g.fillRect(8, 12, 112, 30);
    g.fillStyle(0x7a5632, 0.7);
    g.fillRect(10, 14, 40, 12);
    g.fillStyle(0x3a2516, 1);
    g.fillRect(16, 42, 12, 18);
    g.fillRect(100, 42, 12, 18);
    rt.draw(g, 0, 0);
    rt.saveTexture('table_wood');
    rt.destroy();

    // Chair (48x48)
    rt = this.add.renderTexture(0, 0, 48, 48);
    g.clear();
    g.fillStyle(0x6b4423, 1);
    g.fillRect(12, 18, 24, 16);
    g.fillRect(14, 6, 20, 12);
    g.fillStyle(0x3a2516, 1);
    g.fillRect(14, 34, 6, 10);
    g.fillRect(28, 34, 6, 10);
    rt.draw(g, 0, 0);
    rt.saveTexture('chair_wood');
    rt.destroy();

    // Window with snow (96x96)
    rt = this.add.renderTexture(0, 0, 96, 96);
    g.clear();
    g.fillStyle(0x5a3a24, 1);
    g.fillRect(0, 0, 96, 96);
    g.fillStyle(0x2b5f8a, 1);
    g.fillRect(10, 10, 76, 76);
    g.lineStyle(6, 0x5a3a24, 1);
    g.lineBetween(48, 10, 48, 86);
    g.lineBetween(10, 48, 86, 48);
    // snow specks
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 40; i++) g.fillCircle(12 + Math.random() * 72, 12 + Math.random() * 72, 1.2);
    rt.draw(g, 0, 0);
    rt.saveTexture('window_snow');
    rt.destroy();

    // Lamp (32x64)
    rt = this.add.renderTexture(0, 0, 32, 64);
    g.clear();
    g.fillStyle(0x3a2516, 1);
    g.fillRect(14, 24, 4, 34);
    g.fillStyle(0xd9b46f, 1);
    g.fillEllipse(16, 18, 22, 18);
    g.fillStyle(0xfff1c2, 0.7);
    g.fillEllipse(16, 18, 14, 10);
    rt.draw(g, 0, 0);
    rt.saveTexture('lamp');
    rt.destroy();

    // Plant (32x48)
    rt = this.add.renderTexture(0, 0, 32, 48);
    g.clear();
    g.fillStyle(0x7a5632, 1);
    g.fillRect(8, 30, 16, 12);
    g.fillStyle(0x2d7a3e, 1);
    g.fillCircle(16, 20, 10);
    g.fillStyle(0x3aa657, 0.6);
    g.fillCircle(12, 18, 6);
    g.fillCircle(20, 18, 6);
    rt.draw(g, 0, 0);
    rt.saveTexture('plant_pot');
    rt.destroy();

    // Kennel (128x128)
    rt = this.add.renderTexture(0, 0, 128, 128);
    g.clear();
    g.fillStyle(0x2f2f2f, 1);
    g.fillRect(0, 0, 128, 128);
    g.fillStyle(0xe6d5b8, 1);
    g.fillRect(6, 10, 116, 112);
    // bars
    g.fillStyle(0x4a4a4a, 1);
    for (let x = 18; x < 110; x += 10) g.fillRect(x, 22, 4, 84);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(10, 18, 108, 6);
    g.fillRect(10, 106, 108, 6);
    // nameplate
    g.fillStyle(0xd0b070, 1);
    g.fillRect(40, 8, 48, 10);
    rt.draw(g, 0, 0);
    rt.saveTexture('kennel');
    rt.destroy();

    // Pet sprites (32x32)
    // Dog
    rt = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.fillStyle(0x8b5a2b, 1);
    g.fillEllipse(16, 20, 18, 14);
    g.fillCircle(16, 12, 8);
    g.fillCircle(10, 8, 4);
    g.fillCircle(22, 8, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 12, 2);
    g.fillCircle(19, 12, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(13, 12, 1);
    g.fillCircle(19, 12, 1);
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 16, 1.5);
    rt.draw(g, 0, 0);
    rt.saveTexture('pet_dog');
    rt.destroy();

    // Cat
    rt = this.add.renderTexture(0, 0, 32, 32);
    g.clear();
    g.fillStyle(0xd08c4a, 1);
    g.fillEllipse(16, 20, 16, 12);
    g.fillCircle(16, 12, 8);
    // ears
    g.fillTriangle(10, 8, 14, 4, 14, 10);
    g.fillTriangle(22, 8, 18, 4, 18, 10);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(13, 12, 2);
    g.fillCircle(19, 12, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(13, 12, 1);
    g.fillCircle(19, 12, 1);
    g.fillRect(15, 16, 2, 1);
    rt.draw(g, 0, 0);
    rt.saveTexture('pet_cat');
    rt.destroy();

    // Villagers (32x32) — simple but “properly designed” sprites (varied outfits + hats)
    const makeVillager = (key: string, skin: number, coat: number, hat: number) => {
      const rt = this.add.renderTexture(0, 0, 32, 32);
      g.clear();
      // Shadow
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(16, 28, 14, 6);
      // Body/coat
      g.fillStyle(coat, 1);
      g.fillRect(10, 14, 12, 12);
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(11, 15, 4, 10);
      // Scarf
      g.fillStyle(0xffd700, 0.6);
      g.fillRect(11, 13, 10, 2);
      // Head
      g.fillStyle(skin, 1);
      g.fillCircle(16, 9, 6);
      // Hat/hood
      g.fillStyle(hat, 1);
      g.fillEllipse(16, 6, 18, 10);
      g.fillRect(10, 6, 12, 3);
      // Face
      g.fillStyle(0x000000, 1);
      g.fillCircle(14, 10, 1);
      g.fillCircle(18, 10, 1);
      g.fillStyle(0xffffff, 0.75);
      g.fillRect(13, 9, 1, 1);
      g.fillRect(17, 9, 1, 1);
      // Boots
      g.fillStyle(0x2a1a10, 1);
      g.fillRect(12, 25, 4, 6);
      g.fillRect(16, 25, 4, 6);
      rt.draw(g, 0, 0);
      rt.saveTexture(key);
      rt.destroy();
    };

    makeVillager('villager_1', 0xffd2b0, 0x2b5f8a, 0x1f2227);
    makeVillager('villager_2', 0x8d5524, 0x1f7a3a, 0x2a1a10);
    makeVillager('villager_3', 0xf2c6a0, 0x8b3a3a, 0x3a2a4a);

    // Gym treadmill (96x128)
    rt = this.add.renderTexture(0, 0, 96, 128);
    g.clear();
    g.fillStyle(0x1f2227, 1);
    g.fillRect(10, 70, 76, 34);
    g.fillStyle(0x3a3f46, 1);
    g.fillRect(14, 74, 68, 26);
    // console
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(56, 18, 26, 18);
    g.fillStyle(0xff4d4d, 1);
    g.fillRect(60, 22, 8, 6);
    g.fillStyle(0x7dc6ff, 1);
    g.fillRect(70, 22, 8, 6);
    // rails
    g.lineStyle(6, 0xaaaaaa, 1);
    g.lineBetween(20, 70, 56, 26);
    g.lineBetween(76, 70, 56, 26);
    rt.draw(g, 0, 0);
    rt.saveTexture('gym_treadmill');
    rt.destroy();

    // Gym locker (96x192)
    rt = this.add.renderTexture(0, 0, 96, 192);
    g.clear();
    g.fillStyle(0x3a3f46, 1);
    g.fillRect(0, 0, 96, 192);
    g.lineStyle(2, 0x1f2227, 1);
    g.strokeRect(6, 6, 40, 180);
    g.strokeRect(50, 6, 40, 180);
    g.fillStyle(0xd0b070, 1);
    g.fillCircle(40, 30, 3);
    g.fillCircle(84, 30, 3);
    rt.draw(g, 0, 0);
    rt.saveTexture('gym_locker');
    rt.destroy();

    // Gym mirror (64x192)
    rt = this.add.renderTexture(0, 0, 64, 192);
    g.clear();
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(0, 0, 64, 192);
    g.fillStyle(0x7dc6ff, 0.22);
    g.fillRect(6, 6, 52, 180);
    g.lineStyle(2, 0xffffff, 0.25);
    g.lineBetween(16, 16, 40, 80);
    rt.draw(g, 0, 0);
    rt.saveTexture('gym_mirror');
    rt.destroy();

    // === UI/FX textures ===
    // Soft fog blob (128x128)
    rt = this.add.renderTexture(0, 0, 128, 128);
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(64, 64, 52);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(48, 54, 40);
    g.fillCircle(82, 74, 38);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(64, 74, 46);
    rt.draw(g, 0, 0);
    rt.saveTexture('fog_blob');
    rt.destroy();

    // Cave crystal (32x48)
    rt = this.add.renderTexture(0, 0, 32, 48);
    g.clear();
    g.fillStyle(0x6a8aaa, 1);
    g.fillTriangle(16, 2, 4, 30, 28, 30);
    g.fillStyle(0x9fd3ff, 0.55);
    g.fillTriangle(16, 6, 10, 28, 22, 28);
    g.fillStyle(0x2b5f8a, 0.35);
    g.fillRect(7, 30, 18, 12);
    rt.draw(g, 0, 0);
    rt.saveTexture('crystal');
    rt.destroy();

    // Banner (48x96)
    rt = this.add.renderTexture(0, 0, 48, 96);
    g.clear();
    g.fillStyle(0x3a2516, 1);
    g.fillRect(22, 0, 4, 96);
    g.fillStyle(0x8b00ff, 0.9);
    g.fillRect(10, 18, 28, 56);
    g.fillStyle(0xffe8b0, 0.45);
    g.fillCircle(24, 38, 8);
    g.lineStyle(2, 0xffe8b0, 0.6);
    g.lineBetween(24, 28, 24, 48);
    g.lineBetween(16, 38, 32, 38);
    rt.draw(g, 0, 0);
    rt.saveTexture('banner');
    rt.destroy();

    g.destroy();
  }
  
  private generateMicroDetails(): void {
    // === ENVIRONMENTAL STORYTELLING ELEMENTS ===
    let graphics = this.add.graphics();
    let renderTexture;
    
    // MUSHROOM CLUSTER (adds life to forest)
    renderTexture = this.add.renderTexture(0, 0, 24, 24);
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(8, 16, 3, 6);
    graphics.fillRect(14, 18, 2, 4);
    graphics.fillStyle(0xd2691e, 1);
    graphics.fillCircle(10, 16, 5);
    graphics.fillCircle(15, 18, 3);
    graphics.fillStyle(0xf4a460, 0.6);
    graphics.fillCircle(9, 15, 3);
    graphics.fillCircle(14, 17, 2);
    // White spots
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(8, 15, 1);
    graphics.fillCircle(11, 16, 1);
    graphics.fillCircle(15, 17, 1);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('mushroom');
    graphics.clear();
    renderTexture.destroy();
    
    // FALLEN LOG (path marker)
    renderTexture = this.add.renderTexture(0, 0, 48, 24);
    graphics.fillStyle(0x4a3a2a, 1);
    graphics.fillRect(4, 10, 40, 8);
    graphics.fillStyle(0x5d4a37, 0.7);
    graphics.fillRect(4, 10, 40, 4);
    graphics.lineStyle(1, 0x3a2a1a, 0.8);
    for (let i = 0; i < 40; i += 6) {
      graphics.lineBetween(4 + i, 10, 4 + i, 18);
    }
    // Moss
    graphics.fillStyle(0x4a6a4a, 0.5);
    for (let i = 0; i < 8; i++) {
      graphics.fillRect(6 + i * 5, 11, 3, 2);
    }
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('fallen_log');
    graphics.clear();
    renderTexture.destroy();
    
    // CARVED SYMBOL (mystery element)
    renderTexture = this.add.renderTexture(0, 0, 16, 16);
    graphics.lineStyle(2, 0x6a8aaa, 0.8);
    graphics.strokeCircle(8, 8, 6);
    graphics.lineBetween(8, 2, 8, 14);
    graphics.lineBetween(2, 8, 14, 8);
    graphics.fillStyle(0x6a8aaa, 0.3);
    graphics.fillCircle(8, 8, 3);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('carved_symbol');
    graphics.clear();
    renderTexture.destroy();
    
    // SMALL PEBBLES (texture detail)
    renderTexture = this.add.renderTexture(0, 0, 16, 16);
    for (let i = 0; i < 5; i++) {
      const x = 2 + Math.random() * 12;
      const y = 2 + Math.random() * 12;
      graphics.fillStyle(0x8a8a8a, 0.7);
      graphics.fillCircle(x, y, 2);
      graphics.fillStyle(0xaaaaaa, 0.4);
      graphics.fillCircle(x - 0.5, y - 0.5, 1);
    }
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('pebbles');
    graphics.clear();
    renderTexture.destroy();
    
    // TALL GRASS (Terraria-ish ground life)
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x5aa64a, 0.9);
    for (let i = 0; i < 18; i++) {
      const x = 3 + Math.random() * 26;
      const h = 6 + Math.random() * 10;
      graphics.fillRect(x, 28 - h, 1, h);
    }
    graphics.fillStyle(0x2d5420, 0.25);
    graphics.fillRect(0, 28, 32, 4);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('tall_grass');
    graphics.clear();
    renderTexture.destroy();
    
    // FLOWER (small color pop)
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x3b8b2a, 1);
    graphics.fillRect(15, 18, 2, 10);
    graphics.fillStyle(0xffe066, 1);
    graphics.fillCircle(16, 16, 4);
    graphics.fillStyle(0xff6b9d, 1);
    graphics.fillCircle(14, 16, 2);
    graphics.fillCircle(18, 16, 2);
    graphics.fillCircle(16, 14, 2);
    graphics.fillCircle(16, 18, 2);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('flower');
    graphics.clear();
    renderTexture.destroy();
    
    // BUSH (dense foliage clump)
    renderTexture = this.add.renderTexture(0, 0, 32, 32);
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x2d7a3e, 1);
    graphics.fillCircle(10, 20, 8);
    graphics.fillCircle(18, 18, 10);
    graphics.fillCircle(24, 22, 7);
    graphics.fillStyle(0x3aa657, 0.55);
    graphics.fillCircle(14, 18, 6);
    graphics.fillCircle(22, 20, 5);
    graphics.fillStyle(0xff2d55, 0.8);
    graphics.fillCircle(14, 24, 1.5);
    graphics.fillCircle(20, 24, 1.5);
    renderTexture.draw(graphics, 0, 0);
    renderTexture.saveTexture('bush');
    graphics.clear();
    renderTexture.destroy();
    
    graphics.destroy();
  }
}
