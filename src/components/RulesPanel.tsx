import { useState } from 'react';
import { STARTING_LIVES, STARTING_POOL, ENCOUNTERS_PER_ROUND, STEADY_ROUNDS_TO_WIN } from '../engine/types';

function QuestionMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.2 9.6a2.8 2.8 0 1 1 4.3 2.4c-.9.6-1.5 1.1-1.5 2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.3" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function RulesPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="rules-panel__icon" aria-label="Rules" onClick={() => setOpen(true)}>
        <QuestionMarkIcon />
      </button>
    );
  }

  return (
    <div className="rules-modal" onClick={() => setOpen(false)}>
      <div className="rules-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="rules-modal__header">
          <h2>Rules</h2>
          <button className="rules-modal__close" aria-label="Close rules" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <div className="rules-modal__body">
          <section>
            <h3>Objects</h3>
            <p>
              Green and Blue each control 1000 objects. Every object starts with {STARTING_LIVES} lives. An
              object's lives can climb above that starting value through encounters, but the moment they reach
              0 the object dies and takes no further part in the game.
            </p>
          </section>

          <section>
            <h3>Encounters</h3>
            <p>
              After a player takes their turn, one round of encounters plays out: every living object (of
              either color) is randomly matched up for {ENCOUNTERS_PER_ROUND} passes against the combined
              pool of both colors' living objects. Each pairing is decided by the two objects' current
              give/take rules:
            </p>
            <ul>
              <li>
                <strong>Give + Give</strong> — neither object's lives change; the shared pool grows.
              </li>
              <li>
                <strong>Give + Take</strong> — the giver loses a life, the taker gains one.
              </li>
              <li>
                <strong>Take + Take</strong> — both objects lose a life.
              </li>
            </ul>
            <p>
              If the same two objects are paired again later in the same round, that repeat still counts as
              one of their {ENCOUNTERS_PER_ROUND} passes, but its outcome is ignored — no lives or pool change.
            </p>
          </section>

          <section>
            <h3>Base patterns</h3>
            <p>Playing one of these sets how every one of your objects decides in an encounter:</p>
            <dl>
              <dt>Always Give</dt>
              <dd>Gives in every encounter, no matter what happened before.</dd>
              <dt>Always Take</dt>
              <dd>Takes in every encounter, no matter what happened before.</dd>
              <dt>Alternate</dt>
              <dd>Flips between give and take each time, regardless of outcome.</dd>
              <dt>Tit-for-Tat</dt>
              <dd>
                Gives by default — but takes once, right after losing a life. That memory carries across
                rounds: an object's win/loss streak isn't reset when a round or turn ends, so a round can
                open on a take rather than a give.
              </dd>
            </dl>
          </section>

          <section>
            <h3>Modifiers &amp; actions</h3>
            <dl>
              <dt>Double</dt>
              <dd>
                Doubles the stakes of your pattern's results (stacks to 4x if both sides are doubled).
                Playing a new base pattern always clears an active double for that color — a double only
                survives a decline or pause, not a rule change.
              </dd>
              <dt>Pause</dt>
              <dd>Skips this round's encounters entirely. The livelihood pool is untouched.</dd>
              <dt>Decline</dt>
              <dd>Plays no card — your current rule carries over unchanged, and the round still runs.</dd>
            </dl>
          </section>

          <section>
            <h3>Wild card</h3>
            <p>
              Instead of playing a card, either player can spend their turn on the wild card: choose, via a
              slider, how many lives (1–10) to give to <em>every</em> living object of <em>both</em> colors,
              paid for out of the shared pool at exactly that total cost. An object already at or past 10
              lives is topped up by less, or not at all, and costs accordingly. Nothing stops a request that
              costs more than the pool holds — it's allowed, and simply empties the pool, ending the game
              under the pool-depleted rule below. Playing it still uses the whole turn: no encounter round is
              simulated, and play passes to the other color immediately.
            </p>
          </section>

          <section>
            <h3>The livelihood pool</h3>
            <p>
              A pool shared by both colors starts at {STARTING_POOL.toLocaleString()} and is capped at that
              value. Every encounter costs it 0.5 regardless of outcome, and a give/give encounter also adds
              2 to it — netting +1.5 overall for give/give and -0.5 for anything else. It's tracked as a
              fraction through the round, then rounded up to a whole number once the round ends.
            </p>
          </section>

          <section>
            <h3>Winning &amp; losing</h3>
            <ul>
              <li>
                <strong>Steady state:</strong> if {STEADY_ROUNDS_TO_WIN} consecutive rounds pass with no
                deaths and the pool exactly unchanged, the game is won and 100 points are split between the
                colors in proportion to their surviving object counts.
              </li>
              <li>
                <strong>Pool depleted:</strong> if the livelihood pool hits 0 — whether from encounters
                draining it or a wild card spending the last of it — the game ends immediately. Whichever
                color has more living objects at that moment wins outright; a tie (including a mutual
                wipeout, which is a tie at zero) ends with no winner.
              </li>
              <li>
                <strong>One color wiped out:</strong> if one color is eliminated while the pool is still
                healthy, the survivor can run a sustainability check — 10 automatic rounds — and wins if they
                come through it all still alive.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
