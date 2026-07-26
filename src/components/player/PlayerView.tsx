import type { UseGame } from '../../state/useGame';
import { FieldCanvas } from './FieldCanvas';
import { TurnPanel } from './TurnPanel';
import { SimulationOverlay } from './SimulationOverlay';
import { StatsBar } from './StatsBar';
import { ResultOverlay } from './ResultOverlay';
import { StartScreen } from './StartScreen';
import { ColorPanel } from './ColorPanel';
import { Thermometer } from './Thermometer';

export function PlayerView({ game }: { game: UseGame }) {
  const {
    state,
    displayObjects,
    displayPool,
    isSimulating,
    progress,
    pendingAction,
    selectAction,
    confirmMove,
    undo,
    canUndo,
    resolving,
    started,
    startGame,
    resetGame,
  } = game;

  if (!started) {
    return <StartScreen onStart={startGame} />;
  }

  const currentPlayerObject = state.objects.find((o) => o.color === state.currentPlayer);
  const blueObject = state.objects.find((o) => o.color === 'blue');
  const greenObject = state.objects.find((o) => o.color === 'green');
  const greenAlive = displayObjects.filter((o) => o.alive && o.color === 'green').length;
  const blueAlive = displayObjects.filter((o) => o.alive && o.color === 'blue').length;
  const controlsDisabled = isSimulating || resolving;

  return (
    <div className="player-view">
      <StatsBar
        round={state.round}
        steadyRoundsCount={state.steadyRoundsCount}
        canUndo={canUndo && !controlsDisabled}
        onUndo={undo}
      />

      <Thermometer pool={displayPool} />

      <div className="field-row">
        {blueObject && (
          <ColorPanel color="blue" pattern={blueObject.basePattern} doubleActive={blueObject.doubleActive} alive={blueAlive} />
        )}

        <div className="field-wrapper">
          <FieldCanvas objects={displayObjects} />
          {isSimulating && progress && <SimulationOverlay pass={progress.pass} totalPasses={progress.totalPasses} />}
        </div>

        {greenObject && (
          <ColorPanel
            color="green"
            pattern={greenObject.basePattern}
            doubleActive={greenObject.doubleActive}
            alive={greenAlive}
          />
        )}
      </div>

      <ResultOverlay status={state.status} winner={state.winner} pool={state.pool} onPlayAgain={resetGame} />

      {state.status === 'in-progress' && resolving && (
        <div className="resolving-banner">One side has been eliminated — resolving the final outcome…</div>
      )}

      {state.status === 'in-progress' && !resolving && currentPlayerObject && (
        <TurnPanel
          currentPlayer={state.currentPlayer}
          currentPattern={currentPlayerObject.basePattern}
          doubleActive={currentPlayerObject.doubleActive}
          disabled={controlsDisabled}
          pendingAction={pendingAction}
          onSelect={selectAction}
          onConfirm={confirmMove}
        />
      )}
    </div>
  );
}
