import Phaser from 'phaser';
import Player from './Player';

export default class NPC extends Phaser.Physics.Arcade.Image {
  private falas: string[];
  private indiceFala = 0;
  public interagindo = false;
  
  private promptText: Phaser.GameObjects.Text;
  private dialogBox: Phaser.GameObjects.Graphics;
  private dialogText: Phaser.GameObjects.Text;
  private continueText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, falas: string[] = []) {
    super(scene, x, y, texture);
    this.falas = falas;
    
    // Configurações do Sprite
    // Original usava coordenadas no topo-esquerdo (0, 0)
    this.setOrigin(0, 0);
    
    // Calcula a escala com base numa altura ideal, um pouco maior que a do player
    const targetHeight = 195;
    const baseScale = targetHeight / this.height;
    
    // Deixa mais largo (45% extra) para ficarem mais proporcionais (mais grossos)
    const scaleX = baseScale * 1.45;
    const scaleY = baseScale;
    this.setScale(scaleX, scaleY);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = corpo estático
    
    if (this.body) {
      // Ajusta a hitbox para os pés do NPC.
      this.body.setSize(this.width * 0.6, 25);
      this.body.setOffset(this.width * 0.2, this.height - 25);
    }
    
    // Configura a profundidade (depth) baseada na posição Y da base do sprite (pés)
    this.setDepth(this.y + this.displayHeight);

    // Sombra no chão
    const shadow = scene.add.ellipse(x + (this.width * scaleX) / 2, y + (this.height * scaleY) - 5, 60, 25, 0x000000, 0.4);
    shadow.setDepth(this.depth - 1);

    // Texto flutuante de dica
    this.promptText = scene.add.text(x + (this.width * scaleX) / 2, y - 20, 'ESPAÇO para interagir', {
      font: '16px monospace',
      color: '#ffffff',
      backgroundColor: '#00000088'
    }).setOrigin(0.5).setVisible(false);

    // UI de Diálogo (fixa na tela da câmera)
    this.dialogBox = scene.add.graphics();
    this.dialogBox.setScrollFactor(0); // Fica fixo na tela
    this.dialogBox.setDepth(1000);
    this.dialogBox.setVisible(false);

    this.dialogText = scene.add.text(0, 0, '', {
      font: '18px monospace',
      color: '#ffffff',
      wordWrap: { width: 560 }
    });
    this.dialogText.setScrollFactor(0);
    this.dialogText.setDepth(1001);
    this.dialogText.setVisible(false);

    this.continueText = scene.add.text(0, 0, 'ESPAÇO para continuar', {
      font: '14px monospace',
      color: '#aaaaaa'
    });
    this.continueText.setScrollFactor(0);
    this.continueText.setDepth(1001);
    this.continueText.setVisible(false);
  }

  update(player: Player, spaceKey: Phaser.Input.Keyboard.Key) {
    const centerX = this.x + (this.width * this.scaleY) / 2;
    const centerY = this.y + (this.height * this.scaleY) / 2;
    const dist = Phaser.Math.Distance.Between(centerX, centerY, player.x, player.y);
    
    if (dist < 200) {
      if (!this.interagindo) {
        this.promptText.setVisible(true);
      } else {
        this.promptText.setVisible(false);
      }

      if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
        this.interagir(player);
      }
    } else {
      this.promptText.setVisible(false);
      if (this.interagindo) {
        this.fecharDialogo(player);
      }
    }
  }

  private interagir(player: Player) {
    if (!this.interagindo) {
      // Inicia a interação
      this.interagindo = true;
      this.indiceFala = 0;
      this.mostrarCaixaDialogo();
      player.active = false; // Trava o player de se mover
      (player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
    } else {
      // Avança a fala
      this.indiceFala++;
      if (this.indiceFala >= this.falas.length) {
        this.fecharDialogo(player);
      } else {
        this.mostrarCaixaDialogo();
      }
    }
  }

  private mostrarCaixaDialogo() {
    const cx = this.scene.cameras.main.width;
    const cy = this.scene.cameras.main.height;
    
    const larguraCaixa = 600;
    const alturaCaixa = 110;
    const px = (cx - larguraCaixa) / 2;
    const py = cy - alturaCaixa - 30;

    this.dialogBox.clear();
    this.dialogBox.fillStyle(0x000000, 0.85);
    this.dialogBox.fillRect(px, py, larguraCaixa, alturaCaixa);
    this.dialogBox.lineStyle(2, 0xffffff);
    this.dialogBox.strokeRect(px, py, larguraCaixa, alturaCaixa);
    this.dialogBox.setVisible(true);

    this.dialogText.setText(this.falas[this.indiceFala]);
    this.dialogText.setPosition(px + 16, py + 16);
    this.dialogText.setVisible(true);

    this.continueText.setPosition(px + 16, py + alturaCaixa - 24);
    this.continueText.setVisible(true);
  }

  private fecharDialogo(player: Player) {
    this.interagindo = false;
    this.dialogBox.setVisible(false);
    this.dialogText.setVisible(false);
    this.continueText.setVisible(false);
    player.active = true; // Destrava o player
  }
}
