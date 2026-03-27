// ── ציור גוף הבוס ─────────────────────────────────────────────────────────────
// נטען אחרי boss-ticks.js

BossEnemy.prototype.drawBody = function(ctx) {
    const t     = _frameNow * 0.001;
    const p2    = this.phase === 2;
    const tell  = this.isTelling;
    ctx.save();

    // זוהר חיצוני (מהבהב בכתום כשמאיים)
    const pulse  = 0.88 + 0.12 * Math.sin(t * 2.5);
    const glowR  = this.radius * (tell ? 2.3 : 1.85) * pulse;
    const gCol   = tell ? '#ff8800' : this._primary();
    const glow   = ctx.createRadialGradient(this.x, this.y, this.radius * 0.3, this.x, this.y, glowR);
    glow.addColorStop(0, this._rgba(gCol, tell ? 0.65 : 0.4));
    glow.addColorStop(1, this._rgba(gCol, 0));
    ctx.beginPath(); ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    // צל
    ctx.beginPath();
    ctx.ellipse(this.x + 6, this.y + 8, this.radius, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

    // גוף
    const pal  = p2 ? ['#440000', '#cc0000', '#ff8080'] : this._bodyColors();
    const body = ctx.createRadialGradient(
        this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.05,
        this.x, this.y, this.radius);
    body.addColorStop(0,   pal[2]);
    body.addColorStop(0.5, pal[1]);
    body.addColorStop(1,   pal[0]);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = tell ? '#ff8800' : this._primary();
    ctx.lineWidth = p2 ? 4 : 3; ctx.stroke();

    // ── אפקטים מיוחדים לפי סוג ──────────────────────────

    // מגן: קשת מסובבת
    if (this.type === 'shield') {
        ctx.strokeStyle = p2 ? '#ff5522' : '#33ffcc';
        ctx.lineWidth = 9; ctx.globalAlpha = 0.92; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 13,
            this.shieldAngle - this.shieldArcSize / 2,
            this.shieldAngle + this.shieldArcSize / 2);
        ctx.stroke();
        ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
    }

    // לייזר: קו מקווקו כאזהרה
    if (this.type === 'laser' && this.laserState === 'aiming') {
        const aimFrac = this.laserAimTime / (p2 ? 1.3 : 1.8);
        const blink   = 0.3 + 0.55 * (1 - aimFrac) * (0.5 + 0.5 * Math.sin(t * 18));
        ctx.globalAlpha = blink;
        ctx.strokeStyle = '#00eeff'; ctx.lineWidth = 4;
        ctx.setLineDash([10, 7]);
        ctx.beginPath();
        ctx.moveTo(this.laserAimX, this.y + this.radius + 5);
        ctx.lineTo(this.laserAimX, CANVAS_H);
        ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
    }

    // מפציץ: X אזהרה בקרקע + קו אנכי
    if (this.type === 'bomber' && this.bombWarnX !== null) {
        const alpha = 0.65 + 0.3 * Math.sin(t * 11);
        const wx = this.bombWarnX, wy = CANVAS_H - 85, s = 18;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(wx - s, wy - s); ctx.lineTo(wx + s, wy + s);
        ctx.moveTo(wx + s, wy - s); ctx.lineTo(wx - s, wy + s);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.4;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(wx, this.y + this.radius + 5); ctx.lineTo(wx, wy - s);
        ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
    }

    // מתפוצץ: טבעת מתרחבת לפני פיצוץ
    if (this.type === 'exploder' && this.explodeTell > 0) {
        const frac  = this.explodeTell / this.explodeTellDur;
        const ringR = this.radius + 8 + (1 - frac) * 38;
        ctx.strokeStyle = '#ff3300'; ctx.lineWidth = 3.5;
        ctx.globalAlpha = frac * 0.88;
        ctx.beginPath(); ctx.arc(this.x, this.y, ringR, 0, Math.PI * 2);
        ctx.stroke(); ctx.globalAlpha = 1;
        ctx.globalAlpha = (1 - frac) * 0.4 * (0.5 + 0.5 * Math.sin(t * 22));
        ctx.fillStyle = '#ff8800';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill(); ctx.globalAlpha = 1;
    }

    // מעביר: רוח רפאים ומיקום עתידי
    if (this.type === 'teleporter' && this.teleportTell > 0) {
        const frac = 1 - this.teleportTell / this.teleportTellDur;
        ctx.globalAlpha = frac * 0.55;
        ctx.strokeStyle = '#ff88ff'; ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(this.pendingX, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    if (this.type === 'teleporter' && this.teleportFlash > 0) {
        ctx.globalAlpha = (this.teleportFlash / 0.45) * 0.55;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
        ctx.fill(); ctx.globalAlpha = 1;
    }

    // סחרחר: ירי כאשר שורה — פלאש בהיר
    if (this.type === 'spinner' && this.shootTimer < 0.4) {
        ctx.globalAlpha = (1 - this.shootTimer / 0.4) * 0.45;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill(); ctx.globalAlpha = 1;
    }

    // מפצל: סדקים ב-60%-50% חיים
    if (this.type === 'splitter' && !this.splitDone && this.hp < this.maxHp * 0.62) {
        const frac = 1 - this.hp / (this.maxHp * 0.62);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8;
        ctx.globalAlpha = frac * 0.85;
        for (let i = 0; i < 4; i++) {
            const a = Math.PI * 0.25 + i * (Math.PI * 0.42);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // אייקון בוס
    this._drawBodyIcon(ctx);

    // פלאש לבן בפגיעה
    if (this.flashTimer > 0) {
        ctx.globalAlpha = (this.flashTimer / 0.13) * 0.72;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill(); ctx.globalAlpha = 1;
    }

    ctx.restore();
};

BossEnemy.prototype.drawHUD = function(ctx) {
    const p2   = this.phase === 2;
    const barW = this.isMini ? 155 : 240;
    const barH = 14;
    const barX = this.isMini ? this.x - barW / 2 : CANVAS_W / 2 - barW / 2;
    const barY = 14;
    const frac = Math.max(0, this.hp / this.maxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.fillStyle = p2 ? '#ff3300' : this._primary();
    ctx.fillRect(barX, barY, barW * frac, barH);
    ctx.strokeStyle = 'rgba(255,255,255,0.48)';
    ctx.lineWidth = 1.5; ctx.strokeRect(barX, barY, barW, barH);

    const hpStr  = this.hp   >= 1000 ? (this.hp / 1000).toFixed(1) + 'k'   : String(this.hp);
    const maxStr = this.maxHp >= 1000 ? (this.maxHp / 1000).toFixed(1) + 'k' : String(this.maxHp);
    const label  = this.isMini
        ? `${BOSS_ICONS[this.type]} ${hpStr}/${maxStr}`
        : `${BOSS_ICONS[this.type]} ${BOSS_NAMES[this.type]}  ${hpStr}/${maxStr}`;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(label, barX + barW / 2, barY + barH / 2);
    ctx.restore();
};

BossEnemy.prototype._drawBodyIcon = function(ctx) {
    const x = this.x, y = this.y;
    const s = this.radius * 0.38;
    const t = _frameNow * 0.001;
    const col = '#ffffff';
    const shadow = 'rgba(0,0,0,0.55)';
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1.5, s * 0.12);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    switch (this.type) {
        case 'shooter': {
            // כוונת — שלושה עיגולים ריקים + קווים
            ctx.lineWidth = s * 0.13;
            ctx.beginPath(); ctx.arc(x, y, s,        0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, s * 0.58, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, s * 0.2,  0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - s * 1.38, y); ctx.lineTo(x - s * 0.72, y);
            ctx.moveTo(x + s * 0.72, y); ctx.lineTo(x + s * 1.38, y);
            ctx.moveTo(x, y - s * 1.38); ctx.lineTo(x, y - s * 0.72);
            ctx.moveTo(x, y + s * 0.72); ctx.lineTo(x, y + s * 1.38);
            ctx.stroke();
            break;
        }
        case 'bomber': {
            // פצצה — עיגול + פתיל + ניצוץ
            ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.82, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = shadow; ctx.lineWidth = s * 0.1; ctx.stroke();
            ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = s * 0.15;
            ctx.beginPath();
            ctx.moveTo(x + s * 0.3, y - s * 0.68);
            ctx.bezierCurveTo(x + s * 0.62, y - s * 1.08, x - s * 0.1, y - s * 1.28, x + s * 0.15, y - s * 1.52);
            ctx.stroke();
            ctx.fillStyle = '#ffff55'; ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(x + s * 0.15, y - s * 1.52, s * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            break;
        }
        case 'laser': {
            // שלושה קרני לייזר עם ראשי חצים
            ctx.lineWidth = s * 0.13;
            for (let i = -1; i <= 1; i++) {
                const oy = i * s * 0.43;
                ctx.beginPath(); ctx.moveTo(x - s * 0.88, y + oy); ctx.lineTo(x + s * 0.52, y + oy); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + s * 0.52, y + oy);
                ctx.lineTo(x + s * 0.2, y + oy - s * 0.19);
                ctx.lineTo(x + s * 0.2, y + oy + s * 0.19);
                ctx.closePath(); ctx.fill();
            }
            break;
        }
        case 'exploder': {
            // פיצוץ — שמונה קרניים
            ctx.lineWidth = s * 0.13;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
                ctx.beginPath();
                ctx.moveTo(x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28);
                ctx.lineTo(x + Math.cos(a) * s,        y + Math.sin(a) * s);
                ctx.stroke();
            }
            ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'shield': {
            // מגן — מתאר שישה נקודות + מגן פנימי
            ctx.lineWidth = s * 0.13;
            ctx.beginPath();
            ctx.moveTo(x,             y - s);
            ctx.lineTo(x + s * 0.88, y - s * 0.28);
            ctx.lineTo(x + s * 0.72, y + s * 0.62);
            ctx.lineTo(x,            y + s);
            ctx.lineTo(x - s * 0.72, y + s * 0.62);
            ctx.lineTo(x - s * 0.88, y - s * 0.28);
            ctx.closePath(); ctx.stroke();
            const sf = 0.52;
            ctx.beginPath();
            ctx.moveTo(x,              y - s * sf);
            ctx.lineTo(x + s * 0.88 * sf, y - s * 0.28 * sf);
            ctx.lineTo(x + s * 0.72 * sf, y + s * 0.62 * sf);
            ctx.lineTo(x,              y + s * sf);
            ctx.lineTo(x - s * 0.72 * sf, y + s * 0.62 * sf);
            ctx.lineTo(x - s * 0.88 * sf, y - s * 0.28 * sf);
            ctx.closePath(); ctx.fill();
            break;
        }
        case 'spinner': {
            // שלושה להבים מסתובבים
            for (let i = 0; i < 3; i++) {
                const a = t * 3 + (i / 3) * Math.PI * 2;
                ctx.save();
                ctx.translate(x, y); ctx.rotate(a);
                ctx.beginPath(); ctx.ellipse(s * 0.46, 0, s * 0.44, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = shadow;
            ctx.beginPath(); ctx.arc(x, y, s * 0.22, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'swarm': {
            // שלושה עיגולים קטנים במשולש
            const sp = [[0, -s * 0.57], [-s * 0.52, s * 0.33], [s * 0.52, s * 0.33]];
            ctx.lineWidth = s * 0.1;
            for (const [px, py] of sp) {
                ctx.fillStyle = col;
                ctx.beginPath(); ctx.arc(x + px, y + py, s * 0.33, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = shadow; ctx.stroke();
            }
            break;
        }
        case 'teleporter': {
            // יהלום + יהלום פנימי כהה
            ctx.lineWidth = s * 0.11;
            ctx.beginPath();
            ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.65, y);
            ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.65, y);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = shadow; ctx.stroke();
            ctx.fillStyle = shadow; ctx.globalAlpha *= 0.6;
            ctx.beginPath();
            ctx.moveTo(x, y - s * 0.5); ctx.lineTo(x + s * 0.32, y);
            ctx.lineTo(x, y + s * 0.5); ctx.lineTo(x - s * 0.32, y);
            ctx.closePath(); ctx.fill();
            break;
        }
        case 'splitter': {
            // שני חצים כיוונים מנוגדים + נקודה מרכזית
            ctx.lineWidth = s * 0.15;
            ctx.beginPath(); ctx.moveTo(x - s * 0.13, y); ctx.lineTo(x - s * 0.9, y); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - s * 0.9, y); ctx.lineTo(x - s * 0.56, y - s * 0.3);
            ctx.moveTo(x - s * 0.9, y); ctx.lineTo(x - s * 0.56, y + s * 0.3);
            ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + s * 0.13, y); ctx.lineTo(x + s * 0.9, y); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + s * 0.9, y); ctx.lineTo(x + s * 0.56, y - s * 0.3);
            ctx.moveTo(x + s * 0.9, y); ctx.lineTo(x + s * 0.56, y + s * 0.3);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, s * 0.15, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'spiral': {
            // ספירלה
            ctx.lineWidth = s * 0.12;
            ctx.beginPath();
            for (let i = 0; i <= 110; i++) {
                const a = (i / 110) * Math.PI * 3.8;
                const r = (i / 110) * s;
                const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();
            break;
        }
        default: {
            // ברירת מחדל — כוכב חמש קרניים
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                const r = (i % 2 === 0) ? s : s * 0.42;
                i === 0 ? ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
                        : ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
            }
            ctx.closePath(); ctx.fill();
            break;
        }
    }
    ctx.restore();
};

BossEnemy.prototype._primary     = function() { return (BOSS_COLORS[this.type] || BOSS_COLORS.shooter)[1]; };
BossEnemy.prototype._bodyColors  = function() { return BOSS_COLORS[this.type] || BOSS_COLORS.shooter; };
BossEnemy.prototype._rgba        = function(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
};
