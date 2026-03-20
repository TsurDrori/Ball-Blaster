// Card layout shared by draw and click-detection
function pickerCardRects(count) {
    const cardW = 130, cardH = 170, gap = 16;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (CANVAS_W - totalW) / 2;
    const y = 220;
    return Array.from({ length: count }, (_, i) => ({
        x: startX + i * (cardW + gap),
        y,
        w: cardW,
        h: cardH,
    }));
}

class UI {
    constructor() {
        this._coinAnim = 0;
    }

    drawHUD(ctx, coins, wave, currentLives, maxLives) {
        ctx.save();

        // Top bar
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CANVAS_W, 48);

        // Coin icon + count
        this._drawCoinIcon(ctx, 14, 24, 11);
        ctx.fillStyle    = '#ffd700';
        ctx.font         = 'bold 20px Arial';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(coins.toLocaleString(), 34, 24);

        // Wave
        ctx.fillStyle    = 'white';
        ctx.font         = 'bold 20px Arial';
        ctx.textAlign    = 'center';
        ctx.fillText('Wave ' + wave, CANVAS_W / 2, 24);

        // Lives (hearts) — only show if maxLives > 1
        if (maxLives > 1) {
            const heartSize = 16;
            const spacing   = 20;
            const totalW    = maxLives * spacing - (spacing - heartSize);
            let hx = CANVAS_W - 12 - totalW;
            for (let i = 0; i < maxLives; i++) {
                ctx.font      = `${heartSize}px Arial`;
                ctx.textAlign = 'left';
                ctx.globalAlpha = i < currentLives ? 1 : 0.25;
                ctx.fillText('❤️', hx, 24 - heartSize / 2 + 2);
                hx += spacing;
            }
            ctx.globalAlpha = 1;
        }

        // Active powerup timer bars
        const shieldT = gameState.shieldTimer || 0;
        const fireT   = gameState.fireTimer   || 0;
        if (shieldT > 0 || fireT > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 48, CANVAS_W, 20);
            let bx = 8;
            if (shieldT > 0) { this._drawPowerBar(ctx, bx, 58, shieldT, 8,  '🛡️', '#00aaff'); bx += 158; }
            if (fireT   > 0) { this._drawPowerBar(ctx, bx, 58, fireT,   10, '🔥', '#ff6600'); }
        }

        // Active run upgrades strip (small icons below powerup bars)
        const runUps = gameState.runUpgrades;
        if (runUps.length > 0) {
            const RUN_ICONS = {
                magnetic: '🧲', gold_rush: '💰', bouncy: '🎱', rapid: '⚡',
                pierce: '🏹', shield_up: '🛡️', double_heart: '💝', marked: '🎯',
            };
            const barY = (shieldT > 0 || fireT > 0) ? 72 : 50;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, barY, CANVAS_W, 18);
            ctx.font         = '13px Arial';
            ctx.textBaseline = 'middle';
            ctx.textAlign    = 'left';
            let ix = 6;
            for (const id of runUps) {
                ctx.fillText(RUN_ICONS[id] || '?', ix, barY + 9);
                ix += 22;
            }
        }

        ctx.restore();
    }

    _drawPowerBar(ctx, x, cy, timer, maxTime, icon, color) {
        const barW = 120;
        const barH = 8;
        const fill = Math.min(1, timer / maxTime);

        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.roundRect(x + 19, cy - barH / 2, barW, barH, 3);
        ctx.fill();

        ctx.fillStyle   = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(x + 19, cy - barH / 2, Math.max(3, barW * fill), barH, 3);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.font         = '13px Arial';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, cy + 1);

        ctx.fillStyle = '#cccccc';
        ctx.font      = '10px Arial';
        ctx.fillText(Math.ceil(timer) + 's', x + 19 + barW + 3, cy);
    }

    _drawCoinIcon(ctx, cx, cy, r) {
        const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        g.addColorStop(0, '#fff176');
        g.addColorStop(1, '#f9a825');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c8960c';
        ctx.lineWidth   = 1.2;
        ctx.stroke();
        ctx.fillStyle    = '#7a5a00';
        ctx.font         = `bold ${Math.floor(r * 1.1)}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', cx, cy + 0.5);
    }

    drawWaveAnnounce(ctx, wave, t) {
        // t goes 0→1 (fade out)
        const alpha = Math.min(1, t * 2) * Math.min(1, (2 - t * 2 + 0.5));
        ctx.save();
        ctx.globalAlpha  = Math.max(0, alpha);
        ctx.font         = 'bold 48px Arial';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(0,0,0,0.45)';
        ctx.fillText('Wave ' + wave + '!', CANVAS_W / 2 + 2, CANVAS_H / 2 + 2);
        ctx.fillStyle    = '#ffff00';
        ctx.fillText('Wave ' + wave + '!', CANVAS_W / 2, CANVAS_H / 2);
        ctx.restore();
    }

    // Run upgrade picker overlay shown after each spike wave.
    // options: array of upgrade objects from RUN_UPGRADE_POOL
    // hoverIdx: index of hovered card (-1 = none)
    drawRunUpgradePicker(ctx, options, hoverIdx) {
        ctx.save();

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Title
        ctx.fillStyle    = '#ffffff';
        ctx.font         = 'bold 22px Arial';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('בחר שדרוג לריצה!', CANVAS_W / 2, 185);

        const rects = pickerCardRects(options.length);
        const glowColors = ['#00e5ff', '#ffea00', '#69f0ae'];

        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            const r   = rects[i];
            const isHover = i === hoverIdx;
            const glow = glowColors[i % glowColors.length];

            // Card shadow / glow
            if (isHover) {
                ctx.shadowColor = glow;
                ctx.shadowBlur  = 18;
            }

            // Card background
            ctx.fillStyle = isHover ? '#252545' : '#1a1a2e';
            this._roundRect(ctx, r.x, r.y, r.w, r.h, 12);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Card border
            ctx.strokeStyle = glow;
            ctx.lineWidth   = isHover ? 2.5 : 1.5;
            ctx.globalAlpha = isHover ? 1 : 0.6;
            this._roundRect(ctx, r.x, r.y, r.w, r.h, 12);
            ctx.stroke();
            ctx.globalAlpha = 1;

            const cx = r.x + r.w / 2;

            // Icon (large emoji)
            ctx.font         = '36px Arial';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(opt.icon, cx, r.y + 42);

            // Name
            ctx.font      = 'bold 14px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(opt.name, cx, r.y + 82);

            // Description (wrapped)
            ctx.font      = '11px Arial';
            ctx.fillStyle = '#aaaacc';
            this._wrapText(ctx, opt.desc, cx, r.y + 108, r.w - 16, 15);
        }

        ctx.restore();
    }

    // Simple text wrap (center-aligned)
    _wrapText(ctx, text, cx, y, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxW && line) {
                ctx.fillText(line, cx, y);
                line = word;
                y += lineH;
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line, cx, y);
    }

    drawGameOver(ctx, wave, highScore, sessionCoins, returnTimer) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        const cx = CANVAS_W / 2;
        const cy = CANVAS_H / 2;

        ctx.fillStyle   = 'rgba(16,20,32,0.97)';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth   = 2;
        this._roundRect(ctx, cx - 170, cy - 150, 340, 310, 18);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        ctx.font      = 'bold 52px Arial';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('GAME OVER', cx, cy - 100);

        ctx.font      = 'bold 26px Arial';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText('הגעת לגל ' + wave, cx, cy - 44);

        ctx.font      = '20px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🪙 ' + sessionCoins.toLocaleString() + ' מטבעות נצברו', cx, cy + 4);

        if (wave >= highScore) {
            ctx.font      = 'bold 18px Arial';
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('🏆 שיא חדש!', cx, cy + 46);
        } else {
            ctx.font      = '18px Arial';
            ctx.fillStyle = '#7090a0';
            ctx.fillText('שיא: גל ' + highScore, cx, cy + 46);
        }

        const secs = Math.ceil(Math.max(0, returnTimer));
        ctx.font      = '15px Arial';
        ctx.fillStyle = '#556677';
        ctx.fillText('חוזר לתפריט בעוד ' + secs + '... (לחץ להמשיך)', cx, cy + 108);

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
}
