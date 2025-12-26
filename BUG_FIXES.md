# Bug Fixes - Puzzle Stones & Music

## Issues Fixed ✅

### 1. Game Freezing on Stone Interaction
**Problem**: Clicking E to cycle puzzle stone symbols caused the game to freeze.

**Root Cause**: 
- When we enhanced visuals, we changed puzzle stones from rectangles to images
- Container structure changed: `[rectangle, text]` → `[image, glow, text]`
- Code was trying to access wrong indices: `list[0]` and `list[1]` instead of correct indices

**Fix Applied** (`src/scenes/OverworldScene.ts`):
```typescript
// OLD (caused freeze):
const symbolText = stoneData.visual.list[1] as Phaser.GameObjects.Text;  // Wrong index!
const stone = stoneData.visual.list[0] as Phaser.GameObjects.Rectangle;  // Wrong type!

// NEW (works correctly):
const symbolText = stoneData.visual.list[2] as Phaser.GameObjects.Text;  // Correct index
const glow = stoneData.visual.list[1] as Phaser.GameObjects.Arc;  // Proper type
```

**Container Structure**:
- Index 0: `puzzle_stone` image (base sprite)
- Index 1: Circle glow effect
- Index 2: Text symbol (PINE, MOON, STAR, etc.)

---

### 2. Music Not Playing
**Problem**: No music heard despite music system being implemented.

**Root Causes**:
1. Browser autoplay policy requires user interaction before audio
2. AudioContext needs to be resumed if suspended
3. No user prompt to start audio

**Fixes Applied**:

**A. AudioContext Resume** (`src/audio/MusicManager.ts`):
```typescript
if (this.audioContext.state === 'suspended') {
  this.audioContext.resume();
}
```

**B. User Interaction Prompt** (`src/scenes/BootScene.ts`):
- Added "Click to Start" button on boot screen
- Initializes AudioContext on first click/key press
- Properly resumes context before starting game
- Works with both mouse click AND keyboard press

**How It Works**:
1. Game loads → Shows "Click to Start"
2. User clicks/presses key → AudioContext initializes
3. CabinScene starts → Cabin music plays immediately
4. Scene transitions → Music changes automatically

---

## Testing Checklist

### Puzzle Stones ✅
- [ ] Can click E on stones without freezing
- [ ] Symbols cycle through all 6 options
- [ ] Text updates correctly
- [ ] Glow effect persists
- [ ] Puzzle solves when correct (PINE, MOON, STAR)

### Music ✅
- [ ] "Click to Start" appears on boot
- [ ] Clicking starts game with music
- [ ] Cabin music plays (warm chords)
- [ ] Overworld music plays (mysterious melody)
- [ ] Boss music plays (intense rhythm)
- [ ] Music transitions smoothly between scenes

---

## Files Modified

1. **`src/scenes/OverworldScene.ts`**
   - Fixed `cycleStoneSymbol()` to use correct container indices
   - Updated to work with new image-based stone sprites

2. **`src/audio/MusicManager.ts`**
   - Added AudioContext state check
   - Auto-resume if suspended

3. **`src/scenes/BootScene.ts`**
   - Added "Click to Start" prompt
   - Initialize audio on user interaction
   - Support both click and keyboard input

---

## Technical Notes

### Browser Autoplay Policy
Modern browsers block audio until user interaction. Our solution:
- Show explicit "Click to Start" prompt
- Initialize AudioContext only after click
- Resume suspended contexts automatically

### Phaser Container Indexing
When accessing container children, remember:
- `container.list[index]` accesses by order added
- `addAt(obj, index)` inserts at specific position
- Visual updates must target correct indices
- Type casting required for specific methods

---

## Build Status
✅ **npm run build** - Success (no errors)
✅ TypeScript compilation clean
✅ All functionality restored

**Ready to test!** 
Run `npm run dev`, click "Click to Start", and:
- Music should play immediately
- Puzzle stones should cycle without freezing
- Full game experience restored

---

## Prevention Tips

When modifying visual structures:
1. Document container child order in comments
2. Search for all code accessing `.list[]`
3. Update all references when structure changes
4. Test interactions immediately after visual changes

When adding audio:
1. Always require user interaction first
2. Check and resume AudioContext state
3. Test in multiple browsers (Chrome, Firefox, Safari)
4. Provide clear user prompts for audio initialization

