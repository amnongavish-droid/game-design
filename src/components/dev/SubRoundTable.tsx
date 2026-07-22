import type { RoundResult } from '../../engine/types';

interface Props {
  lastResult: RoundResult | undefined;
}

export function SubRoundTable({ lastResult }: Props) {
  if (!lastResult) {
    return <p>No round has been played yet.</p>;
  }

  if (lastResult.paused) {
    return <p>Round {lastResult.roundNumber} was paused — no encounters ran.</p>;
  }

  return (
    <table className="sub-round-table">
      <thead>
        <tr>
          <th>Pass</th>
          <th>Pool</th>
          <th>Green alive</th>
          <th>Blue alive</th>
          <th>Green lives (total)</th>
          <th>Blue lives (total)</th>
          <th>Deaths this pass</th>
        </tr>
      </thead>
      <tbody>
        {lastResult.subRounds.map((s) => (
          <tr key={s.passIndex}>
            <td>{s.passIndex + 1}</td>
            <td>{s.poolValue}</td>
            <td>{s.greenAlive}</td>
            <td>{s.blueAlive}</td>
            <td>{s.greenLivesTotal}</td>
            <td>{s.blueLivesTotal}</td>
            <td>{s.deathsThisPass}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
