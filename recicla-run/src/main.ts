// src/main.ts
import Phaser from "phaser";

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // carregue assets aqui se precisar (sprites, fontes, áudio...)
  }

  create() {
    // pega largura/altura do canvas (útil para centralizar)
    const width = this.scale.width;
    const height = this.scale.height;

    // fundo simples (pode ser substituído por tileSprite ou imagem)
    this.cameras.main.setBackgroundColor("#87CEEB"); // skyblue

    // texto centralizado
    const title = this.add.text(width / 2, height / 2, "Recicla Run", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "72px",
      fontStyle: "bold",
      color: "#ffffffff",
      stroke: "#0b702b",
      strokeThickness: 8,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        blur: 2,
        color: "#000000",
        stroke: true,
        fill: true,
      },
    });

    // define origem para centralizar (x=0.5, y=0.5)
    title.setOrigin(0.5, 0.5);

    // pequeno efeito de entrada (opcional)
    this.tweens.add({
      targets: title,
      y: height / 2 - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container", // div onde o canvas irá (padrão: document.body se não existir)
  width: 1980,
  height: 920,
  backgroundColor: "#000000",
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

export default new Phaser.Game(config);
