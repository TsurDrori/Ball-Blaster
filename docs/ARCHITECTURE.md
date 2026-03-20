# Ball Blast — ארכיטקטורה וסטאק טכנולוגי

## החלטה: HTML5 + JavaScript Canvas

**ללא התקנות.** פותחים `game/index.html` בדפדפן — המשחק רץ מיד.

### למה HTML5/Canvas?

1. **אפס התקנות** — כל Mac כבר מגיע עם Safari/Chrome
2. **הרצה מיידית** — לחיצה כפולה על `index.html` וזהו
3. **פיתוח מהיר** — עורך טקסט + רענון דפדפן, ללא build step
4. **Canvas 2D API** — מספיק חזק לארקייד 60fps
5. **localStorage** — שמירת שיא מובנית בדפדפן

---

## מבנה קבצי הפרויקט

```
/Users/tsur/projects/משחק-של-כל-המשפחה/
├── START_HERE.md
├── docs/
├── assets/
│   ├── images/ (cannon, balls, backgrounds, ui, effects)
│   ├── sounds/
│   └── fonts/
└── game/                    ← כל קוד המשחק כאן
    ├── index.html           ← פתח זה בדפדפן להרצה
    ├── style.css
    ├── game.js              ← Game loop ראשי
    ├── cannon.js            ← מחלקת Cannon
    ├── bullet.js            ← מחלקת Bullet
    ├── enemy.js             ← מחלקת EnemyBall
    ├── coin.js              ← מחלקת Coin
    ├── waveManager.js       ← ניהול גלים
    ├── gameState.js         ← מצב משחק גלובלי
    └── ui.js                ← HUD + מסכים
```

---

## Game Loop

```javascript
// requestAnimationFrame — 60fps אוטומטי
function gameLoop(timestamp) {
    const delta = (timestamp - lastTime) / 1000; // שניות
    lastTime = timestamp;

    update(delta);   // עדכון לוגיקה
    render();        // ציור על Canvas

    requestAnimationFrame(gameLoop);
}

function update(delta) {
    cannon.update(delta);          // עדכון תותח
    bullets.forEach(b => b.update(delta));
    enemies.forEach(e => e.update(delta));
    coins.forEach(c => c.update(delta));

    checkCollisions();             // גילוי נגיעות
    waveManager.update(delta);     // ספוון אויבים
    cleanupDead();                 // מחיקת מתים
}
```

---

## מערכת ההתנגשויות (ידנית)

### Bullet ↔ EnemyBall — עיגול-עיגול
```javascript
function circleCollides(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy) < a.radius + b.radius;
}
// בנגיעה: enemy.hp -= bullet.damage → bullet.dead = true
// אם enemy.hp <= 0 → spawnCoins(enemy) → enemy.dead = true
```

### EnemyBall ↔ קירות — קפיצה אלסטית
```javascript
// קיר שמאל/ימין
if (ball.x - ball.radius < 0)           ball.vx = Math.abs(ball.vx);
if (ball.x + ball.radius > CANVAS_W)    ball.vx = -Math.abs(ball.vx);
// תחתית → Game Over
if (ball.y + ball.radius > CANVAS_H)    triggerGameOver();
```

### Coin ↔ Cannon — רדיוס איסוף
```javascript
if (circleCollides(coin, cannon.collector)) {
    gameState.coins += coin.value;
    coin.dead = true;
}
```

---

## מחלקות ותכונות

### Cannon
```javascript
class Cannon {
    x, y           // מיקום (y קבוע בתחתית)
    fireRate        // ms בין יריות
    damage          // נזק לפגיעה
    bulletCount     // כדורים לכל מחזור (multi-shot)
    spreadAngle     // זווית פן
    bulletRadius    // גודל קליע
    bulletSpeed     // מהירות קליע (px/s)
}
```

### EnemyBall
```javascript
class EnemyBall {
    x, y, vx, vy   // מיקום ומהירות
    radius          // גודל (גדל עם maxHp)
    maxHp, hp       // HP
    coinValue       // מטבעות בהריגה
    color           // לפי טווח HP
}
```

### WaveManager
```javascript
class WaveManager {
    wave            // גל נוכחי
    getEnemyHp()    // Math.floor(10 * Math.pow(wave, 1.5))
    getEnemySpeed() // 50 + wave * 5
    spawnInterval   // ms בין ספוונים
}
```

---

## HUD ו-UI

מצויר ישירות על Canvas עם `ctx.fillText` / `ctx.fillRect`:

```
┌─────────────────────────────┐
│  🪙 1,234        Wave 7     │  ← שורת מידע עליונה
│                             │
│    [כדורים יורדים]          │
│                             │
│         [תותח]              │
├─────────────────────────────┤
│ [Fire Rate $50] [Power $80] │  ← כפתורי שדרוג
└─────────────────────────────┘
```

כפתורי שדרוג: `<button>` HTML רגיל מתחת ל-Canvas (פשוט יותר מציור ידני).

---

## דרישות מערכת

- macOS כלשהו עם דפדפן (Safari / Chrome / Firefox)
- אין שום דבר נוסף

## הרצה

```
לחץ פעמיים על: game/index.html
```
