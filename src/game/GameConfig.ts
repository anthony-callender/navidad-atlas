import Phaser from 'phaser';

export const GameConfig = {
  TILE_SIZE: 32,
  GAME_WIDTH: 1280,
  GAME_HEIGHT: 720,
  
  PLAYER_SPEED: 120,
  PLAYER_ATTACK_DURATION: 150,
  PLAYER_ATTACK_COOLDOWN: 300,
  PLAYER_INVULN_DURATION: 1000,
  PLAYER_KNOCKBACK: 150,
  
  ENEMY_DAMAGE: 1,
  ENEMY_KNOCKBACK: 100,
  
  SLIME_SPEED: 40,
  SLIME_HP: 2,
  
  WISP_SPEED: 60,
  WISP_HP: 3,
  WISP_AGGRO_RADIUS: 200,
  
  BOSS_HP: 20,
  BOSS_CHARGE_SPEED: 300,
  BOSS_STUN_DURATION: 1000,
  BOSS_TELEGRAPH_DURATION: 800,
  
  INTERACT_RADIUS: 48,
  
  COLORS: {
    FLOOR: 0x2d5016,
    WALL: 0x1a3010,
    CABIN_FLOOR: 0x8b4513,
    CABIN_WALL: 0x654321,
    BOSS_FLOOR: 0x4a4a4a,
    BOSS_WALL: 0x2a2a2a,
    DOOR: 0xffff00,
    PLAYER: 0x4a90e2,
    ENEMY: 0xe24a4a,
    BOSS: 0x8b00ff,
    SWORD: 0xc0c0c0,
    NPC: 0xffd700,
    INTERACTABLE: 0x00ff00
  }
};

export const PhaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.GAME_WIDTH,
  height: GameConfig.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  render: {
    pixelArt: true,
    antialias: false
  }
};

