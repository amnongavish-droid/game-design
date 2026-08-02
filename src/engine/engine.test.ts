import { describe, expect, it } from 'vitest';
import { createRng } from './rng';
import { decide, updateHistory } from './rules';
import { simulateRound } from './simulate';
import { checkSustainability, createInitialState, takeTurn } from './gameReducer';
import { logToCsv } from './csv';
import type { GameObject } from './types';

function obj(overrides: Partial<GameObject> = {}): GameObject {
  return {
    id: 0,
    color: 'green',
    lives: 10,
    alive: true,
    basePattern: 'always-give',
    doubleActive: false,
    lossStreak: 0,
    ...overrides,
  };
}

describe('rules', () => {
  it('always-give always gives', () => {
    expect(decide(obj({ basePattern: 'always-give' }))).toBe('give');
  });

  it('always-take always takes', () => {
    expect(decide(obj({ basePattern: 'always-take' }))).toBe('take');
  });

  it('alternate flips from its last decision', () => {
    const o = obj({ basePattern: 'alternate' });
    expect(decide(o)).toBe('give'); // no history yet -> give
    updateHistory(o, 'give', 0);
    expect(decide(o)).toBe('take');
    updateHistory(o, 'take', 0);
    expect(decide(o)).toBe('give');
  });

  it('tit-for-tat retaliates once immediately after a loss, then reverts', () => {
    const o = obj({ basePattern: 'tit-for-tat' });
    expect(decide(o)).toBe('give');
    updateHistory(o, 'give', -1); // lost a life
    expect(decide(o)).toBe('take'); // retaliate
    updateHistory(o, 'take', 1); // retaliation succeeded (gained a life)
    expect(decide(o)).toBe('give'); // back to giving
  });
});

describe('simulateRound', () => {
  it('gives every living object exactly 10 encounters when the population is even', () => {
    const objects: GameObject[] = [];
    for (let i = 0; i < 20; i++) objects.push(obj({ id: i, basePattern: 'always-give' }));
    const rng = createRng(42);
    const { subRounds } = simulateRound(objects, 1000, false, rng);
    expect(subRounds).toHaveLength(10);
    // all-give population: nobody dies, all 20 alive every pass
    for (const s of subRounds) {
      expect(s.greenAlive + s.blueAlive).toBe(20);
      expect(s.deathsThisPass).toBe(0);
    }
  });

  it('ignores the outcome of a repeat encounter between the same two objects within a round', () => {
    const objects = [obj({ id: 0, basePattern: 'always-take' }), obj({ id: 1, color: 'blue', basePattern: 'always-take' })];
    const rng = createRng(30);
    const { objects: after, subRounds } = simulateRound(objects, 1000, false, rng);
    // Only 2 objects exist, so every one of the 10 passes is forced to re-pair them — only the
    // first (fresh) pairing has any effect; every later pass is a counted-but-ignored repeat.
    expect(after[0].lives).toBe(9); // take/take: -1 from the one effective encounter only
    expect(after[1].lives).toBe(9);
    for (let i = 1; i < subRounds.length; i++) {
      expect(subRounds[i].poolValue).toBe(subRounds[0].poolValue);
      expect(subRounds[i].greenLivesTotal).toBe(subRounds[0].greenLivesTotal);
      expect(subRounds[i].blueLivesTotal).toBe(subRounds[0].blueLivesTotal);
    }
  });

  it('mutual give leaves lives unchanged and nets +1.5 to the pool from their one effective encounter', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-give' })];
    const rng = createRng(1);
    const { objects: after, pool } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(10);
    expect(after[1].lives).toBe(10);
    // Only their first pairing counts (the rest are ignored repeats): give/give +2, then the
    // universal -0.5 = net +1.5, rounded up to a whole number.
    expect(pool).toBe(1002);
  });

  it('a non-give/give encounter nets -0.5 to the pool, rounded up only at the round\'s end', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-take' })];
    const rng = createRng(1);
    const { pool, subRounds } = simulateRound(objects, 1000, false, rng);
    // Mid-round the pool is fractional (only the final result gets rounded up)...
    expect(subRounds[0].poolValue).toBeCloseTo(999.5);
    // ...their one effective encounter costs -0.5, then Math.ceil at the round's end.
    expect(pool).toBe(1000);
  });

  it('caps give/give growth at POOL_MAX, rounding the plateau up to the cap at the round\'s end', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-give' })];
    const rng = createRng(21);
    const { pool } = simulateRound(objects, 9999, false, rng); // one below the cap
    // Their one effective encounter grows to the cap (10000) then costs -0.5, landing at
    // 9999.5 — which Math.ceil rounds back up to exactly the cap once the round ends.
    expect(pool).toBe(10000);
  });

  it('give vs take transfers a life from giver to taker (their one effective encounter)', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-take' })];
    const rng = createRng(2);
    const { objects: after } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(9); // giver loses 1 from their one effective encounter
    expect(after[1].lives).toBe(11); // taker gains 1 from that same encounter
    expect(after[0].alive).toBe(true);
  });

  it('double combines multiplicatively across both sides: 2x with one side, 4x with both', () => {
    const oneDoubled = [
      obj({ id: 0, basePattern: 'always-give', doubleActive: true, lives: 100 }),
      obj({ id: 1, basePattern: 'always-take' }),
    ];
    const { objects: afterOne } = simulateRound(oneDoubled, 1000, false, createRng(3));
    expect(afterOne[0].lives).toBe(98); // giver loses 2 from their one effective encounter
    expect(afterOne[1].lives).toBe(12); // taker also gains the combined 2x, not its own (1x)

    const bothDoubled = [
      obj({ id: 0, basePattern: 'always-give', doubleActive: true, lives: 100 }),
      obj({ id: 1, basePattern: 'always-take', doubleActive: true }),
    ];
    const { objects: afterBoth } = simulateRound(bothDoubled, 1000, false, createRng(3));
    expect(afterBoth[0].lives).toBe(96); // giver loses 4 (2x2) from their one effective encounter
    expect(afterBoth[1].lives).toBe(14); // taker gains 4 from that same encounter
  });

  it('pausing skips all encounters and leaves the pool untouched', () => {
    const objects = [obj({ id: 0, basePattern: 'always-take' }), obj({ id: 1, basePattern: 'always-take' })];
    const rng = createRng(4);
    const { objects: after, pool, subRounds, deathsThisRound } = simulateRound(objects, 1000, true, rng);
    expect(pool).toBe(1000);
    expect(subRounds).toHaveLength(0);
    expect(deathsThisRound).toBe(0);
    expect(after[0].lives).toBe(10);
    expect(after[1].lives).toBe(10);
  });
});

describe('gameReducer', () => {
  it('creates 1000 green and 1000 blue objects starting at 10 lives with a full pool', () => {
    const state = createInitialState();
    expect(state.objects).toHaveLength(2000);
    expect(state.objects.filter((o) => o.color === 'green')).toHaveLength(1000);
    expect(state.objects.filter((o) => o.color === 'blue')).toHaveLength(1000);
    expect(state.pool).toBe(10000);
    expect(state.currentPlayer).toBe('green');
  });

  it('records rule/action/lives-total/encounter-type details in the round log', () => {
    let state = createInitialState();
    state.objects = [
      obj({ id: 0, color: 'green', basePattern: 'always-give' }),
      obj({ id: 1, color: 'blue', basePattern: 'always-take' }),
    ];
    const rng = createRng(17);
    state = takeTurn(state, { type: 'play-rule', rule: 'always-give' }, rng); // green is currentPlayer
    const entry = state.log[0];
    expect(entry.cardPlayer).toBe('green');
    expect(entry.cardPlayed).toBe('always-give');
    expect(entry.greenPattern).toBe('always-give');
    expect(entry.bluePattern).toBe('always-take');
    expect(entry.greenDouble).toBe(false);
    expect(entry.blueDouble).toBe(false);
    // Only 2 objects, so only their one effective encounter counts: give/take.
    expect(entry.greenLivesTotal).toBe(9);
    expect(entry.blueLivesTotal).toBe(11);
    expect(entry.giveGiveCount).toBe(0);
    expect(entry.takeGiveCount).toBe(1);
    expect(entry.takeTakeCount).toBe(0);
  });

  it('carries a tit-for-tat retaliation streak across rounds, so a new round can open on a take', () => {
    let state = createInitialState();
    state.objects = [
      obj({ id: 0, color: 'green', basePattern: 'tit-for-tat' }),
      obj({ id: 1, color: 'blue', basePattern: 'always-take' }),
    ];
    const rng = createRng(23);
    // Round 1: green still opens on give (fresh streak), blue takes -> green loses a life
    // (9) and blue gains one (11), and green starts a retaliation streak.
    state = takeTurn(state, { type: 'play-rule', rule: 'tit-for-tat' }, rng); // green's turn
    expect(state.objects[0].lives).toBe(9);
    expect(state.objects[1].lives).toBe(11);
    // Round 2 (blue declines, no rule change on either side): the streak from round 1 carries
    // over, so green's first encounter of this new round opens on take, not give — both sides
    // take this time, so both lose a life off their round-1 totals.
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.objects[0].lives).toBe(8);
    expect(state.objects[1].lives).toBe(10);
  });

  it('wild card boosts every living object of both colors, capped at STARTING_LIVES, costing the pool the actual total gained, with no encounter simulation that turn', () => {
    let state = createInitialState();
    state.objects = [
      obj({ id: 0, color: 'green', lives: 3, basePattern: 'always-give' }),
      obj({ id: 1, color: 'blue', lives: 9, basePattern: 'always-give' }), // near cap: gains only 1 of the requested 5
    ];
    state.pool = 100;
    const rng = createRng(18);
    state = takeTurn(state, { type: 'wild-card', livesPerObject: 5 }, rng);
    // No encounters run on a wild-card turn, so the final lives are purely the wild card's effect.
    expect(state.objects[0].lives).toBe(8); // 3 + 5 (full request)
    expect(state.objects[1].lives).toBe(10); // 9 + 1 (capped, not the full 5)
    // wild card cost = 5 + 1 = 6, and nothing else touches the pool since no round is simulated.
    expect(state.log[0].poolBefore).toBe(100);
    expect(state.pool).toBe(94);
    // The round counter only tracks simulations actually played — a wild card doesn't run one.
    expect(state.round).toBe(0);
  });

  it('does not reduce an object already above STARTING_LIVES back down to the cap', () => {
    let state = createInitialState();
    state.objects = [obj({ id: 0, color: 'green', lives: 14, basePattern: 'always-give' })];
    state.pool = 100;
    const rng = createRng(20);
    state = takeTurn(state, { type: 'wild-card', livesPerObject: 1 }, rng);
    expect(state.objects[0].lives).toBe(14); // already above cap: no boost, no cost
    expect(state.pool).toBe(100);
  });

  it('allows a wild card that costs more than the pool holds, ending the game via the pool-depletion rule', () => {
    let state = createInitialState();
    state.objects = [
      obj({ id: 0, color: 'green', lives: 2 }),
      obj({ id: 1, color: 'green', lives: 2 }),
      obj({ id: 2, color: 'blue', lives: 2 }),
    ];
    state.pool = 5; // far less than the 24 this wild card actually costs
    const rng = createRng(26);
    state = takeTurn(state, { type: 'wild-card', livesPerObject: 10 }, rng);
    // The play still goes through in full — every object gets boosted to the cap regardless of
    // the shortfall.
    expect(state.objects.every((o) => o.lives === 10)).toBe(true);
    // The pool is never displayed/stored as negative, just depleted.
    expect(state.pool).toBe(0);
    // Green has more objects left (2 vs blue's 1), so green wins outright.
    expect(state.status).toBe('won');
    expect(state.winner).toEqual({ greenPct: 100, bluePct: 0 });
  });

  it('switches the turn after a wild card, like any other action', () => {
    let state = createInitialState();
    const rng = createRng(19);
    expect(state.currentPlayer).toBe('green');
    state = takeTurn(state, { type: 'wild-card', livesPerObject: 1 }, rng);
    expect(state.currentPlayer).toBe('blue');
  });

  it('resets an active double when the rule is changed', () => {
    let state = createInitialState();
    const rng = createRng(21);
    const green = () => state.objects.find((o) => o.color === 'green')!;
    state = takeTurn(state, { type: 'toggle-double' }, rng); // green's turn -> blue's turn
    expect(green().doubleActive).toBe(true);
    state = takeTurn(state, { type: 'decline' }, rng); // blue's turn -> green's turn
    state = takeTurn(state, { type: 'play-rule', rule: 'always-take' }, rng); // green changes rule
    expect(green().doubleActive).toBe(false);
  });

  it('does not advance the round counter for a paused turn', () => {
    let state = createInitialState();
    const rng = createRng(22);
    expect(state.round).toBe(0);
    state = takeTurn(state, { type: 'pause' }, rng);
    expect(state.round).toBe(0);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.round).toBe(1);
  });

  it('alternates the current player after each turn', () => {
    let state = createInitialState();
    const rng = createRng(7);
    state = takeTurn(state, { type: 'play-rule', rule: 'always-give' }, rng);
    expect(state.currentPlayer).toBe('blue');
    state = takeTurn(state, { type: 'play-rule', rule: 'always-give' }, rng);
    expect(state.currentPlayer).toBe('green');
  });

  it('applying a rule card only changes the current player color objects', () => {
    let state = createInitialState();
    const rng = createRng(8);
    state = takeTurn(state, { type: 'play-rule', rule: 'always-take' }, rng);
    expect(state.objects.filter((o) => o.color === 'green').every((o) => o.basePattern === 'always-take')).toBe(true);
    expect(state.objects.filter((o) => o.color === 'blue').every((o) => o.basePattern === 'always-give')).toBe(true);
  });

  it('ends the game with no winner once the pool is depleted', () => {
    let state = createInitialState();
    state.pool = 0; // force near-depletion
    // always-take vs always-take: only their one effective encounter counts (the rest of the
    // 10 passes are ignored repeats between the same two objects) — take/take isn't give/give,
    // so it only ever costs the universal -0.5, easily depleting a pool already at 0.
    state.objects = [
      obj({ id: 0, color: 'green', basePattern: 'always-take' }),
      obj({ id: 1, color: 'blue', basePattern: 'always-take' }),
    ];
    const rng = createRng(9);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.status).toBe('lost');
    expect(state.winner).toBeUndefined();
  });

  it('declares whichever color has more objects the winner when the pool runs dry with an uneven population', () => {
    let state = createInitialState();
    state.pool = 0.4; // one real encounter's -0.5 universal cost is enough to deplete it
    state.objects = [
      obj({ id: 0, color: 'green', basePattern: 'always-take' }),
      obj({ id: 1, color: 'green', basePattern: 'always-take' }),
      obj({ id: 2, color: 'blue', basePattern: 'always-take' }),
    ];
    const rng = createRng(24);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.pool).toBeLessThanOrEqual(0);
    expect(state.objects.filter((o) => o.alive && o.color === 'green')).toHaveLength(2);
    expect(state.objects.filter((o) => o.alive && o.color === 'blue')).toHaveLength(1);
    expect(state.status).toBe('won');
    expect(state.winner).toEqual({ greenPct: 100, bluePct: 0 });
  });

  it('same pool-depletion rule, the other way round: blue wins when blue has more objects', () => {
    let state = createInitialState();
    state.pool = 0.4;
    state.objects = [
      obj({ id: 0, color: 'green', basePattern: 'always-take' }),
      obj({ id: 1, color: 'blue', basePattern: 'always-take' }),
      obj({ id: 2, color: 'blue', basePattern: 'always-take' }),
    ];
    const rng = createRng(25);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.pool).toBeLessThanOrEqual(0);
    expect(state.status).toBe('won');
    expect(state.winner).toEqual({ greenPct: 0, bluePct: 100 });
  });

  it('declares a win with a proportional split once 100 stable rounds pass', () => {
    let state = createInitialState();
    // An all-give population never has anyone die, and the pool starts exactly at its cap:
    // internally each encounter dips to 9999.5 (capped growth, then the universal -0.5), but
    // Math.ceil rounds that back up to exactly the cap at the end of every round, holding it
    // perfectly flat from round 1 onward.
    const rng = createRng(10);
    for (let i = 0; i < 105; i++) {
      state = takeTurn(state, { type: 'decline' }, rng);
      if (state.status !== 'in-progress') break;
    }
    expect(state.status).toBe('won');
    expect(state.winner).toBeDefined();
    expect(state.winner!.greenPct + state.winner!.bluePct).toBeCloseTo(100);
  });

  it('a round where the pool grows does not count as stable (must hold exactly steady)', () => {
    let state = createInitialState();
    state.pool = 100; // well below the cap, so give/give still has room to grow it
    const rng = createRng(16);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.pool).toBeGreaterThan(100); // confirms the pool did in fact grow this round
    expect(state.steadyRoundsCount).toBe(0);
  });

  it('pause does not run a simulation and leaves the pool untouched', () => {
    let state = createInitialState();
    const poolBefore = state.pool;
    const rng = createRng(11);
    state = takeTurn(state, { type: 'pause' }, rng);
    expect(state.pool).toBe(poolBefore);
    expect(state.lastResult?.paused).toBe(true);
    expect(state.lastResult?.subRounds).toHaveLength(0);
  });

  it('ends with no winner immediately on a mutual wipeout, even with a healthy pool', () => {
    let state = createInitialState();
    state.objects = []; // both colors wiped out
    const rng = createRng(13);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.pool).toBeGreaterThan(0); // isolates this from the separate pool-depletion path
    expect(state.status).toBe('lost');
    expect(state.winner).toBeUndefined();
  });

  it('checkSustainability declares the survivor a winner after 10 clean rounds, without needing a 100-round streak', () => {
    let state = createInitialState();
    // green already eliminated; an all-give survivor nets +1 to the pool per encounter, so no
    // pool override is needed to keep it alive through the check.
    state.objects = state.objects.filter((o) => o.color === 'blue');
    const rng = createRng(14);
    const result = checkSustainability(state, rng);
    expect(result.status).toBe('won');
    expect(result.winner).toEqual({ greenPct: 0, bluePct: 100 });
    expect(result.steadyRoundsCount).toBeLessThan(100); // won on the sustainability check, not the streak
  });

  it('checkSustainability still declares the survivor the winner if the pool depletes during the check', () => {
    let state = createInitialState();
    // always-take vs always-take: take/take encounters aren't give/give, so they only ever cost
    // the universal -0.5 (no +2 bonus) — the pool purely drains and depletes quickly. Green is
    // already eliminated, so blue — still populated when the pool hits 0 — has strictly more
    // objects left and wins outright, the same as any other pool-depletion win.
    state.objects = state.objects
      .filter((o) => o.color === 'blue')
      .map((o) => ({ ...o, basePattern: 'always-take' as const }));
    state.pool = 15;
    const rng = createRng(15);
    const result = checkSustainability(state, rng);
    expect(result.status).toBe('won');
    expect(result.winner).toEqual({ greenPct: 0, bluePct: 100 });
  });
});

describe('csv', () => {
  it('formats the log with a header row and one row per round', () => {
    let state = createInitialState();
    const rng = createRng(12);
    state = takeTurn(state, { type: 'decline' }, rng);
    state = takeTurn(state, { type: 'decline' }, rng);
    const csv = logToCsv(state.log);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rounds
    expect(lines[0]).toBe(
      'round,paused,cardPlayer,cardPlayed,greenPattern,greenDouble,bluePattern,blueDouble,' +
        'poolBefore,poolAfter,greenAlive,blueAlive,greenLivesTotal,blueLivesTotal,deathsThisRound,' +
        'giveGiveCount,takeGiveCount,takeTakeCount,steadyRoundsCount,status'
    );
  });
});
