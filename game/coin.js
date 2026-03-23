class Coin {
    constructor(x, y, value, isDiamond = false) {
        this.x         = x;
        this.y         = y;
        this.vx        = (Math.random() - 0.5) * 120;
        this.vy        = -60 - Math.random() * 80;
        this.value     = value;
        this.isDiamond = isDiamond;
        this.radius    = isDiamond ? 18 : 14;
        this.dead      = false;
        this.age       = 0;
    }

    update(delta, magnet) {
        const gravity = 280;
        let inMagnetField = false;

        if (magnet) {
            const dx = magnet.x - this.x;
            const dy = magnet.y - this.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < magnet.r * magnet.r && distSq > 1) {
                const dist = Math.sqrt(distSq);
                const pull = 1200; // px/s² — strong enough to overcome gravity
                this.vx += (dx / dist) * pull * delta;
                this.vy += (dy / dist) * pull * delta;
                inMagnetField = true;
            }
        }

        this.vy += gravity * delta;
        this.x  += this.vx * delta;
        this.y  += this.vy * delta;
        this.age += delta;

        // Skip horizontal damping when being magnetically pulled
        if (!inMagnetField) {
            this.vx *= Math.pow(0.92, delta * 60);
        }

        if (this.y > CANVAS_H + 40) this.dead = true;
    }

    draw(ctx) {
        if (this.isDiamond) { this._drawGem(ctx); return; }

        const pulse = 0.92 + 0.08 * Math.sin(this.age * 8);
        const r     = this.radius * pulse;

        ctx.save();

        // Glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2.2);
        glow.addColorStop(0,   'rgba(255,230,50,0.35)');
        glow.addColorStop(1,   'rgba(255,200,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Coin body
        const grad = ctx.createRadialGradient(this.x - r * 0.3, this.y - r * 0.3, 0, this.x, this.y, r);
        grad.addColorStop(0, '#fff176');
        grad.addColorStop(0.5, '#ffd700');
        grad.addColorStop(1,   '#c8960c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // coin value
        ctx.fillStyle    = '#7a5a00';
        ctx.font         = `bold ${Math.floor(r * 0.95)}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, this.x, this.y + 0.5);

        ctx.restore();
    }

    _drawGem(ctx) {
        const pulse = 0.93 + 0.07 * Math.sin(this.age * 7);
        const r = this.radius * pulse;
        const x = this.x, y = this.y;
        const t = this.age;

        ctx.save();

        // זוהר
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        glow.addColorStop(0,   'rgba(100,240,255,0.5)');
        glow.addColorStop(0.5, 'rgba(0,180,255,0.2)');
        glow.addColorStop(1,   'rgba(0,80,200,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // מחצית עליונה
        ctx.beginPath();
        ctx.moveTo(x,     y - r);
        ctx.lineTo(x + r, y    );
        ctx.lineTo(x,     y    );
        ctx.lineTo(x - r, y    );
        ctx.closePath();
        const topG = ctx.createLinearGradient(x, y - r, x, y);
        topG.addColorStop(0, '#edfeff');
        topG.addColorStop(1, '#00d4f0');
        ctx.fillStyle = topG;
        ctx.fill();

        // מחצית תחתונה
        ctx.beginPath();
        ctx.moveTo(x - r, y    );
        ctx.lineTo(x + r, y    );
        ctx.lineTo(x,     y + r);
        ctx.closePath();
        const botG = ctx.createLinearGradient(x, y, x, y + r);
        botG.addColorStop(0, '#00BCD4');
        botG.addColorStop(1, '#003d52');
        ctx.fillStyle = botG;
        ctx.fill();

        // פסים פנימיים
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x - r * 0.45, y);
        ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.45, y);
        ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
        ctx.stroke();

        // מסגרת לבנה
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // הברקה
        ctx.beginPath();
        ctx.moveTo(x - r * 0.25, y - r * 0.42);
        ctx.lineTo(x + r * 0.07, y - r * 0.68);
        ctx.lineTo(x - r * 0.04, y - r * 0.2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fill();

        // כוכב נצנוץ מסתובב
        const ang = t * 2.2;
        const ss  = 2 + 1.2 * Math.abs(Math.sin(t * 3));
        ctx.save();
        ctx.translate(x + Math.cos(ang) * r * 1.35, y + Math.sin(ang) * r * 1.35);
        ctx.rotate(ang);
        ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.abs(Math.sin(t * 4))})`;
        ctx.beginPath();
        ctx.moveTo(0, -ss); ctx.lineTo(ss * 0.22, 0);
        ctx.lineTo(0,  ss); ctx.lineTo(-ss * 0.22, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }
}
