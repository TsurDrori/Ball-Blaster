const CANVAS_W = 480;
const CANVAS_H = 800;
const GRAVITY  = 300; // px/s² – pulls enemy balls downward

const gameState = {
    status: 'home', // 'home' | 'playing' | 'gameover'

    // ── Persistent (saved to localStorage) ──────────────────────────────
    totalCoins: parseInt(localStorage.getItem('bb_coins') || '0'),
    upgrades: (() => {
        const defaults = { fireRate: 1, damage: 1, multiShot: 1, ballSize: 1, lives: 1 };
        try {
            const saved = JSON.parse(localStorage.getItem('bb_upgrades'));
            return saved ? Object.assign(defaults, saved) : defaults;
        } catch(e) { return defaults; }
    })(),
    highScore: parseInt(localStorage.getItem('bb_hs') || '0'),

    // ── Per-session ──────────────────────────────────────────────────────
    sessionCoins: 0,
    wave: 1,
    currentLives: 1,
    shieldTimer: 0,
    fireTimer: 0,
    runUpgrades: [], // roguelite upgrades chosen during a run (reset each run)

    // Exponential: base × level × 2^level
    // 30% discount applied to any raw cost ≥ 300 (persistent upgrades are weaker now
    // since run-upgrades provide mid-run power — cheaper shop compensates for this)
    upgradeCost(type) {
        const level = this.upgrades[type];
        const raw = Math.floor({
            fireRate:  3,    // L1=6,  L5=480,  L9=13824
            damage:    5,    // L1=10, L5=800,  L9=23040
            multiShot: 8,    // L1=16, L6=3072
            ballSize:  3,    // L1=6
            lives:     6,    // L1=12, L5=960
        }[type] * level * Math.pow(2, level));
        return raw >= 300 ? Math.floor(raw * 0.7) : raw;
    },

    canAfford(type) {
        return this.totalCoins >= this.upgradeCost(type);
    },

    buyUpgrade(type) {
        const cost = this.upgradeCost(type);
        if (this.totalCoins >= cost) {
            this.totalCoins -= cost;
            this.upgrades[type]++;
            this._save();
            return true;
        }
        return false;
    },

    collectCoin(amount) {
        this.sessionCoins += amount;
    },

    hasRunUpgrade(id) {
        return this.runUpgrades.includes(id);
    },

    endGame() {
        // Bank the session coins
        this.totalCoins += this.sessionCoins;
        if (this.wave > this.highScore) {
            this.highScore = this.wave;
            localStorage.setItem('bb_hs', this.highScore);
        }
        this._save();
        this.status = 'gameover';
    },

    // Roguelite: every run starts at wave 1, run upgrades reset
    // (dev mode can pass a startWave override)
    startNewGame(startWave = 1) {
        this.status       = 'playing';
        this.sessionCoins = 0;
        this.wave         = startWave;
        this.currentLives = this.upgrades.lives;
        this.shieldTimer  = 0;
        this.fireTimer    = 0;
        this.runUpgrades  = [];
    },

    _save() {
        localStorage.setItem('bb_coins',    this.totalCoins);
        localStorage.setItem('bb_upgrades', JSON.stringify(this.upgrades));
    },
};
