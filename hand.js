/* The InMoov hand in 3D, moved by sliders.

   On the real hand each finger is one servo pulling a line that runs
   through all three joints, so one pull curls the whole finger. That is
   why one slider per finger is enough: the slider is the servo's angle,
   and each joint takes its share of the curl.

   No library: a few rounded shapes, one light, and the same small amount
   of matrix maths as the parts viewer. Drag to look around it. */

(() => {
  const box = document.getElementById('hand');
  if (!box) return;

  const canvas = box.querySelector('.hand-canvas');
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) { box.classList.add('no-webgl'); return; }

  // ── Matrices (column-major) ──
  const mul = (a, b) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  };
  const chain = (...ms) => ms.reduce((a, b) => mul(a, b));
  const T = (x, y, z) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
  const RX = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); };
  const RY = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); };
  const RZ = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); };
  const lens = (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2), r = 1 / (near - far);
    return new Float32Array([f / aspect,0,0,0, 0,f,0,0, 0,0,(near + far) * r,-1, 0,0,2 * near * far * r,0]);
  };
  const deg = d => d * Math.PI / 180;

  // ── Shapes: smooth normals, interleaved position + normal ──
  const upload = (verts, index) => {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);
    return { vbo, ibo, count: index.length };
  };

  // A capsule from y = 0 to y = len: one finger segment, rounded at both
  // ends so neighbouring segments meet in a knuckle.
  const capsule = (r, len, w = 1) => {
    const seg = 20, rings = 7, v = [], idx = [];
    const rows = [];
    for (let k = 0; k <= rings; k++) rows.push([-90 + 90 * k / rings, 0]);
    for (let k = 0; k <= rings; k++) rows.push([90 * k / rings, len]);
    rows.forEach(([lat, cy]) => {
      for (let i = 0; i <= seg; i++) {
        const lon = (i / seg) * Math.PI * 2, cl = Math.cos(deg(lat));
        const nx = cl * Math.cos(lon), ny = Math.sin(deg(lat)), nz = cl * Math.sin(lon);
        v.push(r * w * nx, cy + r * ny, r * nz, nx / w, ny, nz);
      }
    });
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i, b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    return upload(v, idx);
  };

  // A box with rounded edges: the palm and the forearm.
  const roundedBox = (w, h, d, r) => {
    const n = 8, v = [], idx = [];
    const half = [w / 2, h / 2, d / 2], inner = half.map(x => x - r);
    const faces = [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]];
    faces.forEach(([u, vv, axis, sign]) => {
      const base = v.length / 6;
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
        const p = [0, 0, 0];
        p[u] = (i / n * 2 - 1) * half[u];
        p[vv] = (j / n * 2 - 1) * half[vv];
        p[axis] = sign * half[axis];
        const q = p.map((x, k) => Math.max(-inner[k], Math.min(inner[k], x)));
        let dn = p.map((x, k) => x - q[k]);
        const l = Math.hypot(...dn) || 1;
        dn = dn.map(x => x / l);
        v.push(q[0] + dn[0] * r, q[1] + dn[1] * r, q[2] + dn[2] * r, dn[0], dn[1], dn[2]);
      }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const a = base + j * (n + 1) + i, b = a + n + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    });
    return upload(v, idx);
  };

  // ── The hand, in millimetres-ish. Palm towards you; a right hand, so
  //    the thumb is on your right. ──
  const FINGERS = [
    { key: 'index',  x: 30,  y: 95, r: 9.8,  seg: [40, 24, 19] },
    { key: 'middle', x: 9.8, y: 98, r: 10.2, seg: [44, 27, 20] },
    { key: 'ring',   x: -10, y: 96, r: 9.8,  seg: [41, 25, 19] },
    { key: 'little', x: -29, y: 89, r: 8.6,  seg: [31, 20, 16] },
  ];
  const BEND = [88, 100, 68];   // each joint at a full pull, degrees
  const THUMB = { r: [12, 10.6, 10], seg: [24, 23, 19] };

  FINGERS.forEach(f => { f.mesh = f.seg.map(L => capsule(f.r, L)); });
  THUMB.mesh = THUMB.seg.map((L, i) => capsule(THUMB.r[i], L));
  const palm = roundedBox(84, 96, 26, 11);
  const arm = roundedBox(64, 92, 30, 14);
  const pin = capsule(3, 0.01);   // a hinge pin: a small ball on each side of a knuckle

  // ── Shading: a key light, a soft fill and a rim, like a studio shot of
  //    printed plastic. ──
  const compile = (type, text) => { const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, `
    attribute vec3 p; attribute vec3 n;
    uniform mat4 proj; uniform mat4 view; uniform mat4 model;
    varying vec3 vn; varying vec3 vp;
    void main() {
      vec4 world = model * vec4(p, 1.0);
      vn = mat3(view) * mat3(model) * n;
      vp = (view * world).xyz;
      gl_Position = proj * view * world;
    }`));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec3 base; uniform vec3 ambient; uniform float spec;
    varying vec3 vn; varying vec3 vp;
    void main() {
      vec3 n = normalize(vn);
      vec3 eye = normalize(-vp);
      vec3 key = normalize(vec3(-0.45, 0.65, 0.6));
      vec3 fill = normalize(vec3(0.7, -0.1, 0.5));
      float d = max(dot(n, key), 0.0) * 0.8 + max(dot(n, fill), 0.0) * 0.25;
      float s = pow(max(dot(n, normalize(key + eye)), 0.0), 40.0) * spec;
      float rim = pow(1.0 - max(dot(n, eye), 0.0), 3.0) * 0.25;
      gl_FragColor = vec4(base * (ambient + d) + vec3(s + rim), 1.0);
    }`));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const at = {};
  ['p', 'n'].forEach(k => { at[k] = gl.getAttribLocation(prog, k); });
  ['proj', 'view', 'model', 'base', 'ambient', 'spec'].forEach(k => { at[k] = gl.getUniformLocation(prog, k); });
  gl.enable(gl.DEPTH_TEST);

  const rgb = name => {
    const m = getComputedStyle(root).getPropertyValue(name).trim().match(/^#([0-9a-f]{6})$/i);
    const x = m ? parseInt(m[1], 16) : 0x999999;
    return [(x >> 16) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255];
  };
  let colour = {};
  const colours = () => {
    const light = root.getAttribute('data-theme') === 'light';
    colour = {
      // White PLA, like the real one; a touch darker on the light page so it still has a shape.
      shell: light ? [0.86, 0.84, 0.80] : [0.90, 0.88, 0.84],
      arm: light ? [0.74, 0.72, 0.68] : [0.62, 0.60, 0.57],
      pin: rgb('--signal'),
      ambient: light ? [0.32, 0.32, 0.34] : [0.22, 0.22, 0.25],
    };
  };
  colours();

  const draw = (mesh, model, c, spec = 0.35) => {
    gl.uniformMatrix4fv(at.model, false, model);
    gl.uniform3fv(at.base, c);
    gl.uniform3fv(at.ambient, colour.ambient);
    gl.uniform1f(at.spec, spec);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.enableVertexAttribArray(at.p);
    gl.enableVertexAttribArray(at.n);
    gl.vertexAttribPointer(at.p, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(at.n, 3, gl.FLOAT, false, 24, 12);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  };

  // ── Pose ──
  const state = { thumb: 0, index: 0, middle: 0, ring: 0, little: 0, wrist: 0 };
  let yaw = deg(-24), pitch = deg(12);

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };

  // A finger: each segment turns about its own knuckle, towards the palm,
  // and carries the ones after it.
  const finger = (start, mesh, bends, curl, radius) => {
    let m = start;
    mesh.forEach((part, i) => {
      m = mul(m, RX(deg(bends[i] * curl)));
      draw(part, m, colour.shell);
      const r = Array.isArray(radius) ? radius[i] : radius;
      draw(pin, mul(m, T(r - 1, 0, 0)), colour.pin, 0.6);
      draw(pin, mul(m, T(1 - r, 0, 0)), colour.pin, 0.6);
      m = mul(m, T(0, part.len, 0));
    });
  };
  FINGERS.forEach(f => f.mesh.forEach((part, i) => { part.len = f.seg[i]; }));
  THUMB.mesh.forEach((part, i) => { part.len = THUMB.seg[i]; });

  const render = () => {
    fit();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(at.proj, false, lens(deg(30), canvas.width / canvas.height, 10, 2000));
    gl.uniformMatrix4fv(at.view, false, chain(T(0, 0, -560), RX(pitch), RY(yaw), T(0, -58, 0)));

    draw(arm, T(0, -40, -1), colour.arm, 0.2);

    // The wrist turns everything above it.
    const hand = RY(deg(state.wrist));
    draw(palm, mul(hand, T(0, 48, 0)), colour.shell);

    FINGERS.forEach(f => finger(mul(hand, T(f.x, f.y, 2)), f.mesh, BEND, state[f.key], f.r));

    // The thumb swings across in front of the palm as it closes, as well
    // as bending, so its root turns too.
    const c = state.thumb;
    const thumbRoot = chain(hand, T(36, 30, 7), RZ(deg(-52 + 62 * c)), RY(deg(-30 * c)));
    finger(thumbRoot, THUMB.mesh, [18, 38, 52], c, THUMB.r);
  };

  new MutationObserver(() => { colours(); render(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(render).observe(canvas);

  // ── Looking around it ──
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    yaw += (e.clientX - drag.x) * 0.01;
    if (drag.mouse) pitch = Math.max(deg(-60), Math.min(deg(70), pitch + (e.clientY - drag.y) * 0.01));
    drag.x = e.clientX; drag.y = e.clientY;
    render();
  });
  const release = () => { drag = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[e.key];
    if (!k) return;
    e.preventDefault();
    yaw += k[0];
    pitch = Math.max(deg(-60), Math.min(deg(70), pitch + k[1]));
    render();
  });

  // ── Sliders ──
  const sliders = [...box.querySelectorAll('input[type="range"]')];
  const show = key => {
    const out = box.querySelector(`[data-readout="${key}"]`);
    if (out) out.textContent = key === 'wrist' ? Math.round(state.wrist) + '°' : Math.round(state[key] * 180) + '°';
  };
  sliders.forEach(s => {
    const key = s.dataset.joint;
    s.addEventListener('input', () => {
      stopShow();
      state[key] = key === 'wrist' ? Number(s.value) : Number(s.value) / 180;
      show(key);
      render();
    });
  });
  const sync = () => sliders.forEach(s => {
    const key = s.dataset.joint;
    s.value = key === 'wrist' ? state.wrist : Math.round(state[key] * 180);
    show(key);
  });

  // ── Poses ──
  const POSES = {
    open:  [0, 0, 0, 0, 0],
    fist:  [1, 1, 1, 1, 1],
    point: [1, 0, 1, 1, 1],
    peace: [1, 0, 0, 1, 1],
    rock:  [1, 0, 1, 1, 0],
  };
  const COUNT = [[1, 0, 1, 1, 1], [1, 0, 0, 1, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
  const KEYS = ['thumb', 'index', 'middle', 'ring', 'little'];

  let frame = 0;
  const moveTo = (target, ms = 450) => new Promise(done => {
    cancelAnimationFrame(frame);
    const from = KEYS.map(k => state[k]);
    if (calm) { KEYS.forEach((k, i) => { state[k] = target[i]; }); sync(); render(); done(); return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / ms, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      KEYS.forEach((k, i) => { state[k] = from[i] + (target[i] - from[i]) * e; });
      sync(); render();
      if (p < 1) frame = requestAnimationFrame(step); else done();
    };
    frame = requestAnimationFrame(step);
  });

  let showing = 0;
  const stopShow = () => { showing++; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const count = async () => {
    const run = ++showing;
    await moveTo(POSES.fist, 350);
    for (const pose of COUNT) {
      if (run !== showing) return;
      await wait(calm ? 700 : 420);
      if (run !== showing) return;
      await moveTo(pose, 320);
    }
  };

  box.querySelectorAll('[data-pose]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.pose === 'count') { count(); return; }
    stopShow();
    moveTo(POSES[b.dataset.pose]);
  }));

  sync();
  render();
})();
