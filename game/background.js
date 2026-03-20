// ──────────────────────────────────────────
//  Background System — zone tracking only.
//  All visuals handled by WGL_BG (webgl-background.js).
// ──────────────────────────────────────────

const BG_SYSTEM = (() => {

    const ZONE_COUNT = 5;

    let currentZone = 0;
    let prevZone    = 0;
    let blendT      = 1;
    const BLEND_DUR = 2.5;

    let t = 0;

    function zoneOf(wave) {
        return Math.min(ZONE_COUNT - 1, Math.floor((wave - 1) / 5));
    }

    function ease(x) {
        return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2) / 2;
    }

    // ── Public: update ────────────────────────────────────────────────────
    function update(delta, wave) {
        t += delta;

        const zi = zoneOf(wave);
        if (zi !== currentZone) {
            prevZone    = currentZone;
            currentZone = zi;
            blendT      = 0;
        }
        if (blendT < 1) blendT = Math.min(1, blendT + delta / BLEND_DUR);
    }

    // ── Public: draw — hands off to WebGL ────────────────────────────────
    function draw(ctx) {
        WGL_BG.render(t, currentZone, prevZone, ease(blendT));
    }

    return { update, draw };
})();
