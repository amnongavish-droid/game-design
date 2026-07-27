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

  it('tit-for-tat-delayed only retaliates after two losses in a row', () => {
    const o = obj({ basePattern: 'tit-for-tat-delayed' });
    updateHistory(o, 'give', -1);
    expect(decide(o)).toBe('give'); // only one loss so far
    updateHistory(o, 'give', -1);
    expect(decide(o)).toBe('take'); // two losses in a row -> retaliate
    updateHistory(o, 'take', 1);
    expect(decide(o)).toBe('give'); // retaliation used, streak reset
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

  it('mutual give leaves lives unchanged and nets +1.75 to the pool per encounter', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-give' })];
    const rng = createRng(1);
    const { objects: after, pool } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(10);
    expect(after[1].lives).toBe(10);
    // give/give: +2, then the universal -0.25 = net +1.75 per encounter, over 10 encounters =
    // +17.5, rounded up to a whole number at the end of the round.
    expect(pool).toBe(1018);
  });

  it('a non-give/give encounter nets -0.25 to the pool, rounded up only at the round\'s end', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-take' })];
    const rng = createRng(1);
    const { pool, subRounds } = simulateRound(objects, 1000, false, rng);
    // Mid-round the pool is fractional (only the final result gets rounded up)...
    expect(subRounds[0].poolValue).toBeCloseTo(999.75);
    // ...10 encounters of -0.25 = -2.5, then Math.ceil at the end.
    expect(pool).toBe(998);
  });

  it('caps give/give growth at POOL_MAX, rounding the plateau up to the cap at the round\'s end', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-give' })];
    const rng = createRng(21);
    const { pool } = simulateRound(objects, 9999, false, rng); // one below the cap
    // Each encounter grows to the cap (10000) then costs -0.25, settling at 9999.75 — which
    // Math.ceil rounds back up to exactly the cap once the round ends.
    expect(pool).toBe(10000);
  });

  it('give vs take transfers a life from giver to taker', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-take' })];
    const rng = createRng(2);
    const { objects: after } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(0); // giver lost 1 life per pass over 10 passes
    expect(after[1].lives).toBe(20); // taker gained 1 life per pass over 10 passes
    expect(after[0].alive).toBe(false);
  });

  it('double combines multiplicatively across both sides: 2x with one side, 4x with both', () => {
    const oneDoubled = [
      obj({ id: 0, basePattern: 'always-give', doubleActive: true, lives: 100 }),
      obj({ id: 1, basePattern: 'always-take' }),
    ];
    const { objects: afterOne } = simulateRound(oneDoubled, 1000, false, createRng(3));
    expect(afterOne[0].lives).toBe(80); // giver loses 2/pass over 10 passes
    expect(afterOne[1].lives).toBe(30); // taker also gains the combined 2x, not its own (1x)

    const bothDoubled = [
      obj({ id: 0, basePattern: 'always-give', doubleActive: true, lives: 100 }),
      obj({ id: 1, basePattern: 'always-take', doubleActive: true }),
    ];
    const { objects: afterBoth } = simulateRound(bothDoubled, 1000, false, createRng(3));
    expect(afterBoth[0].lives).toBe(60); // giver loses 4/pass (2x2) over 10 passes
    expect(afterBoth[1].lives).toBe(50); // taker gains 4/pass over 10 passes
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
    state.pool = 1; // force near-depletion
    // always-take vs always-take: take/take encounters aren't give/give, so they only ever cost
    // the universal -0.25 (no +2 bonus) — 10 encounters of -0.25 = -2.5, easily depleting this.
    state.objects = [
      obj({ id: 0, color: 'green', basePattern: 'always-take' }),
      obj({ id: 1, color: 'blue', basePattern: 'always-take' }),
    ];
    const rng = createRng(9);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.status).toBe('lost');
    expect(state.winner).toBeUndefined();
  });

  it('declares a win with a proportional split once 100 stable rounds pass', () => {
    let state = createInitialState();
    // An all-give population never has anyone die, and the pool starts exactly at its cap:
    // internally each encounter dips to 9999.75 (capped growth, then the universal -0.25), but
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

  it('checkSustainability ends with no winner if the pool depletes during the check', () => {
    let state = createInitialState();
    // always-take vs always-take: take/take encounters aren't give/give, so they only ever cost
    // the universal -0.25 (no +2 bonus) — the pool purely drains and depletes quickly.
    state.objects = state.objects
      .filter((o) => o.color === 'blue')
      .map((o) => ({ ...o, basePattern: 'always-take' as const }));
    state.pool = 15;
    const rng = createRng(15);
    const result = checkSustainability(state, rng);
    expect(result.status).toBe('lost');
    expect(result.winner).toBeUndefined();
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
      'round,paused,poolBefore,poolAfter,greenAlive,blueAlive,deathsThisRound,steadyRoundsCount,status'
    );
  });
});
