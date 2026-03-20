#!/usr/bin/env python3
"""
Economy & difficulty matrix tool.
Run this any time you change game balance to see the full picture.

Usage:
    python3 tools/economy_matrix.py          # full analysis
    python3 tools/economy_matrix.py --waves 50   # first 50 waves only
    python3 tools/economy_matrix.py --brief      # summary only
"""
import math, sys

# ═══════════════════════════════════════════════════════════════════════
# GAME FORMULAS — keep in sync with JS source files
# ═══════════════════════════════════════════════════════════════════════

# --- waveManager.js ---
def wave_type(w):
    if w <= 5: return 'LEARN'
    pos = (w - 6) % 7
    if pos == 3: return 'RELIEF'
    if pos == 6: return 'SPIKE'
    return ''

def wave_mod(w):
    if w <= 3: return 0.3
    if w <= 5: return 0.5
    cycle = (w - 6) // 7
    pos   = (w - 6) % 7
    if pos == 3: return max(0.3, 0.5 - cycle * 0.015)   # relief
    if pos == 6: return min(2.5, 1.5 + cycle * 0.06)     # spike
    ramps = [0.7, 0.8, 0.9, 0, 0.85, 1.0, 1.15]
    return ramps[pos]

def enemy_count(w):
    base = 5 + math.floor(w * 1.6)
    t = wave_type(w)
    if t == 'RELIEF': return math.floor(base * 1.5)
    if t == 'SPIKE':  return max(3, math.floor(base * 0.5))
    return base

def enemy_hp(w):
    base = max(1, math.floor(w ** 2.0))
    return max(1, math.floor(base * wave_mod(w)))

def enemy_speed(w):
    return min(100, 18 + w * 2.5)

def spawn_interval(w):
    base = max(0.45, 1.4 - w * 0.04)
    t = wave_type(w)
    if t == 'RELIEF': return base * 0.7
    if t == 'SPIKE':  return base * 1.3
    return base

# --- enemy.js ---
def coin_value(hp):
    return max(1, math.ceil(math.sqrt(hp)))

# --- gameState.js ---
# Exponential: base × level × 2^level
UP_BASES = {'fireRate': 3, 'damage': 5, 'multiShot': 8, 'ballSize': 3, 'lives': 6}

def upgrade_cost(t, lvl):
    return math.floor(UP_BASES[t] * lvl * (2 ** lvl))

# --- cannon.js ---
DMG_CAP = 10

def fire_interval(fr): return max(0.025, 0.16 - (fr - 1) * 0.015)
def shots_sec(fr):     return 1.0 / fire_interval(fr)
def bullets(ms):       return min(7, ms)
def dps(fr, dmg, ms):  return shots_sec(fr) * min(DMG_CAP, dmg) * bullets(ms)


# ═══════════════════════════════════════════════════════════════════════
# GREEDY UPGRADE SIMULATOR
# ═══════════════════════════════════════════════════════════════════════
COLLECT_RATE = 0.75

def best_buy(coins, fr, dm, ms):
    opts = []
    if fr < 10:
        c = upgrade_cost('fireRate', fr)
        if coins >= c: opts.append(('fr', c, dps(fr+1,dm,ms)-dps(fr,dm,ms)))
    if dm < DMG_CAP:
        c = upgrade_cost('damage', dm)
        if coins >= c: opts.append(('dm', c, dps(fr,dm+1,ms)-dps(fr,dm,ms)))
    if ms < 7:
        c = upgrade_cost('multiShot', ms)
        if coins >= c: opts.append(('ms', c, dps(fr,dm,ms+1)-dps(fr,dm,ms)))
    if not opts: return None, 0
    return max(opts, key=lambda x: x[2]/x[1] if x[1]>0 else 0)[:2]


# ═══════════════════════════════════════════════════════════════════════
# MAIN OUTPUT
# ═══════════════════════════════════════════════════════════════════════
def status(on_screen):
    if on_screen <= 3:  return "EASY  "
    if on_screen <= 6:  return "GOOD  "
    if on_screen <= 10: return "HARD  "
    if on_screen <= 15: return "V.HARD"
    return "IMPOS "

def main():
    max_waves = 100
    brief = False
    for arg in sys.argv[1:]:
        if arg == '--brief': brief = True
        elif arg.startswith('--waves'):
            max_waves = int(sys.argv[sys.argv.index(arg)+1])

    # ── SECTION 1: Full wave-by-wave matrix ──
    print("=" * 145)
    print("ECONOMY MATRIX — wave-by-wave analysis with sawtooth difficulty")
    print("  on_screen = kill_time / spawn_interval  (avg simultaneous enemies)")
    print("  Sweet spot: EASY(≤3) → GOOD(3-6) → HARD(6-10) → V.HARD(10-15)")
    print("=" * 145)
    print(f"{'Wave':>5} {'Type':>6} | {'Cnt':>4} {'HP':>7} {'mod':>5} {'spn_i':>6} | "
          f"{'fr/dm/ms':>8} {'DPS':>8} | {'kill_t':>6} {'on_scr':>6} {'Status':>6} | "
          f"{'coins/w':>7} {'earned':>6} {'bank':>7}")
    print("-" * 115)

    total_coins = 0
    fr_l, dm_l, ms_l = 1, 1, 1

    summary_rows = []

    for w in range(1, max_waves + 1):
        hp  = enemy_hp(w)
        cnt = enemy_count(w)
        cv  = coin_value(hp)
        cpw = cnt * cv
        earned = math.floor(cpw * COLLECT_RATE)
        total_coins += earned

        # Buy upgrades greedily
        bought = True
        while bought:
            bought = False
            t, cost = best_buy(total_coins, fr_l, dm_l, ms_l)
            if t:
                total_coins -= cost
                if t == 'fr':  fr_l += 1
                elif t == 'dm': dm_l += 1
                elif t == 'ms': ms_l += 1
                bought = True

        d  = dps(fr_l, dm_l, ms_l)
        si = spawn_interval(w)
        kt = hp / d if d > 0 else 999
        ons = kt / si
        wt = wave_type(w)
        mod = wave_mod(w)
        st = status(ons)

        row = (w, wt, cnt, hp, mod, si, fr_l, dm_l, ms_l, d, kt, ons, st, cpw, earned, total_coins)
        summary_rows.append(row)

        show = not brief or wt in ('RELIEF','SPIKE','LEARN') or w % 10 == 0
        if show:
            marker = '◇' if wt == 'RELIEF' else '★' if wt == 'SPIKE' else '·' if wt == 'LEARN' else ' '
            print(f"{w:>5}{marker}{wt:>6} | {cnt:>4} {hp:>7,} {mod:>5.2f} {si:>5.2f}s | "
                  f"{fr_l:>2}/{dm_l:>2}/{ms_l:>2} {d:>8,.0f} | {kt:>5.2f}s {ons:>5.1f} {st:>6} | "
                  f"{cpw:>7,} {earned:>6,} {total_coins:>7,}")

    # ── SECTION 2: Upgrade cost table ──
    print("\n" + "=" * 80)
    print(f"UPGRADE COSTS (base × level × 2^level)   |   Damage cap: {DMG_CAP}")
    print("=" * 80)
    print(f"{'Level':>6} | {'fireRate':>10}({UP_BASES['fireRate']}) | {'damage':>10}({UP_BASES['damage']}) | "
          f"{'multiShot':>10}({UP_BASES['multiShot']}) | {'lives':>10}({UP_BASES['lives']})")
    print("-" * 60)
    totals = {t: 0 for t in UP_BASES}
    for lvl in range(1, 11):
        costs = {t: upgrade_cost(t, lvl) for t in UP_BASES}
        for t in costs: totals[t] += costs[t]
        print(f"  {lvl:>2}→{lvl+1:<2} | {costs['fireRate']:>14,} | {costs['damage']:>14,} | "
              f"{costs['multiShot']:>14,} | {costs['lives']:>14,}")
    print(f"{'TOTAL':>6} | {totals['fireRate']:>14,} | {totals['damage']:>14,} | "
          f"{totals['multiShot']:>14,} | {totals['lives']:>14,}")

    # ── SECTION 3: Difficulty curve shape ──
    print("\n" + "=" * 80)
    print("DIFFICULTY CURVE (on_screen over waves)")
    print("  Each █ = 1 enemy on screen simultaneously")
    print("=" * 80)
    for row in summary_rows:
        w, wt, cnt, hp, mod, si, fr, dm, ms, d, kt, ons, st, cpw, earned, bank = row
        bar_len = min(60, max(0, round(ons * 3)))
        bar = '█' * bar_len
        if wt == 'RELIEF':  label = f'◇ w{w:>3}'
        elif wt == 'SPIKE': label = f'★ w{w:>3}'
        elif wt == 'LEARN': label = f'· w{w:>3}'
        else:               label = f'  w{w:>3}'
        print(f"  {label} |{bar} {ons:.1f}")

    # ── SECTION 4: Key findings ──
    max_dps = dps(10, DMG_CAP, 7)
    print("\n" + "=" * 80)
    print("KEY METRICS")
    print("=" * 80)
    print(f"  Max DPS (fr10/dmg{DMG_CAP}/ms7): {max_dps:,.0f}")
    print(f"  Wave 50 spike HP: {enemy_hp(47 if wave_type(47)=='SPIKE' else 50):,} "
          f"→ kill_time: {enemy_hp(50)/max_dps:.1f}s")
    print(f"  Wave 100 spike HP: {enemy_hp(96 if wave_type(96)=='SPIKE' else 100):,}")

    # Find when player maxes DPS
    tc2 = 0; f2, d2, m2 = 1, 1, 1
    maxed_wave = None
    for ww in range(1, 201):
        hp2 = enemy_hp(ww)
        cnt2 = enemy_count(ww)
        cv2 = coin_value(hp2)
        tc2 += math.floor(cnt2 * cv2 * COLLECT_RATE)
        bought = True
        while bought:
            bought = False
            t2, c2 = best_buy(tc2, f2, d2, m2)
            if t2:
                tc2 -= c2
                if t2 == 'fr': f2 += 1
                elif t2 == 'dm': d2 += 1
                elif t2 == 'ms': m2 += 1
                bought = True
        if f2 >= 10 and d2 >= DMG_CAP and m2 >= 7 and maxed_wave is None:
            maxed_wave = ww
            break

    if maxed_wave:
        print(f"  DPS maxed at wave: {maxed_wave}")
        print(f"  After that, wave² keeps climbing → difficulty rises forever")
    else:
        print(f"  DPS not yet maxed by wave 200")

    print(f"\n  Difficulty shape: LEARN(1-5) → GOOD w/ sawtooth(6-{maxed_wave or '?'}) "
          f"→ EASY power spike → rising forever")

if __name__ == '__main__':
    main()
