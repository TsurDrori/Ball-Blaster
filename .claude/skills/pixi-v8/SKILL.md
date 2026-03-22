---
name: pixi-v8
description: Use this skill for ALL PixiJS code in this project. Trigger whenever writing, editing, or reviewing any PixiJS code. This project uses PixiJS v8 — the API changed significantly from v7. Trigger on: any mention of PixiJS, Sprite, Container, Graphics, Application, Texture, ParticleContainer, Ticker, Assets, filters, or any pixi.js import. DO NOT use v7 patterns — they will produce broken code.
---

# PixiJS v8 Reference

This project uses **PixiJS v8**. The v8 API changed significantly from v7. Always use v8 patterns.

## Installation & Import

```bash
npm install pixi.js   # single package — no sub-packages like @pixi/app
```

```ts
import { Application, Sprite, Container, Graphics, Texture, Assets, Ticker } from 'pixi.js';
```

## Application Setup (ASYNC — required)

```ts
const app = new Application();
// MUST await init() — this is NOT optional in v8
await app.init({
  width: 800,
  height: 600,
  backgroundColor: 0x1a1a2e,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas); // was app.view in v7 — now app.canvas
```

### Init options for games
```ts
await app.init({
  resizeTo: window,          // auto-resize to window
  backgroundColor: 0x000000,
  antialias: false,          // disable for pixel art
  powerPreference: 'high-performance',
  hello: true,               // logs renderer info (useful for debugging)
});
```

## Scene Graph

```ts
// All display objects extend Container
const scene = new Container();
app.stage.addChild(scene);

// Sprites
const sprite = new Sprite(texture);
sprite.anchor.set(0.5);       // center pivot
sprite.position.set(400, 300);
sprite.scale.set(2);
sprite.rotation = Math.PI / 4;
sprite.alpha = 0.8;
sprite.tint = 0xff0000;       // red tint
scene.addChild(sprite);

// IMPORTANT: In v8, only Container accepts children.
// Sprite, Mesh, and Graphics can NO LONGER have children.
// Wrap in a Container if you need to group with a sprite.
const group = new Container();
group.addChild(sprite);
group.addChild(anotherSprite); // correct
// sprite.addChild(child);    // BROKEN in v8
```

## Assets Loading

```ts
import { Assets, Sprite } from 'pixi.js';

// Single asset
const texture = await Assets.load('assets/images/player.png');
const sprite = new Sprite(texture);

// Multiple assets in parallel
const textures = await Assets.load([
  'assets/images/enemy.png',
  'assets/images/bullet.png',
]);

// With aliases (recommended for games)
await Assets.load([
  { alias: 'player', src: 'assets/images/player.png' },
  { alias: 'enemy',  src: 'assets/images/enemy.png' },
  { alias: 'coin',   src: 'assets/images/coin.png' },
]);
const playerTex = Assets.get('player');

// Spritesheet
const sheet = await Assets.load('assets/spritesheet.json');
const frameTexture = sheet.textures['frame_01.png'];

// With progress callback
Assets.load(manifest, (progress) => console.log(`Loading: ${Math.round(progress * 100)}%`));
```

## Graphics API (completely rewritten in v8)

**v8 draws THEN fills** — opposite of v7 which filled THEN drew.

```ts
import { Graphics } from 'pixi.js';

const g = new Graphics();

// RECTANGLE
g.rect(x, y, width, height).fill(0xff0000);
g.rect(x, y, width, height).stroke({ color: 0xffffff, width: 2 });

// CIRCLE
g.circle(cx, cy, radius).fill({ color: 0x00ff00, alpha: 0.8 });

// ROUNDED RECT
g.roundRect(x, y, w, h, cornerRadius).fill(0x3333ff);

// POLYGON
g.poly([x1,y1, x2,y2, x3,y3]).fill(0xffff00).stroke({ color: 0x000000, width: 1 });

// LINE
g.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: 0xffffff, width: 3 });

// MULTIPLE SHAPES in one Graphics object
g.rect(0, 0, 100, 100).fill(0xff0000)
 .circle(50, 50, 30).fill(0xffffff)
 .circle(50, 50, 20).fill(0x000000);

// HOLE using .cut()
g.rect(0, 0, 100, 100).fill(0xff0000)
 .rect(25, 25, 50, 50).cut();   // removes a rectangular hole

// GraphicsContext for reuse (performance optimization)
import { GraphicsContext } from 'pixi.js';
const ctx = new GraphicsContext();
ctx.circle(0, 0, 10).fill(0xffffff);
// Reuse the same context across many Graphics instances
const g1 = new Graphics(ctx);
const g2 = new Graphics(ctx);
```

### v7 → v8 Graphics cheat sheet
| v7 | v8 |
|---|---|
| `beginFill(color)` + `drawRect()` + `endFill()` | `rect().fill(color)` |
| `drawRect(x,y,w,h)` | `rect(x,y,w,h)` |
| `drawCircle(x,y,r)` | `circle(x,y,r)` |
| `drawRoundedRect(x,y,w,h,r)` | `roundRect(x,y,w,h,r)` |
| `drawPolygon([...])` | `poly([...])` |
| `lineStyle(w, color)` | `.stroke({ color, width })` |
| `beginHole()` / `endHole()` | `.cut()` |

## Particle Container (high-performance particles)

```ts
import { ParticleContainer, Particle, Assets } from 'pixi.js';

const texture = await Assets.load('assets/particle.png');

const container = new ParticleContainer({
  dynamicProperties: {
    x: true,        // updated every frame
    y: true,
    rotation: true,
    scaleX: true,
    scaleY: true,
    color: true,    // includes alpha
  },
});
app.stage.addChild(container);

// Particle objects — NOT Sprites
const particle = new Particle({
  texture,
  x: 100,
  y: 100,
  scaleX: 1,
  scaleY: 1,
  anchorX: 0.5,
  anchorY: 0.5,
  rotation: 0,
  color: 0xffffffff,   // RGBA packed — alpha in high byte
});

container.addParticle(particle);
container.removeParticle(particle);
container.removeParticleAt(0);

// Update in game loop
app.ticker.add(() => {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.scaleX *= 0.98;
    p.scaleY *= 0.98;
  }
  // If using static properties, call update() to push to GPU
  // container.update();
});
```

## Ticker (game loop)

```ts
import { Ticker, UPDATE_PRIORITY } from 'pixi.js';

// Using app.ticker
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;       // delta in frames (60fps = 1.0)
  const dtMS = ticker.deltaMS;       // delta in milliseconds
  const elapsed = ticker.elapsedMS;  // total elapsed ms

  // game update here
  player.x += speed * dt;
});

// Priority (higher runs first)
app.ticker.add(updatePhysics, null, UPDATE_PRIORITY.HIGH);   // 50
app.ticker.add(updateGame,    null, UPDATE_PRIORITY.NORMAL); // 0
app.ticker.add(updateUI,      null, UPDATE_PRIORITY.LOW);    // -50

// Cap FPS
app.ticker.maxFPS = 60;
app.ticker.minFPS = 30;

// Run once
app.ticker.addOnce(() => console.log('first frame'));

// Remove listener
const handler = (ticker) => { ... };
app.ticker.add(handler);
app.ticker.remove(handler);
```

## Events / Interaction

```ts
sprite.interactive = true;          // enable pointer events
sprite.cursor = 'pointer';

sprite.on('pointerdown', (event) => {
  const { x, y } = event.global;   // global screen position
  const local = sprite.toLocal(event.global); // local coords
});

sprite.on('pointerover', () => { sprite.tint = 0xaaaaaa; });
sprite.on('pointerout',  () => { sprite.tint = 0xffffff; });

// Disable events on container's children (performance)
container.interactiveChildren = false;
```

## Filters

```ts
import { BlurFilter, ColorMatrixFilter } from 'pixi.js';

// Blur
const blur = new BlurFilter({ strength: 8 });
sprite.filters = [blur];

// Color matrix (grayscale, brightness, etc.)
const matrix = new ColorMatrixFilter();
matrix.grayscale(0.5, false);
matrix.brightness(1.2, false);
sprite.filters = [matrix];

// Remove filters
sprite.filters = null;
```

## Text

```ts
import { Text, TextStyle, BitmapText } from 'pixi.js';

// Canvas text (high quality, slow to update — use for static labels)
const style = new TextStyle({
  fontFamily: 'Arial',
  fontSize: 36,
  fill: 0xffffff,
  stroke: { color: 0x000000, width: 4 },
  dropShadow: { color: 0x000000, blur: 4, angle: Math.PI / 6, distance: 6 },
});
const text = new Text({ text: 'Score: 0', style });
app.stage.addChild(text);

// Update text content
text.text = `Score: ${score}`;   // triggers re-render

// BitmapText (fast updates — use for score counters, timers)
await Assets.load('assets/fonts/score-font.fnt');
const bitmapText = new BitmapText({ text: '0', style: { fontFamily: 'ScoreFont', fontSize: 48 } });
```

## Containers as Layers

```ts
// Layer-based rendering
const bgLayer     = new Container();
const gameLayer   = new Container();
const uiLayer     = new Container();
const fxLayer     = new Container();

app.stage.addChild(bgLayer);
app.stage.addChild(gameLayer);
app.stage.addChild(fxLayer);
app.stage.addChild(uiLayer);  // UI always on top

// Render groups (v8 feature — mini scene graphs, very high performance)
import { RenderGroup } from 'pixi.js';
const hudGroup = new Container();
hudGroup.enableRenderGroup();
app.stage.addChild(hudGroup);
```

## Texture Management

```ts
// Create texture from canvas
import { Texture, CanvasSource } from 'pixi.js';
const canvas = document.createElement('canvas');
const source = new CanvasSource({ resource: canvas });
const texture = new Texture({ source });

// Destroy textures when done
texture.destroy(true);  // true = also destroy the source

// Generate texture from DisplayObject
const renderTexture = RenderTexture.create({ width: 100, height: 100 });
app.renderer.render({ container: sprite, target: renderTexture });
```

## Performance Tips

- Use **spritesheets** — pack all sprites into one atlas to minimize texture swaps
- Use **ParticleContainer** for 100+ similar objects (bullets, particles, coins)
- Use **BitmapText** for any text that changes frequently (score, timer)
- Set `interactiveChildren = false` on containers that don't need events
- Avoid **Graphics** that change every frame — use sprites or swap GraphicsContexts instead
- **Batch**: objects with the same texture and blend mode are batched automatically
- Convert complex **static** Graphics to textures: `app.renderer.generateTexture(graphics)`
- Use `container.cacheAsTexture(true)` for complex static subtrees (was `cacheAsBitmap` in v7)
- Avoid animating layout properties via CSS — use PixiJS transforms

## v7 → v8 Quick Reference

| v7 | v8 |
|---|---|
| `app.view` | `app.canvas` |
| `new Application({ ...opts })` | `await app.init({ ...opts })` |
| `BaseTexture` | `TextureSource` (ImageSource, CanvasSource, etc.) |
| `container.cacheAsBitmap` | `container.cacheAsTexture()` |
| `container.name` | `container.label` |
| `NineSlicePlane` | `NineSliceSprite` |
| `SCALE_MODES.LINEAR` | `'linear'` (string) |
| `ticker callback receives delta` | `ticker callback receives Ticker instance; use ticker.deltaTime` |
| `getBounds()` returns Rectangle | `getBounds()` returns Bounds; use `.rectangle` |
| `Assets.add('key', 'url')` | `Assets.add({ alias: 'key', src: 'url' })` |
| `sprite.addChild(child)` | Only Container accepts children in v8 |

## Official Docs

- Full docs: https://pixijs.com/8.x/guides/
- v8 migration: https://pixijs.com/8.x/guides/migrations/v8.md
- API reference: https://pixijs.download/release/docs/index.html
- llms-full.txt: https://pixijs.com/llms-full.txt
