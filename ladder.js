/* "Try the permission ladder": the same rules J.A.R.V.I.S. applies,
   rewritten for the page. Nothing here talks to the real Jarvis.

   The levels and tools are copied from jarvis.py; the dashboard's own
   list is DASHBOARD_TOOLS in app.py. The order of the checks is the
   order the real dispatcher runs them in. */

(() => {
  const box = document.getElementById('try');
  if (!box) return;

  const lang = () => (document.documentElement.getAttribute('data-lang') === 'no' ? 'no' : 'en');
  const LEVELS = ['read', 'safe_action', 'confirm_required'];
  const NAME = {
    read: { en: 'read', no: 'lese' },
    safe_action: { en: 'safe action', no: 'trygg handling' },
    confirm_required: { en: 'confirm required', no: 'krever bekreftelse' },
  };
  const DASHBOARD = new Set(['turn_lights_on', 'turn_lights_off', 'set_light_brightness', 'activate_scene',
    'turn_tv_on', 'turn_tv_off', 'open_app', 'control_television', 'run_routine',
    'set_room_temperature', 'pause_print', 'resume_print', 'cancel_print']);

  // Each request: what it sounds like, the tool it becomes, and what doing it looks like.
  const ASKS = [
    { id: 'temp', words: ['nozzle', 'temperat', 'how hot', 'varm er'], tool: 'get_temperatures', level: 'read',
      en: 'What’s the nozzle temperature?', no: 'Hva er temperaturen på dysen?',
      done: { en: 'Nozzle 24 °C, bed 23 °C. The printer is idle.', no: 'Dyse 24 °C, plate 23 °C. Printeren står stille.' } },
    { id: 'lights', words: ['light', 'lamp', 'lys'], tool: 'turn_lights_off', level: 'safe_action',
      en: 'Turn off the lights', no: 'Skru av lyset',
      done: { en: 'Lights off.', no: 'Lyset er av.' } },
    { id: 'netflix', words: ['netflix', 'youtube', 'tv', 'app'], tool: 'open_app', level: 'safe_action',
      en: 'Put on Netflix', no: 'Sett på Netflix',
      done: { en: 'Netflix is opening on the TV.', no: 'Netflix åpnes på TV-en.' } },
    { id: 'pause', words: ['pause'], tool: 'pause_print', level: 'safe_action',
      en: 'Pause the print', no: 'Sett printen på pause',
      done: { en: 'Print paused. It can be resumed where it stopped.', no: 'Printen er satt på pause. Den kan fortsette der den stoppet.' } },
    { id: 'stop', words: ['stop', 'emergency', 'nød', 'stopp'], tool: 'stop_the_printer', level: 'safe_action',
      en: 'Emergency stop the printer', no: 'Nødstopp printeren',
      done: { en: 'Printer stopped. A stop only ever makes things safer, so it doesn’t wait for a yes.', no: 'Printeren er stoppet. Et stopp gjør bare ting tryggere, så det venter ikke på et ja.' } },
    { id: 'heat', words: ['heat', 'warm', 'degree', 'grader', 'ovn', 'varme'], tool: 'set_room_temperature', level: 'confirm_required',
      en: 'Set the heating to 22°', no: 'Sett varmen til 22°',
      propose: { en: 'I’m about to set the heating to 22 °C. Shall I?', no: 'Jeg skal til å sette varmen til 22 °C. Skal jeg?' },
      done: { en: 'Heating set to 22 °C.', no: 'Varmen er satt til 22 °C.' } },
    { id: 'cancel', words: ['cancel', 'avbryt'], tool: 'cancel_print', level: 'confirm_required',
      en: 'Cancel the print', no: 'Avbryt printen',
      propose: { en: 'I’m about to cancel the current print. It can’t be resumed afterwards. Shall I?', no: 'Jeg skal til å avbryte printen. Den kan ikke fortsettes etterpå. Skal jeg?' },
      done: { en: 'Print cancelled.', no: 'Printen er avbrutt.' } },
    { id: 'start', words: ['print the', 'start', 'begin', 'skriv ut', 'print en', 'grogu', 'planter'], tool: 'start_print', level: 'confirm_required',
      en: 'Print the Grogu planter', no: 'Print Grogu-potten',
      propose: { en: 'I’m about to start printing the planter: about 12 hours 39 minutes. Shall I?', no: 'Jeg skal til å starte printen av potten: rundt 12 timer og 39 minutter. Skal jeg?' },
      done: { en: 'Printing started.', no: 'Printen er startet.' } },
    { id: 'door', words: ['door', 'lock', 'dør', 'lås'], tool: null, level: null,
      en: 'Unlock the front door', no: 'Lås opp inngangsdøren' },
  ];

  const ceilingInputs = [...box.querySelectorAll('input[name="ceiling"]')];
  const channelInputs = [...box.querySelectorAll('input[name="channel"]')];
  const askList = box.querySelector('.try-asks');
  const field = box.querySelector('.try-input');
  const result = box.querySelector('.try-result');

  const ceiling = () => ceilingInputs.find(i => i.checked).value;
  const channel = () => channelInputs.find(i => i.checked).value;
  const rank = level => LEVELS.indexOf(level);
  const say = pair => pair[lang()];
  const both = pair => `<span lang="en">${pair.en}</span><span lang="nb">${pair.no}</span>`;

  // ── The request buttons ──
  ASKS.forEach(a => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'try-ask';
    b.innerHTML = both(a);
    b.addEventListener('click', () => { field.value = ''; run(a); });
    askList.append(b);
  });

  // Typed requests are matched on words, most specific first.
  const ORDER = ['door', 'cancel', 'pause', 'stop', 'heat', 'temp', 'lights', 'netflix', 'start'];
  const match = text => {
    const t = text.toLowerCase();
    for (const id of ORDER) {
      const a = ASKS.find(x => x.id === id);
      if (a.words.some(w => t.includes(w))) return a;
    }
    return null;
  };
  const typed = () => {
    const text = field.value.trim();
    if (!text) return;
    const a = match(text);
    if (a) run(a, text);
    else show([], { tone: 'chat', head: { en: 'Just talking', no: 'Bare prat' },
      body: { en: 'That isn’t one of the requests in this demo. To the real Jarvis it would be conversation — and talking needs no permission at all.',
              no: 'Det er ikke en av forespørslene i denne demoen. For den ekte Jarvis ville det vært samtale — og å snakke krever ingen tillatelse.' } });
  };
  const hint = () => { field.placeholder = lang() === 'no' ? '…eller skriv en forespørsel' : '…or type a request'; };
  hint();
  document.addEventListener('langchange', hint);
  field.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); typed(); } });
  box.querySelector('.try-go').addEventListener('click', typed);

  // ── The checks, in the order the dispatcher runs them ──
  let pending = null;
  let timer = 0;

  const run = (a, heard) => {
    clearInterval(timer);
    pending = null;
    const steps = [];
    const heardLine = heard ? { en: `Heard: “${escape(heard)}”`, no: `Hørte: «${escape(heard)}»` } : null;

    // 1. The tool has to exist.
    if (!a.tool) {
      steps.push({ ok: false, text: { en: 'Is there a tool for this? No.', no: 'Finnes det et verktøy for dette? Nei.' } });
      return show(steps, { tone: 'refused', heard: heardLine, head: { en: 'Can’t be done', no: 'Kan ikke gjøres' },
        body: { en: 'No tool can reach a lock, so there is nothing to call — however the request is worded, and whatever the ceiling.',
                no: 'Ingen verktøy kan nå en lås, så det finnes ingenting å kalle — uansett hvordan forespørselen er formulert, og uansett tak.' } });
    }
    steps.push({ ok: true, text: { en: `Tool: <code>${a.tool}</code> · ${NAME[a.level].en}`, no: `Verktøy: <code>${a.tool}</code> · ${NAME[a.level].no}` } });

    // 2. A button can only be one the dashboard is allowed to have.
    if (channel() === 'dashboard' && a.level !== 'read') {
      if (!DASHBOARD.has(a.tool)) {
        steps.push({ ok: false, text: { en: 'On the dashboard’s own list? No.', no: 'På dashbordets egen liste? Nei.' } });
        return show(steps, { tone: 'refused', heard: heardLine, head: { en: 'No button for this', no: 'Ingen knapp for dette' },
          body: { en: 'The dashboard never gets a button for this, whatever the ceiling. Some things should only ever be asked for out loud.',
                  no: 'Dashbordet får aldri en knapp for dette, uansett tak. Noen ting skal bare kunne bes om høyt.' } });
      }
      steps.push({ ok: true, text: { en: 'On the dashboard’s own list? Yes.', no: 'På dashbordets egen liste? Ja.' } });
    }

    // 3. The ceiling.
    if (rank(a.level) > rank(ceiling())) {
      steps.push({ ok: false, text: { en: `Within the ceiling (${NAME[ceiling()].en})? No.`, no: `Innenfor taket (${NAME[ceiling()].no})? Nei.` } });
      return show(steps, { tone: 'refused', heard: heardLine, head: { en: 'Refused', no: 'Avvist' },
        body: { en: `This needs <strong>${NAME[a.level].en}</strong> and the ceiling is <strong>${NAME[ceiling()].en}</strong>. The model is never even shown this tool, and if it asked for it anyway, the dispatcher would refuse.`,
                no: `Dette krever <strong>${NAME[a.level].no}</strong>, og taket er <strong>${NAME[ceiling()].no}</strong>. Modellen får aldri engang se dette verktøyet, og hvis den ba om det likevel, ville dispatcheren nektet.` } });
    }
    steps.push({ ok: true, text: { en: `Within the ceiling (${NAME[ceiling()].en})? Yes.`, no: `Innenfor taket (${NAME[ceiling()].no})? Ja.` } });

    // 4. Physical or costly: ask instead of doing.
    if (a.level === 'confirm_required') {
      steps.push({ ok: null, text: { en: 'Needs a yes? Yes — this conversation only, within 2 minutes.', no: 'Trenger et ja? Ja — bare i denne samtalen, innen 2 minutter.' } });
      pending = { a, steps, heardLine, until: Date.now() + 120000 };
      return ask();
    }
    show(steps, { tone: 'done', heard: heardLine, head: { en: 'Done', no: 'Utført' }, body: a.done });
  };

  const ask = () => {
    const p = pending;
    const left = () => Math.max(0, Math.ceil((p.until - Date.now()) / 1000));
    show(p.steps, { tone: 'asking', heard: p.heardLine, head: { en: 'Asks first', no: 'Spør først' },
      body: { en: `<q>${p.a.propose.en}</q>`, no: `<q>${p.a.propose.no}</q>` }, confirm: true });
    const clock = result.querySelector('.try-clock');
    const tickClock = () => {
      const s = left();
      clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (!s) {
        clearInterval(timer);
        pending = null;
        show(p.steps, { tone: 'refused', heard: p.heardLine, head: { en: 'Expired', no: 'Utløpt' },
          body: { en: 'Two minutes passed. The proposal is gone, and a yes now does nothing.', no: 'To minutter gikk. Forslaget er borte, og et ja nå gjør ingenting.' } });
      }
    };
    tickClock();
    timer = setInterval(tickClock, 1000);
  };

  const answer = yes => {
    const p = pending;
    if (!p) return;
    clearInterval(timer);
    pending = null;
    if (!yes) {
      return show(p.steps, { tone: 'refused', heard: p.heardLine, head: { en: 'Called off', no: 'Avlyst' },
        body: { en: 'Nothing happened.', no: 'Ingenting skjedde.' } });
    }
    // The yes is checked against the ceiling as it is now, not as it was.
    if (rank(p.a.level) > rank(ceiling())) {
      return show(p.steps, { tone: 'refused', heard: p.heardLine, head: { en: 'The yes did nothing', no: 'Ja-et gjorde ingenting' },
        body: { en: `The ceiling was lowered to <strong>${NAME[ceiling()].en}</strong> before you answered, and the yes is checked again when it arrives.`,
                no: `Taket ble senket til <strong>${NAME[ceiling()].no}</strong> før du svarte, og ja-et sjekkes på nytt når det kommer.` } });
    }
    show(p.steps, { tone: 'done', heard: p.heardLine, head: { en: 'Done', no: 'Utført' }, body: p.a.done });
  };

  const MARK = { true: '✓', false: '✕', null: '?' };
  const show = (steps, out) => {
    result.hidden = false;
    result.className = 'try-result tone-' + out.tone;
    result.innerHTML =
      (out.heard ? `<p class="mono try-heard">${both(out.heard)}</p>` : '') +
      (steps.length ? '<ol class="try-steps mono">' + steps.map(s =>
        `<li class="${s.ok === true ? 'ok' : s.ok === false ? 'no' : 'ask'}"><span class="try-mark" aria-hidden="true">${MARK[s.ok]}</span>${both(s.text)}</li>`).join('') + '</ol>' : '') +
      `<p class="try-head">${both(out.head)}</p><p class="try-body">${both(out.body)}</p>` +
      (out.confirm ? `<div class="try-confirm"><button type="button" class="btn btn-primary" data-yes>${both({ en: 'Yes', no: 'Ja' })}</button>` +
        `<button type="button" class="btn btn-secondary" data-no>${both({ en: 'No', no: 'Nei' })}</button>` +
        `<span class="mono try-clock" aria-label="${say({ en: 'Time left to answer', no: 'Tid igjen til å svare' })}"></span></div>` : '');
    const yes = result.querySelector('[data-yes]'), nope = result.querySelector('[data-no]');
    if (yes) yes.addEventListener('click', () => answer(true));
    if (nope) nope.addEventListener('click', () => answer(false));
  };

  // Typed text is shown back, so it must stay text.
  const escape = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})();
