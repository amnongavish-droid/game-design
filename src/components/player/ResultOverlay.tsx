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
  // A clean 100/0 split only ever comes from surviving a sustainability check (the normal
  // 100-round steady-state win requires both colors still populated), so call it out plainly.
  if (winner.greenPct === 100) return 'Green wins!';
  if (winner.bluePct === 100) return 'Blue wins!';
  return `100 points split: Green ${winner.greenPct.toFixed(1)}% / Blue ${winner.bluePct.toFixed(1)}%`;
}

export function ResultOverlay({ status, winner, pool, onPlayAgain }: Props) {
  if (status === 'in-progress') return null;

  return (
    <div className="result-overlay">
      <div className={`result-overlay__card result-overlay__card--${status}`}>
        <p className="result-overlay__status">{status === 'lost' ? 'Game Over' : 'Steady State Reached'}</p>
        <p className="result-overlay__message">{status === 'lost' ? lossMessage(pool) : winMessage(winner)}</p>
        <button onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
}
