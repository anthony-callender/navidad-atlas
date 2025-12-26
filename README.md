# Navidad Atlas

A top-down 2D action-adventure mystery game built with Phaser 3, Vite, and TypeScript.

## About

**Navidad Atlas** is a cozy Christmas cabin mystery with Zelda-like gameplay. Play as June, who wakes up in a cabin to find her companion Tony missing. Explore mysterious woods, meet an amnesiac old man named Gabi, solve symbol puzzles, and uncover a divine secret.

**Genre:** Top-down 2D action-adventure mystery  
**Playtime:** 5-10 minutes  
**Theme:** Cozy Christmas + mysterious fantasy woods

## Setup

### Prerequisites

- Node.js (v16 or higher recommended)
- npm

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Controls

- **Move:** Arrow Keys or WASD (4-direction only, no diagonal)
- **Attack:** Space
- **Interact:** E
- **Continue Dialogue:** E or Space
- **Restart from End Screen:** Enter

## How to Play

1. **Wake up in the cabin** - Tony is missing! Look for him outside.
2. **Explore the woods** - Meet Gabi, an old man who can't remember who he is.
3. **Solve the symbol puzzle** - Find the three ancient stones and arrange the symbols correctly.
   - Hint: The notes nearby give clues about which symbols to use.
   - Solution: PINE + MOON = STAR
4. **Obtain the Key Relic** - Open the chest that appears when you solve the puzzle.
5. **Enter the Sealed Gate** - Use the Key Relic to unlock the boss arena.
6. **Defeat the Forgetting Stag** - Wait for it to charge into obstacles to stun it, then attack!
7. **Return to Gabi** - Give him the Memory Sigil to restore his memory.
8. **The Revelation** - Learn Gabi's true identity as the angel Gabriel.
9. **Return home** - Go back to the cabin for the ending sequence.
10. **Open the gift** - Complete the story!

## Game Features

### Combat
- **Sword Attack:** Simple slash in the direction you're facing
- **Health System:** 5 hearts, lose 1 per hit
- **Invulnerability Frames:** Brief invincibility after taking damage
- **Death & Respawn:** Respawn at last checkpoint with full health

### Enemies
- **Slimes:** Wander randomly, deal contact damage
- **Wisps:** Patrol and home toward player when in range
- **Forgetting Stag (Boss):** Charges in straight lines; becomes vulnerable when stunned by hitting obstacles

### Puzzle System
- Three stones that cycle through 6 symbols: PINE, STAR, MOON, EYE, FISH, HAND
- Find and read hint notes to determine the correct combination
- Chest appears when solved correctly

### Progression
- Story-driven objectives guide you through the game
- Items persist in your inventory (shown in top-right UI)
- Dialogue system with character portraits and multi-line text
- Multiple interconnected areas (Cabin, Overworld, Boss Arena)

## Technical Details

### Architecture
- **Modular Scene System:** Separate scenes for each area
- **Entity System:** Player, enemies, and boss are reusable entities
- **Game State Manager:** Singleton pattern for persistent game state
- **Input Router:** Handles 4-direction movement with last-key-pressed priority
- **Dialogue System:** Modal dialogue with speaker names
- **Interact System:** Proximity-based interaction prompts

### Asset Generation
All visuals are generated programmatically using Phaser's built-in graphics:
- Colored rectangles for characters and objects
- Simple geometric shapes for visual distinction
- No external image files required

### Map System
Maps are created using 2D tile arrays rendered as colored rectangles:
- 32x32 tile scale
- Static physics bodies for walls and obstacles
- Smooth scrolling camera in overworld
- Screen-by-screen rooms for interiors

## Acceptance Tests

Run through these tests to verify the game works correctly:

### ✅ Test 1: Collision System
- [ ] Player cannot walk through walls in Cabin
- [ ] Player cannot walk through walls in Overworld
- [ ] Player cannot walk through walls in Boss Arena
- [ ] Enemies cannot walk through walls

### ✅ Test 2: Dialogue System
- [ ] Dialogue appears when interacting with NPCs
- [ ] Player cannot move while dialogue is active
- [ ] Pressing E or Space advances dialogue
- [ ] Dialogue closes after last line
- [ ] Player can move again after dialogue ends

### ✅ Test 3: Puzzle System
- [ ] Each stone cycles through symbols when pressed E
- [ ] Symbols cycle in order: PINE → STAR → MOON → EYE → FISH → HAND → PINE
- [ ] Setting correct combination (PINE, MOON, STAR) triggers success
- [ ] Chest appears after puzzle solved
- [ ] Opening chest grants Key Relic
- [ ] Objective updates to "Find the sealed gate"

### ✅ Test 4: Boss Gate
- [ ] Interacting with gate without Key Relic shows "need something" message
- [ ] Interacting with gate with Key Relic allows entry to Boss Arena
- [ ] Boss fight begins automatically

### ✅ Test 5: Boss Fight
- [ ] Boss telegraphs (flashes red) before charging
- [ ] Boss charges in straight line toward player
- [ ] Boss becomes stunned when hitting obstacle or wall
- [ ] Boss can only take damage when stunned
- [ ] Boss has visible HP bar at top of screen
- [ ] Boss enters Phase 2 (faster) at 50% HP
- [ ] Boss dies at 0 HP and awards Memory Sigil
- [ ] Exit door appears after boss defeat

### ✅ Test 6: Gabriel Reveal
- [ ] Returning to Gabi with Memory Sigil triggers reveal dialogue
- [ ] Dialogue explicitly mentions name "Gabriel"
- [ ] Dialogue mentions message to Mary about Emmanuel
- [ ] Nativity Manger item is awarded
- [ ] Objective updates to "Return to cabin"
- [ ] Gabi disappears from overworld after reveal

### ✅ Test 7: Ending Sequence
- [ ] Entering cabin after Gabriel reveal triggers Tony dialogue
- [ ] Tony mentions finding keys and equation
- [ ] Interacting with gift box opens it (was previously locked)
- [ ] Gift box dialogue plays
- [ ] End screen appears with "Thanks for playing" message
- [ ] Pressing Enter restarts the game from beginning

### ✅ Test 8: Combat System
- [ ] Pressing Space creates sword hitbox in front of player
- [ ] Sword hitbox appears in correct direction based on facing
- [ ] Enemies take damage when hit by sword
- [ ] Enemies die after HP reaches 0
- [ ] Player takes damage from enemy contact
- [ ] Player has invulnerability frames (flickers) after damage
- [ ] Player respawns at checkpoint when HP reaches 0

### ✅ Test 9: UI System
- [ ] Hearts display in top-left (5 total)
- [ ] Hearts deplete when taking damage
- [ ] Hearts refill after respawn
- [ ] Objective text displays at top-center
- [ ] Objective updates throughout game progression
- [ ] Inventory icons show in top-right
- [ ] Inventory icons light up when items obtained

### ✅ Test 10: Room Transitions
- [ ] Cabin door leads to Overworld (and vice versa)
- [ ] Boss gate leads to Boss Arena
- [ ] Boss Arena exit leads back to Overworld
- [ ] Player spawns at correct position after transition
- [ ] Game state persists across room transitions

## Story Summary

June wakes up in a cozy Christmas cabin to find Tony missing. While searching the woods, she encounters Gabi, an old man suffering from amnesia. June helps him by solving an ancient symbol puzzle to obtain the Key Relic, which unlocks a sealed gate.

Behind the gate lurks the Forgetting Stag, a mystical guardian. After defeating it, June obtains the Memory Sigil and returns it to Gabi. His memories return—he is Gabriel, the angel sent to deliver the message of Emmanuel to Mary.

As thanks, Gabriel gifts June the Nativity Manger before departing on his divine mission. June returns to the cabin where Tony has returned from chopping wood. He found mysterious keys under a tree root. Together they use them to open a locked gift box, revealing a surprise message.

## Credits

**Game Design & Development:** Created for the Navidad Atlas MVP  
**Engine:** Phaser 3  
**Build Tool:** Vite  
**Language:** TypeScript

## License

This project is provided as-is for educational and entertainment purposes.

---

**Merry Christmas and enjoy the mystery!** 🎄✨

