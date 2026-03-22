---
name: gsap
description: Use this skill for ALL animation and tweening code in this project. This project uses GSAP (GreenSock Animation Platform v3) for UI animations, game-feel tweens, screen shake, squash/stretch, and any time-based value interpolation. Trigger on: any mention of GSAP, tween, animation, easing, timeline, ScrollTrigger, screen shake, squash, stretch, bounce, elastic, lerp animation, or "animate X to Y". All GSAP plugins are now FREE following Webflow's acquisition.
---

# GSAP v3 Reference

This project uses **GSAP 3** for animations. All plugins (ScrollTrigger, Physics2DPlugin, CustomEase, Flip, SplitText, etc.) are **free** as of 2024.

## Installation

```bash
npm install gsap
```

```js
import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { CustomEase }      from 'gsap/CustomEase';
import { Flip }            from 'gsap/Flip';

gsap.registerPlugin(Physics2DPlugin, CustomEase, Flip);
```

## Core Tweens

```js
// gsap.to — animate FROM current value TO target
gsap.to(target, { x: 200, y: 100, duration: 0.5, ease: 'power2.out' });

// gsap.from — animate FROM values TO current
gsap.from(target, { alpha: 0, y: -30, duration: 0.3, ease: 'back.out(1.7)' });

// gsap.fromTo — explicit start and end
gsap.fromTo(target,
  { scaleX: 1.3, scaleY: 0.7 },       // from (squash on landing)
  { scaleX: 1,   scaleY: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' }
);

// gsap.set — instant (no tween)
gsap.set(target, { x: 0, y: 0, alpha: 1 });
```

## Easing — Game Feel Reference

Choose easing based on what feels right for the action:

```js
// ARRIVALS — things coming in, settling, landing
'power2.out'          // smooth deceleration — default for most UI
'power3.out'          // stronger deceleration
'back.out(1.7)'       // slight overshoot — buttons appearing, popups
'elastic.out(1, 0.5)' // springy overshoot — health bar fill, score popup
'bounce.out'          // literal bounce — objects landing, coins dropping

// DEPARTURES — things leaving, launching
'power2.in'           // accelerates out — objects being thrown
'power3.in'           // stronger acceleration
'back.in(1.7)'        // slight windup before leaving (anticipation)

// BOTH — camera pans, character movement
'power2.inOut'
'sine.inOut'          // smooth, natural

// SPECIAL
'linear'              // constant speed — progress bars, health drain
'steps(6)'            // frame-by-frame — pixel art feel
```

Reference: https://gsap.com/ease-visualizer — try eases visually

## Timelines — Sequence Animations

```js
const tl = gsap.timeline();

// Sequential
tl.to(element, { y: -20, duration: 0.1 })          // jump anticipation
  .to(element, { y: 0,  duration: 0.3, ease: 'bounce.out' }) // land
  .to(element, { scaleX: 1.2, scaleY: 0.8, duration: 0.1 })   // squash
  .to(element, { scaleX: 1,   scaleY: 1,   duration: 0.15, ease: 'elastic.out(1, 0.4)' }); // recover

// With overlap (negative position offset)
tl.to(a, { x: 100, duration: 0.5 })
  .to(b, { x: 100, duration: 0.5 }, '-=0.3');  // starts 0.3s before prev ends

// Absolute time position
tl.to(c, { alpha: 1, duration: 0.3 }, 1.0);  // start at t=1.0s

// Labels
tl.addLabel('impact', 0.4)
  .to(damage, { alpha: 1 }, 'impact')
  .to(screen, { x: 5 },     'impact+=0.05');

// Control
tl.pause();
tl.resume();
tl.reverse();
tl.seek(0.5);     // jump to time
tl.progress(0.5); // jump to 50%
tl.kill();        // stop and destroy
```

## Game-Feel Patterns

### Screen shake

```js
function screenShake(container, intensity = 8, duration = 0.3) {
  const startX = container.x;
  const startY = container.y;

  gsap.killTweensOf(container); // stop any existing shake

  const tl = gsap.timeline({
    onComplete: () => gsap.set(container, { x: startX, y: startY }),
  });

  const steps = Math.round(duration * 60);
  for (let i = 0; i < steps; i++) {
    const decay = 1 - i / steps;
    tl.to(container, {
      x: startX + (Math.random() * 2 - 1) * intensity * decay,
      y: startY + (Math.random() * 2 - 1) * intensity * decay,
      duration: 1 / 60,
      ease: 'none',
    });
  }
}
```

### Squash & stretch

```js
// On landing / impact
function squashLand(sprite) {
  gsap.fromTo(sprite,
    { scaleX: 1.3, scaleY: 0.7 },
    { scaleX: 1,   scaleY: 1, duration: 0.25, ease: 'elastic.out(1, 0.5)' }
  );
}

// On launch / jump
function stretchLaunch(sprite) {
  gsap.fromTo(sprite,
    { scaleX: 0.8, scaleY: 1.3 },
    { scaleX: 1,   scaleY: 1, duration: 0.2, ease: 'power2.out' }
  );
}
```

### Hit flash

```js
function hitFlash(sprite, color = 0xff0000) {
  const original = sprite.tint;
  gsap.timeline()
    .set(sprite, { tint: color })
    .to(sprite, { duration: 0.08 })   // hold
    .set(sprite, { tint: original });
}
```

### Damage float number

```js
function damageFloater(container, value, x, y) {
  const text = new Text({ text: `-${value}`, style: { fill: 0xff4444, fontSize: 24 } });
  text.position.set(x, y);
  text.anchor.set(0.5);
  container.addChild(text);

  gsap.timeline({ onComplete: () => text.destroy() })
    .from(text, { y: y + 10, alpha: 0, scale: 1.5, duration: 0.15, ease: 'power2.out' })
    .to(text,   { y: y - 40, alpha: 0, duration: 0.6, ease: 'power1.in', delay: 0.2 });
}
```

### Popup / panel entrance

```js
function showPanel(panel) {
  gsap.from(panel, {
    scale: 0.8,
    alpha: 0,
    y: '+=20',
    duration: 0.35,
    ease: 'back.out(1.7)',
  });
}

function hidePanel(panel, onDone) {
  gsap.to(panel, {
    scale: 0.9,
    alpha: 0,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: onDone,
  });
}
```

### Button hover/press

```js
button.on('pointerover',  () => gsap.to(button, { scale: 1.08, duration: 0.12, ease: 'power1.out' }));
button.on('pointerout',   () => gsap.to(button, { scale: 1.0,  duration: 0.15, ease: 'power1.out' }));
button.on('pointerdown',  () => gsap.to(button, { scale: 0.94, duration: 0.08, ease: 'power2.in' }));
button.on('pointerup',    () => gsap.to(button, { scale: 1.08, duration: 0.15, ease: 'elastic.out(1, 0.4)' }));
```

### Score counter

```js
function animateScore(scoreText, fromValue, toValue) {
  const obj = { value: fromValue };
  gsap.to(obj, {
    value: toValue,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => {
      scoreText.text = Math.round(obj.value).toLocaleString();
    },
  });
  // Pulse the text
  gsap.fromTo(scoreText, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' });
}
```

## Physics2DPlugin (gravity, velocity-based motion)

```js
gsap.registerPlugin(Physics2DPlugin);

// Throw an object with gravity
gsap.to(particle, {
  physics2D: {
    velocity: 300,      // initial speed px/s
    angle: -75,         // direction in degrees (0 = right, -90 = up)
    gravity: 600,       // downward pull px/s²
    friction: 0.05,     // damping per second
  },
  duration: 2,
  onComplete: () => particle.destroy(),
});

// Explosion of debris
function explode(container, x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const piece = new Sprite(debrisTex);
    piece.position.set(x, y);
    piece.anchor.set(0.5);
    container.addChild(piece);

    gsap.to(piece, {
      physics2D: {
        velocity: 150 + Math.random() * 200,
        angle: (360 / count) * i + Math.random() * 30,
        gravity: 400,
      },
      alpha: 0,
      duration: 0.8 + Math.random() * 0.4,
      ease: 'none',
      onComplete: () => piece.destroy(),
    });
  }
}
```

## CustomEase

```js
gsap.registerPlugin(CustomEase);

// Create a custom easing curve using SVG path notation
CustomEase.create('weaponRecoil', 'M0,0 C0.14,0 0.27,0.03 0.4,1 0.55,1 0.65,0.95 0.75,0.9 0.9,0.85 1,1 1,1');

gsap.to(cannon, { rotation: -0.3, duration: 0.05, ease: 'weaponRecoil',
  onComplete: () => gsap.to(cannon, { rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' })
});
```

## GSAP + PixiJS Integration

```js
// GSAP works on any object with numeric properties
// Animate PixiJS Container directly
gsap.to(sprite, { x: 400, y: 300, rotation: Math.PI, duration: 1, ease: 'power3.inOut' });
gsap.to(container, { alpha: 0, duration: 0.5 });

// PixiJS-specific: animate pixi Point
gsap.to(sprite.position, { x: 300, y: 200, duration: 0.5 });
gsap.to(sprite.scale,    { x: 2,   y: 2,   duration: 0.3, ease: 'back.out(1.7)' });

// Sync GSAP with PixiJS ticker (instead of requestAnimationFrame)
import { Ticker } from 'pixi.js';
gsap.ticker.remove(gsap.updateRoot);
app.ticker.add(() => gsap.updateRoot(performance.now() / 1000));
```

## Memory Management — Critical for SPA/games

Always clean up GSAP animations to prevent memory leaks:

```js
// Kill tweens on a specific target
gsap.killTweensOf(sprite);

// Kill all tweens
gsap.globalTimeline.clear();

// Use gsap.context() to scope and clean up together
const ctx = gsap.context(() => {
  gsap.to(sprite, { x: 100 });
  gsap.timeline().to(sprite, { y: 200 });
});
// Later, when this scene is destroyed:
ctx.revert();   // kills all tweens created in this context
```

## Accessibility

```js
// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0);  // pause all animations
} else {
  gsap.globalTimeline.timeScale(1);
}
```

## Performance Tips

- Only animate GPU-accelerated properties: `x`, `y`, `rotation`, `scaleX`, `scaleY`, `alpha`
- Avoid animating: `width`, `height`, `margin`, `padding` — these cause layout recalculation
- Use `gsap.set()` for instant changes — no tween overhead
- Use `will-change: transform` on CSS elements you animate heavily
- `gsap.killTweensOf(target)` before re-animating the same target avoids conflicts
- For 100+ simultaneous tweens, consider `gsap.quickTo()` for repeated rapid updates

## Official Resources

- Docs: https://gsap.com/docs/v3/
- Ease visualizer: https://gsap.com/ease-visualizer/
- Physics2DPlugin: https://gsap.com/docs/v3/Plugins/Physics2DPlugin/
- CustomEase: https://gsap.com/docs/v3/Plugins/CustomEase/
- All plugins free: https://gsap.com/blog/free-gsap/
