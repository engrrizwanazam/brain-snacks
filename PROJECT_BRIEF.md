# Brain Snacks — Project Brief

Read this first. It carries the context that isn't obvious from the code, including
several bugs that were expensive to find and are easy to reintroduce.

---

## 1. What this is

A puzzle and brain-game app for a 6–8 year old, running entirely in the browser.
Currently **130 trick puzzles and 27 endless games** (v13, November 2026), under 1MB, no frameworks, no build
step, no dependencies, no network calls after first load.

It was built for one specific child on one specific old phone. It has since grown
past that, which is why this brief exists.

**The design principle, which everything else serves:** it is a *game*, and the
learning is hidden. Nothing in the interface says "maths" or "practice" or "level".
Where a puzzle teaches something, that only surfaces *after* she has already solved
it, as a one-line payoff on the win screen — "Seed, sprout, flower. Everything that
grows takes its turn in order." A child who feels they are being taught will not
come back. Preserve this. It is the single most important rule in the project.

---

## 2. The constraint that shaped everything — and whether to keep it

Every technical decision in this codebase exists to run on an **iPhone 6, iOS 12.5,
Safari 12, 1GB RAM**. That is the last iOS that hardware supports.

This is why there are no frameworks, no arrow functions, no `?.`, no `gap` on flex
containers, no `element.animate()`. A single modern token anywhere in a file stops
that whole file from parsing — silently, with no error the user would ever see.

**This constraint applies to exactly one device in the world: the phone this was
built for.** If the project's goal shifts toward sharing with other children, most of
whom have newer phones, then this constraint is a self-imposed tax with no payer.

Decide this consciously rather than by drift. Three honest options:

- **Keep it.** Costs nothing new — the code already complies. Choose this while the
  original phone is still the main device.
- **Keep it for the current code, relax it for new code.** Tempting, and a mistake.
  It produces a codebase where some files work on the old phone and some don't, and
  the failure mode is a blank screen with no error.
- **Drop it deliberately**, on a specific date, with a note in the README. Then
  modern syntax is fine everywhere and the old phone is no longer supported. Do this
  as one clean sweep, not gradually.

Until that decision is made, **assume the constraint holds**.

---

## 3. Architecture

Three layers. Content never touches the DOM directly; it goes through `art.js`.

```
index.html      app shell, all CSS, the visual identity, script tags
art.js          drawing: characters, scenery, effects, the shared animation ticker
game.js         engine: touch, drag, sound, screens, the ladder, the play log
kit.js          helpers shared by content files, and KIT.ZOO (every animal)
puzzles*.js     the 130 Tricks puzzles (8 files). ORDER COMES FROM EACH PUZZLE'S d, NOT THE FILE
(27 game files) one file per game; each registers itself with its own card and icon
sw.js           offline cache
tests/          the test suite. Not part of the app
```

**A puzzle** is an object passed to `BS.addPuzzles([...])`, with a difficulty `d`
and ideally an `id` (see the README):

```js
{
  ask:  'Which one is really the biggest?',   // banner text
  hint: "Don't trust the drawing.",           // first tap of the bulb
  tell: 'Tap the elephant.',                  // "Just tell me"
  why:  'An elephant is still an elephant.',  // the payoff, shown after winning
  build: function (st) { /* draw, wire up, call BS.win() or BS.nope(el) */ }
}
```

The stage is always **360 × 300 units** and scales to fit, so coordinates can be
hard-coded. Nothing is locked. The list is sorted by `d`.

**A game** registers itself:

```js
BS.registerMode('key', {
  name: 'Name', blurb: 'One line', shelf: 'quick',      // quick | memory | think
  color: '#9FE0A8', shade: '#6BAF75',
  keys: ['bs.keyBest'], best: ['bs.keyBest', 'right', 'right'],
  icon: function (svg) { /* 84 × 42 */ },
  start: function (api) { /* draw into api.arena, 360 × 420 */ },
  stop:  function () { /* clear timers, stop loops */ }
});
```

Then add one `<script>` tag to `index.html` and one entry to `sw.js`. The home card,
icon, best-score line and "Start over" all come from the registration object.

The `api` object gives you `arena, title, score, bar, showBar, foot, toast, over,
confetti, load, save, SFX, later`.

---

## 4. Rules learned the hard way

Each of these corresponds to a real bug that cost real time.

**Move things with `A.place()`, never bare `A.at()`.** Every character has an idle
breathing animation anchored to a `__home` point. `at()` sets the transform but
leaves the anchor behind, so the next animation frame yanks the character straight
back to where it was created. This silently froze the maze mouse — it was
*unplayable* while its score still advanced — and had been quietly breaking the
ladder puzzle for two versions. `place()` moves the anchor too.

**SVG transforms are attributes, never CSS.** `transform-origin` on SVG elements is
unreliable in Safari 12.

**One shared ticker drives all animation** (`ART.tick`). Screen changes call
`ART.stopAll()`. Never start a bare `requestAnimationFrame` loop inside a puzzle — it
keeps running after the level is gone and degrades a 1GB device over a session.

**Hit layers go on last.** If artwork is drawn after its tap target, touches land on
the artwork and nothing happens. This made the frog puzzle completely unresponsive.

**Use `pad()` for hit areas** whenever art is thin lines or sits off-centre in its
group. Thin-line art is effectively untappable for a child's finger. This broke the
ladder, the sort-by-size cards, and the hidden stars.

**Never let generated pieces overlap in a tray.** Overlapping pieces mean a drag
grabs the wrong one. This broke Fill It.

**Gradients are cached per colour per SVG.** A board of 20 critters creates a handful
of gradient definitions, not 20.

**Never `setTimeout` in a puzzle or game.** Use `BS.later` / `api.later`. They are
cancelled when she leaves, so nothing fires on the next screen.

**Animation that belongs to a drawing uses `A.tickFor(el, fn)`.** The endless games
redraw without leaving the screen, and plain `A.tick` jobs from earlier rounds piled up
(195 after 14 rounds of Odd One).

**A handler must not close over a position that changes.** Slide's tiles remembered
the square they were dealt on and the game could not be finished.

**Check the path, not just the destination.** The sliding block could be dragged
through other blocks to the exit.

**Bump `VERSION` in `sw.js` after every change.** Otherwise the phone serves the
cached copy and your change never appears. Currently `brain-snacks-v13`. This catches
everyone at least once.

**Start from the newest copy, and prove it is the newest.** v10 was built on the files
in the Claude project docs, which were v9 while the phone was running v12. Six games
and forty puzzles went missing and had to be merged back (v13). Before changing
anything, compare `VERSION` in `sw.js` and the puzzle and game counts with what the
home screen on the phone says.

**Never rename or reword a v12 puzzle's `ask` without giving it an `id` first.** Its
save key is a hash of that text.

**Nothing may sit in the top or bottom of the page without the safe-area padding.**
Every full-screen layer (`.screen`, `.over`, `.sheet`, `#hint`) adds `var(--sat)` at
the top and `var(--sab)` at the bottom. A new overlay that forgets this will be under
the clock on a notched phone and look fine on the iPhone 6.

**Two things that stop or get tapped must not stop on top of each other.** Follow
took a heart for a correct tap because two critters shared a spot.

**Check the content, not only the code.** v12 said three cuts make six pieces. Every
test passed, because the test tapped the button the game called right. An answer that
is a fact needs the fact checked.

**Options in `animal()` are not free-form.** `look` is a number; a string became a
`NaN` on screen.

---

## 5. Testing discipline

**The suite is in `tests/` and is run with Node + Playwright. Run it; do not rewrite it
from memory.** `pz.js` (puzzles), `gm.js` (games), `misc.js` (layout, saves, timers).

This is the most valuable thing the project has, and the easiest to let slide.

**Never trust a test that checks the score.** The maze bug passed a score-based test
for an entire version while the game was visibly frozen, because the logical position
advanced while the pixels did not. Tests must measure the thing the child actually
sees — element transforms, rendered attributes, on-screen positions.

**Every puzzle needs two tests**, not one:
1. The win path completes.
2. The obvious wrong moves are *rejected* rather than accidentally winning.

A puzzle that can be won by tapping anything is not a puzzle, and this is invisible
without the second test.

**Every generated puzzle needs a solvability proof.** Not "it looks solvable" —
actually solve it programmatically. Mazes were solved by breadth-first search after
reconstructing the grid from the rendered wall lines. Fill It boards were solved by
exact-cover search. Untangle was solved by restoring the circle layout.

Two puzzles shipped in a draft state that were **literally impossible**: the water
jugs had a single Empty button that emptied both jugs, killing the only solution; the
sliding block had a three-row piece in a four-row grid, permanently covering the exit.
Both looked completely fine.

**Scan every screen for broken geometry.** A sweep for `NaN`, `undefined` and
`Infinity` in SVG attributes across all screens catches arithmetic errors that would
otherwise render as invisible or misplaced elements.

**Check both viewport heights.** 375×667 is the home-screen (fullscreen) case;
375×553 is Safari with its toolbars showing. Layout must not overflow in either.

**Bug catalogue so far** — all found by testing, none by looking:

| Bug | Why it mattered |
|---|---|
| Maze mouse frozen by its own idle animation | Game unplayable; score-based test passed |
| Water jugs unsolvable (one Empty for both jugs) | Puzzle impossible |
| Sliding block unsolvable (3-row piece, 4-row grid) | Puzzle impossible |
| Frog puzzle ignored every tap (art over hit layer) | Puzzle unresponsive |
| Fill It tray pieces overlapped | Wrong piece grabbed |
| Untangle could deal an already-solved board | Round trivially over |
| Matrix puzzle's hint stated the wrong answer | Hint actively misleading |
| Ladder/cards/stars had untappable thin-line art | Felt broken to a child |
| Animation loops leaked between screens | Slow degradation over a session |
| Slide tiles remembered their dealt square (v10) | Game could not be finished; old test never solved a board |
| Sliding block passed through blocks (v10) | Puzzle won in one swipe |
| Animation jobs leaked between rounds (v10) | Game slows the longer it is played |
| Mirror puzzle checked only on a correct tap (v10) | Correct picture, no win |
| Fill It tray off the bottom of the arena (v10) | Piece could not be picked up |

---

## 6. Content design principles

**The catch is the content.** A trick puzzle is not a quiz with nicer buttons. The
difficulty should come from figuring out *what the interaction even is* — drag the
sun off the bottom of the screen, cover both holes with two fingers, realise the
third cookie is the moon.

**Wrong answers should be the mistakes children actually make.** Off by one from
miscounting, off by ten from place value, one multiple out on a times table. Random
distractors get eliminated by eyeballing rather than by thinking.

**The hint ladder is two rungs.** First tap of the bulb gives a nudge that reframes
the problem. Only a second tap gives the answer. After four wrong attempts the bulb
starts glowing on its own.

**Difficulty is one number per puzzle, `d`.** The list is sorted by it and split into
nine places of ten. Place new content by choosing a `d` between two neighbours. The
play log's "Harder than their place" line shows which numbers are wrong for her.

**Procedural beats fixed.** All twenty-seven games generate their content, so
they never run out. On a device that spends most of its life offline this matters far
more than a level count.

---

## 7. Roadmap — options, honestly assessed

### A. More content
Cheapest by a distance, and the highest value per hour. The architecture is built for
it: a puzzle is one object, a game is one file.

Worth considering: **Urdu letters and words.** The `animal()` and `scene()` systems
are language-neutral, and there is very little good Urdu-language material for this
age group. This may be the highest-value direction available.

### B. Share the URL with other kids
Nearly free. It already works — send the link, they tap Share → Add to Home Screen.

Before sharing widely, worth doing: a **child-safety and privacy pass** (there is no
data collection, no network calls after load, and no external content — say so
explicitly in a short note), and a check on **Android Chrome**, which has never been
tested. Nothing in the code should break, but "should" is not "verified".

### C. Wrap as a native app (Capacitor)
The realistic native path. Capacitor wraps the existing web app in a native shell and
produces real App Store and Play Store builds from this same codebase. No rewrite.

What it actually costs:
- **Apple Developer Program: $99/year.** Google Play: $25 one-time.
- **A Mac with Xcode** for the iOS build. There is no way around this.
- **Kids' category compliance is strict.** Apple's Kids Category forbids third-party
  analytics and advertising, and requires a privacy policy. This app collects nothing,
  which makes compliance easy — but a privacy policy is still required, and it must
  actually exist at a URL.
- **COPPA / GDPR-K** apply if any data is collected. Currently none is. Keep it that
  way and this stays simple. The moment you add analytics, it stops being simple.
- **Version tension:** recent Capacitor requires iOS 13+. The original iPhone 6 caps
  at iOS 12.5. A published native app would therefore *not run on the phone this was
  built for*. That is a real trade-off and worth naming out loud before starting.

Sensible sequencing: Android first (cheaper, no Mac required, faster review), then
iOS if it gets traction.

### D. Rebuild natively (Swift / Kotlin / Flutter)
Almost certainly not worth it. The app is SVG drawing and touch handling — the two
things browsers do well. A rewrite would cost months and buy performance this app
does not need. Revisit only if you hit a specific wall that a native API solves.

**Suggested order:** A → B → C. Do not start C until a handful of other children have
actually played it and come back a second time. That is the only real signal that the
app is worth putting in a store.

---

## 8. The open question

The single most useful thing to find out: **which of the hard puzzles land and which
frustrate.**

There is a large difference between "hard, and she wants another go" and "hard, and
she puts the phone down". That distinction cannot be determined from the code. Watch
her play a few of the 33–56 batch and note which ones she retries and which ones she
abandons. That observation will aim the next batch far better than any amount of
guessing.

---

## 9. Working on this with Claude

- **Attach the current files** at the start of a conversation, and say which are
  current. The code is the source of truth; this brief may drift.
- **One workstream per conversation.** "Add 8 puzzles" or "fix the maze" or "do the
  Capacitor wrap" — not all three. Long conversations degrade and get expensive.
- **Always ask for the tests to be run**, and ask what they measured. If the answer is
  "the score updated", that is not a test.
- **Ask for the bug list at the end of a session.** Every session so far has surfaced
  real bugs during testing. If a session reports none, that is more likely a testing
  gap than a clean run.
- **Push back on drawing quality.** Screenshots are the most useful feedback you can
  give — the character rebuild happened only because a screenshot showed a tail drawn
  across a face and an elephant that looked identical to a mouse.
