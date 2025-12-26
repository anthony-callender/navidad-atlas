import Phaser from 'phaser';
import { GameConfig } from '../../game/GameConfig';

export class Slime extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private hp: number;
  private maxHp: number;
  
  private wanderTimer = 0;
  private wanderDirection = { x: 0, y: 0 };
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.maxHp = GameConfig.SLIME_HP;
    this.hp = this.maxHp;
    
    // Create slime sprite
    this.sprite = scene.add.sprite(0, 0, 'slime');
    this.sprite.setScale(1.8);
    this.add(this.sprite);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.body.setSize(24, 20);
    this.body.setOffset(-12, -10);
    
    this.setDepth(9);
    
    this.pickNewDirection();
    
    // Gentle bounce animation
    scene.tweens.add({
      targets: this.sprite,
      scaleY: 2.0,
      scaleX: 1.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  public preUpdate(_time: number, delta: number): void {
    this.wanderTimer -= delta;
    
    if (this.wanderTimer <= 0) {
      this.pickNewDirection();
    }
    
    this.body.setVelocity(
      this.wanderDirection.x * GameConfig.SLIME_SPEED,
      this.wanderDirection.y * GameConfig.SLIME_SPEED
    );
  }
  
  private pickNewDirection(): void {
    // Random: wander, pause, or new direction
    const action = Math.random();
    
    if (action < 0.3) {
      // Pause
      this.wanderDirection = { x: 0, y: 0 };
      this.wanderTimer = Phaser.Math.Between(1000, 2000);
    } else {
      // Pick random direction
      const angle = Math.random() * Math.PI * 2;
      this.wanderDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
      this.wanderTimer = Phaser.Math.Between(1500, 3000);
    }
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
    // Death particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.sprite(this.x, this.y, 'particle');
      particle.setScale(0.5);
      particle.setTint(0x00ff00);
      const angle = (Math.PI * 2 * i) / 6;
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 30,
        y: particle.y + Math.sin(angle) * 30,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  public getDamage(): number {
    return GameConfig.ENEMY_DAMAGE;
  }
}
