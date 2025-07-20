# Game Architecture Diagram

```mermaid
graph TD
    subgraph Client (Browser)
        direction LR
        Input[Input.ts <br> Mouse/Touch Controls] --> GameClient[Game.ts <br> Main Client Logic]
        Renderer[Renderer.ts <br> Main Client Rendering] -- Renders --> GameClient
        Audio[Audio.ts <br> Positional Sound] -- Plays --> GameClient
        GameClient -- Sends Input --> NetClient[Net.ts <br> WebSocket Client]
    end

    subgraph Server (Node.js)
        direction LR
        NetServer[server/src/index.js <br> WebSocket Server] -- Receives Input --> GameServer[server/src/Game.js <br> Authoritative Game State]
        GameServer -- Updates --> ServerSnake[server/src/Snake.js <br> Server-side Snake Logic]
        GameServer -- Updates --> ServerBoundary[server/src/Boundary.js <br> Server-side Shrinking Zone]
        GameServer -- Updates --> ServerPowerUp[server/src/PowerUp.js <br> Server-side Spawning/Effects]
    end

    NetClient -- B-Directional --> NetServer

    subgraph Shared (Client-side)
        direction LR
        Constants[src/shared/Constants.ts]
        Types[src/shared/Types.ts]
    end

    GameClient -- Uses --> Shared
    GameServer -- Uses --> Shared