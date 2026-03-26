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
        // U+25C6 diamond · U+2715 multiply · U+00F7 division · U+00BB double angle
        const icons = { crystal: '\u25C6', bomb: '\u2715', splitter: '\u00F7', fast: '\u00BB' };
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

}
// draw, _drawDiamond, _darken — ב-enemy-draw.js
