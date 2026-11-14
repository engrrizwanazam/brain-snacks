# Brain Snacks tests

Not part of the app. Needs Node 18+, then in this folder:

    npm init -y && npm i playwright acorn && npx playwright install chromium

(or set CHROME=/path/to/chrome to use a browser you already have)

    node es5.js ..     every .js file parses as ES5
    node pz.js ..      105 puzzles: wrong move, then the win        (about 8 min)
    node explore.js .. the 25 one-tap puzzles: every target tapped on a fresh copy
    node pz.js .. "Swap the frogs"     one puzzle, by a piece of its question
    node gm.js ..      27 games played from the screen. Slow; better one at a time
    node gm.js .. slide                one game
    node misc.js ..    ladder, layout at both heights, timers, saves, offline list,
                       then notches and wide screens
    node misc.js .. notch              only the notch and wide-screen part
    node leak2.js ..   animation jobs alive while each game runs alone
    node sheets.js ..  every puzzle at 375x667 and 375x553, screenshots in shots/
    node ladder.js     prints the list in play order with each puzzle's d and id
    node perf.js [folder ...]          animation work per second

A new puzzle needs one `add(...)` line in pz.js: a piece of its question, a wrong
move, and the winning moves. `untested puzzles:` at the end of a run lists any
puzzle without one.
