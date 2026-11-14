/* ==========================================================
   Brain Snacks — art system v4
   - Real radial-gradient shading, cached per colour per stage.
   - Soft gradient shadows, not flat grey discs.
   - animal(): proper silhouettes. A cat is not a mouse is not an
     elephant. Drawn back-to-front so tails never land on faces.
   - One shared ticker drives every blink, bob and glide.
   Safari 12: SVG transforms are attributes, never CSS.
   ========================================================== */

var ART = (function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#241534';
  var uid = 0;

  function S(tag, a, parent) {
    var e = document.createElementNS(NS, tag);
    if (a) { for (var k in a) { if (a.hasOwnProperty(k)) { e.setAttribute(k, a[k]); } } }
    if (parent) { parent.appendChild(e); }
    return e;
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  function G(parent, x, y) { var g = S('g', {}, parent); at(g, x || 0, y || 0); return g; }
  function at(el, x, y) {
    el.__x = x; el.__y = y;
    el.setAttribute('transform', 'translate(' + r2(x) + ',' + r2(y) + ')');
  }
  function scaleAt(el, x, y, k) {
    el.__x = x; el.__y = y;
    el.setAttribute('transform', 'translate(' + r2(x) + ',' + r2(y) + ') scale(' + r2(k) + ',1)');
  }
  /* Move an element. If it has an idle bob, move its anchor too, otherwise
     the bob will drag it straight back. Always use this, never bare at(). */
  function place(el, x, y) {
    if (el.__home) { el.__home.x = x; el.__home.y = y; }
    at(el, x, y);
  }

  function clear(el) {
    if (el.__gc) { el.__gc = null; }
    if (el.__chars) { el.__chars = null; }
    while (el.firstChild) { el.removeChild(el.firstChild); }
  }
  function ink(el, w) {
    el.setAttribute('stroke', INK);
    el.setAttribute('stroke-width', w === undefined ? 4 : w);
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('stroke-linecap', 'round');
    return el;
  }
  function txt(str, a, parent) {
    a = a || {};
    if (!a['font-family']) { a['font-family'] = '-apple-system, BlinkMacSystemFont, sans-serif'; }
    if (!a['font-weight']) { a['font-weight'] = '800'; }
    if (!a['text-anchor']) { a['text-anchor'] = 'middle'; }
    if (!a.fill) { a.fill = INK; }
    var e = S('text', a, parent); e.textContent = str; return e;
  }

  /* ---------- one ticker for everything ---------- */
  var jobs = [], running = false;
  function tick(fn) { jobs.push(fn); if (!running) { running = true; loop(); } }
  function loop() {
    var t = Date.now(), i;
    for (i = jobs.length - 1; i >= 0; i--) { if (jobs[i](t) === true) { jobs.splice(i, 1); } }
    if (jobs.length) { requestAnimationFrame(loop); } else { running = false; }
  }
  function stopAll() { jobs.length = 0; }
  /* An animation that belongs to a drawing dies with the drawing. The endless
     games clear and redraw the arena every round WITHOUT leaving the screen,
     so stopAll() never runs -- and every blink, bob, sun and cloud from every
     earlier round kept ticking on artwork that was no longer on the page.
     Measured: 195 dead jobs, each run 60 times a second, after 14 rounds of
     Odd One. Checked once every 32 frames, so the check itself is free. */
  function tickFor(el, fn) {
    var n = 0;
    tick(function (t) {
      if ((++n & 31) === 0 && !el.ownerSVGElement) { return true; }
      return fn(t);
    });
  }
  function jobCount() { return jobs.length; }   /* for the test suite */

  /* ---------- colour + paint cache ---------- */
  function tint(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amt)));
    g = Math.max(0, Math.min(255, Math.round(g + amt)));
    b = Math.max(0, Math.min(255, Math.round(b + amt)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function rootOf(el) { return el.ownerSVGElement || el; }
  function defsOf(root) {
    var d = root.querySelector('defs');
    if (!d) { d = S('defs', {}); root.insertBefore(d, root.firstChild); }
    return d;
  }
  function cache(root) { if (!root.__gc) { root.__gc = {}; } return root.__gc; }

  /* rounded shading instead of a hard-edged overlay disc */
  function bodyFill(parent, hex) {
    var root = rootOf(parent), c = cache(root), key = 'b' + hex;
    if (!c[key]) {
      var id = 'bf' + (uid++);
      var rg = S('radialGradient', { id: id, cx: '.36', cy: '.26', r: '.85' }, defsOf(root));
      S('stop', { offset: '0', 'stop-color': tint(hex, 42) }, rg);
      S('stop', { offset: '.5', 'stop-color': hex }, rg);
      S('stop', { offset: '1', 'stop-color': tint(hex, -28) }, rg);
      c[key] = 'url(#' + id + ')';
    }
    return c[key];
  }
  function softDark(parent) {
    var root = rootOf(parent), c = cache(root);
    if (!c.sh) {
      var id = 'sh' + (uid++);
      var rg = S('radialGradient', { id: id }, defsOf(root));
      S('stop', { offset: '0', 'stop-color': INK, 'stop-opacity': '.32' }, rg);
      S('stop', { offset: '.6', 'stop-color': INK, 'stop-opacity': '.15' }, rg);
      S('stop', { offset: '1', 'stop-color': INK, 'stop-opacity': '0' }, rg);
      c.sh = 'url(#' + id + ')';
    }
    return c.sh;
  }
  function glow(parent, col, op) {
    var root = rootOf(parent), c = cache(root), key = 'g' + col + (op || .5);
    if (!c[key]) {
      var id = 'gl' + (uid++);
      var rg = S('radialGradient', { id: id }, defsOf(root));
      S('stop', { offset: '0', 'stop-color': col, 'stop-opacity': op || .5 }, rg);
      S('stop', { offset: '1', 'stop-color': col, 'stop-opacity': '0' }, rg);
      c[key] = 'url(#' + id + ')';
    }
    return c[key];
  }
  function vgrad(parent, c1, c2) {
    var root = rootOf(parent), c = cache(root), key = 'v' + c1 + c2;
    if (!c[key]) {
      var id = 'vg' + (uid++);
      var lg = S('linearGradient', { id: id, x1: '0', y1: '0', x2: '0', y2: '1' }, defsOf(root));
      S('stop', { offset: '0', 'stop-color': c1 }, lg);
      S('stop', { offset: '1', 'stop-color': c2 }, lg);
      c[key] = 'url(#' + id + ')';
    }
    return c[key];
  }
  function shadow(parent, x, y, rx, ry) {
    return S('ellipse', { cx: x, cy: y, rx: rx, ry: ry, fill: softDark(parent) }, parent);
  }

  function star(parent, x, y, r, fill, strokeW) {
    var d = '', i, a, rr;
    for (i = 0; i < 10; i++) {
      a = Math.PI / 5 * i - Math.PI / 2;
      rr = (i % 2 === 0) ? r : r * 0.45;
      d += (i ? 'L' : 'M') + r2(x + Math.cos(a) * rr) + ',' + r2(y + Math.sin(a) * rr);
    }
    var e = S('path', { d: d + 'Z', fill: fill || '#FFC93C' }, parent);
    if (strokeW !== 0) { ink(e, strokeW || 3); }
    return e;
  }

  /* ==========================================================
     FACE PARTS
     ========================================================== */
  function eyes(g, s, o) {
    o = o || {};
    var ex = s * (o.spread === undefined ? .34 : o.spread);
    var ey = s * (o.y === undefined ? -.06 : o.y);
    var er = s * (o.r === undefined ? .195 : o.r);
    var pr = er * .58;
    var lk = (o.look || 0) * er * .3;
    var open = S('g', {}, g), shut = S('g', { opacity: '0' }, g), i, sx;
    for (i = 0; i < 2; i++) {
      sx = i ? ex : -ex;
      ink(S('ellipse', { cx: sx, cy: ey, rx: er, ry: er * 1.08, fill: '#FFFFFF' }, open), Math.max(s < 12 ? 1.1 : 2, s * .062));
      S('circle', { cx: sx + lk, cy: ey + er * .08, r: pr, fill: INK }, open);
      S('circle', { cx: sx + lk + pr * .40, cy: ey - pr * .46, r: pr * .40, fill: '#FFFFFF' }, open);
      S('circle', { cx: sx + lk - pr * .42, cy: ey + pr * .50, r: pr * .18, fill: '#FFFFFF', opacity: '.75' }, open);
      ink(S('path', { d: 'M' + r2(sx - er) + ',' + r2(ey) + ' q' + r2(er) + ',' + r2(er * .95) + ' ' + r2(er * 2) + ',0', fill: 'none' }, shut), Math.max(s < 12 ? 1.4 : 2.4, s * .075));
    }
    return { open: open, shut: shut };
  }

  function mouth(g, s, mood, y) {
    var my = s * (y === undefined ? .40 : y), w = Math.max(s < 12 ? 1.5 : 3, s * .085);
    if (mood === 'happy') {
      ink(S('path', { d: 'M' + r2(-s * .21) + ',' + r2(my) + ' q' + r2(s * .21) + ',' + r2(s * .27) + ' ' + r2(s * .42) + ',0', fill: 'none' }, g), w);
    } else if (mood === 'sad') {
      ink(S('path', { d: 'M' + r2(-s * .21) + ',' + r2(my + s * .11) + ' q' + r2(s * .21) + ',' + r2(-s * .27) + ' ' + r2(s * .42) + ',0', fill: 'none' }, g), w);
    } else if (mood === 'flat') {
      ink(S('line', { x1: -s * .16, y1: my, x2: s * .16, y2: my }, g), w);
    } else if (mood === 'wow') {
      ink(S('ellipse', { cx: 0, cy: my + s * .03, rx: s * .115, ry: s * .155, fill: '#8C3350' }, g), w * .8);
    }
  }

  function blush(g, s, x, y) {
    S('ellipse', { cx: -s * (x || .56), cy: s * (y || .17), rx: s * .155, ry: s * .10, fill: '#FF6F92', opacity: '.34' }, g);
    S('ellipse', { cx: s * (x || .56), cy: s * (y || .17), rx: s * .155, ry: s * .10, fill: '#FF6F92', opacity: '.34' }, g);
  }

  /* whiskers fan out from the muzzle instead of skewering the head */
  function whiskers(g, s, cy) {
    var i, a, x0 = s * .30, y0 = s * (cy === undefined ? .30 : cy), w = Math.max(s < 12 ? 1 : 1.6, s * .038);
    for (i = -1; i <= 1; i++) {
      a = i * .34;
      ink(S('line', { x1: -x0, y1: y0 + i * s * .04, x2: -x0 - Math.cos(a) * s * .52, y2: y0 + i * s * .04 + Math.sin(a) * s * .46 }, g), w);
      ink(S('line', { x1: x0, y1: y0 + i * s * .04, x2: x0 + Math.cos(a) * s * .52, y2: y0 + i * s * .04 + Math.sin(a) * s * .46 }, g), w);
    }
  }

  function life(g, o, parts, s) {
    var phase = Math.random() * 6.28, nextBlink = Date.now() + 1200 + Math.random() * 4200, shutUntil = 0;
    var bob = (o.bob !== false), canBlink = (o.blink !== false && o.mood !== 'sleep');
    if (!bob && !canBlink) { return; }
    /* The bob is quantised to quarter units and only written when it actually
       changes. Unquantised it rewrote every character's transform 60 times a
       second for a movement of under one unit; this is roughly 8 writes a
       second per character and looks the same. */
    var lastDy = 99, lastX = null, lastY = null;
    tickFor(g, function (t) {
      if (bob) {
        var dy = Math.round(Math.sin(t / 640 + phase) * s * .05 * 4) / 4;
        var h = g.__home;
        if (dy !== lastDy || h.x !== lastX || h.y !== lastY || g.__y !== h.y + dy || g.__x !== h.x) {
          lastDy = dy; lastX = h.x; lastY = h.y;
          at(g, h.x, h.y + dy);
        }
      }
      if (!canBlink) { return; }
      if (shutUntil) {
        if (t > shutUntil) { shutUntil = 0; parts.open.setAttribute('opacity', '1'); parts.shut.setAttribute('opacity', '0'); }
      } else if (t > nextBlink) {
        shutUntil = t + 115; nextBlink = t + 1800 + Math.random() * 4600;
        parts.open.setAttribute('opacity', '0'); parts.shut.setAttribute('opacity', '1');
      }
    });
  }

  /* ==========================================================
     critter() — the friendly blob, for where species does not
     matter (Pairs, Odd One, monsters). Now gradient-shaded.
     ========================================================== */
  function critter(parent, o) {
    var g = G(parent, o.x, o.y);
    var s = o.size || 40, fill = o.fill || '#FF8A3D', mood = o.mood || 'happy';
    var lw = Math.max(s < 12 ? 1.5 : 2.4, s * .1);
    var paint = bodyFill(parent, fill);
    var body = S('g', {}, g);

    if (o.shadow !== false) { shadow(g, 0, s * (o.legs ? 1.34 : 1.06), s * .82, s * .21); }
    if (o.legs) {
      ink(S('line', { x1: -s * .36, y1: s * .72, x2: -s * .36, y2: s * 1.14 }, body), lw * 1.4);
      ink(S('line', { x1: s * .36, y1: s * .72, x2: s * .36, y2: s * 1.14 }, body), lw * 1.4);
      ink(S('line', { x1: -s * .36, y1: s * 1.14, x2: -s * .52, y2: s * 1.14 }, body), lw * 1.4);
      ink(S('line', { x1: s * .36, y1: s * 1.14, x2: s * .52, y2: s * 1.14 }, body), lw * 1.4);
    }
    if (o.ears === 'cat' || o.ears === 'long') {
      var eh = (o.ears === 'long') ? 1.15 : .62;
      ink(S('path', { d: 'M' + r2(-s * .70) + ',' + r2(-s * .44) + ' L' + r2(-s * .58) + ',' + r2(-s * (.44 + eh)) + ' L' + r2(-s * .12) + ',' + r2(-s * .66) + ' Z', fill: paint }, body), lw);
      if (o.ears2 !== false) {
        ink(S('path', { d: 'M' + r2(s * .70) + ',' + r2(-s * .44) + ' L' + r2(s * .58) + ',' + r2(-s * (.44 + eh)) + ' L' + r2(s * .12) + ',' + r2(-s * .66) + ' Z', fill: paint }, body), lw);
      }
    } else if (o.ears === 'round') {
      ink(S('circle', { cx: -s * .60, cy: -s * .64, r: s * .27, fill: paint }, body), lw);
      if (o.ears2 !== false) { ink(S('circle', { cx: s * .60, cy: -s * .64, r: s * .27, fill: paint }, body), lw); }
    }
    if (o.horn) {
      ink(S('path', { d: 'M' + r2(-s * .1) + ',' + r2(-s * .82) + ' L0,' + r2(-s * 1.28) + ' L' + r2(s * .1) + ',' + r2(-s * .82) + ' Z', fill: '#FFC93C' }, body), lw);
    }

    ink(S('ellipse', { cx: 0, cy: 0, rx: s * .8, ry: s * .84, fill: paint }, body), lw);
    S('ellipse', { cx: 0, cy: s * .32, rx: s * .40, ry: s * .34, fill: '#FFFFFF', opacity: '.15' }, body);

    if (o.beak) {
      ink(S('path', { d: 'M' + r2(s * .52) + ',' + r2(s * .02) + ' L' + r2(s * 1.02) + ',' + r2(s * .14) + ' L' + r2(s * .56) + ',' + r2(s * .3) + ' Z', fill: '#FF9E2C' }, body), lw);
    }

    var parts = eyes(body, s, { spread: .31, y: -.12, r: .205, look: o.look });
    if (mood === 'sleep') { parts.open.setAttribute('opacity', '0'); parts.shut.setAttribute('opacity', '1'); }
    if (o.blush !== false && mood !== 'sad') { blush(body, s); }
    mouth(body, s, mood, .42);

    g.__home = { x: o.x, y: o.y };
    life(g, o, parts, s);
    g.__eyes = parts; g.__body = body; g.__size = s;
    cast(parent, g);
    return g;
  }

  /* ==========================================================
     animal() — real silhouettes. Origin = centre of the head.
     o: {kind, x, y, size, fill, mood, look, flip, bob, blink, shadow}
     ========================================================== */
  var SPECIES = {};

  /* every character drawn on a stage is remembered on its root svg, so the
     engine can make the whole cast hop when a puzzle is solved */
  function cast(parent, g) {
    var root = rootOf(parent);
    if (!root.__chars) { root.__chars = []; }
    root.__chars.push(g);
  }

  function animal(parent, o) {
    var kind = o.kind || 'cat';
    var g = G(parent, o.x, o.y);
    var s = o.size || 30;
    var fill = o.fill || '#C9A46B';
    var inner = S('g', {}, g);
    if (o.flip) { inner.setAttribute('transform', 'scale(-1,1)'); }
    var ctx = {
      g: inner, s: s, o: o, mood: o.mood || 'happy',
      lw: Math.max(s < 12 ? 1.5 : 2.4, s * .11),
      paint: bodyFill(parent, fill),
      dark: tint(fill, -42),
      light: tint(fill, 56)
    };
    var parts = (SPECIES[kind] || SPECIES.cat)(ctx);
    g.__home = { x: o.x, y: o.y };
    life(g, o, parts, s);
    g.__eyes = parts; g.__body = inner; g.__size = s; g.__kind = kind;
    cast(parent, g);
    return g;
  }

  function sleepy(parts, mood) {
    if (mood === 'sleep') { parts.open.setAttribute('opacity', '0'); parts.shut.setAttribute('opacity', '1'); }
    return parts;
  }

  /* --- mouse: huge round ears, tiny body, long thin tail behind --- */
  SPECIES.mouse = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.0, s * .98, s * .2); }
    ink(S('path', { d: 'M' + r2(-s * .58) + ',' + r2(s * 1.44) + ' q' + r2(-s * 1.24) + ',' + r2(s * .22) + ' ' + r2(-s * .96) + ',' + r2(-s * .78) + ' q' + r2(s * .12) + ',' + r2(-s * .5) + ' ' + r2(s * .46) + ',' + r2(-s * .24), fill: 'none' }, g), lw * .9)
      .setAttribute('stroke', '#E29AAC');
    ink(S('line', { x1: -s * .34, y1: s * 1.56, x2: -s * .34, y2: s * 1.84 }, g), lw * 1.5);
    ink(S('line', { x1: s * .34, y1: s * 1.56, x2: s * .34, y2: s * 1.84 }, g), lw * 1.5);
    ink(S('ellipse', { cx: 0, cy: s * .98, rx: s * .76, ry: s * .64, fill: c.paint }, g), lw);
    ink(S('circle', { cx: -s * .8, cy: -s * .68, r: s * .54, fill: c.paint }, g), lw);
    ink(S('circle', { cx: s * .8, cy: -s * .68, r: s * .54, fill: c.paint }, g), lw);
    S('circle', { cx: -s * .8, cy: -s * .66, r: s * .31, fill: '#FF9FB2', opacity: '.8' }, g);
    S('circle', { cx: s * .8, cy: -s * .66, r: s * .31, fill: '#FF9FB2', opacity: '.8' }, g);
    ink(S('circle', { cx: 0, cy: 0, r: s * .9, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .36) + ',' + r2(s * .4) + ' Q0,' + r2(s * 1.1) + ' ' + r2(s * .36) + ',' + r2(s * .4) + ' Z', fill: c.light }, g), lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .34, y: -.14, r: .17, look: o.look }), c.mood);
    ink(S('circle', { cx: 0, cy: s * .8, r: s * .1, fill: '#FF7C96' }, g), lw * .5);
    whiskers(g, s, .62);
    if (o.blush !== false) { blush(g, s, .6, .28); }
    return parts;
  };

  /* --- elephant: huge floppy ears, thick legs, hanging trunk --- */
  SPECIES.elephant = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.42, s * 1.5, s * .3); }
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: s * (-.94 + i * .53), y: s * 1.4, width: s * .4, height: s * .86, rx: s * .17, fill: c.paint }, g), lw);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.06, rx: s * 1.2, ry: s * .84, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .7) + ',' + r2(-s * .52) + ' q' + r2(-s * 1.3) + ',' + r2(-s * .48) + ' ' + r2(-s * 1.06) + ',' + r2(s * .74) + ' q' + r2(s * .22) + ',' + r2(s * .96) + ' ' + r2(s * 1.1) + ',' + r2(s * .16) + ' Z', fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(s * .7) + ',' + r2(-s * .52) + ' q' + r2(s * 1.3) + ',' + r2(-s * .48) + ' ' + r2(s * 1.06) + ',' + r2(s * .74) + ' q' + r2(-s * .22) + ',' + r2(s * .96) + ' ' + r2(-s * 1.1) + ',' + r2(s * .16) + ' Z', fill: c.paint }, g), lw);
    S('path', { d: 'M' + r2(-s * .8) + ',' + r2(-s * .34) + ' q' + r2(-s * .86) + ',' + r2(-s * .22) + ' ' + r2(-s * .7) + ',' + r2(s * .62) + ' q' + r2(s * .18) + ',' + r2(s * .6) + ' ' + r2(s * .76) + ',' + r2(s * .04) + ' Z', fill: '#F2A2B4', opacity: '.38' }, g);
    S('path', { d: 'M' + r2(s * .8) + ',' + r2(-s * .34) + ' q' + r2(s * .86) + ',' + r2(-s * .22) + ' ' + r2(s * .7) + ',' + r2(s * .62) + ' q' + r2(-s * .18) + ',' + r2(s * .6) + ' ' + r2(-s * .76) + ',' + r2(s * .04) + ' Z', fill: '#F2A2B4', opacity: '.38' }, g);
    ink(S('circle', { cx: 0, cy: 0, r: s * .98, fill: c.paint }, g), lw);
    ink(S('path', {
      d: 'M' + r2(-s * .26) + ',' + r2(s * .48) +
         ' C' + r2(-s * .32) + ',' + r2(s * 1.28) + ' ' + r2(-s * .18) + ',' + r2(s * 1.82) + ' ' + r2(s * .2) + ',' + r2(s * 1.92) +
         ' C' + r2(s * .5) + ',' + r2(s * 2.0) + ' ' + r2(s * .6) + ',' + r2(s * 1.64) + ' ' + r2(s * .4) + ',' + r2(s * 1.54) +
         ' C' + r2(s * .26) + ',' + r2(s * 1.48) + ' ' + r2(s * .2) + ',' + r2(s * 1.6) + ' ' + r2(s * .16) + ',' + r2(s * 1.48) +
         ' C' + r2(s * .08) + ',' + r2(s * 1.2) + ' ' + r2(s * .22) + ',' + r2(s * .88) + ' ' + r2(s * .22) + ',' + r2(s * .48) + ' Z',
      fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .54) + ',' + r2(s * .72) + ' q' + r2(-s * .2) + ',' + r2(s * .36) + ' ' + r2(s * .02) + ',' + r2(s * .48), fill: 'none' }, g), lw * 1.6).setAttribute('stroke', '#FFF8E8');
    ink(S('path', { d: 'M' + r2(s * .54) + ',' + r2(s * .72) + ' q' + r2(s * .2) + ',' + r2(s * .36) + ' ' + r2(-s * .02) + ',' + r2(s * .48), fill: 'none' }, g), lw * 1.6).setAttribute('stroke', '#FFF8E8');
    var parts = sleepy(eyes(g, s, { spread: .42, y: -.22, r: .15, look: o.look }), c.mood);
    if (o.blush !== false) { blush(g, s, .72, .1); }
    return parts;
  };

  /* --- fox: sharp upright ears with dark tips, white muzzle and chest,
         and a big brush tail with a white tip. Reads as a fox, not a dog. --- */
  SPECIES.fox = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.3, s * 1.25, s * .25); }
    /* brush tail, low and thick, sweeping out behind */
    ink(S('path', { d: 'M' + r2(s * .7) + ',' + r2(s * 1.28) + ' q' + r2(s * 1.5) + ',' + r2(s * .1) + ' ' + r2(s * 1.16) + ',' + r2(-s * .96) + ' q' + r2(-s * .3) + ',' + r2(-s * .3) + ' ' + r2(-s * .62) + ',' + r2(s * .12) + ' q' + r2(-s * .3) + ',' + r2(s * .3) + ' ' + r2(-s * .54) + ',' + r2(s * .74) + ' Z', fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(s * 1.64) + ',' + r2(s * .5) + ' q' + r2(s * .5) + ',' + r2(-s * .3) + ' ' + r2(s * .22) + ',' + r2(-s * .78) + ' q' + r2(-s * .3) + ',' + r2(-s * .3) + ' ' + r2(-s * .62) + ',' + r2(s * .12) + ' Z', fill: '#FFF6E6' }, g), lw);
    /* dark stocking legs */
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: s * (-.78 + i * .44), y: s * 1.46, width: s * .3, height: s * .72, rx: s * .14, fill: c.dark }, g), lw);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.1, rx: s * .94, ry: s * .72, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.3, rx: s * .5, ry: s * .44, fill: '#FFF6E6' }, g), lw * .8);
    /* upright triangular ears, dark tipped */
    ink(S('path', { d: 'M' + r2(-s * .86) + ',' + r2(-s * .42) + ' L' + r2(-s * .92) + ',' + r2(-s * 1.5) + ' L' + r2(-s * .1) + ',' + r2(-s * .82) + ' Z', fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(s * .86) + ',' + r2(-s * .42) + ' L' + r2(s * .92) + ',' + r2(-s * 1.5) + ' L' + r2(s * .1) + ',' + r2(-s * .82) + ' Z', fill: c.paint }, g), lw);
    S('path', { d: 'M' + r2(-s * .92) + ',' + r2(-s * 1.5) + ' L' + r2(-s * .66) + ',' + r2(-s * 1.06) + ' L' + r2(-s * .38) + ',' + r2(-s * 1.24) + ' Z', fill: c.dark }, g);
    S('path', { d: 'M' + r2(s * .92) + ',' + r2(-s * 1.5) + ' L' + r2(s * .66) + ',' + r2(-s * 1.06) + ' L' + r2(s * .38) + ',' + r2(-s * 1.24) + ' Z', fill: c.dark }, g);
    /* head: a little pointed at the chin, not a round dog head */
    ink(S('path', { d: 'M0,' + r2(-s * .98) + ' q' + r2(s * .98) + ',0 ' + r2(s * .98) + ',' + r2(s * .52) + ' q0,' + r2(s * .62) + ' ' + r2(-s * .58) + ',' + r2(s * .86) + ' q' + r2(-s * .4) + ',' + r2(s * .22) + ' ' + r2(-s * .8) + ',0 q' + r2(-s * .58) + ',' + r2(-s * .24) + ' ' + r2(-s * .58) + ',' + r2(-s * .86) + ' q0,' + r2(-s * .52) + ' ' + r2(s * .98) + ',' + r2(-s * .52) + ' Z', fill: c.paint }, g), lw);
    /* white muzzle wedge */
    ink(S('path', { d: 'M' + r2(-s * .42) + ',' + r2(s * .3) + ' q' + r2(s * .42) + ',' + r2(-s * .18) + ' ' + r2(s * .84) + ',0 q' + r2(-s * .18) + ',' + r2(s * .66) + ' ' + r2(-s * .42) + ',' + r2(s * .66) + ' q' + r2(-s * .24) + ',0 ' + r2(-s * .42) + ',' + r2(-s * .66) + ' Z', fill: '#FFF6E6' }, g), lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .38, y: -.2, r: .17, look: o.look }), c.mood);
    ink(S('ellipse', { cx: 0, cy: s * .52, rx: s * .15, ry: s * .11, fill: INK }, g), lw * .5);
    whiskers(g, s, .48);
    mouth(g, s, c.mood, .78);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .72, .34); }
    return parts;
  };

  /* --- bunny: tall ears, round tail --- */
  SPECIES.bunny = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.2, s * 1.1, s * .22); }
    ink(S('circle', { cx: -s * .98, cy: s * 1.18, r: s * .3, fill: '#FFFFFF' }, g), lw);
    ink(S('ellipse', { cx: s * .5, cy: s * 1.76, rx: s * .4, ry: s * .27, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: -s * .5, cy: s * 1.76, rx: s * .4, ry: s * .27, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.04, rx: s * .84, ry: s * .7, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: -s * .44, cy: -s * 1.2, rx: s * .28, ry: s * .84, fill: c.paint, transform: 'rotate(-10 ' + r2(-s * .44) + ' ' + r2(-s * 1.2) + ')' }, g), lw);
    ink(S('ellipse', { cx: s * .44, cy: -s * 1.2, rx: s * .28, ry: s * .84, fill: c.paint, transform: 'rotate(10 ' + r2(s * .44) + ' ' + r2(-s * 1.2) + ')' }, g), lw);
    S('ellipse', { cx: -s * .44, cy: -s * 1.2, rx: s * .13, ry: s * .56, fill: '#FF9FB2', opacity: '.7', transform: 'rotate(-10 ' + r2(-s * .44) + ' ' + r2(-s * 1.2) + ')' }, g);
    S('ellipse', { cx: s * .44, cy: -s * 1.2, rx: s * .13, ry: s * .56, fill: '#FF9FB2', opacity: '.7', transform: 'rotate(10 ' + r2(s * .44) + ' ' + r2(-s * 1.2) + ')' }, g);
    ink(S('circle', { cx: 0, cy: 0, r: s * .92, fill: c.paint }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .36, y: -.12, r: .19, look: o.look }), c.mood);
    ink(S('path', { d: 'M' + r2(-s * .11) + ',' + r2(s * .3) + ' L' + r2(s * .11) + ',' + r2(s * .3) + ' L0,' + r2(s * .44) + ' Z', fill: '#FF7C96' }, g), lw * .55);
    whiskers(g, s, .42);
    mouth(g, s, c.mood, .6);
    if (o.blush !== false) { blush(g, s, .64, .28); }
    return parts;
  };

  /* --- duck --- */
  SPECIES.duck = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.1, s * 1.02, s * .2); }
    ink(S('path', { d: 'M' + r2(-s * .38) + ',' + r2(s * 1.58) + ' l' + r2(-s * .3) + ',' + r2(s * .3) + ' l' + r2(s * .62) + ',0 Z', fill: '#FF9E2C' }, g), lw * .8);
    ink(S('path', { d: 'M' + r2(s * .38) + ',' + r2(s * 1.58) + ' l' + r2(-s * .3) + ',' + r2(s * .3) + ' l' + r2(s * .62) + ',0 Z', fill: '#FF9E2C' }, g), lw * .8);
    ink(S('ellipse', { cx: 0, cy: s * 1.0, rx: s * .96, ry: s * .74, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .1) + ',' + r2(s * .72) + ' q' + r2(-s * .88) + ',' + r2(-s * .1) + ' ' + r2(-s * .68) + ',' + r2(s * .52) + ' q' + r2(s * .3) + ',' + r2(s * .26) + ' ' + r2(s * .78) + ',' + r2(-s * .14) + ' Z', fill: c.light }, g), lw * .85);
    ink(S('circle', { cx: 0, cy: 0, r: s * .84, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(s * .48) + ',' + r2(s * .1) + ' L' + r2(s * 1.34) + ',' + r2(s * .28) + ' L' + r2(s * .52) + ',' + r2(s * .56) + ' Z', fill: '#FF9E2C' }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .3, y: -.18, r: .17, look: o.look }), c.mood);
    if (o.blush !== false) { blush(g, s, .56, .14); }
    return parts;
  };

  /* --- owl --- */
  SPECIES.owl = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 1.86, s * 1.05, s * .2); }
    ink(S('path', { d: 'M' + r2(-s * .34) + ',' + r2(s * 1.46) + ' l0,' + r2(s * .28) + ' M' + r2(s * .34) + ',' + r2(s * 1.46) + ' l0,' + r2(s * .28), fill: 'none' }, g), lw * 1.3).setAttribute('stroke', '#FF9E2C');
    ink(S('ellipse', { cx: 0, cy: s * .7, rx: s * 1.0, ry: s * .92, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .86) + ',' + r2(s * .36) + ' q' + r2(-s * .3) + ',' + r2(s * .82) + ' ' + r2(s * .16) + ',' + r2(s * 1.0) + ' q' + r2(s * .24) + ',' + r2(-s * .5) + ' ' + r2(s * .1) + ',' + r2(-s * 1.0) + ' Z', fill: c.dark }, g), lw * .9);
    ink(S('path', { d: 'M' + r2(s * .86) + ',' + r2(s * .36) + ' q' + r2(s * .3) + ',' + r2(s * .82) + ' ' + r2(-s * .16) + ',' + r2(s * 1.0) + ' q' + r2(-s * .24) + ',' + r2(-s * .5) + ' ' + r2(-s * .1) + ',' + r2(-s * 1.0) + ' Z', fill: c.dark }, g), lw * .9);
    ink(S('path', { d: 'M' + r2(-s * .84) + ',' + r2(-s * .48) + ' L' + r2(-s * .74) + ',' + r2(-s * 1.22) + ' L' + r2(-s * .18) + ',' + r2(-s * .72) + ' Z', fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(s * .84) + ',' + r2(-s * .48) + ' L' + r2(s * .74) + ',' + r2(-s * 1.22) + ' L' + r2(s * .18) + ',' + r2(-s * .72) + ' Z', fill: c.paint }, g), lw);
    ink(S('circle', { cx: 0, cy: 0, r: s * .94, fill: c.paint }, g), lw);
    S('circle', { cx: -s * .36, cy: -s * .06, r: s * .43, fill: c.light, opacity: '.75' }, g);
    S('circle', { cx: s * .36, cy: -s * .06, r: s * .43, fill: c.light, opacity: '.75' }, g);
    var parts = sleepy(eyes(g, s, { spread: .36, y: -.06, r: .25, look: o.look }), c.mood);
    ink(S('path', { d: 'M' + r2(-s * .13) + ',' + r2(s * .32) + ' L' + r2(s * .13) + ',' + r2(s * .32) + ' L0,' + r2(s * .6) + ' Z', fill: '#FF9E2C' }, g), lw * .7);
    return parts;
  };

  /* --- frog: wide flat head, eyes on top, long back legs folded at the sides --- */
  SPECIES.frog = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 1.86, s * 1.25, s * .22); }
    ink(S('ellipse', { cx: -s * .98, cy: s * 1.34, rx: s * .46, ry: s * .34, fill: c.dark }, g), lw);
    ink(S('ellipse', { cx: s * .98, cy: s * 1.34, rx: s * .46, ry: s * .34, fill: c.dark }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * .98, rx: s * .92, ry: s * .68, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.12, rx: s * .54, ry: s * .44, fill: c.light }, g), lw * .7);
    ink(S('ellipse', { cx: -s * .44, cy: s * 1.62, rx: s * .28, ry: s * .14, fill: c.paint }, g), lw * .8);
    ink(S('ellipse', { cx: s * .44, cy: s * 1.62, rx: s * .28, ry: s * .14, fill: c.paint }, g), lw * .8);
    ink(S('circle', { cx: -s * .54, cy: -s * .62, r: s * .42, fill: c.paint }, g), lw);
    ink(S('circle', { cx: s * .54, cy: -s * .62, r: s * .42, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: 0, rx: s * 1.08, ry: s * .82, fill: c.paint }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .54, y: -.6, r: .25, look: o.look }), c.mood);
    S('circle', { cx: -s * .12, cy: -s * .06, r: s * .045, fill: INK }, g);
    S('circle', { cx: s * .12, cy: -s * .06, r: s * .045, fill: INK }, g);
    if (c.mood === 'happy') {
      ink(S('path', { d: 'M' + r2(-s * .58) + ',' + r2(s * .2) + ' q' + r2(s * .58) + ',' + r2(s * .46) + ' ' + r2(s * 1.16) + ',0', fill: 'none' }, g), Math.max(3, s * .085));
    } else { mouth(g, s, c.mood, .3); }
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .78, .2); }
    return parts;
  };

  /* --- hen: red comb and wattle, small beak, tail feathers. Not a duck. --- */
  SPECIES.hen = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.02, s * 1.05, s * .2); }
    ink(S('path', { d: 'M' + r2(-s * .32) + ',' + r2(s * 1.56) + ' l0,' + r2(s * .34) + ' M' + r2(-s * .5) + ',' + r2(s * 1.9) + ' l' + r2(s * .36) + ',0 M' + r2(s * .32) + ',' + r2(s * 1.56) + ' l0,' + r2(s * .34) + ' M' + r2(s * .14) + ',' + r2(s * 1.9) + ' l' + r2(s * .36) + ',0', fill: 'none' }, g), lw * 1.1).setAttribute('stroke', '#FF9E2C');
    ink(S('path', { d: 'M' + r2(-s * .7) + ',' + r2(s * .86) + ' q' + r2(-s * .78) + ',' + r2(-s * .2) + ' ' + r2(-s * .7) + ',' + r2(-s * .86) + ' q' + r2(s * .34) + ',' + r2(s * .2) + ' ' + r2(s * .4) + ',' + r2(s * .1) + ' q' + r2(s * .06) + ',' + r2(-s * .2) + ' ' + r2(s * .34) + ',' + r2(-s * .06) + ' Z', fill: c.dark }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.0, rx: s * .96, ry: s * .76, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .5) + ',' + r2(s * .86) + ' q' + r2(s * .5) + ',' + r2(-s * .26) + ' ' + r2(s * .84) + ',' + r2(s * .1) + ' q' + r2(-s * .3) + ',' + r2(s * .56) + ' ' + r2(-s * .84) + ',' + r2(-s * .1) + ' Z', fill: c.light }, g), lw * .8);
    ink(S('circle', { cx: -s * .26, cy: -s * .8, r: s * .2, fill: '#E8464C' }, g), lw * .8);
    ink(S('circle', { cx: s * .26, cy: -s * .8, r: s * .2, fill: '#E8464C' }, g), lw * .8);
    ink(S('circle', { cx: 0, cy: -s * .94, r: s * .25, fill: '#E8464C' }, g), lw * .8);
    ink(S('circle', { cx: 0, cy: 0, r: s * .82, fill: c.paint }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .32, y: -.16, r: .17, look: o.look }), c.mood);
    ink(S('ellipse', { cx: 0, cy: s * .56, rx: s * .1, ry: s * .17, fill: '#E8464C' }, g), lw * .6);
    ink(S('path', { d: 'M' + r2(-s * .16) + ',' + r2(s * .12) + ' L' + r2(s * .16) + ',' + r2(s * .12) + ' L0,' + r2(s * .44) + ' Z', fill: '#FF9E2C' }, g), lw * .7);
    if (o.blush !== false) { blush(g, s, .56, .22); }
    return parts;
  };

  /* --- pig: flat snout with two nostrils, folded ears, curly tail --- */
  SPECIES.pig = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.3, s * 1.3, s * .25); }
    ink(S('path', { d: 'M' + r2(s * .98) + ',' + r2(s * .9) + ' q' + r2(s * .4) + ',' + r2(-s * .1) + ' ' + r2(s * .34) + ',' + r2(-s * .34) + ' q' + r2(-s * .08) + ',' + r2(-s * .22) + ' ' + r2(-s * .24) + ',' + r2(-s * .08) + ' q' + r2(-s * .1) + ',' + r2(s * .16) + ' ' + r2(s * .14) + ',' + r2(s * .16), fill: 'none' }, g), lw * 1.1).setAttribute('stroke', c.dark);
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: s * (-.86 + i * .47), y: s * 1.5, width: s * .32, height: s * .66, rx: s * .12, fill: c.dark }, g), lw);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.1, rx: s * 1.1, ry: s * .78, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .9) + ',' + r2(-s * .5) + ' L' + r2(-s * .98) + ',' + r2(-s * 1.12) + ' L' + r2(-s * .3) + ',' + r2(-s * .84) + ' Z', fill: c.dark }, g), lw);
    ink(S('path', { d: 'M' + r2(s * .9) + ',' + r2(-s * .5) + ' L' + r2(s * .98) + ',' + r2(-s * 1.12) + ' L' + r2(s * .3) + ',' + r2(-s * .84) + ' Z', fill: c.dark }, g), lw);
    ink(S('circle', { cx: 0, cy: 0, r: s * .96, fill: c.paint }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .42, y: -.24, r: .16, look: o.look }), c.mood);
    ink(S('ellipse', { cx: 0, cy: s * .34, rx: s * .42, ry: s * .3, fill: c.light }, g), lw * .8);
    S('ellipse', { cx: -s * .15, cy: s * .34, rx: s * .07, ry: s * .11, fill: c.dark }, g);
    S('ellipse', { cx: s * .15, cy: s * .34, rx: s * .07, ry: s * .11, fill: c.dark }, g);
    mouth(g, s, c.mood, .72);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .7, .22); }
    return parts;
  };

  /* --- lion: a ring of mane behind a small face, tufted tail --- */
  SPECIES.lion = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i, a;
    if (o.shadow !== false) { shadow(g, 0, s * 2.34, s * 1.3, s * .26); }
    ink(S('path', { d: 'M' + r2(s * .86) + ',' + r2(s * 1.3) + ' q' + r2(s * .8) + ',' + r2(-s * .06) + ' ' + r2(s * .7) + ',' + r2(-s * .78), fill: 'none' }, g), lw * 1.6).setAttribute('stroke', c.dark);
    ink(S('circle', { cx: s * 1.56, cy: s * .44, r: s * .24, fill: tint(o.fill || '#E8A63A', -70) }, g), lw);
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: s * (-.8 + i * .45), y: s * 1.5, width: s * .32, height: s * .7, rx: s * .15, fill: c.paint }, g), lw);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.14, rx: s * 1.0, ry: s * .72, fill: c.paint }, g), lw);
    var mane = tint(o.fill || '#E8A63A', -70);
    for (i = 0; i < 11; i++) {
      a = i * Math.PI * 2 / 11 - Math.PI / 2;
      ink(S('circle', { cx: Math.cos(a) * s * 1.02, cy: Math.sin(a) * s * 1.02 + s * .04, r: s * .42, fill: mane }, g), lw);
    }
    S('circle', { cx: 0, cy: s * .04, r: s * 1.06, fill: mane }, g);
    ink(S('circle', { cx: -s * .7, cy: -s * .72, r: s * .26, fill: c.paint }, g), lw);
    ink(S('circle', { cx: s * .7, cy: -s * .72, r: s * .26, fill: c.paint }, g), lw);
    ink(S('circle', { cx: 0, cy: 0, r: s * .88, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * .44, rx: s * .44, ry: s * .32, fill: c.light }, g), lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .36, y: -.18, r: .17, look: o.look }), c.mood);
    ink(S('path', { d: 'M' + r2(-s * .14) + ',' + r2(s * .26) + ' L' + r2(s * .14) + ',' + r2(s * .26) + ' L0,' + r2(s * .42) + ' Z', fill: INK }, g), lw * .5);
    mouth(g, s, c.mood, .56);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .66, .26); }
    return parts;
  };

  /* --- penguin: dark coat, white front, flippers, orange feet --- */
  SPECIES.penguin = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.06, s * 1.1, s * .2); }
    ink(S('ellipse', { cx: -s * .42, cy: s * 1.92, rx: s * .36, ry: s * .16, fill: '#FF9E2C' }, g), lw * .8);
    ink(S('ellipse', { cx: s * .42, cy: s * 1.92, rx: s * .36, ry: s * .16, fill: '#FF9E2C' }, g), lw * .8);
    ink(S('ellipse', { cx: -s * .96, cy: s * .92, rx: s * .24, ry: s * .62, fill: c.paint, transform: 'rotate(16 ' + r2(-s * .96) + ' ' + r2(s * .92) + ')' }, g), lw);
    ink(S('ellipse', { cx: s * .96, cy: s * .92, rx: s * .24, ry: s * .62, fill: c.paint, transform: 'rotate(-16 ' + r2(s * .96) + ' ' + r2(s * .92) + ')' }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * .96, rx: s * .92, ry: s * .98, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.08, rx: s * .6, ry: s * .76, fill: '#FFFFFF' }, g), lw * .7);
    ink(S('circle', { cx: 0, cy: 0, r: s * .88, fill: c.paint }, g), lw);
    S('circle', { cx: -s * .3, cy: s * .06, r: s * .44, fill: '#FFFFFF' }, g);
    S('circle', { cx: s * .3, cy: s * .06, r: s * .44, fill: '#FFFFFF' }, g);
    var parts = sleepy(eyes(g, s, { spread: .3, y: -.04, r: .17, look: o.look }), c.mood);
    ink(S('path', { d: 'M' + r2(-s * .17) + ',' + r2(s * .22) + ' L' + r2(s * .17) + ',' + r2(s * .22) + ' L0,' + r2(s * .5) + ' Z', fill: '#FF9E2C' }, g), lw * .7);
    if (o.blush !== false) { blush(g, s, .58, .3); }
    return parts;
  };

  /* ==========================================================
     v13 species. Each one is drawn around the two or three things a
     six-year-old names an animal by, and those things are kept big:
     a dog is droopy ears, a collar and a tongue; a cow is horns, a
     pink muzzle and patches; a sheep is wool. At size 11 the fine
     detail goes and the outline has to carry it alone.
     sc() scales a path written in head-radius units.
     ========================================================== */
  function sc(s, d) {
    return d.replace(/-?\d*\.?\d+/g, function (n) { return r2(parseFloat(n) * s); });
  }
  function P(g, s, d, fill, w) { return ink(S('path', { d: sc(s, d), fill: fill || 'none' }, g), w); }
  function E(g, s, cx, cy, rx, ry, fill, w, rot) {
    var a = { cx: r2(cx * s), cy: r2(cy * s), rx: r2(rx * s), ry: r2(ry * s), fill: fill };
    if (rot) { a.transform = 'rotate(' + rot + ' ' + r2(cx * s) + ' ' + r2(cy * s) + ')'; }
    var e = S('ellipse', a, g);
    if (w !== 0) { ink(e, w); }
    return e;
  }
  /* a front leg with a paler paw and two toe lines */
  function leg(g, s, x, top, bot, w, fill, paw, lw) {
    ink(S('rect', { x: r2((x - w / 2) * s), y: r2(top * s), width: r2(w * s), height: r2((bot - top) * s), rx: r2(w * s * .46), fill: fill }, g), lw);
    if (paw) {
      E(g, s, x, bot - .1, w * .56, .15, paw, lw * .7);
      if (s >= 12) {
        ink(S('line', { x1: r2((x - w * .14) * s), y1: r2((bot - .16) * s), x2: r2((x - w * .14) * s), y2: r2((bot - .02) * s) }, g), lw * .45);
        ink(S('line', { x1: r2((x + w * .14) * s), y1: r2((bot - .16) * s), x2: r2((x + w * .14) * s), y2: r2((bot - .02) * s) }, g), lw * .45);
      }
    }
  }
  function tailLine(g, s, d, paint, lw, thick) {
    ink(S('path', { d: sc(s, d), fill: 'none' }, g), lw * (thick || 2.4));
    ink(S('path', { d: sc(s, d), fill: 'none' }, g), lw * ((thick || 2.4) - 1)).setAttribute('stroke', paint);
  }

  /* --- cat: sitting, pointed ears, forehead stripes, whiskers, curled tail.
         tiger: the same animal with round ears, a white muzzle and stripes
         all the way down. --- */
  SPECIES.cat = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i, tig = c.tiger;
    var stripe = tig ? '#3A2530' : c.dark;
    if (o.shadow !== false) { shadow(g, 0, s * 2.26, s * 1.2, s * .24); }
    tailLine(g, s, 'M.7,1.62 q1.18,-.1 .92,-1.16 q-.12,-.46 -.52,-.2', c.paint, lw);
    if (tig) { for (i = 0; i < 3; i++) { ink(S('line', { x1: r2(s * (1.36 + i * .1)), y1: r2(s * (1.34 - i * .3)), x2: r2(s * (1.62 + i * .06)), y2: r2(s * (1.28 - i * .32)) }, g), lw * .7).setAttribute('stroke', stripe); } }
    E(g, s, 0, 1.2, .9, .82, c.paint, lw);
    if (tig) {
      P(g, s, 'M-.86,1.0 l.34,.08 M-.9,1.3 l.36,.02 M.86,1.0 l-.34,.08 M.9,1.3 l-.36,.02', 'none', lw * .8).setAttribute('stroke', stripe);
    }
    E(g, s, 0, 1.36, .46, .5, tig ? '#FFF6E6' : c.light, lw * .7);
    leg(g, s, -.34, 1.34, 2.16, .4, c.paint, tig ? '#FFF6E6' : c.light, lw);
    leg(g, s, .34, 1.34, 2.16, .4, c.paint, tig ? '#FFF6E6' : c.light, lw);
    if (tig) {
      E(g, s, -.72, -.72, .32, .32, c.paint, lw); E(g, s, .72, -.72, .32, .32, c.paint, lw);
      E(g, s, -.72, -.7, .15, .15, '#3A2530', 0); E(g, s, .72, -.7, .15, .15, '#3A2530', 0);
    } else {
      P(g, s, 'M-.82,-.46 L-.78,-1.36 L-.12,-.8 Z', c.paint, lw);
      if (o.ears2 !== false) { P(g, s, 'M.82,-.46 L.78,-1.36 L.12,-.8 Z', c.paint, lw); }
      S('path', { d: sc(s, 'M-.7,-.58 L-.67,-1.08 L-.32,-.78 Z'), fill: '#FF8FA6', opacity: '.8' }, g);
      if (o.ears2 !== false) { S('path', { d: sc(s, 'M.7,-.58 L.67,-1.08 L.32,-.78 Z'), fill: '#FF8FA6', opacity: '.8' }, g); }
    }
    ink(S('circle', { cx: 0, cy: 0, r: s, fill: c.paint }, g), lw);
    /* the stripes that say "cat" before anything else does */
    P(g, s, 'M0,-.94 L0,-.58 M-.3,-.88 L-.24,-.6 M.3,-.88 L.24,-.6', 'none', lw * .85).setAttribute('stroke', stripe);
    if (tig) { P(g, s, 'M-.96,-.1 l.3,.06 M-.92,.22 l.28,-.02 M.96,-.1 l-.3,.06 M.92,.22 l-.28,-.02', 'none', lw * .85).setAttribute('stroke', stripe); }
    E(g, s, 0, .44, .5, .36, '#FFFFFF', 0).setAttribute('opacity', tig ? '.95' : '.34');
    var parts = sleepy(eyes(g, s, { spread: .4, y: -.12, r: .21, look: o.look }), c.mood);
    whiskers(g, s, .38);
    P(g, s, 'M-.11,.28 L.11,.28 L0,.42 Z', '#FF7C96', lw * .55);
    mouth(g, s, c.mood, .56);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .66, .3); }
    return parts;
  };
  SPECIES.tiger = function (c) { c.tiger = true; return SPECIES.cat(c); };

  /* --- dog: long droopy ears, an eye patch, a big pale muzzle, tongue out,
         red collar with a tag, tail up. Nothing here can be read as a bear. --- */
  SPECIES.dog = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.3, s * 1.25, s * .25); }
    tailLine(g, s, 'M.8,1.3 q.86,-.06 .72,-.98', c.paint, lw, 2.2);
    E(g, s, 0, 1.16, .98, .78, c.paint, lw);
    E(g, s, 0, 1.36, .5, .5, c.light, lw * .7);
    leg(g, s, -.4, 1.36, 2.2, .42, c.paint, c.light, lw);
    leg(g, s, .4, 1.36, 2.2, .42, c.paint, c.light, lw);
    /* collar and tag */
    P(g, s, 'M-.66,.74 Q0,1.16 .66,.74', 'none', lw * 2.5);
    ink(S('path', { d: sc(s, 'M-.66,.74 Q0,1.16 .66,.74'), fill: 'none' }, g), lw * 1.5).setAttribute('stroke', '#F0466F');
    E(g, s, 0, 1.08, .14, .14, '#FFC93C', lw * .6);
    /* ears hang well below the chin */
    E(g, s, -1.04, .08, .36, .84, c.dark, lw, 10);
    E(g, s, 1.04, .08, .36, .84, c.dark, lw, -10);
    ink(S('circle', { cx: 0, cy: 0, r: r2(s * .96), fill: c.paint }, g), lw);
    E(g, s, .4, -.2, .36, .42, c.dark, 0, -12).setAttribute('opacity', '.85');
    E(g, s, 0, .5, .58, .44, c.light, lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .38, y: -.2, r: .185, look: o.look }), c.mood);
    E(g, s, 0, .3, .2, .15, INK, lw * .4);
    if (c.mood === 'sad') { P(g, s, 'M-.22,.72 q.22,-.2 .44,0', 'none', lw * .8); }
    else {
      P(g, s, 'M0,.44 L0,.58 M0,.58 q-.2,.2 -.34,.02 M0,.58 q.2,.2 .34,.02', 'none', lw * .8);
      P(g, s, 'M-.12,.66 q0,.36 .14,.36 q.14,0 .12,-.36 Z', '#FF7C96', lw * .6);
    }
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .7, .32); }
    return parts;
  };

  /* --- bear: small round ears right on top, no tail, a barrel of a body with
         arms folded on it. panda: the same in black and white. --- */
  SPECIES.bear = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, pan = c.panda;
    var body = pan ? bodyFill(g, '#FFFFFF') : c.paint, limb = pan ? '#3A3344' : c.dark;
    var pale = pan ? '#FFFFFF' : c.light;
    if (o.shadow !== false) { shadow(g, 0, s * 2.36, s * 1.36, s * .27); }
    E(g, s, -.54, 1.9, .4, .3, limb, lw); E(g, s, .54, 1.9, .4, .3, limb, lw);
    E(g, s, -.54, 1.94, .2, .13, pan ? '#8A8296' : c.light, 0).setAttribute('opacity', '.7');
    E(g, s, .54, 1.94, .2, .13, pan ? '#8A8296' : c.light, 0).setAttribute('opacity', '.7');
    E(g, s, 0, 1.14, 1.1, .86, body, lw);
    if (!pan) { E(g, s, 0, 1.26, .6, .54, pale, lw * .7); }
    E(g, s, -.94, 1.08, .28, .5, limb, lw, 18); E(g, s, .94, 1.08, .28, .5, limb, lw, -18);
    E(g, s, -.74, -.76, .34, .34, pan ? limb : body, lw); E(g, s, .74, -.76, .34, .34, pan ? limb : body, lw);
    if (!pan) { E(g, s, -.74, -.74, .17, .17, '#FF9FB2', 0).setAttribute('opacity', '.6'); E(g, s, .74, -.74, .17, .17, '#FF9FB2', 0).setAttribute('opacity', '.6'); }
    ink(S('circle', { cx: 0, cy: 0, r: s, fill: body }, g), lw);
    if (pan) { E(g, s, -.38, -.14, .3, .38, limb, 0, 24); E(g, s, .38, -.14, .3, .38, limb, 0, -24); }
    E(g, s, 0, .5, .48, .36, pale, lw * .8);
    var parts = sleepy(eyes(g, s, { spread: pan ? .38 : .34, y: -.18, r: .17, look: o.look }), c.mood);
    E(g, s, 0, .36, .18, .13, INK, lw * .4);
    mouth(g, s, c.mood, .62);
    if (o.blush !== false && !pan) { blush(g, s, .7, .2); }
    return parts;
  };
  SPECIES.panda = function (c) { c.panda = true; return SPECIES.bear(c); };

  /* --- monkey: ears out at the sides, a pale heart-shaped face, long arms
         and a tail that curls at the end --- */
  SPECIES.monkey = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, face = '#F6D7B0';
    if (o.shadow !== false) { shadow(g, 0, s * 2.24, s * 1.15, s * .23); }
    P(g, s, 'M.5,1.5 q1.3,.3 1.16,-.7 q-.06,-.56 -.5,-.5 q-.36,.06 -.3,.4 q.06,.26 .3,.2', 'none', lw * 2.2);
    ink(S('path', { d: sc(s, 'M.5,1.5 q1.3,.3 1.16,-.7 q-.06,-.56 -.5,-.5 q-.36,.06 -.3,.4 q.06,.26 .3,.2'), fill: 'none' }, g), lw * 1.2).setAttribute('stroke', c.paint);
    leg(g, s, -.34, 1.5, 2.12, .38, c.paint, face, lw);
    leg(g, s, .34, 1.5, 2.12, .38, c.paint, face, lw);
    E(g, s, 0, 1.14, .74, .7, c.paint, lw);
    E(g, s, 0, 1.24, .42, .44, face, lw * .7);
    /* long arms hanging to the ground */
    P(g, s, 'M-.62,.86 q-.5,.5 -.32,1.14', 'none', lw * 2.6);
    ink(S('path', { d: sc(s, 'M-.62,.86 q-.5,.5 -.32,1.14'), fill: 'none' }, g), lw * 1.6).setAttribute('stroke', c.paint);
    P(g, s, 'M.62,.86 q.5,.5 .32,1.14', 'none', lw * 2.6);
    ink(S('path', { d: sc(s, 'M.62,.86 q.5,.5 .32,1.14'), fill: 'none' }, g), lw * 1.6).setAttribute('stroke', c.paint);
    E(g, s, -1.02, -.06, .38, .4, c.paint, lw); E(g, s, 1.02, -.06, .38, .4, c.paint, lw);
    E(g, s, -1.04, -.06, .2, .22, face, 0); E(g, s, 1.04, -.06, .2, .22, face, 0);
    ink(S('circle', { cx: 0, cy: 0, r: r2(s * .94), fill: c.paint }, g), lw);
    P(g, s, 'M0,-.5 q-.62,-.34 -.74,.2 q-.06,.4 .2,.5 q-.3,.5 .54,.62 q.84,-.12 .54,-.62 q.26,-.1 .2,-.5 q-.12,-.54 -.74,-.2 Z', face, lw * .7);
    var parts = sleepy(eyes(g, s, { spread: .34, y: -.14, r: .18, look: o.look }), c.mood);
    E(g, s, -.08, .28, .04, .05, INK, 0); E(g, s, .08, .28, .04, .05, INK, 0);
    mouth(g, s, c.mood, .46);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .56, .26); }
    return parts;
  };

  /* --- cow: horns, sideways ears, a big pink muzzle and dark patches --- */
  SPECIES.cow = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i, patch = '#4A4058';
    if (o.shadow !== false) { shadow(g, 0, s * 2.36, s * 1.4, s * .27); }
    P(g, s, 'M1.0,1.0 q.5,.2 .42,.86', 'none', lw * 1.1);
    E(g, s, 1.44, 1.94, .12, .16, patch, lw * .6);
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: r2(s * (-.9 + i * .5)), y: r2(s * 1.44), width: r2(s * .36), height: r2(s * .8), rx: r2(s * .12), fill: c.paint }, g), lw);
      ink(S('rect', { x: r2(s * (-.9 + i * .5)), y: r2(s * 2.04), width: r2(s * .36), height: r2(s * .2), rx: r2(s * .06), fill: patch }, g), lw * .8);
    }
    E(g, s, 0, 1.12, 1.14, .8, c.paint, lw);
    E(g, s, -.56, 1.22, .34, .28, patch, 0, -20); E(g, s, .62, .98, .3, .24, patch, 0, 16);
    E(g, s, .04, 1.86, .26, .16, '#FF9FB2', lw * .7);
    P(g, s, 'M-.5,-.78 q-.34,-.2 -.26,-.62 q.26,.1 .46,.44 Z', '#FFF2D0', lw * .8);
    P(g, s, 'M.5,-.78 q.34,-.2 .26,-.62 q-.26,.1 -.46,.44 Z', '#FFF2D0', lw * .8);
    E(g, s, -1.08, -.4, .42, .2, c.paint, lw, -16); E(g, s, 1.08, -.4, .42, .2, c.paint, lw, 16);
    E(g, s, -1.08, -.4, .24, .09, '#FF9FB2', 0, -16); E(g, s, 1.08, -.4, .24, .09, '#FF9FB2', 0, 16);
    P(g, s, 'M0,-.96 q.9,0 .9,.5 q0,.5 -.16,.86 q-.3,.5 -.74,.5 q-.44,0 -.74,-.5 q-.16,-.36 -.16,-.86 q0,-.5 .9,-.5 Z', c.paint, lw);
    E(g, s, -.44, -.36, .34, .4, patch, 0, 14);
    E(g, s, 0, .52, .62, .4, '#FFB0C0', lw * .8);
    E(g, s, -.2, .5, .07, .1, '#B05A70', 0); E(g, s, .2, .5, .07, .1, '#B05A70', 0);
    var parts = sleepy(eyes(g, s, { spread: .38, y: -.24, r: .17, look: o.look }), c.mood);
    if (c.mood !== 'sad') { P(g, s, 'M-.2,.72 q.2,.14 .4,0', 'none', lw * .7); }
    return parts;
  };

  /* --- sheep: a cloud of wool with a dark face poking out of it --- */
  SPECIES.sheep = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i, a, face = '#5A5068';
    if (o.shadow !== false) { shadow(g, 0, s * 2.26, s * 1.3, s * .25); }
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: r2(s * (-.7 + i * .4)), y: r2(s * 1.5), width: r2(s * .2), height: r2(s * .66), rx: r2(s * .08), fill: face }, g), lw * .9);
    }
    for (i = 0; i < 10; i++) {
      a = i * Math.PI / 5;
      E(g, s, Math.cos(a) * .86, 1.1 + Math.sin(a) * .56, .36, .34, c.paint, lw);
    }
    E(g, s, 0, 1.1, .92, .62, c.paint, 0);
    E(g, s, -.98, -.2, .36, .17, face, lw, 24); E(g, s, .98, -.2, .36, .17, face, lw, -24);
    E(g, s, 0, .06, .66, .8, face, lw);
    for (i = 0; i < 4; i++) { E(g, s, -.54 + i * .36, -.72 - (i === 1 || i === 2 ? .12 : 0), .3, .28, c.paint, lw); }
    E(g, s, 0, -.66, .5, .2, c.paint, 0);
    var parts = sleepy(eyes(g, s, { spread: .3, y: -.08, r: .17, look: o.look }), c.mood);
    P(g, s, 'M-.1,.42 L.1,.42 L0,.54 Z', '#FF9FB2', lw * .5);
    ink(S('path', { d: sc(s, c.mood === 'sad' ? 'M-.14,.7 q.14,-.12 .28,0' : 'M-.14,.62 q.14,.14 .28,0'), fill: 'none' }, g), lw * .7).setAttribute('stroke', '#FFF6E6');
    return parts;
  };

  /* --- turtle: a patterned shell with a head and four flippers poking out --- */
  SPECIES.turtle = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, shell = '#8A6A3C', plate = '#B08A50';
    if (o.shadow !== false) { shadow(g, 0, s * 2.1, s * 1.36, s * .24); }
    E(g, s, -.98, 1.0, .34, .2, c.paint, lw, 30); E(g, s, .98, 1.0, .34, .2, c.paint, lw, -30);
    E(g, s, -.84, 1.78, .34, .22, c.paint, lw, -30); E(g, s, .84, 1.78, .34, .22, c.paint, lw, 30);
    P(g, s, 'M0,1.96 l0,.24', 'none', lw * 1.2).setAttribute('stroke', c.dark);
    E(g, s, 0, 1.34, 1.06, .78, shell, lw);
    P(g, s, 'M0,.88 L.4,1.1 L.4,1.56 L0,1.8 L-.4,1.56 L-.4,1.1 Z', plate, lw * .7);
    P(g, s, 'M.4,1.1 L.86,.94 M.4,1.56 L.88,1.72 M-.4,1.1 L-.86,.94 M-.4,1.56 L-.88,1.72 M0,.88 L0,.58 M0,1.8 L0,2.1', 'none', lw * .7);
    ink(S('circle', { cx: 0, cy: 0, r: r2(s * .78), fill: c.paint }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .32, y: -.12, r: .19, look: o.look }), c.mood);
    mouth(g, s, c.mood, .3);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .52, .16); }
    return parts;
  };

  /* --- fish: forked tail, back fin, side fin and two bands --- */
  SPECIES.fish = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    P(g, s, 'M-.8,0 L-1.5,-.66 L-1.3,0 L-1.5,.66 Z', c.dark, lw);
    P(g, s, 'M-.3,-.62 q.34,-.6 .78,.02', c.dark, lw * .9);
    E(g, s, 0, 0, 1, .72, c.paint, lw);
    P(g, s, 'M-.38,-.64 q.2,.64 0,1.28 M-.02,-.7 q.2,.7 0,1.4', 'none', lw * 1.3).setAttribute('stroke', c.light);
    E(g, s, .06, .3, .5, .26, '#FFFFFF', 0).setAttribute('opacity', '.2');
    P(g, s, 'M.02,.14 q-.4,.2 -.3,.54 q.4,-.02 .5,-.4 Z', c.dark, lw * .8);
    var parts = eyes(g, s, { spread: 0, y: -.2, r: .2, look: o.look });
    parts.open.setAttribute('transform', 'translate(' + r2(s * .46) + ',0)');
    parts.shut.setAttribute('transform', 'translate(' + r2(s * .46) + ',0)');
    sleepy(parts, c.mood);
    P(g, s, 'M.66,.3 q.16,.14 .3,0', 'none', lw * .8);
    return parts;
  };


  /* ==========================================================
     SCENERY
     ========================================================== */
  var SKIES = {
    day:    ['#8FD3F0', '#DFF4FC'],
    meadow: ['#7FCFEE', '#E8F7EC'],
    dusk:   ['#F98A62', '#FFDCAE'],
    night:  ['#1E1852', '#4A3E86'],
    water:  ['#8FD6EF', '#DFF3FB'],
    sea:    ['#2E7FA8', '#8ACFE4'],
    room:   ['#F6E7CE', '#E4CBA4'],
    candy:  ['#FFD6E8', '#FFF3F8'],
    snow:   ['#A9D8F2', '#EEF8FF'],
    space:  ['#120E33', '#3A2A78'],
    lab:    ['#D9E6F2', '#BFD0E2'],
    forest: ['#9FDDB7', '#E6F6DC']
  };

  function blade(parent, x, y, h, lean, col) {
    var e = ink(S('path', { d: 'M' + r2(x) + ',' + r2(y) + ' Q' + r2(x + lean * .5) + ',' + r2(y - h * .6) + ' ' + r2(x + lean) + ',' + r2(y - h), fill: 'none' }, parent), 3.2);
    e.setAttribute('stroke', col);
    return e;
  }

  function scene(stage, kind, o) {
    o = o || {};
    var sk = SKIES[kind] || SKIES.day;
    var W = o.w || 360, H = o.h || 300, i;
    S('rect', { x: 0, y: 0, width: W, height: H, fill: vgrad(stage, sk[0], sk[1]) }, stage);

    var still = (o.still === true);
    if (kind === 'night' || kind === 'space') {
      var pts = [[38, 40, 8], [110, 24, 5], [176, 52, 4], [246, 30, 6], [312, 60, 5], [286, 96, 3.5], [72, 92, 4]];
      var twk = [];
      for (i = 0; i < pts.length; i++) { twk.push(star(stage, pts[i][0], pts[i][1], pts[i][2], '#FFF6E6', 0)); }
      if (kind === 'space') {
        for (i = 0; i < 16; i++) {
          S('circle', { cx: (i * 73 + 20) % W, cy: (i * 47 + 12) % (H - 60), r: 1.2 + (i % 3) * .5, fill: '#FFFFFF', opacity: '.7' }, stage);
        }
        S('circle', { cx: 64, cy: 62, r: 46, fill: glow(stage, '#B58BF0', .4) }, stage);
        ink(S('circle', { cx: 64, cy: 62, r: 20, fill: bodyFill(stage, '#B58BF0') }, stage), 3.5);
        ink(S('ellipse', { cx: 64, cy: 62, rx: 34, ry: 8, fill: 'none', transform: 'rotate(-18 64 62)' }, stage), 3).setAttribute('stroke', '#FFC93C');
      }
      /* one star dims at a time: a single attribute write every 450ms */
      if (!still) {
        var twNext = 0, twLast = null;
        tickFor(twk[0], function (t) {
          if (t < twNext) { return; }
          twNext = t + 450;
          if (twLast) { twLast.setAttribute('opacity', '1'); }
          twLast = twk[Math.floor(Math.random() * twk.length)];
          twLast.setAttribute('opacity', '.35');
        });
      }
    }
    if (o.sun === 'sun') {
      S('circle', { cx: 300, cy: 50, r: 74, fill: glow(stage, '#FFD86B', .55) }, stage);
      var sg = S('g', {}, stage);
      /* the rays turn in whole-degree steps, about four writes a second */
      if (!still) {
        (function (rays) {
          var lastDeg = -1;
          tickFor(rays, function (t) {
            var deg = Math.floor(t / 260) % 45;
            if (deg !== lastDeg) { lastDeg = deg; rays.setAttribute('transform', 'rotate(' + deg + ' 300 50)'); }
          });
        })(sg);
      }
      for (i = 0; i < 8; i++) {
        var a = i * Math.PI / 4 + .2;
        ink(S('line', { x1: 300 + Math.cos(a) * 33, y1: 50 + Math.sin(a) * 33, x2: 300 + Math.cos(a) * 44, y2: 50 + Math.sin(a) * 44 }, sg), 5)
          .setAttribute('stroke', '#F2A93B');
      }
      ink(S('circle', { cx: 300, cy: 50, r: 27, fill: '#FFC93C' }, stage));
      S('ellipse', { cx: 292, cy: 41, rx: 10, ry: 7, fill: '#FFFFFF', opacity: '.4' }, stage);
    } else if (o.sun === 'moon') {
      S('circle', { cx: 300, cy: 54, r: 70, fill: glow(stage, '#CFE2FF', .45) }, stage);
      ink(S('circle', { cx: 300, cy: 54, r: 26, fill: '#EFE3C0' }, stage));
      S('circle', { cx: 291, cy: 46, r: 5.5, fill: '#D9CBA3' }, stage);
      S('circle', { cx: 307, cy: 61, r: 4, fill: '#D9CBA3' }, stage);
    }
    if (o.clouds) {
      var cl = [[74, 52, 1], [266, 94, .7]], k;
      for (k = 0; k < cl.length; k++) {
        var cg = G(stage, cl[k][0], cl[k][1]), z = cl[k][2];
        S('ellipse', { cx: -22 * z, cy: 5 * z, rx: 24 * z, ry: 16 * z, fill: '#FFFFFF', opacity: '.88' }, cg);
        S('ellipse', { cx: 20 * z, cy: 7 * z, rx: 20 * z, ry: 13 * z, fill: '#FFFFFF', opacity: '.88' }, cg);
        S('ellipse', { cx: 0, cy: -6 * z, rx: 28 * z, ry: 20 * z, fill: '#FFFFFF', opacity: '.95' }, cg);
        cg.style.pointerEvents = 'none';
        /* clouds sway a few units either way, in half-unit steps */
        if (!still) {
          (function (cg, bx, by, ph) {
            var lastX = null;
            tickFor(cg, function (t) {
              var nx = bx + Math.round(Math.sin(t / 5200 + ph) * 12 * 2) / 2;
              if (nx !== lastX) { lastX = nx; at(cg, nx, by); }
            });
          })(cg, cl[k][0], cl[k][1], k * 2.4);
        }
      }
    }

    var gy = o.groundY || 244;
    if (o.hills !== false && kind !== 'room' && kind !== 'lab' && kind !== 'space') {
      var far = (kind === 'night') ? '#3A3070' : (kind === 'dusk' ? '#D97A5E' : (kind === 'snow' ? '#D6ECFA' : (kind === 'forest' ? '#6FBF8C' : '#A6DFC4')));
      var mid = (kind === 'night') ? '#2E265C' : (kind === 'dusk' ? '#B85F52' : (kind === 'snow' ? '#C2E0F4' : (kind === 'forest' ? '#56A877' : '#82CFA4')));
      S('path', { d: 'M-6,' + (gy - 34) + ' Q70,' + (gy - 92) + ' 152,' + (gy - 40) + ' Q234,' + (gy - 96) + ' 366,' + (gy - 42) + ' L366,' + (H + 4) + ' L-6,' + (H + 4) + ' Z', fill: far, opacity: '.85' }, stage);
      S('path', { d: 'M-6,' + (gy - 12) + ' Q92,' + (gy - 56) + ' 188,' + (gy - 16) + ' Q272,' + (gy - 52) + ' 366,' + (gy - 14) + ' L366,' + (H + 4) + ' L-6,' + (H + 4) + ' Z', fill: mid, opacity: '.9' }, stage);
    }
    if (o.ground !== false) {
      var gc = o.ground || (kind === 'night' ? '#3E3372' : (kind === 'room' ? '#C08D57' : (kind === 'water' ? '#79C98F' :
        (kind === 'snow' ? '#F6FBFF' : (kind === 'space' ? '#8C86A8' : (kind === 'lab' ? '#8FA3BA' : '#69C486'))))));
      var top = 'M-6,' + gy + ' Q90,' + (gy - 13) + ' 180,' + gy + ' T366,' + gy;
      S('path', { d: top + ' L366,' + (H + 4) + ' L-6,' + (H + 4) + ' Z', fill: gc }, stage);
      ink(S('path', { d: top, fill: 'none' }, stage), 4);
      if (o.tufts !== false && kind !== 'room' && kind !== 'water' && kind !== 'sea' && kind !== 'snow' && kind !== 'space' && kind !== 'lab') {
        var tc = (kind === 'night') ? '#584A8E' : (kind === 'dusk' ? '#9E5546' : '#4FAF6D'), t;
        for (t = 0; t < 10; t++) {
          var tx = 16 + t * 36 + (t % 3) * 5, ty = gy + 21 + (t % 4) * 11;
          if (ty > H - 4) { continue; }
          blade(stage, tx, ty, 12 + (t % 3) * 4, -4, tc);
          blade(stage, tx + 4, ty, 16 + (t % 2) * 4, 1, tc);
          blade(stage, tx + 8, ty, 11 + (t % 3) * 3, 5, tc);
        }
      }
      if (o.flowers) {
        var fl = [[48, gy + 32, '#FF6F92'], [150, gy + 46, '#FFC93C'], [266, gy + 30, '#FFF6E6'], [320, gy + 48, '#FF8A3D']], q, pI, pa;
        for (q = 0; q < fl.length; q++) {
          if (fl[q][1] > H - 6) { continue; }
          ink(S('line', { x1: fl[q][0], y1: fl[q][1], x2: fl[q][0], y2: fl[q][1] - 15 }, stage), 3).setAttribute('stroke', '#4FAF6D');
          for (pI = 0; pI < 5; pI++) {
            pa = pI * Math.PI * 2 / 5;
            S('circle', { cx: fl[q][0] + Math.cos(pa) * 5.5, cy: fl[q][1] - 15 + Math.sin(pa) * 5.5, r: 4.4, fill: fl[q][2] }, stage);
          }
          S('circle', { cx: fl[q][0], cy: fl[q][1] - 15, r: 3, fill: '#FFE9A8' }, stage);
        }
      }
    }
    if (o.vignette !== false) {
      var id = 'vv' + (uid++);
      var rg = S('radialGradient', { id: id, cx: '.5', cy: '.5', r: '.74' }, defsOf(stage));
      S('stop', { offset: '.55', 'stop-color': INK, 'stop-opacity': '0' }, rg);
      S('stop', { offset: '1', 'stop-color': INK, 'stop-opacity': '.22' }, rg);
      var v = S('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#' + id + ')' }, stage);
      v.style.pointerEvents = 'none';
      v.setAttribute('data-vignette', '1');
    }
  }
  function lift(stage) {
    var v = stage.querySelector('[data-vignette]');
    if (v) { stage.appendChild(v); }
  }

  /* ==========================================================
     EFFECTS — all on the shared ticker, all self-removing
     ========================================================== */

  /* a puff of sparkles flying outward from a point */
  function burst(parent, x, y, o) {
    o = o || {};
    var n = o.n || 8, cols = o.cols || ['#FFC93C', '#FFF6E6', '#FF8A3D', '#6EC6E8'];
    var g = S('g', {}, parent), bits = [], i, a, t0 = Date.now(), ms = o.ms || 620, reach = o.r || 42;
    g.style.pointerEvents = 'none';
    for (i = 0; i < n; i++) {
      a = i * Math.PI * 2 / n + Math.random() * .5;
      bits.push({ e: (i % 2) ? S('circle', { cx: 0, cy: 0, r: 3.2, fill: cols[i % cols.length] }, g)
                             : star(g, 0, 0, 6, cols[i % cols.length], 0),
                  dx: Math.cos(a), dy: Math.sin(a), k: .7 + Math.random() * .5 });
    }
    tick(function (t) {
      var k = (t - t0) / ms, j, b, e;
      if (k >= 1) { if (g.parentNode) { g.parentNode.removeChild(g); } return true; }
      e = 1 - Math.pow(1 - k, 2);
      for (j = 0; j < bits.length; j++) {
        b = bits[j];
        b.e.setAttribute('transform', 'translate(' + r2(x + b.dx * reach * b.k * e) + ',' + r2(y + b.dy * reach * b.k * e + 14 * k * k) + ')');
      }
      g.setAttribute('opacity', r2(k < .6 ? 1 : 1 - (k - .6) / .4));
      return false;
    });
    return g;
  }

  /* make a character jump on the spot. Moves the __home anchor, so the idle
     bob carries it rather than fighting it. */
  function hop(g, h, ms, delay) {
    if (g.__hop || (g.__busyUntil && Date.now() < g.__busyUntil)) { return; }
    g.__hop = 1;
    var t0 = Date.now() + (delay || 0), hx = null, hy = null;
    h = h || 10; ms = ms || 560;
    tick(function (t) {
      if (t < t0) { return false; }
      if (hx === null) { hx = g.__home ? g.__home.x : (g.__x || 0); hy = g.__home ? g.__home.y : (g.__y || 0); }
      var k = (t - t0) / ms;
      if (k >= 1) { g.__hop = 0; place(g, hx, hy); return true; }
      place(g, hx, hy - Math.abs(Math.sin(k * Math.PI * 2)) * h * (1 - k * .4));
      return false;
    });
  }

  /* squash-and-spring on an element that sits at (x, y) */
  function pop(el, x, y, big) {
    var t0 = Date.now(), amp = big || .22;
    tick(function (t) {
      var k = (t - t0) / 300;
      if (k >= 1) { at(el, x, y); return true; }
      var sc = 1 + Math.sin(k * Math.PI) * amp;
      el.setAttribute('transform', 'translate(' + r2(x) + ',' + r2(y) + ') scale(' + r2(sc) + ')');
      return false;
    });
  }

  function cheer(root) {
    var list = root.__chars, i, n = 0;
    if (!list) { return; }
    for (i = 0; i < list.length && n < 9; i++) {
      if (!list[i].parentNode) { continue; }
      hop(list[i], Math.max(6, (list[i].__size || 20) * .5), 620, n * 70);
      n++;
    }
  }

  /* a little robot: square head, antenna, wheels. Origin = centre of the head. */
  function robot(parent, o) {
    var g = G(parent, o.x, o.y), s = o.size || 16, col = o.fill || '#8FA8F0';
    ink(S('line', { x1: 0, y1: -s * .9, x2: 0, y2: -s * 1.4 }, g), Math.max(2.4, s * .16));
    ink(S('circle', { cx: 0, cy: -s * 1.5, r: s * .22, fill: '#FFC93C' }, g), Math.max(2, s * .12));
    ink(S('circle', { cx: -s * .56, cy: s * .92, r: s * .26, fill: '#4A4258' }, g), Math.max(2, s * .12));
    ink(S('circle', { cx: s * .56, cy: s * .92, r: s * .26, fill: '#4A4258' }, g), Math.max(2, s * .12));
    ink(S('rect', { x: -s, y: -s * .9, width: s * 2, height: s * 1.7, rx: s * .4, fill: bodyFill(parent, col) }, g), Math.max(2.6, s * .17));
    S('rect', { x: -s * .78, y: -s * .72, width: s * .7, height: s * .22, rx: s * .1, fill: '#FFFFFF', opacity: '.4' }, g);
    ink(S('circle', { cx: -s * .42, cy: -s * .18, r: s * .28, fill: '#FFF6E6' }, g), Math.max(1.8, s * .1));
    ink(S('circle', { cx: s * .42, cy: -s * .18, r: s * .28, fill: '#FFF6E6' }, g), Math.max(1.8, s * .1));
    S('circle', { cx: -s * .38, cy: -s * .14, r: s * .13, fill: INK }, g);
    S('circle', { cx: s * .46, cy: -s * .14, r: s * .13, fill: INK }, g);
    ink(S('rect', { x: -s * .4, y: s * .3, width: s * .8, height: s * .2, rx: s * .1, fill: INK }, g), 1);
    g.__size = s;
    cast(parent, g);
    return g;
  }

  /* turn any animal into a solid black shadow of itself */
  function silhouette(g) {
    if (g.__eyes) { g.__eyes.open.setAttribute('opacity', '0'); g.__eyes.shut.setAttribute('opacity', '0'); }
    var all = g.getElementsByTagName('*'), i, f;
    for (i = 0; i < all.length; i++) {
      f = all[i].getAttribute('fill');
      if (f && f !== 'none') { all[i].setAttribute('fill', INK); }
      if (all[i].getAttribute('stroke')) { all[i].setAttribute('stroke', INK); }
      if (all[i].getAttribute('opacity') !== null) { all[i].setAttribute('opacity', '1'); }
    }
    return g;
  }

  return {
    silhouette: silhouette,
    S: S, G: G, at: at, place: place, scaleAt: scaleAt, clear: clear, ink: ink, txt: txt,
    scene: scene, lift: lift, star: star, critter: critter, animal: animal,
    shadow: shadow, glow: glow, vgrad: vgrad, bodyFill: bodyFill, tint: tint,
    eyes: eyes, mouth: mouth, blush: blush, blade: blade,
    burst: burst, hop: hop, pop: pop, cheer: cheer, r2: r2, robot: robot,
    tick: tick, tickFor: tickFor, stopAll: stopAll, jobCount: jobCount, INK: INK, species: SPECIES
  };
})();
