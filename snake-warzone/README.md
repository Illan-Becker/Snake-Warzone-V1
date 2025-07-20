# Mobile Snake Warzone Game

## Objective

Deliver a complete, production-ready TypeScript implementation of a 2-4-player mobile snake game that combines Snake 2 nostalgia with Warzone-style shrinking-circle tension.

## Technical Requirements (Summarized)

*   **Modular Architecture:** Client and server are structured using modular ES2023 principles.
*   **Camera & Canvas:** Infinite toroidal world (4000px radius), camera smoothly follows living snakes, pinch-to-zoom/pan disabled. Boundary shrinks from 4000px to 200px over 180s, then halves every 30s.
*   **Snake Logic:** Angle-based movement, trail as linked list (segment length 6px), max trail grows by eating pellets. Collision detection (self, other snakes, boundary). Death converts body to score pellets.
*   **Touch Controls:** Single-thumb virtual joystick (120px radius), tap to boost (2x speed, 1.5x turn rate, 0.5s cooldown), haptic feedback.
*   **Power-ups:** SpeedBoost, Invincible, Cutter, Magnet. Spawn algorithm: weighted random within 200px of boundary edge (1 per 5000px²). Visuals: 32x32 sprite, sine-scale bob, additive glow shader.
*   **Networking (Scaffolded):** Authoritative Node 20 server with WebSocket-WS. Client sends 30Hz input, server reconciles with client-side prediction. Snapshot compression (quantized float16, delta encoding, zlib). Target bandwidth ≤ 20 kB/s per client.
*   **Rendering:** 2.5D pseudo-3D head sprite with normal map lighting, additive trail renderer. Pulsing neon ring boundary shader. Performance targets: 60 FPS on iPhone 12, 30 FPS on Moto G Pure.
*   **Audio:** 3 positional sounds (hiss, power-up chime, boundary alarm).

## Deliverables (Summarized)

*   Fully typed source in `/src` (client) and `/server/src` (server), runnable via `npm run client-dev` and `npm run server-dev`.
*   README with build, deploy, and profiling instructions.
*   Inline JSDoc for every public method.
*   Architecture diagram in `/docs`.

## Build, Deploy, and Profiling Instructions

### Prerequisites

*   Node.js (version 20 or higher)
*   npm (Node Package Manager)

### Setup

1.  **Navigate to the project root:**
    ```bash
    cd "d:/Working_Current/AI_Apps/Infinite Snake Zone/snake-warzone"
    ```
2.  **Install client dependencies:**
    ```bash
    npm install
    ```
3.  **Install server dependencies:**
    ```bash
    npm install --prefix server
    ```

### Running the Game (Development)

1.  **Start the server:**
    Open a new terminal in the project root (`snake-warzone/`) and run:
    ```bash
    npm run server-dev
    ```
    This will start the Node.js WebSocket server, which will listen for client connections.

2.  **Start the client (web application):**
    Open *another* new terminal in the project root (`snake-warzone/`) and run:
    ```bash
    npm run client-dev
    ```
    This will start the Vite development server for the client application. It will provide a local URL (e.g., `http://localhost:5173`).

3.  **Open in Browser:**
    Open your web browser and navigate to the URL provided by `npm run client-dev`.

### Profiling (Conceptual)

*   **Client-side (Phaser):** Use your browser's developer tools (e.g., Chrome DevTools) to inspect performance, frame rates, and memory usage. Phaser also has built-in debug tools.
*   **Server-side (Node.js):** Use Node.js's built-in profilers or third-party tools to analyze CPU and memory usage. WebSocket traffic can be monitored using network tools.

### Deployment (Conceptual)

*   **Client:** Build the client for production using `npm run client-build`. The output will be in the `dist` folder, which can then be served by any static file server (e.g., Nginx, Apache, or directly by the Node.js Express server).
*   **Server:** Deploy the Node.js server to a cloud platform (e.g., Heroku, AWS EC2, DigitalOcean Droplet) and ensure port 3000 (or your chosen port) is open and accessible.
