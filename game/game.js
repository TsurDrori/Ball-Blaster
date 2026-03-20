// ──────────────────────────────────────────
//  Ball Blast — main game loop
// ──────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let cannon, bullets, enemies, coins, powerups, waveManager, ui;
let lastTime          = 0;
let lastWave          = 1;
let announceT         = 0;
let gameRunning       = false;
let returnTimer       = 0;
let hitInvulnerable   = 0;
let powerupSpawnTimer = 0;

// ── Combo chain ───────────────────────────
let comboCount = 0; // kills in current chain
let comboTimer = 0; // seconds until chain resets

// ── Run upgrade picker ────────────────────
let upgradePickOptions = []; // empty = no picker; 3 items = show picker

const RUN_UPGRADE_POOL = [
    { id: 'magnetic',     icon: '🧲', name: 'מגנט מטבעות',  desc: 'רדיוס איסוף מטבעות כפול' },
    { id: 'gold_rush',    icon: '💰', name: 'בונוס זהב',     desc: 'ערך כל המטבעות ×1.5' },
    { id: 'bouncy',       icon: '🎱', name: 'כדורים קופצים', desc: 'כדורים מקפיצים מהקירות' },
    { id: 'rapid',        icon: '⚡', name: 'ירי מהיר',       desc: '+25% קצב ירי' },
    { id: 'pierce',       icon: '🏹', name: 'כדורים חודרים', desc: 'כל כדור חודר אויב נוסף' },
    { id: 'shield_up',    icon: '🛡️', name: 'מגן חזק',       desc: 'מגן נמשך 20 שניות' },
    { id: 'double_heart', icon: '💝', name: 'לב כפול',        desc: 'פיק לב נותן 2 חיים' },
    { id: 'marked',       icon: '🎯', name: 'אויב מסומן',    desc: 'פגיעה ראשונה: נזק כפול ל-3 שניות' },
];

function pickUpgradeOptions(n) {
    const pool = RUN_UPGRADE_POOL.filter(u => !gameState.runUpgrades.includes(u.id));
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Fill with repeats if pool smaller than n (shouldn't happen with 8 upgrades)
    while (pool.length < n) pool.push(...RUN_UPGRADE_POOL);
    return pool.slice(0, n);
}

function handlePickerClick(cx, cy) {
    const rects = pickerCardRects(upgradePickOptions.length);
    for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
            gameState.runUpgrades.push(upgradePickOptions[i].id);
            upgradePickOptions = [];
            waveManager.waveDelay = 1.8;
            sound.upgrade();
            return;
        }
    }
}

// ── Input ────────────────────────────────
const keys = {};
let touchX  = null;
let mouseX  = CANVAS_W / 2;
let mouseY  = CANVAS_H / 2;

document.addEventListener('keydown', e => {
    sound.unlock();
    keys[e.key] = true;
    if ((e.key === 'r' || e.key === 'R' || e.key === 'Escape') && gameState.status === 'gameover') {
        returnToHome();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    mouseY = (e.clientY - rect.top)  * (CANVAS_H / rect.height);
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    sound.unlock();
    const rect = canvas.getBoundingClientRect();
    const tx = (e.touches[0].clientX - rect.left) * (CANVAS_W / rect.width);
    const ty = (e.touches[0].clientY - rect.top)  * (CANVAS_H / rect.height);
    if (upgradePickOptions.length > 0) { handlePickerClick(tx, ty); return; }
    if (gameState.status === 'gameover') { returnToHome(); return; }
    touchX = tx;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchX = (e.touches[0].clientX - rect.left) * (CANVAS_W / rect.width);
}, { passive: false });

canvas.addEventListener('touchend', () => { touchX = null; });

canvas.addEventListener('click', e => {
    sound.unlock();
    if (upgradePickOptions.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
        const cy = (e.clientY - rect.top)  * (CANVAS_H / rect.height);
        handlePickerClick(cx, cy);
        return;
    }
    if (gameState.status === 'gameover') returnToHome();
});

// ── Dev mode ─────────────────────────────
let devMode     = false;
let devSnapshot = null;

function toggleDevMode() {
    devMode = !devMode;

    if (devMode) {
        devSnapshot = {
            totalCoins: gameState.totalCoins,
            upgrades:   { ...gameState.upgrades },
            highScore:  gameState.highScore,
        };
        const currentWave    = Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1);
        const suggestedCoins = estimateCoinsForWave(currentWave);
        document.getElementById('dev-coins').value = suggestedCoins;
        gameState.upgrades   = { fireRate: 1, damage: 1, multiShot: 1, ballSize: 1, lives: 1 };
        gameState.totalCoins = suggestedCoins;
    } else {
        if (devSnapshot) {
            gameState.totalCoins = devSnapshot.totalCoins;
            gameState.upgrades   = { ...devSnapshot.upgrades };
            gameState.highScore  = devSnapshot.highScore;
            localStorage.setItem('bb_hs', devSnapshot.highScore);
            gameState._save();
        }
        devSnapshot = null;
    }

    const btn     = document.getElementById('dev-toggle');
    const content = document.getElementById('dev-content');
    btn.textContent = devMode ? '🔧 מצב פיתוח: פעיל' : '🔧 מצב פיתוח: כבוי';
    btn.classList.toggle('dev-on', devMode);
    content.classList.toggle('open', devMode);
    refreshHomeScreen();
}

function onDevCoinsInput() {
    if (!devMode) return;
    gameState.totalCoins = Math.max(0, parseInt(document.getElementById('dev-coins').value) || 0);
    refreshHomeScreen();
}

function estimateCoinsForWave(targetWave) {
    let total = 0;
    for (let w = 1; w < targetWave; w++) {
        const hp      = Math.max(1, Math.floor(Math.pow(w, 2.0)));
        const coinVal = Math.max(1, Math.ceil(Math.sqrt(hp)));
        const count   = 5 + Math.floor(w * 1.6);
        total += coinVal * count;
    }
    return total;
}

function onDevWaveInput() {
    if (!devMode) return;
    const wave      = Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1);
    const suggested = estimateCoinsForWave(wave);
    document.getElementById('dev-coins').value = suggested;
    gameState.totalCoins = suggested;
    refreshHomeScreen();
}

// ── Home screen wiring ────────────────────
function buyUpgrade(type) {
    if (gameState.status !== 'home') return;
    sound.unlock();
    if (gameState.buyUpgrade(type)) {
        sound.upgrade();
        refreshHomeScreen();
    }
}

function refreshHomeScreen() {
    document.getElementById('bank-amount').textContent = gameState.totalCoins.toLocaleString();
    document.getElementById('bank-amount').classList.toggle('dev-override', devMode);
    document.getElementById('hs-wave').textContent     = gameState.highScore;

    const meta = {
        fireRate:  { icon: '⚡', name: 'קצב ירי',   desc: lv => `${Math.round(10 / Math.max(0.025, 0.16 - (lv-1)*0.015))/10} כדורים/שנ'` },
        damage:    { icon: '💥', name: 'עוצמה',     desc: lv => `נזק ${Math.min(8, lv)} לכדור` },
        multiShot: { icon: '🎯', name: 'רב-כדורי',  desc: lv => `${Math.min(5, lv)} כדורים במקביל` },
        ballSize:  { icon: '🔵', name: 'גודל כדור', desc: lv => `רדיוס ${9 + (lv-1)*2}` },
        lives:     { icon: '❤️', name: 'חיים',       desc: lv => `${lv} חיים למשחק` },
    };
    for (const [type, m] of Object.entries(meta)) {
        const btn  = document.getElementById('btn-' + type);
        if (!btn) continue;
        const lv   = gameState.upgrades[type];
        const cost = gameState.upgradeCost(type);
        btn.innerHTML = `${m.icon} ${m.name}<br><small>${m.desc(lv)}</small><small>Lv.${lv} · 🪙${cost.toLocaleString()}</small>`;
        btn.className = 'upgrade-btn' + (gameState.canAfford(type) ? ' affordable' : '');
    }
}

// ── Screen transitions ────────────────────
function startGame() {
    sound.unlock();
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    // Roguelite: always start at wave 1 (dev mode can override)
    const startWave = devMode
        ? Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1)
        : 1;
    gameState.startNewGame(startWave);

    initEntities();
    lastTime    = performance.now();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

function returnToHome() {
    gameRunning = false;
    gameState.status = 'home';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('home-screen').style.display = 'flex';
    refreshHomeScreen();
}

// ── Init entities ─────────────────────────
function initEntities() {
    cannon      = new Cannon();
    bullets     = [];
    enemies     = [];
    coins       = [];
    powerups    = [];
    waveManager = new WaveManager();
    ui          = new UI();
    lastWave          = gameState.wave;
    announceT         = 2.5;
    returnTimer       = 0;
    hitInvulnerable   = 0;
    powerupSpawnTimer = 20 + Math.random() * 10;
    comboCount        = 0;
    comboTimer        = 0;
    upgradePickOptions = [];
    resetEffects();
    Object.keys(keys).forEach(k => { keys[k] = false; });
}

// ── Collision helpers ─────────────────────
function dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
}

function checkCollisions() {
    const collector = cannon.getCollector();
    const maxPierce = gameState.hasRunUpgrade('pierce') ? 2 : 1;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.dead) continue;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.dead) continue;
            const minD = b.radius + e.radius;
            if (dist2(b.x, b.y, e.x, e.y) < minD * minD) {
                // Calculate damage (with 'marked' run upgrade)
                let dmg = b.damage;
                if (gameState.hasRunUpgrade('marked') && b.type !== 'fire') {
                    if (e.marked) {
                        dmg *= 2;
                        e.marked    = false;
                        e.markTimer = 0;
                    } else {
                        e.marked    = true;
                        e.markTimer = 3.0;
                    }
                }

                e.hit(dmg);

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
            gameState.collectCoin(c.value);
            fxCoinCollect(c.x, c.y, c.value);
            sound.coinCollect();
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
            }
            fxPowerUpCollect(p.x, p.y, p.type);
            sound.upgrade();
        }
    }
}

function spawnCoins(enemy, comboMult = 1.0) {
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

// ── Update ────────────────────────────────
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

    // Combo chain timer
    if (comboTimer > 0) {
        comboTimer -= delta;
        if (comboTimer <= 0) comboCount = 0;
    }

    if (hitInvulnerable > 0) hitInvulnerable -= delta;

    // Tick active powerup timers
    if (gameState.shieldTimer > 0) gameState.shieldTimer = Math.max(0, gameState.shieldTimer - delta);
    if (gameState.fireTimer   > 0) gameState.fireTimer   = Math.max(0, gameState.fireTimer   - delta);

    for (const e of enemies) {
        if (e.dead) continue;
        e.update(delta);
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

    for (const c of coins) c.update(delta);

    // Spawn and update powerups
    powerupSpawnTimer -= delta;
    if (powerupSpawnTimer <= 0) {
        const roll = Math.random();
        const type = roll < 0.35 ? 'shield' : roll < 0.7 ? 'fire' : 'heart';
        powerups.push(new PowerUp(60 + Math.random() * (CANVAS_W - 120), type));
        powerupSpawnTimer = 15 + Math.random() * 15;
    }
    for (const p of powerups) p.update(delta);

    updateEffects(delta);
    checkCollisions();

    const activeCount = enemies.filter(e => !e.dead).length;
    const newEnemy    = waveManager.update(delta, activeCount);
    if (newEnemy) enemies.push(newEnemy);

    if (waveManager.newWaveFlag) {
        waveManager.newWaveFlag = false;
        lastWave  = waveManager.wave;
        announceT = 2.0;
        fxWaveClear();
        sound.waveStart(waveManager.wave);

        // After a spike wave: show run upgrade picker
        if (waveManager.spikeWaveCleared) {
            waveManager.spikeWaveCleared = false;
            upgradePickOptions = pickUpgradeOptions(3);
            // waveDelay is already 0; picker controls the next-wave delay
        }
    }
    if (announceT > 0) announceT -= delta;

    gameState.wave = waveManager.wave;

    bullets  = bullets.filter(b => !b.dead);
    enemies  = enemies.filter(e => !e.dead);
    coins    = coins.filter(c   => !c.dead);
    powerups = powerups.filter(p => !p.dead);
}

// ── Render ────────────────────────────────
function render() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    BG_SYSTEM.draw(ctx);

    screenShake.apply(ctx);

    coins.forEach(c   => c.draw(ctx));
    powerups.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    drawWorldEffects(ctx);
    bullets.forEach(b => b.draw(ctx));
    cannon.draw(ctx);

    screenShake.restore(ctx);

    ui.drawHUD(ctx, gameState.sessionCoins, waveManager ? waveManager.wave : 1, gameState.currentLives, gameState.upgrades.lives);
    drawUIEffects(ctx);

    // Wave announce only when picker is NOT open
    if (announceT > 0 && upgradePickOptions.length === 0) {
        ui.drawWaveAnnounce(ctx, lastWave, announceT / 2.0);
    }

    // Run upgrade picker overlay
    if (upgradePickOptions.length > 0) {
        // Compute hover index from mouse position
        const rects = pickerCardRects(upgradePickOptions.length);
        let hoverIdx = -1;
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
                hoverIdx = i;
                break;
            }
        }
        ui.drawRunUpgradePicker(ctx, upgradePickOptions, hoverIdx);
    }

    if (gameState.status === 'gameover') {
        ui.drawGameOver(ctx, waveManager.wave, gameState.highScore, gameState.sessionCoins, returnTimer);
    }
}

// ── Main loop ─────────────────────────────
function gameLoop(ts) {
    if (!gameRunning) return;
    const delta = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;
    BG_SYSTEM.update(delta, waveManager ? waveManager.wave : 1);
    try {
        update(delta);
        render();
    } catch (err) {
        console.error('Game error:', err);
    }
    requestAnimationFrame(gameLoop);
}

// ── Mute toggle ───────────────────────────
function toggleMute() {
    const muted = sound.toggleMute();
    const btn = document.getElementById('sound-toggle');
    if (btn) {
        btn.textContent = muted ? '🔇' : '🔊';
        btn.classList.toggle('muted', muted);
    }
}

// ── Boot: show home screen ─────────────────
refreshHomeScreen();
