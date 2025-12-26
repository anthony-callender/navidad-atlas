# Navidad Atlas - Visual Design Documentation

## Design Philosophy

This game follows SNES-era top-down adventure design principles (specifically A Link to the Past grammar) while maintaining complete originality. Every visual element answers the question: **"What can I do here?"** at a glance.

---

## Core Visual Language

### Readability First
- **32x32 tile grid** maintains classic scale
- **Chunky silhouettes** for instant recognition
- **Clear depth hierarchy** through layering
- **Cool moonlit exteriors** vs **warm cozy interiors**

### Color Temperature Rules
- **Outdoors**: Cool greens (#3a6b2a base), desaturated blues, moonlit feel
- **Indoors**: Warm oranges (#ffa500 glow), rich browns (#9b7653), firelight ambience
- **Accents**: Gold (#ffd700) for important objects, mystery blue (#6a8aaa) for ancient elements

---

## Tileset Design

### Grass (3 Variants)
- **Base colors**: #3a6b2a, #42752f, #3d6e2d
- **Texture**: Small blade noise, highlight tufts, shadow patches
- **Purpose**: Natural organic variety, prevents visual monotony
- **Randomized** placement for hand-crafted feel

### Dirt Path
- **Color**: #8b7355 (warm, inviting)
- **Texture**: Rough patches, darker clumps
- **Purpose**: Guides player movement, curves gently between POIs
- **Design intent**: Should visually "pull" the player forward

### Wood Floor (Cabin)
- **Color**: #9b7653 (rich warm planks)
- **Details**: Plank separations, wood grain, knots
- **Feel**: Lived-in, comfortable, safe
- **Lighting**: Works with fireplace ambient glow

### Wood Walls (Cabin)
- **Color**: #7d5a3d (stacked log construction)
- **Details**: Log edges, grain texture
- **Feel**: Rustic warmth, frontier cabin aesthetic

---

## Environment Objects

### Trees
**Design Intent**: Chunky, readable forest obstacles that form natural corridors

- **Trunk**: #5d4a37 base, highlighted left (#7a6149), shadowed right (#443426)
- **Canopy**: Layered circles (dark to light: #2a5a2a → #357a35 → #4a9a4a)
- **Highlights**: #6ab56a moonlight patches on top
- **Shadow**: Soft ellipse beneath for grounding
- **Scale**: 64x80px (occupies ~2 tiles)
- **Collision**: 40x40 centered on trunk base

**Placement Strategy**:
- Dense borders (every 80-100px) create walls
- Interior clusters create clearings
- Asymmetric spacing feels organic
- Never blocks paths randomly

### Rocks
**Design Intent**: Chunky obstacles, not spiky, guide player flow

- **Base**: #6a6a6a with volume (circles for smooth shape)
- **Highlight**: #a0a0a0 top-left (light source)
- **Shadows**: Soft ellipse, dark cracks for texture
- **Scale**: 48x48px
- **Collision**: 24px radius circle

**Placement**: At path intersections to guide choice, never arbitrary

### Puzzle Stones
**Design Intent**: ANCIENT, INTENTIONAL, GLOWING - distinct from rocks

- **Color**: #7a7a8a weathered gray
- **Details**: Carved border, symbol area, moss/age texture
- **Glow**: #6a8aaa ethereal blue (20% opacity halo)
- **Scale**: 48x56px (taller = more important)
- **Feel**: Obviously interactable, mysterious purpose

**Visual hierarchy**: These MUST stand out from environment

### Christmas Tree
**Design Intent**: Warm focal point, cozy nostalgia

- **Trunk**: #6b4423 wooden base
- **Layers**: Rich greens (#1a4a1a → #1f5a1f → #247a24)
- **Star**: Bright gold (#ffd700) with glow
- **Ornaments**: Pops of color (red, blue, gold, pink)
- **Glow**: #ffa500 ambient warmth beneath
- **Scale**: 64x96px

---

## Micro-Details (Environmental Storytelling)

### Mushroom Clusters
- **Purpose**: Life and texture near trees
- **Colors**: Brown stems, orange-red caps with white spots
- **Scale**: 24x24px, randomized 0.8-1.2x
- **Placement**: Scatter near tree bases

### Fallen Logs
- **Purpose**: Path markers, imply history
- **Color**: Dark brown with moss patches
- **Scale**: 48x24px (horizontal)
- **Feel**: Forest is old, lived-in

### Pebbles
- **Purpose**: Ground texture, visual richness
- **Opacity**: 60% (subtle)
- **Placement**: Random scatter, 30+ instances
- **Effect**: Prevents "empty" feeling

### Carved Symbols
- **Purpose**: Mystery, lore hints
- **Color**: #6a8aaa (ancient magic blue)
- **Design**: Simple geometric (circle + cross)
- **Feel**: Gravity Falls-like curiosity

---

## Interior Design (Cabin)

### Fireplace
**Design Intent**: Warm focal point, heart of home

- **Stone**: Layered individual stones (#5a5a5a → #6a6a6a)
- **Fire**: Layered glow (orange → yellow → white core)
- **Ambient**: 80px radius orange glow (#ffa500 15% opacity)
- **Feel**: Crackling warmth, safety

### Table & Chairs
- **Wood**: #8b6446 rich grain with knots
- **Details**: Edge shadows, wood highlights
- **Scale**: Sturdy, lived-in
- **Placement**: Creates gathering space

### Shelves
- **Items**: Mugs, bottles (simple shapes)
- **Purpose**: Home feels occupied, not empty
- **Colors**: Browns, dark greens

### Candles
- **Flames**: Layered orange → yellow glow
- **Ambient**: 20px glow radius
- **Placement**: Table, mantle
- **Effect**: Multiple light sources = cozy

---

## Path & Navigation Design (Zelda Grammar)

### Path Rules
1. **Curves gently** - never straight for long
2. **Connects POIs** - cabin → Gabi → puzzle → gate
3. **Visually obvious** - contrasting dirt color
4. **Inviting** - warm tone pulls player forward

### Tree Corridors
- Dense forest edges **frame** the world
- Interior clusters **define** clearings
- Asymmetric spacing feels **organic**
- Gaps **suggest** exploration

### Visual Framing
- Points of interest visible **before** reachable
- Negative space = **intentional clearings**
- Rocks **funnel** player movement at choices
- Trees **never** randomly block paths

---

## Depth & Layering System

```
Depth 0:  Grass floor base
Depth 1:  Paths, pebbles, ground details
Depth 2-3: Shadows, small objects
Depth 4-5: Furniture, obstacles
Depth 6:  Candle glows, effects
Depth 7:  Puzzle stones, interactables  
Depth 8:  Puzzle UI elements
Depth 10: NPCs, player
Depth Y:  Trees/rocks (Y-sorting for proper occlusion)
```

---

## Lighting & Atmosphere

### Cabin (Warm)
- **Primary**: Fireplace orange glow
- **Secondary**: Candle spots
- **Ambient**: Rich warm browns
- **Feel**: Safe, cozy, home

### Forest (Cool)
- **Lighting**: Implied moonlight from top-left
- **Shadows**: Soft, not harsh
- **Colors**: Desaturated, cool greens/blues
- **Feel**: Mysterious, curious, safe-dangerous balance

---

## Character Scale (Maintained from original)

### Player (June)
- Clear head/body separation
- High contrast outline
- Readable facing direction
- Distinct from environment colors

### Gabi (NPC)
- Softer, rounder shapes (friendly)
- Warmer colors
- Slightly larger scale (important)

### Enemies
- Sharp threat silhouettes
- Clear attack posture
- Instant readability

---

## Design Success Criteria

At any moment, the player should instantly understand:

✅ **Where they can walk** (grass, paths)  
✅ **Where they cannot walk** (trees, rocks, walls)  
✅ **Where they should go next** (paths guide)  
✅ **What they can interact with** (distinct glows, shapes)  
✅ **The mood of the space** (warm cabin vs cool forest)  
✅ **The history of the world** (fallen logs, mushrooms, age)

---

## Technical Implementation

All visuals generated procedurally via Phaser Graphics API:
- **Grass**: 32x32 tiles with noise patterns
- **Trees**: 64x80 layered circles + rectangles
- **Rocks**: 48x48 volume shading
- **Puzzle Stones**: 48x56 with glow effects
- **Micro-details**: 16-48px scatter elements

**Advantages**:
- No external asset dependencies
- Instant load times
- Easy iteration
- Consistent style

---

## What Makes This "Zelda-like" (Without Copying)

1. **Tile-based grammar** - 32x32 grid, chunky readable shapes
2. **Environmental framing** - trees form corridors, rocks guide
3. **Visual invitation** - paths curve toward goals
4. **Intentional negative space** - clearings feel significant
5. **Readability hierarchy** - threat vs safe instantly clear
6. **Warm/cool contrast** - home vs adventure
7. **Hand-crafted density** - never empty, never cluttered
8. **Mystery elements** - ancient stones, symbols, lore hints

---

## Future Polish Opportunities

- **Animated grass** (gentle wave)
- **Water tiles** (soft ripple)
- **Particle effects** (fireflies, snow)
- **Dynamic lighting** (time of day)
- **Weather** (light snow, fog)
- **More micro-details** (broken stones, runes)

---

**Design Principle**: *Clarity over detail. Charm over realism. Intention over decoration.*

This world should feel **familiar**, **safe**, **curious**, and **hand-crafted**.

