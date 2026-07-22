import type { Color, RuleName, TurnAction } from '../../engine/types';

const RULE_LABELS: Record<RuleName, string> = {
  'always-give': 'Always Give',
  'always-take': 'Always Take',
  alternate: 'Alternate',
  'tit-for-tat': 'Tit-for-Tat',
  'tit-for-tat-delayed': 'Tit-for-Tat (Delayed)',
};

interface Props {
  currentPlayer: Color;
  currentPattern: RuleName;
  doubleActive: boolean;
  disabled: boolean;
  onPlay: (action: TurnAction) => void;
}

export function TurnPanel({ currentPlayer, currentPattern, doubleActive, disabled, onPlay }: Props) {
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
        {(Object.keys(RULE_LABELS) as RuleName[]).map((rule) => (
          <button key={rule} disabled={disabled} onClick={() => onPlay({ type: 'play-rule', rule })}>
            {RULE_LABELS[rule]}
          </button>
        ))}
        <button disabled={disabled} onClick={() => onPlay({ type: 'toggle-double' })}>
          {doubleActive ? 'Cancel Double' : 'Double'}
        </button>
      </div>
      <div className="turn-panel__meta-actions">
        <button disabled={disabled} onClick={() => onPlay({ type: 'decline' })}>
          Don't play a card
        </button>
        <button disabled={disabled} onClick={() => onPlay({ type: 'pause' })}>
          Pause
        </button>
      </div>
    </div>
  );
}
