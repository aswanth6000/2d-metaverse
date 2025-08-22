import React, { useEffect } from "react";
import Phaser from "phaser";

const Game: React.FC = () => {
    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            physics: { default: "arcade" },
            parent: "phaser-container",
            scene: { preload, create, update },
        };

        const game = new Phaser.Game(config);

        let body: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        let hair: Phaser.GameObjects.Sprite;
        let dress: Phaser.GameObjects.Sprite;

        let cursors: Phaser.Types.Input.Keyboard.CursorKeys;

        function preload(this: Phaser.Scene) {
            this.load.spritesheet("body", "/body.png", {
                frameWidth: 48,
                frameHeight: 64,
            });
            this.load.spritesheet("hair", "/hair.png", {
                frameWidth: 48,
                frameHeight: 64,
            });
            this.load.spritesheet("dress", "/dress.png", {
                frameWidth: 48,
                frameHeight: 64,
            });
        }

        function create(this: Phaser.Scene) {
            // Walk animations (same frame ranges for all)
            const animations = [
                { key: "walk-down", start: 0, end: 4 },
                { key: "walk-left", start: 5, end: 9 },
                { key: "walk-right", start: 10, end: 14 },
                { key: "walk-up", start: 15, end: 19 },
            ];

            animations.forEach((anim) => {
                this.anims.create({
                    key: `${anim.key}-body`,
                    frames: this.anims.generateFrameNumbers("body", {
                        start: anim.start,
                        end: anim.end,
                    }),
                    frameRate: 8,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${anim.key}-hair`,
                    frames: this.anims.generateFrameNumbers("hair", {
                        start: anim.start,
                        end: anim.end,
                    }),
                    frameRate: 8,
                    repeat: -1,
                });
                this.anims.create({
                    key: `${anim.key}-dress`,
                    frames: this.anims.generateFrameNumbers("dress", {
                        start: anim.start,
                        end: anim.end,
                    }),
                    frameRate: 8,
                    repeat: -1,
                });
            });

            this.anims.create({
                key: "idle-body",
                frames: [{ key: "body", frame: 0 }],
                frameRate: 1,
            });
            this.anims.create({
                key: "idle-hair",
                frames: [{ key: "hair", frame: 0 }],
                frameRate: 1,
            });
            this.anims.create({
                key: "idle-dress",
                frames: [{ key: "dress", frame: 0 }],
                frameRate: 1,
            });

            // Create sprites stacked in the same position
            body = this.physics.add.sprite(400, 300, "body").setScale(2);
            hair = this.add.sprite(400, 300, "hair").setScale(2);
            dress = this.add.sprite(400, 300, "dress").setScale(2);


            // Ensure correct rendering order (body → dress → hair)
            body.setDepth(0);
            dress.setDepth(1);
            hair.setDepth(2);

            cursors = this.input.keyboard.createCursorKeys();
        }

        function update(this: Phaser.Scene) {
            if (!body) return;

            body.setVelocity(0);

            if (cursors.left?.isDown) {
                body.setVelocityX(-100);
                body.anims.play("walk-left-body", true);
                hair.anims.play("walk-left-hair", true);
                dress.anims.play("walk-left-dress", true);
            } else if (cursors.right?.isDown) {
                body.setVelocityX(100);
                body.anims.play("walk-right-body", true);
                hair.anims.play("walk-right-hair", true);
                dress.anims.play("walk-right-dress", true);
            } else if (cursors.up?.isDown) {
                body.setVelocityY(-100);
                body.anims.play("walk-up-body", true);
                hair.anims.play("walk-up-hair", true);
                dress.anims.play("walk-up-dress", true);
            } else if (cursors.down?.isDown) {
                body.setVelocityY(100);
                body.anims.play("walk-down-body", true);
                hair.anims.play("walk-down-hair", true);
                dress.anims.play("walk-down-dress", true);
            } else {
                body.anims.play("idle-body", true);
                hair.anims.play("idle-hair", true);
                dress.anims.play("idle-dress", true);
            }

            // keep layers aligned with body
            hair.x = body.x;
            hair.y = body.y;
            dress.x = body.x;
            dress.y = body.y;
        }

        return () => game.destroy(true);
    }, []);

    return <div id="phaser-container" />;
};

export default Game;
