export type Color = 'green' | 'blue';
export type Decision = 'give' | 'take';
export type RuleName =
  | 'always-give'
  | 'always-take'
  | 'alternate'
  | 'tit-for-tat'
  | 'tit-for-tat-delayed';
export type Card = RuleName | 'double' | 'pause';

export interface GameObject {
  id: number;
  color: Color;
  lives: number;
  alive: boolean;
  basePattern: RuleName;
  doubleActive: boolean;
  lastDecision?: Decision;
  lossStreak: number;
}

export interface SubRoundStat {
  passIndex: number;
  poolValue: number;
  greenAlive: number;
  blueAlive: number;
  greenLivesTotal: number;
  blueLivesTotal: number;
  deathsThisPass: number;
}

/** Lightweight per-object state after a single encounter pass, for animating the field. */
export interface ObjectSnapshot {
  id: number;
  lives: number;
  alive: boolean;
}

export interface RoundLogEntry {
  round: number;
  paused: boolean;
  cardPlayer: Color;
  cardPlayed: string;
  greenPattern: RuleName;
  greenDouble: boolean;
  bluePattern: RuleName;
  blueDouble: boolean;
  poolBefore: number;
  poolAfter: number;
  greenAlive: number;
  blueAlive: number;
  greenLivesTotal: number;
  blueLivesTotal: number;
  deathsThisRound: number;
  giveGiveCount: number;
  takeGiveCount: number;
  takeTakeCount: number;
  steadyRoundsCount: number;
  status: GameStatus;
}

export interface RoundResult {
  roundNumber: number;
  paused: boolean;
  subRounds: SubRoundStat[];
  passObjectStates: ObjectSnapshot[][];
  logEntry: RoundLogEntry;
}

export type GameStatus = 'in-progress' | 'won' | 'lost';

export interface GameState {
  round: number;
  pool: number;
  objects: GameObject[];
  currentPlayer: Color;
  steadyRoundsCount: number;
  status: GameStatus;
  winner?: { greenPct: number; bluePct: number };
  log: RoundLogEntry[];
  lastResult?: RoundResult;
}

export type TurnAction =
  | { type: 'play-rule'; rule: RuleName }
  | { type: 'toggle-double' }
  | { type: 'decline' }
  | { type: 'pause' }
  | { type: 'wild-card'; livesPerObject: number };

export const STARTING_LIVES = 10;
export const STARTING_POOL = 10000;
export const POOL_MAX = 10000;
export const ENCOUNTERS_PER_ROUND = 10;
export const OBJECTS_PER_COLOR = 1000;
export const STEADY_ROUNDS_TO_WIN = 100;
export const SUSTAINABILITY_CHECK_ROUNDS = 10;
