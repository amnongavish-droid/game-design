interface Props {
  pool: number;
  greenAlive: number;
  blueAlive: number;
  round: number;
  steadyRoundsCount: number;
}

export function StatsBar({ pool, greenAlive, blueAlive, round, steadyRoundsCount }: Props) {
  return (
    <div className="stats-bar">
      <div className="stats-bar__item">
        Round <strong>{round}</strong>
      </div>
      <div className="stats-bar__item">
        Central pool <strong>{pool}</strong>
      </div>
      <div className="stats-bar__item stats-bar__item--green">
        Green objects <strong>{greenAlive}</strong>
      </div>
      <div className="stats-bar__item stats-bar__item--blue">
        Blue objects <strong>{blueAlive}</strong>
      </div>
      <div className="stats-bar__item">
        Steady streak <strong>{steadyRoundsCount} / 100</strong>
      </div>
    </div>
  );
}
