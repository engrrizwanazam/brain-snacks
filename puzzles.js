/* ==========================================================
   Brain Snacks — pack 1: the original trick puzzles.
   { d, ask, hint, tell, why, build(stage) }
   `d` is the puzzle's place on the difficulty ladder; the engine sorts by it,
   so the order in this file does not matter.
   Stage is 360 x 300 units. BS.win() / BS.nope(el).
   ========================================================== */

BS.addPuzzles((function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, at = A.at, ink = A.ink, txt = A.txt;
  var critter = A.critter, animal = A.animal, star = A.star, scene = A.scene, drop = A.shadow;
  var tap = BS.tap, drag = BS.drag, glide = BS.glide;
  var hit = KIT.hit, pad = KIT.pad, orderGame = KIT.orderGame;

  return [

/* 1 */ {
  d: 1,
  ask: 'Which one is really the biggest?',
  hint: "Don't trust the drawing. Which one is biggest in real life?",
  tell: 'Tap the elephant, even though it is drawn tiny.',
  why: 'The elephant was drawn tiny to fool you. It is still an elephant.',
  build: function (st) {
    scene(st, 'meadow', { sun: 'sun', clouds: true, flowers: true });
    var m = animal(st, { kind: 'mouse', x: 80, y: 168, size: 34, fill: '#C9BFD6' });
    tap(m, function () { BS.nope(m); });
    var c = animal(st, { kind: 'cat', x: 190, y: 193, size: 20, fill: '#FFB03A' });
    tap(c, function () { BS.nope(c); });
    var e = animal(st, { kind: 'elephant', x: 296, y: 208, size: 13, fill: '#A9A6C4' });
    tap(e, function () { BS.win(); });
  }
},

/* 2 */ {
  d: 2,
  ask: 'One cat is not like the others. Tap it.',
  hint: 'Look at the tops of their heads.',
  tell: 'One cat is missing an ear — middle row, on the right.',
  why: 'Eight cats had two ears. One had one. Your eyes caught it.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var odd = 5;
    for (var i = 0; i < 9; i++) {
      (function (i) {
        var g = animal(st, {
          kind: 'cat', x: 72 + (i % 3) * 108, y: 56 + Math.floor(i / 3) * 88,
          size: 18, fill: '#FF9A6B', ears2: (i !== odd)
        });
        tap(g, function () { if (i === odd) { BS.win(); } else { BS.nope(g); } });
      })(i);
    }
  }
},

/* 3 */ {
  d: 18,
  ask: 'How many ducks are on the pond?',
  hint: 'Are you sure you can see them all? Try moving things around.',
  tell: 'Drag the bush and the rock away. There are 7.',
  why: 'Four were easy. Three were hiding. Counting only works if you look everywhere.',
  build: function (st) {
    scene(st, 'water', { hills: false, ground: '#8ED6A0', groundY: 250 });
    ink(S('ellipse', { cx: 180, cy: 196, rx: 164, ry: 78, fill: '#6FC0E4' }, st), 4);
    S('ellipse', { cx: 180, cy: 176, rx: 130, ry: 42, fill: '#FFFFFF', opacity: '.16' }, st);
    var spots = [[70, 150], [140, 176], [232, 150], [300, 184], [98, 222], [186, 228], [268, 224]];
    for (var i = 0; i < 7; i++) {
      animal(st, { kind: 'duck', x: spots[i][0], y: spots[i][1] - 24, size: 15, fill: '#FFE066', shadow: false });
    }
    var bush = G(st, 96, 220);
    ink(S('circle', { cx: -25, cy: 4, r: 29, fill: '#4CA85E' }, bush));
    ink(S('circle', { cx: 21, cy: 6, r: 25, fill: '#4CA85E' }, bush));
    ink(S('circle', { cx: 0, cy: -17, r: 29, fill: '#5BBC6D' }, bush));
    S('circle', { cx: -8, cy: -26, r: 12, fill: '#FFFFFF', opacity: '.2' }, bush);
    drag(bush);
    var rock = G(st, 272, 222);
    ink(S('path', { d: 'M-35,21 q-8,-33 17,-37 q29,-13 39,15 q10,21 -12,25 z', fill: '#B7B2C4' }, rock));
    S('ellipse', { cx: -8, cy: -6, rx: 12, ry: 7, fill: '#FFFFFF', opacity: '.25' }, rock);
    drag(rock);
    BS.chips(['4', '5', '6', '7'], 3);
  }
},

/* 4 */ {
  d: 11,
  ask: 'Which glass has more juice?',
  hint: 'Tall is not the same as big. Think about how wide they are too.',
  tell: 'The short fat glass. It holds more even though it looks smaller.',
  why: 'The tall glass is skinny. The short one is fat. Fat wins here.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 236 });
    var a = G(st, 108, 98);
    drop(st, 108, 212, 30, 8, .16);
    ink(S('path', { d: 'M-22,-56 L-18,110 L18,110 L22,-56 Z', fill: '#EAF6FA', opacity: '.92' }, a));
    ink(S('path', { d: 'M-20,-16 L-18,108 L18,108 L20,-16 Z', fill: '#FF9A3D' }, a), 3);
    S('rect', { x: -14, y: -10, width: 6, height: 108, fill: '#FFFFFF', opacity: '.3' }, a);
    tap(a, function () { BS.nope(a); });
    var b = G(st, 252, 130);
    drop(st, 252, 212, 56, 9, .16);
    ink(S('path', { d: 'M-54,-26 L-48,78 L48,78 L54,-26 Z', fill: '#EAF6FA', opacity: '.92' }, b));
    ink(S('path', { d: 'M-52,0 L-48,76 L48,76 L52,0 Z', fill: '#FF9A3D' }, b), 3);
    S('rect', { x: -44, y: 6, width: 8, height: 68, fill: '#FFFFFF', opacity: '.3' }, b);
    tap(b, function () { BS.win(); });
  }
},

/* 5 */ {
  d: 10,
  ask: 'The owl wants to wake up. Help him!',
  hint: 'Owls only wake up at night. Can you get rid of the daytime?',
  tell: 'Drag the sun down off the bottom of the screen.',
  why: 'Owls sleep in the day and wake at night. You changed the time of day.',
  build: function (st) {
    scene(st, 'day', { hills: true, ground: '#7FD094', vignette: false });
    var night = S('rect', { x: 0, y: 0, width: 360, height: 300, fill: '#2C2A64', opacity: '0' }, st);
    night.style.pointerEvents = 'none';
    var sky = G(st, 0, 0);
    sky.setAttribute('opacity', '0');
    sky.style.pointerEvents = 'none';
    star(sky, 46, 44, 9, '#FFF6E6', 0);
    star(sky, 130, 26, 6, '#FFF6E6', 0);
    star(sky, 300, 52, 8, '#FFF6E6', 0);
    star(sky, 242, 30, 5, '#FFF6E6', 0);
    ink(S('rect', { x: 152, y: 150, width: 26, height: 104, fill: '#8A5F3B' }, st), 4);
    ink(S('path', { d: 'M165,168 L296,150', fill: 'none' }, st), 9);
    var owl = animal(st, { kind: 'owl', x: 258, y: 116, size: 22, fill: '#C58B4F', mood: 'sleep', shadow: false });
    /* The z's used to drift up and to the RIGHT, straight underneath the sun
       at (300,56) -- one was completely hidden and the other 41% covered.
       The sun owns the top-right corner, so they drift left instead. */
    var z = G(owl.__body, -30, -26);
    txt('z', { x: 0, y: 0, 'font-size': 14, fill: '#fff', stroke: '#241534', 'stroke-width': 3, 'paint-order': 'stroke' }, z);
    txt('z', { x: -13, y: -14, 'font-size': 19, fill: '#fff', stroke: '#241534', 'stroke-width': 3, 'paint-order': 'stroke' }, z);
    tap(owl, function () { BS.nope(owl); });

    var sun = G(st, 300, 56);
    var rays = S('g', {}, sun);
    for (var i = 0; i < 8; i++) {
      var an = i * Math.PI / 4;
      ink(S('line', {
        x1: Math.cos(an) * 30, y1: Math.sin(an) * 30,
        x2: Math.cos(an) * 44, y2: Math.sin(an) * 44
      }, rays), 5).setAttribute('stroke', '#F5A623');
    }
    ink(S('circle', { cx: 0, cy: 0, r: 27, fill: '#FFC93C' }, sun));
    S('ellipse', { cx: -8, cy: -9, rx: 11, ry: 8, fill: '#FFFFFF', opacity: '.35' }, sun);
    var done = false;
    drag(sun, {
      onMove: function (x, y) {
        var k = Math.max(0, Math.min(1, (y - 130) / 150));
        night.setAttribute('opacity', k * .92);
        sky.setAttribute('opacity', k);
        if (!done && y > 268) {
          done = true;
          night.setAttribute('opacity', '.92'); sky.setAttribute('opacity', '1');
          z.setAttribute('opacity', '0');
          owl.__eyes.shut.setAttribute('opacity', '0');
          owl.__eyes.open.setAttribute('opacity', '1');
          BS.later(BS.win, 320);
        }
      }
    });
  }
},

/* 6 */ {
  d: 13,
  ask: 'Which one is heavier?',
  hint: 'Big does not always mean heavy. What is it made of?',
  tell: 'The little metal ball.',
  why: 'A huge pile of feathers weighs almost nothing. A small lump of metal does not.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    ink(S('rect', { x: 172, y: 118, width: 16, height: 152, rx: 4, fill: '#8A7BA8' }, st), 4);
    ink(S('path', { d: 'M60,114 L300,114', fill: 'none' }, st), 8);
    ink(S('line', { x1: 78, y1: 116, x2: 78, y2: 148 }, st), 4);
    ink(S('line', { x1: 282, y1: 116, x2: 282, y2: 148 }, st), 4);
    ink(S('path', { d: 'M34,148 L122,148 L108,180 L48,180 Z', fill: '#C9BEE2' }, st));
    ink(S('path', { d: 'M238,148 L326,148 L312,180 L252,180 Z', fill: '#C9BEE2' }, st));
    var f = G(st, 78, 116);
    for (var i = 0; i < 7; i++) {
      var fx = -30 + i * 10, fy = -14 - (i % 3) * 12;
      ink(S('ellipse', { cx: fx, cy: fy, rx: 17, ry: 8, fill: '#FFFDF6',
        transform: 'rotate(' + (-30 + i * 12) + ' ' + fx + ' ' + fy + ')' }, f), 3);
    }
    tap(f, function () { BS.nope(f); });
    var b = G(st, 282, 130);
    ink(S('circle', { cx: 0, cy: 0, r: 17, fill: '#6E6E86' }, b));
    S('circle', { cx: -6, cy: -6, r: 5, fill: '#C5C5D8', opacity: '.85' }, b);
    tap(b, function () { BS.win(); });
  }
},

/* 7 */ {
  d: 5,
  ask: 'Water is escaping! Block the hole.',
  hint: 'Only one lid is the right shape for that hole.',
  tell: 'Drag the star-shaped lid onto the star-shaped hole.',
  why: 'A hole can only be filled by the same shape. Circles will not do.',
  build: function (st) {
    scene(st, 'meadow', { hills: false });
    ink(S('rect', { x: 40, y: 42, width: 128, height: 154, rx: 16, fill: '#9FB4C7' }, st), 4);
    ink(S('rect', { x: 40, y: 42, width: 128, height: 22, rx: 10, fill: '#B9CBDA' }, st), 4);
    S('rect', { x: 52, y: 74, width: 16, height: 110, rx: 8, fill: '#FFFFFF', opacity: '.25' }, st);
    var hx = 104, hy = 128;
    star(st, hx, hy, 24, '#241534', 3);
    var spray = S('g', {}, st);
    for (var i = 0; i < 5; i++) {
      ink(S('path', { d: 'M' + (hx + 22) + ',' + hy + ' q40,' + (-14 + i * 12) + ' 86,' + (30 + i * 16), fill: 'none' }, spray), 5)
        .setAttribute('stroke', '#4FA8D8');
    }
    var lids = [
      { sh: 'circle', x: 238, y: 64, col: '#FF8A3D' },
      { sh: 'star', x: 302, y: 156, col: '#FFC93C' },
      { sh: 'square', x: 234, y: 238, col: '#F0466F' }
    ];
    for (i = 0; i < lids.length; i++) {
      (function (L) {
        var g = G(st, L.x, L.y);
        if (L.sh === 'circle') { ink(S('circle', { cx: 0, cy: 0, r: 23, fill: L.col }, g)); }
        else if (L.sh === 'square') { ink(S('rect', { x: -21, y: -21, width: 42, height: 42, rx: 5, fill: L.col }, g)); }
        else { star(g, 0, 0, 25, L.col); }
        drag(g, { onDrop: function (x, y, back) {
          if (!hit(x, y, hx, hy, 36)) { return; }
          if (L.sh === 'star') { glide(g, hx, hy); spray.setAttribute('opacity', '0'); BS.later(BS.win, 300); }
          else { BS.nope(g); glide(g, back.x, back.y); }
        } });
      })(lids[i]);
    }
  }
},

/* 8 */ {
  d: 12,
  ask: 'What comes next on the belt?',
  hint: 'Say the colours out loud, left to right. What is the pattern?',
  tell: 'Drag the blue square into the empty space.',
  why: 'Red, blue, red, blue, red... patterns keep their promise.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    ink(S('rect', { x: 0, y: 148, width: 360, height: 30, fill: '#8A7BA8' }, st), 4);
    for (var k = 0; k < 7; k++) { ink(S('circle', { cx: 26 + k * 52, cy: 163, r: 7, fill: '#B6A9CE' }, st), 3); }
    var seq = ['r', 'b', 'r', 'b', 'r'];
    for (var i = 0; i < 5; i++) {
      if (seq[i] === 'r') { ink(S('circle', { cx: 34 + i * 54, cy: 120, r: 22, fill: '#F0466F' }, st)); }
      else { ink(S('rect', { x: 12 + i * 54, y: 98, width: 44, height: 44, rx: 6, fill: '#4A9BE8' }, st)); }
    }
    var sx = 34 + 5 * 54;
    ink(S('rect', { x: sx - 25, y: 95, width: 50, height: 50, rx: 8, fill: 'none', 'stroke-dasharray': '9 7' }, st), 3);
    txt('?', { x: sx, y: 132, 'font-size': 30, fill: '#8A7BA8' }, st);
    var opts = [{ t: 'r', x: 66, y: 246 }, { t: 'b', x: 180, y: 246 }, { t: 'g', x: 294, y: 246 }];
    for (i = 0; i < opts.length; i++) {
      (function (O) {
        var g = G(st, O.x, O.y);
        if (O.t === 'r') { ink(S('circle', { cx: 0, cy: 0, r: 22, fill: '#F0466F' }, g)); }
        else if (O.t === 'b') { ink(S('rect', { x: -22, y: -22, width: 44, height: 44, rx: 6, fill: '#4A9BE8' }, g)); }
        else { ink(S('path', { d: 'M0,-24 L24,20 L-24,20 Z', fill: '#3FBF7F' }, g)); }
        drag(g, { onDrop: function (x, y, back) {
          if (!hit(x, y, sx, 120, 44)) { return; }
          if (O.t === 'b') { glide(g, sx, 120); BS.later(BS.win, 280); }
          else { BS.nope(g); glide(g, back.x, back.y); }
        } });
      })(opts[i]);
    }
  }
},

/* 9 */ {
  d: 24,
  ask: 'How many legs are there altogether?',
  hint: 'Each dog has four legs. The duck has two. Count them all.',
  tell: 'Four and four and two makes ten.',
  why: 'Two dogs with four legs each, plus a duck with two. Counting in groups is quicker.',
  build: function (st) {
    scene(st, 'meadow', { hills: true, groundY: 226 });
    animal(st, { kind: 'dog', x: 88, y: 140, size: 26, fill: '#C98B52' });
    animal(st, { kind: 'dog', x: 236, y: 176, size: 26, fill: '#D9A06A' });
    animal(st, { kind: 'duck', x: 306, y: 96, size: 19, fill: '#FFE066' });
    BS.chips(['8', '10', '12', '6'], 1);
  }
},

/* 10 */ {
  d: 20,
  ask: 'Turn on the lamp.',
  hint: 'The switch is not broken. Something else is not connected.',
  tell: 'Drag the plug into the socket first, then tap the switch.',
  why: 'Some things only work in the right order. Power first, switch second.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 232 });
    var glow = S('circle', { cx: 105, cy: 118, r: 44, fill: A.glow(st, '#FFD86B', .75), opacity: '0' }, st);
    var shade = ink(S('path', { d: 'M56,96 L154,96 L138,44 L72,44 Z', fill: '#F0466F' }, st));
    var bulb = ink(S('circle', { cx: 105, cy: 116, r: 15, fill: '#CFCBD8' }, st));
    ink(S('line', { x1: 105, y1: 96, x2: 105, y2: 232 }, st), 6);
    var plugged = false;
    ink(S('rect', { x: 264, y: 194, width: 54, height: 40, rx: 7, fill: '#EDE4D4' }, st), 4);
    S('circle', { cx: 279, cy: 212, r: 4.5, fill: '#241534' }, st);
    S('circle', { cx: 303, cy: 212, r: 4.5, fill: '#241534' }, st);
    var plug = G(st, 76, 266);
    ink(S('rect', { x: -22, y: -16, width: 44, height: 32, rx: 6, fill: '#4A4258' }, plug));
    ink(S('line', { x1: 8, y1: -7, x2: 26, y2: -7 }, plug), 5);
    ink(S('line', { x1: 8, y1: 7, x2: 26, y2: 7 }, plug), 5);
    drag(plug, { onDrop: function (x, y) {
      if (!plugged && hit(x, y, 262, 212, 46)) { plugged = true; glide(plug, 262, 212); BS.SFX.good(); }
    } });
    var sw = G(st, 300, 94);
    ink(S('rect', { x: -22, y: -30, width: 44, height: 60, rx: 9, fill: '#EDE4D4' }, sw));
    var knob = ink(S('rect', { x: -13, y: -3, width: 26, height: 22, rx: 5, fill: '#8A7BA8' }, sw));
    tap(sw, function () {
      if (!plugged) { BS.nope(sw); return; }
      knob.setAttribute('y', '-19'); knob.setAttribute('fill', '#3FBF7F');
      bulb.setAttribute('fill', '#FFE58A');
      glow.setAttribute('opacity', '1');
      shade.setAttribute('fill', '#FF6F92');
      BS.later(BS.win, 320);
    });
  }
},

/* 11 */ {
  d: 7,
  ask: 'Put the story in order. Tap two to swap them.',
  hint: 'Which one happens first, right at the very beginning?',
  tell: 'Seed first, then the little sprout, then the flower.',
  why: 'Seed, sprout, flower. Everything that grows takes its turn in order.',
  build: function (st) {
    scene(st, 'day', { hills: false, ground: false });
    orderGame(st, 152, function (g, kind) {
      ink(S('rect', { x: -46, y: -58, width: 92, height: 116, rx: 12, fill: '#FFF6E6' }, g));
      ink(S('rect', { x: -40, y: 22, width: 80, height: 30, rx: 6, fill: '#B07A4C' }, g), 3);
      if (kind === 0) {
        ink(S('ellipse', { cx: 0, cy: 36, rx: 11, ry: 14, fill: '#6E4A28' }, g), 3);
      } else if (kind === 1) {
        ink(S('line', { x1: 0, y1: 24, x2: 0, y2: -6 }, g), 5).setAttribute('stroke', '#3FBF7F');
        ink(S('ellipse', { cx: -15, cy: -4, rx: 15, ry: 9, fill: '#5FD08A' }, g), 3);
        ink(S('ellipse', { cx: 15, cy: -14, rx: 15, ry: 9, fill: '#5FD08A' }, g), 3);
      } else {
        ink(S('line', { x1: 0, y1: 24, x2: 0, y2: -22 }, g), 5).setAttribute('stroke', '#3FBF7F');
        ink(S('ellipse', { cx: -17, cy: 4, rx: 14, ry: 8, fill: '#5FD08A' }, g), 3);
        for (var i = 0; i < 6; i++) {
          var a = i * Math.PI / 3;
          ink(S('ellipse', { cx: Math.cos(a) * 17, cy: -32 + Math.sin(a) * 17, rx: 11, ry: 11, fill: '#F0466F' }, g), 3);
        }
        ink(S('circle', { cx: 0, cy: -32, r: 9, fill: '#FFC93C' }, g));
      }
    }, [2, 0, 1]);
  }
},

/* 12 */ {
  d: 30,
  ask: 'This flower is very thirsty.',
  hint: 'There is a cloud up there. What do clouds do when you squeeze them?',
  tell: 'Rub the cloud left and right, again and again, until it rains.',
  why: 'Plants drink through their roots. No water, no flower.',
  build: function (st) {
    scene(st, 'day', { hills: false, ground: '#B07A4C', groundY: 236, tufts: false });
    var pot = G(st, 180, 198);
    ink(S('path', { d: 'M-40,-4 L40,-4 L30,54 L-30,54 Z', fill: '#D9743C' }, pot));
    S('path', { d: 'M-34,0 L-24,0 L-18,50 L-28,50 Z', fill: '#FFFFFF', opacity: '.2' }, pot);
    var plant = G(st, 180, 194);
    var stem = ink(S('path', { d: 'M0,0 q-34,-22 -22,-52', fill: 'none' }, plant), 6);
    stem.setAttribute('stroke', '#3FBF7F');
    var head = G(plant, -24, -54), petals = [];
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3;
      petals.push(ink(S('ellipse', { cx: Math.cos(a) * 20, cy: Math.sin(a) * 20, rx: 13, ry: 13, fill: '#C98BA0' }, head), 3));
    }
    ink(S('circle', { cx: 0, cy: 0, r: 11, fill: '#D8C060' }, head));
    var cloud = G(st, 180, 60);
    var p1 = ink(S('circle', { cx: -30, cy: 6, r: 24, fill: '#F2F7FB' }, cloud));
    var p2 = ink(S('circle', { cx: 30, cy: 8, r: 20, fill: '#F2F7FB' }, cloud));
    var p3 = ink(S('circle', { cx: 0, cy: -10, r: 30, fill: '#FFFFFF' }, cloud));
    var last = 180, dist = 0, raining = false;
    var SHADES = ['#FFFFFF', '#E4EBF2', '#C4D0DC', '#9FB4C7'];
    drag(cloud, {
      clamp: [64, 44, 296, 90],
      onMove: function (x) {
        if (raining) { return; }
        dist += Math.abs(x - last); last = x;
        var step = Math.min(3, Math.floor(dist / 170));
        p3.setAttribute('fill', SHADES[step]);
        p1.setAttribute('fill', SHADES[Math.max(0, step - 1)]);
        p2.setAttribute('fill', SHADES[Math.max(0, step - 1)]);
        if (dist <= 510) { return; }
        raining = true;
        var drops = S('g', {}, st);
        for (var k = 0; k < 9; k++) {
          (function (k) {
            var dp = G(drops, 110 + k * 18, 94);
            ink(S('path', { d: 'M0,-9 q7,9 0,14 q-7,-5 0,-14', fill: '#4FA8D8' }, dp), 2);
            var t0 = Date.now() + k * 90;
            A.tick(function () {
              var e = Date.now() - t0;
              if (e > 0) { at(dp, 110 + k * 18, 94 + (e / 3) % 108); }
            });
          })(k);
        }
        BS.later(function () {
          stem.setAttribute('d', 'M0,0 L0,-58'); at(head, 0, -60);
          for (var p = 0; p < petals.length; p++) { petals[p].setAttribute('fill', '#F0466F'); }
          BS.win();
        }, 1000);
      }
    });
  }
},

/* 13 */ {
  d: 27,
  ask: 'Every monster needs one cookie.',
  hint: 'Only two cookies down here. Is there anything round up in the sky?',
  tell: 'Drag the moon down to the last monster. It was a cookie all along.',
  why: 'Three monsters, three cookies. You just had to look further than the plate.',
  build: function (st) {
    scene(st, 'night', { hills: true, ground: '#3E3372' });
    var spots = [[70, 200], [180, 200], [290, 200]];
    var cols = ['#3FBF7F', '#6EC6E8', '#F0466F'];
    var mons = [], fed = 0;
    for (var i = 0; i < 3; i++) {
      mons.push(critter(st, { x: spots[i][0], y: spots[i][1], size: 30, fill: cols[i], ears: 'round', mood: 'sad' }));
    }
    function feed(m, idx, food) {
      if (m.__fed) { return false; }
      m.__fed = true;
      food.setAttribute('opacity', '0');
      m.__eyes.open.setAttribute('opacity', '1');
      A.ink(S('path', { d: 'M-8,13 q8,10 16,0', fill: 'none' }, m.__body), 4);
      BS.SFX.good();
      fed++;
      if (fed === 3) { BS.later(BS.win, 420); }
      return true;
    }
    function dropOn(g) {
      return function (x, y, back) {
        for (var m = 0; m < 3; m++) {
          if (hit(x, y, spots[m][0], spots[m][1], 50) && feed(mons[m], m, g)) { return; }
        }
        glide(g, back.x, back.y);
      };
    }
    function cookie(x, y) {
      var g = G(st, x, y);
      ink(S('circle', { cx: 0, cy: 0, r: 20, fill: '#D9A566' }, g));
      S('ellipse', { cx: -6, cy: -8, rx: 9, ry: 5, fill: '#FFFFFF', opacity: '.25' }, g);
      S('circle', { cx: -7, cy: -5, r: 3.6, fill: '#5B3A22' }, g);
      S('circle', { cx: 8, cy: -2, r: 3.6, fill: '#5B3A22' }, g);
      S('circle', { cx: -2, cy: 9, r: 3.6, fill: '#5B3A22' }, g);
      drag(g, { onDrop: dropOn(g) });
    }
    cookie(96, 118); cookie(160, 118);
    var moon = G(st, 300, 70);
    ink(S('circle', { cx: 0, cy: 0, r: 29, fill: '#EFE3C0' }, moon));
    S('circle', { cx: -10, cy: -9, r: 6, fill: '#D9CBA3' }, moon);
    S('circle', { cx: 11, cy: -3, r: 4.5, fill: '#D9CBA3' }, moon);
    S('circle', { cx: -3, cy: 13, r: 5.5, fill: '#D9CBA3' }, moon);
    drag(moon, { onDrop: dropOn(moon) });
  }
},

/* 14 */ {
  d: 40,
  ask: 'Catch the mouse! He is too quick to grab.',
  hint: 'He always escapes down a hole. What if he could not reach either one?',
  tell: 'Cover BOTH holes at the same time, using two fingers.',
  why: 'One finger was never going to be enough. Sometimes you need a second idea.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#D8B98A', groundY: 196, tufts: false });
    ink(S('rect', { x: 0, y: 186, width: 360, height: 16, fill: '#B99568' }, st), 4);
    var h1 = ink(S('ellipse', { cx: 56, cy: 196, rx: 40, ry: 30, fill: '#241534' }, st));
    var h2 = ink(S('ellipse', { cx: 304, cy: 196, rx: 40, ry: 30, fill: '#241534' }, st));
    var caught = false;
    var mouse = animal(st, { kind: 'mouse', x: 180, y: 140, size: 19, fill: '#C9BFD6', bob: false });
    tap(mouse, function () { if (!caught) { BS.nope(mouse); } });
    var t0 = Date.now();
    A.tick(function () {
      if (caught) { return true; }
      at(mouse, 180 + Math.sin((Date.now() - t0) / 700) * 106, 154);
    });
    var on1 = false, on2 = false;
    BS.holdZone(h1, 56, 196, 62, function (v) { on1 = v; h1.setAttribute('fill', v ? '#5A4470' : '#241534'); });
    BS.holdZone(h2, 304, 196, 62, function (v) { on2 = v; h2.setAttribute('fill', v ? '#5A4470' : '#241534'); });
    BS.setCheck(function () {
      if (!(on1 && on2) || caught) { return; }
      caught = true;
      at(mouse, 180, 154);
      mouse.__eyes.open.setAttribute('opacity', '1');
      BS.later(BS.win, 400);
    });
  }
},

/* 15 */ {
  d: 26,
  ask: 'Watch carefully. Where is the ball?',
  hint: 'Keep your eyes on one cup and follow it. Do not blink.',
  tell: 'Follow the cup the ball started under, all the way through the swaps.',
  why: 'You held one thing in your head while everything moved. That is concentration.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 226 });
    var xs = [80, 180, 280], ballAt = 1;
    var cups = [], i;
    var ball = G(st, xs[ballAt], 196);
    ink(S('circle', { cx: 0, cy: 0, r: 13, fill: '#F0466F' }, ball));
    S('circle', { cx: -4, cy: -4, r: 4, fill: '#FFFFFF', opacity: '.5' }, ball);
    for (i = 0; i < 3; i++) {
      (function (i) {
        var g = G(st, xs[i], 150);
        drop(st, xs[i], 224, 34, 8, .16);
        ink(S('path', { d: 'M-34,58 L-24,-26 L24,-26 L34,58 Z', fill: '#6EC6E8' }, g));
        S('path', { d: 'M-26,52 L-19,-20 L-9,-20 L-17,52 Z', fill: '#FFFFFF', opacity: '.25' }, g);
        ink(S('ellipse', { cx: 0, cy: -26, rx: 24, ry: 7, fill: '#8FD6EF' }, g));
        g.__slot = i;
        cups.push(g);
        tap(g, function () {
          if (BS.isLocked()) { return; }
          if (g.__slot === ballAt) { at(ball, xs[ballAt], 196); ball.parentNode.appendChild(ball); glide(g, xs[g.__slot], 96); BS.later(BS.win, 350); }
          else { BS.nope(g); }
        });
      })(i);
    }
    BS.lock(true);
    /* lift the cups, show the ball, put them down, then shuffle */
    for (i = 0; i < 3; i++) { glide(cups[i], xs[i], 104, 400); }
    BS.later(function () {
      for (var k = 0; k < 3; k++) { glide(cups[k], xs[k], 150, 400); }
    }, 1200);

    var swaps = [[0, 1], [1, 2], [0, 2], [1, 2], [0, 1]];
    for (i = 0; i < swaps.length; i++) {
      (function (pair, n) {
        BS.later(function () {
          var a = null, b = null, k;
          for (k = 0; k < 3; k++) {
            if (cups[k].__slot === pair[0]) { a = cups[k]; }
            if (cups[k].__slot === pair[1]) { b = cups[k]; }
          }
          if (!a || !b) { return; }
          a.__slot = pair[1]; b.__slot = pair[0];
          glide(a, xs[pair[1]], 150, 420); glide(b, xs[pair[0]], 150, 420);
          if (ballAt === pair[0]) { ballAt = pair[1]; }
          else if (ballAt === pair[1]) { ballAt = pair[0]; }
          at(ball, xs[ballAt], 196);
          BS.SFX.drop();
          if (n === swaps.length - 1) { BS.later(function () { BS.lock(false); }, 520); }
        }, 1800 + n * 620);
      })(swaps[i], i);
    }
  }
},

/* 16 */ {
  d: 50,
  ask: 'Turn off all the lights.',
  hint: 'Tapping a light also flips the ones next to it. Try the corners.',
  tell: 'Tap the middle of the top row, then the middle of the bottom row.',
  why: 'Every tap changed four things at once. You worked out what each move really did.',
  build: function (st) {
    scene(st, 'night', { hills: false, ground: false });
    var on = [], cells = [], i;
    for (i = 0; i < 9; i++) { on.push(false); }
    function flip(i) {
      var r = Math.floor(i / 3), c = i % 3, list = [i], k;
      if (r > 0) { list.push(i - 3); }
      if (r < 2) { list.push(i + 3); }
      if (c > 0) { list.push(i - 1); }
      if (c < 2) { list.push(i + 1); }
      for (k = 0; k < list.length; k++) { on[list[k]] = !on[list[k]]; }
    }
    flip(1); flip(7);   /* two moves from solved, so it is always winnable */
    for (i = 0; i < 9; i++) {
      (function (i) {
        var x = 86 + (i % 3) * 94, y = 66 + Math.floor(i / 3) * 82;
        var g = G(st, x, y);
        var bulb = ink(S('circle', { cx: 0, cy: 0, r: 27, fill: '#3D3170' }, g));
        var shine = S('ellipse', { cx: -8, cy: -9, rx: 10, ry: 7, fill: '#FFFFFF', opacity: '0' }, g);
        var halo = S('circle', { cx: 0, cy: 0, r: 40, fill: A.glow(st, '#FFD86B', .85), opacity: '0' }, g);
        g.insertBefore(halo, bulb);
        cells.push({ bulb: bulb, shine: shine, halo: halo });
        tap(g, function () {
          if (BS.isLocked()) { return; }
          flip(i); BS.SFX.flip(); paint();
          for (var k = 0; k < 9; k++) { if (on[k]) { return; } }
          BS.later(BS.win, 260);
        });
      })(i);
    }
    function paint() {
      for (var k = 0; k < 9; k++) {
        cells[k].bulb.setAttribute('fill', on[k] ? '#FFC93C' : '#3D3170');
        cells[k].shine.setAttribute('opacity', on[k] ? '.45' : '0');
        cells[k].halo.setAttribute('opacity', on[k] ? '1' : '0');
      }
    }
    paint();
  }
},

/* 17 */ {
  d: 16,
  ask: 'Three stars are hiding in this picture. Find them all.',
  hint: 'Look behind things, and up in the corners. They are the same colour as what they hide in.',
  tell: 'One is in the bush, one is in the cloud, and one is down in the grass.',
  why: 'Things hide by matching what is around them. Slow eyes find more than fast ones.',
  build: function (st) {
    scene(st, 'day', { hills: true, groundY: 224 });
    var cloud = G(st, 92, 62);
    ink(S('circle', { cx: -26, cy: 6, r: 21, fill: '#FFFFFF' }, cloud));
    ink(S('circle', { cx: 24, cy: 8, r: 18, fill: '#FFFFFF' }, cloud));
    ink(S('circle', { cx: 0, cy: -9, r: 26, fill: '#FFFFFF' }, cloud));
    var bush = G(st, 288, 194);
    ink(S('circle', { cx: -24, cy: 4, r: 27, fill: '#4CA85E' }, bush));
    ink(S('circle', { cx: 20, cy: 6, r: 23, fill: '#4CA85E' }, bush));
    ink(S('circle', { cx: 0, cy: -16, r: 27, fill: '#5BBC6D' }, bush));

    var found = 0;
    var counter = txt('0 of 3', { x: 40, y: 26, 'font-size': 17, fill: '#241534', 'text-anchor': 'start', opacity: '.55' }, st);
    var spots = [[96, 56, '#F4F9FF'], [284, 186, '#57B96A'], [150, 262, '#6FC085']];
    for (var i = 0; i < 3; i++) {
      (function (sp) {
        var g = G(st, sp[0], sp[1]);
        pad(g, 52, 52);
        var s = star(g, 0, 0, 15, sp[2], 0);
        s.setAttribute('opacity', '.9');
        tap(g, function () {
          if (g.__got) { return; }
          g.__got = true;
          s.setAttribute('fill', '#FFC93C');
          ink(s, 3);
          found++;
          counter.textContent = found + ' of 3';
          BS.SFX.good();
          if (found === 3) { BS.later(BS.win, 340); }
        });
      })(spots[i]);
    }
  }
},

/* 18 */ {
  d: 4,
  ask: 'The cat is stuck up the tree.',
  hint: 'There is something leaning against the wall that would help her climb down.',
  tell: 'Drag the ladder over to the tree trunk.',
  why: 'She could not jump that far. A ladder makes a big drop into small steps.',
  build: function (st) {
    scene(st, 'meadow', { hills: true, groundY: 234 });
    ink(S('rect', { x: 246, y: 118, width: 30, height: 120, rx: 6, fill: '#8A5F3B' }, st), 4);
    ink(S('circle', { cx: 262, cy: 96, r: 54, fill: '#4CA85E' }, st));
    ink(S('circle', { cx: 214, cy: 118, r: 34, fill: '#57B96A' }, st));
    ink(S('circle', { cx: 306, cy: 122, r: 30, fill: '#57B96A' }, st));
    var cat = animal(st, { kind: 'cat', x: 262, y: 66, size: 17, fill: '#FFB03A', mood: 'sad' });
    tap(cat, function () { BS.nope(cat); });
    var lad = G(st, 62, 176);
    pad(lad, 54, 140);
    ink(S('line', { x1: -15, y1: -62, x2: -15, y2: 62 }, lad), 6);
    ink(S('line', { x1: 15, y1: -62, x2: 15, y2: 62 }, lad), 6);
    for (var i = 0; i < 5; i++) { ink(S('line', { x1: -15, y1: -44 + i * 24, x2: 15, y2: -44 + i * 24 }, lad), 5); }
    drag(lad, { onDrop: function (x, y) {
      if (hit(x, y, 226, 172, 58)) {
        glide(lad, 226, 172);
        BS.later(function () {
          glide(cat, 226, 214, 700);
          cat.__eyes.open.setAttribute('opacity', '1');
          BS.later(BS.win, 800);
        }, 320);
      }
    } });
  }
},

/* 19 */ {
  d: 32,
  ask: 'Make the seesaw balance.',
  hint: 'The left side weighs 3. What two blocks add up to 3?',
  tell: 'Put the 1 and the 2 on the right side.',
  why: 'One and two make three. Both sides weigh the same, so it sits level.',
  build: function (st) {
    scene(st, 'meadow', { hills: true, groundY: 240 });
    ink(S('path', { d: 'M164,238 L196,238 L180,178 Z', fill: '#8A7BA8' }, st));
    var plank = G(st, 180, 174);
    ink(S('rect', { x: -132, y: -9, width: 264, height: 18, rx: 8, fill: '#C98B52' }, plank));
    var lw = 3, rw = 0;
    var fixed = G(plank, -88, -34);
    ink(S('rect', { x: -25, y: -25, width: 50, height: 50, rx: 8, fill: '#F0466F' }, fixed));
    txt('3', { x: 0, y: 10, 'font-size': 28, fill: '#FFF6E6' }, fixed);
    function tilt() {
      var d = Math.max(-14, Math.min(14, (lw - rw) * 5));
      plank.setAttribute('transform', 'translate(180,174) rotate(' + d + ')');
      if (rw === lw) { BS.later(BS.win, 420); }
    }
    tilt();
    var blocks = [{ v: 1, x: 66, y: 268, c: '#3FBF7F' }, { v: 2, x: 180, y: 268, c: '#6EC6E8' }, { v: 4, x: 294, y: 268, c: '#FFC93C' }];
    var slots = [[236, 128], [300, 128]], used = [false, false];
    for (var i = 0; i < blocks.length; i++) {
      (function (B) {
        var g = G(st, B.x, B.y);
        ink(S('rect', { x: -24, y: -24, width: 48, height: 48, rx: 8, fill: B.c }, g));
        S('rect', { x: -18, y: -18, width: 36, height: 12, rx: 5, fill: '#FFFFFF', opacity: '.2' }, g);
        txt(String(B.v), { x: 0, y: 10, 'font-size': 27, fill: '#241534' }, g);
        drag(g, { onDrop: function (x, y, back) {
          var k;
          for (k = 0; k < 2; k++) {
            if (!used[k] && hit(x, y, slots[k][0], slots[k][1], 46)) {
              used[k] = true; g.__slot = k; rw += B.v;
              glide(g, slots[k][0], slots[k][1]);
              BS.later(tilt, 280);
              return;
            }
          }
          if (g.__slot !== undefined && g.__slot !== null) {
            used[g.__slot] = false; rw -= B.v; g.__slot = null;
            BS.later(tilt, 280);
          }
          glide(g, back.x, back.y);
        } });
      })(blocks[i]);
    }
  }
},

/* 20 */ {
  d: 28,
  ask: 'How many triangles can you see?',
  hint: 'There are two small ones. Now look at the whole shape as well.',
  tell: 'Two small triangles, and the big one they make together. Three.',
  why: 'Two small triangles, plus the big one they build. Shapes can hide inside shapes.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var g = G(st, 180, 168);
    ink(S('path', { d: 'M0,-86 L-108,64 L108,64 Z', fill: '#6EC6E8' }, g));
    S('path', { d: 'M0,-86 L-108,64 L0,64 Z', fill: '#FFFFFF', opacity: '.14' }, g);
    ink(S('line', { x1: 0, y1: -86, x2: 0, y2: 64 }, g), 5);
    BS.chips(['2', '3', '4', '5'], 1);
  }
},

/* 21 */ {
  d: 3,
  ask: 'Which basket has more apples?',
  hint: 'Do not look at how big they are. Count them one by one.',
  tell: 'The right basket. It has five, the left one has three.',
  why: 'Three big apples are still only three. More means more of them, not bigger ones.',
  build: function (st) {
    scene(st, 'room', { hills: false, ground: '#C08D57', groundY: 236 });
    function basket(x, n, r) {
      var g = G(st, x, 168);
      var i, cols = 3, ax, ay;
      for (i = 0; i < n; i++) {
        ax = -((Math.min(n, cols) - 1) * r) + (i % cols) * r * 2;
        ay = -10 + Math.floor(i / cols) * (r * 1.7);
        ink(S('circle', { cx: ax, cy: ay - 18, r: r, fill: '#E8464C' }, g));
        S('ellipse', { cx: ax - r * .3, cy: ay - 18 - r * .35, rx: r * .34, ry: r * .22, fill: '#FFFFFF', opacity: '.35' }, g);
        ink(S('line', { x1: ax, y1: ay - 18 - r, x2: ax + 3, y2: ay - 24 - r }, g), 3).setAttribute('stroke', '#6E4A28');
      }
      ink(S('path', { d: 'M-58,10 L58,10 L44,72 L-44,72 Z', fill: '#C98B52' }, g));
      for (i = 0; i < 4; i++) { ink(S('line', { x1: -50 + i * 30, y1: 12, x2: -44 + i * 30, y2: 70 }, g), 3).setAttribute('stroke', '#A87040'); }
      ink(S('line', { x1: -54, y1: 34, x2: 54, y2: 34 }, g), 3).setAttribute('stroke', '#A87040');
      return g;
    }
    var L = basket(94, 3, 21);
    var R = basket(266, 5, 13);
    tap(L, function () { BS.nope(L); });
    tap(R, function () { BS.win(); });
  }
},

/* 22 */ {
  d: 19,
  ask: 'Put out the campfire.',
  hint: 'You cannot blow it out. What is floating up in the sky?',
  tell: 'Drag the cloud until it sits right above the fire.',
  why: 'Fire needs to stay dry. Water is how you stop it.',
  build: function (st) {
    scene(st, 'dusk', { hills: true, groundY: 238 });
    var fire = G(st, 180, 224);
    ink(S('line', { x1: -34, y1: 22, x2: 34, y2: 10 }, fire), 8).setAttribute('stroke', '#8A5F3B');
    ink(S('line', { x1: -30, y1: 8, x2: 32, y2: 22 }, fire), 8).setAttribute('stroke', '#A87040');
    var f1 = ink(S('path', { d: 'M0,-46 q26,26 16,42 q-6,10 -16,10 q-10,0 -16,-10 q-10,-16 16,-42 z', fill: '#FF8A3D' }, fire));
    var f2 = ink(S('path', { d: 'M0,-24 q13,14 8,22 q-3,5 -8,5 q-5,0 -8,-5 q-5,-8 8,-22 z', fill: '#FFC93C' }, fire), 3);
    var t0 = Date.now();
    A.tick(function () {
      if (fire.__out) { return true; }
      var k = 1 + Math.sin((Date.now() - t0) / 170) * 0.07;
      f1.setAttribute('transform', 'translate(0,4) scale(1,' + k.toFixed(3) + ') translate(0,-4)');
    });
    var cloud = G(st, 84, 62);
    ink(S('circle', { cx: -28, cy: 6, r: 23, fill: '#9FB4C7' }, cloud));
    ink(S('circle', { cx: 26, cy: 8, r: 19, fill: '#9FB4C7' }, cloud));
    ink(S('circle', { cx: 0, cy: -10, r: 28, fill: '#B8C8D6' }, cloud));
    drag(cloud, { clamp: [50, 46, 310, 96], onDrop: function (x) {
      if (Math.abs(x - 180) > 42 || fire.__out) { return; }
      fire.__out = true;
      glide(cloud, 180, 62);
      var drops = S('g', {}, st);
      for (var k = 0; k < 7; k++) {
        (function (k) {
          var dp = G(drops, 148 + k * 11, 96);
          ink(S('path', { d: 'M0,-8 q6,8 0,12 q-6,-4 0,-12', fill: '#4FA8D8' }, dp), 2);
          var s0 = Date.now() + k * 70;
          A.tick(function () {
            var e = Date.now() - s0;
            if (e > 0) { at(dp, 148 + k * 11, 96 + (e / 3) % 108); }
          });
        })(k);
      }
      BS.later(function () {
        f1.setAttribute('opacity', '0'); f2.setAttribute('opacity', '0');
        for (var s = 0; s < 4; s++) {
          var sm = S('circle', { cx: 180 + (s - 1.5) * 9, cy: 190 - s * 10, r: 8 + s * 2, fill: '#C9C4D6', opacity: '.5' }, st);
          sm.style.pointerEvents = 'none';
        }
        BS.win();
      }, 900);
    } });
  }
},

/* 23 */ {
  d: 15,
  ask: 'Line them up: smallest first. Tap two to swap.',
  hint: 'The tiniest one belongs on the left, the biggest on the right.',
  tell: 'Mouse, then cat, then bear.',
  why: 'Smallest to biggest. Putting things in order is how you compare a whole group at once.',
  build: function (st) {
    scene(st, 'meadow', { hills: true, groundY: 236 });
    orderGame(st, 158, function (g, kind) {
      var spec = [
        { k: 'mouse', s: 11, f: '#C9BFD6' },
        { k: 'cat',   s: 17, f: '#FFB03A' },
        { k: 'bear',  s: 24, f: '#B07A4C' }
      ][kind];
      animal(g, { kind: spec.k, x: 0, y: 40 - spec.s * 2.5, size: spec.s, fill: spec.f, bob: false });
    }, [1, 2, 0]);
  }
},

/* 24 */ {
  d: 9,
  ask: 'Which key opens the lock?',
  hint: 'Look at the shape of the hole, then look at the end of each key.',
  tell: 'The key with the round end.',
  why: 'A key only turns if its shape matches the hole exactly. Close is not enough.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false });
    var lock = G(st, 180, 96);
    ink(S('path', { d: 'M-30,-16 a30,34 0 0 1 60,0 l0,16 l-15,0 l0,-16 a15,19 0 0 0 -30,0 l0,16 l-15,0 z', fill: '#B7B2C4' }, lock));
    ink(S('rect', { x: -44, y: -2, width: 88, height: 68, rx: 10, fill: '#FFC93C' }, lock));
    S('rect', { x: -36, y: 4, width: 26, height: 12, rx: 5, fill: '#FFFFFF', opacity: '.3' }, lock);
    ink(S('circle', { cx: 0, cy: 26, r: 11, fill: '#241534' }, lock), 2);
    ink(S('path', { d: 'M-5,30 L5,30 L3,50 L-3,50 Z', fill: '#241534' }, lock), 2);
    var keys = [
      { t: 'square', x: 76, y: 226 },
      { t: 'round', x: 180, y: 226 },
      { t: 'tri', x: 284, y: 226 }
    ];
    for (var i = 0; i < keys.length; i++) {
      (function (K) {
        var g = G(st, K.x, K.y);
        ink(S('rect', { x: -6, y: -34, width: 12, height: 62, rx: 4, fill: '#E0B44A' }, g));
        ink(S('rect', { x: 4, y: 6, width: 18, height: 8, rx: 3, fill: '#E0B44A' }, g), 3);
        ink(S('rect', { x: 4, y: 20, width: 12, height: 8, rx: 3, fill: '#E0B44A' }, g), 3);
        if (K.t === 'round') { ink(S('circle', { cx: 0, cy: -44, r: 17, fill: '#E0B44A' }, g)); ink(S('circle', { cx: 0, cy: -44, r: 6, fill: '#FFF1DC' }, g), 2); }
        else if (K.t === 'square') { ink(S('rect', { x: -16, y: -60, width: 32, height: 32, rx: 4, fill: '#E0B44A' }, g)); ink(S('rect', { x: -5, y: -49, width: 10, height: 10, fill: '#FFF1DC' }, g), 2); }
        else { ink(S('path', { d: 'M0,-64 L18,-30 L-18,-30 Z', fill: '#E0B44A' }, g)); }
        drag(g, { onDrop: function (x, y, back) {
          if (!hit(x, y, 180, 122, 56)) { return; }
          if (K.t === 'round') {
            glide(g, 180, 122);
            BS.later(function () {
              lock.setAttribute('transform', 'translate(180,96) rotate(-8)');
              BS.win();
            }, 340);
          } else { BS.nope(g); glide(g, back.x, back.y); }
        } });
      })(keys[i]);
    }
  }
}

  ];
})());
