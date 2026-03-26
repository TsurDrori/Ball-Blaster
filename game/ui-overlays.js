// ── מסכי שכבות — הרחבת prototype של UI ──────────────────────────────────────
// נטען אחרי ui.js

UI.prototype.drawRunUpgradePicker = function(ctx, options, hoverIdx) {
    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

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

        if (isHover) {
            ctx.shadowColor = glow;
            ctx.shadowBlur  = 18;
        }

        ctx.fillStyle = isHover ? '#252545' : '#1a1a2e';
        this._roundRect(ctx, r.x, r.y, r.w, r.h, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = glow;
        ctx.lineWidth   = isHover ? 2.5 : 1.5;
        ctx.globalAlpha = isHover ? 1 : 0.6;
        this._roundRect(ctx, r.x, r.y, r.w, r.h, 12);
        ctx.stroke();
        ctx.globalAlpha = 1;

        const cx = r.x + r.w / 2;

        // Icon badge — colored circle with 2-letter abbreviation (no emoji)
        const _BADGE_COLORS = {
            'מג': '#5090e8', 'זה': '#d4a020', 'קפ': '#20a870', 'מה': '#e07020',
            'חד': '#a060e0', 'מן': '#2090d0', 'לב': '#d04060', 'טי': '#60a0d0',
            'פצ': '#d04020', 'קר': '#20a8c8', 'רפ': '#40b858',
        };
        const badgeColor = _BADGE_COLORS[opt.icon] || '#6080a0';
        ctx.fillStyle    = badgeColor + '22';
        ctx.beginPath();
        ctx.arc(cx, r.y + 46, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle  = badgeColor;
        ctx.lineWidth    = isHover ? 2.5 : 1.8;
        ctx.globalAlpha  = isHover ? 1 : 0.75;
        ctx.beginPath();
        ctx.arc(cx, r.y + 46, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha  = 1;
        ctx.fillStyle    = badgeColor;
        ctx.font         = 'bold 18px Arial';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.icon, cx, r.y + 46);

        ctx.font      = 'bold 14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(opt.name, cx, r.y + 82);

        ctx.font      = '11px Arial';
        ctx.fillStyle = '#aaaacc';
        this._wrapText(ctx, opt.desc, cx, r.y + 108, r.w - 16, 15);
    }

    ctx.restore();
};

UI.prototype._wrapText = function(ctx, text, cx, y, maxW, lineH) {
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
};

UI.prototype.drawGameOver = function(ctx, wave, highScore, sessionCoins, returnTimer) {
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
    ctx.fillText(sessionCoins.toLocaleString() + ' מטבעות נצברו', cx, cy + 4);

    if (wave >= highScore) {
        ctx.font      = 'bold 18px Arial';
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('שיא חדש!', cx, cy + 46);
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
};

UI.prototype._roundRect = function(ctx, x, y, w, h, r) {
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
};
