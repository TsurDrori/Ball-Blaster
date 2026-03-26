// ── התנהגויות תיק-תיק של בוסים ───────────────────────────────────────────────
// נטען אחרי boss-enemy.js

BossEnemy.prototype._tickShooter = function(delta) {
    this._sideMove(delta);
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 1.0 : this.shootInterval;
        this._spread(this.phase === 2 ? 5 : 3, 0.5, this.phase === 2 ? 280 : 220);
    }
};

BossEnemy.prototype._tickBomber = function(delta) {
    this._sideMove(delta, 0.7);
    this.shootTimer -= delta;

    if (this.shootTimer <= 0.8) {
        this.bombWarnX = this.x;
    } else {
        this.bombWarnX = null;
    }

    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 1.6 : this.shootInterval;
        const cnt = this.phase === 2 ? 4 : 3;
        const fan = this.phase === 2 ? 0.42 : 0.28;
        const bombHp = this._bulletHp();
        for (let i = 0; i < cnt; i++) {
            const a = Math.PI / 2 + (i - (cnt - 1) / 2) * fan;
            this._newBullets.push(new BossBullet(
                this.x, this.y + this.radius + 5,
                Math.cos(a) * 85, Math.sin(a) * 85,
                { style: 'bomb', radius: 14, hp: bombHp }
            ));
        }
        this.bombWarnX = null;
    }
};

BossEnemy.prototype._tickLaser = function(delta, cannonX) {
    this._sideMove(delta, 0.6);
    if (this.laserState === 'cooldown') {
        this.laserCooldown -= delta;
        if (this.laserCooldown <= 0) {
            this.laserState   = 'aiming';
            this.laserAimTime = this.phase === 2 ? 1.3 : 1.8;
            this.laserAimX    = cannonX;
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
                { style: 'laser', radius: 7, hp: this._bulletHp() }
            ));
        }
        if (this.laserBurstLeft <= 0) {
            this.laserState    = 'cooldown';
            this.laserCooldown = this.phase === 2 ? 2.8 : 4.0;
        }
    }
};

BossEnemy.prototype._tickExploder = function(delta) {
    this._sideMove(delta);
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 1.0 : this.shootInterval;
        this._spread(this.phase === 2 ? 3 : 2, 0.3, 220);
    }
    if (this.explodeTell > 0) {
        this.explodeTell -= delta;
        if (this.explodeTell <= 0) {
            const cnt = this.phase === 2 ? 16 : 12;
            const spd = this.phase === 2 ? 280 : 230;
            const explodeHp = this._bulletHp();
            for (let i = 0; i < cnt; i++) {
                const a = (i / cnt) * Math.PI * 2;
                this._newBullets.push(new BossBullet(
                    this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd,
                    { hp: explodeHp }
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
};

BossEnemy.prototype._tickShield = function(delta) {
    this.shieldAngle += (this.phase === 2 ? 1.6 : this.shieldSpeed) * delta;
    this._sideMove(delta);
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 1.0 : this.shootInterval;
        this._spread(this.phase === 2 ? 4 : 3, 0.42, 235);
    }
};

BossEnemy.prototype._tickSpinner = function(delta) {
    const spd = this.phase === 2 ? 1.4 : 0.9;
    this.orbitAngle += spd * delta;
    this.x = this.cx + Math.cos(this.orbitAngle) * this.orbitR;
    this.y = this.cy + Math.sin(this.orbitAngle) * this.orbitR * 0.42;
    this.y = Math.max(50, Math.min(CANVAS_H * 0.40, this.y));

    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 0.9 : this.shootInterval;
        const cnt = this.phase === 2 ? 6 : 4;
        const bspd = this.phase === 2 ? 270 : 210;
        const spinHp = this._bulletHp();
        for (let i = 0; i < cnt; i++) {
            const a = this.orbitAngle + (i / cnt) * Math.PI * 2;
            this._newBullets.push(new BossBullet(
                this.x, this.y, Math.cos(a) * bspd, Math.sin(a) * bspd,
                { hp: spinHp }
            ));
        }
    }
};

BossEnemy.prototype._tickSwarm = function(delta) {
    this._sideMove(delta);
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 1.0 : this.shootInterval;
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
};

BossEnemy.prototype._tickTeleporter = function(delta) {
    if (this.teleportFlash > 0) this.teleportFlash = Math.max(0, this.teleportFlash - delta);

    if (this.teleportTell > 0) {
        this.teleportTell -= delta;
        if (this.teleportTell <= 0) {
            this.x = this.pendingX;
            this.teleportFlash = 0.45;
            this._spread(this.phase === 2 ? 5 : 3, 0.5, this.phase === 2 ? 280 : 235);
        }
        return;
    }

    this.teleportTimer -= delta;
    if (this.teleportTimer <= 0) {
        this.teleportTimer = this.phase === 2 ? 1.8 : 2.5;
        this.teleportTell  = this.teleportTellDur;
        let newX;
        do { newX = this.radius + 25 + Math.random() * (CANVAS_W - (this.radius + 25) * 2); }
        while (Math.abs(newX - this.x) < 110);
        this.pendingX = newX;
    }
};

BossEnemy.prototype._tickSplitter = function(delta) {
    this._sideMove(delta);
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 0.9 : this.shootInterval;
        this._spread(3, 0.4, 235);
    }
    if (!this.splitDone && !this.isMini && this.hp <= this.maxHp * 0.5) {
        this.splitDone = true;
        this.splitting = true;
        this.dead = true;
    }
};

BossEnemy.prototype._tickSpiral = function(delta) {
    this._sideMove(delta, 0.7);
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 2 ? 0.15 : this.shootInterval;
        const spd = this.phase === 2 ? 255 : 200;
        const spiralHp = this._bulletHp();
        this._newBullets.push(new BossBullet(
            this.x, this.y + 5,
            Math.cos(this.spiralAngle) * spd,
            Math.sin(this.spiralAngle) * spd,
            { hp: spiralHp }
        ));
        if (this.phase === 2) {
            this._newBullets.push(new BossBullet(
                this.x, this.y + 5,
                Math.cos(this.spiralAngle + Math.PI) * spd,
                Math.sin(this.spiralAngle + Math.PI) * spd,
                { hp: spiralHp }
            ));
        }
        this.spiralAngle += this.phase === 2 ? 0.45 : this.spiralStep;
    }
};
