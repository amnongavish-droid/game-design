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
  const isSelected = pendingAction?.type === 'wild-card';
  const value = isSelected ? pendingAction.livesPerObject : 1;
  const cost = isSelected ? costFor(objects, value) : 0;
  // The pool doesn't gate the slider at all — a request that costs more than the pool holds is
  // allowed through, and simply empties it, ending the game (whoever has more objects wins).
  const overspend = isSelected && cost > pool;

  const select = () => {
    if (disabled) return;
    onSelect({ type: 'wild-card', livesPerObject: 1 });
  };

  const slide = (n: number) => {
    onSelect({ type: 'wild-card', livesPerObject: n });
  };

  return (
    <div className={`wild-card${isSelected ? ' wild-card--selected' : ''}`}>
      <button
        className="wild-card__medallion"
        disabled={disabled}
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
      {isSelected && (
        <div className="wild-card__scroller">
          <input
            type="range"
            min={1}
            max={STARTING_LIVES}
            step={1}
            value={value}
            disabled={disabled}
            onChange={(e) => slide(Number(e.target.value))}
          />
          <p className="wild-card__readout">
            +{value} {value === 1 ? 'life' : 'lives'} each — costs {cost} from the pool
          </p>
          {overspend && <p className="wild-card__hint">Costs more than the pool holds — this empties it and ends the game.</p>}
        </div>
      )}
    </div>
  );
}
