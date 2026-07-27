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
    fromObjects,
    displayPool,
    isSimulating,
    progress,
    pendingAction,
    selectAction,
    confirmMove,
    checkSustainability,
    undo,
    canUndo,
    started,
    startGame,
    resetGame,
  } = game;

  if (!started) {
    return <StartScreen onStart={startGame} />;
  }

  const blueObject = state.objects.find((o) => o.color === 'blue');
  const greenObject = state.objects.find((o) => o.color === 'green');
  const greenAlive = displayObjects.filter((o) => o.alive && o.color === 'green').length;
  const blueAlive = displayObjects.filter((o) => o.alive && o.color === 'blue').length;
  const controlsDisabled = isSimulating;

  const oneColorEliminated = state.status === 'in-progress' && !isSimulating && (greenAlive === 0) !== (blueAlive === 0);
  const survivingColor = oneColorEliminated ? (greenAlive === 0 ? 'blue' : 'green') : null;

  return (
    <div className="player-view">
      <div className="top-row">
        <StatsBar round={state.round} steadyRoundsCount={state.steadyRoundsCount} />
        <Thermometer pool={displayPool} />
      </div>

      <div className="field-row">
        <div className="color-panel-slot">
          {blueObject && (
            <ColorPanel
              color="blue"
              pattern={blueObject.basePattern}
              doubleActive={blueObject.doubleActive}
              alive={blueAlive}
              active={state.status === 'in-progress' && state.currentPlayer === 'blue'}
            />
          )}
          {survivingColor === 'blue' && (
            <button className="sustainability-btn" onClick={checkSustainability}>
              Check Sustainability
            </button>
          )}
        </div>

        <div className="field-wrapper">
          <FieldCanvas objects={displayObjects} fromObjects={fromObjects} isSimulating={isSimulating} />
          {isSimulating && progress && <SimulationOverlay pass={progress.pass} totalPasses={progress.totalPasses} />}
        </div>

        <div className="color-panel-slot">
          {greenObject && (
            <ColorPanel
              color="green"
              pattern={greenObject.basePattern}
              doubleActive={greenObject.doubleActive}
              alive={greenAlive}
              active={state.status === 'in-progress' && state.currentPlayer === 'green'}
            />
          )}
          {survivingColor === 'green' && (
            <button className="sustainability-btn" onClick={checkSustainability}>
              Check Sustainability
            </button>
          )}
        </div>
      </div>

      <ResultOverlay status={state.status} winner={state.winner} pool={state.pool} onPlayAgain={resetGame} />

      {state.status === 'in-progress' && !oneColorEliminated && (
        <TurnPanel
          currentPlayer={state.currentPlayer}
          disabled={controlsDisabled}
          pendingAction={pendingAction}
          onSelect={selectAction}
          onConfirm={confirmMove}
          canUndo={canUndo}
          onUndo={undo}
        />
      )}
    </div>
  );
}
