/* ==========================================================
   Brain Snacks — engine
   Screens, routing, input, sound. Drawing lives in art.js.
   Safari 12 safe throughout.
   ========================================================== */

var BS = (function () {
  'use strict';

  var A = ART;
  var stage, arena, tray, askEl, toastEl;
  var cur = 0, tries = 0, locked = false, muted = false;
  var modes = {}, liveMode = null;

  /* ---------- storage ---------- */
  function load(k, d) {
    try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* ---------- which puzzles are solved ----------
     Every puzzle is open, so "solved" cannot be a single high-water number any
     more: she can beat 43 while 37 is still unsolved. Keep a set instead. */
  var doneMap = {};

  /* Progress is keyed by a hash of the question text, NOT by array position.
     Inserting four ramp puzzles at 36 shifted every index after it, and an
     index-keyed save would have silently re-pointed her solved puzzles at the
     wrong ones. Ids survive any insert or reorder. */
  function pid(p) {
    if (p.__id) { return p.__id; }
    var h = 5381, t = p.ask, i;
    for (i = 0; i < t.length; i++) { h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; }
    p.__id = h.toString(36);
    return p.__id;
  }
  function isDone(i) { return PUZZLES[i] ? doneMap[pid(PUZZLES[i])] === 1 : false; }
  function markDone(i) {
    if (!PUZZLES[i]) { return; }
    var k = pid(PUZZLES[i]);
    if (doneMap[k] !== 1) { doneMap[k] = 1; save('bs.doneIds', doneMap); }
  }
  function doneCount() {
    var n = 0, k;
    for (k in doneMap) { if (doneMap.hasOwnProperty(k) && doneMap[k] === 1) { n++; } }
    return n;
  }
  function firstOpen() {
    for (var i = 0; i < PUZZLES.length; i++) { if (!isDone(i)) { return i; } }
    return -1;
  }

  /* ---------- play log ----------
     Local only. Never sent anywhere, never shown to her. It exists to answer
     one question: which puzzles does she come back to, and which does she put
     down. Read it by holding the title on the home screen for three seconds.
       o opens  w wins  n wrong taps  h hint taps  t told  q left unsolved
       ms fastest solve */
  var stats = {}, tOpen = 0, inPuzzle = false;
  function stat(i) {
    var k = String(i);
    if (!stats[k]) { stats[k] = { o: 0, w: 0, n: 0, h: 0, t: 0, q: 0, ms: 0 }; }
    return stats[k];
  }
  function saveStats() { save('bs.stats', stats); }

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
     to about 300ms later, so both listeners would run the handler twice. The
     old guard was a flat 280ms lockout on the element, which killed the second
     tap of a genuine double press: on the bee puzzle you press the same arrow
     twice in a row and only one arrow appeared. Suppress the *synthetic mouse
     event* specifically instead, and keep only a very short guard against a
     true double-fire of the same event type. */
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
    for (i = 0; i < 30; i++) {
      b = document.createElement('div');
      b.className = 'bit';
      b.style.left = (Math.random() * 100) + '%';
      b.style.background = cols[i % cols.length];
      var an = 'fall ' + (1.5 + Math.random()) + 's linear ' + (Math.random() * .5) + 's both';
      b.style.webkitAnimation = an; b.style.animation = an;
      document.body.appendChild(b);
      (function (n) { setTimeout(function () { if (n.parentNode) { n.parentNode.removeChild(n); } }, 3200); })(b);
    }
  }

  var WINS = ['Nice!', 'Got it!', 'Clever!', 'Yes!', 'Sharp!'];
  function win() {
    if (locked) { return; }
    locked = true;
    SFX.win(); confetti();
    var L = PUZZLES[cur];
    markDone(cur);
    var sw = stat(cur), took = tOpen ? (Date.now() - tOpen) : 0;
    sw.w++;
    if (took > 0 && (sw.ms === 0 || took < sw.ms)) { sw.ms = took; }
    saveStats();
    setTimeout(function () {
      document.getElementById('win-word').textContent = WINS[Math.floor(Math.random() * WINS.length)];
      document.getElementById('win-why').textContent = L.why || '';
      document.getElementById('next').textContent = (cur + 1 < PUZZLES.length) ? 'Next puzzle' : 'Back to the list';
      document.getElementById('win').className = 'over on';
    }, 620);
  }

  function chips(list, rightIndex) {
    tray.innerHTML = '';
    tray.style.gridTemplateColumns = 'repeat(' + Math.min(4, list.length) + ', 1fr)';
    for (var i = 0; i < list.length; i++) {
      (function (i) {
        var b = document.createElement('button');
        b.className = 'chip'; b.innerHTML = list[i];
        b.addEventListener('click', function () {
          if (locked) { return; }
          if (i === rightIndex) { win(); }
          else {
            b.className = 'chip'; void b.offsetWidth; b.className = 'chip bad';
            nope(); setTimeout(function () { b.className = 'chip'; }, 700);
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
      if (!isDone(cur)) { stat(cur).q++; saveStats(); }
      inPuzzle = false;
    }
    /* Several puzzles finish on a setTimeout (the jugs win 400ms after the last
       pour, the river 730ms after the last crossing). Leaving inside that window
       used to pop the win overlay over whatever screen came next, and mark the
       WRONG puzzle solved. openPuzzle() clears this again. */
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
    leave(); drawHomeArt(); paintSubs(); show('s-home');
  }

  /* ---------- puzzles ---------- */
  /* Nothing is locked. One puzzle she cannot crack used to hide every puzzle
     after it, and the hard batch is not in difficulty order anyway. */
  function paintGrid() {
    var box = document.getElementById('nodes');
    box.innerHTML = '';
    var open = firstOpen();
    document.getElementById('grid-count').textContent = doneCount() + ' / ' + PUZZLES.length + ' solved';
    for (var i = 0; i < PUZZLES.length; i++) {
      (function (i) {
        var b = document.createElement('button');
        b.className = 'node' + (isDone(i) ? ' done' : (i === open ? ' next' : ''));
        b.innerHTML = (i + 1) + (isDone(i) ? '<span class="tick">&#10003;</span>' : '');
        b.addEventListener('click', function () { SFX.tap(); openPuzzle(i); }, false);
        box.appendChild(b);
      })(i);
    }
  }
  function goGrid() { leave(); paintGrid(); show('s-grid'); }

  function openPuzzle(i) {
    if (i >= PUZZLES.length) { goGrid(); return; }
    leave();
    cur = i; tries = 0; locked = false;
    inPuzzle = true; tOpen = Date.now();
    stat(i).o++; saveStats();
    document.getElementById('bulb').className = 'bulb';
    document.getElementById('lvnum').textContent = 'Puzzle ' + (i + 1) + ' of ' + PUZZLES.length;
    A.clear(stage); tray.innerHTML = '';
    var L = PUZZLES[i];
    askEl.textContent = L.ask;
    L.build(stage);
    A.lift(stage);
    show('s-play');
  }

  /* ---------- arcade ---------- */
  function registerMode(key, def) { modes[key] = def; }

  var API = {
    arena: null,
    title: function (s) { document.getElementById('ar-title').textContent = s; },
    score: function (s) { document.getElementById('ar-score').innerHTML = s; },
    bar: function (frac, warn) {
      document.getElementById('ar-fill').style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
      document.getElementById('ar-bar').className = 'bar' + (warn ? ' warn' : '');
    },
    showBar: function (on) { document.getElementById('ar-bar').style.display = on ? '' : 'none'; },
    foot: function (html) { document.getElementById('ar-foot').innerHTML = html; return document.getElementById('ar-foot'); },
    toast: function (word, colour) { flash(document.getElementById('ar-toast'), word, colour); },
    over: function (word, why, againLabel) {
      document.getElementById('ao-word').textContent = word;
      document.getElementById('ao-why').textContent = why;
      document.getElementById('ao-again').textContent = againLabel || 'Play again';
      document.getElementById('ar-over').className = 'over on';
    },
    hideOver: function () { document.getElementById('ar-over').className = 'over'; },
    confetti: confetti,
    load: load, save: save, SFX: SFX
  };

  function startMode(key) {
    leave();
    liveMode = key;
    locked = false;
    A.clear(arena);
    API.showBar(true);
    API.foot('');
    show('s-arcade');
    modes[key].start(API);
  }

  /* ---------- home art ---------- */
  function drawHomeArt() {
    var a, g2, i;

    a = document.getElementById('ic-tricks'); A.clear(a);
    A.critter(a, { x: 46, y: 26, size: 15, fill: '#FF8A3D', ears: 'round', mood: 'wow', shadow: false });
    A.star(a, 68, 9, 8, '#FFF6E6');
    A.txt('?', { x: 20, y: 30, 'font-size': 24, fill: '#241534', opacity: '.45' }, a);

    a = document.getElementById('ic-pairs'); A.clear(a);
    for (i = 0; i < 2; i++) {
      g2 = A.G(a, 30 + i * 26, 24);
      g2.setAttribute('transform', 'translate(' + (30 + i * 26) + ',24) rotate(' + (i ? 10 : -10) + ')');
      A.ink(A.S('rect', { x: -15, y: -19, width: 30, height: 38, rx: 6, fill: '#FFF6E6' }, g2), 3);
      A.critter(g2, { x: 0, y: 2, size: 10, fill: '#F0466F', ears: 'cat', shadow: false, bob: false });
    }

    a = document.getElementById('ic-odd'); A.clear(a);
    A.critter(a, { x: 24, y: 13, size: 9, fill: '#FFF6E6', ears: 'round', shadow: false, bob: false });
    A.critter(a, { x: 60, y: 13, size: 9, fill: '#FFF6E6', ears: 'round', shadow: false, bob: false });
    A.critter(a, { x: 24, y: 35, size: 9, fill: '#FFF6E6', ears: 'round', shadow: false, bob: false });
    A.critter(a, { x: 60, y: 35, size: 9, fill: '#3FBF7F', ears: 'round', mood: 'wow', shadow: false });

    a = document.getElementById('ic-echo'); A.clear(a);
    var ec = ['#F0466F', '#6EC6E8', '#FFC93C', '#FFF6E6'];
    for (i = 0; i < 4; i++) {
      var lit = (i === 1);
      A.ink(A.S('rect', { x: 22 + (i % 2) * 22, y: 4 + Math.floor(i / 2) * 21, width: 19, height: 18, rx: 5,
        fill: lit ? ec[i] : A.tint(ec[i], -46) }, a), 3);
      if (lit) {
        A.S('rect', { x: 20 + (i % 2) * 22, y: 2 + Math.floor(i / 2) * 21, width: 23, height: 22, rx: 7,
          fill: ec[i], opacity: '.4' }, a);
        A.S('rect', { x: 26 + (i % 2) * 22, y: 8 + Math.floor(i / 2) * 21, width: 7, height: 4, rx: 2,
          fill: '#FFFFFF', opacity: '.5' }, a);
      }
    }

    a = document.getElementById('ic-spot'); A.clear(a);
    A.ink(A.S('rect', { x: 8, y: 4, width: 30, height: 38, rx: 6, fill: '#FFF6E6' }, a), 3);
    A.ink(A.S('rect', { x: 46, y: 4, width: 30, height: 38, rx: 6, fill: '#FFF6E6' }, a), 3);
    A.critter(a, { x: 23, y: 21, size: 10, fill: '#6EC6E8', ears: 'cat', shadow: false, bob: false });
    A.critter(a, { x: 61, y: 21, size: 10, fill: '#FFC93C', ears: 'cat', shadow: false, bob: false });

    a = document.getElementById('ic-slide'); A.clear(a);
    var sc = ['#FF8A3D', '#6EC6E8', '#3FBF7F', '#FFC93C', '#F0466F'];
    A.S('rect', { x: 19, y: 6, width: 47, height: 32, rx: 6, fill: '#241534', opacity: '.16' }, a);
    for (i = 0; i < 5; i++) {
      var tx = 21 + (i % 3) * 15, ty = 8 + Math.floor(i / 3) * 15;
      A.ink(A.S('rect', { x: tx, y: ty, width: 13, height: 13, rx: 3.5,
        fill: A.bodyFill(a, sc[i]) }, a), 2.6);
      A.S('rect', { x: tx + 2.5, y: ty + 2.5, width: 5, height: 2.5, rx: 1.2, fill: '#FFFFFF', opacity: '.35' }, a);
    }
    A.S('path', { d: 'M56,28 l7,0 M60,25 l4,3 l-4,3', fill: 'none', stroke: '#241534',
      'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: '.5' }, a);

    a = document.getElementById('ic-snap'); A.clear(a);
    for (i = 0; i < 6; i++) {
      var lit2 = (i === 1 || i === 4);
      A.ink(A.S('rect', { x: 21 + (i % 3) * 15, y: 6 + Math.floor(i / 3) * 15,
        width: 13, height: 13, rx: 3.5, fill: lit2 ? '#FFF6E6' : '#241534' }, a), 2.4);
      if (lit2) { A.S('circle', { cx: 27.5 + (i % 3) * 15, cy: 12.5 + Math.floor(i / 3) * 15, r: 3.4, fill: '#F0466F' }, a); }
    }

    a = document.getElementById('ic-trail'); A.clear(a);
    var tp = [[24, 30], [40, 10], [60, 26]];
    for (i = 0; i < 2; i++) {
      A.ink(A.S('line', { x1: tp[i][0], y1: tp[i][1], x2: tp[i + 1][0], y2: tp[i + 1][1] }, a), 3)
        .setAttribute('stroke', '#241534');
    }
    var tl = ['1', 'A', '2'];
    for (i = 0; i < 3; i++) {
      A.ink(A.S('circle', { cx: tp[i][0], cy: tp[i][1], r: 9, fill: '#FFF6E6' }, a), 2.6);
      A.txt(tl[i], { x: tp[i][0], y: tp[i][1] + 4, 'font-size': 10, fill: '#241534' }, a);
    }

    a = document.getElementById('ic-wake'); A.clear(a);
    A.critter(a, { x: 30, y: 22, size: 12, fill: '#FFC93C', ears: 'round', shadow: false, bob: false });
    A.critter(a, { x: 58, y: 22, size: 12, fill: '#8C86A8', ears: 'round', mood: 'sleep', shadow: false, bob: false });
    A.S('path', { d: 'M66,10 l6,-5 M72,10 l-6,-5', stroke: '#241534', 'stroke-width': 2.4,
      'stroke-linecap': 'round', fill: 'none', opacity: '.6' }, a);

    a = document.getElementById('ic-sort'); A.clear(a);
    A.ink(A.S('path', { d: 'M16,16 L38,16 L34,36 L20,36 Z', fill: '#FFF6E6' }, a), 2.6);
    A.ink(A.S('path', { d: 'M46,16 L68,16 L64,36 L50,36 Z', fill: '#FFF6E6' }, a), 2.6);
    A.ink(A.S('circle', { cx: 27, cy: 8, r: 6.5, fill: '#F0466F' }, a), 2.4);
    A.ink(A.S('rect', { x: 51, y: 2, width: 12, height: 12, rx: 3, fill: '#6EC6E8' }, a), 2.4);

    a = document.getElementById('ic-maze'); A.clear(a);
    A.ink(A.S('rect', { x: 20, y: 5, width: 44, height: 32, rx: 4, fill: '#4A3372' }, a), 2.6);
    A.S('path', { d: 'M20,15 L44,15 M32,15 L32,27 M44,27 L64,27 M44,5 L44,17',
      stroke: '#241534', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, a);
    A.S('circle', { cx: 26, cy: 10, r: 3.6, fill: '#C9BFD6' }, a);
    A.S('circle', { cx: 58, cy: 33, r: 4, fill: '#FFD84A' }, a);

    a = document.getElementById('ic-untangle'); A.clear(a);
    var up = [[22, 8], [62, 10], [26, 34], [60, 32]];
    var ue = [[0, 3], [1, 2], [0, 1], [2, 3]];
    for (i = 0; i < ue.length; i++) {
      A.ink(A.S('line', { x1: up[ue[i][0]][0], y1: up[ue[i][0]][1],
        x2: up[ue[i][1]][0], y2: up[ue[i][1]][1] }, a), 2.6)
        .setAttribute('stroke', i < 2 ? '#C74C6B' : '#241534');
    }
    for (i = 0; i < 4; i++) { A.ink(A.S('circle', { cx: up[i][0], cy: up[i][1], r: 6, fill: '#FFC93C' }, a), 2.4); }

    a = document.getElementById('ic-which'); A.clear(a);
    for (i = 0; i < 3; i++) {
      var mid = (i === 1), f = mid ? 1 : -1;
      A.ink(A.S('path', { d: 'M-9,-4 L2,-4 L2,-9 L11,0 L2,9 L2,4 L-9,4 Z',
        fill: mid ? '#FFC93C' : '#FFF6E6',
        transform: 'translate(' + (22 + i * 20) + ',21) scale(' + f + ',1)' }, a), 2.4);
    }

    a = document.getElementById('ic-fill'); A.clear(a);
    A.S('rect', { x: 20, y: 5, width: 44, height: 32, rx: 4, fill: '#241534', opacity: '.2' }, a);
    var fp = [[0, 0, '#FF8A3D'], [1, 0, '#FF8A3D'], [2, 0, '#6EC6E8'],
              [0, 1, '#3FBF7F'], [1, 1, '#6EC6E8'], [2, 1, '#6EC6E8']];
    for (i = 0; i < fp.length; i++) {
      A.ink(A.S('rect', { x: 22 + fp[i][0] * 14, y: 7 + fp[i][1] * 14, width: 13, height: 13, rx: 3,
        fill: fp[i][2] }, a), 2.2);
    }

    /* --- v12 games --- */
    a = document.getElementById('ic-cups'); A.clear(a);
    for (i = 0; i < 3; i++) {
      A.ink(A.S('path', { d: 'M' + (14 + i * 22) + ',34 L' + (18 + i * 22) + ',12 L' +
        (34 + i * 22) + ',12 L' + (38 + i * 22) + ',34 Z', fill: '#F0466F' }, a), 2.4);
    }
    A.ink(A.S('circle', { cx: 42, cy: 8, r: 6, fill: '#FFC93C' }, a), 2.2);

    a = document.getElementById('ic-follow'); A.clear(a);
    var fq = [[14, 12, '#FFC93C'], [42, 8, '#8FA8C4'], [66, 18, '#FFC93C'],
              [26, 32, '#8FA8C4'], [56, 34, '#8FA8C4']];
    for (i = 0; i < fq.length; i++) {
      A.ink(A.S('circle', { cx: fq[i][0], cy: fq[i][1], r: 7, fill: fq[i][2] }, a), 2.2);
    }

    a = document.getElementById('ic-howmany'); A.clear(a);
    var hm = [[16, 12], [32, 9], [48, 14], [24, 28], [42, 30], [60, 24]];
    for (i = 0; i < hm.length; i++) {
      A.ink(A.S('circle', { cx: hm[i][0], cy: hm[i][1], r: 6, fill: '#F0466F' }, a), 2.2);
    }
    A.txt('?', { x: 72, y: 30, 'font-size': 22, fill: '#241534', opacity: '.5' }, a);

    a = document.getElementById('ic-pile'); A.clear(a);
    for (i = 0; i < 3; i++) {
      A.ink(A.S('circle', { cx: 14 + (i % 2) * 16, cy: 12 + i * 11, r: 9, fill: '#6EC6E8' }, a), 2.2);
    }
    for (i = 0; i < 5; i++) {
      A.ink(A.S('circle', { cx: 54 + (i % 3) * 11, cy: 11 + Math.floor(i / 3) * 13, r: 5.5,
        fill: '#FFC93C' }, a), 2 );
    }

    a = document.getElementById('ic-colour'); A.clear(a);
    A.ink(A.S('rect', { x: 8, y: 8, width: 68, height: 26, rx: 6, fill: '#FFF6E6' }, a), 2.4);
    A.txt('RED', { x: 42, y: 29, 'font-size': 19, fill: '#6EC6E8' }, a);

    a = document.getElementById('ic-opp'); A.clear(a);
    A.ink(A.S('ellipse', { cx: 22, cy: 30, rx: 15, ry: 6, fill: '#5E4830' }, a), 2.4);
    A.ink(A.S('ellipse', { cx: 62, cy: 30, rx: 15, ry: 6, fill: '#5E4830' }, a), 2.4);
    A.ink(A.S('circle', { cx: 22, cy: 18, r: 8, fill: '#F3E4C6' }, a), 2.4);
    A.ink(A.S('path', { d: 'M40,14 L58,14 M52,9 L58,14 L52,19', fill: 'none' }, a), 3)
      .setAttribute('stroke', '#3FBF7F');
  }

  /* ---------- the play log, for a grown-up ----------
     Hold the title on the home screen for three seconds. Deliberately plain:
     if she ever finds it, it should look like a boring wall of numbers. */
  function ms2s(m) { return m ? (Math.round(m / 100) / 10) + 's' : '\u2013'; }

  function paintStats() {
    var body = document.getElementById('stats-body');
    var rows = [], i, s, k;
    for (i = 0; i < PUZZLES.length; i++) {
      s = stats[String(i)];
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

    if (!rows.length) {
      body.innerHTML = head + '<p class="st-sum">Nothing played yet.</p>';
      return;
    }

    var t = '<table class="st"><tr><th>#</th><th>open</th><th>wrong</th>' +
            '<th>hint</th><th>told</th><th>left</th><th>best</th></tr>';
    for (i = 0; i < rows.length; i++) {
      s = rows[i].s; k = rows[i].i;
      t += '<tr class="' + (isDone(k) ? 'ok' : 'no') + '">' +
           '<td>' + (k + 1) + (isDone(k) ? '\u2713' : '') + '</td>' +
           '<td>' + s.o + '</td><td>' + s.n + '</td><td>' + s.h + '</td>' +
           '<td>' + s.t + '</td><td>' + s.q + '</td><td>' + ms2s(s.ms) + '</td></tr>';
    }
    body.innerHTML = head + t + '</table>';
  }

  function paintSubs() {
    function set(id, v) { var e = document.getElementById(id); if (e) { e.textContent = v; } }
    function num(key, one, many, dflt) {
      var v = load(key, 0);
      return v ? ('Best ' + v + ' ' + (v === 1 ? one : many)) : dflt;
    }
    var nd = doneCount();
    set('sub-tricks', nd ? (nd + ' of ' + PUZZLES.length + ' solved') : (PUZZLES.length + ' puzzles'));
    var bp = load('bs.pairs.medium', null);
    set('sub-pairs', bp ? ('Best ' + bp + ' moves') : 'Match the faces');
    set('sub-odd',   num('bs.oddBest', 'in a row', 'in a row', 'Spot it fast'));
    set('sub-echo',  num('bs.echoBest', 'round', 'rounds', 'Repeat it back'));
    set('sub-spot',  num('bs.spotBest', 'picture', 'pictures', 'Find the changes'));
    var bl = load('bs.slideBest', null);
    set('sub-slide', bl ? ('Best ' + bl + ' moves') : 'Put it in order');
    set('sub-snap',  num('bs.snapBest', 'round', 'rounds', 'Remember where'));
    set('sub-trail', num('bs.trailBest', 'trail', 'trails', '1, A, 2, B...'));
    set('sub-wake',  num('bs.wakeBest', 'right', 'right', "Don't tap sleepers"));
    set('sub-sort',  num('bs.sortBest', 'sorted', 'sorted', 'The rule changes'));
    set('sub-maze',  num('bs.mazeBest', 'maze', 'mazes', 'Find the way out'));
    set('sub-untangle', num('bs.untangleBest', 'board', 'boards', 'No crossed lines'));
    set('sub-which', num('bs.whichBest', 'right', 'right', 'Ignore the others'));
    set('sub-fill',  num('bs.fillBest', 'board', 'boards', 'Cover every square'));
    set('sub-cups',  num('bs.cupsBest', 'found', 'found', 'Where is the ball?'));
    set('sub-follow', num('bs.followBest', 'round', 'rounds', 'Keep your eye on them'));
    set('sub-howmany', num('bs.howmanyBest', 'right', 'right', 'A quick look'));
    set('sub-pile',  num('bs.pileBest', 'right', 'right', 'More, not bigger'));
    set('sub-colour', num('bs.colourBest', 'right', 'right', 'Ignore the word'));
    set('sub-opp',   num('bs.oppBest', 'right', 'right', 'Tap the other one'));
  }

  /* ---------- boot ---------- */
  function boot() {
    stage = document.getElementById('stage');
    arena = document.getElementById('arena');
    API.arena = arena;
    tray  = document.getElementById('tray');
    askEl = document.getElementById('ask');
    toastEl = document.getElementById('toast');

    muted = load('bs.muted', false);
    stats = load('bs.stats', null);
    if (!stats || typeof stats !== 'object') { stats = {}; }

    /* One-off migration to id-keyed progress. v6 stored a high-water count in
       bs.solved; v7 stored an index map in bs.done. Both refer to the 56-puzzle
       order, so old indices are shifted past the four ramp puzzles first. */
    doneMap = load('bs.doneIds', null);
    if (!doneMap || typeof doneMap !== 'object') {
      doneMap = {};
      var old = load('bs.done', null), mk;
      if (!old || typeof old !== 'object') {
        old = {};
        var hw = load('bs.solved', 0);
        if (typeof hw !== 'number' || hw < 0) { hw = 0; }
        if (hw > 56) { hw = 56; }
        for (var mi = 0; mi < hw; mi++) { old[mi] = 1; }
      }
      for (mk in old) {
        if (!old.hasOwnProperty(mk) || old[mk] !== 1) { continue; }
        var oi = parseInt(mk, 10);
        if (isNaN(oi) || oi < 0 || oi > 55) { continue; }
        /* v8: 2 puzzles inserted before old #36, 2 more before old #37 */
        var ni = oi >= 36 ? oi + 4 : (oi >= 35 ? oi + 2 : oi);
        if (PUZZLES[ni]) { doneMap[pid(PUZZLES[ni])] = 1; }
      }
      save('bs.doneIds', doneMap);
    }

    function fit() { document.body.style.height = window.innerHeight + 'px'; }
    fit();
    window.addEventListener('resize', fit, false);
    window.addEventListener('orientationchange', function () { setTimeout(fit, 320); }, false);

    var i, svgs = [stage, arena];
    for (i = 0; i < svgs.length; i++) {
      svgs[i].addEventListener('touchstart', scanTouches, { passive: false });
      svgs[i].addEventListener('touchmove', scanTouches, { passive: false });
      svgs[i].addEventListener('touchend', scanTouches, false);
      svgs[i].addEventListener('touchcancel', scanTouches, false);
    }

    var cards = document.querySelectorAll('.card');
    for (i = 0; i < cards.length; i++) {
      (function (b) {
        b.addEventListener('click', function () {
          ac(); SFX.tap();
          var k = b.getAttribute('data-go');
          if (k === 'tricks') { goGrid(); } else { startMode(k); }
        }, false);
      })(cards[i]);
    }

    document.getElementById('grid-back').addEventListener('click', goHome, false);
    document.getElementById('ar-back').addEventListener('click', goHome, false);
    document.getElementById('ao-home').addEventListener('click', goHome, false);
    document.getElementById('quit').addEventListener('click', goGrid, false);
    document.getElementById('win-menu').addEventListener('click', goGrid, false);
    document.getElementById('next').addEventListener('click', function () { SFX.tap(); openPuzzle(cur + 1); }, false);
    document.getElementById('ao-again').addEventListener('click', function () {
      SFX.tap(); var k = liveMode; startMode(k);
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
      document.getElementById('mute-2').innerHTML = muted ? '&#9834;\u0338' : '&#9834;';
      if (!muted) { ac(); SFX.tap(); }
    }
    document.getElementById('mute-1').addEventListener('click', toggleMute, false);
    document.getElementById('mute-2').addEventListener('click', toggleMute, false);
    document.getElementById('mute-1').textContent = muted ? 'Sound off' : 'Sound on';

    document.getElementById('wipe').addEventListener('click', function () {
      doneMap = {}; stats = {};
      var keys = ['bs.solved', 'bs.done', 'bs.doneIds', 'bs.stats',
                  'bs.oddBest', 'bs.echoBest', 'bs.spotBest', 'bs.slideBest',
                  'bs.snapBest', 'bs.trailBest', 'bs.wakeBest', 'bs.sortBest', 'bs.mazeBest',
                  'bs.untangleBest', 'bs.whichBest', 'bs.fillBest',
                  'bs.pairs.easy', 'bs.pairs.medium', 'bs.pairs.hard', 'bs.pairsBest', 'bs.pairsLevel',
                  'bs.slide.easy', 'bs.slide.medium', 'bs.slide.hard', 'bs.slideLevel'];
      for (var w = 0; w < keys.length; w++) { try { localStorage.removeItem(keys[w]); } catch (e) {} }
      SFX.tap(); paintSubs();
      var w = document.getElementById('wipe');
      w.textContent = 'Cleared'; setTimeout(function () { w.textContent = 'Start over'; }, 1200);
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
      stats = {}; saveStats(); paintStats();
    }, false);

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, false);

    drawHomeArt(); paintSubs();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      }, false);
    }
  }

  return {
    boot: boot, registerMode: registerMode,
    tap: tap, drag: drag, glide: glide, holdZone: holdZone, setCheck: setCheck,
    win: win, nope: nope, chips: chips, wobble: wobble, confetti: confetti,
    SFX: SFX, load: load, save: save,
    lock: function (v) { locked = v; }, isLocked: function () { return locked; }
  };
})();
