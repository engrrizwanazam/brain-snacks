# Brain Snacks

Fourteen games for a 6–8 year old, built to run on an iPhone 6 (iOS 12.5 / Safari 12).
Nothing in it says "maths".

| game | what it is | what it works on |
|---|---|---|
| **Tricks** | 100 puzzles, each with a catch. The main event | lateral thinking |
| **Pairs** | memory matching, three board sizes | recognition memory |
| **Odd One** | find the different critter before the timer ends | visual discrimination |
| **Echo** | watch colours light up, then repeat the sequence | sequential recall |
| **Spot It** | two pictures, a few quiet differences, on the clock | comparison, sustained attention |
| **Slide** | sliding tile puzzle, three sizes, always solvable | spatial planning |
| **Snapshot** | critters flash, then vanish — tap where they were | visuospatial working memory |
| **Trail** | tap in order: 1, 2, 3… then 1, A, 2, B… | attention switching, processing speed |
| **Wake Up** | tap the awake ones, leave the sleepers alone | impulse control (go / no-go) |
| **Sort It** | sort by colour… then the rule changes to shape | cognitive flexibility |
| **Maze** | drag the mouse to the cheese | route planning |
| **Untangle** | drag the dots until no strings cross | spatial reasoning, persistence |
| **Which Way** | tap the way the *middle* arrow points | attention under interference |
| **Fill It** | pack the pieces to cover every square | spatial planning |

Thirteen of the fourteen are procedural, so they never run out — which matters far
more than a fixed level count on a device that spends most of its life offline.

The last four are the ones worth knowing about. **Snapshot** is a Corsi-block task,
the standard measure of visual working memory. **Trail** is trail-making: the jump
from `1,2,3` to `1,A,2,B` is the switching cost, and it's the part that makes it
hard. **Wake Up** is go/no-go — the skill being trained is *not* reacting, which is
why it also scores you for correctly leaving a sleeper alone. **Sort It** switches
the sorting rule mid-game without warning; unlearning the old rule is the entire
exercise. **Untangle** generates a planar graph and scrambles it, so a tangle-free
arrangement always exists. **Which Way** is a flanker task — the flanking arrows
usually point the wrong way, and ignoring them is the skill. **Fill It** builds each
board by cutting a filled rectangle apart, so a perfect fit is guaranteed.

### The Tricks puzzles, by difficulty

**1–24** are the original trick puzzles: one insight each, solvable in seconds once
it clicks.

**25–32** step up to tracing, mirroring, rotation and transitive reasoning.

**33–61** are the hard batch, and they are genuinely hard. **Nothing is locked** —
one puzzle she cannot crack used to hide every puzzle after it, and the hard batch
is not in strict difficulty order anyway (the water jugs at 37 are harder than the
gears at 40 or the analogy at 44):

- **Multi-step state puzzles** — Tower of Hanoi (seven moves), the fox/hen/corn
  river crossing (which requires bringing the hen *back*, undoing your own
  progress), water jugs (measure exactly 4 using a 5 and a 3), a Rush Hour-style
  sliding block escape, and a frog swap that jams permanently on a wrong hop
- **Abstract reasoning** — Raven's-style matrices with two rules running at once,
  analogies, interleaved sequences, a 4×4 shape sudoku, a magic square, and an
  odd-one-out where the rule is hidden (sides versus dots) rather than visual
- **Spatial** — which net folds into a cube, counting cubes including the hidden
  one, folded-paper hole punching, mirror reflections, symmetry completion, gears
- **Deduction** — who owns the cat, finding the heavy ball in two weighings, and
  transitive weighing where the two items being compared are never weighed against
  each other

**62–73** (v10) and **74–100** (v11) carry on past the hard batch without getting
harder in a straight line — they add *kinds* of thinking rather than degrees of
difficulty. See the v10 and v11 notes near the bottom for what each one is.

The learning only surfaces *after* she's solved something, as the punchline on the
win screen — "Seed, sprout, flower. Everything that grows takes its turn in order."
Underneath: conservation of volume, mass vs volume, patterns, sequencing, counting
in groups, mirror symmetry, rotation, transitive reasoning, working memory, visual
discrimination. She'll never be told she's practising anything.

---

## The play log

Hold the title on the home screen for **three seconds**. Deliberately plain, so if
she finds it she sees a boring wall of numbers.

Per puzzle: times opened, times won, wrong taps, hint taps, "just tell me" taps,
times left unsolved, and fastest solve. Plus a "Stuck on:" line ranking the unsolved
puzzles by effort spent on them.

**It never leaves the phone.** No network calls, no analytics, nothing transmitted.
It lives in `localStorage` under `bs.stats`, and is cleared by "Start over" or by the
Clear button on the panel. Keep it that way: the moment anything is transmitted,
COPPA / GDPR-K stop being simple.

It exists to answer the one question the code cannot — which puzzles she comes back
to, and which she puts down.

---

## Target device — decided, not drifting

**Decision, 2 August 2026: keep the Safari 12 constraint.**

The code already complies, so it costs nothing new, and it means the app runs on
whatever phone she or a friend happens to have, including old ones. Dropping it would
buy arrow functions and flex `gap`, neither of which this app wants.

Revisit when something specific is actually blocked by Safari 12. The likeliest
trigger is bundling a Nastaliq font for Urdu content. Change it in one clean sweep on
a stated date, or not at all — a codebase where some files run on the old phone and
some do not fails as a blank screen with no error.

---

## Deploy

Drag this folder onto `app.netlify.com/drop` for an HTTPS URL, or push to a repo
and turn on GitHub Pages. HTTPS is what makes the offline cache work.

On the phone, open the URL **in Safari**, then Share → **Add to Home Screen**.
Real icon, no address bar, and after the first load it runs with the Wi-Fi off.

For iterating: `python3 -m http.server 8000`, then hit your laptop's IP from the
phone. Fast to reload, but no offline on plain HTTP.

## Files

| file | what's in it |
|---|---|
| `index.html` | app shell, all the CSS, the visual identity |
| `art.js` | **characters and scenery.** Change how everything looks here |
| `game.js` | engine — touch, drag, multi-touch, sound, screens, routing |
| `puzzles.js` | Tricks puzzles 1–24 |
| `puzzles2.js` | Tricks puzzles 25–32, harder |
| `puzzles3.js` | Tricks puzzles 33–61, the expert batch |
| `puzzles4.js` | Tricks puzzles 62–73, added in v10 |
| `puzzles5.js` | Tricks puzzles 74–100, added in v11 |
| `pairs.js` `oddone.js` `echo.js` `spot.js` `slide.js` | arcade games |
| `snapshot.js` `trail.js` `wakeup.js` `sortit.js` `maze.js` | mind games |
| `untangle.js` `whichway.js` `fillit.js` | spatial + attention games |
| `sw.js` | offline cache |
| `make_icons.py` | regenerates the app icon from `art.js` |

## Drawing things

`animal()` gives real silhouettes — cat, mouse, elephant, dog, fox, bear, bunny,
duck, **hen**, **frog**, **penguin**, owl, fish. Each has its own body shape, ears, tail and
stance, so a cat cannot be mistaken for a mouse. The origin is the **centre of the
head**, and the body hangs below it; feet land about 2.2–2.7 × size below the origin.

The frog has its eyes on **top** of a wide flat head, a mouth right across the face
and webbed feet, so it cannot be mistaken for a bird; the hen has a comb, a wattle
and tail feathers, so it cannot be mistaken for a duck. Both exist because puzzles
were shipping with the wrong animal — see v10 below.

```js
animal(st, { kind: 'elephant', x: 296, y: 208, size: 13, fill: '#A9A6C4' });
```

Options: `{kind, x, y, size, fill, mood:'happy'|'sad'|'sleep'|'flat'|'wow',
look:-1..1, flip, ears2:false, bob, blink, shadow, blush}`

`critter()` is the simpler blob, used where species doesn't matter (Pairs, Odd One,
monsters): `{x, y, size, fill, ears:'cat'|'round'|'long', ears2, mood, legs, beak,
horn, look, bob, blink, shadow, blush}`

Both blink and breathe on their own. `ears2: false` gives a one-eared version,
which is what the spot-the-difference puzzles use.

`scene(st, kind, opts)` paints a whole background in one call. `kind` is
`day | meadow | dusk | night | water | sea | room | candy`; `opts` is
`{sun:'sun'|'moon', clouds:true, flowers:true, hills:false, ground:'#hex'|false,
groundY:244, tufts:false, vignette:false, w, h}`. Call `A.lift(st)` afterwards if
you add art that should sit *under* the vignette.

Other helpers: `A.silhouette(g)` turns any animal into its own shadow,
`A.bodyFill(parent, hex)` gives the shaded gradient, `A.tint(hex, amt)` shifts a
colour, `A.shadow(...)`, `A.star(...)`, `A.blade(...)`.

## Adding a puzzle

Append to the array in `puzzles3.js`. The stage is always 360 × 300 units and
scales to whatever screen it's on, so coordinates can be hard-coded.

```js
{
  ask:  'Which one is really the biggest?',   // question banner
  hint: "Don't trust the drawing.",           // first tap of the bulb
  tell: 'Tap the elephant.',                  // "Just tell me"
  why:  'An elephant is still an elephant.',  // shown after she wins
  build: function (st) {
    scene(st, 'meadow', { sun: 'sun', clouds: true, flowers: true });
    var e = animal(st, { kind: 'elephant', x: 296, y: 208, size: 13, fill: '#A9A6C4' });
    tap(e, function () { BS.win(); });
    var m = animal(st, { kind: 'mouse', x: 80, y: 168, size: 34, fill: '#C9BFD6' });
    tap(m, function () { BS.nope(m); });      // wobble + "Nice try!"
  }
}
```

Every puzzle is open, so new ones slot onto the end and are reachable at once.
Progress is a *set* of solved puzzles keyed by a **hash of the `ask` text**
(`bs.doneIds`), not by array position, because inserting a puzzle mid-list would
otherwise silently re-point every later solve at the wrong puzzle. Insert wherever
you like; progress follows the question, not the index. The one thing that resets a
puzzle to unsolved is editing its `ask` string.

- `tap(el, fn)` and `drag(el, {onDrop(x,y,back), onMove(x,y), clamp:[x0,y0,x1,y1]})`
- `pad(g, w, h)` — **invisible hit area.** Use it whenever art is thin lines or
  sits off-centre in its group, or small fingers will miss it
- `BS.chips(['4','5','6','7'], 3)` — answer buttons, index of the right one
- `BS.holdZone(el, cx, cy, r, cb)` + `BS.setCheck(fn)` — multi-touch
- `BS.glide(el, x, y)`, `BS.wobble(el)`, `BS.lock(true)` to freeze input mid-animation

## Tuning the arcade games

- **Pairs** — `FACES` at the top of `pairs.js`; `SIZES` for board dimensions
- **Odd One** — `GRID` sets critters per round; the `kinds` list in `build()`
  controls what makes the odd one odd. Delete `'shade'` and `'look'` to make it
  easier for a younger child
- **Echo** — `PADS` for colours and tones; `count()` decides when it goes 4 → 6 pads
- **Spot It** — `PLAN` is `[critters, differences]` per round
- **Slide** — `SIZES`, where `mix` is how many shuffle moves
- **Snapshot** — `plan(round)` returns `{c, r, n}`: grid size and how many to remember
- **Trail** — `labels(r)`; the `r < 3` branch is the numbers-only warm-up
- **Wake Up** — `sleepChance` in `spawn()`, and `tMax` for how long each critter waits
- **Sort It** — `PAIRS` for the colour/shape sets; `sinceSwitch >= 5 + …` sets how
  often the rule flips
- **Maze** — `dims(r)` for grid size per round; generation is a recursive backtracker,
  so every maze has exactly one path and is always solvable
- **Untangle** — `nCount(r)` for how many dots; `extra` in `build()` adds chords
- **Which Way** — `conflictChance` controls how often the flankers disagree
- **Fill It** — `plan(r)` returns `[cols, rows, pieces]`

## Adding a whole new game

Write a file that calls `BS.registerMode('key', {start: function(api){...}, stop: ...})`,
add a `<button class="card c-key" data-go="key">` to the home grid in `index.html`,
add its icon to `drawHomeArt()` in `game.js`, and add the file to `sw.js`. The `api`
object gives you `arena` (a 360×420 SVG), `title`, `score`, `bar`, `foot`, `toast`,
`over`, `confetti`, `load`, `save`, `SFX`.

### The icon

`python3 make_icons.py` renders it from `art.js` at 1024px through a headless
browser and downsamples, so the icon always matches the in-game art. Needs
`pip install playwright pillow` and `python3 -m playwright install chromium`.
Edit the drawing inside the script, not the PNGs.

### After any edit, bump the cache version

In `sw.js`: `var VERSION = 'brain-snacks-v9';` → `'-v10'`. Otherwise the phone keeps
serving the cached copy and your change never appears.

## Why the code looks slightly old-fashioned

Safari 12 is the last version an iPhone 6 can run, and a single `?.` anywhere in a
file stops that whole file parsing — silently.

- No `?.` or `??` (Safari 13.1), no `.at()`, no `Object.fromEntries`, no arrow functions
- No `gap` on flex containers (Safari 14.1) — grid `gap` only, with `grid-gap` beside it
- No `aspect-ratio`, no `:is()`, no `inset:` shorthand
- No `element.animate()` (Safari 13.1)
- **SVG transforms are set as attributes, never through CSS.** `transform-origin` on
  SVG is unreliable in this WebKit. This is the thing most likely to bite you
- **Move things with `A.place()`, never bare `A.at()`.** Every character has an idle
  breathing animation anchored to a `__home` point. `at()` sets the transform but
  leaves the anchor behind, so the next animation frame yanks the character back to
  where it was born. This silently froze the maze mouse and the ladder cat until it
  was tracked down; `place()` moves the anchor too
- Gradients are **cached per colour per SVG**, so a board of 20 critters creates a
  handful of gradient defs rather than 20. Matters on 1 GB of RAM
- **One shared animation ticker** in `art.js` drives every blink, bob and glide.
  Screen changes call `ART.stopAll()`. Never start a bare `requestAnimationFrame`
  loop in a puzzle — it will keep running after the level is gone
- Sound is synthesised with Web Audio, and the context is woken on the first tap
  because iOS requires a user gesture
- No frameworks

## Tested

Everything below was driven programmatically, not eyeballed.

**Puzzles** — all 56 played to completion, and all 56 checked to confirm the obvious
wrong moves are rejected rather than accidentally winning. The multi-step ones were
solved move by move: Hanoi in seven, the river crossing including the backwards trip,
the water jugs through all six pourings, the sliding block in four moves, the frog
swap in eight hops.

**Games** — a full Pairs board solved; Odd One and Spot It cleared through rounds;
Echo's flashes read off the screen and repeated back; Slide verified to move only
tiles beside the gap; Snapshot recalled in full with a wrong tile confirmed to cost a
heart; Trail's out-of-order taps rejected; Wake Up run for 22 critters, tapping the
awake and ignoring the sleepers, finishing on 27 with all hearts intact; Sort It
carried through a live rule change; Maze reconstructed from its rendered walls,
solved by breadth-first search, and the sprite's on-screen position measured at every
step; Untangle solved by restoring the circle layout; Which Way answered by reading
the middle arrow's direction out of the DOM; Fill It solved on four consecutive
boards by exact-cover search.

**Structural** — every screen scanned for broken SVG geometry (0 bad values across 56
puzzles and 14 games), no JS errors anywhere, and animation teardown confirmed firing
140 times across a full tour.

**Layout, measured in v10** — the play screen column was computed from the CSS for
all 73 puzzles at both sizes, word-wrapping each `ask` banner to get its real height:

| | available | worst case | headroom |
|---|---|---|---|
| 375×667 fullscreen | 639px | #70, 3-line banner + chips = 498px | 141px |
| 375×553 with toolbars | 525px | #70, 3-line banner + chips = 478px | 47px |

The binding constraint is the **length of the `ask` string**, not the artwork: the
stage box is a fixed 83.33% of width and the chips tray is fixed, so a fourth wrapped
line is the only thing that moves the total. #70's question was cut from 127 to 109
characters during v10 for exactly this reason, which bought a whole line back.

Still unmeasured: the arcade screen with a difficulty picker in the footer (Pairs,
Slide). v7 reasoned it at roughly 541px of 553. Measure before adding to that footer.

### v11 — to one hundred

Twenty-seven added as `puzzles5.js`, 74–100, in four groups.

| # | puzzles | the idea |
|---|---|---|
| 74–79 | postman, dominoes, pancakes, ice, scales, seeds | planning several moves ahead |
| 80–85 | pulley, lever, bike tracks, falling stones, candles, wind | how the world actually behaves |
| 86–92 | mislabelled boxes, higher-or-lower, colour code, lily pond, handshakes, days, the door rule | deduction with nothing stated |
| 93–100 | string, overlays, occlusion, folding, cuts, shadows, opposite faces, water | seeing from an angle nobody drew |

Six of them use an interaction the app did not have: tapping **roads** rather than
places (74), prefix-flipping a stack (76), picking a **direction** and sliding until
something stops you (77), putting weights on **either** pan (78), pouring an amount
the board decides rather than you (79), and a guess-with-feedback loop (87).

**Bugs found in v11:**

- **The colour code was not solvable.** Its two scored guesses both came back "1
  right", and **six** of the 27 possible codes fit those scores — she could only have
  guessed. Searching every answer against every pair of guesses, exactly six setups
  pin a single code without a guess scoring 3, and in all six **both guesses score
  zero**. That is what ships now, and it is a better puzzle: two tries, nothing right,
  and between them everything else is ruled out. This is the third time this codebase
  has shipped a draft puzzle that looked fine and could not be solved
- **The ice puzzle solved itself in two slides.** The intended route was three, but a
  decoy rock at (4,3) accidentally acted as a brake for a straight down-then-left run.
  Moved to (3,3); BFS now confirms the minimum is three and that it matches the
  written hint
- **The seed feeders solved themselves in two pours** from the first start tried.
  Every three-way split of twelve was searched; `[10,1,1]` is the only family needing
  four, so that is the one shipped
- **The penguin was a dark duck.** Caught by the v10 species audit the moment the word
  "penguin" was added to it — which is the point of having it. `SPECIES.penguin` now
  exists (upright, white front, flippers, orange feet)
- **The ice grid's hit areas sat underneath the direction pad**, so taps meant for
  the pad could land on a square instead. Grid shrunk, pad moved clear

**Testing.** All four earlier suites re-run over 100 puzzles, plus 95 new assertions:

- geometry, text-under-art and panel-edge sweep: **0 issues across 100**
- species vs question text: **0 mismatches across 100**, and the audit was
  *negative-controlled* — the penguin was temporarily swapped back to a duck to
  confirm the check actually fires rather than passing vacuously
- single-tap sweep: **0 puzzles winnable by tapping anything**
- solvability proved by search, not asserted: Euler path for the postman (and that
  starting from a four-road junction is provably impossible), prefix-reversal BFS for
  the pancakes, slide-BFS for the ice, exhaustive search for the seeds, the full
  27-code search for the colour lock
- facts behind the puzzles computed rather than trusted: the three strings **measured**
  by flattening their Béziers (224 / 386 / 294 units — the longest is not the widest),
  the two overlay sheets actually intersected, the die's face adjacencies enumerated to
  confirm the moon is the only face never seen beside the star, the handshake picture
  counted (6 lines), Tuesday + 10 computed, the candles' rendered heights compared
- layout re-measured at 375×667 and 375×553; the tightest case is still #70 with 47px
  of headroom, and nothing new comes near it

**Honest gaps, unchanged and important.** Still nothing rendered — Chromium cannot be
downloaded in the sandbox, so every one of these 100 has been *measured* and none has
been *looked at*. The riskiest of the new ones on a real screen: the isometric die in
#99 (three small faces with five hand-drawn glyphs), the bike tracks in #82 (the whole
puzzle rests on the splatter reading as "flicked backwards"), and #93, where the three
strings must look plausibly similar in length or the puzzle is trivial. Look at these
on the phone before trusting them.

### v10 — twelve new puzzles, and the wrong animals

Twelve added as `puzzles4.js`, 62–73. The v9 rule held: **new pictures, not easier
versions**. No two share artwork or a mechanic, and five use an interaction that did
not exist in the app before.

| # | puzzle | interaction | what it builds |
|---|---|---|---|
| 62 | shunting yard | drag trains between four slots | parking somewhere useless so another can pass |
| 63 | eat every leaf | tap a neighbouring leaf | a Hamiltonian path, with real dead ends |
| 64 | program the bee | **queue five arrows, then run them** | writing the whole plan down before moving |
| 65 | the tilted jars | tap the jar | water stays flat however you hold it |
| 66 | the low sun | drag the shadow to a zone | two rules at once: side, and length |
| 67 | off the table | tap where it lands | forward motion does not stop when the table does |
| 68 | the two bins | drag into a bin | a hidden rule behind colour and shape as decoys |
| 69 | the machine | chips | infer a rule from three examples, apply to a fourth |
| 70 | the sock drawer | chips | pigeonhole — count the colours, not the socks |
| 71 | from above | tap the plan view | flatten a solid into a view nobody showed you |
| 72 | make the square | **tap two pieces** | the right count is not the right shape |
| 73 | turned around | tap the shape | a rotation, with its mirror sitting next to it |

64 is the load-bearing one: the plan is committed *before* anything moves, so she
cannot feel her way to the answer one tap at a time.

**Bugs found in v10.** Every one was found by measurement, not by looking:

- **Two puzzles drew the wrong animal.** The frog swap drew four **ducks** and the
  stepping-stones frog was a green **bunny**; the river crossing said "hen" and drew a
  duck. A child who reads *frog* and sees a beak concludes she misread. Added
  `SPECIES.frog` and `SPECIES.hen`. Found by cross-checking every animal word in
  `ask`/`hint`/`tell`/`why` against the `__kind` actually rendered — now 0 mismatches
  across 73 puzzles, and it is a standing test
- **"Who owns the cat?" drew no cat, no dog and no fish** — three identical blobs and
  three names, with the whole story invisible. The three pets are now on screen
- **Six puzzles had text underneath artwork or clipped by the panel edge.** The
  sleeping owl's "z z" sat under the sun (one 100% covered, one 41%); the lift's
  floor-1 number was 71% under the "Up 3" button; the mirror puzzle's "mirror" caption
  was 60% under an answer card *and* its cards ran 3.5 units off the stage; the clock's
  three "the 6 / the 9 / the 3" labels, the block-stack caption and the road caption
  all sat within 9 units of a panel edge that has a 20px corner radius and a 3px inset
  border drawn over it. Found by computing a real bounding box for every element,
  walking the tree in paint order, and flagging any text a later opaque shape covered
- **`tap()` swallowed the second of two quick presses on the same button.** It held a
  flat 280ms lockout per element to stop iOS firing `touchend` and a synthetic
  `mouseup` for one physical tap. That is fine when every tap is a different target —
  which was true of all 61 old puzzles, which is why it was never noticed — but the
  bee puzzle needs the same arrow pressed twice in a row, and the second press
  vanished. It now suppresses the *ghost mouse event* specifically (a `mouseup` within
  700ms of a `touchend`) and keeps only a 60ms same-type guard. All 73 puzzles re-run
  after the change

**Testing.** Four suites, all driven programmatically against a jsdom build of the
real `index.html`. Chromium cannot be downloaded in the build sandbox, so geometry is
computed analytically — every element's transform is accumulated into a matrix and
every primitive gets an exact axis-aligned box, which is stricter than `getBBox` for
this purpose because it also gives paint order.

- **Geometry + text** — 73 puzzles swept for `NaN`/`undefined`/`Infinity`, art off the
  360×300 stage, text covered by later opaque artwork, and text inside the panel's
  clipped margin. 0 issues
- **Win path and wrong path** — every tappable target in every puzzle tapped in
  isolation, on a fresh build each time. Each puzzle has at least one winning target
  **and** at least one that is rejected: nothing in the app is winnable by tapping
  anything
- **Solvability proved in code, not asserted** — the shunting yard by BFS over its own
  move rules (6 moves, and it proves the siding is required); every leaf eaten by
  exhaustive search, plus a proof that a plausible wrong route really does strand the
  caterpillar; the bee's route proved **unique** across all 32 orderings of five
  arrows; the square proved to have exactly one tiling pair, and the bar-of-three plus
  the single square proved to sum to four cells and still not fit; #73's three options
  proved to be a rotation, a reflection-that-is-not-a-rotation, and neither
- **Measured on screen, never by score** — the frog, the caterpillar, the bee, the lift
  car and the two trains all had their rendered `transform` read at every step. A maze
  bug once passed a score-based test for a whole version while the screen was frozen,
  so a move only counts here if the sprite's transform changed. The tilted jars are
  checked by transforming the water polygon into world coordinates and measuring the
  surface angle: 0.0° for the right jar, 24.0° and 156.0° for the two wrong ones

18 assertions on the repaired puzzles and 48 on the new ones, all passing.

**Honest gaps.** Nothing was rendered to a real screen — no Chromium in the sandbox,
so nothing here has been *looked at*, only measured. Three things that only a render
would catch: whether the new frog and hen actually read as a frog and a hen at
size 13, whether the isometric block tower in #71 reads as a tower, and whether the
bee's five-slot plan strip is legible on a 4.7-inch screen. The v9 notes record that a
coin one pixel off the stage edge and kernels poking through a corn cob were both
invisible to every automated check. Look at 62–73 on the phone before trusting them.

### The 36-40 difficulty ramp (v9)

Puzzles 20-34 are all *look-and-tap-the-right-one*. 35 is Hanoi and 41 is the river:
both need a multi-move plan. That is the real cliff, and it is a change of **kind**,
not of degree.

v8 tried to ramp it with easier variants of the same two puzzles. That was wrong: it
put five near-identical screens back to back (two boats, three jug boards), which is
exactly the thing that makes a child stop looking. Those four were deleted.

v9 instead puts five puzzles in the gap that share **no artwork and no mechanic** with
each other or with anything else in the app. Each asks for a short plan rather than a
single correct tap:

| # | puzzle | interaction | what it builds |
|---|---|---|---|
| 36 | pay exactly 8 | tap coins in and back out of a purse | overshooting and taking a move back |
| 37 | turn every lamp on | one tap changes three lamps | a move can undo another move |
| 38 | hop the frog across | jump one stone or two, never more | planning a route before moving |
| 39 | seat three on a bench | two rules at once | checking constraints, the river skill |
| 40 | ride the lift to floor 6 | up 3 or down 2 only | **going down on purpose to get up** |

40 is the load-bearing one: 1 → 4 → 2 → 5 → 3 → 6 forces two downward moves, which is
the river's insight in a picture that looks nothing like the river.

**If you add more here, add different pictures, not easier versions.** Variants read as
repetition, and repetition is what loses a seven-year-old.

### Bugs caught in v9

- **The last coin sat one pixel off the right edge** of the 360-wide stage, the lift
  buttons touched y=300 exactly, and the corn kernels were still laid out for the old
  ellipse so they poked through the tip of the new cob. All three were invisible to
  every automated check and only showed up on a render
- **Only 16 of 32 lamp start states are solvable at all**, and the obvious one (all
  off) is a two-tap giveaway. Caught by BFS before the puzzle was written; the shipped
  start needs three taps and is provably solvable

### Bugs caught in v8

- **The river puzzle drew a dog for the fox and a yellow blob for the corn.** The text
  said fox and corn; the picture said dog and mango. A child who reads one thing and
  sees another concludes she misread. Added `SPECIES.fox` to `art.js` (upright
  dark-tipped ears, white muzzle and chest, brush tail with a white tip) and a `cob()`
  helper with kernel rows and husk leaves
- **A puzzle that wins on a timer could win on the wrong screen.** The jugs fire
  `BS.win` 400ms after the last pour and the river 730ms after the last crossing;
  leaving inside that window popped the win overlay over the next screen and marked
  whatever puzzle was current as solved. `leave()` now sets `locked`

### Bugs caught in v7

- **The wrong-answer wobble never rendered.** Every character has an idle bob, and the
  shared ticker runs jobs newest-first — so the bob ran *after* the wobble each frame
  and overwrote it with the character's home position. Measured: 0.00 units of
  horizontal travel on a bobbing character versus 10.17 with `bob:false`. This was the
  main feedback for a wrong tap across all 56 puzzles. The wobble now shakes the
  `__home` anchor and lets the bob carry it
- **The wobble walked characters up the screen.** It snapshotted `__y`, which on a
  bobbing character includes the current bob offset, then wrote that back into
  `__home` on completion. Measured drift: −0.717 units after six wrong answers
- **Six games could repaint themselves over a later screen.** Odd One, Spot It, Trail,
  Maze, Untangle and Fill It each scheduled the next round on a 0.5–1.3s timer with no
  cancellation and no re-check of the play flag, and every one calls `build()`, which
  draws into the *shared* arena. Solve a round, tap Back inside the window, open
  another game, and the old game paints over the new one. Measured in Trail: 9
  elements repainted over the next screen before, 1 (untouched) after
- **A rejected Fill It piece never went back to the tray.** `BS.nope(piece)` and
  `BS.glide(piece, home)` are called on consecutive lines; the glide finished at 260ms
  and the wobble's final frame at 340ms snapped the piece back to the invalid drop
  spot. Measured: ended at the drop position, now ends in the tray. Animations now
  claim ownership of an element, so the last one started wins and a drag beats both
- **`cache.addAll()` was atomic**, so one missing file would have made the service
  worker fail to install and the app lose offline entirely — while still looking fine
  on wifi. Each file is now cached on its own
- **"Start over" left three keys behind** (`bs.pairsBest`, `bs.pairsLevel`,
  `bs.slideLevel`)

### Bugs earlier testing caught

- **The maze mouse never moved.** Its idle animation was anchored to its birth
  position and overwrote every step. The score advanced, so a score-based test passed
  while the screen was frozen — the test now measures the sprite's transform. The same
  bug was silently breaking the ladder puzzle
- **Two puzzles were impossible.** The water jugs had one Empty button that emptied
  both jugs, killing the only solution; the sliding block had a three-row block in a
  four-row grid, so it permanently covered the exit
- **The frog puzzle ignored every tap** — the frogs were drawn over the lily pads, so
  touches landed on artwork with no handler
- **Fill It's tray overlapped its pieces**, so dragging grabbed the wrong one
- **Untangle could deal a board that was already solved**
- **One matrix puzzle had the wrong answer written in its hint text**
