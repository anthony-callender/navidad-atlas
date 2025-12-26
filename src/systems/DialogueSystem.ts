export interface DialogueLine {
  speaker: string;
  text: string;
}

export class DialogueSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private textObject: Phaser.GameObjects.Text | null = null;
  private speakerObject: Phaser.GameObjects.Text | null = null;
  private currentDialogue: DialogueLine[] = [];
  private currentIndex = 0;
  private isActive = false;
  private onComplete: (() => void) | null = null;
  private autoCloseMs: number | null = null;
  private autoCloseTimer: Phaser.Time.TimerEvent | null = null;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public start(
    dialogue: DialogueLine[],
    onComplete?: () => void,
    opts?: { autoCloseMs?: number }
  ): void {
    if (this.isActive) return;
    
    this.currentDialogue = dialogue;
    this.currentIndex = 0;
    this.isActive = true;
    this.onComplete = onComplete || null;
    this.autoCloseMs = opts?.autoCloseMs ?? null;
    this.autoCloseTimer?.remove(false);
    this.autoCloseTimer = null;
    
    this.createDialogueBox();
    this.showLine();
  }
  
  public advance(): void {
    if (!this.isActive) return;
    
    this.currentIndex++;
    if (this.currentIndex >= this.currentDialogue.length) {
      this.close();
    } else {
      this.showLine();
    }
  }
  
  public close(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.autoCloseTimer?.remove(false);
    this.autoCloseTimer = null;
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.textObject = null;
    this.speakerObject = null;
    
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
  }
  
  public isDialogueActive(): boolean {
    return this.isActive;
  }
  
  private createDialogueBox(): void {
    const width = 1000;
    const height = 140;
    
    // Position relative to camera center
    const camera = this.scene.cameras.main;
    const x = camera.scrollX + (camera.width / 2) - (width / 2);
    const y = camera.scrollY + camera.height - height - 30;
    
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0); // Fix to screen, not world
    
    // Background
    const bg = this.scene.add.rectangle(camera.width / 2, camera.height - height / 2 - 30, width, height, 0x000000, 0.85);
    this.container.add(bg);
    
    // Border
    const border = this.scene.add.rectangle(camera.width / 2, camera.height - height / 2 - 30, width, height, 0xffffff);
    border.setStrokeStyle(3, 0xffffff);
    border.setFillStyle(0x000000, 0);
    this.container.add(border);
    
    // Speaker name
    this.speakerObject = this.scene.add.text(camera.width / 2 - width / 2 + 15, camera.height - height - 20, '', {
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    });
    this.container.add(this.speakerObject);
    
    // Dialogue text
    this.textObject = this.scene.add.text(camera.width / 2 - width / 2 + 15, camera.height - height + 5, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial',
      wordWrap: { width: width - 30 }
    });
    this.container.add(this.textObject);
    
    // Prompt
    const prompt = this.scene.add.text(camera.width / 2 + width / 2 - 160, camera.height - 55, 'E / Espacio', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    });
    this.container.add(prompt);
  }
  
  private showLine(): void {
    if (!this.textObject || !this.speakerObject) return;
    
    const line = this.currentDialogue[this.currentIndex];
    this.speakerObject.setText(line.speaker);
    this.textObject.setText(line.text);

    // Make URLs clickable (hand cursor + opens in new tab). Useful for gift links on the ending.
    const urlMatch = line.text.match(/https?:\/\/\S+/);
    if (urlMatch) {
      const url = urlMatch[0];
      this.textObject.setStyle({ color: '#7dc6ff' });
      this.textObject.setInteractive({ useHandCursor: true });
      // Remove previous handlers to avoid stacking across lines.
      this.textObject.removeAllListeners();
      this.textObject.on('pointerdown', () => {
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
          // ignore
        }
      });
    } else {
      // Restore default style and interactivity when no link is present.
      this.textObject.setStyle({ color: '#ffffff' });
      this.textObject.disableInteractive();
      this.textObject.removeAllListeners();
    }

    // Optional auto-close when the last line is displayed (for cinematic beats)
    if (this.autoCloseMs !== null && this.currentIndex === this.currentDialogue.length - 1) {
      this.autoCloseTimer?.remove(false);
      this.autoCloseTimer = this.scene.time.delayedCall(this.autoCloseMs, () => {
        this.close();
      });
    }
  }
}

