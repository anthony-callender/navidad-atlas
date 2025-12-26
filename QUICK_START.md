# Quick Start Guide - Navidad Atlas

## Installation & Running

1. Open terminal in the project directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the game:
   ```bash
   npm run dev
   ```
4. Open your browser to: **http://localhost:3000**

## Controls

| Action | Key |
|--------|-----|
| Move Up | W or ↑ |
| Move Down | S or ↓ |
| Move Left | A or ← |
| Move Right | D or → |
| Attack | Space |
| Interact | E |
| Advance Dialogue | E or Space |
| Restart Game | Enter (at end screen) |

## Walkthrough (Spoilers!)

### 1. The Cabin (Start)
- Read the intro dialogue
- Interact with objects (Christmas tree) if you want
- Go outside through the door (Press E)

### 2. The Overworld
- Explore the woods (avoid or fight enemies)
- Find Gabi at "Gabi's Clearing" (northeast area)
- Talk to him (Press E) to learn about his amnesia

### 3. The Puzzle
- Go to "Ancient Stones" area (southwest)
- Read the two hint notes
- Interact with each of the 3 stones to cycle symbols
- **Solution: PINE, MOON, STAR** (from left to right)
- A chest will appear - open it to get the Key Relic

### 4. The Boss Gate
- Go to "Sealed Gate" area (east side)
- Interact with gate (now that you have the key)
- Enter the Boss Arena

### 5. Boss Fight - Forgetting Stag
**Strategy:**
- Watch for the boss to flash red (telegraph)
- It will charge in a straight line
- Dodge out of the way
- Boss hits obstacle/wall → becomes stunned
- Attack with sword while stunned (only vulnerable time!)
- Repeat until defeated
- At 50% HP, boss enters Phase 2 (faster charges)

### 6. After Boss
- Exit through the door that appears
- Return to Gabi's clearing
- Talk to Gabi → Revelation scene
- He remembers he's Gabriel the angel
- Receive the Nativity Manger

### 7. Return to Cabin
- Go back to the cabin door
- Enter the cabin
- Tony has returned!
- Talk and open the gift box
- Enjoy the ending!

## Tips

- **Combat:** You can kill enemies for practice, but you can also avoid them
- **Health:** You have 5 hearts. Enemies deal 1 damage. Boss deals 2 damage.
- **Death:** If you die, you respawn with full health at your last checkpoint
- **Save:** Game state auto-saves to localStorage
- **Restart:** Press Enter at the end screen to play again from the beginning

## Troubleshooting

**Game won't start:**
- Make sure you ran `npm install` first
- Check that Node.js is installed (`node --version`)
- Try deleting `node_modules` and running `npm install` again

**Port 3000 already in use:**
- The dev server will automatically try port 3001
- Or change the port in `vite.config.ts`

**Black screen:**
- Open browser console (F12) to check for errors
- Try refreshing the page
- Make sure your browser supports WebGL

**Game is too hard:**
- You can run past most enemies
- Boss pattern: wait for charge → dodge → attack when stunned → repeat
- Take your time - there's no timer!

## Have Fun!

Enjoy the cozy Christmas mystery! 🎄✨

---

For detailed technical information, see **README.md**

