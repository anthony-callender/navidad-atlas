export type Direction = 'up' | 'down' | 'left' | 'right';

export class InputRouter {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey: Phaser.Input.Keyboard.Key;
  private eKey: Phaser.Input.Keyboard.Key;
  private enterKey: Phaser.Input.Keyboard.Key;
  
  private lastDirection: Direction = 'down';
  private lastHorizontalTime = 0;
  private lastVerticalTime = 0;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.spaceKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.eKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.enterKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }
  
  public getMovementVector(): { x: number; y: number; direction: Direction | null } {
    let horizontal = 0;
    let vertical = 0;
    
    // Check horizontal input
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      horizontal = -1;
      if (this.cursors.left.timeDown > this.lastHorizontalTime || this.wasd.A.timeDown > this.lastHorizontalTime) {
        this.lastHorizontalTime = Math.max(this.cursors.left.timeDown, this.wasd.A.timeDown);
        this.lastDirection = 'left';
      }
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      horizontal = 1;
      if (this.cursors.right.timeDown > this.lastHorizontalTime || this.wasd.D.timeDown > this.lastHorizontalTime) {
        this.lastHorizontalTime = Math.max(this.cursors.right.timeDown, this.wasd.D.timeDown);
        this.lastDirection = 'right';
      }
    }
    
    // Check vertical input
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      vertical = -1;
      if (this.cursors.up.timeDown > this.lastVerticalTime || this.wasd.W.timeDown > this.lastVerticalTime) {
        this.lastVerticalTime = Math.max(this.cursors.up.timeDown, this.wasd.W.timeDown);
        this.lastDirection = 'up';
      }
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      vertical = 1;
      if (this.cursors.down.timeDown > this.lastVerticalTime || this.wasd.S.timeDown > this.lastVerticalTime) {
        this.lastVerticalTime = Math.max(this.cursors.down.timeDown, this.wasd.S.timeDown);
        this.lastDirection = 'down';
      }
    }
    
    // 4-direction only: prioritize last pressed direction
    if (horizontal !== 0 && vertical !== 0) {
      if (this.lastHorizontalTime > this.lastVerticalTime) {
        vertical = 0;
      } else {
        horizontal = 0;
      }
    }
    
    let direction: Direction | null = null;
    if (horizontal !== 0 || vertical !== 0) {
      if (vertical < 0) direction = 'up';
      else if (vertical > 0) direction = 'down';
      else if (horizontal < 0) direction = 'left';
      else if (horizontal > 0) direction = 'right';
    }
    
    return { x: horizontal, y: vertical, direction };
  }
  
  public getLastDirection(): Direction {
    return this.lastDirection;
  }
  
  public isAttackPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }
  
  public isInteractPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.eKey);
  }
  
  public isConfirmPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
  }
  
  public isEnterPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.enterKey);
  }
}

