// ──────────────────────────────────────────
//  מערכת בוסים — נתונים + כדורי בוס
// ──────────────────────────────────────────

const BOSS_ROSTER = [
    'shooter', 'bomber', 'laser', 'exploder', 'shield',
    'spinner', 'swarm',  'teleporter', 'splitter', 'spiral',
];

const BOSS_NAMES = {
    shooter:    'הקלע',
    bomber:     'המפציץ',
    laser:      'הלייזר',
    exploder:   'המתפוצץ',
    shield:     'המגן',
    spinner:    'הסחרחר',
    swarm:      'הנחיל',
    teleporter: 'המעביר',
    splitter:   'המפצל',
    spiral:     'הספירלה',
};

const BOSS_ICONS = {
    shooter:    '\u25CE',
    bomber:     '\u2715',
    laser:      '\u00BB',
    exploder:   '\u2020',
    shield:     '\u25A0',
    spinner:    '\u2022',
    swarm:      '\u2736',
    teleporter: '\u25C6',
    splitter:   '\u00F7',
    spiral:     '\u2605',
};

// [dark, mid, light] — צבעי גוף לפי סוג
const BOSS_COLORS = {
    shooter:    ['#220044', '#7700cc', '#dd88ff'],
    bomber:     ['#3a1800', '#bb4400', '#ff8833'],
    laser:      ['#003333', '#009988', '#44ffee'],
    exploder:   ['#440000', '#cc0000', '#ff6666'],
    shield:     ['#002244', '#005599', '#33aaff'],
    spinner:    ['#003322', '#006644', '#44cc88'],
    swarm:      ['#1a2800', '#446600', '#99cc33'],
    teleporter: ['#330022', '#990055', '#ff66aa'],
    splitter:   ['#442200', '#aa5500', '#ffaa44'],
    spiral:     ['#110033', '#550099', '#aa55ee'],
};

function getBossType(wave) {
    return BOSS_ROSTER[(Math.floor(wave / 5) - 1) % BOSS_ROSTER.length];
}

// ════════════════════════════════════════════════════════════
//  כדורי בוס
// ════════════════════════════════════════════════════════════
class BossBullet {
    constructor(x, y, vx, vy, opts = {}) {
        this.x      = x;
        this.y      = y;
        this.vx     = vx;
        this.vy     = vy;
        this.radius = opts.radius || 9;
        this.style  = opts.style  || 'normal'; // 'normal' | 'bomb' | 'laser'
        this.dead   = false;
        this.maxHp  = opts.hp || 1;
        this.hp     = this.maxHp;
    }

    hit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) this.dead = true;
    }

    update(delta) {
        if (gameState.iceTimer <= 0) {
            this.x += this.vx * delta;
            this.y += this.vy * delta;
        }
        if (this.y > CANVAS_H + 80 || this.x < -80 || this.x > CANVAS_W + 80 || this.y < -200) {
            this.dead = true;
        }
    }

    hitsCannon(cannon) {
        const cx = cannon.x, cy = cannon.y + 3;
        const hw = 58, hh = 40;
        const nearX = Math.max(cx - hw, Math.min(this.x, cx + hw));
        const nearY = Math.max(cy - hh, Math.min(this.y, cy + hh));
        const dx = this.x - nearX, dy = this.y - nearY;
        return (dx * dx + dy * dy) < this.radius * this.radius;
    }

    draw(ctx) {
        ctx.save();
        switch (this.style) {
            case 'bomb':  this._drawBomb(ctx);  break;
            case 'laser': this._drawLaser(ctx); break;
            default:      this._drawNormal(ctx); break;
        }
        ctx.restore();
    }

    _drawNormal(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.3);
        g.addColorStop(0,   'rgba(255,100,0,0.55)');
        g.addColorStop(0.5, 'rgba(200,0,0,0.22)');
        g.addColorStop(1,   'rgba(160,0,0,0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.3, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

        const b = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius);
        b.addColorStop(0,   '#ffcc88');
        b.addColorStop(0.5, '#ff4400');
        b.addColorStop(1,   '#880000');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = b; ctx.fill();
        ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    _drawBomb(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        g.addColorStop(0, 'rgba(255,110,0,0.5)'); g.addColorStop(1, 'rgba(100,0,0,0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill();
        ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 3; ctx.stroke();

        // פתיל מהבהב
        const t = _frameNow * 0.008;
        ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y - this.radius);
        ctx.lineTo(this.x + 6, this.y - this.radius - 7 + Math.sin(t * 8) * 2);
        ctx.stroke();
        if (Math.floor(t * 5) % 2 === 0) {
            ctx.beginPath();
            ctx.arc(this.x + 6, this.y - this.radius - 7, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffee00'; ctx.fill();
        }
    }

    _drawLaser(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.2);
        g.addColorStop(0, 'rgba(0,230,255,0.85)'); g.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
    }
}
// BossEnemy — ב-boss-enemy.js
