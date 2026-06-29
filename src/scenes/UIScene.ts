import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  private gearButton!: Phaser.GameObjects.Text;
  
  // Pause Menu
  private pauseMenuBg!: Phaser.GameObjects.Graphics;
  private pauseTitle!: Phaser.GameObjects.Text;
  private resumeBtn!: Phaser.GameObjects.Text;
  private saveBtn!: Phaser.GameObjects.Text;
  private configBtn!: Phaser.GameObjects.Text;
  private exitBtn!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;

  // Inventory
  private backpackBtn!: Phaser.GameObjects.Image;
  private invBg!: Phaser.GameObjects.Graphics;
  private invTitle!: Phaser.GameObjects.Text;
  private invItemsContainer!: Phaser.GameObjects.Container;
  private isInvOpen: boolean = false;
  private itemsData: {nome: string, texture: string}[] = [];

  // Notifications
  private notifBg!: Phaser.GameObjects.Graphics;
  private notifText!: Phaser.GameObjects.Text;
  private notifTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    // 1. Botão de Configurações (Engrenagem) no canto superior direito
    this.gearButton = this.add.text(this.cameras.main.width - 60, 20, '⚙️', { font: '36px Arial', color: '#ffffff' })
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(100);
    this.gearButton.on('pointerdown', () => this.togglePauseMenu());

    // 2. Botão da Mochila
    this.backpackBtn = this.add.image(90, 38, 'mochila').setDisplaySize(44, 44)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(100);
    this.backpackBtn.on('pointerdown', () => this.toggleInventory());

    // Escuta tecla ESC para pausar/despausar
    this.input.keyboard?.on('keydown-ESC', () => {
      // Se inventário estiver aberto, fecha o inventário. Senão, alterna pause.
      if (this.isInvOpen) {
        this.toggleInventory();
      } else {
        this.togglePauseMenu();
      }
    });

    // Escuta evento de coleta de item (pode vir do GameScene)
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('item-coletado', (itens: {nome: string, texture: string}[], itemName: string) => {
      this.itemsData = itens;
      this.showNotification(`Você encontrou: ${itemName}`);
      this.updateInventoryView();
    });

    this.createPauseMenu();
    this.createInventoryUI();
    this.createNotificationUI();
    this.updateInventoryView(); // Initialize empty state
  }

  private togglePauseMenu() {
    if (this.isInvOpen) this.toggleInventory(); // Fecha inventário se estiver aberto

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.scene.pause('GameScene');
      this.pauseMenuBg.setVisible(true);
      this.pauseTitle.setVisible(true);
      this.resumeBtn.setVisible(true);
      this.saveBtn.setVisible(true);
      this.configBtn.setVisible(true);
      this.exitBtn.setVisible(true);
    } else {
      this.scene.resume('GameScene');
      this.pauseMenuBg.setVisible(false);
      this.pauseTitle.setVisible(false);
      this.resumeBtn.setVisible(false);
      this.saveBtn.setVisible(false);
      this.configBtn.setVisible(false);
      this.exitBtn.setVisible(false);
    }
  }

  private createPauseMenu() {
    const cx = this.cameras.main.width;
    const cy = this.cameras.main.height;
    
    this.pauseMenuBg = this.add.graphics();
    const w = 400;
    const h = 450;
    const px = cx/2 - w/2;
    const py = cy/2 - h/2;
    
    // Aesthetic: Verde (#1B4332), Azul (#0B2545), Marrom (#3E2723)
    this.pauseMenuBg.fillStyle(0x0B2545, 0.95);
    this.pauseMenuBg.fillRect(px, py, w, h);
    this.pauseMenuBg.lineStyle(6, 0x1B4332);
    this.pauseMenuBg.strokeRect(px, py, w, h);
    
    this.pauseTitle = this.add.text(cx/2, py + 50, 'PAUSADO', {
      font: 'bold 36px monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    const btnStyle = { font: '24px monospace', color: '#ffffff', backgroundColor: '#3E2723', padding: { x: 20, y: 10 } };
    
    this.resumeBtn = this.add.text(cx/2, py + 150, 'Continuar', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.resumeBtn.on('pointerdown', () => this.togglePauseMenu());

    this.saveBtn = this.add.text(cx/2, py + 230, 'Salvar Jogo', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.saveBtn.on('pointerdown', () => this.showNotification('Função Salvar em breve...'));

    this.configBtn = this.add.text(cx/2, py + 310, 'Configurações', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.configBtn.on('pointerdown', () => this.showNotification('Configurações em breve...'));

    this.exitBtn = this.add.text(cx/2, py + 390, 'Sair do Jogo', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.exitBtn.on('pointerdown', () => {
      this.togglePauseMenu();
      this.scene.stop('GameScene');
      // Redirecionaria pro menu principal, aqui reiniciamos
      this.scene.start('PreloadScene');
    });

    this.pauseMenuBg.setVisible(false);
    this.pauseTitle.setVisible(false);
    this.resumeBtn.setVisible(false);
    this.saveBtn.setVisible(false);
    this.configBtn.setVisible(false);
    this.exitBtn.setVisible(false);
  }

  private toggleInventory() {
    if (this.isPaused) return; // Não abre inventário se pausado

    this.isInvOpen = !this.isInvOpen;
    
    if (this.isInvOpen) {
      this.scene.pause('GameScene'); // Pausa o jogo ao ver o inventário
      this.invBg.setVisible(true);
      this.invTitle.setVisible(true);
      this.invItemsContainer.setVisible(true);
    } else {
      this.scene.resume('GameScene');
      this.invBg.setVisible(false);
      this.invTitle.setVisible(false);
      this.invItemsContainer.setVisible(false);
    }
  }

  private createInventoryUI() {
    const cx = this.cameras.main.width;
    const cy = this.cameras.main.height;
    
    this.invBg = this.add.graphics();
    const w = 600;
    const h = 450;
    const px = cx/2 - w/2;
    const py = cy/2 - h/2;
    
    // Aesthetic: Verde Escuro (#1B4332) e Marrom (#3E2723)
    this.invBg.fillStyle(0x1B4332, 0.95);
    this.invBg.fillRect(px, py, w, h);
    this.invBg.lineStyle(6, 0x3E2723);
    this.invBg.strokeRect(px, py, w, h);
    
    this.invTitle = this.add.text(cx/2, py + 40, 'MOCHILA DE ETHAN', {
      font: 'bold 30px monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.invItemsContainer = this.add.container(px, py);

    this.invBg.setVisible(false);
    this.invTitle.setVisible(false);
    this.invItemsContainer.setVisible(false);
  }

  private updateInventoryView() {
    this.invItemsContainer.removeAll(true);
    
    const startX = 60;
    const startY = 100;
    const colSpacing = 160;
    const rowSpacing = 140;
    const maxCols = 3;

    if (this.itemsData.length === 0) {
      const emptyText = this.add.text(300, 225, 'A mochila está vazia.', {
        font: '20px monospace',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      this.invItemsContainer.add(emptyText);
      return;
    }

    this.itemsData.forEach((item, index) => {
      const col = index % maxCols;
      const row = Math.floor(index / maxCols);
      const x = startX + col * colSpacing;
      const y = startY + row * rowSpacing;

      // Slot background
      const slot = this.add.graphics();
      slot.fillStyle(0x0B2545, 1);
      slot.fillRect(x, y, 100, 100);
      slot.lineStyle(2, 0x3E2723);
      slot.strokeRect(x, y, 100, 100);

      // Icon
      const icon = this.add.image(x + 50, y + 40, item.texture).setDisplaySize(64, 64);
      
      // Name
      const name = this.add.text(x + 50, y + 85, item.nome, {
        font: '14px monospace',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);

      this.invItemsContainer.add([slot, icon, name]);
    });
  }

  private createNotificationUI() {
    this.notifBg = this.add.graphics();
    this.notifBg.setDepth(3000).setVisible(false);
    
    this.notifText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 80, '', {
      font: '20px monospace',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(3001).setVisible(false);
  }

  private showNotification(texto: string) {
    const cx = this.cameras.main.width;
    const cy = this.cameras.main.height;
    const largura = 500;
    const altura = 60;
    const px = cx / 2 - largura / 2;
    const py = cy - altura - 50;

    this.notifBg.clear();
    this.notifBg.fillStyle(0x3E2723, 0.9);
    this.notifBg.fillRect(px, py, largura, altura);
    this.notifBg.lineStyle(2, 0x0B2545);
    this.notifBg.strokeRect(px, py, largura, altura);
    
    this.notifBg.setVisible(true);
    
    this.notifText.setText(texto);
    this.notifText.setPosition(cx / 2, py + altura / 2);
    this.notifText.setVisible(true);

    if (this.notifTimer) this.notifTimer.remove(false);

    this.notifTimer = this.time.addEvent({
      delay: 2500,
      callback: () => {
        this.notifBg.setVisible(false);
        this.notifText.setVisible(false);
      }
    });
  }
}
