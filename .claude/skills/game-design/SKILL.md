---
name: game-design
description: Game balance, economy design, difficulty curves, and fun mechanics. Use when making balance changes, adding enemies, pricing upgrades, adjusting difficulty, or discussing game feel. Trigger on keywords like balance, difficulty, economy, upgrade cost, enemy HP, wave, sawtooth, fun, challenge.
allowed-tools: Read, Grep, Glob, Bash, Agent, Write, Edit
---

# Game Design & Balance Skill

You are a game designer specializing in arcade/survival game balance. Apply these principles when making ANY game balance decision.

## Step 1: Always Run the Analysis Tool First

Before ANY balance change, run the economy matrix to understand current state:

```bash
python3 tools/economy_matrix.py --brief
```

After changes, run it again to verify. The tool shows:
- Wave-by-wave difficulty (on_screen metric)
- Upgrade cost progression
- Sawtooth difficulty curve visualization
- When DPS maxes out

## Step 2: Core Design Principles

### Economy — Upgrade Pricing (from Kongregate, Hades, Vampire Survivors research)

**The Golden Rules:**
1. **First upgrade must be buyable after wave 1-2** (50-100% of first wave income)
2. **Use exponential cost curves** (`base × level × 2^level`) — cheap start, steep end
3. **DPS multipliers (damage, multiShot) should cost more** than utility upgrades
4. **Cap multiplicative stats** (e.g., damage cap=10) to prevent late-game trivialization
5. **Cost-to-income ratio across waves:**
   - Waves 1-10: upgrade costs 50-75% of wave income (buy 1-2 per wave)
   - Waves 10-30: costs 100-200% (save across 1-2 waves)
   - Waves 30-60: costs 200-400% (major decisions)
   - Waves 60+: nothing left to buy, challenge comes from rising enemy HP

**Anti-patterns to avoid:**
- Polynomial cost curves (`level^N`) — too flat early, not steep enough late
- First upgrade costing more than 2 waves of income
- Uncapped multiplicative stats (DPS = fr × dmg × ms breaks any polynomial HP curve)

### Difficulty — Sawtooth Pacing (from flow theory, Csikszentmihalyi, shmup design)

**The Sawtooth System:**
- Use 7-wave cycles: ramp → ramp → ramp → RELIEF → ramp → ramp → SPIKE
- **Relief waves**: many weak enemies, fast spawns → power fantasy, screen clearing satisfaction
- **Spike waves**: few tanky enemies, slow spawns → focus, tension, boss feel
- **Learning phase** (waves 1-5): extra gentle, 0.3-0.5× HP modifier
- Relief gets less relieving over time: `max(0.3, 0.5 - cycle * 0.015)`
- Spike gets spikier over time: `min(2.5, 1.5 + cycle * 0.06)`

**The 85% Rule (Wilson et al.):**
Players should succeed ~85% of the time. If dying more than 15%, add support. If never dying, increase difficulty.

**Tension-Release Cycles:**
- Troughs (relief) are as important as peaks (spikes)
- Without relief, peaks lose emotional impact
- The difficulty should ALWAYS trend upward overall

### Enemy Variety — Archetypes (from Stout, Level Design Book, Brotato)

**Core archetypes for variety (implement as needed):**
1. **Popcorn/Swarm**: 1-5 HP, fast, many — power expression, screen clearing
2. **Standard**: base HP — the default challenge
3. **Tank**: 3-5× HP, slow, large — forces sustained attention, priority targeting
4. **Sprinter**: 0.3× HP, 3× speed — reflex test, not DPS test
5. **Splitter**: splits into 2-3 smaller balls on death — surprise, tactical depth

**Key insight**: The interesting choice is "in what ORDER do I kill them?" — combine archetypes in waves to force decisions.

### Fun & Feel (from shmup and bullet hell design)

**What creates fun:**
- **Kill incentive**: killing fast should be rewarded (cleaner screen, bonus coins)
- **Visible progress**: HP numbers on enemies, color tiers, coin showers
- **Power spikes**: when buying a new upgrade, the NEXT wave should feel easier (relief wave timing)
- **Near-death moments**: the game should occasionally feel barely survivable (spike waves)
- **Screen readability**: enemy types must be visually distinct (size, color, speed)

**What kills fun:**
- Bullet sponges (enemies that take too long to kill without changing behavior)
- Constant peak intensity (no breathing room)
- Feeling that upgrades don't matter (stat inflation without visible impact)
- RNG that feels unfair (deaths should feel earned, not random)

## Step 3: Verification Checklist

After any balance change, verify:

- [ ] First upgrade affordable after wave 1-2?
- [ ] Sawtooth pattern visible in difficulty curve?
- [ ] Relief waves always < 4 enemies on screen?
- [ ] Spikes increase over time? (wave 20 spike < wave 50 spike < wave 80 spike)
- [ ] DPS maxes out before wave 60?
- [ ] After DPS max, difficulty rises forever?
- [ ] Player who dies at wave 3-4 can still buy upgrades?

## Step 4: Current Game Formulas

These are in the JS source — if they change, update `tools/economy_matrix.py` to match:

| Formula | Location | Value |
|---------|----------|-------|
| Enemy HP | `waveManager.js:_hp()` | `wave² × waveMod()` |
| Sawtooth | `waveManager.js:_waveMod()` | 7-wave cycles, learning/relief/spike |
| Upgrade cost | `gameState.js:upgradeCost()` | `base × level × 2^level` |
| Damage cap | `cannon.js:damage` | `min(10, level)` |
| Max DPS | computed | `2,800` (40 shots/s × 10 dmg × 7 bullets) |
| Coin value | `enemy.js` | `ceil(sqrt(HP))` |

## References

Key research sources used to design this system:
- Kongregate "Math of Idle Games" — exponential cost curve standards
- Csikszentmihalyi flow theory — 85% success rate sweet spot
- Vampire Survivors / Brotato — sawtooth pacing, first-purchase timing
- Mike Stout's Trinity system — enemy archetypes
- Boghog's Bullet Hell 101 — screen pressure management
