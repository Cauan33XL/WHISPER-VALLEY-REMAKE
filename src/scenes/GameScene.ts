import Phaser from 'phaser';
import Player from '../entities/Player';
import NPC from '../entities/NPC';
import { Item, Inventory } from '../entities/Item';
import PuzzleManager from '../puzzles/PuzzleManager';
import { colisoes, TAM_BLOCO } from '../data/colisoes';
import { CutsceneConfig } from './CutsceneScene';

interface EventZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  triggered: boolean;
  sequence: CutsceneConfig[];
}

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  
  private npcs: NPC[] = [];
  private items: Item[] = [];
  private inventory!: Inventory;
  private puzzleManager!: PuzzleManager;
  private eventZones: EventZone[] = [];

  constructor() {
    super('GameScene');
  }

  create() {
    this.npcs = [];
    this.items = [];
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const mapImage = this.add.image(0, 0, 'mapa_jogo').setOrigin(0, 0);
    this.physics.world.setBounds(0, 0, mapImage.width, mapImage.height);
    this.cameras.main.setBounds(0, 0, mapImage.width, mapImage.height);

    const map = this.make.tilemap({
      data: colisoes,
      tileWidth: TAM_BLOCO,
      tileHeight: TAM_BLOCO
    });
    
    const graphics = this.make.graphics({ x: 0, y: 0 } as any);
    graphics.fillStyle(0xff0000, 0.3);
    graphics.fillRect(0, 0, TAM_BLOCO, TAM_BLOCO);
    graphics.generateTexture('collisionTile', TAM_BLOCO, TAM_BLOCO);

    const tileset = map.addTilesetImage('collisionTile');
    this.collisionLayer = map.createLayer(0, tileset!, 0, 0) as Phaser.Tilemaps.TilemapLayer;
    this.collisionLayer.setCollision(1);
    this.collisionLayer.setVisible(false);

    // Inicializar Player
    this.player = new Player(this, 1650, 2950);
    this.physics.add.collider(this.player, this.collisionLayer);

    // Inicializar Câmera
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    this.cameras.main.setZoom(1.0);

    // Inicializar NPCs (dados do index.html legado)
    this.npcs.push(new NPC(this, 5744, 2750, 'npc-1', [
      "Sebastião: Whisper Valley guarda segredos que nem o vento ousa contar...",
      "Sebastião: À noite, as vozes chamam do lago.",
      "Sebastião: Você escuta se ficar em silêncio por tempo demais.",
      "Sebastião: Foi assim que Daniel se perdeu... o lago o levou."
    ]));
    this.npcs.push(new NPC(this, 3384, 2500, 'npc-2', [
      "João: Os moradores... eles não são mais os mesmos.",
      "João: Olhos que não piscam... sorrisos que não alcançam o rosto.",
      "João: Dizem que Sofia tentou ir embora... mas acabou morrendo entre as árvores."
    ]));
    this.npcs.push(new NPC(this, 6064, 1270, 'npc-3', [
      "Ana: Abraxas... esse nome ainda ecoa aqui.",
      "Ana: Alguns o chamam de deus. Outros, de punição.",
      "Ana: Jonas... ele acreditou demais. E agora está em silêncio eterno como o resto.",
      "Ethan: Abraxas outra vez...",
      "Ethan: Todos falam desse nome como se fosse uma sombra viva.",
      "Ethan: Parece que cheguei mais perto do que devia."
    ]));
    this.npcs.push(new NPC(this, 2554, 1010, 'npc-4', [
      "Weverson: Você é novo por aqui, não é?!",
      "Weverson: Então escute bem... há algo que domina essa cidade.",
      "Weverson: Uma seita... chamam de Abraxas.",
      "Weverson: Eles observam tudo. E não gostam de forasteiros curiosos.",
      "Weverson: Tome cuidado... nem todos que sorriem aqui são humanos por completo.",
    ]));
    this.npcs.push(new NPC(this, 3064, 4990, 'npc-5', [
      "Helena: A seita pode ser vencida... mas não com força.",
      "Helena: Há um item... antigo. Escondido onde a névoa toca o chão.",
      "Helena: Miguel... ele também o procurava.",
      "Ethan: Miguel também...?",
      "Ethan: Então ele realmente esteve aqui.",
      "Ethan: O que você estava tentando me mostrar, amigo?"
    ]));

    // Colisão do player com os NPCs
    this.physics.add.collider(this.player, this.npcs);

    // Inicializar Inventário e Itens
    this.inventory = new Inventory(this);
    // Para simplificar, estamos criando texturas placeholder para os itens caso não existam as imagens
    // Os assets eram: 'pedra', 'flor', 'calice', 'pena', 'reliquia'
    this.items.push(new Item(this, 2500, 1250, 'Pedra', 'pedra'));
    this.items.push(new Item(this, 8500, 5400, 'Flor', 'flor'));
    this.items.push(new Item(this, 6030, 700, 'Cálice', 'calice'));
    this.items.push(new Item(this, 2300, 4400, 'Pena', 'pena'));
    this.items.push(new Item(this, 8560, 170, 'Relíquia', 'reliquia'));

    // Inicializar Puzzles
    this.puzzleManager = new PuzzleManager(this);

    // Inicializar Zonas de Evento (Cutscenes do mapa)
    this.eventZones = [
      {
        id: 'pousada', x: 5800, y: 2600, w: 200, h: 200, triggered: false,
        sequence: [
          { type: 'image', imageKey: 'cena-5', texts: [
            "Ethan: Estranho... não há ninguém aqui dentro.",
            "Ethan: É melhor eu me aproximar do balcão."
          ]},
          { type: 'image', imageKey: 'cena-6', texts: [
            "Ethan: Um bilhete...? O que é isso?",
            "Ethan: 'Bem-vindo à Whisper Valley, Ethan... estávamos te esperando'.",
            "Ethan: Quem escreveu isso... e como sabia que eu viria?"
          ]}
        ]
      },
      {
        id: 'igreja', x: 5450, y: 900, w: 200, h: 200, triggered: false,
        sequence: [
          { type: 'image', imageKey: 'cena-7', texts: [
            "Ethan: Que lugar é esse...? Uma igreja...",
            "Ethan: Estranho... não parece uma igreja comum.",
            "Ethan: Esses símbolos... nunca vi nada assim. Tem algo de errado aqui.",
            "Ethan: Hmm... o que é isso? Há uma frase na frente...",
            "Ethan: Parece algum tipo de enigma..."
          ]}
        ]
      },
      {
        id: 'cemiterio', x: 2900, y: 200, w: 1100, h: 550, triggered: false,
        sequence: [
          { type: 'image', imageKey: 'cena-8', texts: [
            "Ethan: Não gosto do aspecto disto.",
            "(Observando o cemitério e a torre ao longe.)",
            "Ethan: Tem sete lápides. Quatro com nomes ilegíveis, e três...",
            "Ethan: ...estas estão completamente em branco.",
            "Ethan: Isto não foi um acidente."
          ]}
        ]
      },
      {
        id: 'lago', x: 5400, y: 5500, w: 400, h: 200, triggered: false,
        sequence: [
          { type: 'image', imageKey: 'cena-9', texts: [
            "Ethan: A névoa está densa aqui.",
            "Ethan: Silêncio absoluto... não ouço nada.",
            "Ethan: O lago... parece um espelho negro, refletindo nada além da escuridão."
          ]}
        ]
      },
      {
        id: 'ruinas', x: 10250, y: 3400, w: 600, h: 600, triggered: false,
        sequence: [
          { type: 'image', imageKey: 'cena-10', texts: [
            "Ethan: Mas o que é isso...? Ruínas em meio a este lugar... É de dar calafrios.",
            "Ethan: Essas estátuas... e os pedestais. Eles não parecem estar aqui por acaso.",
            "Ethan: Símbolos em cada um... Um de água, outro de folha ou broto, terra... e um tipo de espiral?",
            "Ethan: Devem ser indicações. Cada pedestal pede por um item específico que corresponda ao seu símbolo.",
            "Ethan: A chave para o que for que esteja aqui deve ser colocar os itens corretos em cada um deles. É o que eu tenho que fazer."
          ]}
        ]
      }
    ];

    // Música
    const music = this.sound.add('musica', { loop: true, volume: 0.5 });
    if (!this.sound.locked) {
      music.play();
    } else {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        music.play();
      });
    }

    // Iniciar UI
    this.scene.launch('UIScene');
  }

  update() {
    // Se um puzzle modal está aberto, congelar player
    if (this.puzzleManager.isAnyModalOpen()) {
      this.player.active = false;
      this.player.anims.stop();
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0);
      return;
    } else {
      let interactingNPC = false;
      for (const npc of this.npcs) {
        if (npc.interagindo) {
          interactingNPC = true;
          break;
        }
      }
      this.player.active = !interactingNPC;
    }

    if (this.player.active) {
      this.player.update();
    }

    // Atualizar NPCs
    for (const npc of this.npcs) {
      npc.update(this.player, this.spaceKey);
    }

    // Atualizar Puzzles
    this.puzzleManager.update(this.player, this.spaceKey);

    // Atualizar Itens
    for (const item of this.items) {
      item.update(this.player, this.spaceKey, this.inventory);
    }

    // Checar Zonas de Evento
    for (const zone of this.eventZones) {
      if (!zone.triggered) {
        const px = this.player.x;
        const py = this.player.y;
        if (px >= zone.x && px <= zone.x + zone.w && py >= zone.y && py <= zone.y + zone.h) {
          zone.triggered = true;
          this.scene.pause();
          this.scene.launch('CutsceneScene', { sequence: zone.sequence, isResume: true, nextScene: 'GameScene' });
          return;
        }
      }
    }

    // Checar condição de final de jogo
    if (this.puzzleManager.areAllCompleted()) {
      this.scene.start('FinalScene', { inventory: this.inventory.itens });
    }
  }
}
