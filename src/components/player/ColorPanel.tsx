import type { Color, RuleName } from '../../engine/types';
import { RULE_LABELS } from './cardDefs';

interface Props {
  color: Color;
  pattern: RuleName;
  doubleActive: boolean;
  alive: number;
  active: boolean;
}

export function ColorPanel({ color, pattern, doubleActive, alive, active }: Props) {
  return (
    <div className={`color-panel color-panel--${color}${active ? ' color-panel--active' : ''}`}>
      <p className="color-panel__label">
        {color === 'green' ? 'Green' : 'Blue'}
        {active && <span className="color-panel__turn-badge">turn</span>}
      </p>
      <p className="color-panel__rule">
        {RULE_LABELS[pattern]}
        {doubleActive ? ' + Double' : ''}
      </p>
      <p className="color-panel__count">
        <strong>{alive}</strong>
        <span> objects</span>
      </p>
    </div>
  );
}
