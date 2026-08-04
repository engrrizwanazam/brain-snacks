/* ==========================================================
   Brain Snacks — art system v3
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
      ink(S('ellipse', { cx: sx, cy: ey, rx: er, ry: er * 1.08, fill: '#FFFFFF' }, open), Math.max(2, s * .062));
      S('circle', { cx: sx + lk, cy: ey + er * .08, r: pr, fill: INK }, open);
      S('circle', { cx: sx + lk + pr * .40, cy: ey - pr * .46, r: pr * .40, fill: '#FFFFFF' }, open);
      S('circle', { cx: sx + lk - pr * .42, cy: ey + pr * .50, r: pr * .18, fill: '#FFFFFF', opacity: '.75' }, open);
      ink(S('path', { d: 'M' + r2(sx - er) + ',' + r2(ey) + ' q' + r2(er) + ',' + r2(er * .95) + ' ' + r2(er * 2) + ',0', fill: 'none' }, shut), Math.max(2.4, s * .075));
    }
    return { open: open, shut: shut };
  }

  function mouth(g, s, mood, y) {
    var my = s * (y === undefined ? .40 : y), w = Math.max(3, s * .085);
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
    var i, a, x0 = s * .30, y0 = s * (cy === undefined ? .30 : cy), w = Math.max(1.6, s * .038);
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
    tick(function (t) {
      if (bob) { at(g, g.__home.x, g.__home.y + Math.sin(t / 640 + phase) * s * .05); }
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
    var lw = Math.max(2.4, s * .1);
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
    return g;
  }

  /* ==========================================================
     animal() — real silhouettes. Origin = centre of the head.
     o: {kind, x, y, size, fill, mood, look, flip, bob, blink, shadow}
     ========================================================== */
  var SPECIES = {};

  function animal(parent, o) {
    var kind = o.kind || 'cat';
    var g = G(parent, o.x, o.y);
    var s = o.size || 30;
    var fill = o.fill || '#C9A46B';
    var inner = S('g', {}, g);
    if (o.flip) { inner.setAttribute('transform', 'scale(-1,1)'); }
    var ctx = {
      g: inner, s: s, o: o, mood: o.mood || 'happy',
      lw: Math.max(2.4, s * .11),
      paint: bodyFill(parent, fill),
      dark: tint(fill, -42),
      light: tint(fill, 56)
    };
    var parts = (SPECIES[kind] || SPECIES.cat)(ctx);
    g.__home = { x: o.x, y: o.y };
    life(g, o, parts, s);
    g.__eyes = parts; g.__body = inner; g.__size = s; g.__kind = kind;
    return g;
  }

  function sleepy(parts, mood) {
    if (mood === 'sleep') { parts.open.setAttribute('opacity', '0'); parts.shut.setAttribute('opacity', '1'); }
    return parts;
  }

  /* --- cat: pointy ears, slim body, curling upright tail --- */
  SPECIES.cat = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.3, s * 1.2, s * .24); }
    var tail = 'M' + r2(s * .72) + ',' + r2(s * 1.5) + ' q' + r2(s * 1.15) + ',' + r2(-s * .18) + ' ' + r2(s * .88) + ',' + r2(-s * 1.2) + ' q' + r2(-s * .12) + ',' + r2(-s * .46) + ' ' + r2(-s * .52) + ',' + r2(-s * .18);
    ink(S('path', { d: tail, fill: 'none' }, g), lw * 2.4);
    ink(S('path', { d: tail, fill: 'none' }, g), lw * 1.4).setAttribute('stroke', c.paint);
    for (i = 0; i < 4; i++) {
      ink(S('line', { x1: s * (-.62 + i * .41), y1: s * 1.6, x2: s * (-.62 + i * .41), y2: s * 2.14 }, g), lw * 1.7);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.12, rx: s * .92, ry: s * .74, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .82) + ',' + r2(-s * .46) + ' L' + r2(-s * .76) + ',' + r2(-s * 1.34) + ' L' + r2(-s * .12) + ',' + r2(-s * .8) + ' Z', fill: c.paint }, g), lw);
    if (o.ears2 !== false) {
      ink(S('path', { d: 'M' + r2(s * .82) + ',' + r2(-s * .46) + ' L' + r2(s * .76) + ',' + r2(-s * 1.34) + ' L' + r2(s * .12) + ',' + r2(-s * .8) + ' Z', fill: c.paint }, g), lw);
    }
    S('path', { d: 'M' + r2(-s * .7) + ',' + r2(-s * .58) + ' L' + r2(-s * .66) + ',' + r2(-s * 1.08) + ' L' + r2(-s * .32) + ',' + r2(-s * .78) + ' Z', fill: '#FF8FA6', opacity: '.75' }, g);
    if (o.ears2 !== false) {
      S('path', { d: 'M' + r2(s * .7) + ',' + r2(-s * .58) + ' L' + r2(s * .66) + ',' + r2(-s * 1.08) + ' L' + r2(s * .32) + ',' + r2(-s * .78) + ' Z', fill: '#FF8FA6', opacity: '.75' }, g);
    }
    ink(S('circle', { cx: 0, cy: 0, r: s, fill: c.paint }, g), lw);
    S('ellipse', { cx: 0, cy: s * .42, rx: s * .52, ry: s * .38, fill: '#FFFFFF', opacity: '.26' }, g);
    var parts = sleepy(eyes(g, s, { spread: .38, y: -.12, r: .21, look: o.look }), c.mood);
    whiskers(g, s, .36);
    ink(S('path', { d: 'M' + r2(-s * .1) + ',' + r2(s * .3) + ' L' + r2(s * .1) + ',' + r2(s * .3) + ' L0,' + r2(s * .43) + ' Z', fill: '#FF7C96' }, g), lw * .55);
    mouth(g, s, c.mood, .58);
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .64, .32); }
    return parts;
  };

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

  /* --- dog: floppy ears, snout, tail up --- */
  SPECIES.dog = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.3, s * 1.25, s * .25); }
    ink(S('path', { d: 'M' + r2(s * .84) + ',' + r2(s * 1.2) + ' q' + r2(s * .82) + ',' + r2(-s * .12) + ' ' + r2(s * .64) + ',' + r2(-s * .86), fill: 'none' }, g), lw * 2.2);
    ink(S('path', { d: 'M' + r2(s * .84) + ',' + r2(s * 1.2) + ' q' + r2(s * .82) + ',' + r2(-s * .12) + ' ' + r2(s * .64) + ',' + r2(-s * .86), fill: 'none' }, g), lw * 1.3).setAttribute('stroke', c.paint);
    for (i = 0; i < 4; i++) {
      ink(S('rect', { x: s * (-.8 + i * .45), y: s * 1.48, width: s * .32, height: s * .7, rx: s * .15, fill: c.paint }, g), lw);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.12, rx: s * 1.0, ry: s * .74, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: -s * .98, cy: -s * .1, rx: s * .34, ry: s * .66, fill: c.dark }, g), lw);
    ink(S('ellipse', { cx: s * .98, cy: -s * .1, rx: s * .34, ry: s * .66, fill: c.dark }, g), lw);
    ink(S('circle', { cx: 0, cy: 0, r: s * .96, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * .52, rx: s * .5, ry: s * .36, fill: c.light }, g), lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .36, y: -.18, r: .185, look: o.look }), c.mood);
    ink(S('ellipse', { cx: 0, cy: s * .38, rx: s * .16, ry: s * .12, fill: INK }, g), lw * .5);
    ink(S('path', { d: 'M0,' + r2(s * .5) + ' L0,' + r2(s * .62) + ' M0,' + r2(s * .62) + ' q' + r2(-s * .18) + ',' + r2(s * .17) + ' ' + r2(-s * .27) + ',0 M0,' + r2(s * .62) + ' q' + r2(s * .18) + ',' + r2(s * .17) + ' ' + r2(s * .27) + ',0', fill: 'none' }, g), lw * .8);
    if (o.blush !== false) { blush(g, s, .68, .3); }
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

  /* --- bear: small round ears, chunky body, pale muzzle --- */
  SPECIES.bear = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.36, s * 1.36, s * .27); }
    for (i = 0; i < 2; i++) {
      ink(S('ellipse', { cx: s * (i ? .52 : -.52), cy: s * 1.84, rx: s * .36, ry: s * .32, fill: c.dark }, g), lw);
    }
    ink(S('ellipse', { cx: 0, cy: s * 1.12, rx: s * 1.08, ry: s * .84, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.24, rx: s * .58, ry: s * .5, fill: c.light }, g), lw * .7);
    ink(S('circle', { cx: -s * .74, cy: -s * .74, r: s * .33, fill: c.paint }, g), lw);
    ink(S('circle', { cx: s * .74, cy: -s * .74, r: s * .33, fill: c.paint }, g), lw);
    S('circle', { cx: -s * .74, cy: -s * .72, r: s * .17, fill: '#FF9FB2', opacity: '.6' }, g);
    S('circle', { cx: s * .74, cy: -s * .72, r: s * .17, fill: '#FF9FB2', opacity: '.6' }, g);
    ink(S('circle', { cx: 0, cy: 0, r: s, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * .48, rx: s * .46, ry: s * .34, fill: c.light }, g), lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .34, y: -.18, r: .17, look: o.look }), c.mood);
    ink(S('ellipse', { cx: 0, cy: s * .36, rx: s * .17, ry: s * .13, fill: INK }, g), lw * .5);
    mouth(g, s, c.mood, .64);
    if (o.blush !== false) { blush(g, s, .7, .2); }
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

  /* --- frog: eyes on TOP of a wide flat head, a mouth right across the
         face, splayed haunches and webbed feet. The frog puzzles used to
         draw a duck and a bunny; the words said frog and the picture said
         bird, which is the one thing a puzzle must never do. No beak here,
         no ears, and the silhouette is wider than it is tall. --- */
  SPECIES.frog = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.02, s * 1.34, s * .24); }
    /* back haunches, then the long webbed back feet */
    ink(S('path', { d: 'M' + r2(-s * .74) + ',' + r2(s * 1.0) + ' q' + r2(-s * .86) + ',' + r2(s * .16) + ' ' + r2(-s * .52) + ',' + r2(s * .88) + ' q' + r2(s * .3) + ',' + r2(s * .3) + ' ' + r2(s * .68) + ',' + r2(-s * .1) + ' Z', fill: c.dark }, g), lw);
    ink(S('path', { d: 'M' + r2(s * .74) + ',' + r2(s * 1.0) + ' q' + r2(s * .86) + ',' + r2(s * .16) + ' ' + r2(s * .52) + ',' + r2(s * .88) + ' q' + r2(-s * .3) + ',' + r2(s * .3) + ' ' + r2(-s * .68) + ',' + r2(-s * .1) + ' Z', fill: c.dark }, g), lw);
    for (i = 0; i < 2; i++) {
      var sx = i ? 1 : -1;
      ink(S('path', { d: 'M' + r2(sx * s * .96) + ',' + r2(s * 1.72) + ' q' + r2(sx * s * .62) + ',' + r2(-s * .06) + ' ' + r2(sx * s * .74) + ',' + r2(s * .3) + ' q' + r2(-sx * s * .34) + ',' + r2(s * .22) + ' ' + r2(-sx * s * .78) + ',' + r2(s * .04) + ' Z', fill: c.paint }, g), lw * .9);
    }
    /* squat wide body */
    ink(S('ellipse', { cx: 0, cy: s * 1.06, rx: s * 1.16, ry: s * .8, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.3, rx: s * .68, ry: s * .46, fill: c.light }, g), lw * .8);
    /* little front arms resting on the ground */
    ink(S('path', { d: 'M' + r2(-s * .52) + ',' + r2(s * 1.44) + ' q' + r2(-s * .26) + ',' + r2(s * .38) + ' ' + r2(s * .1) + ',' + r2(s * .48), fill: 'none' }, g), lw * 1.5);
    ink(S('path', { d: 'M' + r2(s * .52) + ',' + r2(s * 1.44) + ' q' + r2(s * .26) + ',' + r2(s * .38) + ' ' + r2(-s * .1) + ',' + r2(s * .48), fill: 'none' }, g), lw * 1.5);
    /* head: wider than tall, so it never reads as a round cat head */
    ink(S('ellipse', { cx: 0, cy: s * .1, rx: s * 1.04, ry: s * .78, fill: c.paint }, g), lw);
    /* the two eye domes sit ON TOP of the head, which is the whole tell */
    ink(S('circle', { cx: -s * .52, cy: -s * .58, r: s * .44, fill: c.paint }, g), lw);
    ink(S('circle', { cx: s * .52, cy: -s * .58, r: s * .44, fill: c.paint }, g), lw);
    var parts = sleepy(eyes(g, s, { spread: .52, y: -.58, r: .27, look: o.look }), c.mood);
    /* nostrils, then the wide mouth right across the face */
    S('circle', { cx: -s * .2, cy: s * .18, r: s * .07, fill: INK, opacity: '.7' }, g);
    S('circle', { cx: s * .2, cy: s * .18, r: s * .07, fill: INK, opacity: '.7' }, g);
    if (c.mood === 'sad') {
      ink(S('path', { d: 'M' + r2(-s * .68) + ',' + r2(s * .64) + ' q' + r2(s * .68) + ',' + r2(-s * .34) + ' ' + r2(s * 1.36) + ',0', fill: 'none' }, g), lw * .95);
    } else if (c.mood === 'flat') {
      ink(S('line', { x1: -s * .66, y1: s * .5, x2: s * .66, y2: s * .5 }, g), lw * .95);
    } else {
      ink(S('path', { d: 'M' + r2(-s * .78) + ',' + r2(s * .38) + ' q' + r2(s * .78) + ',' + r2(s * .48) + ' ' + r2(s * 1.56) + ',0', fill: 'none' }, g), lw * .95);
    }
    if (o.blush !== false && c.mood !== 'sad') { blush(g, s, .74, .34); }
    return parts;
  };

  /* --- hen: comb, wattle, short beak and a fan of tail feathers.
         The river crossing said "hen" and drew a duck. --- */
  SPECIES.hen = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o, i;
    if (o.shadow !== false) { shadow(g, 0, s * 2.12, s * 1.06, s * .2); }
    /* scaly legs with three toes each */
    for (i = 0; i < 2; i++) {
      var lx = i ? s * .34 : -s * .34;
      ink(S('line', { x1: lx, y1: s * 1.5, x2: lx, y2: s * 1.92 }, g), lw * 1.1).setAttribute('stroke', '#E8862A');
      ink(S('path', { d: 'M' + r2(lx - s * .28) + ',' + r2(s * 2.04) + ' L' + r2(lx) + ',' + r2(s * 1.92) + ' L' + r2(lx + s * .28) + ',' + r2(s * 2.04) + ' M' + r2(lx) + ',' + r2(s * 1.92) + ' L' + r2(lx) + ',' + r2(s * 2.08), fill: 'none' }, g), lw * .8).setAttribute('stroke', '#E8862A');
    }
    /* tail feathers, swept up behind */
    for (i = 0; i < 3; i++) {
      ink(S('path', { d: 'M' + r2(-s * .74) + ',' + r2(s * 1.06) + ' q' + r2(-s * (.9 + i * .16)) + ',' + r2(-s * (.16 + i * .3)) + ' ' + r2(-s * (.72 + i * .1)) + ',' + r2(-s * (.86 + i * .34)) + ' q' + r2(s * .5) + ',' + r2(s * .22) + ' ' + r2(s * .78) + ',' + r2(s * .82) + ' Z', fill: i === 1 ? c.dark : c.paint }, g), lw * .9);
    }
    /* plump body and a tucked wing */
    ink(S('ellipse', { cx: s * .04, cy: s * 1.04, rx: s * .96, ry: s * .8, fill: c.paint }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .5) + ',' + r2(s * .88) + ' q' + r2(s * .72) + ',' + r2(-s * .22) + ' ' + r2(s * .96) + ',' + r2(s * .3) + ' q' + r2(-s * .5) + ',' + r2(s * .46) + ' ' + r2(-s * .96) + ',' + r2(-s * .3) + ' Z', fill: c.dark }, g), lw * .85);
    /* head */
    ink(S('circle', { cx: 0, cy: 0, r: s * .78, fill: c.paint }, g), lw);
    /* comb: three red bumps along the top */
    ink(S('path', { d: 'M' + r2(-s * .44) + ',' + r2(-s * .62) + ' q' + r2(s * .04) + ',' + r2(-s * .42) + ' ' + r2(s * .3) + ',' + r2(-s * .2) + ' q' + r2(s * .06) + ',' + r2(-s * .38) + ' ' + r2(s * .32) + ',' + r2(-s * .16) + ' q' + r2(s * .1) + ',' + r2(-s * .32) + ' ' + r2(s * .3) + ',' + r2(-s * .02) + ' q' + r2(s * .06) + ',' + r2(s * .34) + ' ' + r2(-s * .16) + ',' + r2(s * .56) + ' Z', fill: '#E8434F' }, g), lw * .85);
    /* short beak and the wattle under it */
    ink(S('path', { d: 'M' + r2(s * .6) + ',' + r2(s * .1) + ' L' + r2(s * 1.14) + ',' + r2(s * .26) + ' L' + r2(s * .58) + ',' + r2(s * .44) + ' Z', fill: '#FFB02E' }, g), lw * .9);
    ink(S('ellipse', { cx: s * .58, cy: s * .6, rx: s * .16, ry: s * .22, fill: '#E8434F' }, g), lw * .8);
    var parts = sleepy(eyes(g, s, { spread: .3, y: -.16, r: .17, look: o.look }), c.mood);
    if (o.blush !== false) { blush(g, s, .56, .3); }
    return parts;
  };

  /* --- penguin: upright, white front, stubby flippers, orange feet.
         Added rather than reaching for a dark duck, which is the same
         mistake as the frog. --- */
  SPECIES.penguin = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    if (o.shadow !== false) { shadow(g, 0, s * 2.34, s * 1.0, s * .2); }
    ink(S('path', { d: 'M' + r2(-s * .5) + ',' + r2(s * 2.1) + ' q' + r2(-s * .5) + ',' + r2(s * .1) + ' ' + r2(-s * .16) + ',' + r2(s * .3) + ' l' + r2(s * .8) + ',0 Z', fill: '#FF9E2C' }, g), lw * .7);
    ink(S('path', { d: 'M' + r2(s * .5) + ',' + r2(s * 2.1) + ' q' + r2(s * .5) + ',' + r2(s * .1) + ' ' + r2(s * .16) + ',' + r2(s * .3) + ' l' + r2(-s * .8) + ',0 Z', fill: '#FF9E2C' }, g), lw * .7);
    /* upright body, taller than wide */
    ink(S('ellipse', { cx: 0, cy: s * 1.14, rx: s * .88, ry: s * 1.04, fill: c.paint }, g), lw);
    ink(S('ellipse', { cx: 0, cy: s * 1.26, rx: s * .56, ry: s * .82, fill: '#FFF6E6' }, g), lw * .8);
    /* flippers, held slightly out from the body */
    ink(S('path', { d: 'M' + r2(-s * .82) + ',' + r2(s * .68) + ' q' + r2(-s * .46) + ',' + r2(s * .5) + ' ' + r2(-s * .18) + ',' + r2(s * 1.06) + ' q' + r2(s * .3) + ',' + r2(-s * .16) + ' ' + r2(s * .42) + ',' + r2(-s * .72) + ' Z', fill: c.dark }, g), lw * .8);
    ink(S('path', { d: 'M' + r2(s * .82) + ',' + r2(s * .68) + ' q' + r2(s * .46) + ',' + r2(s * .5) + ' ' + r2(s * .18) + ',' + r2(s * 1.06) + ' q' + r2(-s * .3) + ',' + r2(-s * .16) + ' ' + r2(-s * .42) + ',' + r2(-s * .72) + ' Z', fill: c.dark }, g), lw * .8);
    /* head with a white face patch */
    ink(S('circle', { cx: 0, cy: 0, r: s * .82, fill: c.paint }, g), lw);
    S('path', { d: 'M0,' + r2(-s * .34) + ' q' + r2(s * .6) + ',' + r2(s * .1) + ' ' + r2(s * .48) + ',' + r2(s * .66) + ' q' + r2(-s * .48) + ',' + r2(s * .3) + ' ' + r2(-s * .96) + ',0 q' + r2(-s * .12) + ',' + r2(-s * .56) + ' ' + r2(s * .48) + ',' + r2(-s * .66) + ' Z', fill: '#FFF6E6' }, g);
    var parts = sleepy(eyes(g, s, { spread: .3, y: -.06, r: .16, look: o.look }), c.mood);
    ink(S('path', { d: 'M' + r2(-s * .2) + ',' + r2(s * .34) + ' L' + r2(s * .2) + ',' + r2(s * .34) + ' L0,' + r2(s * .68) + ' Z', fill: '#FF9E2C' }, g), lw * .6);
    if (o.blush !== false) { blush(g, s, .6, .3); }
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

  /* --- fish --- */
  SPECIES.fish = function (c) {
    var s = c.s, g = c.g, lw = c.lw, o = c.o;
    ink(S('path', { d: 'M' + r2(-s * .76) + ',0 l' + r2(-s * .64) + ',' + r2(-s * .58) + ' l0,' + r2(s * 1.16) + ' Z', fill: c.dark }, g), lw);
    ink(S('path', { d: 'M' + r2(-s * .1) + ',' + r2(-s * .64) + ' q' + r2(s * .3) + ',' + r2(-s * .5) + ' ' + r2(s * .54) + ',' + r2(s * .08), fill: c.dark }, g), lw * .9);
    ink(S('ellipse', { cx: 0, cy: 0, rx: s, ry: s * .72, fill: c.paint }, g), lw);
    S('ellipse', { cx: s * .06, cy: s * .28, rx: s * .5, ry: s * .28, fill: '#FFFFFF', opacity: '.2' }, g);
    var parts = eyes(g, s, { spread: 0, y: -.2, r: .19, look: o.look });
    parts.open.setAttribute('transform', 'translate(' + r2(s * .44) + ',0)');
    parts.shut.setAttribute('transform', 'translate(' + r2(s * .44) + ',0)');
    sleepy(parts, c.mood);
    ink(S('path', { d: 'M' + r2(s * .64) + ',' + r2(s * .3) + ' q' + r2(s * .16) + ',' + r2(s * .14) + ' ' + r2(s * .3) + ',0', fill: 'none' }, g), lw * .8);
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
    candy:  ['#FFD6E8', '#FFF3F8']
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

    if (kind === 'night') {
      var pts = [[38, 40, 8], [110, 24, 5], [176, 52, 4], [246, 30, 6], [312, 60, 5], [286, 96, 3.5], [72, 92, 4]];
      for (i = 0; i < pts.length; i++) { star(stage, pts[i][0], pts[i][1], pts[i][2], '#FFF6E6', 0); }
    }
    if (o.sun === 'sun') {
      S('circle', { cx: 300, cy: 50, r: 74, fill: glow(stage, '#FFD86B', .55) }, stage);
      var sg = S('g', {}, stage);
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
      }
    }

    var gy = o.groundY || 244;
    if (o.hills !== false && kind !== 'room') {
      var far = (kind === 'night') ? '#3A3070' : (kind === 'dusk' ? '#D97A5E' : '#A6DFC4');
      var mid = (kind === 'night') ? '#2E265C' : (kind === 'dusk' ? '#B85F52' : '#82CFA4');
      S('path', { d: 'M-6,' + (gy - 34) + ' Q70,' + (gy - 92) + ' 152,' + (gy - 40) + ' Q234,' + (gy - 96) + ' 366,' + (gy - 42) + ' L366,' + (H + 4) + ' L-6,' + (H + 4) + ' Z', fill: far, opacity: '.85' }, stage);
      S('path', { d: 'M-6,' + (gy - 12) + ' Q92,' + (gy - 56) + ' 188,' + (gy - 16) + ' Q272,' + (gy - 52) + ' 366,' + (gy - 14) + ' L366,' + (H + 4) + ' L-6,' + (H + 4) + ' Z', fill: mid, opacity: '.9' }, stage);
    }
    if (o.ground !== false) {
      var gc = o.ground || (kind === 'night' ? '#3E3372' : (kind === 'room' ? '#C08D57' : (kind === 'water' ? '#79C98F' : '#69C486')));
      var top = 'M-6,' + gy + ' Q90,' + (gy - 13) + ' 180,' + gy + ' T366,' + gy;
      S('path', { d: top + ' L366,' + (H + 4) + ' L-6,' + (H + 4) + ' Z', fill: gc }, stage);
      ink(S('path', { d: top, fill: 'none' }, stage), 4);
      if (o.tufts !== false && kind !== 'room' && kind !== 'water' && kind !== 'sea') {
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
    tick: tick, stopAll: stopAll, INK: INK, species: SPECIES
  };
})();
