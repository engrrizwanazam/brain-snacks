/* ==========================================================
   Brain Snacks — pack 8 (v13): five puzzles built on the animals
   that were redrawn in v13. They only work because a cow now
   looks like a cow from its horns alone.

   Each has an `id`, so its question can be reworded later without
   losing a solve. `d` is its place on the ladder.
   ========================================================== */

BS.addPuzzles((function () {
  'use strict';

  var A = ART;
  var S = A.S, G = A.G, ink = A.ink, txt = A.txt;
  var animal = A.animal, scene = A.scene;
  var orderGame = KIT.orderGame, options = KIT.options;

  function bush(st, x, y, z) {
    var g = G(st, x, y), c = '#3E9E5B', i;
    var b = [[-58, 14, 30], [58, 14, 30], [-30, -6, 34], [30, -6, 34], [0, 6, 40], [-84, 28, 22], [84, 28, 22]];
    for (i = 0; i < b.length; i++) { ink(S('circle', { cx: b[i][0] * z, cy: b[i][1] * z, r: b[i][2] * z, fill: c }, g), 3.5); }
    for (i = 0; i < b.length; i++) { S('circle', { cx: b[i][0] * z, cy: b[i][1] * z + 2, r: b[i][2] * z - 3, fill: c }, g); }
    S('ellipse', { cx: 0, cy: 34 * z, rx: 104 * z, ry: 26 * z, fill: c }, g);
    S('circle', { cx: -22 * z, cy: -12 * z, r: 9 * z, fill: '#6FCB85', opacity: '.6' }, g);
    S('circle', { cx: 36 * z, cy: 2 * z, r: 7 * z, fill: '#6FCB85', opacity: '.6' }, g);
    return g;
  }

  return [

/* ---------- a part is enough ---------- */
{
  id: 'x-bush', d: 13.5,
  ask: 'Somebody is hiding in the bush. Who is it?',
  hint: 'Look at what is sticking out of the top.',
  tell: 'Those are horns. Only the cow has horns. Tap the cow.',
  why: 'You did not need the whole animal. One part that only it has was enough.',
  build: function (st) {
    scene(st, 'meadow', { sun: 'sun', flowers: false, groundY: 150, vignette: false });
    S('ellipse', { cx: 180, cy: 172, rx: 118, ry: 9, fill: '#241534', opacity: '.14' }, st);
    animal(st, { kind: 'cow', x: 180, y: 74, size: 27, fill: '#FFF6E6', shadow: false, bob: false, blush: false });
    bush(st, 180, 112, 1);
    var who = [['bunny', '#F5E2D0'], ['cow', '#FFF6E6'], ['cat', '#FFB03A']];
    options(st, 240, function (g, i) {
      animal(g, { kind: who[i][0], x: 0, y: -12, size: 15, fill: who[i][1], shadow: false, bob: false });
    }, 1, [72, 180, 288], 84);
  }
},

/* ---------- the picture lies about size ---------- */
{
  id: 'x-realsize', d: 26.5,
  ask: 'Line them up, smallest first. Their REAL size!',
  hint: 'The picture is playing a trick. Think about the real animals.',
  tell: 'Mouse, cat, cow, elephant. Tap two cards to swap them.',
  why: 'A drawing can make a mouse huge. You used what you know, not what you saw.',
  build: function (st) {
    scene(st, 'candy', { hills: false, ground: false, vignette: false });
    /* drawn back to front: the smallest animal gets the biggest picture */
    var Z = [
      { k: 'mouse', f: '#C9BFD6', s: 23, y: 0 },
      { k: 'cat', f: '#FFB03A', s: 17, y: 0 },
      { k: 'cow', f: '#FFF6E6', s: 12.5, y: 6 },
      { k: 'elephant', f: '#A9A6C4', s: 9, y: 12 }
    ];
    orderGame(st, 150, function (g, id) {
      S('rect', { x: -38, y: -60, width: 76, height: 124, rx: 14, fill: '#C9B48A' }, g);
      ink(S('rect', { x: -38, y: -64, width: 76, height: 124, rx: 14, fill: '#FFF6E6' }, g), 3.5);
      animal(g, { kind: Z[id].k, x: 0, y: -18 + Z[id].y, size: Z[id].s, fill: Z[id].f, shadow: false, bob: false });
    }, [3, 0, 2, 1]);
  }
},

/* ---------- somebody else's point of view ---------- */
{
  id: 'x-six', d: 34.5,
  ask: 'The turtle looks at the card from the other side. Which number does the turtle see?',
  hint: 'Turn your head upside down, or turn the phone round.',
  tell: 'From the other side the 6 is upside down. It looks like a 9.',
  why: 'What you see depends on where you stand. You stood where the turtle stands.',
  build: function (st) {
    scene(st, 'room', { vignette: false });
    /* the table, seen from our side */
    S('ellipse', { cx: 180, cy: 262, rx: 150, ry: 12, fill: '#241534', opacity: '.16' }, st);
    ink(S('rect', { x: 58, y: 196, width: 16, height: 66, rx: 4, fill: '#8A5F3B' }, st), 3);
    ink(S('rect', { x: 286, y: 196, width: 16, height: 66, rx: 4, fill: '#8A5F3B' }, st), 3);
    animal(st, { kind: 'turtle', x: 180, y: 70, size: 21, fill: '#7FCF7A', shadow: false });
    ink(S('path', { d: 'M76,104 L284,104 L330,208 L30,208 Z', fill: '#C98B52' }, st), 4);
    S('path', { d: 'M84,110 L276,110 L286,132 L74,132 Z', fill: '#FFFFFF', opacity: '.14' }, st);
    ink(S('path', { d: 'M30,208 L330,208 L330,222 L30,222 Z', fill: '#A8713F' }, st), 4);
    /* the card lying flat on it */
    var c = G(st, 180, 158);
    S('path', { d: 'M-38,-30 L38,-30 L48,36 L-48,36 Z', fill: '#241534', opacity: '.18', transform: 'translate(3,5)' }, c);
    ink(S('path', { d: 'M-38,-30 L38,-30 L48,36 L-48,36 Z', fill: '#FFF6E6' }, c), 3.5);
    txt('6', { x: 0, y: 26, 'font-size': 62, fill: '#F0466F' }, c);
    BS.chips(['6', '9', '0', '8'], 1);
  }
},

/* ---------- take one away from a balance ---------- */
{
  id: 'x-hopoff', d: 31.5,
  ask: 'The plank is level. Then one sheep hops off. Which end goes down?',
  hint: 'Two sheep were holding the cow up. Can one do it alone?',
  tell: 'One sheep is too light now. The cow end goes down.',
  why: 'Level meant both ends weighed the same. Take some away and that end is lighter.',
  build: function (st) {
    scene(st, 'meadow', { sun: false, flowers: false, groundY: 214, vignette: false });
    S('ellipse', { cx: 180, cy: 232, rx: 150, ry: 9, fill: '#241534', opacity: '.14' }, st);
    ink(S('path', { d: 'M180,170 L212,230 L148,230 Z', fill: '#F0466F' }, st), 4);
    ink(S('rect', { x: 34, y: 158, width: 292, height: 14, rx: 6, fill: '#C98B52' }, st), 4);
    animal(st, { kind: 'cow', x: 282, y: 108, size: 21, fill: '#FFF6E6', shadow: false, flip: true });
    animal(st, { kind: 'sheep', x: 110, y: 118, size: 17, fill: '#FFF6E6', shadow: false });
    /* the one that is leaving, already in the air */
    var s2 = animal(st, { kind: 'sheep', x: 46, y: 84, size: 17, fill: '#FFF6E6', shadow: false, flip: true, bob: false });
    s2.setAttribute('data-off', '1');
    var ar = ink(S('path', { d: 'M92,140 Q60,150 44,122', fill: 'none' }, st), 5);
    ar.setAttribute('stroke-dasharray', '1 10');
    ar.setAttribute('stroke', '#FFF6E6');
    BS.chips(['Sheep end', 'Stays level', 'Cow end'], 2);
  }
},

/* ---------- two clues, one answer ---------- */
{
  id: 'x-fence', d: 90.5,
  ask: 'Hens and sheep hide behind the fence. 3 heads, 10 legs. How many are sheep?',
  hint: 'Pretend all three are hens. How many legs is that? How many are left over?',
  tell: 'Three hens make 6 legs. 4 legs are left. Each sheep adds 2 more, so 2 sheep.',
  why: 'You guessed, checked, and fixed the guess. That beats staring at it.',
  build: function (st) {
    scene(st, 'meadow', { sun: false, flowers: false, groundY: 236, vignette: false });
    /* the key: who has how many legs */
    var k1 = G(st, 96, 44), k2 = G(st, 264, 44);
    ink(S('rect', { x: -70, y: -30, width: 140, height: 60, rx: 14, fill: '#FFF6E6' }, k1), 3.5);
    animal(k1, { kind: 'hen', x: -34, y: -10, size: 11, fill: '#FFF0C0', shadow: false, bob: false, blink: false });
    txt('2 legs', { x: 24, y: 7, 'font-size': 17, fill: '#241534' }, k1);
    ink(S('rect', { x: -70, y: -30, width: 140, height: 60, rx: 14, fill: '#FFF6E6' }, k2), 3.5);
    animal(k2, { kind: 'sheep', x: -34, y: -10, size: 11, fill: '#FFF6E6', shadow: false, bob: false, blink: false });
    txt('4 legs', { x: 24, y: 7, 'font-size': 17, fill: '#241534' }, k2);
    /* three pairs of eyes in the dark above the fence */
    var i, x;
    S('rect', { x: 30, y: 96, width: 300, height: 44, rx: 10, fill: '#241534' }, st);
    var eyes = G(st, 0, 0);
    eyes.setAttribute('data-heads', '3');
    for (i = 0; i < 3; i++) {
      x = 96 + i * 84;
      S('ellipse', { cx: x - 10, cy: 118, rx: 7, ry: 8, fill: '#FFFFFF' }, eyes);
      S('ellipse', { cx: x + 10, cy: 118, rx: 7, ry: 8, fill: '#FFFFFF' }, eyes);
      S('circle', { cx: x - 9, cy: 120, r: 3.6, fill: '#241534' }, st);
      S('circle', { cx: x + 11, cy: 120, r: 3.6, fill: '#241534' }, st);
    }
    /* ten legs below it, all drawn alike so the legs do not give it away */
    var legs = G(st, 0, 0);
    legs.setAttribute('data-legs', '10');
    for (i = 0; i < 10; i++) {
      x = 54 + i * 28;
      ink(S('rect', { x: x - 4, y: 206, width: 8, height: 30, rx: 3, fill: '#5A4A6E' }, legs), 2.5);
      ink(S('ellipse', { cx: x, cy: 238, rx: 8, ry: 4.5, fill: '#5A4A6E' }, legs), 2.5);
    }
    /* the fence itself */
    for (i = 0; i < 9; i++) {
      x = 36 + i * 36;
      ink(S('path', { d: 'M' + (x - 15) + ',212 L' + (x - 15) + ',142 L' + x + ',128 L' + (x + 15) + ',142 L' + (x + 15) + ',212 Z', fill: '#E9C48C' }, st), 3.5);
    }
    ink(S('rect', { x: 14, y: 160, width: 332, height: 12, rx: 5, fill: '#C98B52' }, st), 3.5);
    BS.chips(['1', '2', '3', '5'], 1);
  }
}

  ];
})());
