#!/usr/bin/env python3
"""
Full economy matrix for the ball game.
Correct metric: enemies simultaneously on screen = time_to_kill / spawn_interval
"""
import math

# ═══════════════════════════════════════════════════════════════════════
# GAME FORMULAS (from JS source)
# ═══════════════════════════════════════════════════════════════════════

def enemy_count(wave):     return 5 + math.floor(wave * 1.6)
def enemy_hp(wave):        return max(1, math.floor(wave ** 2.0))
def enemy_speed(wave):     return min(100, 18 + wave * 2.5)
def spawn_interval(wave):  return max(0.45, 1.4 - wave * 0.04)
def coin_value(hp):        return max(1, math.ceil(math.sqrt(hp)))

# Upgrade costs
BASES = {'fireRate': 80, 'damage': 150, 'multiShot': 200, 'ballSize': 60, 'lives': 100}
EXP = 2.2

def upgrade_cost(t, lvl):
    return math.floor(BASES[t] * (lvl ** EXP))

def cumul_cost(t, fr, to):
    return sum(upgrade_cost(t, l) for l in range(fr, to))

# Player DPS
def fire_interval(fr): return max(0.025, 0.16 - (fr - 1) * 0.015)
def shots_sec(fr):     return 1.0 / fire_interval(fr)
def bullets(ms):       return min(7, ms)
def dps(fr, dmg, ms):  return shots_sec(fr) * dmg * bullets(ms)

# ═══════════════════════════════════════════════════════════════════════
# SIMULATION: player progresses, buys upgrades greedily, track real metrics
# ═══════════════════════════════════════════════════════════════════════

COLLECT_RATE = 0.75  # assume 75% coin collection

def best_buy(coins, fr, dmg, ms):
    opts = []
    if fr < 10:
        c = upgrade_cost('fireRate', fr)
        if coins >= c:
            opts.append(('fr', c, dps(fr+1,dmg,ms) - dps(fr,dmg,ms)))
    c = upgrade_cost('damage', dmg)
    if coins >= c:
        opts.append(('dmg', c, dps(fr,dmg+1,ms) - dps(fr,dmg,ms)))
    if ms < 7:
        c = upgrade_cost('multiShot', ms)
        if coins >= c:
            opts.append(('ms', c, dps(fr,dmg,ms+1) - dps(fr,dmg,ms)))
    if not opts: return None, 0
    return max(opts, key=lambda x: x[2]/x[1] if x[1]>0 else 0)[:2]

print("=" * 140)
print("FULL ECONOMY MATRIX — enemies on screen is the real difficulty metric")
print("  Enemies on screen = time_to_kill_one / spawn_interval")
print("  Sweet spot: 3-8 enemies on screen. >12 = nearly impossible to dodge.")
print("=" * 140)
print(f"{'Wave':>5} | {'Enemies':>4} | {'HP':>7} | {'spn_int':>7} | "
      f"{'fr':>2}/{'dm':>2}/{'ms':>2} | {'DPS':>8} | {'kill_time':>9} | "
      f"{'on_screen':>9} | {'coins/wave':>10} | {'total$':>8} | "
      f"{'wave_dur':>8} | {'can_clear':>9} | {'Status':>8}")
print("-" * 140)

total_coins = 0
fr_l, dm_l, ms_l = 1, 1, 1

for w in range(1, 101):
    cnt = enemy_count(w)
    hp = enemy_hp(w)
    cv = coin_value(hp)
    cpw = cnt * cv
    earned = math.floor(cpw * COLLECT_RATE)
    total_coins += earned

    # Buy upgrades
    bought = True
    while bought:
        bought = False
        t, cost = best_buy(total_coins, fr_l, dm_l, ms_l)
        if t:
            total_coins -= cost
            if t == 'fr':  fr_l += 1
            elif t == 'dmg': dm_l += 1
            elif t == 'ms':  ms_l += 1
            bought = True

    d = dps(fr_l, dm_l, ms_l)
    si = spawn_interval(w)
    kill_time = hp / d if d > 0 else 999
    on_screen = kill_time / si  # avg simultaneous enemies
    wave_duration = cnt * si    # seconds to spawn all enemies
    total_dmg_possible = d * (wave_duration + 10)  # +10s for bouncing enemies remaining
    total_hp_wave = cnt * hp
    can_clear = total_dmg_possible >= total_hp_wave

    if on_screen <= 4:      status = "EASY"
    elif on_screen <= 8:    status = "GOOD"
    elif on_screen <= 12:   status = "HARD"
    elif on_screen <= 18:   status = "V.HARD"
    else:                   status = "IMPOS"

    if w <= 30 or w % 5 == 0:
        print(f"{w:>5} | {cnt:>4} | {hp:>7,} | {si:>6.2f}s | "
              f"{fr_l:>2}/{dm_l:>2}/{ms_l:>2} | {d:>8,.1f} | {kill_time:>8.2f}s | "
              f"{on_screen:>9.1f} | {cpw:>10,} | {total_coins:>8,} | "
              f"{wave_duration:>7.1f}s | {'YES' if can_clear else 'NO':>9} | {status:>8}")


# ═══════════════════════════════════════════════════════════════════════
# UPGRADE COST TABLE — concise
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("UPGRADE COST TABLE (base * level^2.2)")
print("=" * 80)
print(f"{'Level':>6} | {'fireRate(80)':>12} | {'damage(150)':>12} | {'multiShot(200)':>14} | {'lives(100)':>12}")
print("-" * 64)
for lvl in range(1, 11):
    c = {t: upgrade_cost(t, lvl) for t in ['fireRate','damage','multiShot','lives']}
    print(f"  {lvl:>2}→{lvl+1:<2} | {c['fireRate']:>12,} | {c['damage']:>12,} | {c['multiShot']:>14,} | {c['lives']:>12,}")
print(f"{'TOTAL':>6} | {cumul_cost('fireRate',1,11):>12,} | {cumul_cost('damage',1,11):>12,} | {cumul_cost('multiShot',1,11):>14,} | {cumul_cost('lives',1,11):>12,}")


# ═══════════════════════════════════════════════════════════════════════
# COIN INCOME — cumulative over sessions
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("CUMULATIVE COIN INCOME (75% collection rate)")
print("=" * 80)
cum = 0
print(f"{'Waves':>12} | {'Coins this range':>16} | {'Cumulative':>12}")
print("-" * 48)
for start in range(1, 101, 10):
    end = min(start + 9, 100)
    chunk = 0
    for ww in range(start, end + 1):
        chunk += math.floor(enemy_count(ww) * coin_value(enemy_hp(ww)) * COLLECT_RATE)
    cum += chunk
    print(f"  {start:>3}–{end:<3}   | {chunk:>16,} | {cum:>12,}")


# ═══════════════════════════════════════════════════════════════════════
# DIAGNOSIS
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print("DIAGNOSIS")
print("=" * 80)
print("""
PROBLEM: Enemy HP = wave² grows much faster than DPS can scale.

  Wave 10:  HP=100,   DPS at that point ~28   → kill_time=3.6s → 3.6 on screen → OK
  Wave 20:  HP=400,   DPS ~78                 → kill_time=5.1s → 8.5 on screen → HARD
  Wave 30:  HP=900,   DPS ~188                → kill_time=4.8s → 10.6 on screen → HARD/VHARD
  Wave 50:  HP=2500,  DPS ~900                → still hard
  Wave 100: HP=10000, DPS ~4480               → IMPOSSIBLE

  The HP formula (wave²) creates a QUADRATIC difficulty curve that outpaces
  any linear upgrade system. By wave 20, the game is already at the edge.

POSSIBLE FIXES:
  A) Change enemy HP to linear:  HP = wave * K  (e.g. K=8)
  B) Change enemy HP to wave^1.5 (sub-quadratic)
  C) Increase upgrade power (make DPS scale faster)
  D) Combination: weaker HP + slower upgrades + more enemy variety
""")

# ═══════════════════════════════════════════════════════════════════════
# WHAT-IF: HP = wave * 8 (linear)
# ═══════════════════════════════════════════════════════════════════════
print("=" * 140)
print("WHAT-IF SCENARIO: HP = wave * 8 (linear) — same upgrade costs")
print("=" * 140)
print(f"{'Wave':>5} | {'HP':>7} | {'fr':>2}/{'dm':>2}/{'ms':>2} | {'DPS':>8} | {'kill_time':>9} | "
      f"{'on_screen':>9} | {'coins/wave':>10} | {'total$':>8} | {'Status':>8}")
print("-" * 100)

total_coins2 = 0
fr2, dm2, ms2 = 1, 1, 1
for w in range(1, 101):
    hp_lin = max(1, w * 8)
    cnt = enemy_count(w)
    cv = max(1, math.ceil(math.sqrt(hp_lin)))
    cpw = cnt * cv
    earned = math.floor(cpw * COLLECT_RATE)
    total_coins2 += earned

    bought = True
    while bought:
        bought = False
        t, cost = best_buy(total_coins2, fr2, dm2, ms2)
        if t:
            total_coins2 -= cost
            if t == 'fr': fr2 += 1
            elif t == 'dmg': dm2 += 1
            elif t == 'ms': ms2 += 1
            bought = True

    d = dps(fr2, dm2, ms2)
    si = spawn_interval(w)
    kt = hp_lin / d if d > 0 else 999
    ons = kt / si

    if ons <= 4:    st = "EASY"
    elif ons <= 8:  st = "GOOD"
    elif ons <= 12: st = "HARD"
    elif ons <= 18: st = "V.HARD"
    else:           st = "IMPOS"

    if w <= 30 or w % 5 == 0:
        print(f"{w:>5} | {hp_lin:>7,} | {fr2:>2}/{dm2:>2}/{ms2:>2} | {d:>8,.1f} | {kt:>8.2f}s | "
              f"{ons:>9.1f} | {cpw:>10,} | {total_coins2:>8,} | {st:>8}")


# ═══════════════════════════════════════════════════════════════════════
# WHAT-IF: HP = wave^1.5
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 140)
print("WHAT-IF SCENARIO: HP = wave^1.5 (sub-quadratic) — same upgrade costs")
print("=" * 140)
print(f"{'Wave':>5} | {'HP':>7} | {'fr':>2}/{'dm':>2}/{'ms':>2} | {'DPS':>8} | {'kill_time':>9} | "
      f"{'on_screen':>9} | {'coins/wave':>10} | {'total$':>8} | {'Status':>8}")
print("-" * 100)

total_coins3 = 0
fr3, dm3, ms3 = 1, 1, 1
for w in range(1, 101):
    hp15 = max(1, math.floor(w ** 1.5))
    cnt = enemy_count(w)
    cv = max(1, math.ceil(math.sqrt(hp15)))
    cpw = cnt * cv
    earned = math.floor(cpw * COLLECT_RATE)
    total_coins3 += earned

    bought = True
    while bought:
        bought = False
        t, cost = best_buy(total_coins3, fr3, dm3, ms3)
        if t:
            total_coins3 -= cost
            if t == 'fr': fr3 += 1
            elif t == 'dmg': dm3 += 1
            elif t == 'ms': ms3 += 1
            bought = True

    d = dps(fr3, dm3, ms3)
    si = spawn_interval(w)
    kt = hp15 / d if d > 0 else 999
    ons = kt / si

    if ons <= 4:    st = "EASY"
    elif ons <= 8:  st = "GOOD"
    elif ons <= 12: st = "HARD"
    elif ons <= 18: st = "V.HARD"
    else:           st = "IMPOS"

    if w <= 30 or w % 5 == 0:
        print(f"{w:>5} | {hp15:>7,} | {fr3:>2}/{dm3:>2}/{ms3:>2} | {d:>8,.1f} | {kt:>8.2f}s | "
              f"{ons:>9.1f} | {cpw:>10,} | {total_coins3:>8,} | {st:>8}")
