// ── WebGL שידרים — חלק ב׳: zones 3-6 ─────────────────────────────────────────
// נטען אחרי webgl-shader-utils.js
// zones 7-9 + dispatch + main — ב-webgl-shader-zones-c.js

const _WGL_FRAG_B = `
// ─── Zone 3 · OCEAN ───────────────────────────────────────────────────────
vec3 zone3(vec2 uv, float t) {
    vec2 p = uv * 6.0;
    float caustic = 0.0;
    for (int i = 0; i < 7; i++) {
        float fi = float(i);
        vec2 c = hash2(vec2(fi * 1.13, fi * 1.77 + 3.1)) * 6.0 - 3.0;
        caustic += sin(length(p + c) - t * (0.65 + fi * 0.11));
    }
    caustic = pow(max(0.0, caustic / 7.0 * 0.5 + 0.5), 2.5);

    float n1 = fbm(uv * 1.8 + vec2(t * 0.048, 0.0));
    float n2 = fbm(uv * 3.8 + vec2(0.0, t * 0.042) + n1 * 0.55);

    vec3 col = mix(vec3(0.0, 0.035, 0.14), vec3(0.0, 0.18, 0.40), n1);
    col      = mix(col,  vec3(0.03, 0.44, 0.42), n2 * 0.42);
    col     += vec3(0.13, 0.75, 0.64) * caustic * 0.55;

    float ray = sin(uv.x * 12.0 + t * 0.30 + n1 * 5.0) * 0.5 + 0.5;
    ray *= max(0.0, 1.0 - uv.y * 1.6);
    col += vec3(0.04, 0.33, 0.28) * ray * 0.40;

    float shimmer = vnoise(uv * 24.0 + vec2(t * 0.55, 0.0));
    col += vec3(0.10, 0.55, 0.48) * shimmer * max(0.0, 0.18 - uv.y) * 5.5 * 0.38;

    return col;
}

// ─── Zone 4 · VOID ────────────────────────────────────────────────────────
vec3 zone4(vec2 uv, float t) {
    vec2 p = uv - 0.5;
    float r = length(p);
    float a = atan(p.y, p.x);

    float angle = a + r * 6.5 - t * 0.58;
    vec2 dist   = vec2(cos(angle), sin(angle)) * r + 0.5;

    float n1 = fbm(dist * 3.4 + t * 0.032);
    float n2 = fbm(dist * 6.0 - t * 0.028 + n1 * 0.85);
    float n3 = fbm(uv  * 1.9 + vec2(n2, n1) * 0.55 - t * 0.019);

    vec3 col = vec3(0.012, 0.002, 0.028);
    col += vec3(0.45, 0.05, 1.00) * n1 * n1 * 3.0;
    col += vec3(0.08, 0.02, 0.60) * n2 * 1.8;
    col += vec3(0.65, 0.14, 1.00) * n3 * n3 * 1.2;
    col += vec3(0.0, 0.55, 0.85) * n2 * n3 * 0.7;

    float vd = 1.0 - smoothstep(0.0, 0.44, r);
    col *= (1.0 - vd * 0.68);
    col += vec3(0.04, 0.0, 0.14) * vd * vd;

    float sparks = smoothstep(0.93, 1.0, vnoise(uv * 58.0 + t * 0.26));
    col += vec3(0.72, 0.36, 1.0) * sparks;

    float rim = smoothstep(0.28, 0.50, r);
    col += vec3(0.055, 0.0, 0.17) * rim;

    return col;
}

// ─── Zone 5 · JUNGLE ──────────────────────────────────────────────────────
vec3 zone5(vec2 uv, float t) {
    vec3 col = mix(vec3(0.01, 0.05, 0.01), vec3(0.02, 0.08, 0.02), 1.0 - uv.y);

    float n1 = fbm(uv * 2.8 + vec2(t * 0.012, 0.0));
    float n2 = fbm(uv * 5.0 + vec2(-t * 0.01, t * 0.007) + n1 * 0.6);

    col -= vec3(0.005, 0.025, 0.005) * smoothstep(0.45, 0.6, n2);

    float shaft = sin(uv.x * 13.0 + t * 0.08 + n1 * 2.5) * 0.5 + 0.5;
    shaft *= max(0.0, 1.0 - uv.y * 1.3) * (1.0 - n1 * 0.5);
    col += vec3(0.03, 0.14, 0.03) * shaft * shaft * 0.55;

    float ground = smoothstep(0.78, 0.85, uv.y);
    col = mix(col, vec3(0.01, 0.025, 0.01), ground);

    for (int i = 0; i < 9; i++) {
        float fi  = float(i);
        float fc_x = fract(hash(vec2(fi, 0.0)) + t * (0.006 + hash(vec2(fi, 9.0)) * 0.012));
        float fc_y = 0.22 + hash(vec2(fi * 2.3, 1.0)) * 0.52;
        fc_y += sin(t * (0.5 + hash(vec2(fi, 7.0))) + fi * 1.4) * 0.03;
        float fd   = length(uv - vec2(fc_x, fc_y));
        float fp   = 0.5 + 0.5 * sin(t * (1.8 + fi * 0.6) + fi * 1.57);
        col += vec3(0.7, 1.0, 0.25) * smoothstep(0.018, 0.0, fd) * fp;
        col += vec3(0.15, 0.45, 0.05) * smoothstep(0.055, 0.005, fd) * fp * 0.45;
    }

    float stars = smoothstep(0.93, 1.0, vnoise(uv * 28.0)) * (1.0 - n1 * 0.65);
    col += vec3(0.65, 0.9, 0.55) * stars * 0.38;

    return col;
}

// ─── Zone 6 · CITY ────────────────────────────────────────────────────────
vec3 zone6(vec2 uv, float t) {
    vec3 col = mix(vec3(0.0, 0.015, 0.06), vec3(0.0, 0.005, 0.02), uv.y);

    float bx   = floor(uv.x * 14.0);
    float bTop = 0.88 - 0.14 - hash(vec2(bx, 0.0)) * 0.30;
    float bGap = step(0.12, fract(uv.x * 14.0));
    float bldg = bGap * step(bTop, uv.y) * step(uv.y, 0.88);
    vec3 bldgCol = vec3(0.04, 0.055, 0.11);
    col = mix(col, bldgCol, bldg);

    vec2  wid  = floor(uv * vec2(56.0, 32.0));
    vec2  wfr  = fract(uv * vec2(56.0, 32.0));
    float wOn  = step(0.18, wfr.x) * step(wfr.x, 0.72) * step(0.22, wfr.y) * step(wfr.y, 0.70);
    float wshin = 0.55 + 0.45 * sin(t * (0.8 + hash(wid) * 3.5) + hash(wid + 1.0) * 6.28);
    col += bldg * wOn * wshin * vec3(0.95, 0.78, 0.25) * 0.45;

    float hglow = smoothstep(0.12, 0.0, abs(uv.y - 0.88));
    col += vec3(0.0, 0.45, 0.9)  * hglow * 0.6;
    col += vec3(0.85, 0.0, 0.55) * hglow * hglow * 0.35;

    vec2  ruv  = vec2(uv.x, fract(uv.y * 2.8 - t * 1.8));
    float rain = smoothstep(0.92, 1.0, hash(floor(vec2(uv.x * 90.0, 0.0))));
    rain *= smoothstep(0.88, 0.6, fract(uv.y * 2.8 - t * 1.8));
    col += vec3(0.25, 0.45, 0.75) * rain * 0.28;

    float stars = smoothstep(0.90, 1.0, vnoise(uv * 22.0)) * max(0.0, uv.y - 0.1) * 0.8;
    col += vec3(0.65, 0.75, 1.0) * stars * 0.45;

    return col;
}
`;
