You are a senior 3D web game developer.

Build a COMPLETE playable 3D browser game using:

* Three.js
* Vanilla JavaScript

---

# 🎮 GAME CONCEPT

Create a 3D endless runner based on a GRID system with real depth.

The player dodges obstacles coming from the front.

---

# 🧠 CORE SYSTEM

Use a 3D grid:

* X: 3 lanes → -1, 0, 1
* Y: 3 levels → -1, 0, 1
* Z: depth → enemies move toward camera

---

# ✈️ PLAYER

* Represented as a simple geometry (box or cone)
* Fixed near camera
* Moves only in X and Y grid positions

Movement:

* Snap between positions
* No smooth analog movement required

---

# 👾 OBSTACLES

* Spawn at far Z (e.g. z = -50)
* Move toward player (increase Z toward 0)

Example:
z = -50 → -40 → -30 → ... → 0

* Spawn randomly in (x, y)

---

# 💥 COLLISION

If:

* obstacle.z >= player.z
  AND
* obstacle.x == player.x
  AND
* obstacle.y == player.y

→ GAME OVER

---

# 🎥 CAMERA (VERY IMPORTANT)

* Perspective camera
* Positioned behind player
* Looking forward

This MUST create the effect:
→ obstacles coming FROM THE FRONT

---

# 🌍 SCENE

* Dark background
* Simple lighting
* Optional grid or floor for reference

---

# 🎨 STYLE

* Low poly
* Minimal geometry
* No heavy textures

---

# 📱 CONTROLS

* Keyboard + mobile buttons
* LEFT / RIGHT / UP / DOWN

---

# 🧮 GAME LOOP

* Use requestAnimationFrame
* Update:

  * obstacle positions
  * collision detection

---

# 🚫 CONSTRAINTS

* No external frameworks besides Three.js
* Keep code readable
* Focus on gameplay, not complexity

---

# 🎯 OUTPUT

Return:

* Full working code
* Ready to run in browser
* Clean structure

Focus on:
REAL 3D DEPTH + GRID SYSTEM + CLEAN GAMEPLAY