---
name: Game economy and difficulty design
description: Ball game economy formulas, sawtooth difficulty system, and analysis tools
type: project
---

Game economy was redesigned based on industry research (Vampire Survivors, Brotato, Hades, Kongregate idle game math).

**Key formulas:**
- Enemy HP: `wave²` with sawtooth modifier (7-wave cycles: ramp→relief→spike)
- Upgrade cost: `base × level × 2^level` (exponential — cheap L1, very expensive L9)
- Damage capped at 10 (max DPS = 2,800)
- Learning phase: waves 1-5 have 0.3-0.5× HP modifier

**Sawtooth system (waveManager.js):**
- 7-wave cycles starting from wave 6
- Position 3 = relief (1.5× enemies, 0.5× HP, fast spawns)
- Position 6 = spike (0.5× enemies, 1.5× HP, slow spawns)
- Relief modifier decreases over cycles, spike modifier increases

**Analysis tool:** `python3 tools/economy_matrix.py` (--brief, --waves N)

**Why:** Player asked for challenging progression that gets harder over time, with achievable first purchases (wave 1-2) per industry best practices.

**How to apply:** Run the economy matrix tool after any balance change. Verify first upgrade is affordable by wave 2, DPS maxes around wave 50-60, and on_screen count rises monotonically in late game.
