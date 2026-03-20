// ──────────────────────────────────────────────────────────────────────────
//  WebGL Background Renderer
//  5 GLSL fragment shaders — one per game zone
//  Lazily initialised on first render() call.
// ──────────────────────────────────────────────────────────────────────────

const WGL_BG = (() => {

    // ── Vertex shader (full-screen triangle pair) ─────────────────────────
    const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

    // ── Fragment shader ───────────────────────────────────────────────────
    const FRAG = `
precision mediump float;

uniform vec2  u_res;
uniform float u_time;
uniform float u_zone;   // current zone index (0-4)
uniform float u_prev;   // previous zone index
uniform float u_blend;  // 0=prev fully, 1=current fully

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
// Layered star fields + animated nebula + warp glow + shooting star
vec3 zone0(vec2 uv, float t) {
    vec3 col = vec3(0.008, 0.015, 0.06);

    // 3 layers of stars at different scales
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
        col += mix(vec3(0.78, 0.91, 1.0), vec3(1.0, 0.84, 0.62), h)
               * star * (0.3 + sc * 0.2) * blink;
    }

    // Nebula gas clouds
    float n1 = fbm(uv * 2.0 + vec2(t * 0.022, 0.0));
    float n2 = fbm(uv * 3.5 + vec2(0.0, t * 0.018) + n1);
    col += vec3(0.03, 0.01, 0.15) * n1 * n1 * 3.0;
    col += vec3(0.01, 0.04, 0.13) * n2 * 2.0;

    // Central warp glow
    float d = length(uv - 0.5);
    float glow = max(0.0, 1.0 - d * 2.6);
    col += vec3(0.01, 0.04, 0.12) * glow * glow;

    // Shooting star (time-based, crosses screen diagonally)
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
// Domain-warped fbm + aurora curtains + star dust
vec3 zone1(vec2 uv, float t) {
    vec3 col = vec3(0.035, 0.008, 0.095);

    // Domain-warped fbm layers
    vec2 p  = uv * 2.3;
    float n1 = fbm(p + vec2(t * 0.032, t * 0.018));
    float n2 = fbm(p * 1.55 + vec2(n1 * 1.1, t * 0.025));
    float n3 = fbm(p * 2.3  - vec2(t * 0.028) + vec2(n2));

    col += vec3(0.27, 0.04, 0.60) * n1 * n1 * 2.8;
    col += vec3(0.04, 0.13, 0.70) * n2 * 1.8;
    col += vec3(0.62, 0.05, 0.38) * n3 * n3 * 1.3;

    // Aurora curtains — horizontal wavy bands
    for (int i = 0; i < 5; i++) {
        float fi   = float(i);
        float yOff = 0.10 + fi * 0.17 + sin(t * 0.09 + fi * 1.2) * 0.04;
        float wave = uv.y - (yOff + sin(uv.x * 6.0 + t * 0.32 + fi * 1.57 + n1 * 2.2) * 0.038);
        float band = smoothstep(0.075, 0.0, abs(wave))
                   * (0.5 + 0.5 * sin(t * 0.65 + fi * 2.0));
        float hue  = fi / 4.0;
        col += mix(vec3(0.07, 0.55, 1.0), vec3(0.88, 0.07, 0.95), hue) * band * 0.72;
    }

    // Star dust overlay
    float stars = smoothstep(0.88, 1.0, vnoise(uv * 20.0 + t * 0.01)) * 0.7;
    col += vec3(0.92, 0.87, 1.0) * stars;

    return col;
}

// ─── Zone 2 · LAVA ────────────────────────────────────────────────────────
// Animated domain-warped cells + color ramp + god rays
vec3 zone2(vec2 uv, float t) {
    vec2 p  = uv * 3.3;
    float f1 = fbm(p + vec2(t * 0.11, t * 0.08));
    float f2 = fbm(p * 0.75 + vec2(-t * 0.09, t * 0.11) + f1 * 1.5);
    float f3 = fbm(p * 1.65 + vec2(t * 0.07, -t * 0.09) + f2 * 0.7);

    float v = clamp(f2 * 1.5 + f3 * 0.28, 0.0, 1.0);

    // 4-stop lava color ramp
    vec3 col = mix(vec3(0.015, 0.0, 0.0),    vec3(0.55, 0.04, 0.0),  smoothstep(0.0,  0.30, v));
    col      = mix(col, vec3(1.0, 0.27, 0.0),  smoothstep(0.30, 0.65, v));
    col      = mix(col, vec3(1.0, 0.80, 0.12), smoothstep(0.65, 0.85, v));
    col      = mix(col, vec3(1.0, 0.97, 0.76), smoothstep(0.85, 1.0,  v));

    // Hot-spot bloom
    col += vec3(0.72, 0.12, 0.0) * smoothstep(0.58, 1.0, f1) * 0.32;

    // God rays — upward light columns from base
    float rayX = sin(uv.x * 9.5 + t * 0.44 + f1 * 3.8) * 0.5 + 0.5;
    float rayV = 1.0 - uv.y;
    col += vec3(0.80, 0.20, 0.0) * rayX * rayV * rayV * 0.24;

    return col;
}

// ─── Zone 3 · OCEAN ───────────────────────────────────────────────────────
// Caustic interference + wave noise + god rays from above
vec3 zone3(vec2 uv, float t) {
    // Caustic: overlapping circular wave interference
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

    // God rays — sunlight shafts from top
    float ray = sin(uv.x * 12.0 + t * 0.30 + n1 * 5.0) * 0.5 + 0.5;
    ray *= max(0.0, 1.0 - uv.y * 1.6);
    col += vec3(0.04, 0.33, 0.28) * ray * 0.40;

    // Surface shimmer along top edge
    float shimmer = vnoise(uv * 24.0 + vec2(t * 0.55, 0.0));
    col += vec3(0.10, 0.55, 0.48) * shimmer * max(0.0, 0.18 - uv.y) * 5.5 * 0.38;

    return col;
}

// ─── Zone 4 · VOID ────────────────────────────────────────────────────────
// Vortex distortion + domain-warped fbm + energy sparks
vec3 zone4(vec2 uv, float t) {
    vec2 p = uv - 0.5;
    float r = length(p);
    float a = atan(p.y, p.x);

    // Spiral vortex distortion
    float angle = a + r * 6.5 - t * 0.58;
    vec2 dist   = vec2(cos(angle), sin(angle)) * r + 0.5;

    float n1 = fbm(dist * 3.4 + t * 0.032);
    float n2 = fbm(dist * 6.0 - t * 0.028 + n1 * 0.85);
    float n3 = fbm(uv  * 1.9 + vec2(n2, n1) * 0.55 - t * 0.019);

    vec3 col = vec3(0.004, 0.0, 0.011);
    col += vec3(0.32, 0.04, 0.88) * n1 * n1 * 2.5;
    col += vec3(0.07, 0.0,  0.44) * n2 * 1.4;
    col += vec3(0.55, 0.11, 1.00) * n3 * n3 * 1.0;

    // Central void pull — darkens center
    float vd = 1.0 - smoothstep(0.0, 0.44, r);
    col *= (1.0 - vd * 0.68);
    col += vec3(0.04, 0.0, 0.14) * vd * vd;

    // Energy sparks (bright pixels scattered via noise)
    float sparks = smoothstep(0.93, 1.0, vnoise(uv * 58.0 + t * 0.26));
    col += vec3(0.72, 0.36, 1.0) * sparks;

    // Outer rim glow
    float rim = smoothstep(0.28, 0.50, r);
    col += vec3(0.055, 0.0, 0.17) * rim;

    return col;
}

// ─── Zone dispatch ────────────────────────────────────────────────────────
vec3 getZone(float z, vec2 uv, float t) {
    if (z < 0.5) return zone0(uv, t);
    if (z < 1.5) return zone1(uv, t);
    if (z < 2.5) return zone2(uv, t);
    if (z < 3.5) return zone3(uv, t);
    return zone4(uv, t);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    uv.y    = 1.0 - uv.y;   // match Canvas 2D y-axis

    vec3 curr = getZone(u_zone, uv, u_time);
    vec3 prev = getZone(u_prev, uv, u_time);

    float b   = smoothstep(0.0, 1.0, u_blend);
    vec3  col = mix(prev, curr, b);

    // Vignette
    vec2  vig = uv - 0.5;
    float v   = 1.0 - dot(vig * 1.6, vig * 1.6);
    col *= clamp(v, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
}
`;

    // ── Internal state ────────────────────────────────────────────────────
    let gl, program, posBuffer, uniforms;
    let ready = false;

    // ── Compile helper ────────────────────────────────────────────────────
    function compileShader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('[WGL_BG] shader error:', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    // ── Lazy init ─────────────────────────────────────────────────────────
    function init() {
        const canvas = document.getElementById('bgCanvas');
        if (!canvas) { console.warn('[WGL_BG] bgCanvas not found'); return false; }

        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) { console.warn('[WGL_BG] WebGL not supported'); return false; }

        const vert = compileShader(gl.VERTEX_SHADER,   VERT);
        const frag = compileShader(gl.FRAGMENT_SHADER, FRAG);
        if (!vert || !frag) return false;

        program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('[WGL_BG] link error:', gl.getProgramInfoLog(program));
            return false;
        }

        // Full-screen quad (two triangles)
        posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array([-1,-1, 1,-1, -1,1,  1,-1, 1,1, -1,1]),
            gl.STATIC_DRAW);

        uniforms = {
            res:   gl.getUniformLocation(program, 'u_res'),
            time:  gl.getUniformLocation(program, 'u_time'),
            zone:  gl.getUniformLocation(program, 'u_zone'),
            prev:  gl.getUniformLocation(program, 'u_prev'),
            blend: gl.getUniformLocation(program, 'u_blend'),
        };

        ready = true;
        return true;
    }

    // ── Public: render one frame ──────────────────────────────────────────
    function render(time, zone, prev, blend) {
        if (!ready && !init()) return;

        const canvas = gl.canvas;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);

        const posLoc = gl.getAttribLocation(program, 'a_pos');
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(uniforms.res,   canvas.width, canvas.height);
        gl.uniform1f(uniforms.time,  time);
        gl.uniform1f(uniforms.zone,  zone);
        gl.uniform1f(uniforms.prev,  prev);
        gl.uniform1f(uniforms.blend, blend);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    return { render };
})();
