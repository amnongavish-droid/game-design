import type { Color, RuleName, TurnAction } from '../../engine/types';
import { CARD_DEFS, RULE_LABELS } from './cardDefs';
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

interface Props {
  currentPlayer: Color;
  currentPattern: RuleName;
  doubleActive: boolean;
  disabled: boolean;
  pendingAction: TurnAction | null;
  onSelect: (action: TurnAction) => void;
  onConfirm: () => void;
}

export function TurnPanel({
  currentPlayer,
  currentPattern,
  doubleActive,
  disabled,
  pendingAction,
  onSelect,
  onConfirm,
}: Props) {
  const selectedId = pendingAction ? actionToCardId(pendingAction) : null;

  return (
    <div className={`turn-panel turn-panel--${currentPlayer}`}>
      <div className="turn-panel__header">
        <span className="turn-panel__whose-turn">{currentPlayer === 'green' ? 'Green' : 'Blue'}'s turn</span>
        <span className="turn-panel__current-rule">
          current rule: <strong>{RULE_LABELS[currentPattern]}</strong>
          {doubleActive ? <strong> + Double</strong> : null}
        </span>
      </div>

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

      <div className="turn-panel__confirm">
        <button className="confirm-move-btn" disabled={disabled || !pendingAction} onClick={onConfirm}>
          Confirm Move
        </button>
        {pendingAction && <span className="turn-panel__pending-note">Selected — click Confirm Move to play it.</span>}
      </div>
    </div>
  );
}
