// ──────────────────────────────────────────
//  אפקטים חזותיים — מצב גלובלי ופונקציות עזר
//  הקלאסים והמאגר נמצאים ב-effects-classes.js
// ──────────────────────────────────────────

// ── Global Effects State ──────────────────
const screenShake    = new ScreenShake();
const floatingTexts  = [];
const shockwaves     = [];

function resetEffects() {
    screenShake._active = false;
    floatingTexts.length = 0;
    shockwaves.length    = 0;
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) _pPool[i].active = false;
}

function updateEffects(delta) {
    screenShake.update(delta);
    _updatePool(delta);
    for (const t of floatingTexts) t.update(delta);
    for (const s of shockwaves)    s.update(delta);
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        if (floatingTexts[i].isDead()) floatingTexts.splice(i, 1);
    }
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        if (shockwaves[i].isDead()) shockwaves.splice(i, 1);
    }
}

function drawWorldEffects(ctx) {
    // Shockwaves behind particles
    for (const s of shockwaves) s.draw(ctx);
    // Particles (additive glow ones go through composite ops internally)
    _drawPool(ctx);
}

function drawUIEffects(ctx) {
    // Floating text drawn last, above everything
    for (const t of floatingTexts) t.draw(ctx);
}

// ── FX Helpers ────────────────────────────

// Small hit spark on bullet-enemy collision
function fxHit(x, y, color, damage = 1) {
    const count = Math.min(14, 5 + Math.floor(Math.log2(damage + 1) * 2));
    for (let i = 0; i < count; i++) {
        _spawnP(x, y, {
            speed:   40 + Math.random() * 140,
            radius:  1.5 + Math.random() * 3,
            color:   Math.random() < 0.5 ? color : '#ffffff',
            gravity: 120,
            friction: 0.90,
            decay:   0.04 + Math.random() * 0.03,
            glow:    true,
        });
    }
    // Tiny shockwave
    shockwaves.push(new Shockwave(x, y, 'rgba(255,255,255,0.65)', 28, 140));
    // Subtle shake on hit (only if significant damage)
    if (damage >= 3) screenShake.trigger(0.08, 1.5);
}

// Big explosion when enemy dies
function fxEnemyDeath(x, y, color, hp) {
    const count  = Math.min(55, 18 + Math.floor(Math.log10(hp + 1) * 10));
    const colors = [color, '#FF8C00', '#FFD700', '#FF6347', '#ffffff', '#ffeeaa'];
    for (let i = 0; i < count; i++) {
        _spawnP(x, y, {
            speed:   30 + Math.random() * 320,
            radius:  2 + Math.random() * 8,
            color:   colors[Math.floor(Math.random() * colors.length)],
            gravity: 80,
            friction: 0.93,
            decay:   0.006 + Math.random() * 0.016,
            glow:    i < count * 0.6,
        });
    }
    // White shockwave
    shockwaves.push(new Shockwave(x, y, 'rgba(255,255,255,0.95)', 90, 250));
    // Colored secondary ring (starts bigger so it "chases" the first)
    shockwaves.push(new Shockwave(x, y, color.startsWith('#') ? hexToRgba(color, 0.7) : color, 75, 160, 12));
    // Screen shake proportional to enemy size
    const shakeMag = Math.min(15, 3.5 + Math.log10(hp + 1) * 3.5);
    screenShake.trigger(0.28, shakeMag);
    // Floating "KO!"
    floatingTexts.push(new FloatingText(x, y - 20, 'KO!', '#FF4500', 30));
}

// Gold sparkle when coin is collected
function fxCoinCollect(x, y, value) {
    for (let i = 0; i < 10; i++) {
        _spawnP(x, y, {
            speed:   30 + Math.random() * 120,
            radius:  2 + Math.random() * 4,
            color:   Math.random() < 0.65 ? '#FFD700' : '#FFF176',
            gravity: 150,
            friction: 0.94,
            decay:   0.028 + Math.random() * 0.02,
            glow:    true,
        });
    }
    // Floating "+N" text
    const color = value >= 50 ? '#ff9900' : value >= 10 ? '#FFD700' : '#FFF9C4';
    floatingTexts.push(new FloatingText(x, y - 8, `+${value}`, color, value >= 50 ? 22 : 17));
}

// Confetti rain when a wave clears
function fxWaveClear() {
    const colors = ['#FF4136', '#2ECC40', '#0074D9', '#FFDC00', '#FF69B4', '#7FDBFF', '#ffffff'];
    for (let i = 0; i < 90; i++) {
        const p = _getFreeParticle();
        if (!p) break;
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.1;
        const speed = 60 + Math.random() * 160;
        p.active   = true;
        p.x        = Math.random() * CANVAS_W;
        p.y        = -12;
        p.vx       = Math.cos(angle) * speed;
        p.vy       = Math.sin(angle) * speed;
        p.radius   = 4 + Math.random() * 5;
        p.color    = colors[Math.floor(Math.random() * colors.length)];
        p.alpha    = 1.0;
        p.life     = 1.0;
        p.gravity  = 60;
        p.friction = 0.995;
        p.decay    = 0.003 + Math.random() * 0.006;
        p.glow     = false;
    }
}

// Shield absorbed a hit — burst of blue sparks
function fxShieldBreak(x, y) {
    for (let i = 0; i < 32; i++) {
        _spawnP(x, y, {
            speed:    80 + Math.random() * 220,
            radius:   2 + Math.random() * 5,
            color:    Math.random() < 0.6 ? '#00aaff' : '#ffffff',
            gravity:  0,
            friction: 0.88,
            decay:    0.02 + Math.random() * 0.02,
            glow:     true,
        });
    }
    shockwaves.push(new Shockwave(x, y, 'rgba(0,180,255,0.9)', 110, 320));
    floatingTexts.push(new FloatingText(x, y - 32, '🛡️ חסם!', '#00aaff', 28));
}

// Powerup collected — burst + floating label
function fxPowerUpCollect(x, y, type) {
    const colorMap = { shield: '#00aaff', fire: '#ff6600', heart: '#ff2266', ice: '#aaf0ff' };
    const labelMap = { shield: '🛡️ הגנה!', fire: '🔥 אש!', heart: '❤️ +חיים!', ice: '❄️ הכל קפוא!' };
    const color    = colorMap[type] || '#ffffff';
    for (let i = 0; i < 22; i++) {
        _spawnP(x, y, {
            speed:    60 + Math.random() * 180,
            radius:   2 + Math.random() * 5,
            color:    Math.random() < 0.7 ? color : '#ffffff',
            gravity:  40,
            friction: 0.92,
            decay:    0.025 + Math.random() * 0.02,
            glow:     true,
        });
    }
    shockwaves.push(new Shockwave(x, y, hexToRgba(color, 0.8), 65, 210));
    floatingTexts.push(new FloatingText(x, y - 22, labelMap[type], color, 28));
}

// Helper: hex color to rgba string
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
