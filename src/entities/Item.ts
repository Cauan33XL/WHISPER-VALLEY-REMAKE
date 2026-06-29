import Phaser from 'phaser';
import Player from './Player';

export class Item extends Phaser.GameObjects.Image {
  public nome: string;
  public coletado = false;
  private promptText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, nome: string, texture: string) {
    super(scene, x, y, texture);
    this.nome = nome;
    
    // Configurações do item
    this.setDisplaySize(48, 48);
    scene.add.existing(this);

    // Texto flutuante de dica
    this.promptText = scene.add.text(x, y - 50, 'ESPAÇO para coletar', {
      font: '16px monospace',
      color: '#ffffff',
      backgroundColor: '#00000088'
    }).setOrigin(0.5).setVisible(false);
  }

  update(player: Player, spaceKey: Phaser.Input.Keyboard.Key, inventory: Inventory) {
    if (this.coletado) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    
    if (dist < 120) {
      this.promptText.setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        this.coletar(inventory);
      }
    } else {
      this.promptText.setVisible(false);
    }
  }

  private coletar(inventory: Inventory) {
    this.coletado = true;
    this.setVisible(false);
    this.promptText.setVisible(false);
    inventory.adicionarItem(this.nome, this.texture.key);
  }
}

export class Inventory {
  public itens: { nome: string, texture: string }[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  adicionarItem(nome: string, texture: string) {
    this.itens.push({ nome, texture });
    // Dispara um evento global ou na cena atual para a UIScene atualizar
    this.scene.events.emit('item-coletado', this.itens, nome);
  }
}
