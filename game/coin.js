class Coin {
    constructor(x, y, value) {
        this.x      = x;
        this.y      = y;
        this.vx     = (Math.random() - 0.5) * 120;
        this.vy     = -60 - Math.random() * 80;
        this.value  = value;
        this.radius = 7;
        this.dead   = false;
        this.age    = 0;
    }

    update(delta) {
        const gravity = 280;
        this.vy += gravity * delta;
        this.x  += this.vx * delta;
        this.y  += this.vy * delta;
        this.age += delta;

        // Dampen horizontal
        this.vx *= Math.pow(0.92, delta * 60);

        if (this.y > CANVAS_H + 40) this.dead = true;
    }

    draw(ctx) {
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

        // $ symbol
        ctx.fillStyle    = '#7a5a00';
        ctx.font         = `bold ${Math.floor(r * 1.2)}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', this.x, this.y + 0.5);

        ctx.restore();
    }
}
