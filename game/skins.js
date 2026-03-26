// ─── Skin catalogue + helpers משותפים ─────────────────────────────────────────

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
// _drawGoldCannon, _drawDiamondCannon, _drawRocketCannon, _drawRainbowCannon — ב-skins-cannon.js
// _drawDragonCannon, _drawSharkCannon, _drawUnicornCannon — ב-skins-cannon-b.js
// _getSkinRarity, drawSkinPreview, drawBulletSkin — ב-skins-preview.js
// כל פונקציות ציור הכדורים — ב-skins-bullet.js
