# 🌍 Navidad Atlas - World Expansion Design Document

## Overview
Expanding the game from a small forest adventure to a full exploration world with **5 new locations**, **underground tunnels**, and a **two-path key quest**.

---

## 🗺️ New World Structure

### **Current World:**
- Cabin (home base)
- Overworld Forest
- Boss Arena

### **Expanded World:**
- ✅ Cabin (home base)
- ✅ Overworld Forest (much larger now)
- 🆕 **Library** (puzzle location)
- 🆕 **Underground Tunnel** (connects cabin → library)
- 🆕 **Swimming Lake**
- 🆕 **Art Studio**
- 🆕 **Animal Rescue House** (has underground key)
- 🆕 **Gym/Spa** (has outdoor key)
- ✅ Boss Arena

**Total: 9 distinct areas!**

---

## 🔑 New Quest Flow

### **Old Flow:**
1. Leave cabin → Find Gabi
2. Solve puzzle in forest
3. Get Key Relic → Fight boss
4. Return to Gabi → Get revelation
5. Return home → Ending

### **New Flow:**
1. Leave cabin → Find Gabi
2. Gabi suggests: "The ancient texts might help - check the library!"
3. **Problem: Library is locked! Need keys.**
4. **Choice: Where did June leave her keys?**
   - **Path A**: Gym/Spa (outdoor entrance key)
   - **Path B**: Animal Rescue (underground entrance key)
5. Explore world to find either location
6. Get key → Open library (either entrance)
7. Solve puzzle in library → Get Key Relic
8. Return to overworld → Find boss gate
9. Fight boss → Get Memory Sigil
10. Return to Gabi → Revelation
11. Return home → Tony arrives → Tree decoration → Ending

---

## 📍 Location Details

### **1. Library 📚**
**Description**: Cozy, quiet library with bookshelves, reading tables, ancient puzzle stones

**Features:**
- Two entrances:
  - Front door (requires outdoor key)
  - Basement door (requires underground key)
- Puzzle stones (moved from overworld)
- Hint books on tables
- Atmospheric lighting
- Hardwood floors, oriental rug

**Connections:**
- Front entrance → Overworld (northwest area)
- Basement entrance → Underground Tunnel

**Music**: Calm, quiet (reuse cabin music or silence with ambient sounds)

---

### **2. Underground Tunnel 🕳️**
**Description**: Ancient stone tunnel system connecting cabin basement to library

**Features:**
- Torchlit passages
- Stone brick walls
- Dripping water sounds
- Maybe a few slimes as enemies
- Shortcut once unlocked

**Connections:**
- North entrance → Cabin basement (new area in cabin)
- South entrance → Library basement

**Music**: Mysterious, echoey (reuse overworld music, lower volume)

**Special**: Provides faster travel between cabin ↔ library once discovered

---

### **3. Swimming Lake 🏊**
**Description**: Beautiful natural lake with dock, maybe some ducks

**Features:**
- Can't actually swim (yet)
- Peaceful atmosphere
- Maybe a fishing rod easter egg
- Bench to sit on
- Ducks/wildlife

**Connections:**
- East side → Overworld (southeast area)

**Music**: Peaceful nature sounds

**Purpose**: Exploration reward, peaceful location, possible future expansion

---

### **4. Art Studio 🎨**
**Description**: June's personal art space, colorful and creative

**Features:**
- Easels with paintings
- Paint supplies scattered around
- Finished artwork on walls
- Maybe a self-portrait
- Colorful, warm lighting

**Connections:**
- Door → Overworld (east area)

**Music**: Upbeat, creative (reuse cabin music with slight variation)

**Purpose**: Character development, shows June's personality

---

### **5. Animal Rescue House 🐾**
**Description**: Small building where June volunteers, has cages/pens for animals

**Features:**
- **Underground Key** on desk (if not taken)
- Animal sounds
- Food/water bowls
- Medicine cabinet
- Kennels/cages (empty or with sprite animals)
- Warm, caring atmosphere

**Connections:**
- Front door → Overworld (southwest area)
- Back door → Small yard (optional)

**Music**: Gentle, warm (cabin music variant)

**Quest Item**: Underground entrance key to library

---

### **6. Gym/Spa 💪**
**Description**: Personal gym/spa combo, modern and clean

**Features:**
- **Outdoor Key** on locker bench (if not taken)
- Exercise equipment sprites
- Yoga mats
- Sauna room (optional)
- Mirror wall
- Clean, modern aesthetic

**Connections:**
- Front door → Overworld (northeast area)

**Music**: Energetic, upbeat

**Quest Item**: Outdoor entrance key to library

---

## 🗺️ Overworld Expansion

### **New Overworld Layout:**

```
         [Gym/Spa]━━━━┓
                      ┃
    [Boss Gate]    [Forest Center]    [Art Studio]
         ┃             ┃                    ┃
    [Gabi's]━━━━[Cabin Entry]━━━━━━━━[Swimming Lake]
                      ┃
              [Library Entrance]
                      ┃
         [Animal Rescue]━━━┛
```

**Size**: Expand overworld from 2560x1920 to ~3840x2880 (50% larger)

**Connections:**
- Cabin door → Center-south
- Library door → South
- Gym/Spa door → Northeast
- Art Studio door → East
- Animal Rescue door → Southwest
- Swimming Lake entrance → Southeast
- Boss gate → Northwest (existing)

---

## 💬 New Dialogue

### **Library Discovery:**
```
Gabi: "These symbols... they remind me of ancient texts I've seen."

June: "Ancient texts? Where would I find those?"

Gabi: "Perhaps the library? Humans store their knowledge in such places."

June: "The library! Of course! Wait... where did I leave my keys?"
```

### **Finding Keys:**

**Gym Discovery:**
```
June: "My gym! I haven't been here in... wow, too long."

[Finds key]

June: "The library key! It was in my gym locker this whole time. Classic."
```

**Animal Rescue Discovery:**
```
June: "The rescue house! Poor animals, I hope they're okay without me."

[Finds key]

June: "The underground tunnel key! I completely forgot I had this."
```

### **Library Puzzle:**
```
June: "These stones... they're like the ones Gabi was drawn to."

[After solving]

June: "A key relic! This must open that sealed gate in the woods."
```

---

## 🎮 Implementation Plan

### **Phase 1: Core Expansion**
1. ✅ Create LibraryScene.ts (DONE)
2. Create TunnelScene.ts
3. Expand OverworldScene (larger map, new doors)
4. Add basement to CabinScene

### **Phase 2: New Locations**
5. Create GymScene.ts
6. Create AnimalRescueScene.ts
7. Create ArtStudioScene.ts (optional)
8. Create LakeScene.ts (optional)

### **Phase 3: Quest System**
9. Add key items to GameState
10. Add conditional door locks
11. Add discovery dialogues
12. Update objective text flow

### **Phase 4: Polish**
13. Balance world size
14. Add environmental details
15. Test all paths
16. Add optional secrets

---

## 📊 Game State Updates

### **New Flags:**
```typescript
hasLibraryOutdoorKey: boolean;
hasLibraryUndergroundKey: boolean;
foundGym: boolean;
foundAnimalRescue: boolean;
foundArtStudio: boolean;
foundLake: boolean;
libraryVisited: boolean;
tunnelUnlocked: boolean;
```

### **Objective Flow:**
1. "Look for Tony outside."
2. "Find Gabi in the forest."
3. "Help Gabi restore his memory."
4. **"Find the library. Where are my keys?"**
5. **"Search for the library key."** (after discovering it's locked)
6. "Solve the ancient puzzle." (inside library)
7. "Use the Key Relic to open the sealed gate."
8. "Fight the guardian."
9. "Return to Gabi with the Memory Sigil."
10. "Return to the cabin."

---

## ⏱️ Estimated Playtime

- **Old game**: 5-10 minutes
- **New game**: 20-30 minutes
  - Exploration: +10 minutes
  - Finding keys: +5 minutes
  - New locations: +5 minutes

---

## 🎨 Visual Design

### **Library:**
- Dark wood, books, oriental rugs
- Quiet, scholarly atmosphere
- Puzzle stones on display pedestals

### **Tunnel:**
- Stone bricks, torches, moss
- Narrow passages
- Mystery/adventure vibe

### **Gym:**
- Modern, clean, bright
- Exercise equipment, mirrors
- Energetic colors

### **Animal Rescue:**
- Warm, caring
- Cages, bowls, medical supplies
- Cozy lighting

### **Art Studio:**
- Colorful, creative chaos
- Easels, paints, finished works
- June's personality on display

### **Lake:**
- Natural, peaceful
- Dock, water, trees
- Wildlife (ducks, fish)

---

## 🚀 Next Steps

**Would you like me to:**

1. **Full Implementation** - Create all 6 new scenes (~2-3 hours)
2. **Core Only** - Library + Tunnel + Keys (faster, ~30 min)
3. **Modular** - Pick which locations you want most
4. **Design Review** - Adjust the plan first?

**My Recommendation**: Start with Core Only (Library + Tunnel + Key quest), then add other locations as optional expansions later.

This keeps the main quest compelling while allowing future growth!

Let me know how you'd like to proceed! 🎮✨

