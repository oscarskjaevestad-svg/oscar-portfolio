/* The InMoov hand in 3D, moved by sliders — mechanism and all.

   On the real hand each finger is one servo in the forearm pulling a
   line that runs up through the palm and all three joints, so one pull
   curls the whole finger. Here you can see that: the slider turns the
   servo's horn, the horn pulls its tendon (it lights up as it tightens),
   and the finger closes.

   No library: rounded boxes, cylinders, two lights and a sky, and the same
   small amount of matrix maths as the parts viewer. Drag to look around. */

(() => {
  const box = document.getElementById('hand');
  if (!box) return;

  const canvas = box.querySelector('.hand-canvas');
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) { box.classList.add('no-webgl'); return; }

  // ── Matrices (column-major) and vectors ──
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
  const S = (x, y, z) => new Float32Array([x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
  const lens = (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2), r = 1 / (near - far);
    return new Float32Array([f / aspect,0,0,0, 0,f,0,0, 0,0,(near + far) * r,-1, 0,0,2 * near * far * r,0]);
  };
  const deg = d => d * Math.PI / 180;
  const apply = (m, p) => [0, 1, 2].map(i => m[i] * p[0] + m[4 + i] * p[1] + m[8 + i] * p[2] + m[12 + i]);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

  // ── Meshes: smooth normals, interleaved position + normal ──
  const upload = (verts, index) => {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);
    return { vbo, ibo, count: index.length };
  };

  // A box with rounded edges, centred on the origin.
  const roundedBox = (w, h, d, r) => {
    const n = 7, v = [], idx = [];
    const half = [w / 2, h / 2, d / 2], inner = half.map(x => Math.max(x - r, 0));
    [[0, 1, 2, 1], [0, 1, 2, -1], [1, 2, 0, 1], [1, 2, 0, -1], [2, 0, 1, 1], [2, 0, 1, -1]].forEach(([u, vv, axis, sign]) => {
      const base = v.length / 6;
      for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
        const p = [0, 0, 0];
        p[u] = (i / n * 2 - 1) * half[u];
        p[vv] = (j / n * 2 - 1) * half[vv];
        p[axis] = sign * half[axis];
        const q = p.map((x, k) => Math.max(-inner[k], Math.min(inner[k], x)));
        const dn = norm(sub(p, q));
        v.push(q[0] + dn[0] * r, q[1] + dn[1] * r, q[2] + dn[2] * r, ...dn);
      }
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const a = base + j * (n + 1) + i, b = a + n + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    });
    return upload(v, idx);
  };

  // A unit cylinder along y, from 0 to 1, radius 1, capped.
  const cylinder = (() => {
    const seg = 16, v = [], idx = [];
    for (let i = 0; i <= seg; i++) {
      const a = i / seg * Math.PI * 2, x = Math.cos(a), z = Math.sin(a);
      v.push(x, 0, z, x, 0, z, x, 1, z, x, 0, z);
    }
    for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    [0, 1].forEach(y => {
      const c = v.length / 6;
      v.push(0, y, 0, 0, y ? 1 : -1, 0);
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; v.push(Math.cos(a), y, Math.sin(a), 0, y ? 1 : -1, 0); }
      for (let i = 0; i < seg; i++) idx.push(c, c + 1 + i, c + 2 + i);
    });
    return upload(v, idx);
  })();

  // A cylinder of radius r from point a to point b.
  const between = (a, b, r) => {
    const d = sub(b, a), len = Math.hypot(...d) || 1e-3, y = d.map(x => x / len);
    const x = norm(Math.abs(y[1]) > 0.9 ? cross(y, [1, 0, 0]) : cross(y, [0, 1, 0]));
    const z = cross(x, y);
    return new Float32Array([x[0] * r, x[1] * r, x[2] * r, 0, y[0] * len, y[1] * len, y[2] * len, 0,
                             z[0] * r, z[1] * r, z[2] * r, 0, a[0], a[1], a[2], 1]);
  };
  // A pin across a joint (along x), and a hub facing you (along z).
  const axleX = (r, w) => chain(T(-w / 2, 0, 0), RZ(deg(-90)), S(r, w, r));
  const axleZ = (r, h) => chain(RX(deg(90)), S(r, h, r));

  // ── The hand, in millimetres. Palm towards you; a right hand, so the
  //    thumb is on your right. Each finger is three printed segments with
  //    a gap at every hinge, and its servo sits in the forearm. ──
  const GAP = 3;
  const FINGERS = [
    { key: 'index',  x: 30,  y: 96, w: 18,   d: 17,   seg: [40, 25, 21], servo: [16, -42] },
    { key: 'middle', x: 9.8, y: 99, w: 19,   d: 17.5, seg: [45, 28, 22], servo: [-16, -42] },
    { key: 'ring',   x: -10, y: 97, w: 18,   d: 17,   seg: [42, 26, 21], servo: [16, -76] },
    { key: 'little', x: -29, y: 89, w: 15.5, d: 15,   seg: [32, 21, 18], servo: [-16, -76] },
  ];
  const THUMB = { key: 'thumb', w: [22, 20, 19], d: [19, 18, 17], seg: [26, 24, 21], servo: [0, -110] };
  const BEND = [86, 98, 66];

  const segmentMesh = (w, d, L, tip) => roundedBox(w, L - GAP, d, tip ? Math.min(w, d) * 0.46 : Math.min(w, d) * 0.3);
  FINGERS.forEach(f => { f.mesh = f.seg.map((L, i) => segmentMesh(f.w, f.d, L, i === 2)); });
  THUMB.mesh = THUMB.seg.map((L, i) => segmentMesh(THUMB.w[i], THUMB.d[i], L, i === 2));
  const palm = roundedBox(86, 98, 28, 12);
  const thumbPad = roundedBox(34, 44, 26, 12);
  const tray = roundedBox(76, 168, 8, 4);
  const wall = roundedBox(6, 168, 30, 3);
  const cuff = roundedBox(80, 16, 34, 7);
  const servo = roundedBox(23, 12.5, 22, 1.5);
  const servoTab = roundedBox(32.5, 12.5, 2.5, 1);
  const bigServo = roundedBox(40, 20, 30, 2);
  const horn = roundedBox(5, 19, 2, 1);

  // ── Shading: a key light, a fill, a sky above and the floor below, and a
  //    little sheen for the plastic. ──
  const compile = (type, text) => { const s = gl.createShader(type); gl.shaderSource(s, text); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, `
    attribute vec3 p; attribute vec3 n;
    uniform mat4 proj; uniform mat4 view; uniform mat4 model;
    varying vec3 vn; varying vec3 vp; varying float up;
    void main() {
      vec4 world = model * vec4(p, 1.0);
      vec3 wn = normalize(mat3(model) * n);
      up = wn.y;
      vn = mat3(view) * wn;
      vp = (view * world).xyz;
      gl_Position = proj * view * world;
    }`));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec3 base; uniform vec3 sky; uniform vec3 floorTone; uniform float spec; uniform float glow;
    varying vec3 vn; varying vec3 vp; varying float up;
    void main() {
      vec3 n = normalize(vn);
      vec3 eye = normalize(-vp);
      vec3 key = normalize(vec3(-0.45, 0.6, 0.65));
      vec3 fill = normalize(vec3(0.75, 0.0, 0.45));
      vec3 ambient = mix(floorTone, sky, up * 0.5 + 0.5);
      float d = max(dot(n, key), 0.0) * 0.75 + max(dot(n, fill), 0.0) * 0.22;
      float s = pow(max(dot(n, normalize(key + eye)), 0.0), 48.0) * spec;
      float rim = pow(1.0 - max(dot(n, eye), 0.0), 3.0) * 0.18;
      gl_FragColor = vec4(base * (ambient + d) + vec3(s + rim) + base * glow, 1.0);
    }`));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const at = {};
  ['p', 'n'].forEach(k => { at[k] = gl.getAttribLocation(prog, k); });
  ['proj', 'view', 'model', 'base', 'sky', 'floorTone', 'spec', 'glow'].forEach(k => { at[k] = gl.getUniformLocation(prog, k); });
  gl.enable(gl.DEPTH_TEST);
  gl.enableVertexAttribArray(at.p);
  gl.enableVertexAttribArray(at.n);

  const rgb = name => {
    const m = getComputedStyle(root).getPropertyValue(name).trim().match(/^#([0-9a-f]{6})$/i);
    const x = m ? parseInt(m[1], 16) : 0x999999;
    return [(x >> 16) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255];
  };
  let C = {};
  const colours = () => {
    const light = root.getAttribute('data-theme') === 'light';
    C = {
      shell: [0.88, 0.86, 0.82],          // white PLA, like the real one
      shellDark: [0.70, 0.68, 0.65],
      servo: [0.13, 0.135, 0.15],         // MG90S black
      metal: [0.72, 0.74, 0.78],
      slack: light ? [0.55, 0.55, 0.6] : [0.42, 0.42, 0.46],
      signal: rgb('--signal'),
      sky: light ? [0.36, 0.36, 0.38] : [0.26, 0.26, 0.29],
      floor: light ? [0.22, 0.21, 0.2] : [0.1, 0.095, 0.09],
    };
  };
  colours();

  const draw = (mesh, model, c, spec = 0.3, glow = 0) => {
    gl.uniformMatrix4fv(at.model, false, model);
    gl.uniform3fv(at.base, c);
    gl.uniform1f(at.spec, spec);
    gl.uniform1f(at.glow, glow);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);
    gl.vertexAttribPointer(at.p, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(at.n, 3, gl.FLOAT, false, 24, 12);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  };

  // ── State ──
  const state = { thumb: 0, index: 0, middle: 0, ring: 0, little: 0, wrist: 0 };
  let yaw = deg(-26), pitch = deg(10), touched = false;
  const baseYaw = yaw;

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };

  // One finger: each segment turns about its hinge, carries the rest, and
  // shows its pin. Returns the points its tendon runs through, palm side.
  const finger = (start, f, bends, curl) => {
    let m = start;
    const path = [];
    const pick = (v, i) => (Array.isArray(v) ? v[i] : v);
    f.mesh.forEach((part, i) => {
      m = mul(m, RX(deg(bends[i] * curl)));
      const L = f.seg[i];
      draw(part, mul(m, T(0, L / 2, 0)), C.shell, 0.28);
      draw(cylinder, mul(m, axleX(1.9, pick(f.w, i) + 2.4)), C.metal, 0.9);
      path.push(apply(m, [0, 3, pick(f.d, i) / 2 + 0.6]));
      m = mul(m, T(0, L, 0));
    });
    path.push(apply(m, [0, -6, pick(f.d, 2) / 2 + 0.2]));
    return path;
  };

  const tendon = (points, pull) => {
    const c = mix(C.slack, C.signal, Math.min(1, pull * 1.4));
    for (let i = 0; i < points.length - 1; i++) draw(cylinder, between(points[i], points[i + 1], 0.75), c, 0.2, pull * 0.35);
  };

  // A servo lying in the forearm tray; its horn turns with the slider.
  // Returns where the tendon leaves the horn.
  const servoAt = ([x, y], angle) => {
    draw(servo, T(x, y, -1), C.servo, 0.5);
    draw(servoTab, T(x, y, 6), C.servo, 0.4);
    const hub = T(x + 6, y, 13);
    draw(cylinder, chain(T(x + 6, y, 11), axleZ(3, 2.2)), C.metal, 0.9);
    const arm = mul(hub, RZ(deg(-90 + angle)));
    draw(horn, mul(arm, T(0, 7, 0)), C.signal, 0.4, 0.15);
    return apply(arm, [0, 14, 0]);
  };

  const render = () => {
    fit();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(at.sky, C.sky);
    gl.uniform3fv(at.floorTone, C.floor);
    gl.uniformMatrix4fv(at.proj, false, lens(deg(30), canvas.width / canvas.height, 10, 3000));
    gl.uniformMatrix4fv(at.view, false, chain(T(0, 0, -660), RX(pitch), RY(yaw), T(0, -14, 0)));

    // The forearm: an open tray with the servos in it.
    draw(tray, T(0, -88, -14), C.shellDark, 0.2);
    draw(wall, T(-38, -88, 0), C.shellDark, 0.2);
    draw(wall, T(38, -88, 0), C.shellDark, 0.2);
    draw(cuff, T(0, -4, 0), C.shell, 0.25);
    draw(bigServo, T(0, -150, 2), C.servo, 0.5);
    draw(cylinder, chain(T(10, -150, 17), axleZ(5, 2)), C.metal, 0.9);
    draw(horn, chain(T(10, -150, 19.5), RZ(deg(state.wrist)), T(0, 7, 0)), C.signal, 0.4, 0.15);

    const horns = {};
    FINGERS.concat([THUMB]).forEach(f => { horns[f.key] = servoAt(f.servo, state[f.key] * 180); });

    // Everything above the wrist turns with it.
    const hand = RY(deg(state.wrist));
    draw(palm, mul(hand, T(0, 49, 0)), C.shell, 0.25);

    const paths = {};
    FINGERS.forEach(f => { paths[f.key] = finger(mul(hand, T(f.x, f.y, 1)), f, BEND, state[f.key]); });

    // The thumb swings across in front of the palm as it closes.
    const c = state.thumb;
    draw(thumbPad, chain(hand, T(30, 26, 3), RZ(deg(-28))), C.shell, 0.25);
    const thumbRoot = chain(hand, T(40, 34, 6), RZ(deg(-50 + 60 * c)), RY(deg(-30 * c)));
    paths.thumb = finger(thumbRoot, THUMB, [16, 36, 50], c);

    // Tendons: horn → up the forearm → across the palm → along the finger.
    const front = 14.6;
    FINGERS.forEach(f => tendon([
      horns[f.key], [f.x * 0.35, -14, 12],
      apply(hand, [f.x * 0.45, 6, front]), apply(hand, [f.x, f.y - 12, front]),
      ...paths[f.key]], state[f.key]));
    tendon([horns.thumb, [6, -14, 12], apply(hand, [20, 6, front]), apply(hand, [32, 24, 16.5]), ...paths.thumb], state.thumb);
  };

  new MutationObserver(() => { colours(); render(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new ResizeObserver(render).observe(canvas);

  // ── A slow sway while nobody is touching it ──
  let visible = false;
  const t0 = performance.now();
  const sway = now => {
    if (touched) return;
    if (visible && !document.hidden) {
      yaw = baseYaw + Math.sin((now - t0) / 2600) * deg(9);
      render();
    }
    requestAnimationFrame(sway);
  };
  if (!calm) {
    new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(canvas);
    requestAnimationFrame(sway);
  }

  // ── Looking around it ──
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    touched = true;
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
    touched = true;
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
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / ms, 1);
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
