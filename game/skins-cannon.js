// ─── Cannon skins: Gold, Diamond, Rocket, Rainbow ────────────────────────────
// נטען אחרי skins.js

function _drawGoldCannon(ctx, c) {
    ctx.save();
    const t = performance.now() * 0.001;
    const { x, y, w, h } = c;

    const g = ctx.createRadialGradient(x, y, 8, x, y, 70);
    g.addColorStop(0, 'rgba(255,220,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 15, y + 10, 4, x, y + 20, w / 2);
    bg.addColorStop(0, '#ffe566'); bg.addColorStop(0.6, '#d4920a'); bg.addColorStop(1, '#7a4800');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#7a5000'; ctx.lineWidth = 2; ctx.stroke();

    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#c8780a'); bar.addColorStop(0.4, '#ffe566'); bar.addColorStop(1, '#8a5200');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#7a5000'; ctx.lineWidth = 2; ctx.stroke();

    for (const p of [0.33, 0.65]) {
        const ry = by + bh * p;
        const rg = ctx.createLinearGradient(bx - 5, 0, bx + bw + 5, 0);
        rg.addColorStop(0, '#c8780a'); rg.addColorStop(0.5, '#ffee00'); rg.addColorStop(1, '#c8780a');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.roundRect(bx - 5, ry - 4, bw + 10, 8, 4); ctx.fill();
    }

    ctx.fillStyle = '#c8780a';
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#7a5000'; ctx.lineWidth = 1.5; ctx.stroke();

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

    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 15, y + 8, 4, x, y + 20, w / 2);
    bg.addColorStop(0, '#d4f8ff'); bg.addColorStop(0.5, '#3090c8'); bg.addColorStop(1, '#0a2850');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#004488'; ctx.lineWidth = 2; ctx.stroke();

    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#1060a0'); bar.addColorStop(0.35, '#d4f8ff'); bar.addColorStop(0.65, '#80d0f8'); bar.addColorStop(1, '#082840');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#004488'; ctx.lineWidth = 2; ctx.stroke();

    for (const dy of [by + bh * 0.3, by + bh * 0.65]) {
        ctx.save(); ctx.translate(x, dy); ctx.rotate(Math.PI / 4);
        const dg = ctx.createLinearGradient(-6, -6, 6, 6);
        dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.5, '#88ddff'); dg.addColorStop(1, '#2288cc');
        ctx.fillStyle = dg; ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeStyle = '#004488'; ctx.lineWidth = 1; ctx.strokeRect(-5, -5, 10, 10);
        ctx.restore();
    }

    const mg = ctx.createLinearGradient(x - 21, 0, x + 21, 0);
    mg.addColorStop(0, '#1060a0'); mg.addColorStop(0.5, '#88ddff'); mg.addColorStop(1, '#1060a0');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#004488'; ctx.lineWidth = 1.5; ctx.stroke();

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

    const eg = ctx.createRadialGradient(x, y + 30, 5, x, y + 30, 55);
    eg.addColorStop(0, 'rgba(255,100,0,0.3)'); eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(x, y + 30, 55, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2 - 8, 20, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 10, y + 12, 3, x, y + 20, w / 2 - 8);
    bg.addColorStop(0, '#607080'); bg.addColorStop(1, '#101820');
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#304050'; ctx.lineWidth = 2; ctx.stroke();

    const bw = 24, bh = h + 10, bx = x - bw / 2, by = y - bh / 2 - 4;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#1a2030'); bar.addColorStop(0.4, '#4060a0'); bar.addColorStop(0.6, '#3050a0'); bar.addColorStop(1, '#0a1020');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
    ctx.strokeStyle = '#203050'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = 'rgba(255,60,0,0.85)';
    ctx.beginPath(); ctx.roundRect(bx, by + bh * 0.5, bw, 6, 2); ctx.fill();

    ctx.fillStyle = '#1a2a40';
    const finY = by + bh - 10;
    for (const dir of [-1, 1]) {
        const fx = x + dir * bw / 2;
        ctx.beginPath(); ctx.moveTo(fx, finY); ctx.lineTo(fx + dir * 14, finY + 18); ctx.lineTo(fx, finY + 14); ctx.closePath(); ctx.fill();
    }

    ctx.fillStyle = '#304060';
    ctx.beginPath(); ctx.moveTo(x, by - 12); ctx.lineTo(x - bw / 2, by + 4); ctx.lineTo(x + bw / 2, by + 4); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = '#203050'; ctx.lineWidth = 1.5; ctx.stroke();

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

    const g = ctx.createRadialGradient(x, y, 5, x, y, 75);
    g.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.28)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 75, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    bg.addColorStop(0,    `hsl(${hue % 360}, 80%, 45%)`);
    bg.addColorStop(0.33, `hsl(${(hue + 120) % 360}, 80%, 45%)`);
    bg.addColorStop(0.66, `hsl(${(hue + 240) % 360}, 80%, 45%)`);
    bg.addColorStop(1,    `hsl(${hue % 360}, 80%, 45%)`);
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();

    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, by, bx, by + bh);
    for (let i = 0; i <= 4; i++) {
        bar.addColorStop(i / 4, `hsl(${(hue + i * 72) % 360}, 80%, 55%)`);
    }
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = `hsl(${(hue + 180) % 360}, 80%, 50%)`;
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.stroke();

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
