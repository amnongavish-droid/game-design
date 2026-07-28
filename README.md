# Give / Take

A 2-player strategy/simulation game. Green and Blue each start with 1000 objects
(10 lives each). On your turn you select a card that sets your objects' give/take
decision rule (or double the stakes, decline, or pause), confirm it, then watch
the round's encounters play out — every living object has 10 random encounters
against the pooled 2000 objects, of either color. If the same two objects are
paired again later in the same round, that repeat still counts as one of
their 10 encounters, but its outcome is ignored (no life or pool change):

- give + give → no life change, and nets the shared pool +1.5 (+2, then the -0.5 below)
- give + take → giver loses a life, taker gains one
- take + take → both lose a life

Every encounter — whatever the decisions — costs the shared livelihood pool
0.5, so give/give nets +1.5 overall while every other outcome nets -0.5. The
pool starts at 10000, is capped at 10000 (give/give can't grow it further once
there), and only ever moves through these per-encounter effects — there's no
separate per-round decrement. It's tracked as a fraction through the round,
then rounded up to a whole number once the round ends (the on-screen reading
always shows a rounded whole number). If it hits 0, the game ends with no
winner. If 100 consecutive rounds pass with no deaths and the pool exactly
unchanged, the game is won and 100 points are split by the surviving color
ratio. If one color is wiped out, a "Check Sustainability" button appears for
the other — it plays 10 rounds and declares a winner if that color survives
them intact.

## Running it

```
npm install
npm run dev       # start the app
npm test          # run the engine unit tests
npm run build     # type-check + production build
```

The settings menu (gear icon) has a sound toggle and a **Download Log** button
that exports every round played so far as a CSV — for each round: whose turn
it was and what they played, both colors' current rule and double-stakes
state, the pool before/after, each color's surviving object count and total
lives, how many give/give, give/take, and take/take encounters occurred, and
the steady-streak/status at that point.

## Sharing a standalone copy

```
npm run build:single
```

Produces a single self-contained `dist-single/give-take-standalone.html` with
everything inlined (no separate JS/CSS files, no server needed) — open it
directly in a browser, or publish it anywhere that can host a static HTML file.
