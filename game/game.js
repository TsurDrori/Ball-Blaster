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
let gamePaused        = false;
let returnTimer       = 0;
let hitInvulnerable   = 0;
let powerupSpawnTimer = 0;

// ── Combo chain ───────────────────────────
let comboCount    = 0; // kills in current chain
let comboTimer    = 0; // seconds until chain resets
let healKillCount = 0; // kills toward next heal-on-kill

// ── Boss fight ────────────────────────────
let bossActive      = false;
let bosses          = []; // BossEnemy[]
let bossBullets     = []; // BossBullet[]
let bossAnnounceT   = 0;
let bossAnnounceTxt = '';

// ── Run upgrade picker ────────────────────
let upgradePickOptions = []; // empty = no picker; 3 items = show picker

// ── לולאת אנימציה לתצוגה מקדימה של סקינים ───────────────────────────────────
let _previewRafId = null;
function _ensurePreviewAnim() {
    if (_previewRafId !== null) return;
    function _previewTick() {
        const shop = document.getElementById('skins-shop');
        if (shop && shop.offsetParent !== null) {
            document.querySelectorAll('.skin-card-canvas').forEach(c =>
                drawSkinPreview(c, c.dataset.skin, c.dataset.type));
        }
        _previewRafId = requestAnimationFrame(_previewTick);
    }
    _previewRafId = requestAnimationFrame(_previewTick);
}

const RUN_UPGRADE_POOL = [
    { id: 'magnetic',     icon: '🧲', name: 'מגנט מטבעות',  desc: 'רדיוס איסוף מטבעות כפול' },
    { id: 'gold_rush',    icon: '💰', name: 'בונוס זהב',     desc: 'ערך כל המטבעות ×1.5' },
    { id: 'bouncy',       icon: '🎱', name: 'כדורים קופצים', desc: 'כדורים מקפיצים מהקירות' },
    { id: 'rapid',        icon: '⚡', name: 'ירי מהיר',       desc: '+25% קצב ירי' },
    { id: 'pierce',       icon: '🏹', name: 'כדורים חודרים', desc: 'כדורים עוברים דרך כל האויבים' },
    { id: 'shield_up',    icon: '🛡️', name: 'מגן חזק',       desc: 'מגן נמשך 20 שניות' },
    { id: 'double_heart', icon: '💝', name: 'לב כפול',        desc: 'פיק לב נותן 2 חיים' },
    { id: 'homing',       icon: '🚀', name: 'טיל מונחה',     desc: 'כדור אחד בכל יריה עף לאויב הקרוב' },
    { id: 'explosion',    icon: '💥', name: 'פיצוץ בפגיעה',  desc: 'כל פגיעה מזיקה לאויבים קרובים' },
    { id: 'freeze',       icon: '❄️', name: 'קפאון',          desc: 'כדורים מאטים אויבים ל-2 שניות' },
    { id: 'heal',         icon: '💚', name: 'ריפוי בהריגה',  desc: 'כל 10 הריגות נותנות חיים' },
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

// ── Responsive scaling ────────────────────
function resizeGame() {
    const scale = Math.min(
        window.innerWidth  / 480,
        window.innerHeight / 800
    );
    document.documentElement.style.setProperty('--game-scale', scale);
}
window.addEventListener('resize', resizeGame);
resizeGame();

// ── Input ────────────────────────────────
const keys = {};
let touchX  = null;
let mouseX  = CANVAS_W / 2;
let mouseY  = CANVAS_H / 2;

document.addEventListener('keydown', e => {
    sound.unlock();
    keys[e.key] = true;
    if (e.key === 'Escape') {
        if (gameState.status === 'gameover') {
            returnToHome();
        } else if (gameState.status === 'playing') {
            togglePause();
        }
    }
    if ((e.key === 'r' || e.key === 'R') && gameState.status === 'gameover') {
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
function devResetUpgrades() {
    if (!devMode) return;
    gameState.upgrades = { fireRate: 1, damage: 1, multiShot: 1, ballSize: 1, lives: 1 };
    gameState._save();
    refreshHomeScreen();
}

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
    document.getElementById('dev-panel').classList.toggle('dev-open', devMode);
    document.getElementById('home-screen').classList.toggle('dev-panel-open', devMode);
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
    const prevLevel    = gameState.upgrades[type];
    const wasPrestige  = type === 'multiShot' && prevLevel > 0 && prevLevel % 5 === 0;
    if (gameState.buyUpgrade(type)) {
        sound.upgrade();
        if (wasPrestige) _showPrestigeToast(prevLevel);
        if (type === 'fireRate') {
            const unlocked = gameState.checkFirerateMission();
            if (unlocked) refreshSkinsPanel();
        }
        refreshHomeScreen();
    }
}

function _showPrestigeToast(prevLevel) {
    const cycle = Math.floor(prevLevel / 5);
    const mult  = Math.pow(10, cycle);
    const toast = document.getElementById('prestige-toast');
    toast.innerHTML = `🔥 פרסטיג'! רב-כדורי<br><span style="font-size:14px;color:#ffaa44">1 כדור = ×${mult} נזק מהמחזור הקודם</span>`;
    toast.classList.remove('show');
    void toast.offsetWidth; // force reflow
    toast.classList.add('show');
}

// ── Skin shop ─────────────────────────────────────────────────────────────────
function switchShopTab(tab) {
    const upgradeShop = document.getElementById('upgrade-shop');
    const skinsShop   = document.getElementById('skins-shop');
    const tabU = document.getElementById('tab-upgrades');
    const tabS = document.getElementById('tab-skins');
    if (tab === 'upgrades') {
        upgradeShop.style.display = '';
        skinsShop.style.display   = 'none';
        tabU.classList.add('active');
        tabS.classList.remove('active');
    } else {
        upgradeShop.style.display = 'none';
        skinsShop.style.display   = '';
        tabU.classList.remove('active');
        tabS.classList.add('active');
        refreshSkinsPanel();
    }
}

function switchSkinSubtab(type) {
    const gc = document.getElementById('skin-grid-cannon');
    const gb = document.getElementById('skin-grid-bullet');
    const tc = document.getElementById('stab-cannon');
    const tb = document.getElementById('stab-bullet');
    if (type === 'cannon') {
        gc.style.display = ''; gb.style.display = 'none';
        tc.classList.add('active'); tb.classList.remove('active');
    } else {
        gc.style.display = 'none'; gb.style.display = '';
        tc.classList.remove('active'); tb.classList.add('active');
    }
}

function refreshSkinsPanel() {
    _renderSkinGrid('cannon', CANNON_SKINS, 'skin-grid-cannon');
    _renderSkinGrid('bullet', BULLET_SKINS, 'skin-grid-bullet');
}

function _renderSkinGrid(type, catalog, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const activeId = type === 'cannon' ? gameState.skins.activeCannon : gameState.skins.activeBullet;

    grid.innerHTML = catalog.map(skin => {
        const isUnlocked = gameState.hasSkinUnlocked(skin.id, type);
        const isEquipped = activeId === skin.id;
        const canAfford  = skin.price > 0 && gameState.totalDiamonds >= skin.price;
        const statusClass = isEquipped ? 'equipped' : isUnlocked ? 'unlocked' : 'locked';

        let priceText;
        if (skin.price > 0)       priceText = `💎 ${skin.price.toLocaleString()}`;
        else if (skin.mission)    priceText = skin.mission.text;
        else                      priceText = 'חינם';

        let btn;
        if (isEquipped) {
            btn = `<div class="skin-card-btn btn-equipped">✓ לובש</div>`;
        } else if (isUnlocked) {
            btn = `<button class="skin-card-btn btn-equip" onclick="equipSkin('${skin.id}','${type}')">ללבוש</button>`;
        } else if (skin.mission) {
            btn = `<div class="skin-card-btn btn-locked">🔒 ${skin.mission.text}</div>`;
        } else if (canAfford) {
            btn = `<button class="skin-card-btn btn-buy" onclick="buySkin('${skin.id}','${type}')">💎 קנה</button>`;
        } else {
            btn = `<div class="skin-card-btn btn-locked">💎 ${skin.price.toLocaleString()}</div>`;
        }

        const rarity = skin.rarity || 'common';
        const rarityLabels = { rare: 'נדיר', epic: 'אפי', legendary: 'מיתי' };
        const rarityBadge = rarity !== 'common'
            ? `<div class="skin-rarity-badge ${rarity}">${rarityLabels[rarity]}</div>`
            : '';

        return `<div class="skin-card ${statusClass} rarity-${rarity}">
            ${rarityBadge}
            <canvas class="skin-card-canvas" width="60" height="60" data-skin="${skin.id}" data-type="${type}"></canvas>
            <div class="skin-card-name">${skin.name}</div>
            <div class="skin-card-price">${priceText}</div>
            ${btn}
        </div>`;
    }).join('');

    _ensurePreviewAnim();
}

function buySkin(id, type) {
    sound.unlock();
    if (gameState.buySkin(id, type)) {
        sound.upgrade();
        refreshSkinsPanel();
        refreshHomeScreen();
    }
}

function equipSkin(id, type) {
    sound.unlock();
    if (gameState.equipSkin(id, type)) {
        sound.upgrade();
        refreshSkinsPanel();
    }
}

let _prevBankCoins = -1;

function refreshHomeScreen() {
    const bankEl   = document.getElementById('bank-amount');
    const newCoins = gameState.totalCoins;
    bankEl.textContent = newCoins.toLocaleString();
    bankEl.classList.toggle('dev-override', devMode);
    if (_prevBankCoins >= 0 && newCoins > _prevBankCoins) {
        bankEl.classList.remove('bank-amount-bump');
        void bankEl.offsetWidth; // force reflow to restart animation
        bankEl.classList.add('bank-amount-bump');
    }
    _prevBankCoins = newCoins;

    document.getElementById('hs-wave').textContent = gameState.highScore;

    const MAX_LEVELS = { fireRate: 10, damage: 8, multiShot: 15, ballSize: Infinity, lives: Infinity };
    const meta = {
        fireRate:  { icon: '⚡', name: 'קצב ירי',   desc: lv => `${Math.round(10 / Math.max(0.025, 0.16 - (lv-1)*0.015))/10} כדורים/שנ'` },
        damage:    { icon: '💥', name: 'עוצמה',     desc: lv => `נזק ${Math.min(8, lv)} לכדור` },
        multiShot: { icon: '🎯', name: 'רב-כדורי',  desc: lv => { const cycle = Math.floor((lv-1)/5); const bullets = ((lv-1)%5)+1; return cycle > 0 ? `${bullets} כדורים ×${Math.pow(10,cycle)} נזק` : `${bullets} כדורים במקביל`; } },
        ballSize:  { icon: '🔵', name: 'גודל כדור', desc: lv => `רדיוס ${9 + (lv-1)*2}` },
        lives:     { icon: '❤️', name: 'חיים',       desc: lv => `${lv} חיים למשחק` },
    };
    for (const [type, m] of Object.entries(meta)) {
        const btn   = document.getElementById('btn-' + type);
        if (!btn) continue;
        const lv    = gameState.upgrades[type];
        const cost  = gameState.upgradeCost(type);
        const isMax = lv >= MAX_LEVELS[type];
        if (isMax) {
            btn.innerHTML = `${m.icon} ${m.name}<br><small>${m.desc(lv)}</small><small><span class="max-badge">MAX</span></small>`;
            btn.className = 'upgrade-btn max-level';
            btn.disabled  = true;
        } else {
            // פרסטיג' = רמה נוכחית מחולקת ב-5 ללא שארית (5, 10, 15) → הרכישה הבאה מאפסת לכדור 1 ×10 נזק
            const isPrestige = type === 'multiShot' && lv > 0 && lv % 5 === 0;
            const canAfford  = gameState.canAfford(type);
            if (isPrestige) {
                const nextCycle = Math.floor(lv / 5);
                const mult = Math.pow(10, nextCycle);
                btn.innerHTML = `🔥 ${m.name} — פרסטיג'!<br><small>← 1 כדור ×${mult} נזק</small><small>Lv.${lv} · 🪙${cost.toLocaleString()}</small>`;
            } else {
                btn.innerHTML = `${m.icon} ${m.name}<br><small>${m.desc(lv)}</small><small>Lv.${lv} · 🪙${cost.toLocaleString()}</small>`;
            }
            btn.className = 'upgrade-btn' + (canAfford ? ' affordable' : '') + (isPrestige ? ' prestige' : '');
            btn.disabled  = false;
        }
    }
}

// ── Pause ─────────────────────────────────
function togglePause() {
    if (gameState.status !== 'playing') return;
    gamePaused = !gamePaused;
    document.getElementById('pause-overlay').style.display = gamePaused ? 'flex' : 'none';
    document.getElementById('pause-btn').textContent = gamePaused ? '▶' : '⏸';
    if (!gamePaused) {
        // מאפס את lastTime כדי שלא תהיה קפיצה בזמן
        lastTime = performance.now();
    }
}

function exitToHome() {
    gamePaused = false;
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('pause-btn').textContent = '⏸';
    returnToHome();
}

// ── Screen transitions ────────────────────
function startGame() {
    sound.unlock();
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';

    // Roguelite: always start at wave 1 (dev mode can override)
    const startWave = devMode
        ? Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1)
        : 1;
    gameState.startNewGame(startWave);
    if (devMode) {
        const boostId = document.getElementById('dev-boost').value;
        if (boostId) gameState.runUpgrades.push(boostId);
    }
    gameState.recordDayPlayed();

    initEntities();
    lastTime    = performance.now();
    gameRunning = true;
    gamePaused  = false;
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('pause-btn').textContent = '⏸';
    requestAnimationFrame(gameLoop);
}

function returnToHome() {
    gameRunning = false;
    gamePaused  = false;
    gameState.status = 'home';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('home-screen').style.display = 'flex';
    refreshHomeScreen();
    refreshSkinsPanel();
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
    healKillCount     = 0;
    upgradePickOptions = [];
    bossActive      = false;
    bosses          = [];
    bossBullets     = [];
    bossAnnounceT   = 0;
    bossAnnounceTxt = '';
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
        bossBullets = bossBullets.filter(bb => !bb.dead);

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
                floatingTexts.push(new FloatingText(bx, by - 50, '✂️ מתפצל!', '#ffaa44', 24));
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
            floatingTexts.push(new FloatingText(CANVAS_W / 2, CANVAS_H * 0.42, '💀 בוס הובס!', '#ffcc00', 34));
        }

        // ניקוי + דלג על waveManager בזמן קרב בוס
        bullets  = bullets.filter(b => !b.dead);
        enemies  = enemies.filter(e => !e.dead);
        coins    = coins.filter(c   => !c.dead);
        powerups = powerups.filter(p => !p.dead);
        if (announceT > 0) announceT -= delta;
        gameState.wave = waveManager.wave;
        return;
    }
    // ── סוף גל בוס ────────────────────────────────────────────

    const activeCount = enemies.filter(e => !e.dead).length;
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
    // כדורי בוס ועל גוף הבוס — בתוך ה-screenShake
    if (bossActive) {
        bossBullets.forEach(bb => bb.draw(ctx));
        bosses.forEach(b => b.drawBody(ctx));
    }
    drawWorldEffects(ctx);
    bullets.forEach(b => b.draw(ctx));
    cannon.draw(ctx);

    screenShake.restore(ctx);

    ui.drawHUD(ctx, gameState.sessionCoins, waveManager ? waveManager.wave : 1, gameState.currentLives, gameState.upgrades.lives);
    // פס חיים של בוס (מעל ה-HUD, לא רועד)
    if (bossActive) {
        bosses.forEach(b => b.drawHUD(ctx));
    }
    drawUIEffects(ctx);

    // Wave announce only when picker is NOT open and no boss
    if (announceT > 0 && upgradePickOptions.length === 0 && !bossActive) {
        ui.drawWaveAnnounce(ctx, lastWave, announceT / 2.0);
    }

    // הכרזת בוס
    if (bossActive && bossAnnounceT > 0) {
        const alpha = Math.min(1.0, bossAnnounceT);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 33px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // צל
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(bossAnnounceTxt, CANVAS_W / 2 + 2, CANVAS_H * 0.48 + 2);
        // טקסט
        ctx.fillStyle = '#ff4444';
        ctx.fillText(bossAnnounceTxt, CANVAS_W / 2, CANVAS_H * 0.48);
        ctx.restore();
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
    if (gamePaused) {
        lastTime = ts;
        requestAnimationFrame(gameLoop);
        return;
    }
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
refreshSkinsPanel();
