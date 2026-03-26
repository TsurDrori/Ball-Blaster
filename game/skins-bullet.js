// ─── Bullet skin draw functions ───────────────────────────────────────────────
// נטען אחרי skins-preview.js

function _drawPurpleBullet(ctx, b) {
    ctx.save();
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.6);
    gl.addColorStop(0, 'rgba(180,0,255,0.6)'); gl.addColorStop(1, 'rgba(100,0,180,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.6, 0, Math.PI * 2); ctx.fill();
    const core = ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, 0, b.x, b.y, b.radius);
    core.addColorStop(0, '#ffffff'); core.addColorStop(0.3, '#dd88ff'); core.addColorStop(0.7, '#9900cc'); core.addColorStop(1, '#550077');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function _drawStarBullet(ctx, b) {
    ctx.save();
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 3);
    gl.addColorStop(0, 'rgba(255,230,50,0.7)'); gl.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 3, 0, Math.PI * 2); ctx.fill();
    const t = performance.now() * 0.003;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(t * 2);
    const core = ctx.createRadialGradient(-b.radius * 0.2, -b.radius * 0.2, 0, 0, 0, b.radius);
    core.addColorStop(0, '#ffffff'); core.addColorStop(0.4, '#ffee22'); core.addColorStop(1, '#ff8800');
    ctx.fillStyle = core;
    _drawStar(ctx, 0, 0, b.radius * 1.25, 5); ctx.fill();
    ctx.restore();
    ctx.restore();
}

function _drawIceBullet(ctx, b) {
    ctx.save();
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.8);
    gl.addColorStop(0, 'rgba(150,230,255,0.7)'); gl.addColorStop(1, 'rgba(50,150,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.8, 0, Math.PI * 2); ctx.fill();
    const core = ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, 0, b.x, b.y, b.radius);
    core.addColorStop(0, '#ffffff'); core.addColorStop(0.3, '#ddf8ff'); core.addColorStop(0.7, '#44aaee'); core.addColorStop(1, '#0044aa');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,240,255,0.7)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a) * b.radius, b.y + Math.sin(a) * b.radius);
        ctx.lineTo(b.x - Math.cos(a) * b.radius, b.y - Math.sin(a) * b.radius);
        ctx.stroke();
    }
    ctx.restore();
}

function _drawRubyBullet(ctx, b) {
    ctx.save();
    const t = performance.now() * 0.003;
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2.8);
    gl.addColorStop(0, 'rgba(255,0,80,0.7)'); gl.addColorStop(1, 'rgba(180,0,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.PI / 4 + t);
    const core = ctx.createLinearGradient(-b.radius, -b.radius, b.radius, b.radius);
    core.addColorStop(0, '#ffaaaa'); core.addColorStop(0.4, '#ff2244'); core.addColorStop(0.7, '#cc0022'); core.addColorStop(1, '#880000');
    ctx.fillStyle = core;
    const s = b.radius * 0.9; ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.restore();
    ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 2));
    ctx.fillStyle = '#ffcccc';
    ctx.beginPath(); ctx.arc(b.x - b.radius * 0.25, b.y - b.radius * 0.25, b.radius * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}

function _drawLightningBullet(ctx, b) {
    ctx.save();
    const r = b.radius;

    // זוהר חשמלי
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 3);
    gl.addColorStop(0, 'rgba(220,220,255,0.85)'); gl.addColorStop(1, 'rgba(80,80,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 3, 0, Math.PI * 2); ctx.fill();

    // צורת ברק ממש — חץ זיגזג
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
    // קו חיצוני — צהוב
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.moveTo( 4, -r * 1.1);
    ctx.lineTo(-2, -r * 0.1);
    ctx.lineTo( 4, -r * 0.1);
    ctx.lineTo(-4,  r * 1.1);
    ctx.lineTo( 2,  r * 0.05);
    ctx.lineTo(-4,  r * 0.05);
    ctx.closePath();
    ctx.fill();
    // פנים — לבן
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo( 2.5, -r * 0.9);
    ctx.lineTo(-1,   -r * 0.15);
    ctx.lineTo( 2.5, -r * 0.15);
    ctx.lineTo(-2.5,  r * 0.9);
    ctx.lineTo( 1,    r * 0.1);
    ctx.lineTo(-2.5,  r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.restore();
}

function _drawDonutBullet(ctx, b) {
    ctx.save();
    const r = b.radius;

    // זוהר
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 2.5);
    gl.addColorStop(0, 'rgba(255,180,200,0.5)'); gl.addColorStop(1, 'rgba(255,100,150,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 2.5, 0, Math.PI * 2); ctx.fill();

    // עוגה — חור עם composite
    ctx.fillStyle = '#c8703a';
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // ציפוי ורוד
    ctx.fillStyle = '#ff88aa';
    ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.83, Math.PI, 0); ctx.arc(b.x, b.y, r * 0.53, 0, Math.PI, true); ctx.closePath(); ctx.fill();

    // סוכריות צבעוניות
    const colors = ['#ff4444', '#44aaff', '#44ee88', '#ffee22', '#ff88ff'];
    for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + 0.3;
        const sr = r * 0.68;
        ctx.save();
        ctx.translate(b.x + Math.cos(a) * sr, b.y - Math.abs(Math.sin(a)) * sr * 0.5);
        ctx.rotate(a);
        ctx.fillStyle = colors[i];
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
    }
    ctx.restore();
}

function _drawSkullBullet(ctx, b) {
    ctx.save();
    const r = b.radius;

    // זוהר ירוק-אפל
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 2.8);
    gl.addColorStop(0, 'rgba(160,255,160,0.45)'); gl.addColorStop(1, 'rgba(0,120,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 2.8, 0, Math.PI * 2); ctx.fill();

    // גולגולת — גוף
    ctx.fillStyle = '#f0f0e8';
    ctx.beginPath(); ctx.arc(b.x, b.y - r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.fill();
    // לסת
    ctx.fillStyle = '#e0e0d8';
    ctx.beginPath(); ctx.roundRect(b.x - r * 0.55, b.y + r * 0.35, r * 1.1, r * 0.55, [0, 0, 5, 5]); ctx.fill();
    // שקעי עיניים
    ctx.fillStyle = '#111111';
    for (const ex of [b.x - r * 0.3, b.x + r * 0.3]) {
        ctx.beginPath(); ctx.ellipse(ex, b.y - r * 0.15, r * 0.22, r * 0.27, 0, 0, Math.PI * 2); ctx.fill();
    }
    // אף
    ctx.fillStyle = '#333333';
    ctx.beginPath(); ctx.arc(b.x, b.y + r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
    // שיניים
    ctx.strokeStyle = '#555555'; ctx.lineWidth = 1;
    for (const tx of [b.x - r * 0.28, b.x, b.x + r * 0.28]) {
        ctx.beginPath(); ctx.moveTo(tx, b.y + r * 0.35); ctx.lineTo(tx, b.y + r * 0.72); ctx.stroke();
    }
    // מתאר
    ctx.strokeStyle = '#999990'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(b.x, b.y - r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

function _drawBubbleBullet(ctx, b) {
    ctx.save();
    const t = performance.now() * 0.003;
    const r = b.radius;
    const hue = (t * 60) % 360;

    // זוהר קשת-בענן
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 2.8);
    gl.addColorStop(0, `hsla(${hue}, 80%, 80%, 0.3)`); gl.addColorStop(1, `hsla(${hue}, 60%, 60%, 0)`);
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 2.8, 0, Math.PI * 2); ctx.fill();

    // בועה — שקוף כמעט
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = `hsl(${hue}, 60%, 78%)`;
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // מסגרת קשת
    const rim = ctx.createLinearGradient(b.x - r, b.y - r, b.x + r, b.y + r);
    rim.addColorStop(0,   `hsl(${hue}, 90%, 80%)`);
    rim.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 90%, 80%)`);
    rim.addColorStop(1,   `hsl(${(hue + 240) % 360}, 90%, 80%)`);
    ctx.strokeStyle = rim; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.stroke();

    // נקודת ניצנוץ
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(b.x - r * 0.35, b.y - r * 0.35, r * 0.22, r * 0.14, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

function _drawTargetBullet(ctx, b) {
    ctx.save();
    const r = b.radius;

    // זוהר אדום
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 3);
    gl.addColorStop(0, 'rgba(255,50,50,0.4)'); gl.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 3, 0, Math.PI * 2); ctx.fill();

    // עיגולים קונצנטריים — מטרה
    const rings = ['#cc0000', '#ffffff', '#cc0000'];
    for (let i = rings.length - 1; i >= 0; i--) {
        ctx.fillStyle = rings[i];
        ctx.beginPath(); ctx.arc(b.x, b.y, r * (0.36 + i * 0.33), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function _drawCloverBullet(ctx, b) {
    ctx.save();
    const t = performance.now() * 0.003;
    const r = b.radius;

    // זוהר ירוק מזל
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 2.8);
    gl.addColorStop(0, 'rgba(80,200,80,0.6)'); gl.addColorStop(1, 'rgba(0,150,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 2.8, 0, Math.PI * 2); ctx.fill();

    // 4 עלים מסתובבים
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(t * 0.8);
    const lr = r * 0.65, lo = r * 0.5;
    for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        const lx = Math.cos(a) * lo, ly = Math.sin(a) * lo;
        const lg = ctx.createRadialGradient(lx - lr * 0.2, ly - lr * 0.2, 0, lx, ly, lr);
        lg.addColorStop(0, '#88ee88'); lg.addColorStop(0.6, '#22aa22'); lg.addColorStop(1, '#006600');
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    }
    // מרכז
    ctx.fillStyle = '#338833';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
}

function _drawButterflyBullet(ctx, b) {
    ctx.save();
    const t = performance.now() * 0.003;
    const r = b.radius;
    const hue = (t * 30) % 360;
    const flap = Math.sin(t * 8) * 0.35;

    // זוהר
    const gl = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 2.5);
    gl.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.4)`); gl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(b.x, b.y, r * 2.5, 0, Math.PI * 2); ctx.fill();

    // כנפיים
    ctx.save(); ctx.translate(b.x, b.y);
    for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1); ctx.rotate(flap * side);
        // כנף עליונה
        ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
        ctx.beginPath(); ctx.ellipse(r * 0.6, -r * 0.28, r * 0.72, r * 0.52, -0.4, 0, Math.PI * 2); ctx.fill();
        // כנף תחתונה
        ctx.fillStyle = `hsl(${(hue + 60) % 360}, 90%, 60%)`;
        ctx.beginPath(); ctx.ellipse(r * 0.5, r * 0.32, r * 0.48, r * 0.36, 0.3, 0, Math.PI * 2); ctx.fill();
        // נקודת עיצוב
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.22, r * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `hsl(${(hue + 180) % 360}, 80%, 30%)`;
        ctx.beginPath(); ctx.arc(r * 0.82, -r * 0.08, r * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    // גוף
    ctx.fillStyle = '#332211';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.16, r * 0.58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
}
