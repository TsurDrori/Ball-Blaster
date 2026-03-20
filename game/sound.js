// ──────────────────────────────────────────
//  Ball Blast — Sound Engine (Web Audio API)
//  Procedural audio — no external files needed
// ──────────────────────────────────────────

class SoundEngine {
    constructor() {
        this._ctx     = null;
        this._master  = null;
        this._ready   = false;

        // Throttle timers (seconds since last play)
        this._shootTimer     = 0;
        this._hitTimer       = 0;
        this._coinTimer      = 0;
        this._bounceTimer    = 0;
    }

    // ── Init (must be triggered by user gesture) ──────────────────────────
    unlock() {
        if (this._ready) {
            if (this._ctx.state === 'suspended') this._ctx.resume();
            return;
        }
        try {
            this._ctx    = new (window.AudioContext || window.webkitAudioContext)();
            this._master = this._ctx.createGain();
            this._master.gain.value = 0.55;
            this._master.connect(this._ctx.destination);
            this._ready  = true;
        } catch (e) {
            // Audio not supported — fail silently
        }
    }

    // ── Throttle update (call each frame) ────────────────────────────────
    tick(delta) {
        // Auto-resume if browser suspended the context (happens ~30s after last gesture)
        if (this._ready && this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        this._shootTimer  = Math.max(0, this._shootTimer  - delta);
        this._hitTimer    = Math.max(0, this._hitTimer    - delta);
        this._coinTimer   = Math.max(0, this._coinTimer   - delta);
        this._bounceTimer = Math.max(0, this._bounceTimer - delta);
    }

    // ── Low-level helpers ─────────────────────────────────────────────────

    _osc(type, freq, startTime, duration, gain, freqEnd = null) {
        if (!this._ready) return;
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        if (freqEnd !== null) {
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(0.001, freqEnd), startTime + duration
            );
        }

        env.gain.setValueAtTime(0.0001, startTime);
        env.gain.linearRampToValueAtTime(gain, startTime + 0.006);
        env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(env);
        env.connect(this._master);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
    }

    _noise(startTime, duration, gain, lpFreq = 2000, hpFreq = 0) {
        if (!this._ready) return;
        const ctx = this._ctx;
        const bufLen = Math.ceil(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data   = buffer.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const lp = ctx.createBiquadFilter();
        lp.type            = 'lowpass';
        lp.frequency.value = lpFreq;

        const env = ctx.createGain();
        env.gain.setValueAtTime(gain, startTime);
        env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        src.connect(lp);
        if (hpFreq > 0) {
            const hp = ctx.createBiquadFilter();
            hp.type            = 'highpass';
            hp.frequency.value = hpFreq;
            lp.connect(hp);
            hp.connect(env);
        } else {
            lp.connect(env);
        }
        env.connect(this._master);
        src.start(startTime);
        src.stop(startTime + duration + 0.01);
    }

    // ── Sound Events ──────────────────────────────────────────────────────

    /**
     * Cannon fires — short soft "pew"
     * Throttled: max once per 60ms (prevents audio spam at high fire rates)
     */
    shoot() {
        if (!this._ready || this._shootTimer > 0) return;
        this._shootTimer = 0.06;
        const t = this._ctx.currentTime;
        this._osc('sine',   880, t,        0.07, 0.09, 350);
        this._osc('triangle', 440, t,      0.04, 0.04);
    }

    /**
     * Bullet hits enemy — small impact "thwack"
     * Throttled: max ~15/sec so rapid hits don't overload
     */
    hit() {
        if (!this._ready || this._hitTimer > 0) return;
        this._hitTimer = 0.065;
        const t = this._ctx.currentTime;
        this._noise(t, 0.05, 0.22, 1800, 200);
        this._osc('sine', 220, t, 0.06, 0.08, 110);
    }

    /**
     * Enemy ball destroyed — satisfying "boom/pop"
     */
    explode() {
        if (!this._ready) return;
        const t = this._ctx.currentTime;
        this._noise(t,        0.28, 0.50, 600,  30);
        this._noise(t,        0.12, 0.30, 3000, 800);
        this._osc('sine', 130, t,        0.30, 0.35, 45);
        this._osc('sine', 280, t,        0.10, 0.15, 80);
    }

    /**
     * Coin collected — bright cheerful "ding"
     * Throttled: max once per 80ms (coins can be collected in bursts)
     */
    coinCollect() {
        if (!this._ready || this._coinTimer > 0) return;
        this._coinTimer = 0.08;
        const t   = this._ctx.currentTime;
        // Two overtones for a bell-like quality
        this._osc('sine', 1318, t,        0.18, 0.13);   // E6
        this._osc('sine', 1760, t + 0.02, 0.14, 0.10);  // A6
        this._osc('sine', 2637, t + 0.05, 0.07, 0.08);  // E7
    }

    /**
     * New wave begins — ascending triumphant arpeggio
     */
    waveStart(wave) {
        if (!this._ready) return;
        const t     = this._ctx.currentTime;
        // Major triad: C4-E4-G4-C5
        const freqs = [261.6, 329.6, 392.0, 523.3];
        freqs.forEach((f, i) => {
            this._osc('sine',     f,       t + i * 0.09, 0.28, 0.15);
            this._osc('triangle', f * 2,   t + i * 0.09, 0.14, 0.05);
        });
    }

    /**
     * Game over — descending sad phrase
     */
    gameOver() {
        if (!this._ready) return;
        const t     = this._ctx.currentTime;
        const freqs = [440, 370, 311, 220]; // A4 F#4 Eb4 A3 — descending minor
        freqs.forEach((f, i) => {
            this._osc('sine',   f,     t + i * 0.22, 0.38, 0.18);
            this._osc('sine',   f * 3, t + i * 0.22, 0.20, 0.04);
        });
        // Low impact thud at the start
        this._noise(t, 0.25, 0.4, 200, 0);
        this._osc('sine', 80, t, 0.40, 0.30, 30);
    }

    /**
     * Upgrade purchased — bright ascending sparkle
     */
    upgrade() {
        if (!this._ready) return;
        const t     = this._ctx.currentTime;
        // C5-E5-G5-C6 major arpeggio
        const freqs = [523.3, 659.3, 784.0, 1046.5];
        freqs.forEach((f, i) => {
            this._osc('sine',   f,     t + i * 0.07, 0.22, 0.14);
            this._osc('sine',   f * 2, t + i * 0.07, 0.12, 0.04);
        });
    }

    /**
     * Enemy bounces off side wall — quick rubbery "boing"
     * Throttled: wall can bounce rapidly
     */
    wallBounce() {
        if (!this._ready || this._bounceTimer > 0) return;
        this._bounceTimer = 0.12;
        const t = this._ctx.currentTime;
        this._osc('sine', 320, t, 0.10, 0.07, 180);
        this._noise(t, 0.05, 0.06, 1200, 0);
    }

    /**
     * Enemy hits cannon (just before game over) — heavy impact
     */
    impact() {
        if (!this._ready) return;
        const t = this._ctx.currentTime;
        this._noise(t, 0.15, 0.6, 400, 0);
        this._osc('sine', 90, t, 0.20, 0.4, 40);
    }

    /**
     * Toggle mute on/off; returns new muted state.
     */
    toggleMute() {
        if (!this._ready) { this.unlock(); return false; }
        if (this._master.gain.value > 0) {
            this._master.gain.value = 0;
            return true; // now muted
        } else {
            this._master.gain.value = 0.55;
            return false; // now unmuted
        }
    }
}

// ── Global singleton ──────────────────────────────────────────────────────
const sound = new SoundEngine();
