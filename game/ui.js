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

        // Diamond icon + count (session)
        const diamonds = gameState.sessionDiamonds || 0;
        if (diamonds > 0 || gameState.wave >= 11) {
            ctx.font         = '16px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText('💎', 34 + ctx.measureText(coins.toLocaleString()).width + 10, 24);
            ctx.fillStyle = '#00e5ff';
            ctx.font      = 'bold 16px Arial';
            ctx.fillText(diamonds, 34 + ctx.measureText(coins.toLocaleString()).width + 30, 24);
        }

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
        const iceT    = gameState.iceTimer    || 0;
        if (shieldT > 0 || fireT > 0 || iceT > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 48, CANVAS_W, 20);
            let bx = 8;
            if (shieldT > 0) { this._drawPowerBar(ctx, bx, 58, shieldT, 8,  '🛡️', '#00aaff'); bx += 158; }
            if (fireT   > 0) { this._drawPowerBar(ctx, bx, 58, fireT,   10, '🔥', '#ff6600'); bx += 158; }
            if (iceT    > 0) { this._drawPowerBar(ctx, bx, 58, iceT,    5,  '❄️', '#aaf0ff'); }
        }

        // Active run upgrades strip (small icons below powerup bars)
        const runUps = gameState.runUpgrades;
        if (runUps.size > 0) {
            const RUN_ICONS = {
                magnetic: '🧲', gold_rush: '💰', bouncy: '🎱', rapid: '⚡',
                pierce: '🏹', shield_up: '🛡️', double_heart: '💝',
                homing: '🚀', explosion: '💥', freeze: '❄️', heal: '💚',
            };
            const barY = (shieldT > 0 || fireT > 0 || iceT > 0) ? 72 : 50;
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

}
// drawRunUpgradePicker, _wrapText, drawGameOver, _roundRect — ב-ui-overlays.js
