# Plan: Enemy Diversity + Combo System + Run Upgrade Picker

## Context
The game is a polished Ball Blast clone with a well-calibrated economy (sawtooth difficulty, exponential upgrade costs). Economy matrix shows DPS maxes at ~wave 50, then wave² HP scaling creates endless challenge. The game is feature-complete but every run feels identical — same enemy behavior, same upgrades, no in-run decisions.

This plan adds:
1. **4 new enemy subtypes** — tactical variety without changing the wave HP/count formula
2. **Combo chain system** — coin multiplier for fast kills, rewarding aggressive play
3. **Run upgrade picker** — 3-choice overlay after each spike wave (waves 12, 19, 26...), giving each run strategic identity

## Balance Analysis (from economy_matrix.py)

**Important context:** The matrix models 75% coin collection + optimal upgrades. In practice, players start each session from their high score wave (`startWave = highScore`) with banked-but-not-infinite coins. This means:
- **Waves 1-12**: genuinely easy for returning players (replaying to farm coins)
- **Wave 20+**: genuinely hard in single-run pushes — players fight wave²·HP before DPS is maxed
- **Wave 50+**: DPS is maxed, pure endurance test

Design constraint from this: new enemy types and combos must NOT push waves 10-20 over the edge. They should add variety, not raw difficulty.

- Economy is healthy: EASY → GOOD → HARD progression, first upgrade buyable wave 1-2 ✓
- Sawtooth spike starts getting HARD at wave 75, V.HARD at wave 89 ✓ (matrix model)
- Income boost from new types: +13% from crystal, combo +15-20% only on relief waves (fast chains)
- No formulas in waveManager._hp() / _count() are touched — enemy type is a modifier on top
- Bomb AoE is HELPFUL (clears nearby enemies) not harmful — benefits player in hard waves 10-20
- Splitter: total HP to clear is 1.67× but fragmented — easier per kill, more coins — net positive
- Fast: dies quickly, fewer coins, adds reflex pressure without HP bloat — difficulty neutral

---

## Part 0 — Upgrade Cost Rebalance

**Problem:** Players start at their `highScore` wave, earning only coins from that wave onward.
At wall waves (11, 15), income per death is ~181–326 coins, but upgrades in the 300–800 range require 2–4 deaths per level. The grind is too punishing.

**Fix:** Apply a flat 30% discount to any upgrade costing ≥ 300. Sub-300 costs are unchanged.

### gameState.js — upgradeCost() change
```javascript
upgradeCost(type) {
    const level = this.upgrades[type];
    const raw = Math.floor({
        fireRate:  3,
        damage:    5,
        multiShot: 8,
        ballSize:  3,
        lives:     6,
    }[type] * level * Math.pow(2, level));
    return raw >= 300 ? Math.floor(raw * 0.7) : raw;
},
```

### Resulting cost table (changed values in bold)

| Upgrade | L1 | L2 | L3 | L4 | L5 | L6 |
|---------|----|----|----|----|----|----|
| fireRate | 6 | 24 | 72 | 192 | ~~480~~ **336** | ~~1152~~ **806** |
| damage | 10 | 40 | 120 | ~~320~~ **224** | ~~800~~ **560** | ~~1920~~ **1344** |
| multiShot | 16 | 64 | 192 | ~~512~~ **358** | ~~1280~~ **896** | ~~3072~~ **2150** |
| lives | 12 | 48 | 144 | ~~384~~ **269** | ~~960~~ **672** | ~~2304~~ **1613** |

### Impact on wall waves

| Wall | Upgrade | New cost | Income/death | Deaths needed (was → now) |
|------|---------|---------|-------------|--------------------------|
| Wave 11 | damage L4 | 224 | ~181 | 2 → **1** |
| Wave 11 | multiShot L4 | 358 | ~181 | 3 → **2** |
| Wave 15 | fireRate L5 | 336 | ~326 | 2 → **1** |
| Wave 15 | lives L4 | 269 | ~326 | 2 → **1** |
| Wave 15 | damage L5 | 560 | ~326 | 3 → **2** |

### economy_matrix.py — upgrade_cost() change
```python
def upgrade_cost(t, lvl):
    raw = math.floor(UP_BASES[t] * lvl * (2 ** lvl))
    return math.floor(raw * 0.7) if raw >= 300 else raw
```

---

## Files to Modify

| File | Change |
|------|--------|
| `game/gameState.js` | upgradeCost() — apply 0.7× multiplier when raw cost ≥ 300 |
| `tools/economy_matrix.py` | upgrade_cost() — same fix to keep matrix in sync |
| `game/enemy.js` | Add `type` param + type-specific color/behavior/onDeath() |
| `game/waveManager.js` | Add `_chooseType()`, pass type to EnemyBall, add `spikeWaveCleared` flag |
| `game/game.js` | Handle onDeath() actions, combo tracking, picker state |
| `game/gameState.js` | Add `runUpgrades[]`, `comboCount`, `comboTimer` to session state |
| `game/ui.js` | Add `drawRunUpgradePicker(options)` function |
| `game/bullet.js` | Support `bouncy` run upgrade (wall bounce) |
| `game/cannon.js` | Apply run upgrade effects (magnetic radius, rapid fire) |

---

## Part 1 — Enemy Types

### New Types (all added via `type` property on EnemyBall)

| Type | HP | Speed | Color | Special |
|------|-----|-------|-------|---------|
| `normal` | as-is | as-is | existing color tiers | unchanged |
| `crystal` | as-is | as-is | cyan `#00BCD4` | 2× coinValue, sparkle on death |
| `bomb` | as-is | as-is | deep orange with dark core | onDeath → AoE 120px, dmg = ceil(maxHp × 0.25), capped at 50% target HP |
| `splitter` | as-is | as-is | lime-green border outline | onDeath → spawn 2 children: hp=floor(maxHp/3), speed×1.2, type='normal'. Only if maxHp >= 6 |
| `fast` | hp × 0.25 | vy × 2.5, smaller radius | grey-white `#B0BEC5` | no special death behavior |

### enemy.js changes

```
constructor(x, hp, speed, type = 'normal')
  - if type === 'fast': hp = Math.floor(hp * 0.25), radius × 0.75, vy × 2.5
  - this.type = type
  - this.coinValue: crystal gets × 2, fast gets base formula
  - _updateColor() → override baseColor/lightColor for crystal/bomb/fast
  - add _typeIcon(): crystal='💎', bomb='💣', splitter='✂️', fast='⚡'
  - draw(): small icon in top-left of ball (12px font)

add onDeath() → returns action object or null:
  'crystal'  → null  (coin value already 2×)
  'bomb'     → { action: 'aoe', x, y, radius: 120, damage: Math.ceil(this.maxHp * 0.25) }
  'splitter' → { action: 'split', children: [EnemyBall(x-20, floor(hp/3), speed*1.2), EnemyBall(x+20, ...)] }  only if maxHp >= 6
  'fast'     → null
  'normal'   → null
```

### waveManager.js changes

```
add _chooseType():
  if wave < 6: return 'normal'
  roll = Math.random()
  if roll < 0.65:                                        return 'normal'
  if roll < 0.78: return wave >= 6  ? 'crystal'        : 'normal'
  if roll < 0.88: return wave >= 10 ? 'bomb'           : 'crystal'
  if roll < 0.95: return wave >= 15 ? 'splitter'       : 'crystal'
                  return wave >= 8  ? 'fast'            : 'normal'

update(): change spawn line to:
  return new EnemyBall(x, this._hp(), this._speed(), this._chooseType())

add field:  spikeWaveCleared = false

_nextWave():
  this.spikeWaveCleared = (this._waveType() === 'spike')  // BEFORE incrementing wave
  this.wave++
  ... existing code ...
  this.waveDelay = this.spikeWaveCleared ? 0 : 1.8  // picker controls delay on spike waves
```

### game.js changes — handling onDeath()

```
on enemy kill (where e.dead is detected):
  const action = e.onDeath();
  if (action?.action === 'aoe') {
      for (const other of enemies) {
          if (other !== e && dist(other, action) < action.radius) {
              const dmg = Math.min(action.damage, Math.ceil(other.hp * 0.5));
              other.hit(dmg);
              fxHit(other.x, other.y);  // reuse existing
          }
      }
      sound.explode();
  }
  if (action?.action === 'split') {
      for (const child of action.children) enemies.push(child);
  }
```

---

## Part 2 — Combo Chain System

### State (game.js local vars, reset on game start)

```javascript
let comboCount = 0;
let comboTimer = 0;
```

### Logic (game.js update())

```
each frame:
  if (comboTimer > 0) { comboTimer -= delta; }
  else { comboCount = 0; }

on enemy kill (before spawnCoins):
  comboCount++;
  comboTimer = 2.0;   // 2-second window to continue chain

  const mult = comboCount >= 6 ? 2.0
             : comboCount >= 3 ? 1.5
             : 1.0;
  // pass mult into spawnCoins so each coin particle has boosted value

  if (comboCount >= 3) {
      fxFloatingText(CANVAS_W/2, CANVAS_H * 0.45, `COMBO ×${comboCount}!`, '#FFD700');
      // reuse existing floating text from effects.js
  }
```

### Balance

- Relief waves (swarms): combos likely → +30-50% coins on relief waves only
- Spike waves (few tanks): combos rare (2s window, slow kills)
- Net income increase: ~+15% average — does not break economy curve
- Multiplier applies to coins only, never to damage

---

## Part 3 — Run Upgrade Picker

### When it triggers

After each SPIKE wave clears (`waveManager.spikeWaveCleared` is true):
- First offer: after wave 12 (first spike)
- Then: waves 19, 26, 33, 40, 47, 54, 61... (every 7 waves)

### Run upgrade pool (8 upgrades, Hebrew UI)

```javascript
const RUN_UPGRADE_POOL = [
  { id: 'magnetic',     icon: '🧲', name: 'מגנט מטבעות',   desc: 'רדיוס איסוף מטבעות כפול' },
  { id: 'gold_rush',    icon: '💰', name: 'בונוס זהב',      desc: 'ערך כל המטבעות ×1.5' },
  { id: 'bouncy',       icon: '🎱', name: 'כדורים קופצים',  desc: 'כדורים מקפיצים מהקירות' },
  { id: 'rapid',        icon: '⚡', name: 'ירי מהיר',        desc: '+25% קצב ירי' },
  { id: 'pierce',       icon: '🏹', name: 'כדורים חודרים',  desc: 'כל כדור חודר אויב נוסף' },
  { id: 'shield_up',    icon: '🛡️', name: 'מגן חזק',        desc: 'מגן נמשך 20 שניות' },
  { id: 'double_heart', icon: '💝', name: 'לב כפול',         desc: 'פיק לב נותן 2 חיים' },
  { id: 'marked',       icon: '🎯', name: 'אויב מסומן',      desc: 'פגיעה ראשונה: נזק כפול ל-3 שניות' },
];
```

Picker picks 3 random from pool, excluding upgrades already active this run.

### gameState.js additions

```javascript
// in session state:
runUpgrades: [],

// helper:
hasRunUpgrade(id) { return this.runUpgrades.includes(id); },

// in startNewGame():
this.runUpgrades = [];
```

### game.js picker state

```javascript
let upgradePickOptions = [];  // empty = no picker; 3 items = show picker

// After checking waveManager.spikeWaveCleared:
if (waveManager.spikeWaveCleared) {
    waveManager.spikeWaveCleared = false;
    upgradePickOptions = pickUpgradeOptions(3);
    // waveDelay is already 0 — picker controls when next wave starts
}

// In update(): if upgradePickOptions.length > 0, skip all entity updates (game paused)
// In draw():   if upgradePickOptions.length > 0, call ui.drawRunUpgradePicker()
// On click/tap: if picker open, check card hitboxes, apply chosen upgrade,
//               clear upgradePickOptions, set waveManager.waveDelay = 1.8
```

### Applying run upgrade effects

| Upgrade | File | How applied |
|---------|------|-------------|
| `magnetic` | cannon.js | collectRadius = `gameState.hasRunUpgrade('magnetic') ? 170 : 85` |
| `gold_rush` | game.js spawnCoins | coinValue × 1.5 |
| `bouncy` | bullet.js update() | on wall exit: reverse vx, set `this.bounced = true` (only once) |
| `rapid` | cannon.js fireInterval | multiply by 0.75 (−25%) if upgrade active |
| `pierce` | game.js collision | normal bullets: `maxPierce = hasRunUpgrade('pierce') ? 2 : 1` |
| `shield_up` | game.js powerup collect | `shieldTimer = hasRunUpgrade('shield_up') ? 20 : 8` |
| `double_heart` | game.js powerup collect | `lives += hasRunUpgrade('double_heart') ? 2 : 1` |
| `marked` | game.js bullet hit | first hit sets `e.marked=true, e.markTimer=3.0`; while marked, `dmg×2` |

### ui.js — drawRunUpgradePicker(ctx, options)

```
Layout:
  - Full-canvas semi-transparent overlay: rgba(0,0,0,0.78)
  - Title "בחר שדרוג לריצה!" centered, 22px bold, white, y=180
  - 3 cards laid out horizontally, centered, each ~130px wide × 170px tall
  - Card contents (top to bottom):
      icon emoji (40px)        y+30
      name bold 15px           y+80
      desc grey 12px wrap      y+110
  - Card bg: #1a1a2e, border: glow color per card (random from palette)
  - Highlighted card (mouse hover): slightly brighter bg, stronger glow
  - Store card rects for click detection

pickUpgradeOptions(n):
  pool = RUN_UPGRADE_POOL.filter(u => !gameState.runUpgrades.includes(u.id))
  shuffle pool, return first n (or fill with repeats if pool < n)
```

---

## Implementation Order

1. `game/gameState.js` — add `runUpgrades`, `hasRunUpgrade()`, reset in `startNewGame()`
2. `game/enemy.js` — add `type` param, color overrides, `_typeIcon()`, `onDeath()`
3. `game/waveManager.js` — add `_chooseType()`, `spikeWaveCleared` flag, `waveDelay` change
4. `game/game.js` — handle `onDeath()` (bomb AoE + splitter), combo vars, picker state + click handling
5. `game/ui.js` — add `drawRunUpgradePicker()` + `pickUpgradeOptions()`
6. `game/bullet.js` — add wall-bounce for `bouncy` upgrade
7. `game/cannon.js` — apply `magnetic` (collectRadius) and `rapid` (fireInterval)
8. Run `python3 tools/economy_matrix.py --brief` and verify numbers stay in expected ranges

---

## Verification Checklist

- [ ] `economy_matrix.py --brief` shows no regression in difficulty curve
- [ ] Crystal balls appear (cyan, 💎 icon), drop 2× coins on death
- [ ] Bomb ball AoE triggers on death, damages nearby enemies (verify with low-HP neighbors)
- [ ] Splitter spawns 2 smaller balls on death (visible children with correct HP)
- [ ] Fast balls visibly faster, die quickly, smaller radius
- [ ] Kill 3 enemies within 2s → "COMBO ×3!" floating text appears in gold
- [ ] Kill 6 enemies within 2s → "COMBO ×6!" and coins are 2× value
- [ ] Survive wave 12 → picker overlay appears after wave clears
- [ ] Clicking a card applies the upgrade (test magnetic: coins pull from further away)
- [ ] Wave 13 starts after card is chosen (waveDelay 1.8s kicks in)
- [ ] Second spike wave (wave 19): previously chosen upgrade is not in the pool again
- [ ] All 8 upgrades have correct Hebrew text and work as described
