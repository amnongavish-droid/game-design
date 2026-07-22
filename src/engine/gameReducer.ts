import { simulateRound } from './simulate';
import type { Rng } from './rng';
import {
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

  // Pausing is a true no-op for the steady-state streak: it can't build progress toward a
  // win (nothing was actually played out), but it also doesn't reset progress already made.
  let steadyRoundsCount = state.steadyRoundsCount;
  if (!paused) {
    const poolNonDecreasing = poolAfter >= poolBefore;
    const steadyThisRound = poolNonDecreasing && deathsThisRound === 0;
    steadyRoundsCount = steadyThisRound ? state.steadyRoundsCount + 1 : 0;
  }

  let status: GameStatus = 'in-progress';
  let winner: GameState['winner'];

  if (!paused && poolAfter <= 0) {
    status = 'lost';
  } else if (steadyRoundsCount >= STEADY_ROUNDS_TO_WIN) {
    status = 'won';
    const greenAlive = countAlive(resultObjects, 'green');
    const blueAlive = countAlive(resultObjects, 'blue');
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
    greenAlive: countAlive(resultObjects, 'green'),
    blueAlive: countAlive(resultObjects, 'blue'),
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
