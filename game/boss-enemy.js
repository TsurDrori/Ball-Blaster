// ══════════════════════════════════════════════════════════════
//  אויב בוס — הגדרת קלאס + לוגיקת ליבה
//  נטען אחרי boss.js
// ══════════════════════════════════════════════════════════════
class BossEnemy {
    constructor(wave, overrideType = null, isMini = false, startX = null) {
        this.wave   = wave;
        this.type   = overrideType || getBossType(wave);
        this.isMini = isMini;

        const base   = Math.floor(Math.pow(wave, 1.8) * 400);
        this.maxHp   = isMini ? Math.floor(base * 0.55) : base;
        this.hp      = this.maxHp;
        this.radius  = isMini ? 38 : 52;

        this.x        = startX !== null ? startX : CANVAS_W / 2;
        this.y        = -this.radius - 10;
        this.targetY  = isMini ? 115 : 100;
        this.entering = true;
        this.dead     = false;
        this.flashTimer = 0;

        // מוחזר מ-update
        this._newBullets = [];
        this._newEnemies = [];

        // מצב כללי
        this.vx          = 70;
        this.moveDir     = 1;
        this.shootTimer  = 1.5;
        this.shootInterval = 2.0;

        this._initType();
    }

    // ── אתחול לפי סוג ───────────────────────────────────────
    _initType() {
        switch (this.type) {

            case 'shooter':
                this.shootInterval = 1.5; this.vx = 65;
                break;

            case 'bomber':
                this.shootInterval = 2.2; this.vx = 50;
                this.bombWarnX = null;
                break;

            case 'laser':
                this.vx = 50;
                this.laserState    = 'cooldown';
                this.laserCooldown = 3.5;
                this.laserAimTime  = 0;
                this.laserAimX     = CANVAS_W / 2;
                this.laserBurstLeft  = 0;
                this.laserBurstTimer = 0;
                break;

            case 'exploder':
                this.vx = 60; this.shootInterval = 1.4;
                this.explodeTimer    = 4.5;
                this.explodeInterval = 4.5;
                this.explodeTell     = 0;
                this.explodeTellDur  = 1.2;
                break;

            case 'shield':
                this.shieldAngle   = 0;
                this.shieldArcSize = Math.PI * 0.75;
                this.shieldSpeed   = 1.2;
                this.shootInterval = 1.5; this.vx = 60;
                break;

            case 'spinner':
                this.orbitAngle = -Math.PI / 2;
                this.orbitR     = 110;
                this.cx         = CANVAS_W / 2;
                this.cy         = 100;
                this.shootInterval = 1.2;
                break;

            case 'swarm':
                this.shootInterval = 1.5; this.vx = 65;
                this.swarmTimer    = 5.0;
                break;

            case 'teleporter':
                this.teleportTimer   = 2.5;
                this.teleportTell    = 0;
                this.teleportTellDur = 0.55;
                this.teleportFlash   = 0;
                this.pendingX        = CANVAS_W / 2;
                break;

            case 'splitter':
                this.splitDone = false;
                this.splitting = false;
                this.shootInterval = 1.4; this.vx = 65;
                break;

            case 'spiral':
                this.spiralAngle   = Math.PI / 2;
                this.spiralStep    = 0.6;
                this.shootInterval = 0.22; this.vx = 45;
                break;
        }
    }

    get phase() { return this.hp / this.maxHp < 0.45 ? 2 : 1; }

    get isTelling() {
        if (this.entering) return false;
        if (this.type === 'laser')      return this.laserState === 'aiming';
        if (this.type === 'exploder')   return this.explodeTell > 0;
        if (this.type === 'teleporter') return this.teleportTell > 0;
        if (this.type === 'bomber')     return this.bombWarnX !== null;
        return this.shootTimer < 0.65 && this.shootTimer > 0;
    }

    // ── עדכון ─────────────────────────────────────────────────
    update(delta, cannonX = CANVAS_W / 2) {
        this._newBullets = [];
        this._newEnemies = [];
        if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - delta);

        if (this.entering) {
            this.y += 220 * delta;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
                if (this.type === 'spinner') {
                    this.cx = CANVAS_W / 2;
                    this.cy = this.targetY;
                }
            }
            return;
        }

        if (gameState.iceTimer > 0) return;

        switch (this.type) {
            case 'shooter':    this._tickShooter(delta);          break;
            case 'bomber':     this._tickBomber(delta);           break;
            case 'laser':      this._tickLaser(delta, cannonX);   break;
            case 'exploder':   this._tickExploder(delta);         break;
            case 'shield':     this._tickShield(delta);           break;
            case 'spinner':    this._tickSpinner(delta);          break;
            case 'swarm':      this._tickSwarm(delta);            break;
            case 'teleporter': this._tickTeleporter(delta);       break;
            case 'splitter':   this._tickSplitter(delta);         break;
            case 'spiral':     this._tickSpiral(delta);           break;
        }
    }

    // ── עזרי תנועה ועזרי ירי ─────────────────────────────────
    _sideMove(delta, mult = 1.0) {
        const spd = (this.phase === 2 ? this.vx * 1.35 : this.vx) * mult;
        this.x += spd * this.moveDir * delta;
        if (this.x + this.radius > CANVAS_W - 20) { this.x = CANVAS_W - 20 - this.radius; this.moveDir = -1; }
        if (this.x - this.radius < 20)             { this.x = 20 + this.radius;             this.moveDir =  1; }
    }

    _bulletHp() {
        const w = this.wave;
        const base = Math.max(1, Math.floor(Math.pow(w, 2.0)));
        let mod;
        if (w <= 3) mod = 0.3;
        else if (w <= 5) mod = 0.5;
        else {
            const cycle = Math.floor((w - 6) / 7);
            const pos   = (w - 6) % 7;
            if (pos === 3)      mod = Math.max(0.3, 0.5 - cycle * 0.015);
            else if (pos === 6) mod = Math.min(2.5, 1.5 + cycle * 0.06);
            else { const r = [0.7, 0.8, 0.9, 0, 0.85, 1.0, 1.15]; mod = r[pos]; }
        }
        return Math.max(1, Math.floor(base * mod));
    }

    _spread(n, fanRad, speed, style = 'normal', radius = 9) {
        const step = n > 1 ? fanRad / (n - 1) : 0;
        const base = Math.PI / 2 - (n > 1 ? fanRad / 2 : 0);
        const hp   = this._bulletHp();
        for (let i = 0; i < n; i++) {
            const a = base + i * step;
            this._newBullets.push(new BossBullet(
                this.x, this.y + this.radius + 5,
                Math.cos(a) * speed, Math.sin(a) * speed,
                { style, radius, hp }
            ));
        }
    }

    hit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) { this.hp = 0; this.dead = true; }
        else this.flashTimer = 0.13;
    }

    // האם כדור שיורה מ-(bx,by) חסום ע"י המגן?
    blocksHit(bx, by) {
        if (this.type !== 'shield') return false;
        const hitAngle = Math.atan2(by - this.y, bx - this.x);
        let diff = hitAngle - this.shieldAngle;
        diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
        return Math.abs(diff) < this.shieldArcSize / 2;
    }
}
// _tick* — ב-boss-ticks.js
// drawBody, drawHUD — ב-boss-draw.js
