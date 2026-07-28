import { simulateRound } from './simulate';
import type { Rng } from './rng';
import {
  OBJECTS_PER_COLOR,
  STARTING_LIVES,
  STARTING_POOL,
  STEADY_ROUNDS_TO_WIN,
  SUSTAINABILITY_CHECK_ROUNDS,
  type Color,
  type GameObject,
  type GameState,
  type GameStatus,
  type RoundLogEntry,
  type RoundResult,
  type RuleName,
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

function sumLives(objects: GameObject[], color: Color): number {
  return objects.filter((o) => o.alive && o.color === color).reduce((sum, o) => sum + o.lives, 0);
}

/** Every object of a color always shares the same current rule, so any one of them (dead or
 * alive) tells us the whole color's pattern/double state. */
function colorRule(objects: GameObject[], color: Color): { pattern: RuleName; double: boolean } {
  const found = objects.find((o) => o.color === color);
  return found ? { pattern: found.basePattern, double: found.doubleActive } : { pattern: 'always-give', double: false };
}

function describeAction(action: TurnAction): string {
  switch (action.type) {
    case 'play-rule':
      return action.rule;
    case 'toggle-double':
      return 'double';
    case 'decline':
      return 'decline';
    case 'pause':
      return 'pause';
  }
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
    giveGiveCount,
    takeGiveCount,
    takeTakeCount,
  } = simulateRound(objects, state.pool, paused, rng);

  // A "stable" round requires the pool to hold exactly steady, not merely avoid decreasing.
  const poolUnchanged = poolAfter === poolBefore;
  const steadyThisRound = poolUnchanged && deathsThisRound === 0;
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

  const green = colorRule(resultObjects, 'green');
  const blue = colorRule(resultObjects, 'blue');

  const logEntry: RoundLogEntry = {
    round: roundNumber,
    paused,
    cardPlayer: state.currentPlayer,
    cardPlayed: describeAction(action),
    greenPattern: green.pattern,
    greenDouble: green.double,
    bluePattern: blue.pattern,
    blueDouble: blue.double,
    poolBefore,
    poolAfter,
    greenAlive,
    blueAlive,
    greenLivesTotal: sumLives(resultObjects, 'green'),
    blueLivesTotal: sumLives(resultObjects, 'blue'),
    deathsThisRound,
    giveGiveCount,
    takeGiveCount,
    takeTakeCount,
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
 * Once one color has been wiped out, the surviving player can request this check instead of
 * manually clicking through up to 100 rounds: it plays out a fixed batch of rounds (no card
 * changes, since there's no one left to change the other color's rule) and declares the
 * survivor the winner outright if it comes through all of them still alive with the pool
 * intact — it does not require the usual 100-round steady-state streak, since with only one
 * color left there's no equilibrium to reach with an opponent.
 */
export function checkSustainability(
  state: GameState,
  rng: Rng,
  rounds: number = SUSTAINABILITY_CHECK_ROUNDS
): GameState {
  let current = state;
  for (let i = 0; i < rounds && current.status === 'in-progress'; i++) {
    current = takeTurn(current, { type: 'decline' }, rng);
  }
  if (current.status !== 'in-progress') return current; // pool depleted, or wiped out entirely, during the check

  // Both-eliminated would already have returned above via the engine's mutual-wipeout check,
  // so if we get here exactly one color survived.
  const greenAlive = current.objects.some((o) => o.alive && o.color === 'green');
  return {
    ...current,
    status: 'won',
    winner: greenAlive ? { greenPct: 100, bluePct: 0 } : { greenPct: 0, bluePct: 100 },
  };
}
