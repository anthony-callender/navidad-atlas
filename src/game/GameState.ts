export interface GameStateData {
  // Progression flags
  metGabi: boolean;
  hasKeyRelic: boolean;
  bossDefeated: boolean;
  hasMemorySigil: boolean;
  gabrielRevealed: boolean;
  hasNativityManger: boolean;
  endingComplete: boolean;
  
  // New: Library & Key Quest
  hasLibraryOutdoorKey: boolean;
  hasLibraryUndergroundKey: boolean;
  libraryUnlocked: boolean;
  foundGym: boolean;
  foundAnimalRescue: boolean;
  tunnelDiscovered: boolean;

  // New: Platform Trial gate (original platformer challenge)
  platformTrialComplete: boolean;

  // New: Platform cave requirement (pipe bonus room)
  platformCaveKeyFound: boolean;
  platformCaveNoteRead: boolean;

  // New: West Woods Tony + Bear quest
  tonyFoundInWoods: boolean;
  tonySnatchedByBear: boolean;
  tonyRescuedFromCage: boolean;
  bearDefeated: boolean;
  bearSwordGranted: boolean;
  rescueTonyRunComplete: boolean;

  // New: Final Act
  hasGiftKeys: boolean;
  treeDecorated: boolean;
  finalActStarted: boolean;
  juneCaptured: boolean;
  rescueJuneRunComplete: boolean;
  finalBossKeyFound: boolean;
  finalBossDefeated: boolean;
  villageShown: boolean;

  // New: Laponia winter blessing (post-final boss)
  winterBlessing: boolean;
  // Not critical progression; used to decide which side of the tunnel-run we spawn on.
  tunnelRunFrom?: 'cabin' | 'library';
  
  // Player state
  playerHealth: number;
  playerMaxHealth: number;
  
  // UI state
  objectiveText: string;
  
  // Spawn position (for respawn)
  spawnX: number;
  spawnY: number;
  spawnScene: string;
}

export class GameState {
  private static instance: GameState;
  
  public data: GameStateData;
  
  private constructor() {
    this.data = this.getDefaultState();
    this.loadFromStorage();
  }
  
  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }
  
  private getDefaultState(): GameStateData {
    return {
      metGabi: false,
      hasKeyRelic: false,
      bossDefeated: false,
      hasMemorySigil: false,
      gabrielRevealed: false,
      hasNativityManger: false,
      endingComplete: false,
      hasLibraryOutdoorKey: false,
      hasLibraryUndergroundKey: false,
      libraryUnlocked: false,
      foundGym: false,
      foundAnimalRescue: false,
      tunnelDiscovered: false,
      platformTrialComplete: false,
      platformCaveKeyFound: false,
      platformCaveNoteRead: false,
      tonyFoundInWoods: false,
      tonySnatchedByBear: false,
      tonyRescuedFromCage: false,
      bearDefeated: false,
      bearSwordGranted: false,
      rescueTonyRunComplete: false,
      hasGiftKeys: false,
      treeDecorated: false,
      finalActStarted: false,
      juneCaptured: false,
      rescueJuneRunComplete: false,
      finalBossKeyFound: false,
      finalBossDefeated: false,
      villageShown: false,
      winterBlessing: false,
      tunnelRunFrom: 'cabin',
      playerHealth: 5,
      playerMaxHealth: 5,
      objectiveText: 'Busca a Tony afuera.',
      spawnX: 640,
      spawnY: 360,
      spawnScene: 'CabinScene'
    };
  }
  
  public reset(): void {
    this.data = this.getDefaultState();
    this.saveToStorage();
  }
  
  public setObjective(text: string): void {
    this.data.objectiveText = text;
    this.saveToStorage();
  }
  
  public damagePlayer(amount: number): boolean {
    this.data.playerHealth = Math.max(0, this.data.playerHealth - amount);
    this.saveToStorage();
    return this.data.playerHealth <= 0;
  }
  
  public healPlayer(amount: number): void {
    this.data.playerHealth = Math.min(this.data.playerMaxHealth, this.data.playerHealth + amount);
    this.saveToStorage();
  }
  
  public fullHeal(): void {
    this.data.playerHealth = this.data.playerMaxHealth;
    this.saveToStorage();
  }
  
  public setSpawnPoint(x: number, y: number, scene: string): void {
    this.data.spawnX = x;
    this.data.spawnY = y;
    this.data.spawnScene = scene;
    this.saveToStorage();
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('navidad-atlas-save', JSON.stringify(this.data));
    } catch (e) {
      // Silent fail if localStorage unavailable
    }
  }
  
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('navidad-atlas-save');
      if (saved) {
        this.data = { ...this.data, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Silent fail if localStorage unavailable
    }
  }
}

