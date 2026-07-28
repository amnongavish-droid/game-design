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
        className="wild-card__button"
        disabled={disabled || (unaffordable && !isSelected)}
        aria-pressed={isSelected}
        onClick={select}
      >
        Wild Card
      </button>
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
