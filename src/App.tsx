import { useGame } from './state/useGame';
import { useSettings } from './state/useSettings';
import { PlayerView } from './components/player/PlayerView';
import { SettingsPanel } from './components/SettingsPanel';

export function App() {
  const { soundEnabled, setSoundEnabled } = useSettings();
  const game = useGame(soundEnabled);

  return (
    <div className="app">
      <div className="app__top-bar">
        <h1 className="app__title">Give / Take</h1>
        <SettingsPanel soundEnabled={soundEnabled} onToggleSound={setSoundEnabled} log={game.state.log} />
      </div>
      <PlayerView game={game} />
    </div>
  );
}
