interface Props {
  pass: number;
  totalPasses: number;
}

export function SimulationOverlay({ pass, totalPasses }: Props) {
  const pct = totalPasses > 0 ? Math.round((pass / totalPasses) * 100) : 0;
  return (
    <div className="simulation-overlay">
      <div className="simulation-overlay__label">Simulating encounters… ({pass}/{totalPasses})</div>
      <div className="simulation-overlay__bar">
        <div className="simulation-overlay__bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
