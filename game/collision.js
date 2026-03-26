// ── בדיקות פגיעה ואיסוף מטבעות ──────────────────────────────────────────────

function dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
}

function checkCollisions() {
    const collector = cannon.getCollector();
    const maxPierce = gameState.hasRunUpgrade('pierce') ? Infinity : 1;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.dead) continue;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.dead) continue;
            if (b.hitEnemies.has(e)) continue; // כבר פגע באויב זה - דלג
            const minD = b.radius + e.radius;
            if (dist2(b.x, b.y, e.x, e.y) < minD * minD) {
                b.hitEnemies.add(e); // סמן אויב זה כ"נפגע"
                const dmg = b.damage;
                e.hit(dmg);

                // Freeze: bullets slow enemy movement
                if (gameState.hasRunUpgrade('freeze')) {
                    e.slowTimer = 2.0;
                }

                // Explosion splash: deal half damage to nearby enemies
                if (gameState.hasRunUpgrade('explosion')) {
                    const splashDmg = Math.max(1, Math.ceil(dmg * 0.5));
                    for (const ne of enemies) {
                        if (ne.dead || ne === e) continue;
                        if (dist2(b.x, b.y, ne.x, ne.y) < 80 * 80) {
                            ne.hit(splashDmg);
                            fxHit(ne.x, ne.y, ne.baseColor, splashDmg);
                        }
                    }
                    shockwaves.push(new Shockwave(b.x, b.y, 'rgba(255,140,0,0.7)', 80, 220));
                }

                // Bullet pierce logic (fire bullets always pierce)
                if (b.type !== 'fire') {
                    b.pierceCount++;
                    if (b.pierceCount >= maxPierce) b.dead = true;
                }

                if (e.dead) {
                    // On-death effects (bomb AoE / splitter spawn)
                    const action = e.onDeath();
                    if (action?.action === 'aoe') {
                        for (const other of enemies) {
                            if (other !== e && !other.dead) {
                                const dx = other.x - action.x, dy = other.y - action.y;
                                if (dx*dx + dy*dy < action.radius * action.radius) {
                                    const aoeDmg = Math.min(action.damage, Math.ceil(other.hp * 0.5));
                                    other.hit(aoeDmg);
                                    fxHit(other.x, other.y, other.baseColor, aoeDmg);
                                }
                            }
                        }
                        // Big orange shockwave for bomb AoE
                        shockwaves.push(new Shockwave(e.x, e.y, 'rgba(255,100,0,0.85)', 120, 320));
                    }
                    if (action?.action === 'split') {
                        for (const child of action.children) enemies.push(child);
                    }

                    fxEnemyDeath(e.x, e.y, e.baseColor, e.maxHp);

                    // Combo tracking
                    comboCount++;
                    comboTimer = 2.0;
                    const mult = comboCount >= 6 ? 2.0 : comboCount >= 3 ? 1.5 : 1.0;
                    if (comboCount >= 3) {
                        floatingTexts.push(new FloatingText(
                            CANVAS_W / 2, CANVAS_H * 0.45,
                            `COMBO ×${comboCount}!`,
                            '#FFD700', 26
                        ));
                    }

                    spawnCoins(e, mult);
                    sound.explode();

                    // Heal on kill: every 10 kills gain 1 life
                    if (gameState.hasRunUpgrade('heal')) {
                        healKillCount++;
                        if (healKillCount >= 10) {
                            healKillCount = 0;
                            const maxLives = gameState.upgrades.lives + 2;
                            if (gameState.currentLives < maxLives) {
                                gameState.currentLives++;
                                floatingTexts.push(new FloatingText(cannon.x, cannon.y - 50, '💚 +חיים!', '#00e676', 24));
                            }
                        }
                    }
                } else {
                    fxHit(b.x, b.y, e.baseColor, dmg);
                    sound.hit();
                }

                if (b.dead) break;
            }
        }
    }

    // Coin collection
    const cR2 = collector.r * collector.r;
    for (const c of coins) {
        if (c.dead) continue;
        if (dist2(c.x, c.y, collector.x, collector.y) < cR2) {
            c.dead = true;
            if (c.isDiamond) {
                gameState.collectDiamond();
                floatingTexts.push(new FloatingText(c.x, c.y - 10, '💎 +1', '#00e5ff', 17));
                sound.coinCollect();
            } else {
                gameState.collectCoin(c.value);
                fxCoinCollect(c.x, c.y, c.value);
                sound.coinCollect();
            }
        }
    }

    // Powerup collection
    for (const p of powerups) {
        if (p.dead) continue;
        const minD = p.radius + collector.r;
        if (dist2(p.x, p.y, collector.x, collector.y) < minD * minD) {
            p.dead = true;
            if (p.type === 'shield') {
                // 'shield_up' run upgrade doubles shield duration
                gameState.shieldTimer = gameState.hasRunUpgrade('shield_up') ? 20 : 8;
            } else if (p.type === 'fire') {
                gameState.fireTimer = 10;
            } else if (p.type === 'heart') {
                // 'double_heart' run upgrade gives 2 lives per heart pickup
                const gain = gameState.hasRunUpgrade('double_heart') ? 2 : 1;
                gameState.currentLives = Math.min(gameState.upgrades.lives + 2, gameState.currentLives + gain);
            } else if (p.type === 'ice') {
                gameState.iceTimer = 5;
            }
            fxPowerUpCollect(p.x, p.y, p.type);
            sound.upgrade();
        }
    }
}

function spawnCoins(enemy, comboMult = 1.0) {
    // אויב יהלום → מוריד 4-7 יהלומים (נדיר!)
    if (enemy.type === 'crystal') {
        const count = 4 + Math.floor(Math.random() * 4); // 4, 5, 6 או 7
        for (let k = 0; k < count; k++) {
            coins.push(new Coin(
                enemy.x + (Math.random() - 0.5) * 36,
                enemy.y,
                1,       // ערך לא רלוונטי - יהלומים לא שווים זהב
                true     // isDiamond
            ));
        }
        return;
    }

    let baseValue = enemy.coinValue;
    // 'gold_rush' run upgrade boosts all coin values
    if (gameState.hasRunUpgrade('gold_rush')) baseValue = Math.ceil(baseValue * 1.5);
    const total = Math.ceil(baseValue * comboMult);
    const count = Math.min(10, Math.max(1, Math.floor(Math.log2(total + 1))));
    const each  = Math.max(1, Math.floor(total / count));
    for (let k = 0; k < count; k++) {
        coins.push(new Coin(enemy.x + (Math.random() - 0.5) * 20, enemy.y, each));
    }
}
