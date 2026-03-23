class Bullet {
    constructor(x, y, vx, vy, radius, damage, type = 'normal') {
        this.x      = x;
        this.y      = y;
        this.vx     = vx;
        this.vy     = vy;
        this.radius = radius;
        this.damage = damage;
        this.type   = type; // 'normal' | 'fire'
        this.dead   = false;
        this.pierceCount = 0;  // times this bullet has pierced through an enemy
        this.hitEnemies  = new Set(); // אויבים שכבר נפגעו מכדור זה (מונע פגיעה כפולה)
        this.bounced     = false; // for 'bouncy' run upgrade (only bounces once)
        this.homing      = false; // for 'homing' run upgrade
        this.skin        = null;  // visual skin id (set by cannon)
        this.cycle       = 0;    // מחזור רב-כדורי (0=רגיל, 1=זהב, 2=ארגמן, 3+=סגול)
    }

    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // 'bouncy' run upgrade: bullets bounce off side walls once
        if (!this.bounced && gameState.hasRunUpgrade('bouncy')) {
            if (this.x - this.radius < 0) {
                this.x   = this.radius;
                this.vx  = Math.abs(this.vx);
                this.bounced = true;
            } else if (this.x + this.radius > CANVAS_W) {
                this.x   = CANVAS_W - this.radius;
                this.vx  = -Math.abs(this.vx);
                this.bounced = true;
            }
        }

        if (this.y + this.radius < 0 || this.x < -60 || this.x > CANVAS_W + 60) {
            this.dead = true;
        }
    }

    draw(ctx) {
        const isFire   = this.type === 'fire';
        const isHoming = this.homing;
        const cycle    = this.cycle || 0;
        if (!isFire && !isHoming && cycle === 0) {
            const skinId = this.skin ?? (gameState.skins?.activeBullet || 'default');
            if (skinId !== 'default') {
                drawBulletSkin(ctx, this, skinId);
                return;
            }
        }
        ctx.save();

        // גלואה — גדולה יותר עם כל מחזור
        const glowR = this.radius * (isFire ? 2.6 : 2.6 + cycle * 0.8);
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
        if (isFire) {
            glow.addColorStop(0, 'rgba(255,120,0,0.7)');
            glow.addColorStop(1, 'rgba(255,30,0,0)');
        } else if (cycle >= 3) { // מחזור 3+ — סגול/קוסמי
            glow.addColorStop(0,   'rgba(255,255,255,0.9)');
            glow.addColorStop(0.3, 'rgba(200,0,255,0.8)');
            glow.addColorStop(0.7, 'rgba(80,0,200,0.4)');
            glow.addColorStop(1,   'rgba(0,0,100,0)');
        } else if (cycle === 2) { // מחזור 2 — ארגמן
            glow.addColorStop(0,   'rgba(255,255,100,0.95)');
            glow.addColorStop(0.3, 'rgba(255,50,0,0.85)');
            glow.addColorStop(0.7, 'rgba(180,0,0,0.4)');
            glow.addColorStop(1,   'rgba(80,0,0,0)');
        } else if (cycle === 1) { // מחזור 1 — זהב
            glow.addColorStop(0,   'rgba(255,255,180,0.9)');
            glow.addColorStop(0.4, 'rgba(255,180,0,0.7)');
            glow.addColorStop(1,   'rgba(200,100,0,0)');
        } else if (isHoming) {
            glow.addColorStop(0, 'rgba(160,80,255,0.75)');
            glow.addColorStop(1, 'rgba(80,0,200,0)');
        } else {
            glow.addColorStop(0, 'rgba(255,255,180,0.6)');
            glow.addColorStop(1, 'rgba(255,200,0,0)');
        }
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // ליבה
        const core = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        if (isFire) {
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.3, '#ffdd00');
            core.addColorStop(0.7, '#ff4400');
            core.addColorStop(1,   '#cc0000');
        } else if (cycle >= 3) { // סגול קוסמי
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.2, '#ffccff');
            core.addColorStop(0.5, '#cc00ff');
            core.addColorStop(1,   '#440088');
        } else if (cycle === 2) { // ארגמן
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.2, '#ffff00');
            core.addColorStop(0.5, '#ff2200');
            core.addColorStop(1,   '#880000');
        } else if (cycle === 1) { // זהב
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.3, '#ffffaa');
            core.addColorStop(0.7, '#ffaa00');
            core.addColorStop(1,   '#cc6600');
        } else if (isHoming) {
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.3, '#dd99ff');
            core.addColorStop(0.7, '#8800ff');
            core.addColorStop(1,   '#4400aa');
        } else {
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.4, '#ffff00');
            core.addColorStop(1,   '#ff8800');
        }
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
