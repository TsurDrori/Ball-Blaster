// ──────────────────────────────────────────────────────────────────────────
//  WebGL Background Renderer
//  נטען אחרי webgl-shader-zones.js (שמכיל WGL_VERT + WGL_FRAG)
// ──────────────────────────────────────────────────────────────────────────

const WGL_BG = (() => {

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

        const vert = compileShader(gl.VERTEX_SHADER,   WGL_VERT);
        const frag = compileShader(gl.FRAGMENT_SHADER, WGL_FRAG);
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
