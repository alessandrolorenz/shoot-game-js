# 🎮 Grid Airplane Game

A complete, playable 3D endless runner game built with Three.js and vanilla JavaScript.

![Game Preview](https://img.shields.io/badge/Status-Complete-success)
![Three.js](https://img.shields.io/badge/Three.js-0.158.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## 🎯 Game Overview

Dodge obstacles coming from the front in this fast-paced 3D grid-based runner! Navigate through three lanes and three levels while the difficulty progressively increases. How long can you survive?

## ✨ Features

### Core Gameplay
- **3D Grid System**: 3x3 grid (3 lanes × 3 levels × depth)
- **Dynamic Obstacles**: Enemies spawn at distance and move toward the player
- **Collision Detection**: Precise grid-based collision system
- **Progressive Difficulty**: Speed increases 8% and spawn rate increases 5% every 10 seconds
- **Score System**: Time-based scoring with persistent high score tracking

### Visual & Audio
- **3D Models**: Player aircraft, enemy planes, and tank models
- **Geometric Fallbacks**: Automatic fallback to simple shapes if models fail to load
- **Visual Effects**: Fog, shadows, grid helpers, and lane markers
- **Responsive Design**: Adapts to all screen sizes

### Controls
- **Keyboard**: Arrow Keys or WASD for movement
- **Mobile**: Touch-friendly directional buttons
- **Responsive**: Controls adapt based on device

### UI/UX
- **Start Screen**: Clean menu with control instructions
- **HUD**: Real-time score and high score display
- **Game Over Screen**: Final score with new high score indicator
- **Loading Screen**: Asset loading indicator

## 🚀 How to Run

### Option 1: Local HTTP Server (Recommended - Loads 3D Models)

The game requires an HTTP server to load the 3D models due to browser CORS restrictions.

#### Using Python (Built-in):
```bash
# Navigate to the game directory
cd path/to/Teste_Game

# Start the server
python -m http.server 8000

# Open in browser
# Visit: http://localhost:8000/index.html
```

#### Using Node.js (http-server):
```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to the game directory
cd path/to/Teste_Game

# Start the server
http-server -p 8000

# Open in browser
# Visit: http://localhost:8000/index.html
```

#### Using VS Code Live Server:
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 2: Direct File Open (Geometric Shapes Only)

You can open `index.html` directly in a browser, but 3D models won't load due to CORS. The game will use geometric fallback shapes (cone for player, boxes for enemies).

```bash
# Simply open the file
# Double-click index.html or drag it into your browser
```

## 🎮 How to Play

1. **Start**: Click "START GAME" or press Space/Enter
2. **Move**: Use Arrow Keys or WASD to navigate the grid
   - ⬅️ Left: Move to left lane
   - ➡️ Right: Move to right lane
   - ⬆️ Up: Move to upper level
   - ⬇️ Down: Move to lower level
3. **Dodge**: Avoid obstacles coming from the front
4. **Survive**: The longer you survive, the higher your score!
5. **Restart**: Press Space/Enter or click "PLAY AGAIN" after game over

## 📁 Project Structure

```
Teste_Game/
├── index.html          # Main game file (complete single-file game)
├── README.md           # This file
└── models/             # 3D model assets
    ├── player.glb      # Player aircraft model
    ├── enemy.glb       # Enemy plane model
    └── tank.glb        # Tank obstacle model
```

## 🛠️ Technical Details

### Technologies Used
- **Three.js 0.158.0**: 3D graphics library
- **Vanilla JavaScript**: ES6+ features
- **HTML5**: Semantic markup
- **CSS3**: Responsive design with animations

### Architecture
- **GameState Class**: Manages game state, scoring, and difficulty
- **GridRunnerGame Class**: Main game logic and rendering
- **Modular Design**: Clean separation of concerns
- **Event-Driven**: Responsive input handling

### Performance Optimizations
- Object pooling for obstacles (max 20 active)
- Efficient collision detection (only checks near obstacles)
- Automatic geometry/material disposal
- RequestAnimationFrame with delta time
- Optimized rendering pipeline

### Browser Compatibility
- Modern browsers with ES6+ support
- WebGL-enabled browsers
- Import maps support (Chrome 89+, Firefox 108+, Safari 16.4+)

## 🎯 Game Mechanics

### Grid System
- **X-axis**: 3 lanes (left, center, right)
- **Y-axis**: 3 levels (bottom, middle, top)
- **Z-axis**: Depth (obstacles move from -50 to +5)

### Scoring
- Base: 10 points per second survived
- Increases with time
- High score saved in localStorage

### Difficulty Progression
- Every 10 seconds:
  - Speed increases by 8%
  - Spawn interval decreases by 5%
- Maximum of 20 obstacles on screen

### Collision Detection
```javascript
if (obstacle.z >= -1.5 && obstacle.z <= 1.5) {
  if (playerX === obstacle.gridX && playerY === obstacle.gridY) {
    // GAME OVER!
  }
}
```

## 🐛 Troubleshooting

### Models Not Loading?
**Problem**: 3D models show as simple shapes (cone/boxes)

**Solution**: Run the game through an HTTP server (see "How to Run" section above). Opening the file directly (`file://`) triggers CORS restrictions.

### Game Not Starting?
**Problem**: Black screen or loading forever

**Solution**: 
1. Check browser console for errors (F12)
2. Ensure you're using a modern browser
3. Try clearing browser cache
4. Verify Three.js CDN is accessible

### Performance Issues?
**Problem**: Low FPS or stuttering

**Solution**:
1. Close other browser tabs
2. Update graphics drivers
3. Try a different browser
4. Reduce browser zoom level

## 📝 Development Notes

### Code Quality
- ✅ Clean, readable code with comments
- ✅ Modular class-based architecture
- ✅ Error handling and fallbacks
- ✅ Responsive design patterns
- ✅ Best practices followed

### Future Enhancements (Optional)
- [ ] Sound effects and background music
- [ ] Power-ups and bonuses
- [ ] Multiple difficulty levels
- [ ] Leaderboard system
- [ ] Particle effects for collisions
- [ ] More obstacle types
- [ ] Mobile gyroscope controls

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Credits

- **Three.js**: 3D graphics library
- **3D Models**: GLB format models in `/models` directory
- **Game Design**: Grid-based endless runner concept

---

**Enjoy the game! 🎮**

For issues or questions, please check the troubleshooting section above.