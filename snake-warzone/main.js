// Main game script for Snake Warzone - Multiplayer Edition
// This will be the entry point for our Phaser.js game with WebSocket support

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Phaser with basic configuration
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    // Create a new Phaser game instance
    const game = new Phaser.Game(config);

    let socket;
    let cursors;
    let localPlayerId;

    function preload() {
        console.log('Preloading assets...');
        // Load a simple background image
        this.load.image('background', 'https://via.placeholder.com/800x600.png?text=Snake+Warzone');

        // Load snake and food sprites
        this.load.image('snake', 'https://via.placeholder.com/20x20.png?text=S');
        this.load.image('food', 'https://via.placeholder.com/15x15.png?text=F');
    }

    function create() {
        console.log('Game created!');

        // Set up background
        this.add.image(400, 300, 'background');

        // Connect to WebSocket server
        socket = new WebSocket('ws://' + location.host);

        // Handle messages from the server
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'init':
                    handleGameInit(data.data);
                    break;

                case 'update':
                    updateGameState(data.data);
                    break;
            }
        };

        // Set up controls
        cursors = this.input.keyboard.createCursorKeys();
    }

    function handleGameInit(gameState) {
        console.log('Initializing game with state:', gameState);

        // Find the local player (the one that just joined)
        localPlayerId = null;
        for (let player of gameState.players) {
            if (!localPlayerId && player.id === socket.playerId) {
                localPlayerId = player.id;
            }
        }

        updateGameState(gameState);
    }

    function updateGameState(gameState) {
        // Clear previous render
        game.scene.scenes[0].children.list.forEach(child => {
            if (child !== game.config.scene.backgroundImage) {
                child.destroy();
            }
        });

        // Render food
        const food = game.scene.scenes[0].add.image(gameState.food.x, gameState.food.y, 'food');

        // Render players
        for (let player of gameState.players) {
            if (!player.alive) continue;

            // Draw snake body
            for (let segment of player.segments) {
                game.scene.scenes[0].add.image(segment.x, segment.y, 'snake');
            }

            // Draw snake head
            game.scene.scenes[0].add.image(player.x, player.y, 'snake').setTint(0x00ff00);
        }
    }

    function update(time, delta) {
        // Send movement data to server if this is the local player
        if (localPlayerId && cursors) {
            let direction = { x: 0, y: 0 };

            if (cursors.left.isDown) {
                direction.x = -2;
            } else if (cursors.right.isDown) {
                direction.x = 2;
            } else if (cursors.up.isDown) {
                direction.y = -2;
            } else if (cursors.down.isDown) {
                direction.y = 2;
            }

            socket.send(JSON.stringify({
                type: 'move',
                playerId: localPlayerId,
                direction: direction
            }));
        }
    }
});