# Give / Take

A 2-player strategy/simulation game. Green and Blue each start with 1000 objects
(10 lives each). On your turn you select a card that sets your objects' give/take
decision rule (or double the stakes, decline, or pause), confirm it, then watch
the round's encounters play out — every living object has 10 random encounters
against the pooled 2000 objects, of either color:

- give + give → shared central pool grows, no life change
- give + take → giver loses a life, taker gains one
- take + take → both lose a life

A central livelihood pool starts at 1000, is capped at 2000, and drops by 100
each round that's actually played. If it hits 0, the game ends with no winner.
If 100 consecutive rounds pass with no deaths and the pool not decreasing, the
game is won and 100 points are split by the surviving color ratio. If one color
is wiped out, a "Check Sustainability" button appears for the other — it plays
10 rounds and declares a winner if that color survives them intact.

## Running it

```
npm install
npm run dev       # start the app
npm test          # run the engine unit tests
npm run build     # type-check + production build
```

The app has two views, toggled from the settings menu (gear icon):

- **Player view** — the field of objects, card selection/confirm/undo, and an
  animated (~5s) playback of each round's encounters.
- **Developer view** — exact stats per encounter sub-round, plus a button to
  export the full game log as CSV.

## Sharing a standalone copy

```
npm run build:single
```

Produces a single self-contained `dist-single/give-take-standalone.html` with
everything inlined (no separate JS/CSS files, no server needed) — open it
directly in a browser, or publish it anywhere that can host a static HTML file.
