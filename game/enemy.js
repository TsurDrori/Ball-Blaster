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
        if (type === 'crystal') this.coinValue *= 2;

        this.flashTimer = 0;
        this.marked     = false; // for 'marked' run upgrade
        this.markTimer  = 0;

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

        this.vy += GRAVITY * delta;
        this.x  += this.vx * delta;
        this.y  += this.vy * delta;

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

    _darken(hex, amt) {
        const parse = (s, o) => Math.max(0, Math.min(255, parseInt(s.slice(o, o + 2), 16) - amt));
        return `rgb(${parse(hex,1)},${parse(hex,3)},${parse(hex,5)})`;
    }
}
