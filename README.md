# Vue Engine

A 2D game creation engine for Windows. Build games three ways and run them instantly.

- **Blocks**: Scratch-style drag and drop blocks
- **Nodes**: visual node graphs with execution and data wires
- **Code**: typed TypeScript with live type checking in the editor

All three compile to the same runtime, so one project can mix them per entity.

## Features

- Scene editor with move, resize, snapping, grid, undo and redo
- Multiple scenes, prefabs and runtime spawning
- Fixed timestep game loop, spatial hash collisions, static, dynamic and trigger bodies
- Camera follow and shake, particles, HUD, sound beeps and audio assets
- Image and audio asset import
- Export any project as a single playable HTML file
- Single portable `VueEngine.exe`, no installer

## Controls

| Action | Key |
| --- | --- |
| Play | Ctrl+Enter |
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

## Build

```
npm install
npm test
npm start
npm run dist
```

Every push to `main` builds `VueEngine.exe` on GitHub Actions and publishes it as a release.
