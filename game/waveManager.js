class WaveManager {
    constructor() {
        this.wave          = Math.max(1, gameState.wave);
        this.spawnTimer    = 0;
        this.spawnInterval = this._spawnInt();
        this.spawned       = 0;
        this.waveTotal     = this._count();
        this.waveDelay     = 0;
        this.newWaveFlag   = false; // consumed by game.js for announcement
        this.spikeWaveCleared = false; // consumed by game.js for upgrade picker
    }

    // ── Wave rhythm: 7-wave cycles with relief & spike ────────────────
    //   Cycle pattern:  ▁ ▂ ▃ ▽ ▃ ▅ ▲
    //                   ramp up → relief → ramp up → SPIKE
    //   Waves 1-5 are the learning phase (extra gentle)
    //   Relief = many weak enemies (power fantasy)
    //   Spike  = few tanky enemies (boss feel)

    _waveType() {
        if (this.wave <= 5) return 'learning';
        const pos = (this.wave - 6) % 7;
        if (pos === 3) return 'relief';
        if (pos === 6) return 'spike';
        return 'normal';
    }

    _waveMod() {
        const w = this.wave;
        if (w <= 3) return 0.3;
        if (w <= 5) return 0.5;

        const cycle = Math.floor((w - 6) / 7);
        const pos   = (w - 6) % 7;

        if (pos === 3) return Math.max(0.3, 0.5 - cycle * 0.015);
        if (pos === 6) return Math.min(2.5, 1.5 + cycle * 0.06);

        const ramps = [0.7, 0.8, 0.9, /*relief*/ 0, 0.85, 1.0, 1.15];
        return ramps[pos];
    }

    _count() {
        const base = 5 + Math.floor(this.wave * 1.6);
        const type = this._waveType();
        if (type === 'relief') return Math.floor(base * 1.5);
        if (type === 'spike')  return Math.max(3, Math.floor(base * 0.5));
        return base;
    }

    _hp() {
        const base = Math.max(1, Math.floor(Math.pow(this.wave, 2.0)));
        return Math.max(1, Math.floor(base * this._waveMod()));
    }

    _speed() {
        return Math.min(100, 18 + this.wave * 2.5);
    }

    _spawnInt() {
        const base = Math.max(0.45, 1.4 - this.wave * 0.04);
        const type = this._waveType();
        if (type === 'relief') return base * 0.7;
        if (type === 'spike')  return base * 1.3;
        return base;
    }

    // Choose an enemy type based on wave progression.
    // New types unlock gradually so early waves stay clean.
    // יהלומים (crystal) מופיעים רק מגל 11 ונדירים מאוד (1% בלבד).
    _chooseType() {
        if (this.wave < 6) return 'normal';
        const roll = Math.random();
        if (roll < 0.65)                                        return 'normal';
        if (roll < 0.76) return this.wave >= 10 ? 'bomb'      : 'normal';
        if (roll < 0.87) return this.wave >= 15 ? 'splitter'  : 'normal';
        if (roll < 0.99) return this.wave >= 8  ? 'fast'      : 'normal';
                         return this.wave >= 11 ? 'crystal'   : 'normal';
    }

    update(delta, activeCount) {
        if (this.waveDelay > 0) {
            this.waveDelay -= delta;
            return null;
        }

        // All spawned → wait for enemies to die
        if (this.spawned >= this.waveTotal) {
            if (activeCount === 0) this._nextWave();
            return null;
        }

        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval;
            this.spawned++;
            const x = 40 + Math.random() * (CANVAS_W - 80);
            return new EnemyBall(x, this._hp(), this._speed(), this._chooseType());
        }
        return null;
    }

    _nextWave() {
        // כל 5 גלים → מציג פיק שידרוגים
        this.spikeWaveCleared = (this.wave % 5 === 0);

        this.wave++;
        gameState.wave     = this.wave;
        this.spawned       = 0;
        this.waveTotal     = this._count();
        this.spawnTimer    = 0;
        this.spawnInterval = this._spawnInt();
        // On spike clears: waveDelay=0 so the upgrade picker can control the pause
        this.waveDelay     = this.spikeWaveCleared ? 0 : 1.8;
        this.newWaveFlag   = true;
    }
}
