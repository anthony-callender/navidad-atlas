export type PuzzleSymbol = 'PINE' | 'STAR' | 'MOON' | 'EYE' | 'FISH' | 'HAND';

export const PuzzleConfig = {
  symbols: ['PINE', 'STAR', 'MOON', 'EYE', 'FISH', 'HAND'] as PuzzleSymbol[],
  
  solution: {
    stoneA: 'PINE' as PuzzleSymbol,
    stoneB: 'MOON' as PuzzleSymbol,
    stoneC: 'STAR' as PuzzleSymbol
  },
  
  symbolColors: {
    PINE: 0x2d5016,
    STAR: 0xffd700,
    MOON: 0xc0c0ff,
    EYE: 0x8b4513,
    FISH: 0x4a90e2,
    HAND: 0xffb6c1
  } as Record<PuzzleSymbol, number>
};

