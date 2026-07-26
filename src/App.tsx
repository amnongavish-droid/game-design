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
      <div className="app__top-bar">
        <h1 className="app__title">Give / Take</h1>
        <SettingsPanel soundEnabled={soundEnabled} onToggleSound={setSoundEnabled} view={view} onChangeView={setView} />
      </div>
      {view === 'player' ? <PlayerView game={game} /> : <DevView game={game} />}
    </div>
  );
}
