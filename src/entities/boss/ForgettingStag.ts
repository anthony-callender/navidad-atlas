import Phaser from 'phaser';
import { GameConfig } from '../../game/GameConfig';
import { MathUtil } from '../../util/MathUtil';

type BossState = 'idle' | 'telegraph' | 'charging' | 'stunned';

export class ForgettingStag extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private glowEffect: Phaser.GameObjects.Sprite;
  private hp: number;
  private maxHp: number;
  
  private bossState: BossState = 'idle';
  private stateTimer = 0;
  private chargeDirection = { x: 0, y: 0 };
  private phase2Active = false;
  
  private hitObstacle = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.maxHp = GameConfig.BOSS_HP;
    this.hp = this.maxHp;
    
    // Create glow effect
    this.glowEffect = scene.add.sprite(0, 0, 'boss');
    this.glowEffect.setScale(4.2);
    this.glowEffect.setAlpha(0.2);
    this.glowEffect.setTint(0x8b00ff);
    this.add(this.glowEffect);
    
    // Create boss sprite
    this.sprite = scene.add.sprite(0, 0, 'boss');
    this.sprite.setScale(3.5);
    this.sprite.setTint(0x8b00ff);
    this.add(this.sprite);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.body.setSize(48, 48);
    this.body.setOffset(-24, -24);
    this.body.setImmovable(false);
    
    this.setDepth(11);
    
    // Menacing idle animation
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 3.7,
      scaleY: 3.3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Glow pulse
    scene.tweens.add({
      targets: this.glowEffect,
      scale: 4.5,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.enterIdle();
  }
  
  public preUpdate(_time: number, delta: number): void {
    this.stateTimer -= delta;
    
    switch (this.bossState) {
      case 'idle':
        this.updateIdle();
        break;
      case 'telegraph':
        this.updateTelegraph();
        break;
      case 'charging':
        this.updateCharging();
        break;
      case 'stunned':
        this.updateStunned();
        break;
    }
    
    // Check for phase 2
    if (!this.phase2Active && this.hp <= this.maxHp / 2) {
      this.phase2Active = true;
      this.sprite.setTint(0xaa00ff);
      this.glowEffect.setTint(0xff00ff);
    }
  }
  
  private updateIdle(): void {
    this.body.setVelocity(0, 0);
    
    if (this.stateTimer <= 0) {
      this.enterTelegraph();
    }
  }
  
  private updateTelegraph(): void {
    this.body.setVelocity(0, 0);
    
    // Flash to indicate charging
    const flashSpeed = this.phase2Active ? 100 : 200;
    if (Math.floor(this.stateTimer / flashSpeed) % 2 === 0) {
      this.sprite.setTint(0xff0000);
      this.glowEffect.setTint(0xff0000);
    } else {
      this.sprite.setTint(this.phase2Active ? 0xaa00ff : 0x8b00ff);
      this.glowEffect.setTint(this.phase2Active ? 0xaa00ff : 0x8b00ff);
    }
    
    if (this.stateTimer <= 0) {
      this.sprite.setTint(this.phase2Active ? 0xaa00ff : 0x8b00ff);
      this.glowEffect.setTint(this.phase2Active ? 0xaa00ff : 0x8b00ff);
      this.enterCharging();
    }
  }
  
  private updateCharging(): void {
    // Continue charging in straight line
    // Collision with obstacles handled by scene
  }
  
  private updateStunned(): void {
    this.body.setVelocity(0, 0);
    
    if (this.stateTimer <= 0) {
      this.sprite.setAlpha(1);
      this.enterIdle();
    }
  }
  
  private enterIdle(): void {
    this.bossState = 'idle';
    this.stateTimer = Phaser.Math.Between(800, 1500);
    this.body.setVelocity(0, 0);
  }
  
  private enterTelegraph(): void {
    this.bossState = 'telegraph';
    const telegraphDuration = this.phase2Active 
      ? GameConfig.BOSS_TELEGRAPH_DURATION * 0.6 
      : GameConfig.BOSS_TELEGRAPH_DURATION;
    this.stateTimer = telegraphDuration;
    
    // Calculate charge direction toward player
    const playerPos = this.getPlayerPosition();
    if (playerPos) {
      const angle = MathUtil.angleBetween(this.x, this.y, playerPos.x, playerPos.y);
      this.chargeDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
    } else {
      // Random direction if no player
      const angle = Math.random() * Math.PI * 2;
      this.chargeDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle)
      };
    }
  }
  
  private enterCharging(): void {
    this.bossState = 'charging';
    this.hitObstacle = false;
    
    const chargeSpeed = this.phase2Active 
      ? GameConfig.BOSS_CHARGE_SPEED * 1.3 
      : GameConfig.BOSS_CHARGE_SPEED;
    
    this.body.setVelocity(
      this.chargeDirection.x * chargeSpeed,
      this.chargeDirection.y * chargeSpeed
    );
  }
  
  public onHitObstacle(): void {
    if (this.bossState === 'charging' && !this.hitObstacle) {
      this.hitObstacle = true;
      this.enterStunned();
    }
  }
  
  private enterStunned(): void {
    this.bossState = 'stunned';
    this.stateTimer = GameConfig.BOSS_STUN_DURATION;
    this.body.setVelocity(0, 0);
    
    // Visual feedback - make sprite dim and shake
    this.sprite.setAlpha(0.6);
    
    // Show stars or visual effect
    for (let i = 0; i < 5; i++) {
      const star = this.scene.add.sprite(
        this.x + Phaser.Math.Between(-20, 20),
        this.y - 40,
        'particle'
      );
      star.setScale(0.8);
      star.setTint(0xffff00);
      this.scene.tweens.add({
        targets: star,
        y: star.y - 30,
        alpha: 0,
        angle: 360,
        duration: 1000,
        onComplete: () => star.destroy()
      });
    }
    
    this.scene.tweens.add({
      targets: this,
      angle: 10,
      duration: 100,
      yoyo: true,
      repeat: 5
    });
  }
  
  public takeDamage(amount: number, _fromX: number, _fromY: number): void {
    // Only vulnerable when stunned
    if (this.bossState !== 'stunned') {
      return;
    }
    
    this.hp -= amount;
    
    // Flash white
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) {
        this.sprite.setTint(this.phase2Active ? 0xaa00ff : 0x8b00ff);
      }
    });
    
    if (this.hp <= 0) {
      this.die();
    }
  }
  
  private die(): void {
    // Stop all movement
    this.body.setVelocity(0, 0);
    
    // Epic death particles
    for (let i = 0; i < 16; i++) {
      const particle = this.scene.add.sprite(this.x, this.y, 'particle');
      particle.setScale(1.2);
      particle.setTint(0x8b00ff);
      const angle = (Math.PI * 2 * i) / 16;
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 80,
        y: particle.y + Math.sin(angle) * 80,
        alpha: 0,
        angle: 720,
        duration: 1000,
        onComplete: () => particle.destroy()
      });
    }
    
    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      angle: 360,
      duration: 1000,
      onComplete: () => {
        // Notify scene
        this.emit('defeated');
        this.destroy();
      }
    });
  }
  
  public getDamage(): number {
    return GameConfig.ENEMY_DAMAGE * 2;
  }
  
  public isVulnerable(): boolean {
    return this.bossState === 'stunned';
  }
  
  private getPlayerPosition(): { x: number; y: number } | null {
    const scene = this.scene as any;
    if (scene.player) {
      return { x: scene.player.x, y: scene.player.y };
    }
    return null;
  }
  
  public getHpPercent(): number {
    return this.hp / this.maxHp;
  }
}

