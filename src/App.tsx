import { useState } from 'react';
import { useGame } from './state/useGame';
import { useSettings } from './state/useSettings';
import { PlayerView } from './components/player/PlayerView';
import { DevView } from './components/dev/DevView';
import { SettingsPanel } from './components/SettingsPanel';

export function App() {
  const { soundEnabled, setSoundEnabled } = useSettings();
  const game = useGame(soundEnabled);
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
        <SettingsPanel soundEnabled={soundEnabled} onToggleSound={setSoundEnabled} />
      </div>
      {view === 'player' ? <PlayerView game={game} /> : <DevView game={game} />}
    </div>
  );
}
