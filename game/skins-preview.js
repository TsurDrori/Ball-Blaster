// ─── תצוגה מקדימה של סקינים + dispatcher של כדורים ──────────────────────────
// נטען אחרי skins-cannon-b.js

function _getSkinRarity(skinId, type) {
    const catalog = type === 'cannon' ? CANNON_SKINS : BULLET_SKINS;
    const s = catalog.find(sk => sk.id === skinId);
    return s ? (s.rarity || 'common') : 'common';
}

function drawSkinPreview(canvas, skinId, type) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Rarity-tinted background
    const rarity = _getSkinRarity(skinId, type);
    const bgMap = {
        common:    ['#1c2535', '#080e18'],
        rare:      ['#162045', '#060f1e'],
        epic:      ['#1e0f38', '#090416'],
        legendary: ['#2c1100', '#100400'],
    };
    const [bc0, bc1] = bgMap[rarity] || bgMap.common;
    const rbg = ctx.createRadialGradient(w * 0.38, h * 0.32, 2, w / 2, h / 2, w * 0.75);
    rbg.addColorStop(0, bc0);
    rbg.addColorStop(1, bc1);
    ctx.fillStyle = rbg;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();

    if (type === 'cannon') {
        if (skinId === 'default') {
            const cx = w / 2, cy = h * 0.62;
            const bg = ctx.createRadialGradient(cx - 5, cy + 4, 2, cx, cy + 8, 18);
            bg.addColorStop(0, '#8899aa'); bg.addColorStop(1, '#334455');
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.ellipse(cx, cy + 8, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
            const bar = ctx.createLinearGradient(cx - 7, 0, cx + 7, 0);
            bar.addColorStop(0, '#445566'); bar.addColorStop(0.5, '#8899aa'); bar.addColorStop(1, '#445566');
            ctx.fillStyle = bar;
            ctx.beginPath(); ctx.roundRect(cx - 7, cy - 20, 14, 28, 4); ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.stroke();
        } else {
            ctx.save();
            ctx.scale(0.5, 0.5);
            const fakeCannon = { x: w, y: 68, w: 52, h: 58, muzzleFlash: 0, hitFlash: 0 };
            drawCannonSkin(ctx, fakeCannon, skinId);
            ctx.restore();
        }
    } else {
        if (skinId === 'default') {
            const r = w * 0.28;
            const g = ctx.createRadialGradient(w/2 - r*0.3, h/2 - r*0.3, 1, w/2, h/2, r);
            g.addColorStop(0, '#88aaff'); g.addColorStop(1, '#2244bb');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(w/2, h/2, r, 0, Math.PI*2); ctx.fill();
        } else {
            const fakeBullet = { x: w/2, y: h/2, radius: w * 0.28 };
            drawBulletSkin(ctx, fakeBullet, skinId);
        }
    }

    // Rarity edge glow overlay
    const glowMap = {
        rare:      'rgba(70,110,230,0.38)',
        epic:      'rgba(140,55,220,0.42)',
        legendary: 'rgba(220,95,0,0.48)',
    };
    if (glowMap[rarity]) {
        const eg = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.78);
        eg.addColorStop(0, 'rgba(0,0,0,0)');
        eg.addColorStop(1, glowMap[rarity]);
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 8);
        ctx.fill();
    }
}

function drawBulletSkin(ctx, bullet, skinId) {
    switch (skinId) {
        case 'purple':    _drawPurpleBullet(ctx, bullet);    break;
        case 'star':      _drawStarBullet(ctx, bullet);      break;
        case 'ice':       _drawIceBullet(ctx, bullet);       break;
        case 'ruby':      _drawRubyBullet(ctx, bullet);      break;
        case 'lightning': _drawLightningBullet(ctx, bullet); break;
        case 'donut':     _drawDonutBullet(ctx, bullet);     break;
        case 'skull':     _drawSkullBullet(ctx, bullet);     break;
        case 'bubble':    _drawBubbleBullet(ctx, bullet);    break;
        case 'target':    _drawTargetBullet(ctx, bullet);    break;
        case 'clover':    _drawCloverBullet(ctx, bullet);    break;
        case 'butterfly': _drawButterflyBullet(ctx, bullet); break;
    }
}
