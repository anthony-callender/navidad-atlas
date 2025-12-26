import { GameState } from '../game/GameState';

export class RoomTransitions {
  public static transition(
    fromScene: Phaser.Scene,
    toSceneKey: string,
    spawnX: number,
    spawnY: number
  ): void {
    const gameState = GameState.getInstance();
    gameState.setSpawnPoint(spawnX, spawnY, toSceneKey);
    
    fromScene.scene.start(toSceneKey);
  }
  
  public static respawnPlayer(scene: Phaser.Scene): void {
    const gameState = GameState.getInstance();
    gameState.fullHeal();
    
    if (scene.scene.key !== gameState.data.spawnScene) {
      scene.scene.start(gameState.data.spawnScene);
    }
  }
}

