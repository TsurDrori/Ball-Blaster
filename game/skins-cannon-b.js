// ─── Cannon skins: Dragon, Shark, Unicorn ────────────────────────────────────
// נטען אחרי skins-cannon.js

function _drawDragonCannon(ctx, c) {
    ctx.save();
    const t = performance.now() * 0.001;
    const { x, y, w, h } = c;

    // אש זוהרת
    const g = ctx.createRadialGradient(x, y, 5, x, y, 80);
    g.addColorStop(0, 'rgba(255,80,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // בסיס — קשקשים אדום-שחור
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 10, y + 10, 4, x, y + 20, w / 2);
    bg.addColorStop(0, '#5a1010'); bg.addColorStop(0.6, '#380808'); bg.addColorStop(1, '#1a0404');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#600000'; ctx.lineWidth = 2; ctx.stroke();

    // קנה
    const bw = 30, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#1a0404'); bar.addColorStop(0.4, '#5a1010'); bar.addColorStop(1, '#1a0404');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
    ctx.strokeStyle = '#600000'; ctx.lineWidth = 2; ctx.stroke();

    // דוגמת קשקשים
    ctx.strokeStyle = 'rgba(180,30,30,0.55)'; ctx.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
            const sx = bx + 4 + col * 13;
            const sy = by + 12 + row * 17;
            ctx.beginPath(); ctx.arc(sx + 6, sy, 7, Math.PI, 0); ctx.stroke();
        }
    }

    // עיניים בוערות
    const eyeY = by + bh * 0.55;
    for (const ex of [x - 8, x + 8]) {
        ctx.fillStyle = `rgba(255,120,0,${0.7 + 0.3 * Math.sin(t * 2)})`;
        ctx.beginPath(); ctx.arc(ex, eyeY, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.arc(ex, eyeY, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // פה עם שיניים
    ctx.fillStyle = '#cc2200';
    ctx.beginPath(); ctx.roundRect(x - 21, by - 6, 42, 14, 5); ctx.fill();
    ctx.strokeStyle = '#600000'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffe8d0';
    for (let i = 0; i < 3; i++) {
        const tx = x - 12 + i * 12;
        ctx.beginPath(); ctx.moveTo(tx, by - 6); ctx.lineTo(tx + 5, by - 15); ctx.lineTo(tx + 10, by - 6); ctx.closePath(); ctx.fill();
    }

    // נשיפת אש
    if (c.muzzleFlash > 0) {
        const alpha = c.muzzleFlash / 0.06;
        ctx.globalAlpha = alpha;
        const fl = ctx.createRadialGradient(x, by - 15, 0, x, by - 15, 38);
        fl.addColorStop(0, '#ffffff'); fl.addColorStop(0.3, '#ff8800'); fl.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.fillStyle = fl;
        ctx.beginPath(); ctx.arc(x, by - 15, 38, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }

    _skinHitFlash(ctx, c);
    ctx.restore();
}

function _drawSharkCannon(ctx, c) {
    ctx.save();
    const t = performance.now() * 0.001;
    const { x, y } = c;

    // זוהר ים כחול
    const glow = ctx.createRadialGradient(x, y - 10, 5, x, y - 10, 80);
    glow.addColorStop(0, 'rgba(0,90,200,0.22)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y - 10, 80, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // קואורדינטות גוף הלויתן (ראש שמאל, זנב ימין, מבט צדדי)
    const cx = x - 4,  cy = y - 14;
    const rw = 46,     rh = 19;

    // === זנב ===
    ctx.fillStyle = '#1a3858';
    ctx.beginPath();
    ctx.moveTo(cx + rw - 5, cy - 5);
    ctx.lineTo(cx + rw + 19, cy - 16);
    ctx.lineTo(cx + rw + 13, cy);
    ctx.lineTo(cx + rw + 19, cy + 16);
    ctx.lineTo(cx + rw - 5, cy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0d2438'; ctx.lineWidth = 1.5; ctx.stroke();

    // === גוף ראשי ===
    const bodyGrad = ctx.createLinearGradient(cx, cy - rh, cx, cy + rh);
    bodyGrad.addColorStop(0, '#5a8ab8');
    bodyGrad.addColorStop(0.45, '#3a6888');
    bodyGrad.addColorStop(1, '#1e3d58');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d2438'; ctx.lineWidth = 2; ctx.stroke();

    // === בטן (חלק בהיר בתחתית הגוף) ===
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
    ctx.clip();
    const bellyGrad = ctx.createLinearGradient(cx, cy, cx, cy + rh);
    bellyGrad.addColorStop(0, 'rgba(200,228,248,0)');
    bellyGrad.addColorStop(0.5, 'rgba(200,228,248,0.62)');
    bellyGrad.addColorStop(1, 'rgba(215,235,252,0.88)');
    ctx.fillStyle = bellyGrad;
    ctx.fillRect(cx - rw, cy, rw * 2, rh + 2);
    ctx.restore();

    // === סנפיר גב (dorsal) ===
    ctx.fillStyle = '#2a5070';
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy - rh);
    ctx.lineTo(cx + 20, cy - rh - 21);
    ctx.lineTo(cx + 29, cy - rh + 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0d2438'; ctx.lineWidth = 1.5; ctx.stroke();

    // === סנפיר פקטורלי (קדמי-תחתון) ===
    ctx.fillStyle = '#2a5070';
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 6);
    ctx.lineTo(cx - 34, cy + 29);
    ctx.quadraticCurveTo(cx - 16, cy + rh + 4, cx - 8, cy + rh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0d2438'; ctx.lineWidth = 1.5; ctx.stroke();

    // === עין ===
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - 32, cy - 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00111e';
    ctx.beginPath(); ctx.arc(cx - 31, cy - 5, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx - 30, cy - 6.5, 1.1, 0, Math.PI * 2); ctx.fill();

    // === חצי פה (מהצד) ===
    ctx.strokeStyle = '#0d2438'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - rw + 2, cy + 3);
    ctx.quadraticCurveTo(cx - 42, cy + 12, cx - 28, cy + 10);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // === נחיר אחד ===
    ctx.fillStyle = '#0d2438';
    ctx.beginPath();
    ctx.ellipse(cx - 24, cy - rh + 4, 3.8, 2.2, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // === ארובה (blowhole) — מקום הירי ===
    const bhoX = cx - 14;
    const bhoY = cy - rh - 2;
    ctx.fillStyle = '#091c2e';
    ctx.beginPath();
    ctx.ellipse(bhoX, bhoY, 5, 3, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a5070'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(bhoX, bhoY, 5, 3, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    // === מים פורצים מהארובה (ירי) ===
    if (c.muzzleFlash > 0) {
        const frac = c.muzzleFlash / 0.06;
        ctx.globalAlpha = frac;

        // זוהר מים
        const wg = ctx.createRadialGradient(bhoX, bhoY - 14, 0, bhoX, bhoY - 14, 34);
        wg.addColorStop(0, 'rgba(160,230,255,0.9)');
        wg.addColorStop(1, 'rgba(0,120,220,0)');
        ctx.fillStyle = wg;
        ctx.beginPath(); ctx.arc(bhoX, bhoY - 14, 34, 0, Math.PI * 2); ctx.fill();

        // קרני מים
        ctx.strokeStyle = '#a0d8ff'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bhoX, bhoY); ctx.lineTo(bhoX - 4, bhoY - 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bhoX, bhoY); ctx.lineTo(bhoX + 9, bhoY - 27); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bhoX, bhoY); ctx.lineTo(bhoX - 11, bhoY - 21); ctx.stroke();
        ctx.lineCap = 'butt';

        // טיפות מים
        ctx.fillStyle = '#c8eaff';
        for (let i = 0; i < 6; i++) {
            const ox = Math.sin(i * 2.09 + t * 8) * 11;
            const oy = -(9 + i * 5.5);
            ctx.beginPath(); ctx.arc(bhoX + ox, bhoY + oy, 2.4 - i * 0.12, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // === בסיס מים ===
    const wBase = ctx.createLinearGradient(x, y + 4, x, y + 44);
    wBase.addColorStop(0, 'rgba(22,65,140,0.55)');
    wBase.addColorStop(1, 'rgba(8,28,75,0)');
    ctx.fillStyle = wBase;
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 64, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // גלים קטנים
    ctx.strokeStyle = 'rgba(120,195,255,0.4)'; ctx.lineWidth = 1.5;
    for (let wi = 0; wi < 3; wi++) {
        const wox = (wi - 1) * 22;
        ctx.beginPath();
        ctx.moveTo(x - 40 + wox, y + 18);
        ctx.quadraticCurveTo(x - 30 + wox, y + 13, x - 20 + wox, y + 18);
        ctx.stroke();
    }

    _skinHitFlash(ctx, c);
    ctx.restore();
}

function _drawUnicornCannon(ctx, c) {
    ctx.save();
    const t = performance.now() * 0.001;
    const hue = (t * 50) % 360;
    const { x, y, w, h } = c;

    // זוהר קשת
    const g = ctx.createRadialGradient(x, y, 5, x, y, 80);
    g.addColorStop(0, `hsla(${hue}, 100%, 75%, 0.3)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 80, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // בסיס — ורוד
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 12, y + 8, 4, x, y + 20, w / 2);
    bg.addColorStop(0, '#ffccee'); bg.addColorStop(0.6, '#dd66aa'); bg.addColorStop(1, '#882266');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#993366'; ctx.lineWidth = 2; ctx.stroke();

    // קנה — לבן
    const bw = 28, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bar.addColorStop(0, '#ddaacc'); bar.addColorStop(0.5, '#ffffff'); bar.addColorStop(1, '#ddaacc');
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = '#cc88bb'; ctx.lineWidth = 2; ctx.stroke();

    // פסים קשת על הקנה
    for (let i = 0; i < 4; i++) {
        const ry = by + bh * 0.12 + i * bh * 0.2;
        ctx.fillStyle = `hsl(${(hue + i * 90) % 360}, 90%, 65%)`;
        ctx.beginPath(); ctx.roundRect(bx + 3, ry, bw - 6, 5, 2); ctx.fill();
    }

    // קרן — ספירלה
    ctx.save(); ctx.translate(x, by - 4);
    const hornH = 32;
    const hornG = ctx.createLinearGradient(0, 0, 0, -hornH);
    hornG.addColorStop(0, `hsl(${hue}, 80%, 70%)`); hornG.addColorStop(1, '#ffffff');
    ctx.fillStyle = hornG;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, -hornH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `hsl(${(hue + 60) % 360}, 80%, 60%)`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = `hsl(${(hue + 180) % 360}, 80%, 80%)`; ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const ypos = -(hornH * i / 4);
        ctx.beginPath(); ctx.moveTo(-7 + i * 1.5, ypos); ctx.lineTo(7 - i * 1.5, ypos - 7); ctx.stroke();
    }
    ctx.restore();

    // ניצוצות מקיפים
    for (let i = 0; i < 4; i++) {
        const sa = t * 2 + i * Math.PI / 2;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.fillStyle = `hsl(${(hue + i * 90) % 360}, 100%, 70%)`;
        _drawStar(ctx, x + Math.cos(sa) * 26, y + Math.sin(sa) * 18, 4, 4);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    _skinMuzzleFlash(ctx, c, bx, by);
    _skinHitFlash(ctx, c);
    ctx.restore();
}
