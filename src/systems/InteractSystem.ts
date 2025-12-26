export interface Interactable {
  id: string;
  x: number;
  y: number;
  radius: number;
  promptText: string;
  onInteract: () => void;
}

export class InteractSystem {
  private scene: Phaser.Scene;
  private interactables: Map<string, Interactable> = new Map();
  private promptText: Phaser.GameObjects.Text | null = null;
  private currentInteractable: Interactable | null = null;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create prompt text - fixed to camera
    this.promptText = this.scene.add.text(640, 680, '', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
      fontFamily: 'Arial'
    });
    this.promptText.setOrigin(0.5, 0.5);
    this.promptText.setDepth(900);
    this.promptText.setScrollFactor(0); // Fix to screen
    this.promptText.setVisible(false);
  }
  
  public register(interactable: Interactable): void {
    console.log('InteractSystem: Registering', interactable.id, 'at', interactable.x, interactable.y, 'radius:', interactable.radius);
    this.interactables.set(interactable.id, interactable);
  }
  
  public unregister(id: string): void {
    this.interactables.delete(id);
  }
  
  public update(playerX: number, playerY: number): void {
    let closestInteractable: Interactable | null = null;
    let closestDist = Infinity;
    
    this.interactables.forEach((interactable: Interactable) => {
      const dx = interactable.x - playerX;
      const dy = interactable.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= interactable.radius && dist < closestDist) {
        closestInteractable = interactable;
        closestDist = dist;
      }
    });
    
    this.currentInteractable = closestInteractable;
    
    if (this.promptText && closestInteractable) {
      const text = (closestInteractable as any).promptText as string;
      this.promptText.setText(text);
      this.promptText.setVisible(true);
    } else if (this.promptText) {
      this.promptText.setVisible(false);
    }
  }
  
  public interact(): boolean {
    console.log('InteractSystem: interact() called, current interactable:', this.currentInteractable?.id);
    if (this.currentInteractable) {
      console.log('InteractSystem: Triggering interaction for', this.currentInteractable.id);
      this.currentInteractable.onInteract();
      return true;
    }
    console.log('InteractSystem: No interactable in range');
    return false;
  }
  
  public hidePrompt(): void {
    if (this.promptText) {
      this.promptText.setVisible(false);
    }
  }
  
  public destroy(): void {
    if (this.promptText) {
      this.promptText.destroy();
    }
    this.interactables.clear();
  }
}

