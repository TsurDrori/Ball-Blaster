// ── שדרוגי ריצה — בחירה אחרי כל גל-בוס ──────────────────────────────────────

const RUN_UPGRADE_POOL = [
    { id: 'magnetic',     icon: 'מג', name: 'מגנט מטבעות',  desc: 'רדיוס איסוף מטבעות כפול' },
    { id: 'gold_rush',    icon: 'זה', name: 'בונוס זהב',     desc: 'ערך כל המטבעות ×1.5' },
    { id: 'bouncy',       icon: 'קפ', name: 'כדורים קופצים', desc: 'כדורים מקפיצים מהקירות' },
    { id: 'rapid',        icon: 'מה', name: 'ירי מהיר',       desc: '+25% קצב ירי' },
    { id: 'pierce',       icon: 'חד', name: 'כדורים חודרים', desc: 'כדורים עוברים דרך כל האויבים' },
    { id: 'shield_up',    icon: 'מן', name: 'מגן חזק',       desc: 'מגן נמשך 20 שניות' },
    { id: 'double_heart', icon: 'לב', name: 'לב כפול',        desc: 'פיק לב נותן 2 חיים' },
    { id: 'homing',       icon: 'טי', name: 'טיל מונחה',     desc: 'כדור אחד בכל יריה עף לאויב הקרוב' },
    { id: 'explosion',    icon: 'פצ', name: 'פיצוץ בפגיעה',  desc: 'כל פגיעה מזיקה לאויבים קרובים' },
    { id: 'freeze',       icon: 'קר', name: 'קפאון',          desc: 'כדורים מאטים אויבים ל-2 שניות' },
    { id: 'heal',         icon: 'רפ', name: 'ריפוי בהריגה',  desc: 'כל 10 הריגות נותנות חיים' },
];

function pickUpgradeOptions(n) {
    const pool = RUN_UPGRADE_POOL.filter(u => !gameState.runUpgrades.has(u.id));
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    while (pool.length < n) pool.push(...RUN_UPGRADE_POOL);
    return pool.slice(0, n);
}

function handlePickerClick(cx, cy) {
    const rects = pickerCardRects(upgradePickOptions.length);
    for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
            gameState.runUpgrades.add(upgradePickOptions[i].id);
            upgradePickOptions = [];
            waveManager.waveDelay = 1.8;
            sound.upgrade();
            return;
        }
    }
}
