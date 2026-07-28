import type { DisplayObject } from '../../state/useGame';
import { STARTING_LIVES, type TurnAction } from '../../engine/types';

interface Props {
  pool: number;
  objects: DisplayObject[];
  pendingAction: TurnAction | null;
  onSelect: (action: TurnAction) => void;
  disabled: boolean;
}

function costFor(objects: DisplayObject[], livesPerObject: number): number {
  let cost = 0;
  for (const o of objects) {
    if (!o.alive) continue;
    // Lives can already exceed STARTING_LIVES from normal play — such objects get no further
    // boost (and cost nothing), never a negative contribution.
    cost += Math.max(o.lives, Math.min(o.lives + livesPerObject, STARTING_LIVES)) - o.lives;
  }
  return cost;
}

function WildCardSigil() {
  return (
    <svg viewBox="0 0 32 32" className="wild-card__sigil-icon">
      <circle cx="16" cy="16" r="2.6" />
      <path d="M16 9 V3" />
      <path d="M16 23 V29" />
      <path d="M23 16 H29" />
      <path d="M9 16 H3" />
      <path d="M20.8 11.2 L25 7" />
      <path d="M11.2 20.8 L7 25" />
      <path d="M20.8 20.8 L25 25" />
      <path d="M11.2 11.2 L7 7" />
    </svg>
  );
}

export function WildCardControl({ pool, objects, pendingAction, onSelect, disabled }: Props) {
  const livingCount = objects.filter((o) => o.alive).length;
  // Conservative bound (ignores per-object caps) — guarantees the real cost, computed below,
  // never exceeds the pool.
  const maxAffordable = livingCount > 0 ? Math.floor(pool / livingCount) : 0;
  const maxN = Math.max(0, Math.min(STARTING_LIVES, maxAffordable));
  const unaffordable = maxN < 1;

  const isSelected = pendingAction?.type === 'wild-card';
  const value = isSelected ? pendingAction.livesPerObject : 1;
  const cost = isSelected ? costFor(objects, value) : 0;

  const select = () => {
    if (unaffordable || disabled) return;
    onSelect({ type: 'wild-card', livesPerObject: Math.min(1, maxN) });
  };

  const slide = (n: number) => {
    onSelect({ type: 'wild-card', livesPerObject: n });
  };

  return (
    <div className={`wild-card${isSelected ? ' wild-card--selected' : ''}`}>
      <button
        className="wild-card__medallion"
        disabled={disabled || (unaffordable && !isSelected)}
        aria-pressed={isSelected}
        aria-label="Wild card"
        onClick={select}
      >
        <span className="wild-card__medallion-face">
          <WildCardSigil />
        </span>
      </button>
      <p className="wild-card__name">Wild card</p>
      <p className="wild-card__caption">Gives every living object shared lives from the pool.</p>
      {isSelected ? (
        <div className="wild-card__scroller">
          <input
            type="range"
            min={1}
            max={Math.max(1, maxN)}
            step={1}
            value={value}
            disabled={disabled}
            onChange={(e) => slide(Number(e.target.value))}
          />
          <p className="wild-card__readout">
            +{value} life{value === 1 ? '' : 's'} each — costs {cost} from the pool
          </p>
        </div>
      ) : unaffordable ? (
        <p className="wild-card__hint">Not enough livelihood to afford it right now.</p>
      ) : null}
    </div>
  );
}
