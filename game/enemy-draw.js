// ── ציור אויבים — הרחבת prototype של EnemyBall ──────────────────────────────
// נטען אחרי enemy.js

EnemyBall.prototype._darken = function(hex, amt) {
    const parse = (s, o) => Math.max(0, Math.min(255, parseInt(s.slice(o, o + 2), 16) - amt));
    return `rgb(${parse(hex,1)},${parse(hex,3)},${parse(hex,5)})`;
};

EnemyBall.prototype.draw = function(ctx) {
    ctx.save();
    if (this.type === 'crystal') {
        this._drawDiamond(ctx);
        ctx.restore();
        return;
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(this.x + 4, this.y + 5, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Ball gradient (3D shading)
    const grad = ctx.createRadialGradient(
        this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.05,
        this.x, this.y, this.radius
    );
    grad.addColorStop(0,   this.lightColor);
    grad.addColorStop(0.5, this.baseColor);
    grad.addColorStop(1,   this._darken(this.baseColor, 60));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim — splitter gets a vivid lime outline
    if (this.type === 'splitter') {
        ctx.strokeStyle = '#76FF03';
        ctx.lineWidth   = 3;
    } else {
        ctx.strokeStyle = this._darken(this.baseColor, 80);
        ctx.lineWidth   = 1.5;
    }
    ctx.stroke();

    // Marked: pulsing orange ring (drawn outside the ball)
    if (this.marked) {
        ctx.strokeStyle = '#FF6D00';
        ctx.lineWidth   = 2.5;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Ice power-up: strong frozen overlay
    if (gameState.iceTimer > 0) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle   = '#cceeff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#aaf0ff';
        ctx.lineWidth   = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    } else if (this.slowTimer > 0) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle   = '#80d8ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Hit flash: white overlay fading out
    if (this.flashTimer > 0) {
        const flashAlpha = (this.flashTimer / 0.13) * 0.72;
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle   = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // HP text
    const hpStr    = this.hp >= 1000 ? (this.hp / 1000).toFixed(1) + 'k' : String(this.hp);
    const fontSize = Math.max(10, Math.min(20, this.radius * 0.58));
    ctx.font         = `bold ${fontSize}px Arial`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(0,0,0,0.5)';
    ctx.fillText(hpStr, this.x + 1, this.y + 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(hpStr, this.x, this.y);

    // Type icon (top-left corner of ball, only if ball is large enough)
    const icon = this._typeIcon();
    if (icon && this.radius >= 14) {
        const iconSize = Math.max(10, Math.floor(this.radius * 0.55));
        ctx.font         = `${iconSize}px Arial`;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(icon, this.x - this.radius + 2, this.y - this.radius + 2);
    }

    ctx.restore();
};

EnemyBall.prototype._drawDiamond = function(ctx) {
    const r = this.radius;
    const x = this.x, y = this.y;
    const timerFrac = Math.max(0, Math.min(1, this.lifeTimer / 5.0));
    const t = _frameNow * 0.001;

    const pulse = 0.88 + 0.12 * Math.sin(t * 3);
    const glowR = r * 2.6 * pulse;
    const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, glowR);
    glow.addColorStop(0,   'rgba(120,240,255,0.55)');
    glow.addColorStop(0.4, 'rgba(0,180,255,0.25)');
    glow.addColorStop(1,   'rgba(0,60,200,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 5, y - r + 6); ctx.lineTo(x + r + 5, y + 6);
    ctx.lineTo(x + 5, y + r + 6); ctx.lineTo(x - r + 5, y + 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y); ctx.lineTo(x - r, y);
    ctx.closePath();
    const topGrad = ctx.createLinearGradient(x, y - r, x, y);
    topGrad.addColorStop(0, '#f0fbff'); topGrad.addColorStop(0.3, '#b3ecf7'); topGrad.addColorStop(1, '#00d4f0');
    ctx.fillStyle = topGrad; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.closePath();
    const botGrad = ctx.createLinearGradient(x, y, x, y + r);
    botGrad.addColorStop(0, '#00BCD4'); botGrad.addColorStop(1, '#003d52');
    ctx.fillStyle = botGrad; ctx.fill();

    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(x, y - r);       ctx.lineTo(x - r * 0.48, y);
    ctx.moveTo(x, y - r);       ctx.lineTo(x + r * 0.48, y);
    ctx.moveTo(x - r, y);       ctx.lineTo(x + r, y);
    ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x, y + r);
    ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x, y + r);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - r * 0.28, y - r * 0.45);
    ctx.lineTo(x + r * 0.08, y - r * 0.72);
    ctx.lineTo(x - r * 0.04, y - r * 0.22);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.fill();

    for (let i = 0; i < 3; i++) {
        const ang  = t * 1.1 + (i * Math.PI * 2 / 3);
        const dist = r * 1.45;
        const sx   = x + Math.cos(ang) * dist;
        const sy   = y + Math.sin(ang) * dist;
        const ss   = 2.5 + 1.5 * Math.abs(Math.sin(t * 2.5 + i * 1.3));
        const alpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 3 + i));
        ctx.save();
        ctx.translate(sx, sy); ctx.rotate(ang + t * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, -ss); ctx.lineTo(ss * 0.22, 0);
        ctx.lineTo(0,  ss); ctx.lineTo(-ss * 0.22, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    if (this.marked) {
        ctx.strokeStyle = '#FF6D00'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(x, y - r - 5); ctx.lineTo(x + r + 5, y);
        ctx.lineTo(x, y + r + 5); ctx.lineTo(x - r - 5, y);
        ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1;
    }

    if (this.flashTimer > 0) {
        ctx.globalAlpha = (this.flashTimer / 0.13) * 0.72;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }

    const hpStr    = this.hp >= 1000 ? (this.hp / 1000).toFixed(1) + 'k' : String(this.hp);
    const fontSize = Math.max(10, Math.min(20, r * 0.58));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(hpStr, x + 1, y + 1);
    ctx.fillStyle = '#ffffff'; ctx.fillText(hpStr, x, y);

    const ringColor = timerFrac > 0.5 ? '#00ff88' : timerFrac > 0.25 ? '#ffcc00' : '#ff3300';
    ctx.strokeStyle = ringColor; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r + 7, -Math.PI / 2, -Math.PI / 2 + timerFrac * Math.PI * 2);
    ctx.stroke();

    const secsLeft = Math.ceil(Math.max(0, this.lifeTimer));
    const numSize  = Math.max(8, Math.floor(r * 0.48));
    ctx.font = `bold ${numSize}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = ringColor; ctx.fillText(secsLeft, x, y - r - 4);
};
