// ── WebGL שידרים — חלק ג׳: zones 7-9 + dispatch + main ───────────────────────
// נטען אחרי webgl-shader-zones.js

const _WGL_FRAG_C = `
// ─── Zone 7 · STORM ───────────────────────────────────────────────────────
vec3 zone7(vec2 uv, float t) {
    float n1 = fbm(uv * 1.6 + vec2(t * 0.07, 0.0));
    float n2 = fbm(uv * 3.2 + vec2(-t * 0.05, t * 0.04) + n1 * 0.9);
    vec3 col  = mix(vec3(0.07, 0.07, 0.13), vec3(0.24, 0.22, 0.30), n1 * n1);
    col       = mix(col, vec3(0.35, 0.32, 0.40), n2 * n2 * 0.5);
    col      *= mix(0.35, 1.0, uv.y);

    float rainCol = floor(uv.x * 110.0);
    float rainAmp = hash(vec2(rainCol, 0.0));
    float rainFr  = fract(uv.y * 3.0 - t * 2.6 + rainAmp * 6.28);
    col += vec3(0.38, 0.43, 0.58) * smoothstep(0.96, 1.0, rainAmp) * (0.1 + 0.5 * rainFr) * 0.55;

    float ltCycle = floor(t * 0.22);
    float ltProg  = fract(t * 0.22);
    float ltX     = hash(vec2(ltCycle, 0.7)) * 0.7 + 0.15;
    float ltFlash = smoothstep(0.0, 0.05, ltProg) * smoothstep(0.22, 0.10, ltProg);
    float boltX   = ltX;
    float boltDist = abs(uv.x - boltX);
    for (int seg = 0; seg < 7; seg++) {
        float fs    = float(seg);
        float segY0 = fs / 7.0;
        float segY1 = (fs + 1.0) / 7.0;
        if (uv.y >= segY0 && uv.y < segY1) {
            float lerpT = (uv.y - segY0) / (segY1 - segY0);
            float jitter = (hash(vec2(ltCycle * 7.3 + fs, ltCycle)) - 0.5) * 0.05;
            boltX += jitter * lerpT;
            boltDist = min(boltDist, abs(uv.x - boltX));
        }
    }
    col += vec3(0.88, 0.94, 1.0) * smoothstep(0.010, 0.0, boltDist) * ltFlash * 3.5;
    col += vec3(0.4,  0.55, 1.0) * smoothstep(0.055, 0.0, boltDist) * ltFlash * 0.9;
    col += vec3(0.12, 0.15, 0.30) * ltFlash * 0.4;

    return col;
}

// ─── Zone 8 · DESERT ──────────────────────────────────────────────────────
vec3 zone8(vec2 uv, float t) {
    vec3 col = mix(vec3(0.88, 0.55, 0.08), vec3(0.30, 0.11, 0.03), uv.y);

    float sunD = length(uv - vec2(0.5, 0.12));
    col = mix(col, vec3(1.0, 0.97, 0.60), smoothstep(0.075, 0.045, sunD));
    col += vec3(0.80, 0.38, 0.06) * smoothstep(0.32, 0.0, sunD) * 0.28;

    float shimN = fbm(vec2(uv.x * 5.0, uv.y * 2.0) + vec2(t * 0.06, 0.0));
    float shimZone = smoothstep(0.45, 0.70, uv.y);
    col += vec3(0.40, 0.15, 0.0) * shimN * shimZone * 0.18;

    float dune1 = 0.68 + sin(uv.x * 3.6 + 0.3) * 0.06 + sin(uv.x * 7.2 + t * 0.035) * 0.022;
    float dune2 = 0.73 + sin(uv.x * 5.1 + 1.8 + t * 0.018) * 0.045 + sin(uv.x * 2.2 - 0.5) * 0.055;
    float duneH = min(dune1, dune2);
    float inDune = smoothstep(duneH - 0.008, duneH + 0.008, uv.y);
    float sandLight = 0.4 + 0.6 * (0.5 + 0.5 * cos((uv.x - 0.5) * 6.28 * 3.5 + t * 0.03));
    vec3 sandCol = mix(vec3(0.58, 0.38, 0.14), vec3(0.96, 0.76, 0.34), sandLight * 0.7 + 0.15);
    col = mix(col, sandCol, inDune);

    float floor_ = smoothstep(0.86, 0.90, uv.y);
    col = mix(col, vec3(0.50, 0.30, 0.10), floor_);

    return col;
}

// ─── Zone 9 · HOGWARTS ────────────────────────────────────────────────────
float _tower(vec2 uv, float tx1, float tx2, float ty1, float ty2, float spireH) {
    float cx   = (tx1 + tx2) * 0.5;
    float hw   = (tx2 - tx1) * 0.5;
    float rect = step(tx1, uv.x) * step(uv.x, tx2) * step(ty1, uv.y) * step(uv.y, ty2);
    float sTop = ty1 - spireH;
    float inSp = step(sTop, uv.y) * step(uv.y, ty1)
               * step(0.0, hw * (uv.y - sTop) / (spireH + 0.001) - abs(uv.x - cx));
    return max(rect, inSp);
}

vec3 zone9(vec2 uv, float t) {
    vec3 col = mix(vec3(0.07, 0.03, 0.18), vec3(0.02, 0.008, 0.06), uv.y * 0.9);

    float aurN = fbm(uv * 1.8 + vec2(t * 0.022, 0.0));
    float aurZone = smoothstep(0.55, 0.10, uv.y);
    col += vec3(0.25, 0.05, 0.60) * aurN * aurN * aurZone * 1.4;
    col += vec3(0.04, 0.18, 0.65) * (1.0 - aurN) * aurN * aurZone * 0.9;
    col += vec3(0.55, 0.08, 0.30) * fbm(uv * 2.2 - vec2(t * 0.018)) * aurZone * 0.5;

    for (int si = 0; si < 3; si++) {
        float sc  = float(si);
        vec2  gv  = uv * (30.0 + sc * 20.0);
        vec2  id  = floor(gv);
        vec2  fv  = fract(gv) - 0.5;
        float h   = hash(id + sc * 37.1);
        float blink = 0.5 + 0.5 * sin(t * (1.1 + h * 4.5) + h * 6.28);
        float star  = smoothstep(0.018, 0.0, length(fv - (hash2(id + sc) - 0.5) * 0.45));
        col += mix(vec3(0.95, 0.88, 1.0), vec3(1.0, 0.95, 0.72), h) * star * (0.6 + sc * 0.15) * blink;
    }

    vec2  moonP = vec2(0.76, 0.14);
    float moonD = length(uv - moonP);
    col = mix(col, vec3(1.0, 0.97, 0.88), smoothstep(0.075, 0.060, moonD));
    col += vec3(0.70, 0.55, 0.18) * smoothstep(0.30, 0.0, moonD) * 0.38;
    col += vec3(0.45, 0.20, 0.65) * smoothstep(0.14, 0.0, moonD) * 0.22;

    float castle = 0.0;
    castle = max(castle, _tower(uv, 0.08, 0.92, 0.70, 0.85, 0.0));
    castle = max(castle, _tower(uv, 0.42, 0.58, 0.28, 0.80, 0.14));
    castle = max(castle, _tower(uv, 0.10, 0.22, 0.38, 0.80, 0.10));
    castle = max(castle, _tower(uv, 0.78, 0.90, 0.38, 0.80, 0.10));
    castle = max(castle, _tower(uv, 0.25, 0.36, 0.48, 0.78, 0.07));
    castle = max(castle, _tower(uv, 0.64, 0.75, 0.48, 0.78, 0.07));
    castle = max(castle, _tower(uv, 0.01, 0.09, 0.52, 0.78, 0.06));
    castle = max(castle, _tower(uv, 0.91, 0.99, 0.55, 0.78, 0.06));
    castle = max(castle, _tower(uv, 0.22, 0.42, 0.60, 0.73, 0.0));
    castle = max(castle, _tower(uv, 0.58, 0.78, 0.60, 0.73, 0.0));

    vec3 castleCol = vec3(0.058, 0.048, 0.088);
    float moonRim = max(0.0, 1.0 - length(uv - moonP) * 1.8);
    castleCol += vec3(0.12, 0.10, 0.22) * moonRim * 0.15;
    col = mix(col, castleCol, castle);

    vec2  winId  = floor(uv * vec2(24.0, 20.0));
    vec2  winFr  = fract(uv * vec2(24.0, 20.0));
    float winOn  = step(0.20, winFr.x) * step(winFr.x, 0.74)
                 * step(0.22, winFr.y) * step(winFr.y, 0.72);
    float wFlick = 0.65 + 0.35 * sin(t * (1.8 + hash(winId) * 5.0) + hash(winId + 3.0) * 6.28);
    col += castle * winOn * wFlick * vec3(1.0, 0.65, 0.18) * 0.80;
    col += castle * winOn * wFlick * vec3(0.9, 0.30, 0.02)
         * smoothstep(0.30, 0.0, length(winFr - 0.5)) * 0.50;
    col += castle * winOn * wFlick * vec3(0.45, 0.22, 0.03)
         * smoothstep(0.42, 0.30, length(winFr - 0.5)) * 0.22;

    for (int si = 0; si < 18; si++) {
        float fi = float(si);
        float sx = 0.06 + hash(vec2(fi, 7.0)) * 0.88;
        float sy = 0.28 + hash(vec2(fi, 8.0)) * 0.50;
        sy += sin(t * (0.35 + hash(vec2(fi, 9.0)) * 0.85) + fi * 2.1) * 0.030;
        sx += sin(t * (0.22 + hash(vec2(fi, 10.0)) * 0.55) + fi * 1.7) * 0.018;
        float sd = length(uv - vec2(sx, sy));
        float sp = 0.45 + 0.55 * sin(t * (2.4 + fi * 0.7) + fi * 2.3);
        col += vec3(1.0, 0.88, 0.22) * smoothstep(0.005, 0.0, sd) * sp;
        col += vec3(0.75, 0.48, 0.06) * smoothstep(0.022, 0.001, sd) * sp * 0.40;
    }

    for (int ci = 0; ci < 18; ci++) {
        float fi  = float(ci);
        float cx_ = 0.06 + hash(vec2(fi, 0.0)) * 0.88;
        float cy_ = 0.30 + hash(vec2(fi, 1.0)) * 0.40;
        cy_ += sin(t * (0.45 + hash(vec2(fi, 2.0)) * 0.7) + fi * 1.3) * 0.030;
        cx_ += sin(t * (0.28 + hash(vec2(fi, 3.0)) * 0.45) + fi * 2.2) * 0.016;
        float cd  = length(uv - vec2(cx_, cy_));
        float cp  = 0.65 + 0.35 * sin(t * (1.4 + fi * 0.45));
        col += vec3(1.0, 0.82, 0.38) * smoothstep(0.007, 0.0, cd) * cp;
        col += vec3(0.72, 0.32, 0.06) * smoothstep(0.035, 0.002, cd) * cp * 0.55;
    }

    for (int oi = 0; oi < 4; oi++) {
        float fi = float(oi);
        float ox = fract(0.08 + hash(vec2(fi, 4.0)) + t * (0.005 + fi * 0.0025));
        float oy = 0.42 + hash(vec2(fi, 5.0)) * 0.22 + sin(t * 0.38 + fi * 1.9) * 0.025;
        float od = length(uv - vec2(ox, oy));
        col += vec3(0.75, 0.70, 0.55) * smoothstep(0.006, 0.0, od);
    }

    float fogN = fbm(uv * 2.8 + vec2(t * 0.022, 0.0));
    float fog  = smoothstep(0.60, 0.90, uv.y);
    col = mix(col, vec3(0.26, 0.08, 0.45), fog * (0.45 + fogN * 0.55) * 0.70);

    float hill = smoothstep(0.87, 0.93, uv.y + sin(uv.x * 3.5) * 0.012);
    col = mix(col, vec3(0.025, 0.018, 0.035), hill);

    return col;
}

// ─── Zone dispatch ────────────────────────────────────────────────────────
vec3 getZone(float z, vec2 uv, float t) {
    if (z < 0.5) return zone0(uv, t);
    if (z < 1.5) return zone1(uv, t);
    if (z < 2.5) return zone2(uv, t);
    if (z < 3.5) return zone3(uv, t);
    if (z < 4.5) return zone4(uv, t);
    if (z < 5.5) return zone5(uv, t);
    if (z < 6.5) return zone6(uv, t);
    if (z < 7.5) return zone7(uv, t);
    if (z < 8.5) return zone8(uv, t);
    return zone9(uv, t);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    uv.y    = 1.0 - uv.y;

    vec3 curr = getZone(u_zone, uv, u_time);
    vec3 prev = getZone(u_prev, uv, u_time);

    float b   = smoothstep(0.0, 1.0, u_blend);
    vec3  col = mix(prev, curr, b);

    vec2  vig = uv - 0.5;
    float v   = 1.0 - dot(vig * 1.6, vig * 1.6);
    col *= clamp(v, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
`;

const WGL_FRAG = _WGL_FRAG_A + _WGL_FRAG_B + _WGL_FRAG_C;
