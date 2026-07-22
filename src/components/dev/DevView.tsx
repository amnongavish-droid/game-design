import type { UseGame } from '../../state/useGame';
import { SubRoundTable } from './SubRoundTable';
import { CsvExportButton } from './CsvExportButton';

export function DevView({ game }: { game: UseGame }) {
  const { state } = game;

  return (
    <div className="dev-view">
      <h2>Developer view</h2>
      <section>
        <h3>Game state</h3>
        <ul className="dev-view__summary">
          <li>Round: {state.round}</li>
          <li>Status: {state.status}</li>
          <li>Current player: {state.currentPlayer}</li>
          <li>Pool: {state.pool}</li>
          <li>Steady rounds streak: {state.steadyRoundsCount} / 100</li>
          {state.winner && (
            <li>
              Winner split: Green {state.winner.greenPct.toFixed(1)}% / Blue {state.winner.bluePct.toFixed(1)}%
            </li>
          )}
        </ul>
      </section>
      <section>
        <h3>Last round — per-sub-round stats</h3>
        <SubRoundTable lastResult={state.lastResult} />
      </section>
      <section>
        <h3>Game log</h3>
        <CsvExportButton log={state.log} />
      </section>
    </div>
  );
}
