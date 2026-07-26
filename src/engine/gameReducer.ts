import { simulateRound } from './simulate';
import type { Rng } from './rng';
import {
  MAX_AUTO_RESOLVE_ROUNDS,
  OBJECTS_PER_COLOR,
  STARTING_LIVES,
  STARTING_POOL,
  STEADY_ROUNDS_TO_WIN,
  type Color,
  type GameObject,
  type GameState,
  type GameStatus,
  type RoundLogEntry,
  type RoundResult,
  type TurnAction,
} from './types';

function makeObject(id: number, color: Color): GameObject {
  return {
    id,
    color,
    lives: STARTING_LIVES,
    alive: true,
    basePattern: 'always-give',
    doubleActive: false,
    lossStreak: 0,
  };
}

export function createInitialState(): GameState {
  const objects: GameObject[] = [];
  let id = 0;
  for (let i = 0; i < OBJECTS_PER_COLOR; i++) objects.push(makeObject(id++, 'green'));
  for (let i = 0; i < OBJECTS_PER_COLOR; i++) objects.push(makeObject(id++, 'blue'));

  return {
    round: 0,
    pool: STARTING_POOL,
    objects,
    currentPlayer: 'green',
    steadyRoundsCount: 0,
    status: 'in-progress',
    log: [],
  };
}

function countAlive(objects: GameObject[], color: Color): number {
  return objects.filter((o) => o.alive && o.color === color).length;
}

export function takeTurn(state: GameState, action: TurnAction, rng: Rng): GameState {
  if (state.status !== 'in-progress') return state;

  const objects = state.objects.map((o) => ({ ...o }));
  const isCurrentPlayerObject = (o: GameObject) => o.color === state.currentPlayer;

  if (action.type === 'play-rule') {
    for (const o of objects) if (isCurrentPlayerObject(o)) o.basePattern = action.rule;
  } else if (action.type === 'toggle-double') {
    for (const o of objects) if (isCurrentPlayerObject(o)) o.doubleActive = !o.doubleActive;
  }
  // 'decline': no rule change, round still runs. 'pause': no rule change, round skipped below.

  const paused = action.type === 'pause';
  const roundNumber = state.round + 1;
  const poolBefore = state.pool;

  const {
    objects: resultObjects,
    pool: poolAfter,
    subRounds,
    passObjectStates,
    deathsThisRound,
  } = simulateRound(objects, state.pool, paused, rng);

  // The pool still drains during a pause (only the encounters are skipped), so a pause always
  // breaks the steady-state streak — it can never itself contribute progress toward a win.
  const poolNonDecreasing = poolAfter >= poolBefore;
  const steadyThisRound = poolNonDecreasing && deathsThisRound === 0;
  const steadyRoundsCount = steadyThisRound ? state.steadyRoundsCount + 1 : 0;

  const greenAlive = countAlive(resultObjects, 'green');
  const blueAlive = countAlive(resultObjects, 'blue');

  let status: GameStatus = 'in-progress';
  let winner: GameState['winner'];

  if (poolAfter <= 0 || (greenAlive === 0 && blueAlive === 0)) {
    status = 'lost';
  } else if (steadyRoundsCount >= STEADY_ROUNDS_TO_WIN) {
    status = 'won';
    const total = greenAlive + blueAlive;
    winner =
      total === 0
        ? { greenPct: 0, bluePct: 0 }
        : { greenPct: (greenAlive / total) * 100, bluePct: (blueAlive / total) * 100 };
  }

  const logEntry: RoundLogEntry = {
    round: roundNumber,
    paused,
    poolBefore,
    poolAfter,
    greenAlive,
    blueAlive,
    deathsThisRound,
    steadyRoundsCount,
    status,
  };

  const result: RoundResult = { roundNumber, paused, subRounds, passObjectStates, logEntry };

  return {
    round: roundNumber,
    pool: poolAfter,
    objects: resultObjects,
    currentPlayer: state.currentPlayer === 'green' ? 'blue' : 'green',
    steadyRoundsCount,
    status,
    winner,
    log: [...state.log, logEntry],
    lastResult: result,
  };
}

/**
 * Once one color has been wiped out, no one is making decisions anymore — fast-forward
 * through rounds (no card changes) until the game resolves, instead of requiring the
 * remaining player to manually click through up to 100 rounds. Always returns a terminal
 * state: if the population never settles within maxRounds, it's forced to 'lost'.
 */
export function fastForwardToResolution(
  state: GameState,
  rng: Rng,
  maxRounds: number = MAX_AUTO_RESOLVE_ROUNDS
): GameState {
  let current = state;
  let rounds = 0;
  while (current.status === 'in-progress' && rounds < maxRounds) {
    current = takeTurn(current, { type: 'decline' }, rng);
    rounds += 1;
  }
  if (current.status === 'in-progress') {
    return { ...current, status: 'lost' };
  }
  return current;
}
