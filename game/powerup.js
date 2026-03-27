// ── גרפיקות פאוור-אפ ──────────────────────────────────────────────────────────

function _puShield(ctx, x, y, r, col) {
    const s = r * 0.68;
    ctx.fillStyle = col;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - s, y - s * 0.72);
    ctx.lineTo(x + s, y - s * 0.72);
    ctx.lineTo(x + s, y + s * 0.02);
    ctx.quadraticCurveTo(x + s, y + s * 0.82, x, y + s * 1.12);
    ctx.quadraticCurveTo(x - s, y + s * 0.82, x - s, y + s * 0.02);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // קו אופקי פנימי
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = s * 0.18;
    ctx.beginPath(); ctx.moveTo(x - s * 0.78, y - s * 0.18); ctx.lineTo(x + s * 0.78, y - s * 0.18); ctx.stroke();
}

function _puFire(ctx, x, y, r, col) {
    const s = r * 0.75;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.quadraticCurveTo(x - s * 0.95, y + s * 0.2, x - s * 0.42, y - s * 0.28);
    ctx.quadraticCurveTo(x - s * 0.18, y - s * 0.78, x, y - s);
    ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.78, x + s * 0.42, y - s * 0.28);
    ctx.quadraticCurveTo(x + s * 0.95, y + s * 0.2, x, y + s);
    ctx.fill();
    // ליבה בהירה
    ctx.fillStyle = 'rgba(255,255,180,0.65)';
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.28);
    ctx.quadraticCurveTo(x - s * 0.32, y, x - s * 0.1, y - s * 0.32);
    ctx.quadraticCurveTo(x, y - s * 0.6, x + s * 0.1, y - s * 0.32);
    ctx.quadraticCurveTo(x + s * 0.32, y, x, y + s * 0.28);
    ctx.fill();
}

function _puHeart(ctx, x, y, r, col) {
    const s = r * 0.68;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.65);
    ctx.bezierCurveTo(x - s * 1.22, y + s * 0.08, x - s * 1.22, y - s, x, y - s * 0.22);
    ctx.bezierCurveTo(x + s * 1.22, y - s, x + s * 1.22, y + s * 0.08, x, y + s * 0.65);
    ctx.fill();
    // הדגשה
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.38, y - s * 0.32, s * 0.28, s * 0.18, -0.6, 0, Math.PI * 2);
    ctx.fill();
}

function _puIce(ctx, x, y, r, col) {
    const s = r * 0.72;
    ctx.strokeStyle = col; ctx.lineWidth = r * 0.15; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        // זרוע ראשית
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
        ctx.stroke();
        // ענפי V
        const bx = x + Math.cos(a) * s * 0.55, by = y + Math.sin(a) * s * 0.55;
        const pa = a + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(pa) * s * 0.28, by + Math.sin(pa) * s * 0.28);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx - Math.cos(pa) * s * 0.28, by - Math.sin(pa) * s * 0.28);
        ctx.stroke();
    }
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r * 0.13, 0, Math.PI * 2); ctx.fill();
}

// ── מחלקת PowerUp ──────────────────────────────────────────────────────────────
class PowerUp {
    constructor(x, type) {
        this.x      = x;
        this.y      = -20;
        this.vy     = 100 + Math.random() * 50;
        this.type   = type; // 'shield' | 'fire' | 'heart' | 'ice'
        this.radius = 16;
        this.dead   = false;
        this.age    = 0;
    }

    update(delta) {
        this.y   += this.vy * delta;
        this.age += delta;
        if (this.y > CANVAS_H + 40) this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        const pulse = 0.88 + 0.12 * Math.sin(this.age * 5);
        const r     = this.radius * pulse;

        // Outer glow
        const glowPalette = {
            shield: ['rgba(0,180,255,0.45)',   'rgba(0,100,255,0)'],
            fire:   ['rgba(255,140,0,0.45)',    'rgba(255,50,0,0)'],
            heart:  ['rgba(255,60,120,0.45)',   'rgba(220,0,80,0)'],
            ice:    ['rgba(180,240,255,0.55)',  'rgba(0,200,255,0)'],
        };
        const [g1, g2] = glowPalette[this.type];
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2.6);
        glow.addColorStop(0, g1);
        glow.addColorStop(1, g2);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Circle body
        const bgColors     = { shield: '#001840', fire: '#3a0e00', heart: '#380018', ice: '#001830' };
        const borderColors = { shield: '#00aaff', fire: '#ff6600', heart: '#ff2266', ice: '#aaf0ff' };
        ctx.fillStyle   = bgColors[this.type];
        ctx.strokeStyle = borderColors[this.type];
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // אייקון מצויר
        const iconColors = { shield: '#00aaff', fire: '#ff8800', heart: '#ff2266', ice: '#aaf0ff' };
        const col = iconColors[this.type] || '#ffffff';
        if      (this.type === 'shield') _puShield(ctx, this.x, this.y, r, col);
        else if (this.type === 'fire')   _puFire  (ctx, this.x, this.y, r, col);
        else if (this.type === 'heart')  _puHeart (ctx, this.x, this.y, r, col);
        else if (this.type === 'ice')    _puIce   (ctx, this.x, this.y, r, col);

        ctx.restore();
    }
}
