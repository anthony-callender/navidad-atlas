import Phaser from 'phaser';
import { GameConfig } from '../game/GameConfig';
import { GameState } from '../game/GameState';
import { Direction } from '../systems/InputRouter';

export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private sprite: Phaser.GameObjects.Sprite;
  private swordSprite: Phaser.GameObjects.Sprite | null = null;
  private facing: Direction = 'down';
  private walkFrame = 0;
  private walkTimer = 0;
  private baseTexture: string;
  
  private isAttacking = false;
  private attackTimer = 0;
  private attackCooldown = 0;
  
  private invulnerable = false;
  private invulnTimer = 0;
  private flickerTimer = 0;
  
  private gameState: GameState;
  
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'player') {
    super(scene, x, y);
    
    this.gameState = GameState.getInstance();
    
    this.baseTexture = texture;
    // Create player sprite
    this.sprite = scene.add.sprite(0, 0, texture);
    this.sprite.setScale(2); // Make it 64x64
    this.add(this.sprite);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.body.setSize(28, 28);
    this.body.setCollideWorldBounds(true);
    
    this.setDepth(10);
  }
  
  public preUpdate(_time: number, delta: number): void {
    // Update attack timer
    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.endAttack();
      }
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    
    // Update invulnerability
    if (this.invulnerable) {
      this.invulnTimer -= delta;
      this.flickerTimer -= delta;
      
      if (this.flickerTimer <= 0) {
        this.flickerTimer = 100;
        this.sprite.setVisible(!this.sprite.visible);
      }
      
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.sprite.setVisible(true);
      }
    }

    // Walk animation + facing visuals (no rotation "flat" turning)
    this.walkTimer += delta;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const moving = Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 1;
    if (moving && !this.isAttacking) {
      if (this.walkTimer >= 160) {
        this.walkTimer = 0;
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
        this.applyFacingVisual();
      }
    } else {
      this.walkFrame = 0;
      this.applyFacingVisual();
    }
  }
  
  public move(x: number, y: number, direction: Direction | null): void {
    if (this.isAttacking) {
      // Can't move while attacking
      this.body.setVelocity(0, 0);
      return;
    }
    
    this.body.setVelocity(
      x * GameConfig.PLAYER_SPEED,
      y * GameConfig.PLAYER_SPEED
    );
    
    if (direction) {
      this.facing = direction;
      this.applyFacingVisual();
    }
  }
  
  private applyFacingVisual(): void {
    // If this Player isn't June, keep the provided texture as-is.
    if (this.baseTexture !== 'player') {
      this.sprite.setAngle(0);
      this.sprite.setFlipX(false);
      return;
    }

    // June uses dedicated directional textures (no rotation).
    let key = 'player_down_0';
    if (this.facing === 'up') key = this.walkFrame ? 'player_up_1' : 'player_up_0';
    else if (this.facing === 'down') key = this.walkFrame ? 'player_down_1' : 'player_down_0';
    else if (this.facing === 'left' || this.facing === 'right') key = this.walkFrame ? 'player_side_1' : 'player_side_0';

    this.sprite.setTexture(key);
    this.sprite.setAngle(0);
    this.sprite.setFlipX(this.facing === 'left');
  }
  
  public attack(): boolean {
    if (this.isAttacking || this.attackCooldown > 0) {
      return false;
    }
    
    this.isAttacking = true;
    this.attackTimer = GameConfig.PLAYER_ATTACK_DURATION;
    this.attackCooldown = GameConfig.PLAYER_ATTACK_COOLDOWN;
    
    this.createSwordHitbox();
    
    return true;
  }
  
  private createSwordHitbox(): void {
    let offsetX = 0;
    let offsetY = 0;
    let angle = 0;
    
    switch (this.facing) {
      case 'up':
        offsetY = -32;
        angle = -90;
        break;
      case 'down':
        offsetY = 32;
        angle = 90;
        break;
      case 'left':
        offsetX = -32;
        angle = 180;
        break;
      case 'right':
        offsetX = 32;
        angle = 0;
        break;
    }
    
    // Create sword sprite
    this.swordSprite = this.scene.add.sprite(offsetX, offsetY, 'sword');
    this.swordSprite.setScale(1.5);
    this.swordSprite.setAngle(angle);
    this.swordSprite.setAlpha(0.9);
    this.add(this.swordSprite);
    
    // Add physics
    this.scene.physics.add.existing(this.swordSprite);
    const swordBody = this.swordSprite.body as Phaser.Physics.Arcade.Body;
    swordBody.setSize(32, 32);
    
    // Sword slash animation
    this.scene.tweens.add({
      targets: this.swordSprite,
      angle: angle + 60,
      duration: GameConfig.PLAYER_ATTACK_DURATION,
      ease: 'Power2'
    });
  }
  
  private endAttack(): void {
    this.isAttacking = false;
    if (this.swordSprite) {
      this.swordSprite.destroy();
      this.swordSprite = null;
    }
  }
  
  public getSwordHitbox(): Phaser.GameObjects.Sprite | null {
    return this.swordSprite;
  }
  
  public takeDamage(amount: number, fromX: number, fromY: number): void {
    if (this.invulnerable) return;
    
    const died = this.gameState.damagePlayer(amount);
    
    if (died) {
      this.die();
      return;
    }
    
    // Knockback
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    this.body.setVelocity(
      Math.cos(angle) * GameConfig.PLAYER_KNOCKBACK,
      Math.sin(angle) * GameConfig.PLAYER_KNOCKBACK
    );
    
    // I-frames
    this.invulnerable = true;
    this.invulnTimer = GameConfig.PLAYER_INVULN_DURATION;
    this.flickerTimer = 100;
    
    // Flash red
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      if (this.sprite) {
        this.sprite.clearTint();
      }
    });
  }
  
  private die(): void {
    // Death animation (simple fade)
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.respawn();
      }
    });
  }
  
  private respawn(): void {
    const spawnData = this.gameState.data;
    this.gameState.fullHeal();
    
    // Reset state
    this.invulnerable = false;
    this.sprite.setVisible(true);
    this.alpha = 1;
    
    // Move to spawn point
    this.setPosition(spawnData.spawnX, spawnData.spawnY);
  }
  
  public getFacing(): Direction {
    return this.facing;
  }
  
  public isInvulnerable(): boolean {
    return this.invulnerable;
  }
}
