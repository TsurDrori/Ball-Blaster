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
    // מחזור C מתחיל ב-C כדורי פרסטיג' ומוסיף עד 4 רגילים (סה"כ C+4 בסוף המחזור)
    get bulletCount() {
        const lv    = gameState.upgrades.multiShot;
        const cycle = Math.floor((lv - 1) / 5);
        const pos   = (lv - 1) % 5; // מיקום בתוך המחזור: 0..4
        return cycle > 0 ? cycle + pos : pos + 1;
    }
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

        // מחזור C: cycle כדורי פרסטיג' (×10^cycle נזק) + שאר כדורים רגילים.
        // כדורי הפרסטיג' מרוכזים במרכז המניפה.
        const cycle          = Math.floor((gameState.upgrades.multiShot - 1) / 5);
        const prestigeCount  = cycle; // מס' כדורי פרסטיג' = מספר המחזור
        const prestigeStart  = Math.floor((count - prestigeCount) / 2); // מרכוז

        const isBouncyActive = !isFire && gameState.hasRunUpgrade('bouncy');
        for (let i = 0; i < count; i++) {
            const xOffset    = count > 1 ? -totalSpread / 2 + step * i : 0;
            const isPrestige = !isFire && cycle > 0 && i >= prestigeStart && i < prestigeStart + prestigeCount;
            const radius     = isFire       ? this.bulletRadius * 1.25
                             : isPrestige   ? this.bulletRadius * (1 + cycle * 0.4)
                             :                this.bulletRadius;
            const damage     = isFire       ? this.damage * 3
                             : isPrestige   ? this.damage * Math.pow(10, cycle)
                             :                this.damage;
            const type    = isFire ? 'fire' : 'normal';
            let vx = 0;
            if (isBouncyActive) {
                if (count > 1) {
                    const mid = (count - 1) / 2;
                    vx = (i - mid) * 40;
                } else {
                    vx = this.x < CANVAS_W / 2 ? -60 : 60;
                }
            }
            const b = new Bullet(this.x + xOffset, this.y - this.h / 2 - 4, vx, -this.bulletSpeed, radius, damage, type);
            b.skin  = (isFire || isPrestige) ? null : bulletSkin;
            b.cycle = isPrestige ? cycle : 0; // רק הכדור המרכזי מקבל צבע מחזור
            result.push(b);
        }
        // Mark the middle bullet as homing
        if (!isFire && gameState.hasRunUpgrade('homing') && result.length > 0) {
            result[Math.floor(result.length / 2)].homing = true;
        }
        return result;
    }

}
// _armorColors, draw, getCollector — ב-cannon-draw.js
