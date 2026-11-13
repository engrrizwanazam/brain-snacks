/* ==========================================================
   Brain Snacks — Pairs (memory match)
   Arena is 360 x 420. Endless: the deal is shuffled every time.
   ========================================================== */

(function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt, critter = A.critter;

  var FACES = [
    { f: '#FF8A3D', e: 'round', m: 'happy' },
    { f: '#6EC6E8', e: 'cat',   m: 'happy' },
    { f: '#3FBF7F', e: 'long',  m: 'happy' },
    { f: '#F0466F', e: 'round', m: 'wow' },
    { f: '#FFD84A', e: 'none',  m: 'happy', beak: true },
    { f: '#C9BFD6', e: 'round', m: 'flat' },
    { f: '#B07A4C', e: 'round', m: 'happy', horn: true },
    { f: '#8FA8F0', e: 'long',  m: 'wow' },
    { f: '#FF6F92', e: 'cat',   m: 'happy' },
    { f: '#A9E05F', e: 'round', m: 'happy', horn: true }
  ];

  var SIZES = {
    easy:   { cols: 3, rows: 4, name: 'Easy' },
    medium: { cols: 4, rows: 4, name: 'Medium' },
    hard:   { cols: 4, rows: 5, name: 'Hard' }
  };

  var api, level = 'medium', cards, open1, open2, moves, matched, busy;

  var timers = [];
  function clearTimers() { for (var i = 0; i < timers.length; i++) { clearTimeout(timers[i]); } timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function flipTo(card, showFace, done) {
    var t0 = Date.now(), half = 130, mid = false;
    A.tick(function () {
      var e = Date.now() - t0;
      if (e < half) { A.scaleAt(card, card.__cx, card.__cy, Math.max(.02, 1 - e / half)); return false; }
      if (!mid) {
        mid = true;
        card.__back.setAttribute('opacity', showFace ? '0' : '1');
        card.__face.setAttribute('opacity', showFace ? '1' : '0');
      }
      if (e < half * 2) { A.scaleAt(card, card.__cx, card.__cy, Math.max(.02, (e - half) / half)); return false; }
      A.scaleAt(card, card.__cx, card.__cy, 1);
      if (done) { done(); }
      return true;
    });
  }

  function deal() {
    var cfg = SIZES[level];
    var pairs = (cfg.cols * cfg.rows) / 2;
    var deck = [], i;
    for (i = 0; i < pairs; i++) { deck.push(i); deck.push(i); }
    shuffle(deck);

    A.clear(api.arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(api.arena, '#3B2757', '#2B1B3F') }, api.arena);

    cards = []; open1 = null; open2 = null; moves = 0; matched = 0; busy = false;

    var padX = 14, padY = 12;
    var cw = (360 - padX * 2) / cfg.cols, ch = (420 - padY * 2) / cfg.rows;
    var w = Math.min(cw - 8, 80), h = Math.min(ch - 8, 96);
    var fsize = Math.min(w, h) * 0.30;

    for (i = 0; i < deck.length; i++) {
      (function (i) {
        var col = i % cfg.cols, row = Math.floor(i / cfg.cols);
        var cx = padX + cw * col + cw / 2, cy = padY + ch * row + ch / 2;
        var card = G(api.arena, cx, cy);
        card.__cx = cx; card.__cy = cy; card.__kind = deck[i]; card.__up = false;

        var back = S('g', {}, card);
        ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 12, fill: '#513673' }, back), 4);
        S('rect', { x: -w / 2 + 7, y: -h / 2 + 7, width: w - 14, height: h - 14, rx: 8,
                    fill: 'none', stroke: '#6B4A94', 'stroke-width': 2.5 }, back);
        A.star(back, 0, 0, Math.min(w, h) * 0.21, '#6B4A94', 0);

        var face = S('g', { opacity: '0' }, card);
        ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 12, fill: '#FFF6E6' }, face), 4);
        var spec = FACES[deck[i]];
        critter(face, {
          x: 0, y: fsize * 0.12, size: fsize, fill: spec.f, ears: spec.e, mood: spec.m,
          beak: spec.beak, horn: spec.horn, bob: false, shadow: false
        });

        card.__back = back; card.__face = face;
        cards.push(card);
        BS.tap(card, function () { pick(card); });
      })(i);
    }
    api.score('0 moves');
    api.bar(0);
    paintFoot();
  }

  function pick(card) {
    if (busy || card.__up || card === open1) { return; }
    api.SFX.flip();
    card.__up = true;
    flipTo(card, true);

    if (!open1) { open1 = card; return; }
    open2 = card;
    moves++;
    api.score(moves + (moves === 1 ? ' move' : ' moves'));
    busy = true;

    var a = open1, b = open2;
    open1 = null; open2 = null;

    if (a.__kind === b.__kind) {
      later(function () {
        api.SFX.good();
        markDone(a); markDone(b);
        matched++;
        api.bar(matched / (cards.length / 2));
        busy = false;
        if (matched === cards.length / 2) { finish(); }
      }, 320);
    } else {
      later(function () {
        a.__up = false; b.__up = false;
        flipTo(a, false); flipTo(b, false, function () { busy = false; });
      }, 780);
    }
  }

  function markDone(card) {
    var r = ink(S('rect', { x: -34, y: -42, width: 68, height: 84, rx: 12, fill: 'none' }, card.__face), 4);
    r.setAttribute('stroke', '#3FBF7F');
    var bb = card.__face.firstChild;
    bb.setAttribute('fill', '#E6FBEF');
    r.setAttribute('x', bb.getAttribute('x'));
    r.setAttribute('y', bb.getAttribute('y'));
    r.setAttribute('width', bb.getAttribute('width'));
    r.setAttribute('height', bb.getAttribute('height'));
  }

  function finish() {
    api.SFX.win(); api.confetti();
    var key = 'bs.pairs.' + level;
    var best = api.load(key, null);
    var isBest = (best === null || moves < best);
    if (isBest) { api.save(key, moves); if (level === 'medium') { api.save('bs.pairsBest', moves); } }
    later(function () {
      api.over(
        isBest ? 'New best!' : 'All matched!',
        isBest
          ? ('You cleared ' + SIZES[level].name.toLowerCase() + ' in ' + moves + ' moves. That is your best yet.')
          : ('Cleared in ' + moves + ' moves. Your best on ' + SIZES[level].name.toLowerCase() + ' is ' + best + '.'),
        'Deal again'
      );
    }, 700);
  }

  function paintFoot() {
    var keys = ['easy', 'medium', 'hard'], html = '<div class="picker">', i;
    for (i = 0; i < keys.length; i++) {
      html += '<button data-lv="' + keys[i] + '"' + (keys[i] === level ? ' class="sel"' : '') + '>' + SIZES[keys[i]].name + '</button>';
    }
    var foot = api.foot(html + '</div>');
    var btns = foot.querySelectorAll('button');
    for (i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () {
          level = b.getAttribute('data-lv');
          api.SFX.tap(); api.save('bs.pairsLevel', level);
          clearTimers(); A.stopAll(); deal();
        }, false);
      })(btns[i]);
    }
  }

  BS.registerMode('pairs', {
    name: 'Pairs', shelf: 'memory', color: '#6EC6E8', shade: '#4695B4',
    keys: ['bs.pairs.easy', 'bs.pairs.medium', 'bs.pairs.hard', 'bs.pairsBest', 'bs.pairsLevel'],
    sub: function (load) { var b = load('bs.pairs.medium', null); return b ? ('Best ' + b + ' moves') : 'Match the faces'; },
    icon: function (a) {
      for (var i = 0; i < 2; i++) {
        var g2 = ART.S('g', { transform: 'translate(' + (30 + i * 26) + ',24) rotate(' + (i ? 10 : -10) + ')' }, a);
        ART.ink(ART.S('rect', { x: -15, y: -19, width: 30, height: 38, rx: 6, fill: '#FFF6E6' }, g2), 3);
        ART.critter(g2, { x: 0, y: 2, size: 10, fill: '#F0466F', ears: 'cat', shadow: false, bob: false, blink: false });
      }
    },
    start: function (a) {
      api = a;
      clearTimers();
      level = api.load('bs.pairsLevel', 'medium');
      if (!SIZES[level]) { level = 'medium'; }
      api.title('Pairs');
      api.showBar(true);
      deal();
    },
    stop: function () { clearTimers(); cards = null; }
  });
})();
