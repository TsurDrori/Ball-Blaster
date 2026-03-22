---
name: rapier-2d
description: Use this skill for ALL physics code in this project. This project uses Rapier2D (@dimforge/rapier2d-compat) for physics simulation. Trigger on: any mention of Rapier, physics, rigid body, collider, collision detection, physics world, RAPIER.init, RigidBodyDesc, ColliderDesc, world.step, raycasting, or any @dimforge import. Always use the compat package pattern for vanilla JS/browser projects without bundler WASM support.
---

# Rapier 2D Physics Reference

This project uses **@dimforge/rapier2d-compat** — the browser-compatible WASM build. Use the compat package; it embeds WASM as base64 so it works without special bundler config.

## Installation

```bash
npm install @dimforge/rapier2d-compat
```

## Initialization (always async)

```js
import RAPIER from '@dimforge/rapier2d-compat';

// MUST call init() before anything else
await RAPIER.init();

// Now create the world
const gravity = { x: 0.0, y: 9.81 };   // positive Y = down (screen coords)
const world = new RAPIER.World(gravity);
```

**Note:** Use `y: 9.81` for screen-space gravity (down = positive Y). Use `y: -9.81` for math-space (up = positive Y). Match to your coordinate system.

## Rigid Bodies

Four types:

```js
// DYNAMIC — responds to forces and collisions (enemies, balls, projectiles)
const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(x, y)
  .setLinvel(0, 0)           // initial velocity
  .setGravityScale(1.0)      // 0 = ignore gravity
  .setLinearDamping(0.1)     // friction-like damping
  .setAngularDamping(0.1);
const body = world.createRigidBody(bodyDesc);

// FIXED — immovable (ground, walls, platforms)
const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 600);
const ground = world.createRigidBody(groundDesc);

// KINEMATIC POSITION-BASED — you set position directly each frame (player controller)
const kinDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(100, 100);
const kinBody = world.createRigidBody(kinDesc);
// Move it:
kinBody.setNextKinematicTranslation({ x: newX, y: newY });

// KINEMATIC VELOCITY-BASED — you set velocity, physics computes position
const velDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased().setTranslation(0, 0);
const velBody = world.createRigidBody(velDesc);
velBody.setLinvel({ x: 5, y: 0 }, true);
```

### Reading position

```js
const pos = body.translation();    // { x, y }
const rot = body.rotation();       // angle in radians
const vel = body.linvel();         // { x, y } linear velocity
const angVel = body.angvel();      // angular velocity (rad/s)

// Sync a PixiJS sprite to physics body
sprite.position.set(pos.x, pos.y);
sprite.rotation = rot;
```

### Applying forces

```js
// Force — continuous, alters acceleration (apply every frame for sustained effect)
body.addForce({ x: 0, y: -500 }, true);       // true = wake up sleeping body

// Impulse — instantaneous, alters velocity (jump, explosion knockback)
body.applyImpulse({ x: 0, y: -300 }, true);

// Torque impulse — spin
body.applyTorqueImpulse(0.5, true);

// Force at a point (causes rotation)
body.addForceAtPoint({ x: 100, y: 0 }, { x: body.translation().x, y: body.translation().y }, true);

// Reset velocity (stop body)
body.setLinvel({ x: 0, y: 0 }, true);
body.setAngvel(0, true);

// Teleport (non-physical — use sparingly)
body.setTranslation({ x: 100, y: 200 }, true);
```

### Body properties

```js
body.setGravityScale(0);       // disable gravity for this body
body.setLinearDamping(0.5);    // air resistance
body.lockRotations(true);      // prevent rotation (common for characters)
body.lockTranslations(false);  // prevent movement
body.setEnabled(false);        // disable physics (invisible/removed)
body.wakeUp();                 // wake sleeping body
body.isSleeping();             // check sleep state

// Dominance — higher group ignores forces from lower group
body.setDominanceGroup(10);
```

## Colliders

Attach to a rigid body to give it a shape:

```js
// BALL (circle)
const ball = RAPIER.ColliderDesc.ball(radius)
  .setRestitution(0.7)          // bounciness 0–1
  .setFriction(0.5)
  .setDensity(1.0);             // affects mass
world.createCollider(ball, body);   // attach to body

// CUBOID (rectangle) — half-extents
const box = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight);
world.createCollider(box, body);

// CAPSULE — for characters
const capsule = RAPIER.ColliderDesc.capsule(halfHeight, radius);
world.createCollider(capsule, body);

// TRIANGLE MESH — complex static shapes
const vertices = new Float32Array([x1,y1, x2,y2, x3,y3, ...]);
const indices  = new Uint32Array([0,1,2, ...]);
const mesh = RAPIER.ColliderDesc.trimesh(vertices, indices);
world.createCollider(mesh, groundBody);

// SENSOR — detects overlap but no physics response (trigger zones, pickups)
const sensor = RAPIER.ColliderDesc.ball(20).setSensor(true);
world.createCollider(sensor, body);
```

### Collision groups (filtering)

```js
// 16-bit membership | 16-bit filter mask — packed into 32-bit
// memberships: which groups this collider belongs to
// filter: which groups this collider collides with
const groups = 0x00010001;  // belongs to group 1, collides with group 1

const playerCollider = RAPIER.ColliderDesc.cuboid(16, 24)
  .setCollisionGroups(0x00010003);  // group 1, collides with groups 1 & 2

const enemyCollider = RAPIER.ColliderDesc.cuboid(16, 24)
  .setCollisionGroups(0x00020003);  // group 2, collides with groups 1 & 2

const wallCollider = RAPIER.ColliderDesc.cuboid(10, 300)
  .setCollisionGroups(0x00040007);  // group 3, collides with groups 1, 2, 3
```

## The Physics Step (game loop)

```js
// In your game loop — step the physics world
app.ticker.add((ticker) => {
  // Use fixed timestep for deterministic physics
  world.timestep = 1 / 60;   // match game framerate
  world.step(eventQueue);    // advance simulation

  // Sync all physics bodies to their sprites
  for (const [body, sprite] of physicsObjects) {
    const pos = body.translation();
    const rot = body.rotation();
    sprite.position.set(pos.x, pos.y);
    sprite.rotation = rot;
  }
});
```

## Collision Events

```js
const eventQueue = new RAPIER.EventQueue(true);

app.ticker.add(() => {
  world.step(eventQueue);

  // Process collision events
  eventQueue.drainCollisionEvents((handle1, handle2, started) => {
    // handle1, handle2 — collider handles (integers)
    const collider1 = world.getCollider(handle1);
    const collider2 = world.getCollider(handle2);

    if (started) {
      // Collision started
      console.log('Collision between', handle1, handle2);
    } else {
      // Collision ended
    }
  });

  // Contact force events (requires enableContactForceEvents on collider)
  eventQueue.drainContactForceEvents((event) => {
    const magnitude = event.totalForceMagnitude();
    if (magnitude > 500) {
      // Heavy impact
    }
  });
});
```

## Scene Queries

### Raycasting

```js
// Ray from point in direction
const ray = new RAPIER.Ray({ x: origin.x, y: origin.y }, { x: dir.x, y: dir.y });
const maxToi = 500;    // max distance
const solid = true;    // if origin is inside shape, register hit at toi=0

const hit = world.castRay(ray, maxToi, solid);
if (hit) {
  const hitPoint = {
    x: ray.origin.x + ray.dir.x * hit.timeOfImpact,
    y: ray.origin.y + ray.dir.y * hit.timeOfImpact,
  };
  const hitCollider = world.getCollider(hit.colliderHandle);
}

// Ray with normal (for reflection, sliding)
const hitWithNormal = world.castRayAndGetNormal(ray, maxToi, solid);
if (hitWithNormal) {
  const normal = hitWithNormal.normal;  // { x, y }
}

// All intersections along ray
world.intersectionsWithRay(ray, maxToi, solid, (hit) => {
  console.log('hit collider', hit.colliderHandle, 'at', hit.timeOfImpact);
  return true;  // continue iteration
});
```

### Point / shape queries

```js
// All colliders at a point
world.intersectionsWithPoint({ x, y }, (colliderHandle) => {
  console.log('point inside collider', colliderHandle);
  return true;
});

// Overlap test with a shape
const shape = new RAPIER.Ball(10);
const shapePos = { x: 100, y: 200 };
const shapeRot = 0;
world.intersectionsWithShape(shapePos, shapeRot, shape, (colliderHandle) => {
  console.log('overlapping:', colliderHandle);
  return true;
});
```

## Debug Rendering (integrate with PixiJS)

```js
import { Graphics } from 'pixi.js';

const debugGraphics = new Graphics();
app.stage.addChild(debugGraphics);

function renderDebug() {
  const { vertices, colors } = world.debugRender();
  debugGraphics.clear();

  for (let i = 0; i < vertices.length / 4; i++) {
    const r = Math.round(colors[i * 8]     * 255);
    const g = Math.round(colors[i * 8 + 1] * 255);
    const b = Math.round(colors[i * 8 + 2] * 255);
    const a = colors[i * 8 + 3];
    const color = (r << 16) | (g << 8) | b;

    debugGraphics
      .moveTo(vertices[i * 4],     vertices[i * 4 + 1])
      .lineTo(vertices[i * 4 + 2], vertices[i * 4 + 3])
      .stroke({ color, width: 1, alpha: a });
  }
}
```

## Cleanup

```js
// Remove a body and its colliders
world.removeRigidBody(body);

// Remove just a collider
world.removeCollider(collider, false);  // false = don't wake nearby bodies

// Free the world (releases WASM memory)
world.free();
```

## Common Game Patterns

### Character controller (compat package)

```js
const character = world.createCharacterController(0.01); // offset = skin width
character.enableSnapToGround(0.5);
character.enableAutostep(0.3, 0.1, true);

// In game loop
const desiredMovement = { x: velocityX * dt, y: velocityY * dt };
character.computeColliderMovement(playerCollider, desiredMovement);
const corrected = character.computedMovement();
const newPos = {
  x: playerBody.translation().x + corrected.x,
  y: playerBody.translation().y + corrected.y,
};
playerBody.setNextKinematicTranslation(newPos);
```

### Object pool for bullets/particles

```js
// Create a pool of fixed bodies — enable/disable instead of create/destroy
const bulletPool = Array.from({ length: 50 }, () => {
  const desc = RAPIER.RigidBodyDesc.dynamic().setGravityScale(0);
  const body = world.createRigidBody(desc);
  const col  = RAPIER.ColliderDesc.ball(4).setSensor(true);
  world.createCollider(col, body);
  body.setEnabled(false);
  return body;
});

function fireBullet(x, y, vx, vy) {
  const bullet = bulletPool.find(b => !b.isEnabled());
  if (!bullet) return;
  bullet.setTranslation({ x, y }, false);
  bullet.setLinvel({ x: vx, y: vy }, false);
  bullet.setEnabled(true);
}
```

## Official Docs

- JavaScript user guide: https://rapier.rs/docs/user_guides/javascript/
- API reference: https://rapier.rs/javascript3d/classes/World.html
- Package: https://www.npmjs.com/package/@dimforge/rapier2d-compat
