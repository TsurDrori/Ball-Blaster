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

    // ── Skins & missions ─────────────────────────────────────────────────
    skins: (() => {
        try {
            const s = JSON.parse(localStorage.getItem('bb_skins'));
            const def = { unlockedCannon: ['default'], unlockedBullet: ['default'], activeCannon: 'default', activeBullet: 'default', purchasedCombos: [] };
            return s ? Object.assign(def, s) : def;
        } catch(e) { return { unlockedCannon: ['default'], unlockedBullet: ['default'], activeCannon: 'default', activeBullet: 'default', purchasedCombos: [] }; }
    })(),
    missions: (() => {
        try {
            const m = JSON.parse(localStorage.getItem('bb_missions'));
            return m || { daysPlayed: [] };
        } catch(e) { return { daysPlayed: [] }; }
    })(),

    // ── Per-session ──────────────────────────────────────────────────────
    sessionCoins: 0,
    sessionDiamonds: 0,
    wave: 1,
    currentLives: 1,
    shieldTimer: 0,
    fireTimer: 0,
    iceTimer: 0,
    runUpgrades: new Set(), // roguelite upgrades chosen during a run (reset each run)

    // ── יהלומים (מטבע פרמיום, נשמר) ─────────────────────────────────────
    totalDiamonds: parseInt(localStorage.getItem('bb_diamonds') || '0'),

    collectDiamond() {
        this.sessionDiamonds++;
        this.totalDiamonds++;
        localStorage.setItem('bb_diamonds', this.totalDiamonds);
    },

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
        return this.runUpgrades.has(id);
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
        this.sessionCoins    = 0;
        this.sessionDiamonds = 0;
        this.wave            = startWave;
        this.currentLives    = this.upgrades.lives;
        this.shieldTimer     = 0;
        this.fireTimer       = 0;
        this.iceTimer        = 0;
        this.runUpgrades     = new Set();
    },

    hasSkinUnlocked(id, type) {
        const arr = type === 'cannon' ? this.skins.unlockedCannon : this.skins.unlockedBullet;
        return arr.includes(id);
    },

    buySkin(id, type) {
        const catalog = type === 'cannon' ? CANNON_SKINS : BULLET_SKINS;
        const skin = catalog.find(s => s.id === id);
        if (!skin || this.hasSkinUnlocked(id, type) || skin.mission || this.totalDiamonds < skin.price) return false;
        this.totalDiamonds -= skin.price;
        localStorage.setItem('bb_diamonds', this.totalDiamonds);
        (type === 'cannon' ? this.skins.unlockedCannon : this.skins.unlockedBullet).push(id);
        this._save();
        this._checkBuySkinsMission();
        return true;
    },

    equipSkin(id, type) {
        if (!this.hasSkinUnlocked(id, type)) return false;
        if (type === 'cannon') this.skins.activeCannon = id;
        else                   this.skins.activeBullet = id;
        this._save();
        return true;
    },

    _unlockMissionSkin(missionId) {
        let changed = false;
        for (const skin of CANNON_SKINS) {
            if (skin.mission?.id === missionId && !this.hasSkinUnlocked(skin.id, 'cannon')) {
                this.skins.unlockedCannon.push(skin.id); changed = true;
            }
        }
        for (const skin of BULLET_SKINS) {
            if (skin.mission?.id === missionId && !this.hasSkinUnlocked(skin.id, 'bullet')) {
                this.skins.unlockedBullet.push(skin.id); changed = true;
            }
        }
        if (changed) this._save();
        return changed;
    },

    checkWaveMission(wave) {
        let changed = false;
        if (wave >= 15) changed = this._unlockMissionSkin('reach_wave_15') || changed;
        if (wave >= 20) changed = this._unlockMissionSkin('reach_wave_20') || changed;
        if (wave >= 25) changed = this._unlockMissionSkin('reach_wave_25') || changed;
        return changed;
    },

    checkFirerateMission() {
        if (this.upgrades.fireRate >= 4) return this._unlockMissionSkin('firerate_lv4');
        return false;
    },

    _checkBuySkinsMission() {
        const total = (this.skins.unlockedCannon.length - 1)
                    + (this.skins.unlockedBullet.length - 1);
        if (total >= 4) this._unlockMissionSkin('buy_4_skins');
        if (total >= 5) this._unlockMissionSkin('buy_5_skins');
    },

    recordDayPlayed() {
        const today = new Date().toISOString().split('T')[0];
        if (!this.missions.daysPlayed.includes(today)) {
            this.missions.daysPlayed.push(today);
            localStorage.setItem('bb_missions', JSON.stringify(this.missions));
        }
    },

    _save() {
        localStorage.setItem('bb_coins',    this.totalCoins);
        localStorage.setItem('bb_upgrades', JSON.stringify(this.upgrades));
        localStorage.setItem('bb_skins',    JSON.stringify(this.skins));
    },
};
