import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private speed = 400; // Phaser uses pixels per second, 7 * 60FPS ~= 420
  private shadow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    // Sombra no chão
    this.shadow = scene.add.ellipse(x, y + 75, 60, 25, 0x000000, 0.4);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Ajuste da hitbox
    // No original: this.hitboxOffsetX = 100; this.hitboxOffsetY = 100; w=40; h=50;
    // O sprite tem 102x101 e era escalado por 1.7 (spriteWidth = 62 * 1.7 = 105.4)
    // No Phaser podemos usar a escala e setar o tamanho do body
    this.setScale(1.7);
    this.body?.setSize(40, 50);
    // Phaser usa o tamanho original do sprite (102x101) para calcular o offset em relação à escala.
    this.body?.setOffset(30, 45); // ajustado para corresponder mais ou menos aos offsets originais

    this.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasdKeys = scene.input.keyboard!.addKeys('W,A,S,D') as any;

    this.createAnimations(scene);
  }

  private createAnimations(scene: Phaser.Scene) {
    const anims = scene.anims;

    // A spritesheet original tem 4 linhas (0: baixo, 1: esquerda, 2: direita, 3: cima) e 6 colunas
    anims.create({
      key: 'walk-down',
      frames: anims.generateFrameNumbers('player', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'walk-left',
      frames: anims.generateFrameNumbers('player', { start: 6, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'walk-right',
      frames: anims.generateFrameNumbers('player', { start: 12, end: 17 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: 'walk-up',
      frames: anims.generateFrameNumbers('player', { start: 18, end: 23 }),
      frameRate: 10,
      repeat: -1
    });
  }

  update() {
    this.setVelocity(0);

    let moved = false;

    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      this.setVelocityX(-this.speed);
      this.anims.play('walk-left', true);
      moved = true;
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      this.setVelocityX(this.speed);
      this.anims.play('walk-right', true);
      moved = true;
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      this.setVelocityY(-this.speed);
      if (!moved) this.anims.play('walk-up', true);
      moved = true;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      this.setVelocityY(this.speed);
      if (!moved) this.anims.play('walk-down', true);
      moved = true;
    }

    if (!moved) {
      this.anims.stop();
      // Resetar para o frame zero da animação atual
      if (this.anims.currentAnim) {
        this.setFrame(this.anims.currentAnim.frames[0].frame.name);
      } else {
        this.setFrame(0);
      }
    }
    
    // Normalizar a velocidade na diagonal (opcional, torna o jogo mais suave que o original)
    this.body?.velocity.normalize().scale(this.speed);

    // Atualiza a posição da sombra
    this.shadow.setPosition(this.x, this.y + 75);
  }
}
