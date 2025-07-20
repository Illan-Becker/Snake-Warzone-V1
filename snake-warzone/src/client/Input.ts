import Phaser from 'phaser';

/**
 * @class Input
 * @description Handles user input for mobile virtual joystick and tap-to-boost controls.
 */
export class Input {
    private scene: Phaser.Scene;
    private joystickBase: Phaser.GameObjects.Arc | null = null;
    private joystickThumb: Phaser.GameObjects.Arc | null = null;
    private joystickPointerId: number | null = null;
    private joystickRadius: number = 60; // Half of 120px joystick radius
    private joystickActive: boolean = false;
    private boostCooldown: number = 0;
    private boostCooldownDuration: number = 500; // 0.5 seconds

    public onMove: ((angle: number) => void) | null = null;
    public onBoost: (() => void) | null = null;

    /**
     * @constructor
     * @param {Phaser.Scene} scene - The Phaser Scene to attach input handlers to.
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.scene.input.on('pointerdown', this.handlePointerDown, this);
        this.scene.input.on('pointermove', this.handlePointerMove, this);
        this.scene.input.on('pointerup', this.handlePointerUp, this);

        this.createJoystick();
    }

    /**
     * @method createJoystick
     * @description Creates the visual representation of the virtual joystick.
     */
    private createJoystick() {
        // Position the joystick in the lower-left quadrant
        const x = this.scene.cameras.main.width * 0.25;
        const y = this.scene.cameras.main.height * 0.75;

        this.joystickBase = this.scene.add.circle(x, y, this.joystickRadius, 0x888888, 0.5);
        this.joystickBase.setDepth(100).setScrollFactor(0); // Fixed position on camera
        this.joystickThumb = this.scene.add.circle(x, y, this.joystickRadius / 2, 0xCCCCCC, 0.8);
        this.joystickThumb.setDepth(101).setScrollFactor(0); // Fixed position on camera
    }

    /**
     * @method handlePointerDown
     * @description Handles pointer down events for joystick activation or boost.
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (this.joystickBase && this.joystickBase.getBounds().contains(pointer.x, pointer.y)) {
            this.joystickActive = true;
            this.joystickPointerId = pointer.id;
        } else {
            // Tap outside joystick for boost
            if (this.onBoost && this.scene.time.now > this.boostCooldown) {
                this.onBoost();
                this.boostCooldown = this.scene.time.now + this.boostCooldownDuration;
            }
        }
    }

    /**
     * @method handlePointerMove
     * @description Handles pointer move events for joystick control.
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    private handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (this.joystickActive && pointer.id === this.joystickPointerId && this.joystickBase && this.joystickThumb) {
            const distance = Phaser.Math.Distance.Between(this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y);
            const angle = Phaser.Math.Angle.Between(this.joystickBase.x, this.joystickBase.y, pointer.x, pointer.y);

            // Limit thumb movement within the base
            if (distance < this.joystickRadius) {
                this.joystickThumb.setPosition(pointer.x, pointer.y);
            } else {
                this.joystickThumb.setPosition(
                    this.joystickBase.x + Math.cos(angle) * this.joystickRadius,
                    this.joystickBase.y + Math.sin(angle) * this.joystickRadius
                );
            }

            if (this.onMove) {
                this.onMove(angle);
            }
        }
    }

    /**
     * @method handlePointerUp
     * @description Handles pointer up events to deactivate the joystick.
     * @param {Phaser.Input.Pointer} pointer - The pointer object.
     */
    private handlePointerUp(pointer: Phaser.Input.Pointer) {
        if (pointer.id === this.joystickPointerId) {
            this.joystickActive = false;
            this.joystickPointerId = null;
            if (this.joystickBase && this.joystickThumb) {
                this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y); // Snap thumb back to center
            }
        }
    }
}