import type { GameState } from '../../engine/types';

interface Props {
  status: GameState['status'];
  winner: GameState['winner'];
  pool: number;
  onPlayAgain: () => void;
}

function lossMessage(pool: number): string {
  return pool <= 0
    ? 'The central livelihood pool ran out — no winner.'
    : 'Both colors were wiped out — no winner.';
}

function winMessage(winner: GameState['winner']): string {
  if (!winner) return '';
  // A clean 100/0 split comes from surviving a sustainability check or the pool running dry
  // with more objects on one side (the normal 100-round steady-state win requires both colors
  // still populated), so call it out plainly rather than as a percentage.
  if (winner.greenPct === 100) return 'Green wins!';
  if (winner.bluePct === 100) return 'Blue wins!';
  return `100 points split: Green ${winner.greenPct.toFixed(1)}% / Blue ${winner.bluePct.toFixed(1)}%`;
}

export function ResultOverlay({ status, winner, pool, onPlayAgain }: Props) {
  if (status === 'in-progress') return null;

  const poolDepleted = pool <= 0;
  const title =
    status === 'lost' ? 'Game Over' : poolDepleted ? 'Livelihood Pool Depleted' : 'Steady State Reached';
  const message =
    status === 'lost'
      ? lossMessage(pool)
      : poolDepleted
        ? `The pool ran dry — ${winMessage(winner)}`
        : winMessage(winner);

  return (
    <div className="result-overlay">
      <div className={`result-overlay__card result-overlay__card--${status}`}>
        <p className="result-overlay__status">{title}</p>
        <p className="result-overlay__message">{message}</p>
        <button onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
}
