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
        this.bounced     = false; // for 'bouncy' run upgrade (only bounces once)
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
        ctx.save();
        const isFire = this.type === 'fire';

        // Glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.6);
        if (isFire) {
            glow.addColorStop(0, 'rgba(255,120,0,0.7)');
            glow.addColorStop(1, 'rgba(255,30,0,0)');
        } else {
            glow.addColorStop(0, 'rgba(255,255,180,0.6)');
            glow.addColorStop(1, 'rgba(255,200,0,0)');
        }
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        const core = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        );
        if (isFire) {
            core.addColorStop(0,   '#ffffff');
            core.addColorStop(0.3, '#ffdd00');
            core.addColorStop(0.7, '#ff4400');
            core.addColorStop(1,   '#cc0000');
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
