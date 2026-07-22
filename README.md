# Give / Take

A 2-player strategy/simulation game. Green and Blue each start with 1000 objects
(10 lives each). On your turn you play a card that sets your objects' give/take
decision rule (or double the stakes, decline, or pause), then every living
object has 10 random encounters against the pooled 2000 objects:

- give + give → shared central pool +1, no life change
- give + take → giver loses a life, taker gains one
- take + take → both lose a life

A central livelihood pool starts at 1000 and drops by 10 each round that's
actually played. If it hits 0, the game ends with no winner. If 100
consecutive rounds pass with no deaths and the pool not decreasing, the game
is won and 100 points are split by the surviving color ratio.

## Running it

```
npm install
npm run dev       # start the app
npm test          # run the engine unit tests
npm run build     # type-check + production build
```

The app has two views, toggled from the top bar:

- **Player view** — the field of objects, whose-turn indicator, card/pause
  input, and an animated (~15s) playback of each round's encounters.
- **Developer view** — exact stats per encounter sub-round, plus a button to
  export the full game log as CSV.
