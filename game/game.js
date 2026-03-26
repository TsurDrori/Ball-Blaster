// ──────────────────────────────────────────
//  Ball Blast — main game loop
// ──────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let cannon, bullets, enemies, coins, powerups, waveManager, ui;
let lastTime          = 0;

// ── ביצועים ────────────────────────────────
// זמן הפריים הנוכחי — מוגדר פעם אחת בלולאה ומועבר לכל פונקציות הציור
let _frameNow = performance.now();

// מכווץ מערך בעצמו ללא הקצאה — מחליף את .filter(x => !x.dead)
function _compact(arr) {
    let w = 0;
    for (let i = 0; i < arr.length; i++) {
        if (!arr[i].dead) arr[w++] = arr[i];
    }
    arr.length = w;
}
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
    gameState.endGame();
    returnToHome();
}

// ── Screen transitions ────────────────────
function startGame() {
    sound.unlock();
    _stopPreviewAnim(); // עצור אנימציית סקינים בזמן משחק
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';

    // Roguelite: always start at wave 1 (dev mode can override)
    const startWave = devMode
        ? Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1)
        : 1;
    gameState.startNewGame(startWave);
    if (devMode) {
        const boostId = document.getElementById('dev-boost').value;
        if (boostId) gameState.runUpgrades.add(boostId);
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
    _frameNow = ts; // מעדכן פעם אחת בלולאה — נגיש לכל פונקציות הציור
    BG_SYSTEM.update(delta, waveManager ? waveManager.wave : 1);
    try {
        update(delta);
        render();
    } catch (err) {
        console.error('Game error:', err);
    }
    requestAnimationFrame(gameLoop);
}
