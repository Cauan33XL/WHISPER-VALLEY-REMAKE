import Phaser from 'phaser';
import './style.css';
import PreloadScene from './scenes/PreloadScene';
import GameScene from './scenes/GameScene';
import CutsceneScene from './scenes/CutsceneScene';
import FinalScene from './scenes/FinalScene';
import UIScene from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: '100%',
  height: '100%',
  parent: 'app',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#000000',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 } // Jogo top-down
    }
  },
  dom: {
    createContainer: true
  },
  scene: [
    PreloadScene,
    CutsceneScene,
    GameScene,
    UIScene,
    FinalScene
  ]
};

const game = new Phaser.Game(config);
export default game;
