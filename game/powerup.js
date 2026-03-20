class PowerUp {
    constructor(x, type) {
        this.x      = x;
        this.y      = -20;
        this.vy     = 100 + Math.random() * 50;
        this.type   = type; // 'shield' | 'fire' | 'heart'
        this.radius = 16;
        this.dead   = false;
        this.age    = 0;
    }

    update(delta) {
        this.y   += this.vy * delta;
        this.age += delta;
        if (this.y > CANVAS_H + 40) this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        const pulse = 0.88 + 0.12 * Math.sin(this.age * 5);
        const r     = this.radius * pulse;

        // Outer glow
        const glowPalette = {
            shield: ['rgba(0,180,255,0.45)', 'rgba(0,100,255,0)'],
            fire:   ['rgba(255,140,0,0.45)',  'rgba(255,50,0,0)'],
            heart:  ['rgba(255,60,120,0.45)', 'rgba(220,0,80,0)'],
        };
        const [g1, g2] = glowPalette[this.type];
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 2.6);
        glow.addColorStop(0, g1);
        glow.addColorStop(1, g2);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Circle body
        const bgColors     = { shield: '#001840', fire: '#3a0e00', heart: '#380018' };
        const borderColors = { shield: '#00aaff', fire: '#ff6600', heart: '#ff2266' };
        ctx.fillStyle   = bgColors[this.type];
        ctx.strokeStyle = borderColors[this.type];
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icon
        const icons = { shield: '🛡️', fire: '🔥', heart: '❤️' };
        ctx.font         = `${Math.floor(r * 1.3)}px Arial`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icons[this.type], this.x, this.y + 1);

        ctx.restore();
    }
}
