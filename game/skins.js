// ─── Skin catalogue ───────────────────────────────────────────────────────────

const CANNON_SKINS = [
    { id: 'default', name: 'תותח רגיל',  emoji: '🔫', price: 0,    mission: null },
    { id: 'gold',    name: 'תותח זהב',   emoji: '✨',  price: 500,  mission: null },
    { id: 'diamond', name: 'תותח יהלום', emoji: '💎',  price: 900,  mission: null },
    { id: 'rocket',  name: 'רקטן',       emoji: '🚀',  price: 1400, mission: null },
    { id: 'rainbow', name: 'קשת בענן',   emoji: '🌈',  price: 0,    mission: { id: 'buy_4_skins',   text: 'קנה 4 סקינים' } },
];

const BULLET_SKINS = [
    { id: 'default', name: 'כדורים רגילים', emoji: '🔵', price: 0,   mission: null },
    { id: 'purple',  name: 'סגולים',        emoji: '💜', price: 350, mission: null },
    { id: 'star',    name: 'כוכבים',        emoji: '⭐', price: 650, mission: null },
    { id: 'ice',     name: 'קרח',           emoji: '❄️', price: 850, mission: null },
    { id: 'ruby',    name: 'יהלומי אודם',   emoji: '🔴', price: 0,   mission: { id: 'firerate_lv4', text: 'שדרג קצב ירי לרמה 4' } },
];

// ─── Helper: draw N-point star ────────────────────────────────────────────────
function _drawStar(ctx, cx, cy, r, points = 5) {
    const inner = r * 0.42;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle  = (i * Math.PI / points) - Math.PI / 2;
        const radius = i % 2 === 0 ? r : inner;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
}

// ─── Shared helpers for cannon skins ─────────────────────────────────────────
function _skinShield(ctx, c) {
    if (gameState.shieldTimer <= 0) return;
    const t = performance.now() * 0.003;
    const pulse = 0.82 + 0.18 * Math.sin(t * 3);
    const sr = 76 * pulse;
    ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t * 2);
    const sg = ctx.createRadialGradient(c.x, c.y, 20, c.x, c.y, sr);
    sg.addColorStop(0,   'rgba(0,180,255,0.05)');
    sg.addColorStop(0.7, 'rgba(0,140,255,0.25)');
    sg.addColorStop(1,   'rgba(0,80,255,0.05)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(c.x, c.y, sr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(0,220,255,${0.6 + 0.35 * Math.sin(t * 5)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, sr, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
}

function _skinMuzzleFlash(ctx, c, bx, by) {
    if (c.muzzleFlash <= 0) return;
    const alpha  = c.muzzleFlash / 0.06;
    const isFire = gameState.fireTimer > 0;
    ctx.globalAlpha = alpha * 0.9;
    const flash = ctx.createRadialGradient(c.x, by - 12, 0, c.x, by - 12, 38);
    if (isFire) {
        flash.addColorStop(0, '#ffffff'); flash.addColorStop(0.4, '#ff8800'); flash.addColorStop(1, 'rgba(255,40,0,0)');
    } else {
        flash.addColorStop(0, '#ffffaa'); flash.addColorStop(0.5, '#ffaa00'); flash.addColorStop(1, 'rgba(255,100,0,0)');
    }
    ctx.fillStyle = flash;
    ctx.beginPath(); ctx.arc(c.x, by - 12, isFire ? 38 : 32, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
}

function _skinHitFlash(ctx, c) {
    if (c.hitFlash <= 0) return;
    ctx.globalAlpha = (c.hitFlash / 0.5) * 0.6;
    ctx.fillStyle = '#ff2200';
    ctx.beginPath(); ctx.arc(c.x, c.y, 55, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
}

// ─── Cannon skin draw dispatcher ─────────────────────────────────────────────
function drawCannonSkin(ctx, cannon, skinId) {
    switch (skinId) {
        case 'gold':    _drawGoldCannon(ctx, cannon);    break;
        case 'diamond': _drawDiamondCannon(ctx, cannon); break;
        case 'rocket':  _drawRocketCannon(ctx, cannon);  break;
        case 'rainbow': _drawRainbowCannon(ctx, cannon); break;
    }
}

function _drawGoldCannon(ctx, c) {
    ctx.save();
    const t = performance.now() * 0.001;
    const { x, y, w, h } = c;

    // Glow
    const g = ctx.createRadialGradient(x, y, 8, x, y, 70);
    g.addColorStop(0, 'rgba(255,220,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // Base
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 15, y + 10, 4, x, y + 20, w / 2);
    bg.addColorStop(0, '#ffe566'); bg.addColorStop(0.6, '#d4920a'); bg.addColorStop(1, '#7a4800');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#7a5000'; ctx.lineWidth = 2; ctx.stroke();

    // Barrel
    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#c8780a'); bar.addColorStop(0.4, '#ffe566'); bar.addColorStop(1, '#8a5200');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#7a5000'; ctx.lineWidth = 2; ctx.stroke();

    // Rings
    for (const p of [0.33, 0.65]) {
        const ry = by + bh * p;
        const rg = ctx.createLinearGradient(bx - 5, 0, bx + bw + 5, 0);
        rg.addColorStop(0, '#c8780a'); rg.addColorStop(0.5, '#ffee00'); rg.addColorStop(1, '#c8780a');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.roundRect(bx - 5, ry - 4, bw + 10, 8, 4); ctx.fill();
    }

    // Muzzle
    ctx.fillStyle = '#c8780a';
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#7a5000'; ctx.lineWidth = 1.5; ctx.stroke();

    // Sparkles
    for (const [sx, sy, ph] of [[-20, -12, 0], [22, 6, 1.2], [-4, 26, 2.5]]) {
        const a = 0.5 + 0.5 * Math.sin(t * 3 + ph);
        ctx.globalAlpha = a; ctx.fillStyle = '#fff8aa';
        _drawStar(ctx, x + sx, y + sy, 4 + 2 * Math.sin(t * 2 + ph), 4);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    _skinMuzzleFlash(ctx, c, bx, by);
    _skinHitFlash(ctx, c);
    ctx.restore();
}

function _drawDiamondCannon(ctx, c) {
    ctx.save();
    const t = performance.now() * 0.001;
    const { x, y, w, h } = c;

    const g = ctx.createRadialGradient(x, y, 5, x, y, 80);
    g.addColorStop(0, 'rgba(100,220,255,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // Base
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 15, y + 8, 4, x, y + 20, w / 2);
    bg.addColorStop(0, '#d4f8ff'); bg.addColorStop(0.5, '#3090c8'); bg.addColorStop(1, '#0a2850');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#004488'; ctx.lineWidth = 2; ctx.stroke();

    // Barrel
    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#1060a0'); bar.addColorStop(0.35, '#d4f8ff'); bar.addColorStop(0.65, '#80d0f8'); bar.addColorStop(1, '#082840');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#004488'; ctx.lineWidth = 2; ctx.stroke();

    // Diamond gems on barrel
    for (const dy of [by + bh * 0.3, by + bh * 0.65]) {
        ctx.save(); ctx.translate(x, dy); ctx.rotate(Math.PI / 4);
        const dg = ctx.createLinearGradient(-6, -6, 6, 6);
        dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.5, '#88ddff'); dg.addColorStop(1, '#2288cc');
        ctx.fillStyle = dg; ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeStyle = '#004488'; ctx.lineWidth = 1; ctx.strokeRect(-5, -5, 10, 10);
        ctx.restore();
    }

    // Muzzle
    const mg = ctx.createLinearGradient(x - 21, 0, x + 21, 0);
    mg.addColorStop(0, '#1060a0'); mg.addColorStop(0.5, '#88ddff'); mg.addColorStop(1, '#1060a0');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#004488'; ctx.lineWidth = 1.5; ctx.stroke();

    // Sparkles
    for (const [sx, sy, ph] of [[-22, -16, 0.5], [18, 10, 1.8], [0, 28, 3.1]]) {
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.5 + ph));
        ctx.fillStyle = '#aaeeff';
        _drawStar(ctx, x + sx, y + sy, 4, 4); ctx.fill();
    }
    ctx.globalAlpha = 1;

    _skinMuzzleFlash(ctx, c, bx, by);
    _skinHitFlash(ctx, c);
    ctx.restore();
}

function _drawRocketCannon(ctx, c) {
    ctx.save();
    const { x, y, w, h } = c;

    // Exhaust glow
    const eg = ctx.createRadialGradient(x, y + 30, 5, x, y + 30, 55);
    eg.addColorStop(0, 'rgba(255,100,0,0.3)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(x, y + 30, 55, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // Base
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2 - 8, 20, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 10, y + 12, 3, x, y + 20, w / 2 - 8);
    bg.addColorStop(0, '#607080'); bg.addColorStop(1, '#101820');
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#304050'; ctx.lineWidth = 2; ctx.stroke();

    // Rocket body
    const bw = 24, bh = h + 10, bx = x - bw / 2, by = y - bh / 2 - 4;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#1a2030'); bar.addColorStop(0.4, '#4060a0'); bar.addColorStop(0.6, '#3050a0'); bar.addColorStop(1, '#0a1020');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
    ctx.strokeStyle = '#203050'; ctx.lineWidth = 2; ctx.stroke();

    // Red stripe
    ctx.fillStyle = 'rgba(255,60,0,0.85)';
    ctx.beginPath(); ctx.roundRect(bx, by + bh * 0.5, bw, 6, 2); ctx.fill();

    // Fins
    ctx.fillStyle = '#1a2a40';
    const finY = by + bh - 10;
    for (const dir of [-1, 1]) {
        const fx = x + dir * bw / 2;
        ctx.beginPath(); ctx.moveTo(fx, finY); ctx.lineTo(fx + dir * 14, finY + 18); ctx.lineTo(fx, finY + 14); ctx.closePath(); ctx.fill();
    }

    // Nose cone
    ctx.fillStyle = '#304060';
    ctx.beginPath(); ctx.moveTo(x, by - 12); ctx.lineTo(x - bw / 2, by + 4); ctx.lineTo(x + bw / 2, by + 4); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = '#203050'; ctx.lineWidth = 1.5; ctx.stroke();

    // Exhaust flame on fire
    if (c.muzzleFlash > 0) {
        const alpha = c.muzzleFlash / 0.06;
        const eh = 18 + Math.random() * 14;
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath(); ctx.moveTo(x - 8, by + bh); ctx.lineTo(x + 8, by + bh); ctx.lineTo(x, by + bh + eh); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.beginPath(); ctx.moveTo(x - 4, by + bh); ctx.lineTo(x + 4, by + bh); ctx.lineTo(x, by + bh + eh * 0.5); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
    }

    _skinHitFlash(ctx, c);
    ctx.restore();
}

function _drawRainbowCannon(ctx, c) {
    ctx.save();
    const t   = performance.now() * 0.001;
    const hue = (t * 60) % 360;
    const { x, y, w, h } = c;

    // Glow
    const g = ctx.createRadialGradient(x, y, 5, x, y, 75);
    g.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.28)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 75, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // Base
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    bg.addColorStop(0,    `hsl(${hue % 360}, 80%, 45%)`);
    bg.addColorStop(0.33, `hsl(${(hue + 120) % 360}, 80%, 45%)`);
    bg.addColorStop(0.66, `hsl(${(hue + 240) % 360}, 80%, 45%)`);
    bg.addColorStop(1,    `hsl(${hue % 360}, 80%, 45%)`);
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();

    // Barrel
    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, by, bx, by + bh);
    for (let i = 0; i <= 4; i++) {
        bar.addColorStop(i / 4, `hsl(${(hue + i * 72) % 360}, 80%, 55%)`);
    }
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

    // Muzzle
    ctx.fillStyle = `hsl(${(hue + 180) % 360}, 80%, 50%)`;
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.stroke();

    // Orbiting sparkles
    for (let i = 0; i < 4; i++) {
        const angle = t * 1.8 + i * Math.PI / 2;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i);
        ctx.fillStyle = `hsl(${(hue + i * 90) % 360}, 100%, 65%)`;
        _drawStar(ctx, x + Math.cos(angle) * 28, y + Math.sin(angle) * 18, 5, 5);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    _skinMuzzleFlash(ctx, c, bx, by);
    _skinHitFlash(ctx, c);
    ctx.restore();
}

// ─── Bullet skin draw dispatcher ─────────────────────────────────────────────
function drawBulletSkin(ctx, bullet, skinId) {
    switch (skinId) {
        case 'purple':  _drawPurpleBullet(ctx, bullet);  break;
        case 'star':    _drawStarBullet(ctx, bullet);    break;
        case 'ice':     _drawIceBullet(ctx, bullet);     break;
        case 'ruby':    _drawRubyBullet(ctx, bullet);    break;
    }
}

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
    // Crystal lines
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

