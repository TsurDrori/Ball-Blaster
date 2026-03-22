const ENEMY_COLORS = [
    { max: 10,       color: '#4caf50', light: '#a5d6a7' }, // green
    { max: 30,       color: '#8bc34a', light: '#dcedc8' }, // light green
    { max: 70,       color: '#cddc39', light: '#f0f4c3' }, // lime
    { max: 150,      color: '#ffeb3b', light: '#fff9c4' }, // yellow
    { max: 300,      color: '#ff9800', light: '#ffe0b2' }, // orange
    { max: 600,      color: '#ff5722', light: '#fbe9e7' }, // deep orange
    { max: 1200,     color: '#f44336', light: '#ffcdd2' }, // red
    { max: 2500,     color: '#e91e63', light: '#fce4ec' }, // pink
    { max: 5000,     color: '#9c27b0', light: '#e1bee7' }, // purple
    { max: Infinity, color: '#3f51b5', light: '#c5cae9' }, // indigo (boss tier)
];

function enemyColor(hp) {
    for (const c of ENEMY_COLORS) {
        if (hp <= c.max) return c;
    }
    return ENEMY_COLORS[ENEMY_COLORS.length - 1];
}

class EnemyBall {
    // type: 'normal' | 'crystal' | 'bomb' | 'splitter' | 'fast'
    constructor(x, hp, speed, type = 'normal') {
        this.type = type;

        // Type-specific HP/speed modifications
        if (type === 'fast') {
            hp    = Math.floor(hp * 0.25);
            speed = speed * 2.5;
        }

        this.maxHp  = hp;
        this.hp     = hp;
        this.radius = Math.min(80, 12 + Math.log10(Math.max(1, hp)) * 18);
        if (type === 'fast') this.radius *= 0.75;

        this.x  = x;
        this.y  = -this.radius;
        this.vx = (Math.random() < 0.5 ? 1 : -1) * (50 + Math.random() * 60);
        this.vy = speed;

        this.dead       = false;
        this.coinValue  = Math.max(1, Math.ceil(Math.sqrt(hp)));
        if (type === 'crystal') {
            this.lifeTimer = 5.0; // 5 שניות להרוס לפני שנעלם
            this.expired   = false;
        }

        this.flashTimer = 0;
        this.marked     = false; // for 'marked' run upgrade (legacy, kept for draw compat)
        this.markTimer  = 0;
        this.slowTimer  = 0;    // for 'freeze' run upgrade

        this._updateColor();
    }

    _updateColor() {
        if (this.type === 'crystal') {
            this.baseColor  = '#00BCD4';
            this.lightColor = '#B2EBF2';
        } else if (this.type === 'bomb') {
            this.baseColor  = '#FF5722';
            this.lightColor = '#FF8A65';
        } else if (this.type === 'fast') {
            this.baseColor  = '#B0BEC5';
            this.lightColor = '#ECEFF1';
        } else {
            // normal and splitter use standard HP-based color tier
            const c = enemyColor(this.maxHp);
            this.baseColor  = c.color;
            this.lightColor = c.light;
        }
    }

    _typeIcon() {
        const icons = { crystal: '💎', bomb: '💣', splitter: '✂️', fast: '⚡' };
        return icons[this.type] || null;
    }

    // Returns an action object on death, or null.
    onDeath() {
        if (this.type === 'bomb') {
            return {
                action: 'aoe',
                x: this.x, y: this.y,
                radius: 120,
                damage: Math.ceil(this.maxHp * 0.25),
            };
        }
        if (this.type === 'splitter' && this.maxHp >= 6) {
            const childHp    = Math.floor(this.maxHp / 3);
            const childSpeed = Math.abs(this.vy) * 1.2;
            return {
                action: 'split',
                children: [
                    new EnemyBall(this.x - 20, childHp, childSpeed, 'normal'),
                    new EnemyBall(this.x + 20, childHp, childSpeed, 'normal'),
                ],
            };
        }
        return null;
    }

    hit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.hp   = 0;
            this.dead = true;
        } else {
            this.flashTimer = 0.13;
        }
    }

    update(delta) {
        if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - delta);
        if (this.markTimer  > 0) {
            this.markTimer = Math.max(0, this.markTimer - delta);
            if (this.markTimer <= 0) this.marked = false;
        }
        if (this.slowTimer  > 0) this.slowTimer = Math.max(0, this.slowTimer - delta);

        // יהלום: ספירה לאחור - אם לא נשבר בזמן, נעלם ללא זהב (קפאון עוצר את הטיימר)
        if (this.type === 'crystal' && gameState.iceTimer <= 0) {
            this.lifeTimer -= delta;
            if (this.lifeTimer <= 0) {
                this.dead    = true;
                this.expired = true;
                return;
            }
        }

        // Ice power-up freezes all enemies completely
        if (gameState.iceTimer > 0) return;

        const speedMult = this.slowTimer > 0 ? 0.3 : 1.0;
        this.vy += GRAVITY * delta;
        this.x  += this.vx * delta * speedMult;
        this.y  += this.vy * delta * speedMult;

        // Bounce off side walls
        if (this.x - this.radius < 0) {
            this.x  = this.radius;
            this.vx = Math.abs(this.vx);
            sound.wallBounce();
        }
        if (this.x + this.radius > CANVAS_W) {
            this.x  = CANVAS_W - this.radius;
            this.vx = -Math.abs(this.vx);
            sound.wallBounce();
        }

        // Bounce off bottom wall
        if (this.y + this.radius > CANVAS_H) {
            this.y  = CANVAS_H - this.radius;
            this.vy = -Math.abs(this.vy) * 0.95;
            if (Math.abs(this.vy) < 140) this.vy = -140;
            this.vx += (Math.random() - 0.5) * 40;
        }
    }

    // Returns true if this ball overlaps the cannon's hitbox
    hitsCannon(cannon) {
        const cx = cannon.x;
        const cy = cannon.y + 3;
        const hw = 58, hh = 40;
        const nearX = Math.max(cx - hw, Math.min(this.x, cx + hw));
        const nearY = Math.max(cy - hh, Math.min(this.y, cy + hh));
        const dx = this.x - nearX, dy = this.y - nearY;
        return (dx * dx + dy * dy) < this.radius * this.radius;
    }

    draw(ctx) {
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
            // Freeze run upgrade: lighter blue tint
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
    }

    _drawDiamond(ctx) {
        const r = this.radius;
        const x = this.x, y = this.y;
        const timerFrac = Math.max(0, Math.min(1, this.lifeTimer / 5.0));
        const t = performance.now() * 0.001;

        // === זוהר חיצוני פועם ===
        const pulse = 0.88 + 0.12 * Math.sin(t * 3);
        const glowR = r * 2.6 * pulse;
        const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, glowR);
        glow.addColorStop(0,   'rgba(120,240,255,0.55)');
        glow.addColorStop(0.4, 'rgba(0,180,255,0.25)');
        glow.addColorStop(1,   'rgba(0,60,200,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // === צל ===
        ctx.beginPath();
        ctx.moveTo(x + 5, y - r + 6);
        ctx.lineTo(x + r + 5, y + 6);
        ctx.lineTo(x + 5, y + r + 6);
        ctx.lineTo(x - r + 5, y + 6);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fill();

        // === מחצית עליונה (בהירה) ===
        ctx.beginPath();
        ctx.moveTo(x,     y - r);
        ctx.lineTo(x + r, y    );
        ctx.lineTo(x,     y    );
        ctx.lineTo(x - r, y    );
        ctx.closePath();
        const topGrad = ctx.createLinearGradient(x, y - r, x, y);
        topGrad.addColorStop(0,   '#f0fbff');
        topGrad.addColorStop(0.3, '#b3ecf7');
        topGrad.addColorStop(1,   '#00d4f0');
        ctx.fillStyle = topGrad;
        ctx.fill();

        // === מחצית תחתונה (עמוקה) ===
        ctx.beginPath();
        ctx.moveTo(x - r, y    );
        ctx.lineTo(x + r, y    );
        ctx.lineTo(x,     y + r);
        ctx.closePath();
        const botGrad = ctx.createLinearGradient(x, y, x, y + r);
        botGrad.addColorStop(0, '#00BCD4');
        botGrad.addColorStop(1, '#003d52');
        ctx.fillStyle = botGrad;
        ctx.fill();

        // === קוי פסים (אבן חן) ===
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.moveTo(x, y - r);       ctx.lineTo(x - r * 0.48, y); // קו שמאל עליון
        ctx.moveTo(x, y - r);       ctx.lineTo(x + r * 0.48, y); // קו ימין עליון
        ctx.moveTo(x - r, y);       ctx.lineTo(x + r, y);         // קו אמצע (גירדל)
        ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x, y + r);         // קו שמאל תחתון
        ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x, y + r);         // קו ימין תחתון
        ctx.stroke();

        // === מסגרת ===
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // === הברקה (shine) ===
        ctx.beginPath();
        ctx.moveTo(x - r * 0.28, y - r * 0.45);
        ctx.lineTo(x + r * 0.08, y - r * 0.72);
        ctx.lineTo(x - r * 0.04, y - r * 0.22);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fill();

        // === כוכבי נצנוץ מסתובבים ===
        for (let i = 0; i < 3; i++) {
            const ang  = t * 1.1 + (i * Math.PI * 2 / 3);
            const dist = r * 1.45;
            const sx   = x + Math.cos(ang) * dist;
            const sy   = y + Math.sin(ang) * dist;
            const ss   = 2.5 + 1.5 * Math.abs(Math.sin(t * 2.5 + i * 1.3));
            const alpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 3 + i));
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(ang + t * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, -ss); ctx.lineTo(ss * 0.22, 0);
            ctx.lineTo(0,  ss); ctx.lineTo(-ss * 0.22, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // === טבעת "מסומן" ===
        if (this.marked) {
            ctx.strokeStyle = '#FF6D00';
            ctx.lineWidth = 2.5;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.moveTo(x,         y - r - 5);
            ctx.lineTo(x + r + 5, y        );
            ctx.lineTo(x,         y + r + 5);
            ctx.lineTo(x - r - 5, y        );
            ctx.closePath();
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // === הבהוב לבן בפגיעה ===
        if (this.flashTimer > 0) {
            ctx.globalAlpha = (this.flashTimer / 0.13) * 0.72;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
            ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // === טקסט כמות חיים ===
        const hpStr    = this.hp >= 1000 ? (this.hp / 1000).toFixed(1) + 'k' : String(this.hp);
        const fontSize = Math.max(10, Math.min(20, r * 0.58));
        ctx.font         = `bold ${fontSize}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(0,0,0,0.55)';
        ctx.fillText(hpStr, x + 1, y + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(hpStr, x, y);

        // === טבעת ספירה לאחור ===
        const ringColor = timerFrac > 0.5 ? '#00ff88' : timerFrac > 0.25 ? '#ffcc00' : '#ff3300';
        ctx.strokeStyle = ringColor;
        ctx.lineWidth   = 3.5;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.arc(x, y, r + 7, -Math.PI / 2, -Math.PI / 2 + timerFrac * Math.PI * 2);
        ctx.stroke();

        // === מספר שניות שנותרו ===
        const secsLeft = Math.ceil(Math.max(0, this.lifeTimer));
        const numSize  = Math.max(8, Math.floor(r * 0.48));
        ctx.font         = `bold ${numSize}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle    = ringColor;
        ctx.fillText(secsLeft, x, y - r - 4);
    }

    _darken(hex, amt) {
        const parse = (s, o) => Math.max(0, Math.min(255, parseInt(s.slice(o, o + 2), 16) - amt));
        return `rgb(${parse(hex,1)},${parse(hex,3)},${parse(hex,5)})`;
    }
}
