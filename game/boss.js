// ──────────────────────────────────────────
//  מערכת בוסים — מופיע כל 5 גלים
// ──────────────────────────────────────────
//
//  10 סוגי בוסים ייחודיים, מסתובבים בלולאה:
//   גל  5 → קלע       (ירי מכוון, הכרת המכניקה)
//   גל 10 → מפציץ     (מפיל פצצות, אזהרה בקרקע)
//   גל 15 → לייזר     (קרן לאורך עמודת התותח, אזהרה מקווקוות)
//   גל 20 → מתפוצץ    (טבעת כדורים רדיאלית עם השהייה)
//   גל 25 → מגן       (קשת מסתובבת חוסמת כדורים)
//   גל 30 → סחרחר     (מקיף בעיגול, יורה לכל הכיוונים)
//   גל 35 → נחיל      (מזמין כדורי אויב)
//   גל 40 → מעביר     (מתקפל למקום חדש, רוח רפאים כאזהרה)
//   גל 45 → מפצל      (מתפצל לשניים ב-50% חיים, סדקים כאזהרה)
//   גל 50 → ספירלה    (ספירלת כדורים מסתובבת)
// ──────────────────────────────────────────

const BOSS_ROSTER = [
    'shooter', 'bomber', 'laser', 'exploder', 'shield',
    'spinner', 'swarm',  'teleporter', 'splitter', 'spiral',
];

const BOSS_NAMES = {
    shooter:    'הקלע',
    bomber:     'המפציץ',
    laser:      'הלייזר',
    exploder:   'המתפוצץ',
    shield:     'המגן',
    spinner:    'הסחרחר',
    swarm:      'הנחיל',
    teleporter: 'המעביר',
    splitter:   'המפצל',
    spiral:     'הספירלה',
};

const BOSS_ICONS = {
    shooter:    '🎯',
    bomber:     '💣',
    laser:      '⚡',
    exploder:   '💥',
    shield:     '🛡️',
    spinner:    '🌀',
    swarm:      '🐝',
    teleporter: '👁️',
    splitter:   '✂️',
    spiral:     '🔮',
};

// [dark, mid, light] — צבעי גוף לפי סוג
const BOSS_COLORS = {
    shooter:    ['#220044', '#7700cc', '#dd88ff'],
    bomber:     ['#3a1800', '#bb4400', '#ff8833'],
    laser:      ['#003333', '#009988', '#44ffee'],
    exploder:   ['#440000', '#cc0000', '#ff6666'],
    shield:     ['#002244', '#005599', '#33aaff'],
    spinner:    ['#003322', '#006644', '#44cc88'],
    swarm:      ['#1a2800', '#446600', '#99cc33'],
    teleporter: ['#330022', '#990055', '#ff66aa'],
    splitter:   ['#442200', '#aa5500', '#ffaa44'],
    spiral:     ['#110033', '#550099', '#aa55ee'],
};

function getBossType(wave) {
    return BOSS_ROSTER[(Math.floor(wave / 5) - 1) % BOSS_ROSTER.length];
}

// ════════════════════════════════════════════════════════════
//  כדורי בוס
// ════════════════════════════════════════════════════════════
class BossBullet {
    constructor(x, y, vx, vy, opts = {}) {
        this.x      = x;
        this.y      = y;
        this.vx     = vx;
        this.vy     = vy;
        this.radius = opts.radius || 9;
        this.style  = opts.style  || 'normal'; // 'normal' | 'bomb' | 'laser'
        this.dead   = false;
    }

    update(delta) {
        if (gameState.iceTimer > 0) return;
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        if (this.y > CANVAS_H + 50 || this.x < -50 || this.x > CANVAS_W + 50 || this.y < -120) {
            this.dead = true;
        }
    }

    hitsCannon(cannon) {
        const cx = cannon.x, cy = cannon.y + 3;
        const hw = 58, hh = 40;
        const nearX = Math.max(cx - hw, Math.min(this.x, cx + hw));
        const nearY = Math.max(cy - hh, Math.min(this.y, cy + hh));
        const dx = this.x - nearX, dy = this.y - nearY;
        return (dx * dx + dy * dy) < this.radius * this.radius;
    }

    draw(ctx) {
        ctx.save();
        switch (this.style) {
            case 'bomb':  this._drawBomb(ctx);  break;
            case 'laser': this._drawLaser(ctx); break;
            default:      this._drawNormal(ctx); break;
        }
        ctx.restore();
    }

    _drawNormal(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.3);
        g.addColorStop(0,   'rgba(255,100,0,0.55)');
        g.addColorStop(0.5, 'rgba(200,0,0,0.22)');
        g.addColorStop(1,   'rgba(160,0,0,0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.3, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

        const b = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius);
        b.addColorStop(0,   '#ffcc88');
        b.addColorStop(0.5, '#ff4400');
        b.addColorStop(1,   '#880000');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = b; ctx.fill();
        ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    _drawBomb(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        g.addColorStop(0, 'rgba(255,110,0,0.5)'); g.addColorStop(1, 'rgba(100,0,0,0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill();
        ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 3; ctx.stroke();

        // פתיל מהבהב
        const t = _frameNow * 0.008;
        ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 2, this.y - this.radius);
        ctx.lineTo(this.x + 6, this.y - this.radius - 7 + Math.sin(t * 8) * 2);
        ctx.stroke();
        if (Math.floor(t * 5) % 2 === 0) {
            ctx.beginPath();
            ctx.arc(this.x + 6, this.y - this.radius - 7, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffee00'; ctx.fill();
        }
    }

    _drawLaser(ctx) {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.2);
        g.addColorStop(0, 'rgba(0,230,255,0.85)'); g.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
    }
}

// ════════════════════════════════════════════════════════════
//  אויב בוס
// ════════════════════════════════════════════════════════════
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
                this.shootInterval = 2.0; this.vx = 65;
                break;

            case 'bomber':
                this.shootInterval = 3.0; this.vx = 50;
                this.bombWarnX = null; // X של אזהרת פצצה (null = ללא אזהרה)
                break;

            case 'laser':
                this.vx = 50;
                this.laserState    = 'cooldown';
                this.laserCooldown = 3.5;
                this.laserAimTime  = 0;   // זמן הכוונה שנותר
                this.laserAimX     = CANVAS_W / 2;
                this.laserBurstLeft  = 0;
                this.laserBurstTimer = 0;
                break;

            case 'exploder':
                this.vx = 60; this.shootInterval = 1.8;
                this.explodeTimer    = 4.5;
                this.explodeInterval = 4.5;
                this.explodeTell     = 0;
                this.explodeTellDur  = 1.2;
                break;

            case 'shield':
                this.shieldAngle   = 0;
                this.shieldArcSize = Math.PI * 0.75; // רוחב הקשת
                this.shieldSpeed   = 1.2;
                this.shootInterval = 2.0; this.vx = 60;
                break;

            case 'spinner':
                this.orbitAngle = -Math.PI / 2;
                this.orbitR     = 110;
                this.cx         = CANVAS_W / 2;
                this.cy         = 100;
                this.shootInterval = 1.6;
                break;

            case 'swarm':
                this.shootInterval = 2.0; this.vx = 65;
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
                this.splitting = false; // game.js קורא לזה
                this.shootInterval = 1.8; this.vx = 65;
                break;

            case 'spiral':
                this.spiralAngle   = Math.PI / 2; // מתחיל כלפי מטה
                this.spiralStep    = 0.6; // רדיאנים לכל יריה
                this.shootInterval = 0.28; this.vx = 45;
                break;
        }
    }

    get phase() { return this.hp / this.maxHp < 0.45 ? 2 : 1; }

    // האם הבוס עומד לירות (להדלקת זוהר אזהרה)?
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

    // יורה n כדורים בפיזור (מוגדר ב-radian) כלפי מטה
    _spread(n, fanRad, speed, style = 'normal', radius = 9) {
        const step = n > 1 ? fanRad / (n - 1) : 0;
        const base = Math.PI / 2 - (n > 1 ? fanRad / 2 : 0);
        for (let i = 0; i < n; i++) {
            const a = base + i * step;
            this._newBullets.push(new BossBullet(
                this.x, this.y + this.radius + 5,
                Math.cos(a) * speed, Math.sin(a) * speed,
                { style, radius }
            ));
        }
    }

    // ── התנהגויות לפי סוג ────────────────────────────────────

    _tickShooter(delta) {
        this._sideMove(delta);
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 1.4 : this.shootInterval;
            this._spread(this.phase === 2 ? 5 : 3, 0.5, this.phase === 2 ? 280 : 220);
        }
    }

    _tickBomber(delta) {
        this._sideMove(delta, 0.7);
        this.shootTimer -= delta;

        // הצג אזהרה 0.8 שניות לפני ירי
        if (this.shootTimer <= 0.8) {
            this.bombWarnX = this.x; // עוקב אחרי הבוס
        } else {
            this.bombWarnX = null;
        }

        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 2.2 : this.shootInterval;
            const cnt = this.phase === 2 ? 4 : 3;
            const fan = this.phase === 2 ? 0.42 : 0.28;
            // כדורי פצצה איטיים ומסוכנים
            for (let i = 0; i < cnt; i++) {
                const a = Math.PI / 2 + (i - (cnt - 1) / 2) * fan;
                this._newBullets.push(new BossBullet(
                    this.x, this.y + this.radius + 5,
                    Math.cos(a) * 85, Math.sin(a) * 85,
                    { style: 'bomb', radius: 14 }
                ));
            }
            this.bombWarnX = null;
        }
    }

    _tickLaser(delta, cannonX) {
        this._sideMove(delta, 0.6);
        if (this.laserState === 'cooldown') {
            this.laserCooldown -= delta;
            if (this.laserCooldown <= 0) {
                this.laserState   = 'aiming';
                this.laserAimTime = this.phase === 2 ? 1.3 : 1.8;
                this.laserAimX    = cannonX; // מכוון לעמודת התותח!
            }
        } else if (this.laserState === 'aiming') {
            this.laserAimTime -= delta;
            if (this.laserAimTime <= 0) {
                this.laserState      = 'firing';
                this.laserBurstLeft  = this.phase === 2 ? 14 : 9;
                this.laserBurstTimer = 0;
            }
        } else { // firing
            this.laserBurstTimer -= delta;
            if (this.laserBurstTimer <= 0 && this.laserBurstLeft > 0) {
                this.laserBurstTimer = 0.07;
                this.laserBurstLeft--;
                this._newBullets.push(new BossBullet(
                    this.laserAimX + (Math.random() - 0.5) * 18,
                    this.y + this.radius,
                    0, 490,
                    { style: 'laser', radius: 7 }
                ));
            }
            if (this.laserBurstLeft <= 0) {
                this.laserState    = 'cooldown';
                this.laserCooldown = this.phase === 2 ? 2.8 : 4.0;
            }
        }
    }

    _tickExploder(delta) {
        this._sideMove(delta);
        // ירי רגיל בין פיצוצים
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 1.4 : this.shootInterval;
            this._spread(this.phase === 2 ? 3 : 2, 0.3, 220);
        }
        // פיצוץ רדיאלי
        if (this.explodeTell > 0) {
            this.explodeTell -= delta;
            if (this.explodeTell <= 0) {
                const cnt = this.phase === 2 ? 16 : 12;
                const spd = this.phase === 2 ? 280 : 230;
                for (let i = 0; i < cnt; i++) {
                    const a = (i / cnt) * Math.PI * 2;
                    this._newBullets.push(new BossBullet(
                        this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd
                    ));
                }
                this.explodeTimer = this.phase === 2 ? 3.2 : this.explodeInterval;
            }
        } else {
            this.explodeTimer -= delta;
            if (this.explodeTimer <= 0) {
                this.explodeTell = this.explodeTellDur;
            }
        }
    }

    _tickShield(delta) {
        this.shieldAngle += (this.phase === 2 ? 1.6 : this.shieldSpeed) * delta;
        this._sideMove(delta);
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 1.4 : this.shootInterval;
            this._spread(this.phase === 2 ? 4 : 3, 0.42, 235);
        }
    }

    // האם כדור שיורה מ-(bx,by) חסום ע"י המגן?
    blocksHit(bx, by) {
        if (this.type !== 'shield') return false;
        const hitAngle = Math.atan2(by - this.y, bx - this.x);
        let diff = hitAngle - this.shieldAngle;
        diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
        return Math.abs(diff) < this.shieldArcSize / 2;
    }

    _tickSpinner(delta) {
        const spd = this.phase === 2 ? 1.4 : 0.9;
        this.orbitAngle += spd * delta;
        this.x = this.cx + Math.cos(this.orbitAngle) * this.orbitR;
        this.y = this.cy + Math.sin(this.orbitAngle) * this.orbitR * 0.42;
        this.y = Math.max(50, Math.min(CANVAS_H * 0.40, this.y));

        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 1.2 : this.shootInterval;
            const cnt = this.phase === 2 ? 6 : 4;
            const bspd = this.phase === 2 ? 270 : 210;
            for (let i = 0; i < cnt; i++) {
                const a = this.orbitAngle + (i / cnt) * Math.PI * 2;
                this._newBullets.push(new BossBullet(
                    this.x, this.y, Math.cos(a) * bspd, Math.sin(a) * bspd
                ));
            }
        }
    }

    _tickSwarm(delta) {
        this._sideMove(delta);
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 1.4 : this.shootInterval;
            this._spread(3, 0.4, 230);
        }
        this.swarmTimer -= delta;
        if (this.swarmTimer <= 0) {
            this.swarmTimer = this.phase === 2 ? 3.5 : 5.0;
            const cnt = this.phase === 2 ? 3 : 2;
            const hp  = Math.max(2, Math.floor(this.wave * this.wave * 0.25));
            const spd = 35 + this.wave * 2;
            for (let i = 0; i < cnt; i++) {
                const ex = 80 + Math.random() * (CANVAS_W - 160);
                this._newEnemies.push(new EnemyBall(ex, hp, spd, 'normal'));
            }
        }
    }

    _tickTeleporter(delta) {
        if (this.teleportFlash > 0) this.teleportFlash = Math.max(0, this.teleportFlash - delta);

        if (this.teleportTell > 0) {
            this.teleportTell -= delta;
            if (this.teleportTell <= 0) {
                // ביצוע הקפיצה
                this.x = this.pendingX;
                this.teleportFlash = 0.45;
                // ירי אחרי קפיצה
                this._spread(this.phase === 2 ? 5 : 3, 0.5, this.phase === 2 ? 280 : 235);
            }
            return;
        }

        this.teleportTimer -= delta;
        if (this.teleportTimer <= 0) {
            this.teleportTimer = this.phase === 2 ? 1.8 : 2.5;
            this.teleportTell  = this.teleportTellDur;
            // בחר מיקום חדש (לא קרוב מדי)
            let newX;
            do { newX = this.radius + 25 + Math.random() * (CANVAS_W - (this.radius + 25) * 2); }
            while (Math.abs(newX - this.x) < 110);
            this.pendingX = newX;
        }
    }

    _tickSplitter(delta) {
        this._sideMove(delta);
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 1.2 : this.shootInterval;
            this._spread(3, 0.4, 235);
        }
        // הפיצול ב-50% חיים (לא מיני-בוסים)
        if (!this.splitDone && !this.isMini && this.hp <= this.maxHp * 0.5) {
            this.splitDone = true;
            this.splitting = true; // game.js מזהה ומחליף
            this.dead = true;
        }
    }

    _tickSpiral(delta) {
        this._sideMove(delta, 0.7);
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = this.phase === 2 ? 0.20 : this.shootInterval;
            const spd = this.phase === 2 ? 255 : 200;
            this._newBullets.push(new BossBullet(
                this.x, this.y + 5,
                Math.cos(this.spiralAngle) * spd,
                Math.sin(this.spiralAngle) * spd
            ));
            if (this.phase === 2) {
                // ספירלה נגדית
                this._newBullets.push(new BossBullet(
                    this.x, this.y + 5,
                    Math.cos(this.spiralAngle + Math.PI) * spd,
                    Math.sin(this.spiralAngle + Math.PI) * spd
                ));
            }
            this.spiralAngle += this.phase === 2 ? 0.45 : this.spiralStep;
        }
    }

    hit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) { this.hp = 0; this.dead = true; }
        else this.flashTimer = 0.13;
    }

    // ── ציור גוף הבוס ─────────────────────────────────────────
    drawBody(ctx) {
        const t     = _frameNow * 0.001;
        const p2    = this.phase === 2;
        const tell  = this.isTelling;
        ctx.save();

        // זוהר חיצוני (מהבהב בכתום כשמאיים)
        const pulse  = 0.88 + 0.12 * Math.sin(t * 2.5);
        const glowR  = this.radius * (tell ? 2.3 : 1.85) * pulse;
        const gCol   = tell ? '#ff8800' : this._primary();
        const glow   = ctx.createRadialGradient(this.x, this.y, this.radius * 0.3, this.x, this.y, glowR);
        glow.addColorStop(0, this._rgba(gCol, tell ? 0.65 : 0.4));
        glow.addColorStop(1, this._rgba(gCol, 0));
        ctx.beginPath(); ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();

        // צל
        ctx.beginPath();
        ctx.ellipse(this.x + 6, this.y + 8, this.radius, this.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

        // גוף
        const pal  = p2 ? ['#440000', '#cc0000', '#ff8080'] : this._bodyColors();
        const body = ctx.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.05,
            this.x, this.y, this.radius);
        body.addColorStop(0,   pal[2]);
        body.addColorStop(0.5, pal[1]);
        body.addColorStop(1,   pal[0]);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = body; ctx.fill();
        ctx.strokeStyle = tell ? '#ff8800' : this._primary();
        ctx.lineWidth = p2 ? 4 : 3; ctx.stroke();

        // ── אפקטים מיוחדים לפי סוג ──────────────────────────

        // מגן: קשת מסובבת
        if (this.type === 'shield') {
            ctx.strokeStyle = p2 ? '#ff5522' : '#33ffcc';
            ctx.lineWidth = 9; ctx.globalAlpha = 0.92; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 13,
                this.shieldAngle - this.shieldArcSize / 2,
                this.shieldAngle + this.shieldArcSize / 2);
            ctx.stroke();
            ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
        }

        // לייזר: קו מקווקו כאזהרה
        if (this.type === 'laser' && this.laserState === 'aiming') {
            const aimFrac = this.laserAimTime / (p2 ? 1.3 : 1.8);
            const blink   = 0.3 + 0.55 * (1 - aimFrac) * (0.5 + 0.5 * Math.sin(t * 18));
            ctx.globalAlpha = blink;
            ctx.strokeStyle = '#00eeff'; ctx.lineWidth = 4;
            ctx.setLineDash([10, 7]);
            ctx.beginPath();
            ctx.moveTo(this.laserAimX, this.y + this.radius + 5);
            ctx.lineTo(this.laserAimX, CANVAS_H);
            ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1;
        }

        // מפציץ: X אזהרה בקרקע + קו אנכי
        if (this.type === 'bomber' && this.bombWarnX !== null) {
            const alpha = 0.65 + 0.3 * Math.sin(t * 11);
            const wx = this.bombWarnX, wy = CANVAS_H - 85, s = 18;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(wx - s, wy - s); ctx.lineTo(wx + s, wy + s);
            ctx.moveTo(wx + s, wy - s); ctx.lineTo(wx - s, wy + s);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.4;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(wx, this.y + this.radius + 5); ctx.lineTo(wx, wy - s);
            ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1;
        }

        // מתפוצץ: טבעת מתרחבת לפני פיצוץ
        if (this.type === 'exploder' && this.explodeTell > 0) {
            const frac  = this.explodeTell / this.explodeTellDur;
            const ringR = this.radius + 8 + (1 - frac) * 38;
            ctx.strokeStyle = '#ff3300'; ctx.lineWidth = 3.5;
            ctx.globalAlpha = frac * 0.88;
            ctx.beginPath(); ctx.arc(this.x, this.y, ringR, 0, Math.PI * 2);
            ctx.stroke(); ctx.globalAlpha = 1;
            // גם הבוס מהבהב
            ctx.globalAlpha = (1 - frac) * 0.4 * (0.5 + 0.5 * Math.sin(t * 22));
            ctx.fillStyle = '#ff8800';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.globalAlpha = 1;
        }

        // מעביר: רוח רפאים ומיקום עתידי
        if (this.type === 'teleporter' && this.teleportTell > 0) {
            const frac = 1 - this.teleportTell / this.teleportTellDur;
            ctx.globalAlpha = frac * 0.55;
            ctx.strokeStyle = '#ff88ff'; ctx.lineWidth = 3;
            ctx.setLineDash([6, 5]);
            ctx.beginPath(); ctx.arc(this.pendingX, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
        if (this.type === 'teleporter' && this.teleportFlash > 0) {
            ctx.globalAlpha = (this.teleportFlash / 0.45) * 0.55;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
            ctx.fill(); ctx.globalAlpha = 1;
        }

        // סחרחר: ירי כאשר שורה — פלאש בהיר
        if (this.type === 'spinner' && this.shootTimer < 0.4) {
            ctx.globalAlpha = (1 - this.shootTimer / 0.4) * 0.45;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.globalAlpha = 1;
        }

        // מפצל: סדקים ב-60%-50% חיים
        if (this.type === 'splitter' && !this.splitDone && this.hp < this.maxHp * 0.62) {
            const frac = 1 - this.hp / (this.maxHp * 0.62);
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8;
            ctx.globalAlpha = frac * 0.85;
            for (let i = 0; i < 4; i++) {
                const a = Math.PI * 0.25 + i * (Math.PI * 0.42);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + Math.cos(a) * this.radius, this.y + Math.sin(a) * this.radius);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        // ← אייקון בוס
        ctx.font = `${Math.floor(this.radius * 0.70)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(BOSS_ICONS[this.type] || '💀', this.x, this.y);

        // פלאש לבן בפגיעה
        if (this.flashTimer > 0) {
            ctx.globalAlpha = (this.flashTimer / 0.13) * 0.72;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill(); ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    // ── ציור פס חיים (מעל כל שאר) ───────────────────────────
    drawHUD(ctx) {
        const p2   = this.phase === 2;
        const barW = this.isMini ? 155 : 240;
        const barH = 14;
        // מיני-בוסים: פס מעל הבוס עצמו
        const barX = this.isMini ? this.x - barW / 2 : CANVAS_W / 2 - barW / 2;
        const barY = 14;
        const frac = Math.max(0, this.hp / this.maxHp);

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.fillStyle = p2 ? '#ff3300' : this._primary();
        ctx.fillRect(barX, barY, barW * frac, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.48)';
        ctx.lineWidth = 1.5; ctx.strokeRect(barX, barY, barW, barH);

        const hpStr  = this.hp   >= 1000 ? (this.hp / 1000).toFixed(1) + 'k'   : String(this.hp);
        const maxStr = this.maxHp >= 1000 ? (this.maxHp / 1000).toFixed(1) + 'k' : String(this.maxHp);
        const label  = this.isMini
            ? `${BOSS_ICONS[this.type]} ${hpStr}/${maxStr}`
            : `${BOSS_ICONS[this.type]} ${BOSS_NAMES[this.type]}  ${hpStr}/${maxStr}`;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(label, barX + barW / 2, barY + barH / 2);
        ctx.restore();
    }

    // ── עזרים ──────────────────────────────────────────────────
    _primary() { return (BOSS_COLORS[this.type] || BOSS_COLORS.shooter)[1]; }
    _bodyColors() { return BOSS_COLORS[this.type] || BOSS_COLORS.shooter; }
    _rgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a})`;
    }
}
