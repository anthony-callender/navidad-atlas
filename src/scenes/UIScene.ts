import Phaser from 'phaser';
import { GameState } from '../game/GameState';

export class UIScene extends Phaser.Scene {
  private heartIcons: Phaser.GameObjects.Sprite[] = [];
  private objectiveText: Phaser.GameObjects.Text | null = null;
  private inventoryIcons: Map<string, Phaser.GameObjects.Container> = new Map();
  private gameState: GameState;
  private endScreen: Phaser.GameObjects.Container | null = null;
  
  constructor() {
    super({ key: 'UIScene' });
    this.gameState = GameState.getInstance();
  }
  
  create(): void {
    // Hearts display (top left)
    this.createHearts();
    
    // Objective text (top center)
    this.objectiveText = this.add.text(640, 20, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
      fontFamily: 'Arial'
    });
    this.objectiveText.setOrigin(0.5, 0);
    this.objectiveText.setDepth(1000);
    
    // Inventory display (top right)
    this.createInventoryDisplay();
  }
  
  update(): void {
    this.updateHearts();
    this.updateObjective();
    this.updateInventory();
  }
  
  private createHearts(): void {
    const startX = 30;
    const startY = 30;
    const spacing = 36;
    
    for (let i = 0; i < this.gameState.data.playerMaxHealth; i++) {
      const heart = this.add.sprite(startX + i * spacing, startY, 'heart');
      heart.setScale(2);
      heart.setDepth(1000);
      heart.setScrollFactor(0);
      this.heartIcons.push(heart);
    }
  }
  
  private updateHearts(): void {
    for (let i = 0; i < this.heartIcons.length; i++) {
      if (i < this.gameState.data.playerHealth) {
        this.heartIcons[i].setAlpha(1);
        this.heartIcons[i].clearTint();
      } else {
        this.heartIcons[i].setAlpha(0.3);
        this.heartIcons[i].setTint(0x666666);
      }
    }
  }
  
  private updateObjective(): void {
    if (this.objectiveText) {
      this.objectiveText.setText(`Objetivo: ${this.gameState.data.objectiveText}`);
    }
  }
  
  private createInventoryDisplay(): void {
    const items = [
      { key: 'keyRelic', label: 'Key', sprite: 'key' },
      { key: 'memorySigil', label: 'Sigil', sprite: 'particle' },
      { key: 'nativityManger', label: 'Manger', sprite: 'gift' }
    ];
    
    const startX = 1180;
    const startY = 30;
    const spacing = 44;
    
    items.forEach((item, index) => {
      const container = this.add.container(startX + index * spacing, startY);
      container.setScrollFactor(0);
      
      const bg = this.add.rectangle(0, 0, 40, 40, 0x000000, 0.7);
      bg.setStrokeStyle(2, 0x666666);
      container.add(bg);
      
      const icon = this.add.sprite(0, 0, item.sprite);
      icon.setScale(1.8);
      icon.setAlpha(0.3);
      container.add(icon);
      
      container.setDepth(1000);
      this.inventoryIcons.set(item.key, container);
    });
  }
  
  private updateInventory(): void {
    // Update Key Relic
    const keyIcon = this.inventoryIcons.get('keyRelic');
    if (keyIcon) {
      const icon = keyIcon.list[1] as Phaser.GameObjects.Sprite;
      icon.setAlpha(this.gameState.data.hasKeyRelic ? 1 : 0.3);
    }
    
    // Update Memory Sigil
    const sigilIcon = this.inventoryIcons.get('memorySigil');
    if (sigilIcon) {
      const icon = sigilIcon.list[1] as Phaser.GameObjects.Sprite;
      icon.setAlpha(this.gameState.data.hasMemorySigil ? 1 : 0.3);
    }
    
    // Update Nativity Manger
    const mangerIcon = this.inventoryIcons.get('nativityManger');
    if (mangerIcon) {
      const icon = mangerIcon.list[1] as Phaser.GameObjects.Sprite;
      icon.setAlpha(this.gameState.data.hasNativityManger ? 1 : 0.3);
    }
  }
  
  public showEndScreen(): void {
    if (this.endScreen) return;
    
    this.endScreen = this.add.container(640, 360);
    this.endScreen.setDepth(2000);
    
    // Background
    const bg = this.add.rectangle(0, 0, 800, 500, 0x000000, 0.95);
    this.endScreen.add(bg);
    
    // Border
    const border = this.add.rectangle(0, 0, 800, 500);
    border.setStrokeStyle(4, 0xffd700);
    this.endScreen.add(border);
    
    // Title
    const title = this.add.text(0, -120, 'Navidad Atlas', {
      fontSize: '48px',
      color: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0.5);
    this.endScreen.add(title);
    
    // Subtitle
    const subtitle = this.add.text(0, -60, 'Misterio resuelto', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    subtitle.setOrigin(0.5, 0.5);
    this.endScreen.add(subtitle);
    
    // Message
    const message = this.add.text(0, 20, '¡Gracias por jugar!\n\n¡Feliz Navidad!', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    });
    message.setOrigin(0.5, 0.5);
    this.endScreen.add(message);
    
    // Restart prompt
    const restart = this.add.text(0, 140, 'Presiona ENTER para reiniciar', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    restart.setOrigin(0.5, 0.5);
    this.endScreen.add(restart);
    
    // Blink animation
    this.tweens.add({
      targets: restart,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }
}

