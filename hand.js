/* The InMoov hand, seen from the palm side, moved by sliders.

   On the real hand each finger is one servo pulling a line that runs
   through all three joints, so pulling it curls the whole finger at once.
   That is why one slider per finger is enough. Here a slider is the
   servo's angle; each joint takes its share of the curl, and a segment
   that tips towards you is drawn shorter, the way it would look. */

(() => {
  const box = document.getElementById('hand');
  if (!box) return;

  const svg = box.querySelector('.hand-svg');
  const NS = 'http://www.w3.org/2000/svg';
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (document.documentElement.getAttribute('data-lang') === 'no' ? 'no' : 'en');

  // Base of each finger on the palm's top edge, its width, and its three
  // segments (mm-ish, scaled to the drawing). Order matches the sliders.
  const FINGERS = [
    { key: 'index',  x: 133, w: 38, seg: [54, 33, 25] },
    { key: 'middle', x: 178, w: 39, seg: [60, 37, 27] },
    { key: 'ring',   x: 222, w: 37, seg: [56, 34, 25] },
    { key: 'little', x: 264, w: 32, seg: [43, 27, 21] },
  ];
  // The thumb mostly swings across the palm rather than curling, so its
  // joints bend less and the whole thumb turns instead.
  const THUMB = { x: 126, y: 334, w: 40, seg: [50, 40], spread: -48, sweep: 92, joint: [25, 45] };
  const PALM = { x: 110, y: 196, w: 182, h: 150 };
  const JOINT = [85, 95, 70];   // how far each joint bends at a full pull, degrees
  const rad = d => d * Math.PI / 180;

  const state = { thumb: 0, index: 0, middle: 0, ring: 0, little: 0, wrist: 0 };

  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // A finger is drawn as segments along its axis. A segment bent by φ from
  // the plane of the palm shows L·cos φ of its length; past 90° it folds
  // back over the palm and you see its back instead of its pad.
  const segments = (baseX, baseY, w, lengths, curl, joint = JOINT, dir = -1) => {
    const out = [];
    let s = 0, phi = 0, z = 0;
    lengths.forEach((L, i) => {
      phi += joint[i] * curl;
      const a = s, dz = L * Math.sin(rad(phi));
      s += L * Math.cos(rad(phi));
      const y1 = baseY + dir * a, y2 = baseY + dir * s;
      const top = Math.min(y1, y2), h = Math.max(Math.abs(y2 - y1), w * 0.42);
      const face = phi < 62 ? 'pad' : phi < 118 ? 'edge' : 'back';
      out.push({ x: baseX - w / 2, y: Math.abs(y2 - y1) < w * 0.42 ? (y1 + y2) / 2 - h / 2 : top,
                 w, h, face, z: z + dz / 2, tip: i === lengths.length - 1 });
      z += dz;
    });
    return out;
  };

  const draw = () => {
    svg.textContent = '';
    const hand = el('g', { class: 'hand-body' });
    // Turning the wrist turns the hand about its own axis; seen from the
    // front, that narrows it.
    const turn = Math.cos(rad(state.wrist));
    hand.setAttribute('transform', `translate(200 0) scale(${Math.max(Math.abs(turn), 0.08)} 1) translate(-200 0)`);
    if (turn < 0) hand.classList.add('turned');

    hand.append(el('rect', { class: 'hand-arm', x: 142, y: PALM.y + PALM.h - 6, width: 116, height: 110, rx: 10 }));
    hand.append(el('rect', { class: 'hand-palm', x: PALM.x, y: PALM.y, width: PALM.w, height: PALM.h, rx: 26 }));

    const parts = [];
    FINGERS.forEach(f => segments(f.x, PALM.y + 8, f.w, f.seg, state[f.key])
      .forEach(s => parts.push(s)));
    parts.sort((a, b) => a.z - b.z).forEach(s => {
      hand.append(el('rect', { class: 'hand-seg ' + s.face, x: s.x, y: s.y, width: s.w, height: s.h, rx: s.tip ? 14 : 9 }));
    });

    // The thumb swings across the palm as it curls, as well as bending.
    const th = el('g', { transform: `rotate(${THUMB.spread + THUMB.sweep * state.thumb} ${THUMB.x} ${THUMB.y})` });
    segments(THUMB.x, THUMB.y, THUMB.w, THUMB.seg, state.thumb, THUMB.joint).forEach(s =>
      th.append(el('rect', { class: 'hand-seg ' + s.face, x: s.x, y: s.y, width: s.w, height: s.h, rx: s.tip ? 15 : 10 })));
    hand.append(th);

    svg.append(hand);
  };

  // ── Sliders ──
  const sliders = [...box.querySelectorAll('input[type="range"]')];
  const readout = key => box.querySelector(`[data-readout="${key}"]`);
  const show = key => {
    const out = readout(key);
    if (!out) return;
    out.textContent = key === 'wrist'
      ? Math.round(state.wrist) + '°'
      : Math.round(state[key] * 180) + '°';
  };
  sliders.forEach(s => {
    const key = s.dataset.joint;
    s.addEventListener('input', () => {
      stopShow();
      state[key] = key === 'wrist' ? Number(s.value) : Number(s.value) / 180;
      show(key);
      draw();
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
  const moveTo = (target, ms = 420) => new Promise(done => {
    cancelAnimationFrame(frame);
    const from = KEYS.map(k => state[k]);
    if (calm) { KEYS.forEach((k, i) => { state[k] = target[i]; }); sync(); draw(); done(); return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / ms, 1);
      const e = 1 - Math.pow(1 - p, 3);
      KEYS.forEach((k, i) => { state[k] = from[i] + (target[i] - from[i]) * e; });
      sync(); draw();
      if (p < 1) frame = requestAnimationFrame(step); else done();
    };
    frame = requestAnimationFrame(step);
  });

  let showing = 0;
  const stopShow = () => { showing++; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const count = async () => {
    const run = ++showing;
    await moveTo(POSES.fist, 300);
    for (const pose of COUNT) {
      if (run !== showing) return;
      await wait(calm ? 700 : 380);
      if (run !== showing) return;
      await moveTo(pose, 300);
    }
  };

  box.querySelectorAll('[data-pose]').forEach(b => b.addEventListener('click', () => {
    const name = b.dataset.pose;
    if (name === 'count') { count(); return; }
    stopShow();
    moveTo(POSES[name]);
  }));

  sync();
  draw();
})();
