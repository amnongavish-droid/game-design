import { decide, updateHistory } from './rules';
import { shuffle, type Rng } from './rng';
import {
  ENCOUNTERS_PER_ROUND,
  POOL_DECREMENT,
  POOL_MAX,
  type GameObject,
  type ObjectSnapshot,
  type SubRoundStat,
} from './types';

export interface SimulateRoundOutput {
  objects: GameObject[];
  pool: number;
  subRounds: SubRoundStat[];
  passObjectStates: ObjectSnapshot[][];
  deathsThisRound: number;
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

  if (!paused) {
    for (let pass = 0; pass < ENCOUNTERS_PER_ROUND; pass++) {
      const living = working.filter((o) => o.alive);
      const shuffled = shuffle(living, rng);
      let deathsThisPass = 0;

      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const a = shuffled[i];
        const b = shuffled[i + 1];
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
          // Capped at POOL_MAX — the pool can't grow past it, though it can still drain below it.
          currentPool = currentPool >= POOL_MAX ? currentPool : Math.min(currentPool + mult, POOL_MAX);
        } else if (decisionA === 'give' && decisionB === 'take') {
          deltaA = -mult;
          deltaB = mult;
        } else if (decisionA === 'take' && decisionB === 'give') {
          deltaA = mult;
          deltaB = -mult;
        } else {
          deltaA = -mult;
          deltaB = -mult;
        }

        a.lives += deltaA;
        b.lives += deltaB;
        updateHistory(a, decisionA, deltaA);
        updateHistory(b, decisionB, deltaB);
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

  // The pool drains by a flat amount every round, paused or not — only the encounters are skipped.
  currentPool -= POOL_DECREMENT;

  return { objects: working, pool: currentPool, subRounds, passObjectStates, deathsThisRound };
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
