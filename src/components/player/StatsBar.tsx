interface Props {
  round: number;
  steadyRoundsCount: number;
  canUndo: boolean;
  onUndo: () => void;
}

export function StatsBar({ round, steadyRoundsCount, canUndo, onUndo }: Props) {
  return (
    <div className="stats-bar">
      <div className="stats-bar__item">
        Round <strong>{round}</strong>
      </div>
      <div className="stats-bar__item">
        Steady streak <strong>{steadyRoundsCount} / 100</strong>
      </div>
      <button className="stats-bar__undo" disabled={!canUndo} onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
