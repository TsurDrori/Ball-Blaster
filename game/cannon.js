class Cannon {
    constructor() {
        this.x      = CANVAS_W / 2;
        this.y      = CANVAS_H - 72;
        this.w      = 120;
        this.h      = 64;
        this.fireTimer = 0;
        this.muzzleFlash = 0; // cosmetic flash timer
        this.hitFlash = 0;    // red flash when life lost
    }

    // Persistent upgrade base fire rate, then 'rapid' run upgrade trims 25%
    get fireRate() {
        const base = Math.max(0.025, 0.16 - (gameState.upgrades.fireRate - 1) * 0.015);
        return gameState.hasRunUpgrade('rapid') ? base * 0.75 : base;
    }
    // Cap at 8 (was 10) — run upgrades like 'marked' and 'pierce' cover the gap
    get damage()       { return Math.min(8, gameState.upgrades.damage); }
    // כל 5 רמות מתאפסים ל-1 כדור אבל פי 10 נזק לכדור (פי 2 מסך כל הקודמים)
    get bulletCount()  { return ((gameState.upgrades.multiShot - 1) % 5) + 1; }
    get bulletRadius() { return 9  + (gameState.upgrades.ballSize  - 1) * 2; }
    get bulletSpeed()  { return 520; }
    // 'magnetic' run upgrade doubles the coin pickup radius
    get collectR()     { return gameState.hasRunUpgrade('magnetic') ? 170 : 85; }
    get moveSpeed()    { return 380; } // px/s keyboard movement

    update(delta, keys, touchX) {
        // Keyboard: WASD or arrow keys
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.x -= this.moveSpeed * delta;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) this.x += this.moveSpeed * delta;
        // Touch fallback for mobile
        if (touchX !== null) this.x += (touchX - this.x) * Math.min(1, 22 * delta);
        this.x = Math.max(this.w / 2, Math.min(CANVAS_W - this.w / 2, this.x));

        if (this.muzzleFlash > 0) this.muzzleFlash -= delta;
        if (this.hitFlash > 0) this.hitFlash -= delta;

        this.fireTimer -= delta;
        if (this.fireTimer <= 0) {
            this.fireTimer = this.fireRate;
            this.muzzleFlash = 0.06;
            return true; // fire signal
        }
        return false;
    }

    createBullets() {
        const count       = this.bulletCount;
        const result      = [];
        const step        = 22;
        const totalSpread = (count - 1) * step;
        const isFire      = gameState.fireTimer > 0;

        const activeCannon = gameState.skins?.activeCannon || 'default';
        const activeBullet = gameState.skins?.activeBullet || 'default';

        let bulletSkin   = activeBullet;

        // מחזור: כל 5 רמות חוזרים ל-1 כדור אבל פי 10 נזק (= פי 2 מסך כל המחזור הקודם)
        // נוסחה: נזק לכדור = baseDmg × 10^מחזור
        const cycle      = Math.floor((gameState.upgrades.multiShot - 1) / 5);
        const cycleMult  = Math.pow(10, cycle);
        // גודל כדור גדל קצת עם כל מחזור (ויזואלי)
        const cycleRadiusMult = 1 + cycle * 0.4;

        const isBouncyActive = !isFire && gameState.hasRunUpgrade('bouncy');
        for (let i = 0; i < count; i++) {
            const xOffset = count > 1 ? -totalSpread / 2 + step * i : 0;
            const radius  = (isFire ? this.bulletRadius * 1.25 : this.bulletRadius * cycleRadiusMult);
            const damage  = (isFire ? this.damage * 3 : this.damage * cycleMult);
            const type    = isFire ? 'fire' : 'normal';
            let vx = 0;
            if (isBouncyActive) {
                if (count > 1) {
                    const mid = (count - 1) / 2;
                    vx = (i - mid) * 40;
                } else {
                    // כדור יחיד - נשלח לכיוון הקיר הקרוב
                    vx = this.x < CANVAS_W / 2 ? -60 : 60;
                }
            }
            const b = new Bullet(this.x + xOffset, this.y - this.h / 2 - 4, vx, -this.bulletSpeed, radius, damage, type);
            b.skin  = (isFire || cycle > 0) ? null : bulletSkin;
            b.cycle = cycle;
            result.push(b);
        }
        // Mark the middle bullet as homing
        if (!isFire && gameState.hasRunUpgrade('homing') && result.length > 0) {
            result[Math.floor(result.length / 2)].homing = true;
        }
        return result;
    }

    _armorColors() {
        const lv = gameState.upgrades.lives;
        if (lv >= 5) return {
            base0: '#6a4020', base1: '#1a0800',
            bar0: '#3a2010', bar1: '#7a5030', bar2: '#1a0800',
            muzzle: '#2a1800', outline: '#110900',
            rings: ['#cc9900', '#ffcc22'], ringCount: 3,
            glow: 'rgba(200,120,0,0.18)',
        };
        if (lv >= 4) return {
            base0: '#4a5060', base1: '#101820',
            bar0: '#283040', bar1: '#607080', bar2: '#101820',
            muzzle: '#202838', outline: '#0a1018',
            rings: ['#aa8800', '#ddbb22'], ringCount: 2,
            glow: 'rgba(120,100,0,0.14)',
        };
        if (lv >= 3) return {
            base0: '#708090', base1: '#202830',
            bar0: '#405060', bar1: '#7a9098', bar2: '#202830',
            muzzle: '#303848', outline: '#1a2028',
            rings: ['#8a7a60', '#b0a080'], ringCount: 1,
            glow: null,
        };
        if (lv >= 2) return {
            base0: '#a0aab8', base1: '#4a5460',
            bar0: '#607080', bar1: '#9aaab8', bar2: '#404e5c',
            muzzle: '#40505e', outline: '#2a3038',
            rings: ['#708898', '#90a8b8'], ringCount: 1,
            glow: null,
        };
        return {
            base0: '#d0d8e0', base1: '#6a7580',
            bar0: '#8a9aa0', bar1: '#c8d8e0', bar2: '#5a6a70',
            muzzle: '#445566', outline: '#334',
            rings: null, ringCount: 0,
            glow: null,
        };
    }

    draw(ctx) {
        const activeSkin = gameState.skins?.activeCannon || 'default';
        if (activeSkin !== 'default') {
            drawCannonSkin(ctx, this, activeSkin);
            return;
        }
        ctx.save();
        const ac = this._armorColors();

        // --- hit flash overlay (red when life lost) ---
        const hitAlpha = this.hitFlash > 0 ? (this.hitFlash / 0.5) * 0.7 : 0;

        // --- shield bubble ---
        if (gameState.shieldTimer > 0) {
            const t     = performance.now() * 0.003;
            const pulse = 0.82 + 0.18 * Math.sin(t * 3);
            const sr    = 76 * pulse;
            ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t * 2);
            const sg = ctx.createRadialGradient(this.x, this.y, 20, this.x, this.y, sr);
            sg.addColorStop(0,   'rgba(0,180,255,0.05)');
            sg.addColorStop(0.7, 'rgba(0,140,255,0.25)');
            sg.addColorStop(1,   'rgba(0,80,255,0.05)');
            ctx.fillStyle = sg;
            ctx.beginPath();
            ctx.arc(this.x, this.y, sr, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(0,220,255,${0.6 + 0.35 * Math.sin(t * 5)})`;
            ctx.lineWidth   = 2.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, sr, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // --- glow for high-tier armor ---
        if (ac.glow) {
            const glow = ctx.createRadialGradient(this.x, this.y, 8, this.x, this.y, 72);
            glow.addColorStop(0, ac.glow);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 72, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- base platform (ellipse) ---
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, this.w / 2, 24, 0, 0, Math.PI * 2);
        const baseGrad = ctx.createRadialGradient(this.x - 18, this.y + 10, 4, this.x, this.y + 20, this.w / 2);
        baseGrad.addColorStop(0, ac.base0);
        baseGrad.addColorStop(1, ac.base1);
        ctx.fillStyle = baseGrad;
        ctx.fill();
        ctx.strokeStyle = ac.outline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- barrel ---
        const lv = gameState.upgrades.lives;
        const bw = 28 + Math.min(lv - 1, 4) * 2;
        const bh = this.h;
        const bx = this.x - bw / 2, by = this.y - bh / 2;
        const barrelGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        barrelGrad.addColorStop(0, ac.bar0);
        barrelGrad.addColorStop(0.4, ac.bar1);
        barrelGrad.addColorStop(1, ac.bar2);
        ctx.fillStyle = barrelGrad;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.strokeStyle = ac.outline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- decorative rings on barrel (for upgraded armor) ---
        if (ac.ringCount > 0 && ac.rings) {
            const positions = ac.ringCount === 1 ? [0.55] : ac.ringCount === 2 ? [0.38, 0.68] : [0.25, 0.5, 0.75];
            for (const p of positions) {
                const ry = by + bh * p;
                const rh = 6;
                const ringG = ctx.createLinearGradient(bx - 4, 0, bx + bw + 4, 0);
                ringG.addColorStop(0, ac.rings[0]);
                ringG.addColorStop(0.5, ac.rings[1]);
                ringG.addColorStop(1, ac.rings[0]);
                ctx.fillStyle = ringG;
                ctx.beginPath();
                ctx.roundRect(bx - 4, ry - rh / 2, bw + 8, rh, 3);
                ctx.fill();
                ctx.strokeStyle = ac.rings[0];
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // --- muzzle ring ---
        const mw = 40 + Math.min(lv - 1, 4) * 2;
        const mh = 14;
        ctx.fillStyle = ac.muzzle;
        ctx.beginPath();
        ctx.roundRect(this.x - mw / 2, by - 6, mw, mh, 5);
        ctx.fill();
        ctx.strokeStyle = ac.outline;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- hit flash (red overlay when life lost) ---
        if (hitAlpha > 0) {
            ctx.globalAlpha = hitAlpha;
            ctx.fillStyle = '#ff2200';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 20, this.w / 2, 24, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(bx - 4, by, bw + 8, bh, 6);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // --- muzzle flash ---
        if (this.muzzleFlash > 0) {
            const alpha   = this.muzzleFlash / 0.06;
            const isFire  = gameState.fireTimer > 0;
            ctx.globalAlpha = alpha * 0.9;
            const flash = ctx.createRadialGradient(this.x, by - 12, 0, this.x, by - 12, 38);
            if (isFire) {
                flash.addColorStop(0,   '#ffffff');
                flash.addColorStop(0.4, '#ff8800');
                flash.addColorStop(1,   'rgba(255,40,0,0)');
            } else {
                flash.addColorStop(0,   '#ffffaa');
                flash.addColorStop(0.5, '#ffaa00');
                flash.addColorStop(1,   'rgba(255,100,0,0)');
            }
            ctx.fillStyle = flash;
            ctx.beginPath();
            ctx.arc(this.x, by - 12, isFire ? 38 : 32, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    getCollector() {
        return { x: this.x, y: this.y, r: this.collectR };
    }
}
