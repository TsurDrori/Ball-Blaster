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
    const { x, y, w, h } = c;

    // זוהר ים
    const g = ctx.createRadialGradient(x, y, 5, x, y, 72);
    g.addColorStop(0, 'rgba(0,100,200,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 72, 0, Math.PI * 2); ctx.fill();

    _skinShield(ctx, c);

    // בסיס
    ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 24, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 10, y + 10, 3, x, y + 20, w / 2);
    bg.addColorStop(0, '#6090c0'); bg.addColorStop(0.6, '#304878'); bg.addColorStop(1, '#101828');
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#203050'; ctx.lineWidth = 2; ctx.stroke();

    // קנה — גוף כריש
    const bw = 32, bh = h, bx = x - bw / 2, by = y - bh / 2;
    const sbar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    sbar.addColorStop(0, '#203050'); sbar.addColorStop(0.45, '#5888b8'); sbar.addColorStop(0.55, '#4070a0'); sbar.addColorStop(1, '#203050');
    ctx.fillStyle = sbar;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = '#203050'; ctx.lineWidth = 2; ctx.stroke();

    // בטן לבנה
    ctx.fillStyle = 'rgba(240,240,255,0.55)';
    ctx.beginPath(); ctx.roundRect(x - 5, by + 10, 10, bh - 20, 4); ctx.fill();

    // סנפיר גב
    ctx.fillStyle = '#304878';
    ctx.beginPath(); ctx.moveTo(x - 4, by + 10); ctx.lineTo(x + 13, by - 18); ctx.lineTo(x + 15, by + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#203050'; ctx.lineWidth = 1.5; ctx.stroke();

    // עין
    const eyeY = by + bh * 0.45;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x - 8, eyeY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(x - 7, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();

    // פה עם שיניים
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.roundRect(x - 20, by - 7, 40, 13, [0, 0, 6, 6]); ctx.fill();
    ctx.strokeStyle = '#882200'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
        const tx = x - 18 + i * 9;
        ctx.beginPath(); ctx.moveTo(tx, by - 7); ctx.lineTo(tx + 4, by - 16); ctx.lineTo(tx + 8, by - 7); ctx.closePath(); ctx.fill();
    }

    _skinMuzzleFlash(ctx, c, bx, by);
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
