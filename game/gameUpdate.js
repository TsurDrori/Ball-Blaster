// ── לולאת עדכון ראשית ────────────────────────────────────────────────────────

function update(delta) {
    if (gameState.status === 'gameover') {
        updateEffects(delta);
        returnTimer -= delta;
        if (returnTimer <= 0) returnToHome();
        return;
    }
    if (gameState.status !== 'playing') return;

    // While upgrade picker is open, pause all game logic
    if (upgradePickOptions.length > 0) {
        updateEffects(delta);
        return;
    }

    sound.tick(delta);

    if (cannon.update(delta, keys, touchX)) {
        bullets.push(...cannon.createBullets());
        sound.shoot();
    }

    for (const b of bullets) b.update(delta);

    // Homing missile steering
    if (gameState.hasRunUpgrade('homing')) {
        for (const b of bullets) {
            if (!b.homing || b.dead) continue;
            let nearest = null, bestDist = Infinity;
            for (const e of enemies) {
                if (e.dead) continue;
                const d = dist2(b.x, b.y, e.x, e.y);
                if (d < bestDist) { bestDist = d; nearest = e; }
            }
            if (nearest) {
                const dx = nearest.x - b.x;
                const dy = nearest.y - b.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    b.vx += (dx / len * speed - b.vx) * 4.0 * delta;
                    b.vy += (dy / len * speed - b.vy) * 4.0 * delta;
                }
            }
        }
    }

    // Combo chain timer
    if (comboTimer > 0) {
        comboTimer -= delta;
        if (comboTimer <= 0) comboCount = 0;
    }

    if (hitInvulnerable > 0) hitInvulnerable -= delta;

    // Tick active powerup timers
    if (gameState.shieldTimer > 0) gameState.shieldTimer = Math.max(0, gameState.shieldTimer - delta);
    if (gameState.fireTimer   > 0) gameState.fireTimer   = Math.max(0, gameState.fireTimer   - delta);
    if (gameState.iceTimer    > 0) gameState.iceTimer    = Math.max(0, gameState.iceTimer    - delta);

    for (const e of enemies) {
        if (e.dead) continue;
        e.update(delta);
        // יהלום שפג זמנו - נעלם ללא זהב ולא פוגע בתותח
        if (e.dead) {
            if (e.expired) {
                fxEnemyDeath(e.x, e.y, e.baseColor, Math.min(e.maxHp, 40));
                floatingTexts.push(new FloatingText(e.x, e.y - e.radius, '⌛ נעלם!', '#888888', 15));
            }
            continue;
        }
        if (e.hitsCannon(cannon)) {
            if (gameState.shieldTimer > 0) {
                gameState.shieldTimer = 0;
                e.dead = true;
                fxShieldBreak(cannon.x, cannon.y);
                sound.impact();
                screenShake.trigger(0.25, 10);
            } else if (hitInvulnerable <= 0) {
                sound.impact();
                gameState.currentLives--;
                cannon.hitFlash = 0.5;
                screenShake.trigger(0.3, 10);
                e.dead = true;

                if (gameState.currentLives <= 0) {
                    sound.gameOver();
                    screenShake.trigger(0.6, 18);
                    gameState.endGame();
                    returnTimer = 3.0;
                    return;
                } else {
                    hitInvulnerable = 1.5;
                }
            }
        }
    }

    const magnetCollector = gameState.hasRunUpgrade('magnetic') ? cannon.getCollector() : null;
    for (const c of coins) c.update(delta, magnetCollector);

    // Spawn and update powerups
    powerupSpawnTimer -= delta;
    if (powerupSpawnTimer <= 0) {
        const roll = Math.random();
        const type = roll < 0.28 ? 'shield' : roll < 0.56 ? 'fire' : roll < 0.78 ? 'heart' : 'ice';
        powerups.push(new PowerUp(60 + Math.random() * (CANVAS_W - 120), type));
        powerupSpawnTimer = 15 + Math.random() * 15;
    }
    for (const p of powerups) p.update(delta);

    updateEffects(delta);
    checkCollisions();

    // ── גל בוס ────────────────────────────────────────────────
    if (bossActive) {
        if (bossAnnounceT > 0) bossAnnounceT -= delta;

        // עדכן בוסים — אסוף כדורים ואויבים חדשים
        for (const b of bosses) {
            if (b.dead) continue;
            b.update(delta, cannon.x);
            bossBullets.push(...b._newBullets);
            enemies.push(...b._newEnemies);
        }

        // עדכן כדורי בוס + פגיעה בתותח
        for (const bb of bossBullets) {
            bb.update(delta);
            if (bb.dead || gameState.iceTimer > 0) continue;
            if (bb.hitsCannon(cannon)) {
                bb.dead = true;
                if (gameState.shieldTimer > 0) {
                    gameState.shieldTimer = 0;
                    fxShieldBreak(cannon.x, cannon.y);
                    sound.impact();
                    screenShake.trigger(0.25, 10);
                } else if (hitInvulnerable <= 0) {
                    sound.impact();
                    gameState.currentLives--;
                    cannon.hitFlash = 0.5;
                    screenShake.trigger(0.3, 10);
                    if (gameState.currentLives <= 0) {
                        sound.gameOver();
                        screenShake.trigger(0.6, 18);
                        gameState.endGame();
                        returnTimer = 3.0;
                        return;
                    }
                    hitInvulnerable = 1.5;
                }
            }
        }
        _compact(bossBullets);

        // כדורי שחקן פוגעים בכדורי בוס
        const bbPierce = gameState.hasRunUpgrade('pierce') ? Infinity : 1;
        for (const b of bullets) {
            if (b.dead) continue;
            for (const bb of bossBullets) {
                if (bb.dead) continue;
                const minD = b.radius + bb.radius;
                if (dist2(b.x, b.y, bb.x, bb.y) < minD * minD) {
                    bb.hit(b.damage);
                    fxHit(b.x, b.y, '#ff8833', b.damage);
                    if (b.type !== 'fire') { b.pierceCount++; if (b.pierceCount >= bbPierce) b.dead = true; }
                    break;
                }
            }
        }
        _compact(bossBullets);

        // כדורי שחקן פוגעים בבוס
        const bossMaxPierce = gameState.hasRunUpgrade('pierce') ? Infinity : 1;
        for (const b of bullets) {
            if (b.dead || gameState.iceTimer > 0) continue;
            for (const boss of bosses) {
                if (boss.dead) continue;
                const minD = b.radius + boss.radius;
                if (dist2(b.x, b.y, boss.x, boss.y) < minD * minD) {
                    if (boss.type === 'shield' && boss.blocksHit(b.x, b.y)) {
                        // קשת חסמה — הכדור מת ללא נזק
                        fxHit(b.x, b.y, '#33ffcc', 0);
                        if (b.type !== 'fire') { b.pierceCount++; if (b.pierceCount >= bossMaxPierce) b.dead = true; }
                    } else {
                        boss.hit(b.damage);
                        fxHit(b.x, b.y, boss._primary(), b.damage);
                        if (b.type !== 'fire') { b.pierceCount++; if (b.pierceCount >= bossMaxPierce) b.dead = true; }
                    }
                    break;
                }
            }
        }

        // טיפול בבוסים מתים
        for (let i = bosses.length - 1; i >= 0; i--) {
            const boss = bosses[i];
            if (!boss.dead) continue;
            if (boss.splitting) {
                // מפצל: מחלק לשני מיני-בוסים
                const bx = boss.x, by = boss.y;
                bosses.splice(i, 1);
                bosses.push(
                    new BossEnemy(boss.wave, 'splitter', true, bx - 65),
                    new BossEnemy(boss.wave, 'splitter', true, bx + 65)
                );
                fxEnemyDeath(bx, by, '#ffaa00', boss.maxHp * 0.5);
                screenShake.trigger(0.4, 10);
                sound.explode();
                floatingTexts.push(new FloatingText(bx, by - 50, 'מתפצל!', '#ffaa44', 24));
            } else {
                // מוות רגיל — מטבעות + אפקטים
                const bx = boss.x, by = boss.y;
                bosses.splice(i, 1);
                fxEnemyDeath(bx, by, boss._primary(), boss.maxHp);
                sound.explode();
                const cv = Math.max(5, Math.ceil(Math.sqrt(boss.wave * boss.wave)));
                for (let k = 0; k < 15; k++) {
                    coins.push(new Coin(bx + (Math.random() - 0.5) * 80, by + (Math.random() - 0.5) * 30, cv));
                }
            }
        }

        // כל הבוסים הובסו?
        if (bosses.length === 0) {
            bossActive  = false;
            bossBullets = [];
            upgradePickOptions = pickUpgradeOptions(3);
            screenShake.trigger(0.8, 20);
            sound.explode();
            floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H * 0.42, 'בוס הובס!', '#ffcc00', 34));
        }

        // ניקוי + דלג על waveManager בזמן קרב בוס
        _compact(bullets);
        _compact(enemies);
        _compact(coins);
        _compact(powerups);
        if (announceT > 0) announceT -= delta;
        gameState.wave = waveManager.wave;
        return;
    }
    // ── סוף גל בוס ────────────────────────────────────────────

    let activeCount = 0;
    for (let _i = 0; _i < enemies.length; _i++) { if (!enemies[_i].dead) activeCount++; }
    const newEnemy    = waveManager.update(delta, activeCount);
    if (newEnemy) enemies.push(newEnemy);

    if (waveManager.newWaveFlag) {
        waveManager.newWaveFlag = false;
        lastWave  = waveManager.wave;
        announceT = 2.0;
        fxWaveClear();
        sound.waveStart(waveManager.wave);
        gameState.checkWaveMission(waveManager.wave);

        if (waveManager.spikeWaveCleared) {
            waveManager.spikeWaveCleared = false;
            // התחל קרב בוס במקום להציג שדרוג
            const bossWave = waveManager.wave - 1; // בוס לפי הגל שנסגר
            bossActive      = true;
            bosses          = [new BossEnemy(bossWave)];
            bossBullets     = [];
            bossAnnounceT   = 2.5;
            const bType     = getBossType(bossWave);
            bossAnnounceTxt = `${BOSS_ICONS[bType]} ${BOSS_NAMES[bType]} מגיע!`;
            announceT = 0; // בטל הכרזת גל רגילה
        }
    }
    if (announceT > 0) announceT -= delta;

    gameState.wave = waveManager.wave;

    _compact(bullets);
    _compact(enemies);
    _compact(coins);
    _compact(powerups);
}
