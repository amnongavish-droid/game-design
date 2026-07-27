import type { Color, TurnAction } from '../../engine/types';
import { CARD_DEFS } from './cardDefs';
import { Card } from './Card';

function actionToCardId(action: TurnAction): string {
  switch (action.type) {
    case 'play-rule':
      return action.rule;
    case 'toggle-double':
      return 'double';
    case 'pause':
      return 'pause';
    case 'decline':
      return 'decline';
  }
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 12h13M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M8 7 3 12l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3 12h11a5 5 0 1 1 0 10h-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  currentPlayer: Color;
  disabled: boolean;
  pendingAction: TurnAction | null;
  onSelect: (action: TurnAction) => void;
  onConfirm: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function TurnPanel({ currentPlayer, disabled, pendingAction, onSelect, onConfirm, canUndo, onUndo }: Props) {
  const selectedId = pendingAction ? actionToCardId(pendingAction) : null;

  return (
    <div className={`turn-panel turn-panel--${currentPlayer}`}>
      <div className="turn-panel__body">
        <div className="turn-panel__cards">
          {CARD_DEFS.map((def) => (
            <Card
              key={def.id}
              def={def}
              selected={selectedId === def.id}
              disabled={disabled}
              onClick={() => onSelect(def.action)}
            />
          ))}
        </div>

        <div className="turn-panel__actions">
          <button
            className="confirm-move-btn"
            aria-label="Confirm move"
            disabled={disabled || !pendingAction}
            onClick={onConfirm}
          >
            <ArrowRightIcon />
          </button>
          <button className="undo-btn" aria-label="Undo last move" disabled={disabled || !canUndo} onClick={onUndo}>
            <UndoIcon />
          </button>
        </div>
      </div>

      {pendingAction && <p className="turn-panel__pending-note">Selected — click the arrow to confirm.</p>}
    </div>
  );
}
