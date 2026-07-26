import type { Color, RuleName } from '../../engine/types';
import { RULE_LABELS } from './cardDefs';

interface Props {
  color: Color;
  pattern: RuleName;
  doubleActive: boolean;
  alive: number;
}

export function ColorPanel({ color, pattern, doubleActive, alive }: Props) {
  return (
    <div className={`color-panel color-panel--${color}`}>
      <p className="color-panel__label">{color === 'green' ? 'Green' : 'Blue'}</p>
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
