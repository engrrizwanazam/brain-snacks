/* ==========================================================
   Brain Snacks — engine (v10)
   Screens, routing, input, sound. Drawing lives in art.js.
   Safari 12 safe throughout.

   Content plugs in from outside and the engine knows none of it by name:
     BS.addPuzzles([...])        puzzle packs, ordered by their own `d`
     BS.registerMode(key, def)   games, which carry their own card and icon
   ========================================================== */

var PUZZLES = [];

var BS = (function () {
  'use strict';

  var A = ART;
  var stage, arena, tray, askEl, toastEl;
  var cur = 0, tries = 0, locked = false, muted = false;
  var modes = {}, modeOrder = [], liveMode = null;
  var pzSeq = 0;

  /* ---------- storage ---------- */
  function load(k, d) {
    try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- timers that die with the screen ----------
     Every delayed callback in a puzzle or a game goes through later(). leave()
     bumps the generation, so nothing scheduled by one screen can ever fire on
     the next one. Bare setTimeout in content caused two separate bugs: games
     repainting over a later screen, and the cup shuffle unlocking input in the
     middle of its own replay. */
  var gen = 0;
  function later(fn, ms) {
    var mine = gen;
    return setTimeout(function () { if (mine === gen) { fn(); } }, ms);
  }

  /* ---------- puzzle packs ----------
     A pack is just an array of puzzles. Each carries `d`, its place on the
     difficulty ladder (lower is earlier; use 34.5 to slot between 34 and 35).
     Load order of the files does not matter. */
  function addPuzzles(list) {
    for (var i = 0; i < list.length; i++) {
      list[i].__seq = pzSeq++;
      if (typeof list[i].d !== 'number') { list[i].d = 10000 + list[i].__seq; }
      PUZZLES.push(list[i]);
    }
  }
  function sortPuzzles() {
    PUZZLES.sort(function (a, b) { return (a.d - b.d) || (a.__seq - b.__seq); });
  }

  /* Chapters are only a way of showing the ladder. Nothing is locked. */
  var CHAPTERS = [
    { n: 'Sunny Meadow', c: '#8ED6A0', s: '#5BA873', host: 'bunny',    f: '#F5E2D0' },
    { n: 'Duck Pond',    c: '#8FD6EF', s: '#5C9FB8', host: 'duck',     f: '#FFE066' },
    { n: 'Toy Room',     c: '#FFC98A', s: '#C99152', host: 'bear',     f: '#B07A4C' },
    { n: 'Candy Lane',   c: '#FFB0C8', s: '#C97E96', host: 'cat',      f: '#FFB03A' },
    { n: 'Sunset Hill',  c: '#FF9E7A', s: '#C46F52', host: 'fox',      f: '#E8722F' },
    { n: 'Night Woods',  c: '#9A8FE0', s: '#6A60AC', host: 'owl',      f: '#C58B4F' },
    { n: 'Robot Lab',    c: '#A9C4E0', s: '#7890AC', host: 'mouse',    f: '#C9BFD6' },
    { n: 'Snowy Peak',   c: '#CFEBFA', s: '#93B8CC', host: 'penguin',  f: '#4A5578' },
    { n: 'Frog Marsh',   c: '#A8E08A', s: '#74AB58', host: 'frog',     f: '#5FC47F' },
    { n: 'Farm Yard',    c: '#F5D58A', s: '#BFA052', host: 'hen',      f: '#FFF0C0' },
    { n: 'Pig Parade',   c: '#FFB8C8', s: '#C98494', host: 'pig',      f: '#FFB0C0' },
    { n: 'Jumbo Jungle', c: '#8FD9B0', s: '#5FA680', host: 'elephant', f: '#A9A6C4' },
    { n: 'Star Station', c: '#FFD84A', s: '#C9A61E', host: 'lion',     f: '#E8A63A' }
  ];
  function perChapter() { return Math.max(1, Math.ceil(PUZZLES.length / CHAPTERS.length)); }
  function chapOf(i) { return Math.min(CHAPTERS.length - 1, Math.floor(i / perChapter())); }
  function chapRange(c) {
    var per = perChapter(), a = c * per;
    var b = (c === CHAPTERS.length - 1) ? PUZZLES.length : Math.min(PUZZLES.length, a + per);
    return [a, b];
  }
  function chapDone(c) {
    var r = chapRange(c), n = 0, i;
    for (i = r[0]; i < r[1]; i++) { if (isDone(i)) { n++; } }
    return n;
  }

  /* ---------- which puzzles are solved ----------
     Progress and the play log are keyed by a puzzle id, never by position, so
     puzzles can be inserted, removed and re-ordered freely. The id is the
     puzzle's own `id` if it has one, otherwise a hash of its question. */
  var doneMap = {};

  function hashOf(t) {
    var h = 5381, i;
    for (i = 0; i < t.length; i++) { h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; }
    return h.toString(36);
  }
  function pid(p) {
    if (!p.__id) { p.__id = p.id ? String(p.id) : hashOf(p.ask); }
    return p.__id;
  }
  function isDone(i) { return PUZZLES[i] ? doneMap[pid(PUZZLES[i])] === 1 : false; }
  function markDone(i) {
    if (!PUZZLES[i]) { return; }
    var k = pid(PUZZLES[i]);
    if (doneMap[k] !== 1) { doneMap[k] = 1; save('bs.doneIds', doneMap); }
  }
  function doneCount() {
    var n = 0, i;
    for (i = 0; i < PUZZLES.length; i++) { if (isDone(i)) { n++; } }
    return n;
  }
  function firstOpen() {
    for (var i = 0; i < PUZZLES.length; i++) { if (!isDone(i)) { return i; } }
    return -1;
  }

  /* The 60 puzzles of v8/v9, in the order they had then. Old saves that were
     keyed by position are translated through this list exactly once. */
  var LEGACY = [
    'yawkti', 'l4u72d', '1jgb4zk', '11lk79u', '1kz7der', '1es9tx9', 'l2l2v3', '32v85j',
    'zdq2gb', '1vgwhy6', '1w0buj8', '1ysgbhv', 'dfhx1v', 'opzbk4', '1ke47in', '1gl1kj0',
    'qs1tz6', 'p2f99a', '1y7wm3k', '6mm2y8', '1brje61', '1e2b096', '1ttqk68', '1kyqyed',
    'ui0im5', 'msqh1d', '14zvwij', 'ec5pfz', '1j8snow', 'z84cn9', '1w6swwe', '1mq92nn',
    '1819mp0', '1fghxgd', 'zcawuo', 'm6ntec', 'jr3yoi', 'pydqme', '10bg76z', '612p4j',
    '14vtp0b', '1pvals2', '1j7rsr', '1cppcnm', '10dzmis', '10nuo4y', '1p6j2up', 'e5diqo',
    '15b3x2l', '1f03k50', '17ppwl3', '1udn1ix', '1l0w70z', '15nioxl', '1ncq38l', '5u8snc',
    '18q45fj', 'p7xga1', '1igf2wm', 'n1ftir', 'a3vlns', 'fwvtlq', '1m57oft', 'ryvf1v',
    'hd78nk', '135lt21', 'o992i', '1ljldpf', '1188p8x', '1aw25jf', '3d107n', 'd1vkhl',
    '19zwoch', '1xw149z', '18lc6i8', '1mc8x9f', '1pu1n3t', 'nlzxh5', '1kqzi0w', '1uw2g3r',
    '1h61n4f', '121vdad', 'uzuzfb', '1a76wlm', '15vdcxo', '1nq22jm', 'hwo8ix', 'jiwjk1',
    'rmo2ro', '6lgyml', 'nng7g9', '4wyohd', '8p0ssq', 'kwsx45', 'r9ie76', 'jpz2rc',
    'i2bnga', '1coqytn', '1nf6j2p', '6rzvro'
  ];

  /* ---------- play log ----------
     Local only. Never sent anywhere, never shown to her. It exists to answer
     one question: which puzzles does she come back to, and which does she put
     down. Read it by holding the title on the home screen for three seconds.
       o opens  w wins  n wrong taps  h hint taps  t told  q left unsolved
       ms fastest solve
     Keyed by puzzle id (bs.log). v9 keyed it by position (bs.stats), which a
     re-order would have silently scrambled. */
  var stats = {}, tOpen = 0, inPuzzle = false, statTimer = null;
  function stat(i) {
    var k = PUZZLES[i] ? pid(PUZZLES[i]) : ('x' + i);
    if (!stats[k]) { stats[k] = { o: 0, w: 0, n: 0, h: 0, t: 0, q: 0, ms: 0 }; }
    return stats[k];
  }
  function flushStats() {
    if (statTimer) { clearTimeout(statTimer); statTimer = null; }
    save('bs.log', stats);
  }
  /* writes are batched: a burst of wrong taps is one localStorage write, not ten */
  function saveStats() {
    if (statTimer) { return; }
    statTimer = setTimeout(function () { statTimer = null; save('bs.log', stats); }, 500);
  }

  /* ---------- sound ---------- */
  var actx = null;
  function ac() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return null; }
    if (!actx) { try { actx = new AC(); } catch (e) { return null; } }
    if (actx.state === 'suspended' && actx.resume) { actx.resume(); }
    return actx;
  }
  function beep(f, at, dur, type, vol, slideTo) {
    var c = ac(); if (!c || muted) { return; }
    var t = c.currentTime + at;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) { o.frequency.exponentialRampToValueAtTime(slideTo, t + dur); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.03);
  }
  var SFX = {
    tap:  function () { beep(660, 0, .05, 'sine', .07); },
    grab: function () { beep(420, 0, .05, 'sine', .05); },
    drop: function () { beep(300, 0, .07, 'triangle', .07); },
    flip: function () { beep(520, 0, .06, 'triangle', .07); },
    good: function () { beep(784, 0, .11, 'triangle', .13); beep(1175, .07, .16, 'triangle', .11); },
    bad:  function () { beep(240, 0, .16, 'sawtooth', .07, 120); },
    pop:  function () { beep(520, 0, .09, 'sine', .1, 940); },
    hop:  function () { beep(330, 0, .1, 'sine', .08, 620); },
    tickTock: function () { beep(880, 0, .04, 'square', .04); },
    note: function (hz) { beep(hz, 0, .26, 'triangle', .12); },
    win:  function () { var n = [523, 659, 784, 1047, 1319], i;
                        for (i = 0; i < n.length; i++) { beep(n[i], i * .085, .3, 'triangle', .12); } },
    over: function () { beep(392, 0, .22, 'triangle', .1, 180); beep(262, .18, .4, 'triangle', .1, 120); }
  };

  /* ---------- coordinates (works for either stage) ---------- */
  function svgOf(el) { return el.ownerSVGElement || el; }
  function toLocal(svg, cx, cy) {
    var r = svg.getBoundingClientRect();
    var vb = (svg.getAttribute('viewBox') || '0 0 360 300').split(/[\s,]+/);
    var vw = parseFloat(vb[2]), vh = parseFloat(vb[3]);
    var sc = Math.min(r.width / vw, r.height / vh);
    var ox = (r.width - vw * sc) / 2, oy = (r.height - vh * sc) / 2;
    return { x: (cx - r.left - ox) / sc, y: (cy - r.top - oy) / sc };
  }
  function pt(svg, e) {
    var t = (e.touches && e.touches.length) ? e.touches[0]
          : (e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : e);
    return toLocal(svg, t.clientX, t.clientY);
  }

  /* ---------- interactions ---------- */
  /* iOS fires a synthetic mouseup after touchend for the same physical tap, up
     to about 300ms later, so both listeners would run the handler twice. A flat
     280ms lockout on the element killed the second tap of a genuine double
     press (the same arrow twice in a row). Suppress the *ghost mouse event*
     specifically, and keep only a very short guard against a true double-fire. */
  function tap(el, fn) {
    el.style.cursor = 'pointer';
    var lastTouch = 0, lastFire = 0;
    function go(e) {
      if (locked) { return; }
      var now = Date.now();
      if (e.type === 'touchend') { lastTouch = now; }
      else if (now - lastTouch < 700) { return; }   /* the ghost mouse event */
      e.preventDefault(); e.stopPropagation();
      if (now - lastFire < 60) { return; }
      lastFire = now;
      fn(el);
    }
    el.addEventListener('touchend', go, false);
    el.addEventListener('mouseup', go, false);
    return el;
  }

  /* opts: onGrab, onMove(x,y), onDrop(x,y,back), clamp:[x0,y0,x1,y1] */
  function drag(el, opts) {
    opts = opts || {};
    el.style.cursor = 'move';
    var svg = svgOf(el), sx, sy, ox, oy, live = false;
    function down(e) {
      if (locked) { return; }
      e.preventDefault(); e.stopPropagation();
      var p = pt(svg, e);
      sx = p.x; sy = p.y; ox = el.__x || 0; oy = el.__y || 0; live = true;
      claim(el);                       /* her finger beats any running animation */
      el.parentNode.appendChild(el);
      SFX.grab();
      if (opts.onGrab) { opts.onGrab(); }
      document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('touchend', up, false);
      document.addEventListener('touchcancel', up, false);
      document.addEventListener('mousemove', move, false);
      document.addEventListener('mouseup', up, false);
    }
    function move(e) {
      if (!live) { return; }
      e.preventDefault();
      var p = pt(svg, e);
      var nx = ox + (p.x - sx), ny = oy + (p.y - sy);
      if (opts.clamp) {
        nx = Math.max(opts.clamp[0], Math.min(opts.clamp[2], nx));
        ny = Math.max(opts.clamp[1], Math.min(opts.clamp[3], ny));
      } else {
        nx = Math.max(-60, Math.min(430, nx));
        ny = Math.max(-60, Math.min(480, ny));
      }
      A.place(el, nx, ny);
      if (opts.onMove) { opts.onMove(nx, ny); }
    }
    function up() {
      if (!live) { return; }
      live = false;
      document.removeEventListener('touchmove', move, { passive: false });
      document.removeEventListener('touchend', up, false);
      document.removeEventListener('touchcancel', up, false);
      document.removeEventListener('mousemove', move, false);
      document.removeEventListener('mouseup', up, false);
      SFX.drop();
      if (opts.onDrop) { opts.onDrop(el.__x, el.__y, { x: ox, y: oy }); }
    }
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('mousedown', down, false);
    return el;
  }

  /* The last animation started on an element owns it. Two ticker jobs writing
     the same transform used to fight, and the loser was whichever finished
     first: BS.nope(el) followed by BS.glide(el, home) -- exactly what Fill It
     does when a piece does not fit -- ended with the wobble's final frame
     snapping the piece back to the invalid drop spot instead of the tray. */
  var animTok = 0;
  function claim(el) { el.__anim = ++animTok; return el.__anim; }

  function glide(el, x, y, ms) {
    var x0 = el.__x || 0, y0 = el.__y || 0, t0 = Date.now();
    var mine = claim(el);
    ms = ms || 260;
    el.__busyUntil = t0 + ms + 40;
    A.tick(function () {
      if (el.__anim !== mine) { return true; }
      var k = Math.min(1, (Date.now() - t0) / ms);
      var e = 1 - Math.pow(1 - k, 3);
      A.place(el, x0 + (x - x0) * e, y0 + (y - y0) * e);
      return k >= 1;
    });
  }

  /* multi-touch hold zones */
  var zones = [], zoneCheck = null;
  function holdZone(el, cx, cy, r, cb) { zones.push({ cx: cx, cy: cy, r: r, on: false, cb: cb }); }
  function setCheck(fn) { zoneCheck = fn; }
  function scanTouches(e) {
    if (!zones.length) { return; }
    var svg = e.currentTarget, list = e.touches || [], i, k, z, p, hit, changed = false;
    for (i = 0; i < zones.length; i++) {
      z = zones[i]; hit = false;
      for (k = 0; k < list.length; k++) {
        p = toLocal(svg, list[k].clientX, list[k].clientY);
        if (Math.sqrt(Math.pow(p.x - z.cx, 2) + Math.pow(p.y - z.cy, 2)) < z.r) { hit = true; }
      }
      if (hit !== z.on) { z.on = hit; changed = true; if (z.cb) { z.cb(hit); } }
    }
    if (changed && zoneCheck) { zoneCheck(); }
  }

  /* ---------- feedback ---------- */
  /* A character's idle bob writes at(g, __home.x, __home.y + sin) every frame,
     and the ticker runs it AFTER any job added later -- so a wobble that only
     touched the transform was overwritten before it ever reached the screen.
     Shake the anchor instead: the bob then carries the wobble for us.
     Snapshot the true home once, so repeat wrong answers cannot walk a
     character up the screen one bob-offset at a time. */
  function wobble(el) {
    if (el.__wobHome) { return; }
    var home = el.__home;
    var hx = home ? home.x : (el.__x || 0);
    var hy = home ? home.y : (el.__y || 0);
    el.__wobHome = { x: hx, y: hy };
    var mine = claim(el), t0 = Date.now();
    A.tick(function () {
      /* a glide or a drag has taken this element over -- let it go, and do NOT
         touch __home on the way out or we would undo the new owner's work */
      if (el.__anim !== mine) { el.__wobHome = null; return true; }
      var k = (Date.now() - t0) / 340;
      if (k >= 1) {
        el.__wobHome = null;
        A.place(el, hx, hy);
        return true;
      }
      var dx = Math.sin(k * 26) * 6 * (1 - k);
      if (home) { home.x = hx + dx; }
      A.at(el, hx + dx, hy);
      return false;
    });
  }

  var NOPES = ['Nope!', 'Nice try!', 'Hmm...', 'Not that!', 'Almost!'];
  function flash(node, word, colour) {
    node.textContent = word;
    node.style.color = colour || '';
    node.className = 'toast';
    void node.offsetWidth;
    node.className = 'toast go';
  }
  function nope(el) {
    if (locked) { return; }
    tries++; SFX.bad();
    if (inPuzzle) { stat(cur).n++; saveStats(); }
    if (el) { wobble(el); }
    flash(toastEl, NOPES[Math.floor(Math.random() * NOPES.length)]);
    if (tries >= 4) { document.getElementById('bulb').className = 'bulb beg'; }
  }

  function confetti() {
    var cols = ['#FFC93C', '#FF8A3D', '#F0466F', '#3FBF7F', '#6EC6E8', '#FFF6E6'], i, b;
    for (i = 0; i < 26; i++) {
      b = document.createElement('div');
      b.className = 'bit' + (i % 3 === 0 ? ' round' : '');
      b.style.left = (Math.random() * 100) + '%';
      b.style.background = cols[i % cols.length];
      var an = 'fall ' + (1.5 + Math.random()) + 's linear ' + (Math.random() * .5) + 's both';
      b.style.webkitAnimation = an; b.style.animation = an;
      document.body.appendChild(b);
      (function (n) { setTimeout(function () { if (n.parentNode) { n.parentNode.removeChild(n); } }, 3200); })(b);
    }
  }

  /* the little celebration above the win text: the chapter's host, hopping */
  function drawWinArt(c) {
    var a = document.getElementById('win-art');
    if (!a) { return; }
    A.clear(a);
    var ch = CHAPTERS[c], i;
    A.S('circle', { cx: 100, cy: 58, r: 54, fill: A.glow(a, ch.c, .55) }, a);
    var pts = [[38, 34, 11], [164, 30, 13], [150, 84, 8], [48, 86, 9]];
    for (i = 0; i < pts.length; i++) { A.star(a, pts[i][0], pts[i][1], pts[i][2], '#FFC93C', 3); }
    var h = A.animal(a, { kind: ch.host, x: 100, y: 44, size: 19, fill: ch.f, mood: 'happy', shadow: false });
    var n = 0;
    function again() { A.hop(h, 9, 620); n++; if (n < 40) { later(again, 1100); } }
    again();
  }

  var WINS = ['Nice!', 'Got it!', 'Clever!', 'Yes!', 'Sharp!', 'Brilliant!', 'Woohoo!'];
  function win() {
    if (locked) { return; }
    locked = true;
    SFX.win(); confetti();
    A.burst(stage, 180, 140, { n: 12, r: 96, ms: 820 });
    A.cheer(stage);
    var L = PUZZLES[cur], c = chapOf(cur), r = chapRange(c);
    var was = isDone(cur);
    markDone(cur);
    var sw = stat(cur), took = tOpen ? (Date.now() - tOpen) : 0;
    sw.w++;
    if (took > 0 && (sw.ms === 0 || took < sw.ms)) { sw.ms = took; }
    flushStats();
    var whole = !was && chapDone(c) === (r[1] - r[0]);
    later(function () {
      document.getElementById('win-word').textContent = WINS[Math.floor(Math.random() * WINS.length)];
      document.getElementById('win-why').textContent = L.why || '';
      var badge = document.getElementById('win-chap');
      badge.textContent = whole ? ('★ All of ' + CHAPTERS[c].n + ' solved! ★') : '';
      badge.style.display = whole ? '' : 'none';
      document.getElementById('next').textContent = (cur + 1 < PUZZLES.length) ? 'Next puzzle' : 'Back to the list';
      document.getElementById('win').className = 'over on';
      drawWinArt(c);
      if (whole) { confetti(); }
    }, 780);
  }

  function chips(list, rightIndex) {
    tray.innerHTML = '';
    /* one long label makes the whole row small, so the buttons always match */
    var wordy = false, w;
    for (w = 0; w < list.length; w++) { if (String(list[w]).length > 4) { wordy = true; } }
    tray.style.gridTemplateColumns = 'repeat(' + Math.min(4, list.length) + ', 1fr)';
    for (var i = 0; i < list.length; i++) {
      (function (i) {
        var b = document.createElement('button');
        b.className = 'chip' + (wordy ? ' wordy' : '');
        b.innerHTML = list[i];
        b.addEventListener('click', function () {
          if (locked) { return; }
          if (i === rightIndex) { win(); }
          else {
            b.className = b.className.replace(' bad', ''); void b.offsetWidth; b.className += ' bad';
            nope(); later(function () { b.className = b.className.replace(' bad', ''); }, 700);
          }
        }, false);
        tray.appendChild(b);
      })(i);
    }
  }

  /* ---------- screens ---------- */
  var SCREENS = ['s-home', 's-grid', 's-play', 's-arcade'];
  function show(id) {
    for (var i = 0; i < SCREENS.length; i++) {
      document.getElementById(SCREENS[i]).className = 'screen' + (SCREENS[i] === id ? ' on' : '');
    }
  }
  function leave() {
    if (inPuzzle) {
      if (!isDone(cur)) { stat(cur).q++; }
      inPuzzle = false;
      flushStats();
    }
    /* Anything still pending from the screen we are leaving is dead from here:
       later() callbacks see a new generation, and input stays locked until the
       next screen opens it again. */
    gen++;
    locked = true;
    if (liveMode && modes[liveMode] && modes[liveMode].stop) { modes[liveMode].stop(); }
    liveMode = null;
    A.stopAll();
    zones = []; zoneCheck = null;
    document.getElementById('win').className = 'over';
    document.getElementById('ar-over').className = 'over';
    document.getElementById('hint').className = '';
  }

  function goHome() {
    leave(); drawMascot(); paintSubs(); show('s-home');
  }

  /* ---------- puzzles ---------- */
  /* Nothing is locked. One puzzle she cannot crack used to hide every puzzle
     after it. The chapters only show roughly how far up the ladder she is. */
  function paintGrid() {
    var box = document.getElementById('nodes');
    box.innerHTML = '';
    var open = firstOpen(), c, i, r, sec, head, grid, done;
    document.getElementById('grid-count').textContent = doneCount() + ' / ' + PUZZLES.length + ' solved';
    for (c = 0; c < CHAPTERS.length; c++) {
      r = chapRange(c);
      if (r[0] >= r[1]) { continue; }
      done = chapDone(c);
      sec = document.createElement('div');
      sec.className = 'chap' + (done === r[1] - r[0] ? ' all' : '');
      head = document.createElement('div');
      head.className = 'chap-h';
      head.style.background = CHAPTERS[c].c;
      head.style.boxShadow = '0 4px 0 ' + CHAPTERS[c].s;
      head.innerHTML = '<svg class="chap-i" viewBox="0 0 48 48" id="chap-i' + c + '"></svg>' +
        '<span class="chap-n">' + CHAPTERS[c].n + '</span>' +
        '<span class="chap-c">' + (done === r[1] - r[0] ? '★ ' : '') + done + ' / ' + (r[1] - r[0]) + '</span>';
      sec.appendChild(head);
      grid = document.createElement('div');
      grid.className = 'grid';
      for (i = r[0]; i < r[1]; i++) {
        (function (i) {
          var b = document.createElement('button');
          b.className = 'node' + (isDone(i) ? ' done' : (i === open ? ' next' : ''));
          b.innerHTML = (i + 1) + (isDone(i) ? '<span class="tick">★</span>' : '');
          b.addEventListener('click', function () { SFX.tap(); openPuzzle(i); }, false);
          grid.appendChild(b);
        })(i);
      }
      sec.appendChild(grid);
      box.appendChild(sec);
      A.animal(document.getElementById('chap-i' + c), { kind: CHAPTERS[c].host, x: 24, y: 21, size: 12.5,
        fill: CHAPTERS[c].f, shadow: false, bob: false, blink: false });
    }
    /* bring the next unsolved puzzle into view */
    if (open > 0) {
      var kids = box.children, target = kids[Math.min(kids.length - 1, chapOf(open))];
      if (target) { box.scrollTop = Math.max(0, target.offsetTop - box.offsetTop - 4); }
    } else { box.scrollTop = 0; }
  }
  function goGrid() { leave(); show('s-grid'); paintGrid(); }

  function openPuzzle(i) {
    if (i >= PUZZLES.length) { goGrid(); return; }
    leave();
    cur = i; tries = 0; locked = false;
    inPuzzle = true; tOpen = Date.now();
    stat(i).o++; saveStats();
    document.getElementById('bulb').className = 'bulb';
    document.getElementById('lvnum').textContent = CHAPTERS[chapOf(i)].n + ' · ' + (i + 1);
    A.clear(stage); tray.innerHTML = '';
    var L = PUZZLES[i];
    askEl.textContent = L.ask;
    L.build(stage);
    A.lift(stage);
    show('s-play');
  }

  /* ---------- arcade ---------- */
  /* def: { name, shelf:'quick'|'memory'|'think', color, shade, blurb,
            best:[storageKey, one, many] or sub:function(load){...},
            keys:[storage keys to clear on Start over],
            icon:function(svg 84x42){...}, start:function(api){...}, stop } */
  function registerMode(key, def) {
    if (!modes[key]) { modeOrder.push(key); }
    modes[key] = def;
  }

  var API = {
    arena: null,
    title: function (s) { document.getElementById('ar-title').textContent = s; },
    score: function (s) { document.getElementById('ar-score').innerHTML = s; },
    bar: function (frac, warn) {
      document.getElementById('ar-fill').style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
      document.getElementById('ar-bar').className = 'bar' + (warn ? ' warn' : '');
    },
    showBar: function (on) { document.getElementById('ar-bar').style.visibility = on ? '' : 'hidden'; },
    foot: function (html) { document.getElementById('ar-foot').innerHTML = html; return document.getElementById('ar-foot'); },
    toast: function (word, colour) { flash(document.getElementById('ar-toast'), word, colour); },
    over: function (word, why, againLabel) {
      document.getElementById('ao-word').textContent = word;
      document.getElementById('ao-why').textContent = why;
      document.getElementById('ao-again').textContent = againLabel || 'Play again';
      document.getElementById('ar-over').className = 'over on';
    },
    hideOver: function () { document.getElementById('ar-over').className = 'over'; },
    confetti: confetti, later: later,
    load: load, save: save, SFX: SFX
  };

  function startMode(key) {
    leave();
    liveMode = key;
    locked = false;
    A.clear(arena);
    API.showBar(true);
    API.foot('');
    API.score('');
    show('s-arcade');
    modes[key].start(API);
  }

  /* ---------- home ---------- */
  var SHELVES = [
    { k: 'quick',  n: 'Quick!' },
    { k: 'memory', n: 'Remember!' },
    { k: 'think',  n: 'Figure it out' }
  ];
  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
    'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
    'Twenty-one', 'Twenty-two', 'Twenty-three', 'Twenty-four', 'Twenty-five'];

  function cardFor(key) {
    var d = modes[key], b = document.createElement('button');
    b.className = 'card';
    b.setAttribute('data-go', key);
    b.style.background = d.color || '#FFC93C';
    b.style.boxShadow = '0 5px 0 ' + (d.shade || '#C99A16');
    b.innerHTML = '<span class="cart"><svg viewBox="0 0 84 42" id="ic-' + key + '"></svg></span>' +
      '<span class="cnm">' + (d.name || key) + '</span>' +
      '<span class="csb" id="sub-' + key + '"></span>';
    b.addEventListener('click', function () { ac(); SFX.tap(); startMode(key); }, false);
    return b;
  }

  /* Built once from whatever registered itself. Icons are drawn once and are
     static, so coming back to the home screen redraws nothing but the mascot. */
  function buildHome() {
    var box = document.getElementById('cards'), s, i, list, h, row, key;
    var hero = document.getElementById('hero');
    hero.addEventListener('click', function () { ac(); SFX.tap(); goGrid(); }, false);
    for (s = 0; s < SHELVES.length; s++) {
      list = [];
      for (i = 0; i < modeOrder.length; i++) {
        if ((modes[modeOrder[i]].shelf || 'think') === SHELVES[s].k) { list.push(modeOrder[i]); }
      }
      if (!list.length) { continue; }
      h = document.createElement('div');
      h.className = 'shelf';
      h.textContent = SHELVES[s].n;
      box.appendChild(h);
      row = document.createElement('div');
      row.className = 'shelf-grid';
      for (i = 0; i < list.length; i++) {
        key = list[i];
        var b = cardFor(key);
        if (list.length % 2 === 1 && i === list.length - 1) { b.className += ' wide'; }
        row.appendChild(b);
      }
      box.appendChild(row);
      for (i = 0; i < list.length; i++) {
        if (modes[list[i]].icon) { modes[list[i]].icon(document.getElementById('ic-' + list[i])); }
      }
    }
    var foot = document.getElementById('home-foot');
    box.appendChild(foot);
    var n = modeOrder.length + 1;
    document.getElementById('tag').textContent = (WORDS[n] || n) + ' games. Most of them have a catch.';
  }

  /* two friends peeking over the title, redrawn (and re-animated) on each visit */
  function drawMascot() {
    var a = document.getElementById('mascot');
    if (!a) { return; }
    A.clear(a);
    A.star(a, 26, 20, 7, '#FFC93C', 2.5);
    A.star(a, 300, 16, 9, '#FFF6E6', 2.5);
    A.star(a, 318, 44, 5, '#FF8A3D', 2);
    A.star(a, 12, 46, 4.5, '#6EC6E8', 2);
    A.animal(a, { kind: 'cat', x: 62, y: 36, size: 15, fill: '#FF8A3D', look: .7, shadow: false });
    A.animal(a, { kind: 'frog', x: 268, y: 40, size: 14, fill: '#5FD08A', look: -.7, shadow: false });

    var c = chapOf(Math.max(0, firstOpen())), ch = CHAPTERS[c];
    var h = document.getElementById('ic-tricks');
    A.clear(h);
    A.S('circle', { cx: 48, cy: 40, r: 40, fill: A.glow(h, '#FFF6E6', .55) }, h);
    A.animal(h, { kind: ch.host, x: 46, y: 34, size: 17, fill: ch.f, mood: 'wow', shadow: false });
    A.star(h, 80, 16, 9, '#FFF6E6');
    A.txt('?', { x: 13, y: 34, 'font-size': 30, fill: '#241534', opacity: '.4' }, h);
  }

  function best(key, one, many, dflt) {
    var v = load(key, 0);
    return v ? ('Best ' + v + ' ' + (v === 1 ? one : many)) : dflt;
  }

  function paintSubs() {
    function set(id, v) { var e = document.getElementById(id); if (e) { e.textContent = v; } }
    var nd = doneCount(), i, d, open = firstOpen();
    set('sub-tricks', nd ? (nd + ' of ' + PUZZLES.length + ' solved') : (PUZZLES.length + ' puzzles, each with a catch'));
    set('hero-chap', open < 0 ? 'All solved!' : CHAPTERS[chapOf(open)].n);
    var fill = document.getElementById('hero-fill');
    if (fill) { fill.style.width = (PUZZLES.length ? Math.round(nd / PUZZLES.length * 100) : 0) + '%'; }
    for (i = 0; i < modeOrder.length; i++) {
      d = modes[modeOrder[i]];
      if (d.sub) { set('sub-' + modeOrder[i], d.sub(load)); }
      else if (d.best) { set('sub-' + modeOrder[i], best(d.best[0], d.best[1], d.best[2], d.blurb || '')); }
      else { set('sub-' + modeOrder[i], d.blurb || ''); }
    }
  }

  /* ---------- the play log, for a grown-up ----------
     Hold the title on the home screen for three seconds. Deliberately plain:
     if she ever finds it, it should look like a boring wall of numbers. */
  function ms2s(m) { return m ? (Math.round(m / 100) / 10) + 's' : '–'; }
  function effort(s) { return (s.n + s.h * 3 + s.t * 6 + s.q * 4) / Math.max(1, s.o); }

  function paintStats() {
    var body = document.getElementById('stats-body');
    var rows = [], i, s, k;
    for (i = 0; i < PUZZLES.length; i++) {
      s = stats[pid(PUZZLES[i])];
      if (s && s.o) { rows.push({ i: i, s: s }); }
    }

    var head = '<p class="st-sum">' + doneCount() + ' of ' + PUZZLES.length +
      ' puzzles solved. ' + rows.length + ' opened.</p>';

    /* where she is actually struggling: unsolved, ranked by effort spent */
    var hard = [];
    for (i = 0; i < rows.length; i++) {
      s = rows[i].s;
      if (isDone(rows[i].i)) { continue; }
      hard.push({ i: rows[i].i, w: s.n + s.h * 3 + s.t * 6 + s.q * 4 });
    }
    hard.sort(function (a, b) { return b.w - a.w; });
    if (hard.length) {
      head += '<p class="st-sum">Stuck on: ';
      for (i = 0; i < Math.min(5, hard.length); i++) {
        head += (i ? ', ' : '') + '#' + (hard[i].i + 1);
      }
      head += '</p>';
    }

    /* Is the ladder in the right order FOR HER? A puzzle that cost far more
       effort than the ones after it is sitting too early. This is the evidence
       to re-order by: change that puzzle's `d` and nothing else. */
    var early = [];
    for (i = 0; i < rows.length; i++) {
      var later5 = [], j;
      for (j = i + 1; j < rows.length && later5.length < 5; j++) { later5.push(effort(rows[j].s)); }
      if (later5.length < 3) { continue; }
      later5.sort(function (a, b) { return a - b; });
      var med = later5[Math.floor(later5.length / 2)], mine = effort(rows[i].s);
      if (mine >= 3 && mine > med * 2.5) { early.push({ i: rows[i].i, w: mine }); }
    }
    early.sort(function (a, b) { return b.w - a.w; });
    if (early.length) {
      head += '<p class="st-sum">Harder than their place: ';
      for (i = 0; i < Math.min(6, early.length); i++) { head += (i ? ', ' : '') + '#' + (early[i].i + 1); }
      head += '</p>';
    }

    if (!rows.length) {
      body.innerHTML = head + '<p class="st-sum">Nothing played yet.</p>';
      return;
    }

    var t = '<table class="st"><tr><th>#</th><th>open</th><th>wrong</th>' +
            '<th>hint</th><th>told</th><th>left</th><th>best</th></tr>';
    for (i = 0; i < rows.length; i++) {
      s = rows[i].s; k = rows[i].i;
      t += '<tr class="' + (isDone(k) ? 'ok' : 'no') + '">' +
           '<td>' + (k + 1) + (isDone(k) ? '✓' : '') + '</td>' +
           '<td>' + s.o + '</td><td>' + s.n + '</td><td>' + s.h + '</td>' +
           '<td>' + s.t + '</td><td>' + s.q + '</td><td>' + ms2s(s.ms) + '</td></tr>' +
           '<tr class="q"><td colspan="7">' + String(PUZZLES[k].ask).slice(0, 46) + '</td></tr>';
    }
    body.innerHTML = head + t + '</table>';
  }

  /* ---------- old saves ---------- */
  function migrate() {
    var mk, oi;
    doneMap = load('bs.doneIds', null);
    /* The v6 and v7 save formats (bs.solved, bs.done) are no longer read:
       a phone that has run v12 has already had them turned into bs.doneIds. */
    if (!doneMap || typeof doneMap !== 'object') { doneMap = {}; }

    stats = load('bs.log', null);
    if (!stats || typeof stats !== 'object') {
      stats = {};
      var os = load('bs.stats', null);
      if (os && typeof os === 'object') {
        for (mk in os) {
          if (!os.hasOwnProperty(mk)) { continue; }
          oi = parseInt(mk, 10);
          if (!isNaN(oi) && LEGACY[oi] && os[mk] && typeof os[mk] === 'object') { stats[LEGACY[oi]] = os[mk]; }
        }
        save('bs.log', stats);
        try { localStorage.removeItem('bs.stats'); } catch (e) {}
      }
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    stage = document.getElementById('stage');
    arena = document.getElementById('arena');
    API.arena = arena;
    tray  = document.getElementById('tray');
    askEl = document.getElementById('ask');
    toastEl = document.getElementById('toast');

    sortPuzzles();
    muted = load('bs.muted', false);
    migrate();

    /* Added to the home screen, the page IS the screen, and innerHeight has
       been seen to come up short there (a dead band above the home bar on a
       notched phone). In a browser tab innerHeight is still the only number
       that follows the toolbars.
       --appw keeps the play area narrow enough that a 360 x 420 arena plus its
       header fits the height, so a tablet or a desktop window shows a phone-
       sized game in the middle instead of one too tall for the screen. */
    function fit() {
      var st = window.navigator.standalone === true;
      document.body.style.height = st ? '100%' : (window.innerHeight + 'px');
      var h = st ? document.documentElement.clientHeight : window.innerHeight;
      /* a notch and a home bar take height away too: read what the CSS added */
      try {
        var cs = window.getComputedStyle(document.querySelector('.screen'));
        var ins = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) - 28;
        if (ins > 0 && ins < 200) { h -= ins; }
      } catch (e2) {}
      var w = Math.max(280, Math.min(520, Math.floor((h - 100) / 1.1667)));
      try { document.documentElement.style.setProperty('--appw', w + 'px'); } catch (e) {}
    }
    fit();
    window.addEventListener('resize', fit, false);
    window.addEventListener('orientationchange', function () { setTimeout(fit, 320); }, false);
    window.addEventListener('pagehide', flushStats, false);

    var i, svgs = [stage, arena];
    for (i = 0; i < svgs.length; i++) {
      svgs[i].addEventListener('touchstart', scanTouches, { passive: false });
      svgs[i].addEventListener('touchmove', scanTouches, { passive: false });
      svgs[i].addEventListener('touchend', scanTouches, false);
      svgs[i].addEventListener('touchcancel', scanTouches, false);
    }

    buildHome();

    document.getElementById('grid-back').addEventListener('click', goHome, false);
    document.getElementById('ar-back').addEventListener('click', goHome, false);
    document.getElementById('ao-home').addEventListener('click', goHome, false);
    document.getElementById('quit').addEventListener('click', goGrid, false);
    document.getElementById('win-menu').addEventListener('click', goGrid, false);
    document.getElementById('next').addEventListener('click', function () { SFX.tap(); openPuzzle(cur + 1); }, false);
    document.getElementById('ao-again').addEventListener('click', function () {
      SFX.tap(); var k = liveMode; if (k) { startMode(k); }
    }, false);

    document.getElementById('bulb').addEventListener('click', function () {
      SFX.tap();
      if (inPuzzle) { stat(cur).h++; saveStats(); }
      document.getElementById('hint-txt').textContent = PUZZLES[cur].hint;
      document.getElementById('hint-more').style.display = '';
      document.getElementById('hint').className = 'on';
    }, false);
    document.getElementById('hint-close').addEventListener('click', function () {
      document.getElementById('hint').className = '';
    }, false);
    document.getElementById('hint-more').addEventListener('click', function () {
      if (inPuzzle) { stat(cur).t++; saveStats(); }
      document.getElementById('hint-txt').textContent = PUZZLES[cur].tell;
      document.getElementById('hint-more').style.display = 'none';
    }, false);

    function toggleMute() {
      muted = !muted; save('bs.muted', muted);
      document.getElementById('mute-1').textContent = muted ? 'Sound off' : 'Sound on';
      document.getElementById('mute-2').innerHTML = muted ? '&#9834;̸' : '&#9834;';
      if (!muted) { ac(); SFX.tap(); }
    }
    document.getElementById('mute-1').addEventListener('click', toggleMute, false);
    document.getElementById('mute-2').addEventListener('click', toggleMute, false);
    document.getElementById('mute-1').textContent = muted ? 'Sound off' : 'Sound on';
    if (muted) { document.getElementById('mute-2').innerHTML = '&#9834;̸'; }

    document.getElementById('wipe').addEventListener('click', function () {
      doneMap = {}; stats = {};
      if (statTimer) { clearTimeout(statTimer); statTimer = null; }
      var keys = ['bs.solved', 'bs.done', 'bs.doneIds', 'bs.stats', 'bs.log'], w, k, list;
      for (w = 0; w < modeOrder.length; w++) {
        list = modes[modeOrder[w]].keys || [];
        for (k = 0; k < list.length; k++) { keys.push(list[k]); }
      }
      for (w = 0; w < keys.length; w++) { try { localStorage.removeItem(keys[w]); } catch (e) {} }
      SFX.tap(); paintSubs(); drawMascot();
      var wb = document.getElementById('wipe');
      wb.textContent = 'Cleared'; setTimeout(function () { wb.textContent = 'Start over'; }, 1200);
    }, false);

    /* hold the title for three seconds -> the play log */
    var logo = document.getElementById('logo'), holdT = null;
    function holdGo() {
      holdT = setTimeout(function () {
        holdT = null;
        paintStats();
        document.getElementById('stats').className = 'sheet on';
      }, 3000);
    }
    function holdStop() { if (holdT) { clearTimeout(holdT); holdT = null; } }
    if (logo) {
      logo.addEventListener('touchstart', holdGo, false);
      logo.addEventListener('touchend', holdStop, false);
      logo.addEventListener('touchmove', holdStop, false);
      logo.addEventListener('touchcancel', holdStop, false);
      logo.addEventListener('mousedown', holdGo, false);
      logo.addEventListener('mouseup', holdStop, false);
      logo.addEventListener('mouseleave', holdStop, false);
    }
    document.getElementById('stats-close').addEventListener('click', function () {
      document.getElementById('stats').className = 'sheet';
    }, false);
    document.getElementById('stats-clear').addEventListener('click', function () {
      stats = {}; flushStats(); paintStats();
    }, false);

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, false);

    drawMascot(); paintSubs();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      }, false);
    }
  }

  return {
    boot: boot, registerMode: registerMode, addPuzzles: addPuzzles,
    tap: tap, drag: drag, glide: glide, holdZone: holdZone, setCheck: setCheck,
    win: win, nope: nope, chips: chips, wobble: wobble, confetti: confetti, later: later,
    SFX: SFX, load: load, save: save, best: best,
    chapters: CHAPTERS, chapOf: chapOf, pid: pid,
    lock: function (v) { locked = v; }, isLocked: function () { return locked; }
  };
})();
