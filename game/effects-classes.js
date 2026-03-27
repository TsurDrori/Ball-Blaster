// ──────────────────────────────────────────
//  קלאסים של אפקטים — ScreenShake, FloatingText, Shockwave, מאגר חלקיקים
//  נטען לפני effects.js
// ──────────────────────────────────────────

// ── Screen Shake ──────────────────────────
class ScreenShake {
    constructor() {
        this._active    = false;
        this.duration   = 0;
        this.magnitude  = 0;
        this.elapsed    = 0;
    }

    trigger(duration, magnitude) {
        const remaining = this._active ? this.magnitude * (1 - this.elapsed / this.duration) : 0;
        if (magnitude > remaining) {
            this.duration  = duration;
            this.magnitude = magnitude;
            this.elapsed   = 0;
            this._active   = true;
        }
    }

    update(delta) {
        if (!this._active) return;
        this.elapsed += delta;
        if (this.elapsed >= this.duration) this._active = false;
    }

    apply(ctx) {
        if (!this._active) return;
        const decay    = 1 - (this.elapsed / this.duration);
        const strength = this.magnitude * decay;
        ctx.save();
        ctx.translate(
            (Math.random() * 2 - 1) * strength,
            (Math.random() * 2 - 1) * strength
        );
    }

    restore(ctx) {
        if (this._active) ctx.restore();
    }
}

// ── אייקוני טקסט צף ───────────────────────
function _ftIconSkull(ctx, x, y, s, col) {
    // ראש עגול
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y - s * 0.04, s * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = s * 0.09; ctx.stroke();
    // עיניים ריקות
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.beginPath(); ctx.arc(x - s * 0.17, y - s * 0.1, s * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.17, y - s * 0.1, s * 0.13, 0, Math.PI * 2); ctx.fill();
    // חור אף
    ctx.beginPath(); ctx.arc(x, y + s * 0.07, s * 0.07, 0, Math.PI * 2); ctx.fill();
    // שיניים
    const tw = s * 0.11, th = s * 0.14, ty = y + s * 0.24;
    for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * (tw + s * 0.04) - tw * 0.5, ty, tw, th);
}

function _ftIconScissors(ctx, x, y, s, col) {
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
    // שני להבים
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.38); ctx.lineTo(x + s * 0.44, y + s * 0.38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.38); ctx.lineTo(x + s * 0.44, y - s * 0.38); ctx.stroke();
    // ציר
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.arc(x, y, s * 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // ידיות
    ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.arc(x - s * 0.54, y - s * 0.41, s * 0.16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - s * 0.54, y + s * 0.41, s * 0.16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function _drawFTIcon(ctx, icon, x, y, s, col) {
    ctx.save();
    if (icon === 'skull')    _ftIconSkull(ctx, x, y, s, col);
    if (icon === 'scissors') _ftIconScissors(ctx, x, y, s, col);
    ctx.restore();
}

// ── Floating Text ─────────────────────────
class FloatingText {
    constructor(x, y, text, color = '#FFD700', size = 22, icon = null) {
        this.x     = x;
        this.y     = y;
        this.text  = text;
        this.color = color;
        this.size  = size;
        this.icon  = icon;
        this.alpha = 1.0;
        this.vy    = -80;
        this.life  = 1.0;
        this.decay = 1.1;
        this.scale = 1.7;
    }

    update(delta) {
        this.y    += this.vy * delta;
        this.life -= this.decay * delta;
        this.alpha = Math.max(0, this.life);
        this.scale = Math.max(1.0, this.scale - 3.5 * delta);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha  = this.alpha;
        const fs = Math.floor(this.size * this.scale);
        ctx.font         = `bold ${fs}px Arial`;
        ctx.textBaseline = 'middle';

        if (this.icon) {
            const iconS  = fs * 0.55;
            const gap    = fs * 0.22;
            const tw     = ctx.measureText(this.text).width;
            const totalW = iconS * 2 + gap + tw;
            const iconX  = this.x - totalW / 2 + iconS;
            const textX  = this.x - totalW / 2 + iconS * 2 + gap;

            _drawFTIcon(ctx, this.icon, iconX, this.y, iconS, this.color);

            ctx.textAlign   = 'left';
            ctx.strokeStyle = 'rgba(0,0,0,0.75)';
            ctx.lineWidth   = 4;
            ctx.strokeText(this.text, textX, this.y);
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, textX, this.y);
        } else {
            ctx.textAlign   = 'center';
            ctx.strokeStyle = 'rgba(0,0,0,0.75)';
            ctx.lineWidth   = 4;
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x, this.y);
        }
        ctx.restore();
    }

    isDead() { return this.life <= 0; }
}

// ── Shockwave Ring ────────────────────────
class Shockwave {
    constructor(x, y, color = 'rgba(255,220,80,0.9)', maxRadius = 70, speed = 200) {
        this.x         = x;
        this.y         = y;
        this.radius    = 4;
        this.maxRadius = maxRadius;
        this.speed     = speed;
        this.color     = color;
        this.life      = 1.0;
        this.lineWidth = 5;
    }

    update(delta) {
        this.radius   += this.speed * delta;
        this.life      = Math.max(0, 1 - this.radius / this.maxRadius);
        this.lineWidth = Math.max(0.5, 5 * this.life);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha  = this.life;
        ctx.strokeStyle  = this.color;
        ctx.lineWidth    = this.lineWidth;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    isDead() { return this.life <= 0 || this.radius >= this.maxRadius; }
}

// ── Particle Pool ─────────────────────────
const PARTICLE_POOL_SIZE = 500;
const _pPool = [];
for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    _pPool.push({
        active: false, x: 0, y: 0,
        vx: 0, vy: 0,
        radius: 0, color: '#fff',
        alpha: 0, life: 0,
        gravity: 0, friction: 0.95,
        decay: 0.025, glow: false,
    });
}

let _pNext = 0;
function _getFreeParticle() {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const idx = (_pNext + i) % PARTICLE_POOL_SIZE;
        if (!_pPool[idx].active) {
            _pNext = (idx + 1) % PARTICLE_POOL_SIZE;
            return _pPool[idx];
        }
    }
    return null;
}

function _spawnP(x, y, opts) {
    const p = _getFreeParticle();
    if (!p) return;
    const angle = opts.angle ?? (Math.random() * Math.PI * 2);
    const speed = opts.speed ?? (50 + Math.random() * 150);
    p.active   = true;
    p.x = x; p.y = y;
    p.vx       = Math.cos(angle) * speed;
    p.vy       = Math.sin(angle) * speed;
    p.radius   = opts.radius  ?? (2 + Math.random() * 4);
    p.color    = opts.color   ?? '#ffffff';
    p.alpha    = 1.0;
    p.life     = 1.0;
    p.gravity  = opts.gravity  ?? 0;
    p.friction = opts.friction ?? 0.92;
    p.decay    = opts.decay    ?? 0.025;
    p.glow     = opts.glow     ?? false;
}

function _updatePool(delta) {
    const framesElapsed = delta * 60;
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = _pPool[i];
        if (!p.active) continue;
        p.vy      += p.gravity * delta;
        p.vx      *= Math.pow(p.friction, framesElapsed);
        p.vy      *= Math.pow(p.friction, framesElapsed);
        p.x       += p.vx * delta;
        p.y       += p.vy * delta;
        p.life    -= p.decay * framesElapsed;
        p.alpha    = Math.max(0, p.life);
        p.radius  *= 0.994;
        if (p.life <= 0) p.active = false;
    }
}

function _drawPool(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = _pPool[i];
        if (!p.active || p.alpha <= 0 || p.glow) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        const p = _pPool[i];
        if (!p.active || p.alpha <= 0 || !p.glow) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}
