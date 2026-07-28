import { useState } from 'react';
import { downloadCsv, logToCsv } from '../engine/csv';
import type { RoundLogEntry } from '../engine/types';

interface Props {
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  log: RoundLogEntry[];
}

export function SettingsPanel({ soundEnabled, onToggleSound, log }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="settings-panel">
      <button
        className="settings-panel__icon"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 3 v2.4 M12 18.6 V21 M21 12 h-2.4 M5.4 12 H3 M18.4 5.6 l-1.7 1.7 M7.3 16.7 l-1.7 1.7 M18.4 18.4 l-1.7 -1.7 M7.3 7.3 L5.6 5.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div className="settings-panel__popover">
          <div className="settings-panel__section">
            <label className="settings-panel__toggle">
              <input type="checkbox" checked={soundEnabled} onChange={(e) => onToggleSound(e.target.checked)} />
              Sound
            </label>
          </div>
          <div className="settings-panel__section">
            <button
              disabled={log.length === 0}
              onClick={() => downloadCsv(`give-take-log-${Date.now()}.csv`, logToCsv(log))}
            >
              Download Log ({log.length} rounds)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
