import type { UseGame } from '../../state/useGame';
import { FieldCanvas } from './FieldCanvas';
import { TurnPanel } from './TurnPanel';
import { SimulationOverlay } from './SimulationOverlay';
import { StatsBar } from './StatsBar';
import { ResultBanner } from './ResultBanner';

export function PlayerView({ game }: { game: UseGame }) {
  const { state, dispatch, displayObjects, displayPool, isSimulating, progress } = game;

  const currentPlayerObject = state.objects.find((o) => o.color === state.currentPlayer);
  const greenAlive = displayObjects.filter((o) => o.alive && o.color === 'green').length;
  const blueAlive = displayObjects.filter((o) => o.alive && o.color === 'blue').length;

  return (
    <div className="player-view">
      <StatsBar
        pool={displayPool}
        greenAlive={greenAlive}
        blueAlive={blueAlive}
        round={state.round}
        steadyRoundsCount={state.steadyRoundsCount}
      />

      <div className="field-wrapper">
        <FieldCanvas objects={displayObjects} />
        {isSimulating && progress && <SimulationOverlay pass={progress.pass} totalPasses={progress.totalPasses} />}
      </div>

      <ResultBanner status={state.status} winner={state.winner} />

      {state.status === 'in-progress' && currentPlayerObject && (
        <TurnPanel
          currentPlayer={state.currentPlayer}
          currentPattern={currentPlayerObject.basePattern}
          doubleActive={currentPlayerObject.doubleActive}
          disabled={isSimulating}
          onPlay={dispatch}
        />
      )}
    </div>
  );
}
