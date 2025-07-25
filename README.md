# 🦙💥 Laser Llama Rampage

**A wild 3D browser-based shooter where llamas meet lasers!**

Battle hordes of goblins and towering trolls in a low-poly world with explosive action and synthetic soundscapes.

## 🎮 Play Now

**Live Game**: [Coming Soon - Deploying to Netlify]

## 🎯 Game Features

- **First-Person 3D Action**: Fast-paced FPS gameplay in your browser
- **Low-Poly Aesthetics**: Beautiful minimalist 3D graphics
- **Procedural Audio**: All sounds generated in real-time using Web Audio API
- **Dynamic Enemies**: Smart goblins and massive trolls with unique behaviors
- **Environmental Combat**: Battle across a procedurally arranged world
- **No Downloads**: Pure browser-based gameplay

## 🕹️ Controls

| Action | Controls |
|--------|----------|
| **Move** | `WASD` |
| **Look Around** | `Mouse` |
| **Shoot Laser** | `SPACE` or `Left Click` |
| **Jump** | `SHIFT` |
| **Toggle Music** | `M` |

*Click anywhere to start playing and enable mouse controls*

## 🛠️ Technical Stack

- **Engine**: Three.js r128
- **Audio**: Web Audio API (synthetic sound generation)
- **Graphics**: WebGL with low-poly shading
- **Architecture**: Single-file game engine design
- **Deployment**: Netlify with optimized caching

## 🚀 Development

### Local Development
```bash
# Option 1: Python server
python -m http.server 8000

# Option 2: Node server
npx serve .

# Then open: http://localhost:8000
```

### Project Structure
```
├── index.html          # Game entry point
├── game.js            # Core game engine (~1400 lines)
├── style.css          # UI and HUD styling
├── netlify.toml       # Deployment configuration
└── CLAUDE.md          # Development documentation
```

### Key Game Systems
- **Entity Management**: Global arrays for goblins, trolls, projectiles
- **Physics**: Custom gravity and collision detection
- **AI**: Vector-based pathfinding for enemy movement
- **Audio**: Procedural sound synthesis (no external files)
- **Rendering**: Real-time 3D with camera shake and visual effects

## 🎨 Game Design

**Theme**: Absurd llama-themed combat in a surreal low-poly world

**Enemies**:
- **Goblins**: Fast, numerous, shoot projectiles
- **Trolls**: Massive, slow, devastating attacks
- **Health Packs**: Scattered throughout the world

**Visual Style**: Flat-shaded low-poly geometry with vibrant colors and fog effects

## 📈 Performance

- **Zero Build Process**: Direct browser execution
- **Optimized Assets**: All resources generated at runtime
- **Responsive Design**: Adapts to different screen sizes
- **Progressive Enhancement**: Graceful audio fallbacks

## 🔧 Deployment

### Netlify (Recommended)
```bash
netlify deploy --prod --dir .
```

### Manual Deployment
Simply upload all files to any static hosting service.

## 🎵 Audio Features

All sounds are procedurally generated using Web Audio API:
- Laser sound effects with frequency modulation
- Ambient background music loops
- Enemy movement and impact sounds
- Real-time audio mixing and volume control

## 🏆 Game Balance

Difficulty scales naturally:
- Health: 100 HP with regenerating health packs
- Enemies spawn in increasing waves
- Score tracking for competitive play
- Infinite ammo for continuous action

## 🤝 Contributing

This is a fun experimental project! Feel free to:
- Report bugs or suggest features
- Fork and create your own llama variations
- Improve the AI or add new enemy types
- Enhance the procedural audio system

## 📄 License

Open source - feel free to learn from, modify, and share!

---

**Built with ❤️ and a sense of humor**

*Why llamas? Why not! 🦙*