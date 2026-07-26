import { createRng } from '../../engine/rng';
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
 */
export const FIELD_POSITIONS: FieldPosition[] = (() => {
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
