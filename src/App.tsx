import { useGame } from './state/useGame';
import { useSettings } from './state/useSettings';
import { PlayerView } from './components/player/PlayerView';
import { SettingsPanel } from './components/SettingsPanel';
import { RulesPanel } from './components/RulesPanel';

export function App() {
  const { soundEnabled, setSoundEnabled } = useSettings();
  const game = useGame(soundEnabled);

  return (
    <div className="app">
      <div className="app__top-bar">
        <h1 className="app__title">Give / Take</h1>
        <div className="app__top-bar-icons">
          <RulesPanel />
          <SettingsPanel soundEnabled={soundEnabled} onToggleSound={setSoundEnabled} log={game.state.log} />
        </div>
      </div>
      <PlayerView game={game} />
    </div>
  );
}
