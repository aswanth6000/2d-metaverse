
import React, { useEffect } from "react";
import Phaser from "phaser";

const Loader: React.FC = () => {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: { default: "arcade" },
      parent: "phaser-container",
      scene: {
        preload,
        create,
        update,
      },
    };

    const game = new Phaser.Game(config);

    function preload(this: Phaser.Scene) {
      // Load sprite sheet (assuming 4 frames in a row, frameWidth/Height = your image frame size)
      this.load.spritesheet("player", "/loading.png", {
        frameWidth: 210,   // width of one frame
        frameHeight: 280,  // height of one frame
      });
    }

    function create(this: Phaser.Scene) {
      // Create animation
      this.anims.create({
        key: "walk",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }), // 4 stills
        frameRate: 8,  // speed of animation
        repeat: -1,    // loop forever
      });

      // Add sprite
      const sprite = this.add.sprite(400, 300, "player");

      // Play animation
      sprite.play("walk");
    }

    function update(this: Phaser.Scene) {}

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="phaser-container" />;
};

export default Loader;
