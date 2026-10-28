/* A small WebGL viewer for the printed InMoov parts. No library: the
   meshes are tiny (see tools/meshes.py) and all it has to do is turn one
   part under one light. Drag to turn it; arrow keys work too. */

(() => {
  const fig = document.getElementById('parts');
  if (!fig) return;

  const canvas = fig.querySelector('canvas');
  const dims = fig.querySelector('.viewer-dims');
  const buttons = [...fig.querySelectorAll('[data-part]')];
  const src = fig.dataset.src;
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const no = () => root.getAttribute('data-lang') === 'no';

  const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: true, alpha: true });
  if (!gl) { fig.classList.add('no-webgl'); return; }

  // ── Shaders: one light from the upper left, a little rim so edges read ──
  const compile = (type, text) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, text);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, `
    attribute vec3 p; attribute vec3 n;
    uniform mat4 mvp; uniform mat4 model;
    varying vec3 vn;
    void main() { vn = mat3(model) * n; gl_Position = mvp * vec4(p, 1.0); }`));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `
    precision mediump float;
    uniform vec3 tint; uniform vec3 shade;
    varying vec3 vn;
    void main() {
      vec3 n = normalize(vn);
      float d = abs(dot(n, normalize(vec3(-0.5, 0.7, 0.6))));
      float rim = pow(1.0 - abs(n.z), 3.0);
      gl_FragColor = vec4(mix(shade, tint, 0.25 + 0.75 * d) + rim * 0.12, 1.0);
    }`));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const at = {
    p: gl.getAttribLocation(prog, 'p'), n: gl.getAttribLocation(prog, 'n'),
    mvp: gl.getUniformLocation(prog, 'mvp'), model: gl.getUniformLocation(prog, 'model'),
    tint: gl.getUniformLocation(prog, 'tint'), shade: gl.getUniformLocation(prog, 'shade'),
  };
  gl.enable(gl.DEPTH_TEST);

  // ── Colours follow the theme ──
  const rgb = name => {
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    const m = v.match(/^#([0-9a-f]{6})$/i);
    if (!m) return [0.6, 0.6, 0.6];
    const x = parseInt(m[1], 16);
    return [(x >> 16) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255];
  };
  let tint, shade;
  const colours = () => { tint = rgb('--signal'); shade = rgb('--surface'); };
  colours();
  new MutationObserver(() => { colours(); render(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // ── 4×4 matrices, column-major ──
  const mul = (a, b) => {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  };
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); };
  const move = z => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,z,1]);
  const lens = (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2), r = 1 / (near - far);
    return new Float32Array([f / aspect,0,0,0, 0,f,0,0, 0,0,(near + far) * r,-1, 0,0,2 * near * far * r,0]);
  };

  // ── Meshes ──
  const cache = {};
  let mesh = null;

  const load = async slug => {
    if (cache[slug]) return cache[slug];
    const res = await fetch(src + slug + '.bin');
    if (!res.ok) throw new Error(res.status);
    const buf = await res.arrayBuffer();
    const view = new DataView(buf);
    if (String.fromCharCode(...new Uint8Array(buf, 0, 4)) !== 'OSM1') throw new Error('format');
    const nv = view.getUint32(4, true), nt = view.getUint32(8, true);
    const lo = [0, 1, 2].map(i => view.getFloat32(12 + i * 4, true));
    const size = [0, 1, 2].map(i => view.getFloat32(24 + i * 4, true));
    const q = new Uint16Array(buf, 36, nv * 3);
    const off = 36 + nv * 6;
    const idx = nv > 65535 ? new Uint32Array(buf.slice(off), 0, nt * 3) : new Uint16Array(buf.slice(off), 0, nt * 3);

    // Centre it, scale it to fit, and stand it up (the files are Z-up).
    const half = Math.max(...size) / 2;
    const pos = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) {
      const x = (lo[0] + q[i * 3] / 65535 * size[0]) - (lo[0] + size[0] / 2);
      const y = (lo[1] + q[i * 3 + 1] / 65535 * size[1]) - (lo[1] + size[1] / 2);
      const z = (lo[2] + q[i * 3 + 2] / 65535 * size[2]) - (lo[2] + size[2] / 2);
      pos[i * 3] = x / half; pos[i * 3 + 1] = z / half; pos[i * 3 + 2] = -y / half;
    }
    // Flat shading reads best on machined-looking parts: one normal per face.
    const data = new Float32Array(nt * 18);
    for (let t = 0; t < nt; t++) {
      const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      [a, b, c].forEach((v, k) => data.set([pos[v], pos[v + 1], pos[v + 2], nx, ny, nz], t * 18 + k * 6));
    }
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return (cache[slug] = { vbo, count: nt * 3, size, triangles: nt });
  };

  // ── Camera and input ──
  let yaw = 0.6, pitch = -0.35, spinning = !calm, visible = false;

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  };

  const render = () => {
    if (!mesh) return;
    fit();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const model = mul(rotX(pitch), rotY(yaw));
    const mvp = mul(lens(0.6, canvas.width / canvas.height, 0.1, 20), mul(move(-3.3), model));
    gl.uniformMatrix4fv(at.mvp, false, mvp);
    gl.uniformMatrix4fv(at.model, false, model);
    gl.uniform3fv(at.tint, tint);
    gl.uniform3fv(at.shade, shade);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
    gl.enableVertexAttribArray(at.p);
    gl.enableVertexAttribArray(at.n);
    gl.vertexAttribPointer(at.p, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(at.n, 3, gl.FLOAT, false, 24, 12);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  };

  let last = 0;
  const tick = now => {
    if (spinning && visible && !document.hidden) {
      yaw += Math.min(now - last, 50) * 0.0004;
      render();
    }
    last = now;
    requestAnimationFrame(tick);
  };

  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' };
    spinning = false;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    yaw += (e.clientX - drag.x) * 0.01;
    // On touch, vertical drags scroll the page instead (touch-action: pan-y).
    if (drag.mouse) pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - drag.y) * 0.01));
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
    spinning = false;
    yaw += k[0];
    pitch = Math.max(-1.5, Math.min(1.5, pitch + k[1]));
    render();
  });
  new ResizeObserver(render).observe(canvas);

  // ── Choosing a part ──
  const fmt = v => Math.round(v);
  const describe = () => {
    if (!mesh) return;
    const [x, y, z] = mesh.size;
    dims.textContent = `${fmt(x)} × ${fmt(y)} × ${fmt(z)} mm · ${mesh.triangles.toLocaleString(no() ? 'nb-NO' : 'en-GB')} ${no() ? 'trekanter' : 'triangles'}`;
  };
  document.addEventListener('langchange', describe);

  const choose = async slug => {
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.part === slug)));
    fig.classList.add('loading');
    try {
      mesh = await load(slug);
      fig.classList.remove('loading', 'failed');
      describe();
      render();
    } catch (e) {
      fig.classList.remove('loading');
      fig.classList.add('failed');
    }
  };
  buttons.forEach(b => b.addEventListener('click', () => choose(b.dataset.part)));

  // Nothing is downloaded until the viewer is close to the screen.
  let started = false;
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !started) {
      started = true;
      choose(buttons[0].dataset.part);
      requestAnimationFrame(t => { last = t; tick(t); });
    }
  }, { rootMargin: '200px' }).observe(fig);
})();
