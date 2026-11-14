/* ==========================================================
   Brain Snacks — kit
   The handful of building blocks every puzzle pack and game uses.
   Each of these used to be copy-pasted at the top of three files.
   Stage is 360 x 300 (puzzles) or 360 x 420 (games).
   ========================================================== */

var KIT = (function () {
  'use strict';

  var A = ART, S = A.S, G = A.G, ink = A.ink, txt = A.txt;

  function hit(x, y, tx, ty, r) { return Math.abs(x - tx) < (r || 44) && Math.abs(y - ty) < (r || 44); }

  /* An invisible pad so thin lines and off-centre art are still easy for a
     small finger to hit. */
  function pad(g, w, h, dy) {
    return S('rect', {
      x: -w / 2, y: -h / 2 + (dy || 0), width: w, height: h, rx: 10,
      fill: '#FFFFFF', opacity: '0', 'pointer-events': 'all'
    }, g);
  }

  /* a shape in one call */
  function glyph(parent, kind, size, fill, stroke) {
    var e;
    if (kind === 'circle') { e = S('circle', { cx: 0, cy: 0, r: size, fill: fill }, parent); }
    else if (kind === 'square') { e = S('rect', { x: -size, y: -size, width: size * 2, height: size * 2, rx: size * .2, fill: fill }, parent); }
    else if (kind === 'triangle') { e = S('path', { d: 'M0,' + (-size * 1.1) + ' L' + size + ',' + (size * .8) + ' L' + (-size) + ',' + (size * .8) + ' Z', fill: fill }, parent); }
    else if (kind === 'diamond') { e = S('path', { d: 'M0,' + (-size * 1.15) + ' L' + size + ',0 L0,' + (size * 1.15) + ' L' + (-size) + ',0 Z', fill: fill }, parent); }
    else if (kind === 'star') { return A.star(parent, 0, 0, size * 1.15, fill, stroke === 0 ? 0 : 3); }
    else if (kind === 'heart') {
      e = S('path', { d: 'M0,' + (size * .95) + ' C' + (-size * 1.5) + ',' + (-size * .1) + ' ' + (-size * .7) + ',' + (-size * 1.2) + ' 0,' + (-size * .4) +
        ' C' + (size * .7) + ',' + (-size * 1.2) + ' ' + (size * 1.5) + ',' + (-size * .1) + ' 0,' + (size * .95) + ' Z', fill: fill }, parent);
    }
    else { e = S('ellipse', { cx: 0, cy: 0, rx: size * 1.15, ry: size * .72, fill: fill }, parent); }
    if (stroke !== 0) { ink(e, stroke || 3); }
    return e;
  }

  /* a framed cell */
  function frame(parent, x, y, w, h, fill) {
    var g = G(parent, x, y);
    ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 9, fill: fill || '#FFF6E6' }, g), 3);
    return g;
  }

  /* tappable option cards. draw(g, i) paints each; one index is right. */
  function options(st, y, draw, rightIndex, xs, size) {
    xs = xs || [72, 180, 288];
    size = size || 80;
    for (var i = 0; i < xs.length; i++) {
      (function (i) {
        var g = G(st, xs[i], y);
        pad(g, size + 12, size + 12);
        ink(S('rect', { x: -size / 2, y: -size / 2, width: size, height: size, rx: 12, fill: '#FFF6E6' }, g), 3);
        draw(g, i);
        BS.tap(g, function () { if (i === rightIndex) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }

  /* N cards in a row, tap two to swap, win when they read 0,1,2... */
  function orderGame(st, y, drawOne, start, xs, w, h) {
    var n = start.length;
    xs = xs || (n === 3 ? [66, 180, 294] : [50, 137, 223, 310]);
    w = w || (n === 3 ? 104 : 80); h = h || 128;
    var order = start.slice(), picked = -1, cards = [];
    for (var i = 0; i < n; i++) {
      (function (slot) {
        var g = G(st, xs[slot], y);
        pad(g, w - 4, h - 4);
        drawOne(g, order[slot]);
        var ring = ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 16, fill: 'none' }, g), 5);
        ring.setAttribute('stroke', '#FF8A3D');
        ring.setAttribute('opacity', '0');
        var card = { g: g, ring: ring };
        cards[slot] = card;
        BS.tap(g, function () { pick(cards.indexOf(card)); });
      })(i);
    }
    function sorted() {
      for (var k = 0; k < n; k++) { if (order[k] !== k) { return false; } }
      return true;
    }
    function pick(slot) {
      if (slot < 0) { return; }
      if (picked === -1) { picked = slot; cards[slot].ring.setAttribute('opacity', '1'); BS.SFX.tap(); return; }
      if (picked === slot) { picked = -1; cards[slot].ring.setAttribute('opacity', '0'); return; }
      cards[picked].ring.setAttribute('opacity', '0');
      var a = picked, b = slot, t = order[a];
      order[a] = order[b]; order[b] = t;
      BS.glide(cards[a].g, xs[b], y); BS.glide(cards[b].g, xs[a], y);
      t = cards[a]; cards[a] = cards[b]; cards[b] = t;
      picked = -1; BS.SFX.drop();
      BS.later(function () { if (sorted()) { BS.win(); } else { BS.nope(); } }, 320);
    }
  }

  /* a chunky SVG button */
  function button(st, x, y, w, label, col, fn, h) {
    h = h || 34;
    var g = G(st, x, y);
    pad(g, w + 10, h + 10);
    S('rect', { x: -w / 2, y: -h / 2 + 4, width: w, height: h, rx: 10, fill: A.tint(col, -60) }, g);
    var face = ink(S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 10, fill: col }, g), 3.5);
    S('rect', { x: -w / 2 + 6, y: -h / 2 + 5, width: w - 12, height: 6, rx: 3, fill: '#FFFFFF', opacity: '.3' }, g);
    var t = txt(label, { x: 0, y: 5.5, 'font-size': 14, fill: '#241534' }, g);
    BS.tap(g, function () { fn(g); });
    g.__face = face; g.__label = t;
    return g;
  }

  /* the dark play-field every arcade game starts from */
  function backdrop(arena, c1, c2) {
    A.clear(arena);
    S('rect', { x: 0, y: 0, width: 360, height: 420, fill: A.vgrad(arena, c1 || '#3B2757', c2 || '#2B1B3F') }, arena);
    for (var i = 0; i < 6; i++) {
      A.star(arena, 26 + i * 62, 18 + (i % 3) * 10, 3 + (i % 2) * 1.5, '#FFF6E6', 0).setAttribute('opacity', '.22');
    }
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function hearts(lives, of) {
    var s = '';
    for (var i = 0; i < (of || 3); i++) { s += (i < lives) ? '\u2665' : '\u2661'; }
    return s;
  }
  /* a cream banner across the top of the arena */
  function banner(arena, text, y) {
    var g = G(arena, 180, y || 30);
    ink(S('rect', { x: -160, y: -19, width: 320, height: 38, rx: 13, fill: '#FFF6E6' }, g), 3.5);
    g.__label = txt(text, { x: 0, y: 6, 'font-size': 16, fill: '#241534' }, g);
    g.style.pointerEvents = 'none';
    return g;
  }

  return { hit: hit, pad: pad, glyph: glyph, frame: frame, options: options, orderGame: orderGame,
           button: button, backdrop: backdrop, shuffle: shuffle, rnd: rnd, hearts: hearts, banner: banner };
})();

/* Every animal the art file can draw, with the colour it is usually given.
   Games that just need "some animals" take them from here. */
KIT.ZOO = [
  { k: 'mouse', f: '#C9BFD6' }, { k: 'frog', f: '#5FD08A' }, { k: 'duck', f: '#FFE066' },
  { k: 'hen', f: '#FFF0C0' }, { k: 'bunny', f: '#F5E2D0' }, { k: 'cat', f: '#FFB03A' },
  { k: 'fox', f: '#E8722F' }, { k: 'dog', f: '#C98B52' }, { k: 'pig', f: '#FF9FB2' },
  { k: 'lion', f: '#E8A63A' }, { k: 'bear', f: '#B07A4C' }, { k: 'elephant', f: '#A9A6C4' },
  { k: 'owl', f: '#C58B4F' }, { k: 'penguin', f: '#4A5578' }, { k: 'monkey', f: '#A8713F' },
  { k: 'cow', f: '#FFF6E6' }, { k: 'sheep', f: '#FFF6E6' }, { k: 'turtle', f: '#7FCF7A' },
  { k: 'panda', f: '#FFFFFF' }, { k: 'tiger', f: '#F59A3A' }
];
