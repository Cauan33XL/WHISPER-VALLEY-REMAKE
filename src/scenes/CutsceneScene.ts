import Phaser from 'phaser';
import { dialogos } from '../data/dialogos';

interface CutsceneConfig {
  type: 'image' | 'text';
  imageKey?: string;
  texts?: string[];
}

const cutsceneSequence: CutsceneConfig[] = [
  { type: 'image', imageKey: 'logo' },
  { type: 'image', imageKey: 'instrucoes' },
  {
    type: 'text',
    texts: [
      "O protagonista, Ethan Graves, é um jornalista que costuma\n" +
      "se sair bem em suas matérias, mas tudo muda quando seu\n" +
      "melhor amigo, Miguel, desaparece misteriosamente em uma\n" +
      "floresta. Depois desse acontecimento, seu desempenho\n" +
      "cai e ele precisa escrever uma matéria urgente para o\n" +
      "jornal em que trabalha, caso contrário será demitido.\n" +
      "A mando de seu chefe, Ethan viaja para uma cidade\n" +
      "escondida entre as árvores, em busca de desvendar os\n" +
      "mistérios do lugar: Whisper Valley."
    ]
  },
  { type: 'image', imageKey: 'cena-1', texts: dialogos.cena1 },
  { type: 'image', imageKey: 'cena-2', texts: dialogos.cena2 },
  { type: 'image', imageKey: 'cena-3', texts: dialogos.cena3 },
  { type: 'image', imageKey: 'cena-4' },
];

export default class CutsceneScene extends Phaser.Scene {
  private currentIndex = 0;
  private currentTextIndex = 0;

  private bgImage?: Phaser.GameObjects.Image;
  private dialogBox?: Phaser.GameObjects.Graphics;
  private dialogText?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  
  private typeWriterEvent?: Phaser.Time.TimerEvent;
  private currentFullText = "";
  private currentTypedText = "";

  constructor() {
    super('CutsceneScene');
  }

  create() {
    this.currentIndex = 0;
    this.currentTextIndex = 0;

    const width = this.scale.width;
    const height = this.scale.height;

    this.bgImage = this.add.image(width / 2, height / 2, '').setOrigin(0.5);
    this.bgImage.setVisible(false);

    this.dialogBox = this.add.graphics();
    this.dialogText = this.add.text(50, height - 140, '', {
      font: '20px monospace',
      color: '#ffffff',
      wordWrap: { width: width - 100 }
    });

    this.promptText = this.add.text(width - 35, height - 40, 'ESPAÇO para avançar', {
      font: '18px monospace',
      color: '#ffffff'
    }).setOrigin(1, 1);

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const w = gameSize.width;
      const h = gameSize.height;
      this.bgImage?.setPosition(w / 2, h / 2);
      if (this.bgImage && this.bgImage.texture.key !== '__DEFAULT') {
          this.bgImage.setDisplaySize(w, h);
      }
      this.promptText?.setPosition(w - 35, h - 40);
      if (this.dialogText?.originX === 0.5) {
        this.dialogText?.setPosition(w / 2, h / 2);
      } else {
        this.dialogText?.setPosition(50, h - 140);
        this.dialogText?.setStyle({ wordWrap: { width: w - 100 } });
      }
      this.drawBox(cutsceneSequence[this.currentIndex]?.type === 'image');
    });

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 800
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.advance();
    });

    this.renderCurrentScene();
  }

  advance() {
    const current = cutsceneSequence[this.currentIndex];
    
    // Se o efeito de digitação ainda não terminou, completa ele imediatamente
    if (this.typeWriterEvent && this.currentTypedText.length < this.currentFullText.length) {
      this.typeWriterEvent.remove(false);
      this.currentTypedText = this.currentFullText;
      if (current.type === 'text') {
        this.dialogText?.setText(this.currentTypedText);
        this.dialogText?.setPosition(this.scale.width / 2, this.scale.height / 2); // centralizado
        this.dialogText?.setOrigin(0.5);
      } else {
        this.dialogText?.setText(this.currentTypedText);
      }
      return;
    }

    if (current.texts && this.currentTextIndex < current.texts.length - 1) {
      this.currentTextIndex++;
      this.showText();
    } else {
      this.currentIndex++;
      this.currentTextIndex = 0;
      if (this.currentIndex >= cutsceneSequence.length) {
        this.scene.start('GameScene');
      } else {
        this.renderCurrentScene();
      }
    }
  }

  renderCurrentScene() {
    const current = cutsceneSequence[this.currentIndex];

    if (current.type === 'image' && current.imageKey) {
      this.bgImage?.setTexture(current.imageKey);
      this.bgImage?.setDisplaySize(this.scale.width, this.scale.height);
      this.bgImage?.setVisible(true);
      // reset dialog styles
      this.dialogText?.setOrigin(0);
      this.dialogText?.setPosition(50, this.scale.height - 140);
      this.dialogText?.setAlign('left');
    } else {
      this.bgImage?.setVisible(false);
      // setup text style for intro
      this.dialogText?.setOrigin(0.5);
      this.dialogText?.setPosition(this.scale.width / 2, this.scale.height / 2);
      this.dialogText?.setAlign('center');
      this.drawBox(false);
    }

    if (current.texts && current.texts.length > 0) {
      this.showText();
    } else {
      this.dialogText?.setText('');
      this.drawBox(false);
    }
  }

  showText() {
    const current = cutsceneSequence[this.currentIndex];
    this.currentFullText = current.texts![this.currentTextIndex];
    this.currentTypedText = "";
    
    if (current.type === 'image') {
      this.drawBox(true);
    }

    if (this.typeWriterEvent) this.typeWriterEvent.remove(false);

    if (current.type === 'text') {
      // Efeito de digitação lento para a introdução
      let i = 0;
      this.typeWriterEvent = this.time.addEvent({
        delay: 40,
        repeat: this.currentFullText.length - 1,
        callback: () => {
          this.currentTypedText += this.currentFullText[i];
          this.dialogText?.setText(this.currentTypedText);
          i++;
        }
      });
    } else {
      // Texto normal para balão de diálogo (instantâneo ou pode ser digitado tbm)
      this.currentTypedText = this.currentFullText;
      this.dialogText?.setText(this.currentTypedText);
    }
  }

  drawBox(visible: boolean) {
    const width = this.scale.width;
    const height = this.scale.height;
    this.dialogBox?.clear();
    if (visible) {
      const margem = 30;
      const caixaAltura = 120;
      this.dialogBox?.fillStyle(0x000000, 0.6);
      this.dialogBox?.fillRect(margem, height - caixaAltura - margem, width - margem * 2, caixaAltura);
      this.dialogBox?.lineStyle(2, 0xffffff);
      this.dialogBox?.strokeRect(margem, height - caixaAltura - margem, width - margem * 2, caixaAltura);
    }
  }
}
