# D-Day Experience — Web (Three.js) Prototype

This is a browser-based D-Day beach prototype built with Three.js. It's procedural (no external models required), includes player movement, enemies, boats, bunkers, water, simple animation system, visual gun FX (muzzle flash, shell ejection, bullet impacts), and rudimentary ragdoll (physics replacement).

How to run:
- Open `index.html` in a modern browser (Chrome/Edge/Firefox). For best results host with a static server or use GitHub Pages.
- Controls: WASD to move, mouse to look, left click to fire, R reload, T toggle 1st/3rd person.

No audio included (per request). The `assets/fx/.placeholder` file exists so folders are preserved.

Files of interest:
- `src/` — main source files (main.js, terrain.js, player.js, npc.js, etc.)
- `index.html` — web entry point
