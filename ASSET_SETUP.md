# 🎨 Asset Setup Guide - Kenney Micro Roguelike

## Quick Setup Instructions

### Step 1: Organize Your Assets

1. Make sure you have the `kenney_micro-roguelike` folder from your download
2. In your project, the structure should be:
   ```
   public/
     assets/
       kenney_micro-roguelike/
         Tilemap/
           tile_0001.png
           tile_0002.png
           tile_0004.png
           ... (all the tile PNG files)
   ```

### Step 2: What We're Loading

The game now loads these specific sprites:

**Characters:**
- `tile_0084.png` - Player (Knight)
- `tile_0091.png` - NPC Gabi (Old man)

**Enemies:**
- `tile_0085.png` - Slime
- `tile_0086.png` - Wisp (Ghost)
- `tile_0100.png` - Boss (Forgetting Stag)

**Tiles:**
- `tile_0001.png` - Stone wall
- `tile_0002.png` - Grass floor
- `tile_0016.png` - Wood wall
- `tile_0017.png` - Wood floor
- `tile_0052.png` - Rock obstacle
- `tile_0053.png` - Tree obstacle

**Objects:**
- `tile_0004.png` - Door
- `tile_0054.png` - Christmas tree
- `tile_0067.png` - Chest
- `tile_0068.png` - Gift box

**Items:**
- `tile_0063.png` - Heart
- `tile_0065.png` - Sword
- `tile_0066.png` - Key
- `tile_0109.png` - Particle effect

### Step 3: Verify File Paths

Make sure this path works:
```
public/assets/kenney_micro-roguelike/Tilemap/tile_0001.png
```

You can test by navigating in your file explorer to:
```
C:\Users\minec\OneDrive\Desktop\video_game_june\public\assets\kenney_micro-roguelike\Tilemap\
```

And checking if you see the PNG files there.

### Step 4: Run the Game

```bash
npm run dev
```

Open http://localhost:3000

## What's Changed? ✨

### Visual Upgrades:
1. **Player** - Now a proper sprite with rotation based on direction
2. **Enemies** - Animated sprites with:
   - Slimes bounce
   - Wisps float and glow
   - Boss has pulsing glow effect
3. **Combat** - Sword sprite appears with slash animation
4. **Deaths** - Particle explosions when enemies die
5. **UI** - Heart sprites instead of rectangles
6. **Inventory** - Shows actual item sprites

### Effects Added:
- ✨ Death particles (different colors for each enemy)
- 🗡️ Sword slash animation
- 💫 Boss stun stars
- 🌟 Glow effects on boss and wisps
- 💓 Heart sprites in UI
- 🎯 Loading screen with progress bar

## Troubleshooting

**If you see black/missing sprites:**
1. Check the console (F12) for 404 errors
2. Verify the file path is exactly: `public/assets/kenney_micro-roguelike/Tilemap/`
3. Make sure the PNG files are in the Tilemap folder
4. Try refreshing the page (Ctrl+F5)

**If loading fails:**
- Check browser console for specific missing files
- The game will show which tile_XXXX.png file is missing
- Download might have slightly different folder structure - adjust paths in `BootScene.ts` if needed

## Alternative: Use Different Tiles

If your Kenney pack has different file numbers, you can edit `src/scenes/BootScene.ts` and change the tile numbers to match what you have. For example:

```typescript
// If your player sprite is tile_0123.png instead:
this.load.image('player', basePath + 'tile_0123.png');
```

Just browse your Tilemap folder and pick tiles that look good!

## Next Steps

Once this is working, you can:
1. Add more animations
2. Use different tiles from the pack
3. Mix in tiles from other Kenney packs
4. Add sound effects
5. Add background music

Enjoy your beautiful game! 🎮✨

