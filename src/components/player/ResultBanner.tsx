import type { GameState } from '../../engine/types';

interface Props {
  status: GameState['status'];
  winner: GameState['winner'];
}

export function ResultBanner({ status, winner }: Props) {
  if (status === 'in-progress') return null;

  if (status === 'lost') {
    return (
      <div className="result-banner result-banner--lost">
        The central livelihood pool ran out. Game over — no winner.
      </div>
    );
  }

  return (
    <div className="result-banner result-banner--won">
      Steady state reached! 100 points split: Green {winner?.greenPct.toFixed(1)}% / Blue{' '}
      {winner?.bluePct.toFixed(1)}%
    </div>
  );
}
