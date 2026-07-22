import { useState } from 'react';
import { useGame } from './state/useGame';
import { PlayerView } from './components/player/PlayerView';
import { DevView } from './components/dev/DevView';

export function App() {
  const game = useGame();
  const [view, setView] = useState<'player' | 'dev'>('player');

  return (
    <div className="app">
      <div className="app__view-switcher">
        <button disabled={view === 'player'} onClick={() => setView('player')}>
          Player view
        </button>
        <button disabled={view === 'dev'} onClick={() => setView('dev')}>
          Developer view
        </button>
      </div>
      {view === 'player' ? <PlayerView game={game} /> : <DevView game={game} />}
    </div>
  );
}
