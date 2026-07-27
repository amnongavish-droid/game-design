import { createRng } from '../../engine/rng';
import type { Color } from '../../engine/types';
import { OBJECTS_PER_COLOR } from '../../engine/types';

const LAYOUT_SEED = 20260722;
const TOTAL_OBJECTS = OBJECTS_PER_COLOR * 2;

export interface FieldPosition {
  x: number;
  y: number;
  /** Fixed per-object rotation (radians) so each creature's tendrils face a stable direction. */
  rotation: number;
}

/**
 * Stable, randomized (but fixed-seed) positions in [0,1] x [0,1], uniformly sampled across a
 * disk (not a square) so the field reads as a round world rather than a rectangular grid.
 * Used only as the mid-simulation "objects mixing around" waypoint — the settled/grouped
 * layout (see groupedPosition below) is what's shown at rest.
 */
export const MIXED_POSITIONS: FieldPosition[] = (() => {
  const rng = createRng(LAYOUT_SEED);
  const positions: FieldPosition[] = [];
  for (let i = 0; i < TOTAL_OBJECTS; i++) {
    const r = Math.sqrt(rng()) * 0.5;
    const theta = rng() * Math.PI * 2;
    const rotation = rng() * Math.PI * 2;
    positions.push({ x: 0.5 + r * Math.cos(theta), y: 0.5 + r * Math.sin(theta), rotation });
  }
  return positions;
})();

interface FieldLocal {
  /** Where within its life-tier band this object sits — organic scatter instead of rigid rings. */
  localT: number;
  /** Vertical scatter, signed [-1, 1]. */
  localOffset: number;
}

const FIELD_LOCAL: FieldLocal[] = (() => {
  const rng = createRng(LAYOUT_SEED + 1);
  const out: FieldLocal[] = [];
  for (let i = 0; i < TOTAL_OBJECTS; i++) {
    out.push({ localT: rng(), localOffset: rng() * 2 - 1 });
  }
  return out;
})();

/** Life-tier band as a [near own edge, near shared centerline] radius range, matching the
 * strong/mid/faded shading tiers used for color. */
function tierBand(lives: number): [number, number] {
  if (lives > 7) return [0, 0.34];
  if (lives >= 4) return [0.34, 0.67];
  return [0.67, 1];
}

/** How far a point at normalized x can scatter vertically and stay inside the field's disk. */
function maxYOffsetAt(x: number): number {
  const dx = x - 0.5;
  const inner = 0.25 - dx * dx;
  return inner > 0 ? Math.sqrt(inner) : 0;
}

/**
 * The settled/grouped layout: each color occupies its own half of the field (blue on the left,
 * green on the right, matching their side panels), shading from solid near its own outer edge
 * to faded near the shared centerline as an object's life tier drops.
 */
export function groupedPosition(id: number, color: Color, lives: number): { x: number; y: number } {
  const local = FIELD_LOCAL[id];
  const [bandMin, bandMax] = tierBand(lives);
  const radius = bandMin + local.localT * (bandMax - bandMin); // 0 = own edge, 1 = shared centerline
  const x = color === 'blue' ? radius * 0.5 : 1 - radius * 0.5;
  const y = 0.5 + local.localOffset * maxYOffsetAt(x) * 0.9;
  return { x, y };
}
