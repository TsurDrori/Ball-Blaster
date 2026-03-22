// ─── Skin catalogue ───────────────────────────────────────────────────────────

const CANNON_SKINS = [
    { id: 'default', name: 'תותח רגיל',  emoji: '🔫', price: 0,   mission: null,                                                rarity: 'common'    },
    { id: 'gold',    name: 'תותח זהב',   emoji: '✨',  price: 40,  mission: null,                                                rarity: 'common'    },
    { id: 'diamond', name: 'תותח יהלום', emoji: '💎',  price: 70,  mission: null,                                                rarity: 'rare'      },
    { id: 'rocket',  name: 'רקטן',       emoji: '🚀',  price: 90,  mission: null,                                                rarity: 'rare'      },
    { id: 'rainbow', name: 'קשת בענן',   emoji: '🌈',  price: 0,   mission: { id: 'buy_4_skins',   text: 'קנה 4 סקינים' },      rarity: 'epic'      },
    { id: 'dragon',  name: 'דרקון',      emoji: '🐲',  price: 120, mission: null,                                                rarity: 'legendary' },
    { id: 'shark',   name: 'כריש',       emoji: '🦈',  price: 70,  mission: null,                                                rarity: 'rare'      },
    { id: 'unicorn', name: 'חד קרן',     emoji: '🦄',  price: 0,   mission: { id: 'reach_wave_15', text: 'הגע לגל 15' },        rarity: 'legendary' },
];

const BULLET_SKINS = [
    { id: 'default',   name: 'כדורים רגילים', emoji: '🔵', price: 0,  mission: null,                                                    rarity: 'common'    },
    { id: 'purple',    name: 'סגולים',        emoji: '💜', price: 20, mission: null,                                                    rarity: 'common'    },
    { id: 'star',      name: 'כוכבים',        emoji: '⭐', price: 50, mission: null,                                                    rarity: 'common'    },
    { id: 'ice',       name: 'קרח',           emoji: '❄️', price: 65, mission: null,                                                    rarity: 'rare'      },
    { id: 'ruby',      name: 'יהלומי אודם',   emoji: '🔴', price: 0,  mission: { id: 'firerate_lv4', text: 'שדרג קצב ירי לרמה 4' },    rarity: 'epic'      },
    { id: 'lightning', name: 'ברק',           emoji: '⚡', price: 50, mission: null,                                                    rarity: 'rare'      },
    { id: 'donut',     name: 'דונאט',         emoji: '🍩', price: 20, mission: null,                                                    rarity: 'common'    },
    { id: 'skull',     name: 'גולגולת',       emoji: '💀', price: 35, mission: null,                                                    rarity: 'common'    },
    { id: 'bubble',    name: 'בועת סבון',     emoji: '🫧', price: 20, mission: null,                                                    rarity: 'common'    },
    { id: 'target',    name: 'מטרה',          emoji: '🎯', price: 50, mission: null,                                                    rarity: 'rare'      },
    { id: 'clover',    name: 'תלתן מזל',      emoji: '🍀', price: 0,  mission: { id: 'reach_wave_20', text: 'הגע לגל 20' },            rarity: 'epic'      },
    { id: 'butterfly', name: 'פרפר',          emoji: '🦋', price: 0,  mission: { id: 'buy_5_skins',   text: 'קנה 5 סקינים' },          rarity: 'legendary' },
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
        case 'dragon':  _drawDragonCannon(ctx, cannon);  break;
        case 'shark':   _drawSharkCannon(ctx, cannon);   break;
        case 'unicorn': _drawUnicornCannon(ctx, cannon); break;
    }
}

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

// ─── Bullet skin draw dispatcher ─────────────────────────────────────────────
// ─── תצוגה מקדימה של סקין בכרטיס החנות ──────────────────────────────────────
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
