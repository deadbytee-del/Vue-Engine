<p align="center"><img src="assets/logo.png" width="420" alt="Vue Engine"></p>

# Vue Engine

A 2D and 3D game engine for Windows and the browser. Make games with blocks, event sheets or code.

- **Blocks**: Scratch-style drag and drop blocks
- **Events**: event sheets with rows of When, If and Do, plus groups, sub-events and local variables. Old node graphs keep running and show under a Legacy nodes tab, with a Convert to events button for simple ones
- **Code**: typed TypeScript with live type checking in the editor

All of them compile to the same runtime, so one project can mix them per entity.

## Interface modes

Settings has a Beginner and an Advanced interface mode. New users start in Beginner: Blocks only, with Code, physics tuning, engine core, atmosphere values and extension settings under Show advanced. Advanced shows everything. Switching modes never changes or removes scripts. The Home screen has a short checklist for first-time users.

## Features

- 2D and 3D scenes in one project, switchable per scene
- Shapes: rectangle, rounded rect, circle, pill, triangle, hexagon, star, ring, arrow (2D); box, sphere, capsule, cylinder, cone, torus, plane, pyramid, wedge and stairs (3D). Pills and capsules use exact capsule collisions on the JavaScript core. A scene that contains one runs on that core instead of VWR. The other shapes collide as their bounding box
- Player controller: add it from Add Component. Platformer, top-down 4 and 8 direction, first-person and third-person movement with jump height, double jump, coyote time, jump buffer, dash, camera follow, health and animation hooks. Presets: Platformer, Top-down RPG, Shooter, FPS, Racer-lite. Save your own presets. Scripts can change values with `vue.player.speed = 300`, and `self.makePlayer("FPS")` attaches it. Blocks and Nodes have matching entries
- 3D: Three.js rendering, shadows, lights, orbit camera editor, third-person and first-person cameras, mouse look, 3D collisions
- Project hub with playable templates, recent projects and thumbnails
- Scene editor with move, rotate and scale gizmos, smart guides, snapping, grid, undo and redo
- 3D transform gizmos, axis view cube, orbit and fly camera
- Tilemap painter with brush, rectangle, fill, eraser and picker, plus solid-tile collisions
- Sprite animation editor with sheet slicing, frame timeline and live preview
- Cutscene editor: camera moves, captions, speech, sounds, tweens and events on a timeline
- Parent/child entities in 2D and 3D, with drag-to-parent in the Hierarchy
- Audio sources, music, sound effects with waveform previews
- 140+ blocks covering the whole scripting API, plus lists, text, math and functions
- Command palette (Ctrl+P), resizable panels, filterable console, status bar
- Play inside the editor with pause, step, resolution presets, or in its own window
- Multiple scenes, prefabs and runtime spawning
- Fixed timestep game loop, spatial hash collisions, static, dynamic and trigger bodies
- Camera follow and shake, particles, HUD, sound beeps and audio assets
- Image and audio asset import
- Export any project as a single playable HTML file
- Single portable `VueEngine.exe`, no installer

## Engine cores

Pick a core per project under Project → Engine core. All three give identical physics results.

| Core | What it does |
| --- | --- |
| **VWR** | Vender WASM Rust. C++ collision solver and Rust broadphase linked into one 7 KB WebAssembly module (`vwr/`). Bodies that are exactly at rest are skipped, so settled scenes cost almost nothing. |
| **VWR Steady** | The same WebAssembly core, but every body runs every step, so frame cost stays flat. |
| **JavaScript** | Reference core for comparing results and debugging. |

Measured on 20,000 dynamic and 20,000 static bodies: VWR is about 3.3x faster than JavaScript while everything moves and about 7x faster once a scene settles. Smooth motion (on by default) draws between physics steps so 120 and 144 Hz screens stay fluid. Rebuild VWR with `npm run build:vwr` (needs clang, wasm-ld and Rust with the wasm32 target).

## Extensions

Open Home → Extensions to download features, then switch them on per project. They live in `extensions/` and are fetched from this repository, so new ones ship without a new app build. Each adds a `vue.<name>` API, and the Blocks Extensions category covers the common calls.

Input: Gamepad, Touch. XR: VR (PC VR through OpenXR runtimes and standalone headsets), AR, Hand Tracking. Rendering: PBR, Advanced Shadows, Volumetrics, Post Processing, Motion Blur. Effects: Particle FX. World: Advanced Water, Weather System, Day/Night Cycle, Procedural Terrain, Destructible World, World Streaming. AI: NavMesh & Pathfinding, Behavior Trees, AI Director, Crowd Simulation, Dialogue AI. Audio: Kokoro Voice. Networking: Multiplayer (peer-to-peer WebRTC), Voice Chat.

Run `node tools/build-ext.js` after editing an extension to refresh `extensions/index.json`.

## Porting

The Port button builds your game as:

- a single HTML file
- a web game ZIP (index.html, game.js, assets) for itch.io or GitHub Pages
- an installable web app (PWA) ZIP with manifest, icons and offline cache
- a desktop app folder with its own executable
- a Vue project file for sharing the source

## Controls

| Action | Key |
| --- | --- |
| Play | Ctrl+Enter |
| Port game | Ctrl+E |
| Save | Ctrl+S |
| Undo / Redo | Ctrl+Z / Ctrl+Y |
| Duplicate | Ctrl+D |
| Pan scene | Space + drag, or middle mouse |
| Debug overlay in game | F3 |

## Code API

```ts
export function start(): void {}
export function update(dt: number): void {}
export function collide(other: Entity): void {}
export function click(): void {}
```

Globals: `vue` (input, find, spawn, camera, hud, beep, wait, go) and `self` (the entity).

## Credits

Icons by Lucide (ISC). 3D rendering by three.js (MIT). Blocks by Blockly (Apache 2.0). Code editor by Monaco (MIT). Fonts Inter and JetBrains Mono (OFL).

## Build

```
npm install
npm test
npm start
npm run dist
```

Every push to `main` builds `VueEngine.exe` on GitHub Actions and publishes it as a release.
