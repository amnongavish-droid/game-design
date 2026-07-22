import { createRng } from '../../engine/rng';
import { OBJECTS_PER_COLOR } from '../../engine/types';

const LAYOUT_SEED = 20260722;
const TOTAL_OBJECTS = OBJECTS_PER_COLOR * 2;

/** Stable, randomized (but fixed-seed) positions in [0,1] x [0,1] so dots don't jump around between renders. */
export const FIELD_POSITIONS: { x: number; y: number }[] = (() => {
  const rng = createRng(LAYOUT_SEED);
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < TOTAL_OBJECTS; i++) {
    positions.push({ x: rng(), y: rng() });
  }
  return positions;
})();
