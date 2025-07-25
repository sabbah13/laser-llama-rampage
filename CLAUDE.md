# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Laser Llama Rampage** is a browser-based 3D action game built with Three.js. It's a first-person shooter where players battle goblins and trolls in a low-poly environment with synthetic audio and visual effects.

## Development Commands

Since this is a client-side JavaScript game with no build process:

- **Run locally**: Open `index.html` in a browser or use a local server:
  ```bash
  python -m http.server 8000
  # or
  npx serve .
  ```

- **Deploy to Netlify**: 
  ```bash
  netlify deploy --prod --dir .
  ```

- **Push to GitHub**:
  ```bash
  git add . && git commit -m "message" && git push
  ```

## Architecture

### Core Structure
- **index.html**: Entry point with game canvas, UI overlay, and Three.js CDN import
- **game.js**: Main game logic (~1400 lines, single file architecture)
- **style.css**: UI styling for HUD, crosshair, and game instructions
- **netlify.toml**: Deployment configuration with security headers

### Game Engine Architecture (game.js)

The game follows a traditional game loop pattern with these key systems:

**Core Game Loop**:
- `init()` → `animate()` → render loop with `requestAnimationFrame`
- Delta time-based updates for frame-rate independent movement

**Entity Management**:
- Global arrays manage all game objects: `goblins[]`, `trolls[]`, `projectiles[]`, `laserBeams[]`, `healthPacks[]`
- Each entity type has create/update/cleanup functions
- No formal class hierarchy - uses object literals with properties

**Player System**:
- First-person camera with pointer lock controls
- Physics simulation with gravity, jumping, ground collision
- Player object contains mesh, velocity, health, position

**Combat System**:
- Laser shooting with visual beam effects and collision detection
- Enemy AI with pathfinding toward player using `lookAt()` and distance calculations
- Projectile system for enemy attacks with physics simulation

**World Generation**:
- Procedural environment with buildings, trees, cars, mushrooms, stones
- Static geometry placed in `createEnvironment()` during initialization
- Low-poly aesthetic using basic Three.js geometries

**Audio System**:
- Web Audio API for synthetic sound generation
- Procedural audio creation (no external files)
- Background music with toggle functionality
- Sound effects for actions and ambient noise

### Key Technical Patterns

**Collision Detection**: Uses Three.js `Raycaster` for precise hit detection and distance calculations

**Enemy AI**: Simple state machine with walking/attacking states, uses vector math for movement toward player

**Visual Effects**: Camera shake, particle-like laser beams, low-poly materials with flat shading

**Input Handling**: Key state tracking with `keys{}` object, mouse movement via pointer lock API

## Important Constants

Game balance is controlled by constants at the top of `game.js`:
- `GRAVITY = -30`, `JUMP_FORCE = 15`, `MOVE_SPEED = 10`
- `MOUSE_SENSITIVITY = 0.002`
- Enemy spawn rates and health values
- Audio volume levels (`soundVolume = 0.1`, `musicVolume = 0.02`)

## Development Notes

- All game logic is in a single file by design for simplicity
- Uses Three.js r128 from CDN
- No external assets - all audio/visuals are procedurally generated
- Game state is managed through global variables (not modular architecture)
- Pointer lock is required for mouse controls to work properly