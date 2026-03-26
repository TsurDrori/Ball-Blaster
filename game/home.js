// ── מסך הבית, חנות סקינים, מצב פיתוח, עמוד ראשי ───────────────────────────────

// ── לולאת אנימציה לתצוגה מקדימה של סקינים ──────────────────────────────────
let _previewRafId = null;
function _ensurePreviewAnim() {
    if (_previewRafId !== null) return;
    function _previewTick() {
        const shop = document.getElementById('skins-shop');
        if (shop && shop.offsetParent !== null) {
            document.querySelectorAll('.skin-card-canvas').forEach(c =>
                drawSkinPreview(c, c.dataset.skin, c.dataset.type));
        }
        _previewRafId = requestAnimationFrame(_previewTick);
    }
    _previewRafId = requestAnimationFrame(_previewTick);
}
function _stopPreviewAnim() {
    if (_previewRafId !== null) {
        cancelAnimationFrame(_previewRafId);
        _previewRafId = null;
    }
}

// ── מצב פיתוח ──────────────────────────────────────────────────────────────
function devResetUpgrades() {
    if (!devMode) return;
    gameState.upgrades = { fireRate: 1, damage: 1, multiShot: 1, ballSize: 1, lives: 1 };
    gameState._save();
    refreshHomeScreen();
}

let devMode     = false;
let devSnapshot = null;

function toggleDevMode() {
    devMode = !devMode;

    if (devMode) {
        devSnapshot = {
            totalCoins: gameState.totalCoins,
            upgrades:   { ...gameState.upgrades },
            highScore:  gameState.highScore,
        };
        const currentWave    = Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1);
        const suggestedCoins = estimateCoinsForWave(currentWave);
        document.getElementById('dev-coins').value = suggestedCoins;
        gameState.upgrades   = { fireRate: 1, damage: 1, multiShot: 1, ballSize: 1, lives: 1 };
        gameState.totalCoins = suggestedCoins;
    } else {
        if (devSnapshot) {
            gameState.totalCoins = devSnapshot.totalCoins;
            gameState.upgrades   = { ...devSnapshot.upgrades };
            gameState.highScore  = devSnapshot.highScore;
            localStorage.setItem('bb_hs', devSnapshot.highScore);
            gameState._save();
        }
        devSnapshot = null;
    }

    const btn     = document.getElementById('dev-toggle');
    const content = document.getElementById('dev-content');
    btn.textContent = devMode ? 'מצב פיתוח: פעיל' : 'מצב פיתוח: כבוי';
    btn.classList.toggle('dev-on', devMode);
    content.classList.toggle('open', devMode);
    document.getElementById('dev-panel').classList.toggle('dev-open', devMode);
    document.getElementById('home-screen').classList.toggle('dev-panel-open', devMode);
    refreshHomeScreen();
}

function onDevCoinsInput() {
    if (!devMode) return;
    gameState.totalCoins = Math.max(0, parseInt(document.getElementById('dev-coins').value) || 0);
    refreshHomeScreen();
}

function estimateCoinsForWave(targetWave) {
    let total = 0;
    for (let w = 1; w < targetWave; w++) {
        const hp      = Math.max(1, Math.floor(Math.pow(w, 2.0)));
        const coinVal = Math.max(1, Math.ceil(Math.sqrt(hp)));
        const count   = 5 + Math.floor(w * 1.6);
        total += coinVal * count;
    }
    return total;
}

function onDevWaveInput() {
    if (!devMode) return;
    const wave      = Math.max(1, parseInt(document.getElementById('dev-wave').value) || 1);
    const suggested = estimateCoinsForWave(wave);
    document.getElementById('dev-coins').value = suggested;
    gameState.totalCoins = suggested;
    refreshHomeScreen();
}

// ── חנות שדרוגים ────────────────────────────────────────────────────────────
function buyUpgrade(type) {
    if (gameState.status !== 'home') return;
    sound.unlock();
    const prevLevel    = gameState.upgrades[type];
    const wasPrestige  = type === 'multiShot' && prevLevel > 0 && prevLevel % 5 === 0;
    if (gameState.buyUpgrade(type)) {
        sound.upgrade();
        if (wasPrestige) _showPrestigeToast(prevLevel);
        if (type === 'fireRate') {
            const unlocked = gameState.checkFirerateMission();
            if (unlocked) refreshSkinsPanel();
        }
        refreshHomeScreen();
    }
}

function _showPrestigeToast(prevLevel) {
    const cycle = Math.floor(prevLevel / 5);
    const mult  = Math.pow(10, cycle);
    const toast = document.getElementById('prestige-toast');
    toast.innerHTML = `פרסטיג'! רב-כדורי<br><span style="font-size:14px;color:#ffaa44">1 כדור = ×${mult} נזק מהמחזור הקודם</span>`;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
}

// ── חנות סקינים ─────────────────────────────────────────────────────────────
function switchShopTab(tab) {
    const upgradeShop = document.getElementById('upgrade-shop');
    const skinsShop   = document.getElementById('skins-shop');
    const tabU = document.getElementById('tab-upgrades');
    const tabS = document.getElementById('tab-skins');
    if (tab === 'upgrades') {
        upgradeShop.style.display = '';
        skinsShop.style.display   = 'none';
        tabU.classList.add('active');
        tabS.classList.remove('active');
    } else {
        upgradeShop.style.display = 'none';
        skinsShop.style.display   = '';
        tabU.classList.remove('active');
        tabS.classList.add('active');
        refreshSkinsPanel();
    }
}

function switchSkinSubtab(type) {
    const gc = document.getElementById('skin-grid-cannon');
    const gb = document.getElementById('skin-grid-bullet');
    const tc = document.getElementById('stab-cannon');
    const tb = document.getElementById('stab-bullet');
    if (type === 'cannon') {
        gc.style.display = ''; gb.style.display = 'none';
        tc.classList.add('active'); tb.classList.remove('active');
    } else {
        gc.style.display = 'none'; gb.style.display = '';
        tc.classList.remove('active'); tb.classList.add('active');
    }
}

function refreshSkinsPanel() {
    _renderSkinGrid('cannon', CANNON_SKINS, 'skin-grid-cannon');
    _renderSkinGrid('bullet', BULLET_SKINS, 'skin-grid-bullet');
}

function _renderSkinGrid(type, catalog, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const activeId = type === 'cannon' ? gameState.skins.activeCannon : gameState.skins.activeBullet;

    grid.innerHTML = catalog.map(skin => {
        const isUnlocked = gameState.hasSkinUnlocked(skin.id, type);
        const isEquipped = activeId === skin.id;
        const canAfford  = skin.price > 0 && gameState.totalDiamonds >= skin.price;
        const statusClass = isEquipped ? 'equipped' : isUnlocked ? 'unlocked' : 'locked';

        let priceText;
        if (skin.price > 0)       priceText = `◆ ${skin.price.toLocaleString()}`;
        else if (skin.mission)    priceText = skin.mission.text;
        else                      priceText = 'חינם';

        let btn;
        if (isEquipped) {
            btn = `<div class="skin-card-btn btn-equipped">✓ לובש</div>`;
        } else if (isUnlocked) {
            btn = `<button class="skin-card-btn btn-equip" onclick="equipSkin('${skin.id}','${type}')">ללבוש</button>`;
        } else if (skin.mission) {
            btn = `<div class="skin-card-btn btn-locked">${skin.mission.text}</div>`;
        } else if (canAfford) {
            btn = `<button class="skin-card-btn btn-buy" onclick="buySkin('${skin.id}','${type}')">◆ קנה</button>`;
        } else {
            btn = `<div class="skin-card-btn btn-locked">◆ ${skin.price.toLocaleString()}</div>`;
        }

        const rarity = skin.rarity || 'common';
        const rarityLabels = { rare: 'נדיר', epic: 'אפי', legendary: 'מיתי' };
        const rarityBadge = rarity !== 'common'
            ? `<div class="skin-rarity-badge ${rarity}">${rarityLabels[rarity]}</div>`
            : '';

        return `<div class="skin-card ${statusClass} rarity-${rarity}">
            ${rarityBadge}
            <canvas class="skin-card-canvas" width="60" height="60" data-skin="${skin.id}" data-type="${type}"></canvas>
            <div class="skin-card-name">${skin.name}</div>
            <div class="skin-card-price">${priceText}</div>
            ${btn}
        </div>`;
    }).join('');

    _ensurePreviewAnim();
}

function buySkin(id, type) {
    sound.unlock();
    if (gameState.buySkin(id, type)) {
        sound.upgrade();
        refreshSkinsPanel();
        refreshHomeScreen();
    }
}

function equipSkin(id, type) {
    sound.unlock();
    if (gameState.equipSkin(id, type)) {
        sound.upgrade();
        refreshSkinsPanel();
    }
}

let _prevBankCoins = -1;

function refreshHomeScreen() {
    const bankEl   = document.getElementById('bank-amount');
    const newCoins = gameState.totalCoins;
    bankEl.textContent = newCoins.toLocaleString();
    bankEl.classList.toggle('dev-override', devMode);
    if (_prevBankCoins >= 0 && newCoins > _prevBankCoins) {
        bankEl.classList.remove('bank-amount-bump');
        void bankEl.offsetWidth;
        bankEl.classList.add('bank-amount-bump');
    }
    _prevBankCoins = newCoins;

    document.getElementById('hs-wave').textContent = gameState.highScore;

    const diamondEl = document.getElementById('diamond-amount');
    if (diamondEl) diamondEl.textContent = gameState.totalDiamonds.toLocaleString();

    const MAX_LEVELS = { fireRate: 10, damage: 8, multiShot: 15, ballSize: Infinity, lives: Infinity };
    const meta = {
        fireRate:  { name: 'קצב ירי',   desc: lv => `${Math.round(10 / Math.max(0.025, 0.16 - (lv-1)*0.015))/10} כדורים/שנ'` },
        damage:    { name: 'עוצמה',     desc: lv => `נזק ${Math.min(8, lv)} לכדור` },
        multiShot: { name: 'רב-כדורי',  desc: lv => { const cycle = Math.floor((lv-1)/5); const pos = (lv-1)%5; const total = cycle > 0 ? cycle + pos : pos + 1; if (cycle === 0) return `${total} כדורים במקביל`; const normals = pos; const mult = Math.pow(10,cycle); return normals > 0 ? `${cycle}×${mult} + ${normals} רגילים` : `${cycle} כדורי ×${mult} נזק`; } },
        ballSize:  { name: 'גודל כדור', desc: lv => `רדיוס ${9 + (lv-1)*2}` },
        lives:     { name: 'חיים',       desc: lv => `${lv} חיים למשחק` },
    };
    for (const [type, m] of Object.entries(meta)) {
        const btn   = document.getElementById('btn-' + type);
        if (!btn) continue;
        const lv    = gameState.upgrades[type];
        const cost  = gameState.upgradeCost(type);
        const isMax = lv >= MAX_LEVELS[type];
        if (isMax) {
            btn.innerHTML = `${m.name}<br><small>${m.desc(lv)}</small><small><span class="max-badge">MAX</span></small>`;
            btn.className = 'upgrade-btn max-level';
            btn.disabled  = true;
        } else {
            const isPrestige = type === 'multiShot' && lv > 0 && lv % 5 === 0;
            const canAfford  = gameState.canAfford(type);
            if (isPrestige) {
                const nextCycle = Math.floor(lv / 5);
                const mult = Math.pow(10, nextCycle);
                btn.innerHTML = `${m.name} — פרסטיג'!<br><small>1 כדור ×${mult} נזק</small><small>Lv.${lv} · ${cost.toLocaleString()}</small>`;
            } else {
                btn.innerHTML = `${m.name}<br><small>${m.desc(lv)}</small><small>Lv.${lv} · ${cost.toLocaleString()}</small>`;
            }
            btn.className = 'upgrade-btn' + (canAfford ? ' affordable' : '') + (isPrestige ? ' prestige' : '');
            btn.disabled  = false;
        }
    }
}

// ── כפתור השתקה ─────────────────────────────────────────────────────────────
function toggleMute() {
    const muted = sound.toggleMute();
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.classList.toggle('muted', muted);
}

// ── אתחול — הצג מסך בית ─────────────────────────────────────────────────────
refreshHomeScreen();
refreshSkinsPanel();
