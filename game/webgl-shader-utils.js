// ── WebGL שידרים — חלק א׳: vertex + כלים + zones 0-2 ──────────────────────────

const WGL_VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const _WGL_FRAG_A = `
precision mediump float;

uniform vec2  u_res;
uniform float u_time;
uniform float u_zone;
uniform float u_prev;
uniform float u_blend;

// ─── Utilities ────────────────────────────────────────────────────────────
float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 17.5);
    return fract(p.x * p.y);
}
vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),
                          dot(p,vec2(269.5,183.3)))) * 43758.5453);
}
float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),          hash(i+vec2(1,0)), f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 6; i++) {
        v += a * vnoise(p);
        p  = p * 2.1 + vec2(1.7, 9.2);
        a *= 0.5;
    }
    return v;
}

// ─── Zone 0 · SPACE ───────────────────────────────────────────────────────
vec3 zone0(vec2 uv, float t) {
    vec3 col = vec3(0.01, 0.02, 0.09);

    for (int si = 0; si < 3; si++) {
        float sc   = float(si);
        float scale = 28.0 + sc * 24.0;
        vec2  gv   = uv * scale;
        vec2  id   = floor(gv);
        vec2  fv   = fract(gv) - 0.5;
        float h    = hash(id + sc * 41.3);
        vec2  off  = (hash2(id + sc * 19.7) - 0.5) * 0.55;
        float sz   = 0.017 + h * 0.02 - sc * 0.004;
        float blink = 0.5 + 0.5 * sin(t * (1.5 + h * 5.0) + h * 6.28);
        float star = smoothstep(sz, 0.0, length(fv - off));
        col += mix(vec3(0.85, 0.95, 1.0), vec3(1.0, 0.88, 0.65), h)
               * star * (0.45 + sc * 0.25) * blink;
    }

    float n1 = fbm(uv * 2.0 + vec2(t * 0.022, 0.0));
    float n2 = fbm(uv * 3.5 + vec2(0.0, t * 0.018) + n1);
    float n3 = fbm(uv * 1.4 + vec2(t * 0.015, t * 0.011));
    col += vec3(0.42, 0.04, 0.75) * n1 * n1 * 2.2;
    col += vec3(0.04, 0.28, 0.80) * n2 * 1.6;
    col += vec3(0.70, 0.05, 0.40) * n3 * n3 * 0.9;

    float d = length(uv - 0.5);
    float glow = max(0.0, 1.0 - d * 2.6);
    col += vec3(0.05, 0.08, 0.30) * glow * glow;

    float stCycle = floor(t * 0.18);
    float stProg  = fract(t * 0.18);
    vec2  stDir   = normalize(vec2(0.65, 1.0));
    vec2  stOrig  = vec2(hash(vec2(stCycle, 0.0)) * 0.8 + 0.1, -0.05);
    vec2  stPos   = stOrig + stDir * stProg * 1.6;
    vec2  stDelta = uv - stPos;
    float stAlong = dot(stDelta, stDir);
    float stPerp  = length(stDelta - stDir * stAlong);
    float stTail  = smoothstep(0.0, -0.18, stAlong - 0.18);
    float stHead  = smoothstep(-0.0025, 0.0025, stAlong);
    float stAlpha = smoothstep(0.004, 0.0, stPerp) * stTail * stHead
                    * (1.0 - stProg) * smoothstep(0.85, 1.0, 1.0 - stProg + 0.85);
    col += vec3(0.9, 0.95, 1.0) * stAlpha * 2.5;

    return col;
}

// ─── Zone 1 · NEBULA ──────────────────────────────────────────────────────
vec3 zone1(vec2 uv, float t) {
    vec3 col = vec3(0.035, 0.008, 0.095);

    vec2 p  = uv * 2.3;
    float n1 = fbm(p + vec2(t * 0.032, t * 0.018));
    float n2 = fbm(p * 1.55 + vec2(n1 * 1.1, t * 0.025));
    float n3 = fbm(p * 2.3  - vec2(t * 0.028) + vec2(n2));

    col += vec3(0.27, 0.04, 0.60) * n1 * n1 * 2.8;
    col += vec3(0.04, 0.13, 0.70) * n2 * 1.8;
    col += vec3(0.62, 0.05, 0.38) * n3 * n3 * 1.3;

    for (int i = 0; i < 5; i++) {
        float fi   = float(i);
        float yOff = 0.10 + fi * 0.17 + sin(t * 0.09 + fi * 1.2) * 0.04;
        float wave = uv.y - (yOff + sin(uv.x * 6.0 + t * 0.32 + fi * 1.57 + n1 * 2.2) * 0.038);
        float band = smoothstep(0.075, 0.0, abs(wave))
                   * (0.5 + 0.5 * sin(t * 0.65 + fi * 2.0));
        float hue  = fi / 4.0;
        col += mix(vec3(0.07, 0.55, 1.0), vec3(0.88, 0.07, 0.95), hue) * band * 0.72;
    }

    float stars = smoothstep(0.88, 1.0, vnoise(uv * 20.0 + t * 0.01)) * 0.7;
    col += vec3(0.92, 0.87, 1.0) * stars;

    return col;
}

// ─── Zone 2 · LAVA ────────────────────────────────────────────────────────
vec3 zone2(vec2 uv, float t) {
    vec2 p  = uv * 3.3;
    float f1 = fbm(p + vec2(t * 0.11, t * 0.08));
    float f2 = fbm(p * 0.75 + vec2(-t * 0.09, t * 0.11) + f1 * 1.5);
    float f3 = fbm(p * 1.65 + vec2(t * 0.07, -t * 0.09) + f2 * 0.7);

    float v = clamp(f2 * 1.5 + f3 * 0.28, 0.0, 1.0);

    vec3 col = mix(vec3(0.015, 0.0, 0.0),    vec3(0.55, 0.04, 0.0),  smoothstep(0.0,  0.30, v));
    col      = mix(col, vec3(1.0, 0.27, 0.0),  smoothstep(0.30, 0.65, v));
    col      = mix(col, vec3(1.0, 0.80, 0.12), smoothstep(0.65, 0.85, v));
    col      = mix(col, vec3(1.0, 0.97, 0.76), smoothstep(0.85, 1.0,  v));

    col += vec3(0.72, 0.12, 0.0) * smoothstep(0.58, 1.0, f1) * 0.32;

    float rayX = sin(uv.x * 9.5 + t * 0.44 + f1 * 3.8) * 0.5 + 0.5;
    float rayV = 1.0 - uv.y;
    col += vec3(0.80, 0.20, 0.0) * rayX * rayV * rayV * 0.24;

    return col;
}
`;
