import { decide, updateHistory } from './rules';
import { shuffle, type Rng } from './rng';
import { ENCOUNTERS_PER_ROUND, POOL_MAX, type GameObject, type ObjectSnapshot, type SubRoundStat } from './types';

export interface SimulateRoundOutput {
  objects: GameObject[];
  pool: number;
  subRounds: SubRoundStat[];
  passObjectStates: ObjectSnapshot[][];
  deathsThisRound: number;
  giveGiveCount: number;
  takeGiveCount: number;
  takeTakeCount: number;
}

/** Runs one round of encounters (or skips entirely if paused). Pure: returns new objects/pool, never mutates inputs. */
export function simulateRound(
  objects: GameObject[],
  pool: number,
  paused: boolean,
  rng: Rng
): SimulateRoundOutput {
  const working = objects.map((o) => ({ ...o }));
  const subRounds: SubRoundStat[] = [];
  const passObjectStates: ObjectSnapshot[][] = [];
  let currentPool = pool;
  let deathsThisRound = 0;
  let giveGiveCount = 0;
  let takeGiveCount = 0;
  let takeTakeCount = 0;
  // Tracks every pair that has already encountered each other earlier in this same simulation
  // (reset per round) — a repeat pairing still counts as that pass's encounter for both objects,
  // it just has no further effect.
  const metPairs = new Set<string>();

  if (!paused) {
    for (let pass = 0; pass < ENCOUNTERS_PER_ROUND; pass++) {
      const living = working.filter((o) => o.alive);
      const shuffled = shuffle(living, rng);
      let deathsThisPass = 0;

      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const a = shuffled[i];
        const b = shuffled[i + 1];
        const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
        if (metPairs.has(pairKey)) continue; // already met this simulation — no effect
        metPairs.add(pairKey);

        const decisionA = decide(a);
        const decisionB = decide(b);
        // Double stacks multiplicatively across both sides of the encounter: neither -> 1x,
        // one side -> 2x, both sides -> 4x. The resulting stakes apply equally to both objects.
        const multA = a.doubleActive ? 2 : 1;
        const multB = b.doubleActive ? 2 : 1;
        const mult = multA * multB;

        let deltaA = 0;
        let deltaB = 0;
        if (decisionA === 'give' && decisionB === 'give') {
          // Give/give still grows the pool by 2 (capped at POOL_MAX) — on top of (not instead
          // of) the universal -0.5 per-encounter cost below, netting +1.5 while below the cap.
          currentPool = currentPool >= POOL_MAX ? currentPool : Math.min(currentPool + 2, POOL_MAX);
          giveGiveCount += 1;
        } else if (decisionA === 'give' && decisionB === 'take') {
          deltaA = -mult;
          deltaB = mult;
          takeGiveCount += 1;
        } else if (decisionA === 'take' && decisionB === 'give') {
          deltaA = mult;
          deltaB = -mult;
          takeGiveCount += 1;
        } else {
          deltaA = -mult;
          deltaB = -mult;
          takeTakeCount += 1;
        }

        a.lives += deltaA;
        b.lives += deltaB;
        updateHistory(a, decisionA, deltaA);
        updateHistory(b, decisionB, deltaB);

        // Every encounter automatically costs the shared pool 0.5, independent of decisions/doubles.
        currentPool -= 0.5;
      }

      for (const o of working) {
        if (o.alive && o.lives <= 0) {
          o.alive = false;
          deathsThisPass += 1;
        }
      }

      deathsThisRound += deathsThisPass;
      subRounds.push(snapshotSubRound(pass, currentPool, working, deathsThisPass));
      passObjectStates.push(working.map((o) => ({ id: o.id, lives: o.lives, alive: o.alive })));
    }
  }
  // Paused rounds have no encounters, so the pool is untouched — there's no separate flat
  // per-round decrement anymore, only the per-encounter cost above. The fractional -0.5 costs
  // accumulate through the round, then round up to a whole number once the round is done.
  currentPool = Math.ceil(currentPool);

  return {
    objects: working,
    pool: currentPool,
    subRounds,
    passObjectStates,
    deathsThisRound,
    giveGiveCount,
    takeGiveCount,
    takeTakeCount,
  };
}

function snapshotSubRound(
  passIndex: number,
  pool: number,
  objects: GameObject[],
  deathsThisPass: number
): SubRoundStat {
  let greenAlive = 0;
  let blueAlive = 0;
  let greenLivesTotal = 0;
  let blueLivesTotal = 0;
  for (const o of objects) {
    if (!o.alive) continue;
    if (o.color === 'green') {
      greenAlive += 1;
      greenLivesTotal += o.lives;
    } else {
      blueAlive += 1;
      blueLivesTotal += o.lives;
    }
  }
  return { passIndex, poolValue: pool, greenAlive, blueAlive, greenLivesTotal, blueLivesTotal, deathsThisPass };
}
