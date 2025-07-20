import Phaser from 'phaser';

/**
 * @class AudioManager
 * @description Manages audio playback for game events.
 */
export class AudioManager {
    private scene: Phaser.Scene;
    private eatSound: Phaser.Sound.BaseSound;
    private collisionSound: Phaser.Sound.BaseSound;

    /**
     * @constructor
     * @param {Phaser.Scene} scene - The Phaser Scene to manage audio for.
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.eatSound = this.scene.sound.add('eat_sound');
        this.collisionSound = this.scene.sound.add('collision_sound');
    }

    /**
     * @method playEatSound
     * @description Plays the sound for eating food.
     */
    playEatSound(): void {
        this.eatSound.play();
    }

    /**
     * @method playCollisionSound
     * @description Plays the sound for collisions.
     */
    playCollisionSound(): void {
        this.collisionSound.play();
    }
}