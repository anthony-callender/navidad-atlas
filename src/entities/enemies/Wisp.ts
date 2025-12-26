import Phaser from 'phaser';
import { GameConfig } from '../../game/GameConfig';
import { MathUtil } from '../../util/MathUtil';

export class Wisp extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private glow: Phaser.GameObjects.Sprite;
  private hp: number;
  private maxHp: number;
  
  private patrolTimer = 0;
  private patrolDirection = { x: 0, y: 0 };
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.maxHp = GameConfig.WISP_HP;
    this.hp = this.maxHp;
    
    // Create glow effect
    this.glow = scene.add.sprite(0, 0, 'wisp');
    this.glow.setScale(2.2);
    this.glow.setAlpha(0.3);
    this.glow.setTint(0x8844ff);
    this.add(this.glow);
    
    // Create wisp sprite
    this.sprite = scene.add.sprite(0, 0, 'wisp');
    this.sprite.setScale(1.8);
    this.add(this.sprite);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.body.setSize(20, 20);
    this.body.setOffset(-10, -10);
    
    this.setDepth(9);
    
    this.pickPatrolDirection();
    
    // Gentle floating animation
    scene.tweens.add({
      targets: this,
      y: this.y + 8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Glow pulse
    scene.tweens.add({
      targets: this.glow,
      scale: 2.5,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Rotation
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });
  }
  
  public preUpdate(_time: number, delta: number): void {
    // Check for player in range
    const playerPos = this.checkForPlayer();
    
    if (playerPos && MathUtil.distance(this.x, this.y, playerPos.x, playerPos.y) < GameConfig.WISP_AGGRO_RADIUS) {
      // Home toward player
      const angle = MathUtil.angleBetween(this.x, this.y, playerPos.x, playerPos.y);
      this.body.setVelocity(
        Math.cos(angle) * GameConfig.WISP_SPEED,
        Math.sin(angle) * GameConfig.WISP_SPEED
      );
    } else {
      // Patrol
      this.patrolTimer -= delta;
      if (this.patrolTimer <= 0) {
        this.pickPatrolDirection();
      }
      
      this.body.setVelocity(
        this.patrolDirection.x * GameConfig.WISP_SPEED * 0.5,
        this.patrolDirection.y * GameConfig.WISP_SPEED * 0.5
      );
    }
  }
  
  private checkForPlayer(): { x: number; y: number } | null {
    // Try to get player from scene
    const scene = this.scene as any;
    if (scene.player) {
      return { x: scene.player.x, y: scene.player.y };
    }
    return null;
  }
  
  private pickPatrolDirection(): void {
    const angle = Math.random() * Math.PI * 2;
    this.patrolDirection = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
    this.patrolTimer = Phaser.Math.Between(2000, 4000);
  }
  
  public takeDamage(amount: number, fromX: number, fromY: number): void {
    this.hp -= amount;
    
    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active && this.sprite) {
        this.sprite.clearTint();
      }
    });
    
    // Knockback
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    this.body.setVelocity(
      Math.cos(angle) * GameConfig.ENEMY_KNOCKBACK,
      Math.sin(angle) * GameConfig.ENEMY_KNOCKBACK
    );
    
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  private die(): void {
    // Death particles - magical explosion
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.sprite(this.x, this.y, 'particle');
      particle.setScale(0.6);
      particle.setTint(0x8844ff);
      const angle = (Math.PI * 2 * i) / 8;
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 40,
        y: particle.y + Math.sin(angle) * 40,
        alpha: 0,
        angle: 360,
        duration: 500,
        onComplete: () => particle.destroy()
      });
    }
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0,
      duration: 400,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  public getDamage(): number {
    return GameConfig.ENEMY_DAMAGE;
  }
}
