interface Props {
  round: number;
  steadyRoundsCount: number;
}

export function StatsBar({ round, steadyRoundsCount }: Props) {
  return (
    <div className="stats-bar">
      <div className="stats-bar__item">
        Round <strong>{round}</strong>
      </div>
      <div className="stats-bar__item">
        Steady streak <strong>{steadyRoundsCount} / 100</strong>
      </div>
    </div>
  );
}
