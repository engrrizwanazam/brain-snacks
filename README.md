# Brain Snacks

Twenty-eight games for a 6–8 year old, built to run on an iPhone 6 (iOS 12.5 /
Safari 12) and on anything newer. Nothing in it says "maths".

**v13, 14 November 2026.** v10 was built from the copy of the project that was then in
the Claude project docs, which was v9. The real latest was v12. v13 is the two put back
together: everything v12 had, with the v10 look, ladder and fixes, plus:

- **130 trick puzzles in thirteen places.** All 100 of v12's, 25 of v10's thirty (the
  other five were the same idea as a v12 puzzle and were dropped), and five new ones.
  Every v12 puzzle keeps its save key, so nothing she has solved comes back unsolved.
- **27 endless games.** v12's six that v10 was missing (Cups, Follow, How Many, Which
  Pile, Say the Colour, Opposite Day), v10's six, and two new: Shadows and Round Up.
- **Notches and home bars.** The header no longer sits under the status bar on newer
  phones. See "Any screen" below.
- **Animals redrawn.** Cat, dog, bear and fish are new drawings, and tiger, panda,
  monkey, cow, sheep and turtle are new animals. A cow is now a cow from its horns.
- **One wrong answer corrected** (three cuts of a pancake make 7 pieces, not 6) and
  five smaller faults. See "Bugs caught in v13".

| shelf | game | what it is | what it works on |
|---|---|---|---|
| | **Tricks** | 130 puzzles, each with a catch. The main event | lateral thinking |
| Quick! | **Odd One** | find the different critter before the timer ends | visual discrimination |
| | **Spot It** | two pictures, a few quiet differences, on the clock | comparison, sustained attention |
| | **Wake Up** | tap the awake ones, leave the sleepers alone | impulse control (go / no-go) |
| | **Which Way** | tap the way the *middle* arrow points | attention under interference |
| | **Trail** | tap in order: 1, 2, 3… then 1, A, 2, B… | attention switching |
| | **Sort It** | sort by colour… then the rule changes to shape | cognitive flexibility |
| | **Big One** | who is bigger in real life? The drawing lies | inhibition (size Stroop) |
| | **Chomp** | feed the monster two snacks that make his number | number bonds, fluency |
| | **How Many** | berries flash and vanish. How many were there? | subitising |
| | **Which Pile** | which pile has more? The big stones are not more | number against size |
| | **Say the Colour** | the word says RED, the ink is blue. Tap the ink | inhibition (Stroop) |
| | **Opposite Day** | tap the burrow the rabbit did *not* come out of | inhibition, rule holding |
| | **Shadows** *new* | one animal in the dark. Whose outline is it? | shape from outline |
| | **Round Up** *new* | a field of animals. Count only one kind | selective attention, counting |
| Remember! | **Pairs** | memory matching, three board sizes | recognition memory |
| | **Echo** | watch colours light up, then repeat the sequence | sequential recall |
| | **Snapshot** | critters flash, then vanish. Tap where they were | visuospatial working memory |
| | **Who Left?** | a crowd, a curtain, and one of them is gone | working memory (object identity) |
| | **Cups** | the ball goes under a cup, the cups swap | tracking one object |
| | **Follow** | some light up, then they all wander. Which were they? | tracking several objects |
| Figure it out | **Slide** | sliding tile puzzle, three sizes, always solvable | spatial planning |
| | **Maze** | drag the mouse to the cheese | route planning |
| | **Untangle** | drag the dots until no strings cross | spatial reasoning, persistence |
| | **Fill It** | pack the pieces to cover every square | spatial planning |
| | **Beads** | one bead is missing from the string | pattern induction, two rules at once |
| | **Robot** | plan the whole route, then press GO | planning, sequencing |
| | **Mirror** | paint the other half to match | symmetry |

All twenty-seven games generate their own rounds, so they never run out.

## Any screen

v12 and v10 put the back button and the score 14 px from the top of the page. Installed
to a home screen the page is drawn underneath the status bar, so on a phone with a notch
or a Dynamic Island they were behind the clock.

- The page already asked for the whole screen (`viewport-fit=cover`). It now also reads
  how much of it the phone keeps for itself (`safe-area-inset-top` and `-bottom`) and
  pads every screen, the win card, the hint and the play log by that much. On an iPhone
  6 both numbers are 0 in Safari and 20 px when installed, so nothing changes there
  except that the header clears the clock.
- Both spellings are present: `constant()` for iOS 11.0–11.2 and `env()` for everything
  after. A browser that knows neither keeps 0.
- On a tablet or a phone on its side the app is a centred column no wider than the
  height can show in full (`--appw`, set in `fit()` in `game.js`). Before, a wide screen
  made the picture wider than the screen was tall.

Chrome has no notch, so this was tested by forcing the two inset numbers to the values
real phones report, on eight screen sizes. **It has not been seen on a real notched
phone.** If the header is still too high on yours, the one number to raise is the
`14px` in `.screen { padding-top: calc(14px + var(--sat)) }` in `index.html`.

## The Tricks ladder

Every puzzle carries a number, `d`, and the list is sorted by it. **`d` is the only
thing that decides the order.** Which file a puzzle lives in no longer matters, so a new
puzzle goes at the difficulty it deserves by choosing a number between its neighbours
(`d: 43.5` lands between 43 and 44). Nothing is locked.

Ten puzzles make a place: Sunny Meadow, Duck Pond, Toy Room, Candy Lane, Sunset Hill,
Night Woods, Robot Lab, Snowy Peak, Frog Marsh, Farm Yard, Pig Parade, Jumbo Jungle,
Star Station (`CHAPTERS` in `game.js`). The places are names and
pictures only. They are not called levels, and nothing says what a place "teaches".

### Where the v12 puzzles went

v12's forty extra puzzles had no `d`, because v12 still ordered by file. Each was read
against its new neighbours and given one. The easiest of them (which flag is drawn
wrong, which candle was lit first) sit in the fifth place; the hardest
(the die's opposite face, the feeders, the wrong labels, three cuts) are in the last.
`tests/ladder.js` prints the whole list with its numbers. **This is a judgement, as
before.** The play log is what corrects it.

The five new ones: who is in the bush (#14), line them up by real size (#28), one sheep
hops off the plank (#34), what the turtle sees from the other side (#38), and hens and
sheep behind a fence, the last puzzle of all.

### Was the old order gradual? No, in four places

*(Written for v10. The position numbers in this section are from the 90-puzzle list.)*

Checked by reading all 60 against each other, then by where the hard ones sat:

1. **The files were the order.** `puzzles2.js` (the 25–32 band) held the 3-and-7-make-10
   robot and the which-cup-fills pipes, which are easier than several of the first 24,
   and `puzzles3.js` opened with a two-rule matrix straight after them.
2. **Tower of Hanoi (seven moves) came before every puzzle that prepares for it.** It is
   now #71, after the two-seat river, Dad's boat and the first jug puzzle.
3. **Easy puzzles were stranded in the hard batch.** "How heavy is one star" (halve six)
   was #51 of 60; it is now #44 of 90. The dots-and-colours pattern piece was the last
   puzzle of all at #60 although the harder shape matrix was #33; the easy one now comes
   first (#54, then #61) and works as its run-up.
4. **The 4 × 4 shape grid has one gap per row**, so each answer is forced. It sat far
   behind puzzles that need two clues at once. It is now #67, straight before the new
   3 × 3 fruit grid, which does need a row and a column together.

The thirty new puzzles were written to fill the thin stretches (11–60 had only a handful
of number and logic puzzles) and to give the last place real weight.

**This order is a judgement, not a measurement.** It will be wrong for her somewhere.
The play log now says where: see "Harder than their place" below.

### The thirty new puzzles

- **Catch puzzles:** the biggest number is the smallest drawing; one egg wobbles if you
  watch; the moon is also in the pond; a winking owl; the frog needs two paints mixed
  first; the tallest is the mouse on the crate; one cut is not through the middle; two
  lines that only look different (drag one to check); the ball that belongs in both
  hoops; the sun is behind the cloud the shadows point at.
- **Number sense without sums on show:** fair shares, hops of three, biggest number
  from three cards, a torn corner of a number chart, growing jumps, a dog worth two
  cats plus a bit, a lily patch that doubles.
- **Thinking ahead:** follow the arrows, then *write* the arrows; visit every flower
  once; every ice cream exactly once; seat four cats; a 3 × 3 fruit grid; three doors
  and one true sign; and a berry game against a monster who plays properly.
- **Spatial:** one bead out of place, a turned shape among flipped ones, the view from
  above.

## The play log

Hold the title on the home screen for **three seconds**. Deliberately plain, so if she
finds it she sees a boring wall of numbers.

Per puzzle: times opened, times won, wrong taps, hint taps, "just tell me" taps, times
left unsolved, and fastest solve. Above the table:

- **Stuck on:** unsolved puzzles ranked by effort spent on them.
- **Harder than their place** *(new)*: puzzles that cost her much more than their
  neighbours in the list. These are the candidates for a bigger `d`. This is the line
  that turns the ladder from a guess into something corrected by her play.

The log is keyed by puzzle, not by position, so re-ordering never mixes it up, and it
is written at most once every half second instead of on every tap.

**It never leaves the phone.** No network calls, no analytics, nothing transmitted.
It lives in `localStorage` under `bs.log`, and is cleared by "Start over" or by the
Clear button on the panel. Keep it that way: the moment anything is transmitted,
COPPA / GDPR-K stop being simple.

## Target device: decided, not drifting

**Decision, 2 August 2026: keep the Safari 12 constraint. Re-confirmed for v10.**

Every file parses as ES5 (checked with a parser, not by eye) and the CSS is scanned for
flex `gap`, `aspect-ratio`, `:is()`, `inset`, `clamp()`. The one newer thing in the CSS
is the font name `ui-rounded`, which Safari 12 ignores and falls through to the system
font. Revisit when something specific is blocked; the likeliest trigger is still a
Nastaliq font for Urdu content.

## Deploy

Upload the folder to the GitHub repo (the Action stamps the cache version), or drag it
onto `app.netlify.com/drop`. HTTPS is what makes the offline cache work. On the phone,
open the URL **in Safari**, then Share → **Add to Home Screen**.

The `tests/` folder is not part of the app and is not cached. Upload it or leave it out.

## Files

| file | what's in it |
|---|---|
| `index.html` | app shell, all the CSS, the visual identity |
| `art.js` | **characters, scenery, effects.** Change how everything looks here |
| `game.js` | engine: touch, drag, sound, screens, the ladder, the play log |
| `kit.js` | **shared helpers for content files** (`KIT.options`, `KIT.orderGame`, `KIT.pad`, `KIT.banner`, `KIT.hearts`…) and `KIT.ZOO`, every animal with its usual colour |
| `puzzles.js` `puzzles2.js` `puzzles3.js` | the first 60 or so, as v12 had them |
| `puzzles4.js` `puzzles5.js` | v12's two later packs (39 puzzles) |
| `puzzles6.js` `puzzles7.js` | the 25 kept from v10 (these were `puzzles4/5.js` in v10) |
| `puzzles8.js` | the five new in v13 |
| `oddone.js` `spot.js` `wakeup.js` `whichway.js` `trail.js` `sortit.js` `bigone.js` `chomp.js` `howmany.js` `whichpile.js` `colour.js` `opposite.js` `shadows.js` `roundup.js` | Quick! |
| `pairs.js` `echo.js` `snapshot.js` `wholeft.js` `cups.js` `follow.js` | Remember! |
| `slide.js` `maze.js` `untangle.js` `fillit.js` `beads.js` `robot.js` `mirror.js` | Figure it out |
| `sw.js` | offline cache |
| `tests/` | the test suite (see below) |

## Adding a puzzle

Put it in any puzzle file, inside the `BS.addPuzzles([...])` call.

```js
{
  id: 'n-biggest',                            // optional but wise: progress survives rewording
  d: 12.5,                                    // where it sits. Between two neighbours
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

The stage is 360 × 300 units. Progress is keyed by `id`, or by a hash of the `ask` text
when there is no `id`. The 100 that came from v12 have no `id`, so **editing one of their `ask`
strings resets that puzzle to unsolved** unless you first give it an `id` equal to its
old hash (the play-log table and `tests/ladder.js` print it).

- `tap(el, fn)` and `drag(el, {onDrop(x,y,back), onMove(x,y), clamp:[x0,y0,x1,y1]})`
- `BS.later(fn, ms)` — **use this, never `setTimeout`.** It is cancelled when she leaves
  the puzzle, so nothing fires on the next screen
- `KIT.pad(g, w, h)` — invisible hit area for thin or off-centre art
- `KIT.options(st, y, draw, rightIndex)` — a row of picture answers
- `KIT.orderGame(...)` — tap-two-to-swap ordering
- `BS.chips(['4','5','6','7'], 3)` — answer buttons, index of the right one
- `A.hop(el)`, `A.burst(stage, x, y)`, `A.pop(el)` — small celebrations
- `BS.glide(el, x, y)`, `BS.wobble(el)`, `BS.lock(true)`

## Adding a whole new game

One file, plus one `<script>` tag in `index.html` and one entry in `sw.js`. The home
card, its icon, its best-score line and "Start over" all come from the registration:

```js
BS.registerMode('big', {
  name: 'Big One', blurb: 'Bigger in real life', shelf: 'quick',   // quick | memory | think
  color: '#9FE0A8', shade: '#6BAF75',
  keys: ['bs.bigBest'],                    // everything "Start over" must remove
  best: ['bs.bigBest', 'right', 'right'],  // key, singular, plural: "Best 12 right"
  icon: function (svg) { /* draw into an 84 x 42 viewBox */ },
  start: function (api) { /* draw into api.arena, 360 x 420 */ },
  stop:  function () { }
});
```

(The example printed here in v10 used `sub`, `colour` and `unit`. Those were wrong; this
is what the code reads.)

`api` gives `arena, title, score, bar, showBar, foot, toast, over, confetti, load,
save, SFX`, and `api.later(fn, ms)`, which is cancelled when the game is left.

## Drawing things

`animal()` draws 21 animals: mouse, elephant, fox, bunny, duck, owl, frog, hen, pig,
lion, penguin, and redrawn or new in v13 **cat, dog, bear, fish, tiger, panda, monkey,
cow, sheep, turtle**. Origin is the centre of the head. `KIT.ZOO` lists them with their
usual colours. `A.silhouette(g)` turns one into its shadow. `A.robot()` draws the robot.
`critter()` is the simpler round face; Odd One, Snapshot and Follow use it on purpose,
because there the faces are meant to be alike.

What changed in the redraw: every animal now has the two or three things a child names
it by. The dog has drooping ears, an eye patch and a collar; the cat sits, with stripes
and a curled tail; the bear has round ears and arms; the cow has horns, patches and a
pink muzzle; the sheep is a dark face in a cloud of wool. Before, cat, dog and bear
were one head shape with different ears.

`scene(st, kind, opts)` paints a background: `day | meadow | dusk | night | water |
sea | room | candy`, and new `forest | lab | snow | space`. Suns turn slowly, clouds
drift, night stars twinkle.

Characters under size 12 now get a hairline outline. They used to get the same 2.4-unit
ink as big ones, so the small home icons were mostly outline.

## Why the code looks slightly old-fashioned

Safari 12 is the last version an iPhone 6 can run, and a single `?.` anywhere in a
file stops that whole file parsing, silently.

- No `?.` or `??`, no `.at()`, no `Object.fromEntries`, no arrow functions, no template
  literals
- No `gap` on flex containers; grid `gap` only, with `grid-gap` beside it
- No `aspect-ratio`, no `:is()`, no `inset:` shorthand, no `element.animate()`
- **SVG transforms are attributes, never CSS**
- **Move things with `A.place()`, never bare `A.at()`**
- **One shared ticker** drives every animation. Never a bare `requestAnimationFrame`
- **`A.tickFor(el, fn)` for anything that belongs to a drawing** (new). It stops by
  itself when the drawing is removed. Plain `A.tick` is for a game's own clock
- **`BS.later` / `api.later`, never `setTimeout`** (new)
- Gradients are cached per colour per SVG

## Performance (v10 figures; the v13 leak check is under "Tested")

Measured in headless Chrome at 375 × 667. **Not measured on the iPhone 6 itself.**

| | v9 | v10 |
|---|---|---|
| SVG attribute writes in 3 s, home screen | 380 | 28 |
| SVG attribute writes in 3 s, puzzle 1 | 548 | 73 |
| animation jobs alive after 14 rounds of Odd One | 195 | about 20–40 |

- The idle bob writes a transform only when the character has moved a visible amount,
  not on every frame.
- Home icons are still pictures. Only the two mascots and the Tricks rabbit move.
- **The endless games leaked animations.** They redraw the arena each round without
  leaving the screen, so every blink, bob, sun and cloud from every earlier round kept
  running against artwork that was gone. On a 1 GB phone that is a game that gets
  slower the longer she plays. Fixed with `A.tickFor`.
- The play log is saved at most twice a second, not on every tap.

## Tested

`tests/` holds the suite. It needs Node, `npm i playwright acorn`, and Chrome. Run from
the `tests` folder; each takes the app folder as its argument (default `..`).

| script | what it measures |
|---|---|
| `node es5.js ..` | every `.js` file parses as ES5 |
| `node pz.js ..` | 105 puzzles: a wrong move first, then the win, by real touch events |
| `node explore.js ..` | the other 25, which are one-tap answers: taps *every* target on a fresh copy and records which win and which are refused |
| `node gm.js .. [game]` | all 27 games played by reading the screen. Run one game at a time |
| `node misc.js ..` | ladder integrity, both screen heights, timers, old saves, Start over, offline list, CSS, notches and wide screens |
| `node sheets.js ..` | every puzzle at 375 × 667 and 375 × 553, plus screenshots |
| `node leak2.js ..` | animation jobs alive while each game runs by itself for 12 s |

What "passed" means, for the v13 run on 14 November 2026:

**Win path, 130 of 130.** 105 by a written solution played with touch events; a puzzle
counts only if the win card appears *and* the solve is saved. 25 by `explore.js`, where
the winning target is found by trying them all.

**Wrong path, 130 of 130.** For the 105, an obvious wrong move is made first and must
not win and must be refused where it should be. For the 25, every target but one is
refused and exactly one wins; none had a tap that did nothing.

**Solvability, solved in code, then played through the interface.** Everything listed
for v10 that is still in the app, plus v12's: the lamps, the frog's stones, the lift,
the two trains, the pancake flips, the ice slide, the feeders (all BFS), the
caterpillar and the colour code (exhaustive search), the bee's plan, and the postman's
roads (counting the roads at each house, which is what decides whether such a walk
exists). The new fence puzzle: the test counts the eyes and legs actually
drawn and checks that exactly one number of sheep fits them.

**Games, 27 of 27, each by what is on the screen.** New in this run: Cups (keep hold of
one cup through every swap), Follow (mark the ones that lit up, read where they stop),
How Many (count the berries drawn), Which Pile (count the stones; in 5 of 13 rounds the
bigger-looking pile had fewer), Say the Colour (read the ink; word and ink disagreed 8
times in 15), Opposite Day, Shadows (the shadow is one flat colour every round, bear and
panda or cat and tiger are never offered together, a timeout costs a heart), Round Up
(count the wanted animals drawn; no two animals closer than 56 units; the right count
is always among the four buttons). Every game also has a wrong answer made on purpose,
which must cost a heart or end the run.

**Geometry.** Every puzzle before and after play, every game before and after play:
no `NaN`, `undefined` or `Infinity` in any SVG attribute.

**Layout at 375 × 667 and 375 × 553.** Home, puzzle list, all 130 puzzles, the win
card, all 27 game screens and the play log: nothing outside the screen.

**Notches and wide screens.** With the insets forced: 393 × 852 (59 top, 34 bottom),
375 × 812 (50, 34), 430 × 932 (59, 34), 360 × 780 (32, 16), 375 × 667 (20, 0),
820 × 1180 and 1180 × 820 (24, 20), 320 × 568 (24, 0). On each: home, list, three
puzzles, the hint, the win card and five games. Nothing starts above the top inset or
ends below the bottom one, nothing is off the side, and the picture is never under 250
px wide.

**Also:** each of 27 games left after 0.1 s and after 0.9 s with nothing repainting the
next screen; a puzzle left 60 ms after its winning move does not win on the next one;
a v12 save with all 100 solved shows 100 of 130 solved; a v12 play log lands on the
right puzzles; best scores survive; "Start over" removes every key; no game holds more
than 16 animation jobs after 12 s alone, and all drop back to 3 on the home screen.

**Not verified:** anything on a real phone. That means the iPhone 6 (speed, touch feel,
sound), any phone with a notch (the insets were forced, not real), and Android. Whether
the order is right for *her*. The games' later rounds were played to round 5–18, not to
their hardest settings. Whether a 7-year-old can now name every animal: they were
checked by looking at them, which is one adult's opinion.

**One thing to know about saves.** A phone that ran v10 had its play log (not its
solved puzzles) re-keyed with the v9 table. Where v9 and v12 differ in order, a few of
those log lines sit on the wrong puzzle. Solved state is unaffected. The Clear button
on the play log starts it clean.

### Bugs caught in v13

1. **Three cuts across a pancake: the game said 6, the answer is 7.** (v12 content.)
   Six is what you get when all three cuts cross at one point. Move one cut off that
   point and there are seven. The right answer was not even among the buttons.
2. **"I am thinking of a number": the −1 and +1 buttons were half underneath Guess.**
   (v12.) A tap meant for +1 could land on Guess. Moved apart.
3. **Follow could take a heart for a correct tap.** (v12.) Two critters could stop on
   top of each other, and the tap went to the one drawn last. They now stop apart.
4. **The pulley mouse was hidden behind the answer cards**, the lever's answer text
   ran out of its card, and the stone-drop labels overlapped. (v12.) Redrawn.
5. **The sliding-block, mirror-halves, frog-swap and jug fixes from v10 would have been
   lost** by taking v12's `puzzles3.js` whole. They were merged by hand and re-tested.
6. **A new puzzle shipped a `NaN` for about ten minutes**: the turtle was given
   `look: 'down'`, and `look` is a number. The geometry scan caught it.
7. **Five of v10's "new" puzzles were v12 puzzles under another name** (the turned
   shape, the bee's route, the robot program, the view from above, the lily patch).
   The v12 versions stay, because they hold her progress.

### Bugs caught in v10

Found by the suite, none by looking. The first five were already in v9.

- **Slide could not be finished.** Each tile's tap handler remembered the square it was
  dealt on. After a tile moved once, every later tap on it sent the old square, so it
  either refused to move or wobbled a different tile. The old test checked that tiles
  away from the gap do not move, which was true, and never solved a board. Now solved
  by BFS on two sizes and played out move by move
- **The sliding-block puzzle could be won in one swipe.** Only the drop position was
  checked, so the orange block went straight through both tall blocks and out. Blocks
  now slide and stop at the first thing in the way
- **The endless games leaked animation jobs** (see Performance)
- **The mirror puzzle could show a correct picture that never won.** The check ran only
  when a correct square went on. Paint a wrong one, finish, rub the wrong one out:
  perfect mirror, no win
- **Fill It's tray ran off the bottom of the arena** on 4 × 3 boards. The square size
  is now found by laying the tray out and shrinking until it fits
- **Untangle dealt one dot on top of another** in about one board in nine (7 of 60
  sampled). The re-deal path skipped the spacing step
- **The frog swap jammed for good** on a wrong hop, with no way out but leaving. It now
  notices and resets
- **Drawing faults:** the gear puzzle's "this way / that way" arrowheads pointed the
  same way on both answers and their labels were cut off; the cat-mirror answers ran
  off the bottom of the stage; a caption sat on top of the star scale; answer buttons
  in one row came out in two sizes; the home tagline ran under the mascots
- **Wording:** the heavy-ball payoff said nine balls and the picture shows six; the
  odd-rule hint said "sides", and a star does not have five
- In the new code, before release: Beads did not update the score until the next string

### The river and jug ramps (v8)

*Puzzle numbers in this section are v8 numbers. The puzzles are the same; v10 re-ordered the list.*

35 (Hanoi) → 36 (river) → 37 (jugs) was a cliff, not a ramp. She cleared the river by
accident rather than by understanding, and stalled on the jugs. Both puzzles are good;
they arrived with no run-up. Four were inserted, each pair immediately before the hard
one it prepares for, and both hard puzzles were rebuilt on shared engines so the ramp
and the real thing operate identically and only the *rules* change:

| # | puzzle | teaches | moves |
|---|---|---|---|
| 36 | river, boat holds **two** | the controls, and checking who can be left alone | 3 |
| 37 | only Dad can row, 3 children | **the boat cannot come back by itself** | 5 |
| 38 | river, boat holds one | undoing your own progress on purpose | 7 |
| 39 | jugs, measure **2** | pouring stops when one empties or the other fills | 2 |
| 40 | jugs, measure **1** | doing it twice, and counting what stays behind | 4 |
| 41 | jugs, measure 4 | measuring by remainder | 6 |

Puzzle 37 has no losing state at all. Its whole difficulty is noticing that a child
cannot row — which is the brief's rule that the catch should be working out what the
interaction even is.

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
