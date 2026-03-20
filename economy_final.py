#!/usr/bin/env python3
"""
Final economy analysis: find the RIGHT balance.
Key finding from previous run: difficulty PEAKS at wave 25-30 then DROPS.
The game gets EASIER the longer you play — that's backwards.

Root cause: damage is uncapped, so DPS eventually outpaces wave².
Fix: cap damage, tune costs so difficulty rises monotonically.
"""
import math

def enemy_count(w):     return 5 + math.floor(w * 1.6)
def spawn_interval(w):  return max(0.45, 1.4 - w * 0.04)
def fire_interval(fr):  return max(0.025, 0.16 - (fr - 1) * 0.015)
def shots_sec(fr):      return 1.0 / fire_interval(fr)
def bullets(ms):        return min(7, ms)
def dps(fr, dmg, ms):   return shots_sec(fr) * dmg * bullets(ms)
def coin_val(hp):        return max(1, math.ceil(math.sqrt(hp)))

# ═══════════════════════════════════════════════════════════════════════
# Try multiple scenarios to find the sweet spot
# ═══════════════════════════════════════════════════════════════════════

scenarios = {
    "CURRENT: HP=w², cost_exp=2.2, dmg_uncapped": {
        "hp": lambda w: max(1, math.floor(w ** 2.0)),
        "bases": {'fireRate': 80, 'damage': 150, 'multiShot': 200},
        "exp": 2.2,
        "dmg_cap": 999,
    },
    "FIX A: HP=w², cost_exp=1.6, dmg_cap=10": {
        "hp": lambda w: max(1, math.floor(w ** 2.0)),
        "bases": {'fireRate': 60, 'damage': 100, 'multiShot': 150},
        "exp": 1.6,
        "dmg_cap": 10,
    },
    "FIX B: HP=w^1.8, cost_exp=1.8, dmg_cap=10": {
        "hp": lambda w: max(1, math.floor(w ** 1.8)),
        "bases": {'fireRate': 60, 'damage': 100, 'multiShot': 150},
        "exp": 1.8,
        "dmg_cap": 10,
    },
    "FIX C: HP=w^1.8, cost_exp=1.5, dmg_uncapped": {
        "hp": lambda w: max(1, math.floor(w ** 1.8)),
        "bases": {'fireRate': 50, 'damage': 80, 'multiShot': 120},
        "exp": 1.5,
        "dmg_cap": 999,
    },
    "FIX D: HP=w², cost_exp=1.5, dmg_cap=10, cheaper early": {
        "hp": lambda w: max(1, math.floor(w ** 2.0)),
        "bases": {'fireRate': 40, 'damage': 60, 'multiShot': 100},
        "exp": 1.5,
        "dmg_cap": 10,
    },
}

COLLECT_RATE = 0.75

for name, cfg in scenarios.items():
    hp_fn = cfg["hp"]
    bases = cfg["bases"]
    exp = cfg["exp"]
    dmg_cap = cfg["dmg_cap"]

    def up_cost(t, lvl):
        return math.floor(bases[t] * (lvl ** exp))

    def best_buy(coins, fr, dm, ms):
        opts = []
        if fr < 10:
            c = up_cost('fireRate', fr)
            if coins >= c:
                opts.append(('fr', c, dps(fr+1,dm,ms) - dps(fr,dm,ms)))
        if dm < dmg_cap:
            c = up_cost('damage', dm)
            if coins >= c:
                opts.append(('dm', c, dps(fr,dm+1,ms) - dps(fr,dm,ms)))
        if ms < 7:
            c = up_cost('multiShot', ms)
            if coins >= c:
                opts.append(('ms', c, dps(fr,dm,ms+1) - dps(fr,dm,ms)))
        if not opts: return None, 0
        return max(opts, key=lambda x: x[2]/x[1] if x[1]>0 else 0)[:2]

    print("\n" + "=" * 130)
    print(f"  {name}")
    print(f"  Max DPS (fr10/dmg{min(10,dmg_cap)}/ms7) = {dps(10, min(10,dmg_cap), 7):,.0f}")
    print("=" * 130)
    print(f"{'Wave':>5} | {'HP':>7} | {'fr/dm/ms':>8} | {'DPS':>8} | {'kill_t':>6} | "
          f"{'on_scr':>6} | {'coins/w':>7} | {'bank':>7} | {'Status':>7}")
    print("-" * 85)

    total_c = 0
    fr_l, dm_l, ms_l = 1, 1, 1
    prev_on_screen = 0

    for w in range(1, 101):
        hp = hp_fn(w)
        cnt = enemy_count(w)
        cv = coin_val(hp)
        cpw = cnt * cv
        earned = math.floor(cpw * COLLECT_RATE)
        total_c += earned

        bought = True
        while bought:
            bought = False
            t, cost = best_buy(total_c, fr_l, dm_l, ms_l)
            if t:
                total_c -= cost
                if t == 'fr': fr_l += 1
                elif t == 'dm': dm_l += 1
                elif t == 'ms': ms_l += 1
                bought = True

        d = dps(fr_l, dm_l, ms_l)
        si = spawn_interval(w)
        kt = hp / d if d > 0 else 999
        ons = kt / si

        if ons <= 3:     st = "EASY"
        elif ons <= 6:   st = "GOOD"
        elif ons <= 10:  st = "HARD"
        elif ons <= 15:  st = "V.HARD"
        else:            st = "IMPOS"

        # Show trend arrow
        trend = "↑" if ons > prev_on_screen + 0.3 else ("↓" if ons < prev_on_screen - 0.3 else "→")
        prev_on_screen = ons

        if w <= 20 or w % 5 == 0:
            print(f"{w:>5} | {hp:>7,} | {fr_l:>2}/{dm_l:>2}/{ms_l:>2} | {d:>8,.0f} | {kt:>5.1f}s | "
                  f"{ons:>5.1f}{trend} | {cpw:>7,} | {total_c:>7,} | {st:>7}")


# ═══════════════════════════════════════════════════════════════════════
# COMPARISON SUMMARY
# ═══════════════════════════════════════════════════════════════════════
print("\n\n" + "=" * 100)
print("COMPARISON: on_screen count at key waves")
print("  Target: EASY(1-5) → GOOD(6-10) → GOOD(11-20) → HARD(21-40) → V.HARD(41-60) → rising forever")
print("=" * 100)
print(f"{'Wave':>5} |", end="")
for name in scenarios:
    short = name.split(":")[0].strip()
    print(f" {short:>12} |", end="")
print()
print("-" * (8 + 15 * len(scenarios)))

for w_check in [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]:
    print(f"{w_check:>5} |", end="")
    for name, cfg in scenarios.items():
        hp_fn2 = cfg["hp"]
        bases2 = cfg["bases"]
        exp2 = cfg["exp"]
        dc2 = cfg["dmg_cap"]

        # Quick re-simulate just to get on_screen at this wave
        tc = 0; f2, d2, m2 = 1, 1, 1
        for ww in range(1, w_check + 1):
            hp2 = hp_fn2(ww)
            cnt2 = enemy_count(ww)
            cv2 = coin_val(hp2)
            tc += math.floor(cnt2 * cv2 * COLLECT_RATE)
            bought = True
            while bought:
                bought = False
                opts2 = []
                if f2 < 10:
                    c2 = math.floor(bases2['fireRate'] * (f2 ** exp2))
                    if tc >= c2: opts2.append(('fr', c2, dps(f2+1,d2,m2)-dps(f2,d2,m2)))
                if d2 < dc2:
                    c2 = math.floor(bases2['damage'] * (d2 ** exp2))
                    if tc >= c2: opts2.append(('dm', c2, dps(f2,d2+1,m2)-dps(f2,d2,m2)))
                if m2 < 7:
                    c2 = math.floor(bases2['multiShot'] * (m2 ** exp2))
                    if tc >= c2: opts2.append(('ms', c2, dps(f2,d2,m2+1)-dps(f2,d2,m2)))
                if opts2:
                    best = max(opts2, key=lambda x: x[2]/x[1] if x[1]>0 else 0)
                    tc -= best[1]
                    if best[0] == 'fr': f2 += 1
                    elif best[0] == 'dm': d2 += 1
                    elif best[0] == 'ms': m2 += 1
                    bought = True

        dp = dps(f2, d2, m2)
        hp2 = hp_fn2(w_check)
        si2 = spawn_interval(w_check)
        kt2 = hp2 / dp if dp > 0 else 999
        ons2 = kt2 / si2
        label = "EASY" if ons2<=3 else "GOOD" if ons2<=6 else "HARD" if ons2<=10 else "V.HARD" if ons2<=15 else "IMPOS"
        print(f" {ons2:>5.1f} {label:<5} |", end="")
    print()
