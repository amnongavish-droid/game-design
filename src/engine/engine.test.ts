import { describe, expect, it } from 'vitest';
import { createRng } from './rng';
import { decide, updateHistory } from './rules';
import { simulateRound } from './simulate';
import { createInitialState, takeTurn } from './gameReducer';
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

  it('mutual give grows the pool and leaves lives unchanged', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-give' })];
    const rng = createRng(1);
    const { objects: after, pool } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(10);
    expect(after[1].lives).toBe(10);
    // 10 passes of mutual give = +10 to pool, then -10 flat decrement = net 0
    expect(pool).toBe(1000);
  });

  it('give vs take transfers a life from giver to taker', () => {
    const objects = [obj({ id: 0, basePattern: 'always-give' }), obj({ id: 1, basePattern: 'always-take' })];
    const rng = createRng(2);
    const { objects: after } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(0); // giver lost 1 life per pass over 10 passes
    expect(after[1].lives).toBe(20); // taker gained 1 life per pass over 10 passes
    expect(after[0].alive).toBe(false);
  });

  it('double doubles the stakes for the object that has it active', () => {
    const objects = [
      obj({ id: 0, basePattern: 'always-give', doubleActive: true, lives: 100 }), // extra lives so it survives the round
      obj({ id: 1, basePattern: 'always-take' }),
    ];
    const rng = createRng(3);
    const { objects: after } = simulateRound(objects, 1000, false, rng);
    expect(after[0].lives).toBe(80); // giver loses 2/pass over 10 passes
    expect(after[1].lives).toBe(20); // taker (no double) gains its own multiplier (1) per pass
  });

  it('pausing skips all encounters and does not change the pool', () => {
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
    expect(state.pool).toBe(1000);
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
    state.pool = 5; // force near-depletion
    state.objects = []; // no living objects -> no encounters, pool only drops by the flat decrement
    const rng = createRng(9);
    state = takeTurn(state, { type: 'decline' }, rng);
    expect(state.status).toBe('lost');
    expect(state.winner).toBeUndefined();
  });

  it('declares a win with a proportional split once 100 stable rounds pass', () => {
    let state = createInitialState();
    state.pool = 100000; // avoid depletion for this test
    const rng = createRng(10);
    for (let i = 0; i < 100; i++) {
      state = takeTurn(state, { type: 'decline' }, rng);
      if (state.status !== 'in-progress') break;
    }
    expect(state.status).toBe('won');
    expect(state.winner).toBeDefined();
    expect(state.winner!.greenPct + state.winner!.bluePct).toBeCloseTo(100);
  });

  it('pause does not run a simulation and does not deplete the pool', () => {
    let state = createInitialState();
    const poolBefore = state.pool;
    const rng = createRng(11);
    state = takeTurn(state, { type: 'pause' }, rng);
    expect(state.pool).toBe(poolBefore);
    expect(state.lastResult?.paused).toBe(true);
    expect(state.lastResult?.subRounds).toHaveLength(0);
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
