/* The InMoov hand in 3D, moved by sliders. Each finger is one servo in
   the forearm turning a pulley with two lines: the palm-side one winds on
   and curls the finger, the back one pays out. The forearm is cut open so
   you can watch it. No library: lathes, prisms and drums, lit by a fixed
   studio rig in linear light. */

(() => {
  const box = document.getElementById('hand');
  if (!box) return;

  const canvas = box.querySelector('.hand-canvas');
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true });
  const fail = () => box.classList.add('no-webgl');
  const { PI, sin, cos, tan, min, max, abs, hypot, sign, sqrt, round, floor } = Math;
  if (!gl) { fail(); return; }

  // ── Maths: column-major, from a pool reset each frame, so drawing allocates nothing ──
  const POOL = [...Array(96)].map(() => new Float32Array(16));
  let pi = 0;
  const M = () => POOL[pi++] || (POOL[pi - 1] = new Float32Array(16));
  const I4 = () => { const o = M(); o.fill(0); o[0] = o[5] = o[10] = o[15] = 1; return o; };
  const mul = (a, b) => {
    const o = M();
    for (let c = 0; c < 16; c += 4) for (let r = 0; r < 4; r++)
      o[c + r] = a[r] * b[c] + a[4 + r] * b[c + 1] + a[8 + r] * b[c + 2] + a[12 + r] * b[c + 3];
    return o;
  };
  function chain(m) { for (let i = 1; i < arguments.length; i++) m = mul(m, arguments[i]); return m; }
  const T = (x, y, z) => { const o = I4(); o[12] = x; o[13] = y; o[14] = z; return o; };
  const rot = (i, j, a) => { const o = I4(), c = cos(a), s = sin(a); o[i * 5] = o[j * 5] = c; o[i * 4 + j] = s; o[j * 4 + i] = -s; return o; };
  const RX = a => rot(1, 2, a), RY = a => rot(2, 0, a), RZ = a => rot(0, 1, a);
  const rotAxis = (x, y, z, a) => {  // Rodrigues, about a unit axis
    const o = I4(), c = cos(a), s = sin(a), t = 1 - c;
    o[0] = t * x * x + c;     o[1] = t * x * y + s * z; o[2] = t * x * z - s * y;
    o[4] = t * x * y - s * z; o[5] = t * y * y + c;     o[6] = t * y * z + s * x;
    o[8] = t * x * z + s * y; o[9] = t * y * z - s * x; o[10] = t * z * z + c;
    return o;
  };
  const lens = (fov, aspect, near, far) => {
    const o = I4(), f = 1 / tan(fov / 2), r = 1 / (near - far);
    o[0] = f / aspect; o[5] = f; o[10] = (near + far) * r; o[11] = -1; o[14] = 2 * near * far * r; o[15] = 0;
    return o;
  };
  const deg = d => d * PI / 180;
  const ease = (a, b, x) => { const t = max(0, min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const apply = (m, x, y, z) => [0, 1, 2].map(i => m[i] * x + m[4 + i] * y + m[8 + i] * z + m[12 + i]);
  const norm = v => { const l = hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dist = (a, b) => hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  // ── Meshes: position, normal, (baked ao, ink), so pins and seams cost no
  //    draws. Real size, so a model matrix is also a normal matrix. ──
  let V, I, X = null;
  const vert = (x, y, z, nx, ny, nz, ao = 1, ink = 0) => {
    const n = norm([nx, ny, nz]), p = X ? apply(X, x, y, z) : [x, y, z], d = X ? sub(apply(X, ...n), apply(X, 0, 0, 0)) : n;
    V.push(...p, ...d, ao, ink);
    return V.length / 8 - 1;
  };
  // Wound to face along the normals: back faces are a cut part's inside.
  const tri = (a, b, c) => {
    const P = k => V.slice(k * 8, k * 8 + 3), N = k => V.slice(k * 8 + 3, k * 8 + 6);
    const n = [0, 1, 2].map(i => N(a)[i] + N(b)[i] + N(c)[i]);
    I.push(...(dot(cross(sub(P(b), P(a)), sub(P(c), P(a))), n) < 0 ? [a, c, b] : [a, b, c]));
  };
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  const grid = (base, w, h) => {
    for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) { const a = base + j * w + i; quad(a, a + 1, a + w + 1, a + w); }
  };
  const at = (m, fn) => { const keep = X; X = keep ? mul(keep, m) : m; fn(); X = keep; };
  const buffer = (type, data, usage = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(type, b); gl.bufferData(type, data, usage); return b; };
  const mesh = fn => {
    V = []; I = []; pi = 0; fn();
    return { vbo: buffer(gl.ARRAY_BUFFER, new Float32Array(V)), ibo: buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(I)), count: I.length };
  };

  // fillets sampled by angle: 15° facets
  const samples = (half, r) => {
    const s = [r - half, 0, half - r];
    for (let i = 1; i < 4; i++) { const k = r * tan(i * PI / 12); s.unshift(r - half - k); s.push(half - r + k); }
    return s;
  };
  const roundedBox = (w, h, d, r) => {
    const half = [w / 2, h / 2, d / 2], inner = half.map(x => x - r);
    [0, 1, 2].forEach(ax => [1, -1].forEach(sg => {
      const u = (ax + 1) % 3, v = (ax + 2) % 3, su = samples(half[u], r), base = V.length / 8;
      samples(half[v], r).forEach(b => su.forEach(a => {
        const p = []; p[u] = a; p[v] = b; p[ax] = sg * half[ax];
        const q = p.map((x, k) => max(-inner[k], min(inner[k], x))), n = norm(sub(p, q));
        vert(q[0] + n[0] * r, q[1] + n[1] * r, q[2] + n[2] * r, ...n);
      }));
      grid(base, 9, 9);
    }));
  };

  // A turned part along y, superellipse section, θ = 0 on the palm side.
  // hole = [y0, y1, θmax] cuts a window; lip gives its edge a wall.
  const ring = (y, r, ao = 1, ink = 0) => ({ y, r, ao, ink });
  const pw = (v, e) => sign(v) * abs(v) ** e;
  const lathe = (rings, sides, ax, az, n, hole, lip) => {
    const W = sides + 1, base = V.length / 8, last = rings.length - 1, loc = [];
    const cols = [...Array(W)].map((_, j) => {
      const t = j / sides * 2 * PI, s = sin(t), c = cos(t);
      return { t: min(t, 2 * PI - t), x: ax * pw(s, 2 / n), z: az * pw(c, 2 / n), nx: pw(s, 2 - 2 / n) / ax, nz: pw(c, 2 - 2 / n) / az };
    });
    rings.forEach((g, i) => {
      const nb = k => (rings[k] && (rings[k].r || rings[k].y !== g.y) ? rings[k] : g);
      const a = nb(i - 1), b = nb(i + 1), dr = b.y !== a.y ? (b.r - a.r) / (b.y - a.y) : 0;
      cols.forEach(c => {
        const v = g.r ? [c.x * g.r, g.y, c.z * g.r, c.nx, -dr, c.nz] : [0, g.y, 0, 0, sign(g.y - rings[i ? 0 : last].y), 0];
        loc.push(v);
        vert(...v, g.ao, g.ink);
      });
    });
    const win = (i, j) => {
      if (!hole || i < 0 || i >= last) return false;
      j = (j + sides) % sides;
      return [i, i + 1].every(k => (rings[k].y - hole[0]) * (rings[k].y - hole[1]) <= 1e-6) && max(cols[j].t, cols[j + 1].t) <= hole[2] + 1e-6;
    };
    for (let i = 0; i < last; i++) for (let j = 0; j < sides; j++) {
      const a = base + i * W + j;
      if (!win(i, j)) quad(a, a + 1, a + W + 1, a + W);
      else if (lip) [[-1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1], [0, -1, 0, 0, 1, 0], [0, 1, 0, 1, 1, 1]].forEach(([di, dj, i0, j0, i1, j1]) => {
        if (win(i + di, j + dj)) return;
        const e = [loc[(i + i0) * W + j + j0], loc[(i + i1) * W + j + j1]], c = [loc[i * W + j], loc[(i + 1) * W + j + 1]];
        const d = norm([0, 1, 2].map(k => c[0][k] + c[1][k] - e[0][k] - e[1][k]));  // faces into the window
        const k = [0, lip].flatMap(w => e.map(v => { const m = norm(v.slice(3)); return vert(v[0] - w * m[0], v[1] - w * m[1], v[2] - w * m[2], ...d, 0.8); }));
        quad(k[0], k[1], k[3], k[2]);
      });
    }
  };

  // A capped cylinder along y: an ink dot of radius pin per cap, ink bands [[y, w]].
  const drum = (r, len, sides, pin, bands = []) => {
    const h = len / 2, ink = +(pin >= r), ys = [ring(-h, r, 1, ink), ring(h, r, 1, ink)];
    bands.forEach(([y, w]) => [[-w / 2, 0], [0.01 - w / 2, 1], [w / 2 - 0.01, 1], [w / 2, 0]].forEach(([o, k]) => ys.push(ring(y + o, r, 1, k))));
    lathe(ys.sort((a, b) => a.y - b.y), sides, 1, 1, 2);
    [-h, h].forEach(y => {
      const rs = ink ? [[0, 1], [r, 1]] : pin ? [[0, 1], [pin, 1], [pin + 0.15, 0], [r, 0]] : [[0, 0], [r, 0]], base = V.length / 8;
      rs.forEach(([q, k]) => { for (let j = 0; j <= sides; j++) { const t = j / sides * 2 * PI; vert(q * sin(t), y, q * cos(t), 0, y, 0, 1, k); } });
      grid(base, sides + 1, rs.length);
    });
  };

  // A convex CCW outline from z0 to z1, chamfered; flat shaded for crisp creases.
  const prism = (pts, z0, z1, cb, cf, ink = 0) => {
    const N = pts.length, C = [0, 1].map(k => pts.reduce((s, p) => s + p[k] / N, 0));
    const inset = c => pts.map((p, i) => {
      const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N];
      const n1 = norm([a[1] - p[1], p[0] - a[0], 0]), n2 = norm([p[1] - b[1], b[0] - p[0], 0]), m = norm([n1[0] + n2[0], n1[1] + n2[1], 0]);
      const k = c / dot(m, n1);  // c / sin(half the corner angle)
      return [p[0] + m[0] * k, p[1] + m[1] * k];
    });
    const rings = [[inset(cb), z0], [pts, z0 + cb], [pts, z1 - cf], [inset(cf), z1]].filter((r, i, all) => !i || r[1] !== all[i - 1][1]);
    const face = (cs, n) => { const k = cs.map(c => vert(...c, ...n, 1, ink)); quad(k[0], k[1], k[2], k[3]); };
    for (let r = 1; r < rings.length; r++) for (let i = 0; i < N; i++) {
      const [A, za] = rings[r - 1], [B, zb] = rings[r], j = (i + 1) % N;
      const cs = [[...A[i], za], [...A[j], za], [...B[j], zb], [...B[i], zb]];
      const n = norm(cross(sub(cs[1], cs[0]), sub(cs[3], cs[0]))), out = sub(cs[0], [...C, (z0 + z1) / 2]);
      face(cs, dot(n, out) < 0 ? n.map(x => -x) : n);
    }
    [[rings[0], -1], [rings[rings.length - 1], 1]].forEach(([[ps, z], s]) => {
      const c = vert(...C, z, 0, 0, s, 1, ink), k = ps.map(p => vert(...p, z, 0, 0, s, 1, ink));
      k.forEach((a, i) => tri(c, a, k[(i + 1) % N]));
    });
  };

  // ── The hand in mm: y up from the palm's bottom edge, +x to the thumb,
  //    +z out of the palm. Segments are pin to pin, the last pin to tip. ──
  const BEND = [86, 98, 66], S0 = [0, 0.08, 0.18], S1 = [0.8, 0.92, 1];
  const DI = [[17.2, 15.5], [15.4, 15], [15]];
  const FINGERS = [
    { key: 'index',  x: 31,  y: 95, splay: -4, seg: [34, 27, 29], D: DI, cap: 13.8, capL: 17, servo: [16, -70, 0] },
    { key: 'middle', x: 10,  y: 98, splay: 0,  seg: [36, 28, 30], D: DI.map(s => s.map(d => d * 1.03)), cap: 14.2, capL: 17, servo: [-16, -70, 0] },
    { key: 'ring',   x: -11, y: 95, splay: 4,  seg: [34, 27, 29], D: DI, cap: 13.8, capL: 17, servo: [16, -96, 1], small: 1 },
    { key: 'little', x: -31, y: 86, splay: 9,  seg: [29, 24, 25], D: [[14.9, 13.2], [13.2, 12.9], [12.9]], cap: 12.2, capL: 14.6, servo: [-16, -96, 1], small: 1 },
  ];
  const THUMB = { key: 'thumb', x: 38, y: 30, seg: [36, 31], D: [[22.7, 21], [20]], cap: 19.3, capL: 18.6, servo: [0, -120, 2], bend: [45, 55], pillow: [24.5, 30] };
  const ALL = [THUMB, ...FINGERS];
  // each servo row's pulleys sit 6 mm higher, so lower rows' lines clear them
  const level = f => 13.25 + 6 * f.servo[2];
  const BAR_Y = -53;

  const LARGE = [[-26, 0], [24, 0], [38, 4], [45, 50], [42, 88], [21, 93], [0, 86], [-44, 10]];
  const SMALL = [[-43.5, 12.4], [-0.3, 87], [-21, 92], [-42, 76], [-46, 40]];  // a 0.8 mm split
  const COVER = [[-40, 8], [36, 6], [42, 48], [40, 84], [-38, 76], [-44, 40]];
  const SCREWS = [[-30, 18], [26, 16], [29, 47], [27, 70], [-25, 64], [-34, 40]];
  // an ink strip in the split, so the stage never shows through
  const FILLER = [[-1.2, 0.03], [0.4, 0.03], [0.4, 0.97], [-1.2, 0.97]].map(([o, t]) => [-44 * t + 0.866 * o, 86 - 76 * t - 0.501 * o]);

  // A segment: barrel knuckle, tube with a palm-side window or a bullet tip, pillow.
  const segment = (f, i) => mesh(() => {
    const L = f.seg[i], D = f.D[i][0], R0 = D / 2;
    at(RZ(deg(-90)), () => drum(0.47 * D, D, 24, 1.55));
    if (i < f.seg.length - 1) {
      const R1 = f.D[i][1] / 2;
      lathe([ring(0.5, 0), ring(0.5, 0.8 * R0, 0.55), ring(3.5, R0, 0.8), ring(6, R0), ring(L - 14, R0 + (R1 - R0) * (L - 20) / (L - 9.5)),
        ring(L - 3.5, R1, 0.8), ring(L - 0.5, 0.8 * R1, 0.55), ring(L - 0.5, 0)], 24, 1, 0.97, 2.4, [L - 14, L - 3.5, deg(30)]);
    } else {
      const Rc = f.cap / 2, h = 1.15 * Rc, top = 12 + f.capL;
      const rs = [ring(0.5, 0), ring(0.5, 0.8 * R0, 0.55), ring(3.5, R0, 0.8), ring(11.6, R0), ring(12, R0, 0.75), ring(12.4, Rc, 0.75), ring(top - h, Rc)];
      for (let k = 1; k <= 6; k++) rs.push(ring(top - h + h * k / 6, Rc * sqrt(max(0, 1 - k * k / 36))));
      lathe(rs, 24, 1, 0.97, 2.4);
    }
    if (!i) {
      const [w, h] = f.pillow || [D + 2.5, 0.85 * L];
      at(T(0, h / 2 - 3, -R0 - 1.6), () => {
        roundedBox(w, h, 4.5, 2);
        at(chain(T(0, -0.2 * h, -2.25), RX(deg(-90))), () => drum(1.3, 0.4, 12, 1.3));
      });
    }
  });

  const S = {};
  const bolts = xs => xs.forEach(x => at(chain(T(x, 0, 0), RZ(deg(-90))), () => drum(4, 0.6, 16, 4)));
  const buildScene = () => {
    ALL.forEach(f => { f.mesh = f.seg.map((_, i) => segment(f, i)); });
    S.large = mesh(() => {
      prism(LARGE, -9.5, 9.5, 2, 2.5);
      prism(FILLER, -8, 8, 0, 0, 1);
      at(T(38, 26, 2), () => { roundedBox(26, 30, 18, 3); bolts([-13.3, 13.3]); });  // the thumb's V-bracket
    });
    S.small = mesh(() => prism(SMALL, -9.5, 9.5, 2, 2.5));
    S.cover = mesh(() => {
      prism(COVER, -21, -9, 8, 0);
      SCREWS.forEach(([x, y]) => at(chain(T(x, y, -21.2), RX(deg(-90))), () => drum(1.3, 0.4, 12, 1.3)));
    });
    S.neck = mesh(() => at(T(0, -8, 0), () => { roundedBox(48, 16, 34, 4); bolts([-24.2, 24.2]); }));
    S.band = mesh(() => at(T(0, -27, 0), () => drum(38, 26, 40, 0)));
    // one closed shell cut open over the servos; the ink ring is the robpart2/5 seam
    S.forearm = mesh(() => {
      const K = [[-40, 37], [-44, 40], [-70, 47], [-110, 52], [-137, 53], [-180, 55], [-230, 54]];
      const r = y => { let k = 1; while (k < K.length - 1 && y < K[k][0]) k++; const [a, b] = [K[k - 1], K[k]]; return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); };
      const ys = [-48, -168, -136.6, -137, -137.4, -230];
      for (let y = -40; y > -230; y -= 6) ys.push(y);
      lathe(ys.sort((a, b) => b - a).map(y => ring(y, r(y), y === -137 ? 0.7 : 1, +(y === -137))), 48, 1, 0.88, 2.2, [-48, -168, deg(52.5)], 2);
    });
    S.bed = mesh(() => roundedBox(82, 106, 3, 1.5));
    S.servo = [0, 1, 2].map(lv => mesh(() => {  // MG90S, its spline raised to its pulley
      at(T(0, 0, -1), () => roundedBox(23, 12.5, 22, 1.2));
      at(T(0, 0, 6), () => roundedBox(32.5, 12.5, 2.5, 1.2));
      at(chain(T(6, 0, 10.5 + 3 * lv), RX(deg(90))), () => drum(2.4, 6 * lv + 1.2, 12, 0));
    }));
    S.pulley = mesh(() => at(RX(deg(90)), () => {
      drum(10.5, 4.5, 32, 0, [[-1.05, 0.8], [1.05, 0.8]]);
      at(T(0, 2.25, -7), () => drum(0.9, 0.3, 8, 0.9));
    }));
    S.hub = mesh(() => at(RX(deg(90)), () => drum(2.5, 4.7, 16, 2.5)));
    S.big = mesh(() => roundedBox(40, 20, 30, 2));
    S.horn = mesh(() => { at(T(0, 7, 0), () => roundedBox(5, 19, 2, 1)); at(RX(deg(90)), () => drum(2, 2.4, 12, 2)); });
    // the guide bar, section (x, -z) stepped to fit the shell, a hole per line
    S.bar = mesh(() => {
      at(chain(T(0, BAR_Y, 0), RX(deg(-90))), () => prism([[-26, -20], [-10, -29], [20, -29], [34, -22], [34, -10], [-26, -10]], -2.5, 2.5, 1, 1));
      ALL.forEach(f => [1, -1].forEach(s => [-2.5, 2.5].forEach(y =>
        at(T(f.servo[0] + 6 - 10.5 * s, BAR_Y + y, level(f) - 1.05 * s), () => drum(0.8, 0.3, 8, 0.8)))));
    });
  };

  // ── Shading: softboxes fixed in the world so highlights glide as it turns,
  //    satin PLA, split-sum env BRDF, finger occlusion, PBR Neutral. ──
  // WebGL1 only promises 16 fragment uniform vectors, so the fragment side
  // packs into exactly 16 rows (8 occluders + 8) and the eye lives in the
  // vertex shader: eye - wp is linear, so it interpolates exactly, and it is
  // scaled to about 1 so dot(vd, vd) fits an fp16 mediump.
  const VS = `attribute vec3 p; attribute vec3 n; attribute vec2 a;
uniform mat4 vp; uniform mat4 model; uniform vec3 eye;
varying vec3 wn; varying vec3 wp; varying vec3 vd; varying vec2 e;
void main() {
  vec4 w = model * vec4(p, 1.0);
  wp = w.xyz; wn = (model * vec4(n, 0.0)).xyz; vd = (eye - wp) / 1024.0; e = a;
  gl_Position = vp * w;
}`;
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec4 base, inkC, mat, sky, gnd, occ[8];  // base.w thin, inkC.w line, sky.w exposure, gnd.w occlusion
uniform vec3 keyC, fillC, rimC;
varying vec3 wn; varying vec3 wp; varying vec3 vd; varying vec2 e;
const vec3 K = vec3(-0.55, 0.62, 0.56), KU = vec3(-0.713, 0.0, -0.701), KV = vec3(0.434, 0.785, -0.442);
const vec3 TP = vec3(0.0, 0.989, 0.148), TU = vec3(1.0, 0.0, 0.0), TV = vec3(0.0, -0.148, 0.989);
const vec3 RM = vec3(0.621, 0.351, -0.701), RU = vec3(0.749, 0.0, 0.663), RV = vec3(-0.232, 0.937, 0.262);
const vec3 FD = vec3(0.858, 0.101, 0.504);
float panel(vec3 R, vec3 c, vec3 u, vec3 v, vec2 hs, float s) {
  float k = dot(R, c);
  if (k <= 0.0) return 0.0;
  vec2 m = 1.0 - smoothstep(hs - s, hs + s, abs(vec2(dot(R, u), dot(R, v))) / k);
  return m.x * m.y;
}
vec3 neutral(vec3 c) {
  float x = min(c.r, min(c.g, c.b));
  c -= x < 0.08 ? x - 6.25 * x * x : 0.04;
  float p = max(c.r, max(c.g, c.b));
  if (p < 0.76) return c;
  float q = 1.0 - 0.0576 / (p - 0.52);
  return mix(vec3(q), c * q / p, 1.0 / (0.15 * (p - q) + 1.0));
}
void main() {
  vec3 n = normalize(wn), v = normalize(vd), sk = sky.rgb, gd = gnd.rgb;
  bool line = inkC.w > 0.5, back = !gl_FrontFacing && !line;
  if (back) n = -n;
  vec3 alb = mix(base.rgb, inkC.rgb, e.y);  // a line's slack colour runs into the signal as it pulls
  if (line) alb *= 1.0 - 0.45 * step(0.82, fract(e.x / 6.0));
  float r = mix(mat.x, 0.35, line ? 0.0 : e.y), w = mat.z * (1.0 - e.y), ao = line ? 1.0 : e.x;
  for (int i = 0; i < 8; i++) {
    vec3 d = occ[i].xyz - wp;
    float l2 = max(dot(d, d), 1.0);
    ao *= 1.0 - gnd.w * clamp(dot(n, d) * inversesqrt(l2) * occ[i].w * occ[i].w / l2, 0.0, 1.0);
  }
  ao = max(ao, 0.35);
  float wk = max((dot(n, K) + w) / (1.0 + w), 0.0);
  float sc = smoothstep(0.0, 0.3, wk) * (1.0 - smoothstep(0.3, 0.6, wk)) * step(0.01, w);
  vec3 hemi = mix(gd, sk, n.y * 0.5 + 0.5);
  vec3 dif = alb * (hemi * ao + keyC * wk * mix(1.0, ao, 0.5) + fillC * max(dot(n, FD), 0.0) * ao
      + 0.35 * sk * max(dot(n, TP), 0.0) * ao + rimC * max(dot(n, RM), 0.0))
    + keyC * sc * vec3(0.05, 0.035, 0.015) * ao
    + alb * vec3(1.0, 0.96, 0.88) * rimC * pow(clamp(dot(v, -RM), 0.0, 1.0), 6.0) * 0.25 * base.w;
  vec3 R = reflect(-v, n);
  float nv = clamp(dot(n, v), 0.001, 1.0), s = 0.05 + 0.4 * r;
  vec3 env = mix(gd, sk, smoothstep(-0.2, 0.4, R.y)) + keyC * 5.0 * panel(R, K, KU, KV, vec2(0.35, 0.5), s)
    + vec3(3.0) * panel(R, TP, TU, TV, vec2(0.5), s) + rimC * 6.0 * panel(R, RM, RU, RV, vec2(0.08, 0.7), s);
  vec4 q = r * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
  vec2 ab = vec2(-1.04, 1.04) * (min(q.x * q.x, exp2(-9.28 * nv)) * q.x + q.y) + q.zw;
  float sao = clamp(pow(nv + ao, exp2(-16.0 * r - 1.0)) - 1.0 + ao, 0.0, 1.0);
  vec3 col = dif * (1.0 - mat.w) + env * (mix(vec3(mat.y), alb, mat.w) * ab.x + ab.y) * sao;
  if (back) col = alb * hemi * 0.55 * ao;
  col = pow(neutral(max(col * sky.w, 0.0)), vec3(1.0 / 2.2));
  // ±½ level of interleaved gradient noise; the wrap keeps every term small
  // enough for fp16 mediump, where a raw gl_FragCoord hash overflows
  vec2 g = mod(gl_FragCoord.xy, 64.0);
  gl_FragColor = vec4(col + (fract(52.9829189 * fract(dot(g, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0, 1.0);
}`;

  // linear albedo, (roughness, f0, wrap, metal)
  const PLA = { b: [0.7, 0.67, 0.61], m: [0.5, 0.04, 0.35, 0], jit: 1 };
  const SHELL = { b: [0.64, 0.61, 0.555], m: [0.55, 0.04, 0.35, 0], jit: 1 };
  const NYLON = { b: [0.74, 0.72, 0.68], m: [0.6, 0.04, 0.3, 0] };
  const BLACK = { b: [0.0137, 0.0144, 0.0168], m: [0.32, 0.04, 0, 0] };
  const BAND = { b: [0.023, 0.024, 0.027], m: [0.55, 0.04, 0, 0] };
  const LINE = [0.45, 0.04, 0.2, 0];  // a line's base and ink are its slack and signal colours

  const hex = h => [16, 8, 0].map(s => { const c = ((h >> s) & 255) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const C = {};
  const colours = () => {
    const m = getComputedStyle(root).getPropertyValue('--signal').trim().match(/^#([0-9a-f]{6})$/i);
    // key and rim are set so the brightest lit PLA lands on #ebe6dc (dark)
    // and #e3dfd5 (light) after the tone map, with the satin sheen included
    Object.assign(C, root.getAttribute('data-theme') === 'light'
      ? { sky: [0.35, 0.35, 0.36], gnd: [0.3, 0.28, 0.25], keyC: [0.52, 0.5, 0.47], fillC: [0.36, 0.37, 0.38], rimC: [0.34, 0.352, 0.38], expo: 0.9, occK: 0.9, slack: hex(0x9a9285) }
      : { sky: [0.2, 0.2, 0.22], gnd: [0.05, 0.045, 0.04], keyC: [0.8, 0.768, 0.72], fillC: [0.18, 0.19, 0.2], rimC: [0.6, 0.62, 0.665], expo: 1, occK: 0.75, slack: hex(0x6f6a62) },
      { sig: hex(m ? parseInt(m[1], 16) : 0x8fa8ff), ink: hex(0x1c1c1e) });
    C.lines = [C.slack, C.slack.map(x => x * 0.8)].map(b => ({ b, m: LINE, line: 1 }));
    if (!prog) return;
    gl.uniform4f(U.sky, C.sky[0], C.sky[1], C.sky[2], C.expo);
    gl.uniform4f(U.gnd, C.gnd[0], C.gnd[1], C.gnd[2], C.occK);
    ['keyC', 'fillC', 'rimC'].forEach(k => gl.uniform3fv(U[k], C[k]));
  };

  // one dynamic buffer, a fixed point count so the indices never change
  const NP = 28, RING = 7, HALF = 5 * (NP - 1) * 36;
  const lineData = new Float32Array(10 * NP * RING * 8);
  const U = {}, lines = {};
  let prog = null, lost = false;

  const init = () => {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { prog = null; return false; }
    gl.useProgram(prog);
    ['p', 'n', 'a'].forEach(k => { U[k] = gl.getAttribLocation(prog, k); gl.enableVertexAttribArray(U[k]); });
    'vp model eye base inkC mat sky gnd keyC fillC rimC occ'.split(' ').forEach(k => { U[k] = gl.getUniformLocation(prog, k); });
    gl.enable(gl.DEPTH_TEST);
    buildScene();
    const idx = [];
    for (let a = 0; a < 10 * NP * RING; a++) if (a % RING < 6 && a % (NP * RING) < (NP - 1) * RING) idx.push(a, a + 1, a + RING, a + RING, a + 1, a + RING + 1);
    lines.vbo = buffer(gl.ARRAY_BUFFER, lineData.byteLength, gl.DYNAMIC_DRAW);
    lines.ibo = buffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx));
    lines.count = HALF;
    colours();
    dirty = true;
    return true;
  };

  const draw = (m, model, mt, thin = 0, id = 0, ink = C.ink) => {
    const x = sin(id * 78.233) * 43758.5453, j = mt.jit ? 0.98 + 0.04 * (x - floor(x)) : 1;  // print batches differ by ±2%
    gl.uniformMatrix4fv(U.model, false, model);
    gl.uniform4f(U.base, mt.b[0] * j, mt.b[1] * j, mt.b[2] * j, thin);
    gl.uniform4f(U.inkC, ink[0], ink[1], ink[2], mt.line || 0);
    gl.uniform4fv(U.mat, mt.m);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ibo);
    [3, 3, 2].forEach((size, k) => gl.vertexAttribPointer(U['pna'[k]], size, gl.FLOAT, false, 32, k * 12));
    gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, m.off || 0);
  };

  // ── State ──
  const state = { thumb: 0, index: 0, middle: 0, ring: 0, little: 0, wrist: 0 };
  const HOME = deg(-28);
  let yaw = HOME, pitch = deg(12), touched = false, dirty = true, cssH = 400;
  let focusKey = null, focusUntil = 0, focusF = 0, stale = false;  // stale: draw on the next tick
  const occ = new Float32Array(32), hot = new Float32Array(3);

  const inkFor = key => {
    if (focusKey !== key || !focusF) return C.ink;
    for (let i = 0; i < 3; i++) hot[i] = C.ink[i] + (C.sig[i] - C.ink[i]) * focusF;
    return hot;
  };

  // A line runs from its anchor on the pulley to the knot in the tip, so
  // arc length is the line's own coordinate and the travel marks move with it.
  // Flexors leave the pulley's left side, which the home view can see into.
  const route = (f, l, s, hand, piece, rad) => {
    const hx = f.servo[0] + 6, hy = f.servo[1], z = level(f) - 1.05 * s, th = state[f.key] * PI, w = 10.5 + rad, pts = [];
    for (let i = 7; i >= 0; i--) {  // wound round the rim, in its groove
      const a = s > 0 ? PI + (PI / 6 + th) * i / 7 : (th - PI * 7 / 6) * i / 7;
      pts.push([hx + w * cos(a), hy + w * sin(a), z]);
    }
    const x = hx - w * s, sag = s > 0 ? 0 : sign(-x) * min(4, 3.675 * th);  // the slack one sags
    [0.25, 0.5, 0.75].forEach(u => pts.push([x + sag * 4 * u * (1 - u), hy + (BAR_Y - hy) * u, z]));
    pts.push([x, BAR_Y, z], apply(hand, 0.12 * f.x, -11, 4 * s), apply(piece, 0.6 * f.x, f === THUMB ? 14 : 40, 6 * s), apply(piece, f.x, f.y - 8, 6 * s));
    f.F.forEach((m, i) => {
      const L = f.seg[i], R = f.D[i][0] / 2 - 2.2;
      pts.push(apply(m, 0, 0, 0.4 * (R + 2.2) * s), apply(m, 0, 0.25 * L, R * s), i < f.seg.length - 1 ? apply(m, 0, 0.75 * L, R * s) : apply(m, 0, L - 8, (f.cap / 2 - 3) * s));
    });
    while (pts.length < NP) {  // split the longest span
      let b = 0;
      for (let i = 1; i < pts.length - 1; i++) if (dist(pts[i], pts[i + 1]) > dist(pts[b], pts[b + 1])) b = i;
      pts.splice(b + 1, 0, pts[b].map((x, k) => (x + pts[b + 1][k]) / 2));
    }
    const pull = ease(0.03, 0.5, state[f.key]), idle = 0.45 * pull;
    const tint = s > 0 ? idle + (0.9 * max(0.35, pull) - idle) * (focusKey === f.key ? focusF : 0) : 0;
    let n = null, along = 0, o = l * NP * RING * 8;
    pts.forEach((p, i) => {
      if (i) along += dist(p, pts[i - 1]);
      const t = norm(sub(pts[min(i + 1, NP - 1)], pts[max(i - 1, 0)]));
      if (n) n = sub(n, t.map(x => x * dot(n, t)));  // carried along, so the tube doesn't twist
      n = norm(n && hypot(...n) > 1e-3 ? n : cross(t, abs(t[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
      const b = cross(t, n);
      for (let k = 0; k < RING; k++, o += 8) {
        const c = cos(k * PI / 3), sn = sin(k * PI / 3);
        for (let j = 0; j < 3; j++) { const d = n[j] * c + b[j] * sn; lineData[o + j] = p[j] + d * rad; lineData[o + 3 + j] = d; }
        lineData[o + 6] = along; lineData[o + 7] = tint;
      }
    });
  };

  const render = () => {
    if (lost || !prog) return;
    pi = 0; stale = false;
    const w = canvas.width, h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // a 20° lens from 1.1 m; the forearm runs out of the bottom of the frame
    const view = chain(T(0, 0, -1106), RX(pitch), RY(yaw), T(0, -20, 0));
    gl.uniformMatrix4fv(U.vp, false, mul(lens(deg(20), w / h, 600, 1700), view));
    const eye = i => -(view[i * 4] * view[12] + view[i * 4 + 1] * view[13] + view[i * 4 + 2] * view[14]);
    gl.uniform3f(U.eye, eye(0), eye(1), eye(2));

    // pose the fingers first: their frames feed the occluders and the lines
    const hand = RY(deg(state.wrist));
    const small = chain(hand, T(-44, 10, 0), rotAxis(0.501, 0.866, 0, deg(12) * (state.ring + state.little) / 2), T(44, -10, 0));
    ALL.forEach(f => {
      const c = state[f.key];
      let m = f === THUMB
        ? chain(hand, T(38, 30, 6), RZ(deg(-45 - 25 * c)), RY(deg(-45 * c)), RX(deg(15 - 15 * c)))  // tuned to close onto the index's middle phalanx
        : chain(f.small ? small : hand, T(f.x, f.y, 0), RZ(deg(f.splay)));
      f.F = f.seg.map((L, i) => {
        const here = m = mul(m, RX(deg((f.bend || BEND)[i] * ease(S0[i], S1[i], c))));
        m = mul(m, T(0, L, 0));
        return here;
      });
    });
    [[FINGERS[0], 0], [FINGERS[1], 0], [FINGERS[2], 0], [THUMB, 0], ...FINGERS.map(f => [f, 1])].forEach(([f, i], k) => {
      for (let j = 0; j < 3; j++) occ[k * 4 + j] = f.F[i][4 + j] * f.seg[i] / 2 + f.F[i][12 + j];
      occ[k * 4 + 3] = 0.45 * f.D[i][0];
    });
    gl.uniform4fv(U.occ, occ);

    draw(S.forearm, I4(), SHELL, 0.2, 1);
    draw(S.bed, T(0, -113, -13.5), SHELL, 0.2, 2);
    ALL.forEach(f => {
      const [x, y, lv] = f.servo, m = chain(T(x + 6, y, level(f)), RZ(state[f.key] * PI));
      draw(S.servo[lv], T(x, y, 0), BLACK);
      draw(S.pulley, m, NYLON);
      draw(S.hub, m, NYLON, 0, 0, inkFor(f.key));
    });
    draw(S.big, T(0, -140, 2), BLACK);
    draw(S.horn, chain(T(10, -140, 18), RZ(deg(state.wrist))), PLA, 0.25, 3, inkFor('wrist'));
    draw(S.bar, I4(), SHELL, 0.2, 4);
    draw(S.neck, hand, PLA, 0.25, 5);
    draw(S.band, hand, BAND);
    draw(S.large, hand, PLA, 0.25, 6);
    draw(S.small, small, PLA, 0.25, 7);
    draw(S.cover, hand, SHELL, 0.2, 8);
    ALL.forEach((f, k) => f.mesh.forEach((part, i) => draw(part, f.F[i], PLA, i === f.seg.length - 1 ? 1 : 0.7, 10 + k * 3 + i)));

    // rebuilt only when pose, focus or size change; at least 0.75 px thick
    gl.bindBuffer(gl.ARRAY_BUFFER, lines.vbo);
    if (dirty) {
      const rad = max(0.6, 0.75 * 390 / cssH);
      ALL.forEach((f, k) => [1, -1].forEach(s => route(f, s > 0 ? k : k + 5, s, hand, f.small ? small : hand, rad)));
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lineData);
      dirty = false;
    }
    C.lines.forEach((mt, k) => { lines.off = k * HALF * 2; draw(lines, I4(), mt, 0, 0, C.sig); });
  };

  // ── Size: device pixels, at most 2× ──
  let cap = 2, px = null;
  const fit = () => {
    if (!px) return;
    const k = min(1, cap / (window.devicePixelRatio || 1)), w = max(1, round(px[0] * k)), h = max(1, round(px[1] * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    dirty = true;
    render();
  };
  const ro = new ResizeObserver(es => {
    const e = es[es.length - 1], dp = e.devicePixelContentBoxSize && e.devicePixelContentBoxSize[0], r = window.devicePixelRatio || 1;
    cssH = e.contentRect.height || cssH;
    px = dp ? [dp.inlineSize, dp.blockSize] : [e.contentRect.width * r, e.contentRect.height * r];
    fit();
  });
  try { ro.observe(canvas, { box: 'device-pixel-content-box' }); } catch (err) { ro.observe(canvas); }

  // ── One loop for sway, inertia, tweens and the focus fade; it draws only
  //    when something moved and stops at rest. ──
  let raf = 0, last = 0, ema = 16, slow = 0, vYaw = 0, drag = null, tween = null, visible = false;
  const t0 = performance.now();
  const kick = () => { if (!raf && !lost) raf = requestAnimationFrame(tick); };
  const tick = now => {
    raf = 0;
    const dt = last ? min(now - last, 100) : 16;
    let busy = false, moved = false;
    last = now;
    if (!touched && !calm && visible && !document.hidden) {
      yaw = HOME + deg(9) * sin((now - t0) / 3400);
      busy = moved = true;
    }
    if (vYaw && !drag) {
      yaw += vYaw;
      vYaw = abs(vYaw) < 1e-4 ? 0 : vYaw * 0.92;
      busy = moved = true;
    }
    if (tween) {
      const p = max(0, min((now - tween.start) / tween.ms, 1)), e = p < 0.5 ? 4 * p * p * p : 1 - (2 - 2 * p) ** 3 / 2;
      KEYS.forEach((k, i) => { state[k] = tween.from[i] + (tween.to[i] - tween.from[i]) * e; });
      sync();
      if (p >= 1) { const done = tween.done; tween = null; done(); }
      busy = moved = dirty = true;
    }
    if (focusKey) {
      const f = calm ? +(now < focusUntil) : max(0, min(1, 1 - (now - focusUntil) / 300));
      if (f !== focusF) { focusF = f; moved = dirty = true; }
      if (f) busy = true; else clearFocus();
    }
    if (moved || stale) render();
    ema += 0.1 * (dt - ema);  // if frames stay slow, draw fewer pixels
    slow = ema > 22 ? slow + 1 : 0;
    if (slow >= 30 && cap > 1.5) { cap = 1.5; fit(); }
    if (busy) raf = requestAnimationFrame(tick); else last = 0;
  };

  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => kick());
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; if (init()) { render(); kick(); } else fail(); });

  // ── Looking around it ──
  const clampPitch = p => max(deg(-8), min(deg(38), p));
  canvas.addEventListener('pointerdown', e => {
    touched = true; vYaw = 0;
    drag = { x: e.clientX, y: e.clientY, t: e.timeStamp, mouse: e.pointerType === 'mouse' };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    vYaw = (e.clientX - drag.x) * 0.01;
    yaw += vYaw;
    if (drag.mouse) pitch = clampPitch(pitch + (e.clientY - drag.y) * 0.01);
    Object.assign(drag, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    render();
  });
  const release = e => {
    if (!drag) return;
    if (calm || e.timeStamp - drag.t > 80) vYaw = 0;  // stopped before letting go: no coast
    drag = null;
    kick();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[e.key];
    if (!k) return;
    e.preventDefault();
    touched = true;
    yaw += k[0];
    pitch = clampPitch(pitch + k[1]);
    render();
  });

  // ── Sliders: the row you drive turns its flexor and pulley dot blue
  //    until 1.8 s after the last touch. ──
  const sliders = [...box.querySelectorAll('input[type="range"]')];
  const rowOf = s => s.closest('.hand-slider') || s;
  const setFocus = key => {
    // the tint is already at full when the row is hovered or focused, so
    // the loop sees no change: mark it stale or it waits for the fade
    focusKey = key; focusUntil = performance.now() + 1800; focusF = 1; dirty = stale = true;
    sliders.forEach(s => rowOf(s).classList.toggle('is-active', s.dataset.joint === key));
    kick();
  };
  const clearFocus = () => {
    if (focusKey) dirty = stale = true;  // drawn by the caller's render or the next tick
    focusKey = null; focusF = 0;
    sliders.forEach(s => rowOf(s).classList.remove('is-active'));
  };
  const show = s => {
    const key = s.dataset.joint, d = round(key === 'wrist' ? state.wrist : state[key] * 180), out = box.querySelector(`[data-readout="${key}"]`);
    if (out) out.textContent = d + '°';
    if (key === 'wrist') return;
    const mm = (10.5 * deg(d)).toFixed(1);  // line wound onto a Ø21 pulley
    s.setAttribute('aria-valuetext', /^n/.test(root.getAttribute('data-lang') || root.lang)
      ? `${d} grader, ${mm.replace('.', ',')} millimeter snøre trukket inn` : `${d} degrees, ${mm} millimetres of line pulled`);
  };
  sliders.forEach(s => {
    const key = s.dataset.joint, focus = () => setFocus(key);
    s.addEventListener('input', () => {
      stopShow(); tween = null;
      state[key] = key === 'wrist' ? Number(s.value) : Number(s.value) / 180;
      show(s); focus(); render();
    });
    rowOf(s).addEventListener('focusin', focus);
    rowOf(s).addEventListener('pointerenter', focus);
  });
  const sync = () => sliders.forEach(s => {
    const key = s.dataset.joint;
    s.value = key === 'wrist' ? state.wrist : round(state[key] * 180);
    show(s);
  });

  new MutationObserver(() => { colours(); sync(); render(); }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-lang'] });

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

  const moveTo = (to, ms = 450) => new Promise(done => {
    const from = KEYS.map(k => state[k]);
    tween = null;
    if (calm) { KEYS.forEach((k, i) => { state[k] = to[i]; }); sync(); dirty = true; render(); done(); return; }
    tween = { from, to, ms, start: performance.now(), done };
    kick();
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
    clearFocus();
    if (b.dataset.pose === 'count') { count(); return; }
    stopShow();
    moveTo(POSES[b.dataset.pose]);
  }));

  if (!init()) { fail(); return; }
  sync();
  render();
  kick();
})();
