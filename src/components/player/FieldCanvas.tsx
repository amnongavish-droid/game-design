import { useEffect, useRef } from 'react';
import type { DisplayObject } from '../../state/useGame';
import { SIMULATION_DURATION_MS } from '../../state/useGame';
import { MIXED_POSITIONS, groupedPosition } from './fieldLayout';

const COLORS = {
  green: { strong: '#15803d', mid: '#4ade80', faded: '#bbf7d0' },
  blue: { strong: '#1d4ed8', mid: '#60a5fa', faded: '#bfdbfe' },
};

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 340;

// "Ocular drifter" glyph: a glowing body, a dark pupil with a highlight, and three thin
// trailing tendrils. Proportions scaled down from the approved mockup (body radius 5.5 there).
const BODY_RADIUS = 1.8;
const PUPIL_RADIUS = 0.72;
const HIGHLIGHT_RADIUS = 0.24;
const HIGHLIGHT_OFFSET = 0.26;
const PUPIL_FILL = '#08131a';
const HIGHLIGHT_FILL = '#e9e4d8';

const TENDRILS: { start: [number, number]; control: [number, number]; end: [number, number] }[] = [
  { start: [0, 1.64], control: [-1.96, 2.62], end: [-2.62, 3.93] },
  { start: [-1.31, 1.31], control: [-2.62, 1.64], end: [-3.6, 1.96] },
  { start: [1.31, 1.31], control: [2.62, 1.64], end: [3.6, 2.29] },
];

function tierFor(lives: number): 'strong' | 'mid' | 'faded' {
  if (lives > 7) return 'strong';
  if (lives >= 4) return 'mid';
  return 'faded';
}

const GLYPH_SCALE = 2;

function drawDrifter(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(GLYPH_SCALE, GLYPH_SCALE);

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.45;
  ctx.lineCap = 'round';
  for (const t of TENDRILS) {
    ctx.beginPath();
    ctx.moveTo(t.start[0], t.start[1]);
    ctx.quadraticCurveTo(t.control[0], t.control[1], t.end[0], t.end[1]);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, BODY_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PUPIL_FILL;
  ctx.beginPath();
  ctx.arc(0, 0, PUPIL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = HIGHLIGHT_FILL;
  ctx.beginPath();
  ctx.arc(-HIGHLIGHT_OFFSET, -HIGHLIGHT_OFFSET, HIGHLIGHT_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface Props {
  /** Current per-pass snapshot — drives each dot's color/tier, and (as it converges pass by
   * pass) the settled position it's animating toward. */
  objects: DisplayObject[];
  /** The round's starting snapshot — the settled position it's animating from. Equal to
   * `objects` whenever the field isn't mid-round. */
  fromObjects: DisplayObject[];
  isSimulating: boolean;
}

export function FieldCanvas({ objects, fromObjects, isSimulating }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectsRef = useRef(objects);
  const fromRef = useRef(fromObjects);
  objectsRef.current = objects;
  fromRef.current = fromObjects;

  const drawFrame = (mix: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    const rx = width / 2;
    const ry = height / 2;
    const outerRadius = Math.max(rx, ry);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    const bg = ctx.createRadialGradient(cx, cy * 0.85, outerRadius * 0.1, cx, cy, outerRadius);
    bg.addColorStop(0, '#141d2d');
    bg.addColorStop(1, '#080b12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const fromById = new Map(fromRef.current.map((o) => [o.id, o] as const));

    for (const obj of objectsRef.current) {
      if (!obj.alive) continue;

      const toPos = groupedPosition(obj.id, obj.color, obj.lives);
      let px = toPos.x;
      let py = toPos.y;

      if (mix < 1) {
        const fromO = fromById.get(obj.id);
        const fromPos = fromO && fromO.alive ? groupedPosition(obj.id, fromO.color, fromO.lives) : toPos;
        const mixedPos = MIXED_POSITIONS[obj.id] ?? toPos;
        if (mix < 0.5) {
          const t = easeInOut(mix / 0.5);
          px = fromPos.x + (mixedPos.x - fromPos.x) * t;
          py = fromPos.y + (mixedPos.y - fromPos.y) * t;
        } else {
          const t = easeInOut((mix - 0.5) / 0.5);
          px = mixedPos.x + (toPos.x - mixedPos.x) * t;
          py = mixedPos.y + (toPos.y - mixedPos.y) * t;
        }
      }

      const tier = tierFor(obj.lives);
      const rotation = MIXED_POSITIONS[obj.id]?.rotation ?? 0;
      drawDrifter(ctx, px * width, py * height, rotation, COLORS[obj.color][tier]);
    }

    ctx.restore();
  };

  // Continuous "mixing" animation for the duration of a round's playback, independent of the
  // discrete per-pass data updates above (which only refine where it's converging to). Uses
  // setTimeout rather than requestAnimationFrame — rAF is suspended by browsers whenever the
  // tab/pane isn't the visibly composited one, which would silently freeze this animation.
  useEffect(() => {
    if (!isSimulating) {
      drawFrame(1);
      return;
    }
    const stepMs = 50;
    let timerId = 0;
    const start = performance.now();
    const tick = () => {
      const mix = Math.min((performance.now() - start) / SIMULATION_DURATION_MS, 1);
      drawFrame(mix);
      if (mix < 1) timerId = window.setTimeout(tick, stepMs);
    };
    timerId = window.setTimeout(tick, stepMs);
    return () => clearTimeout(timerId);
  }, [isSimulating]);

  // Redraw immediately when settled and the data changes (undo, reset, incremental pass
  // reveals) — the effect above only restarts when `isSimulating` itself flips.
  useEffect(() => {
    if (isSimulating) return;
    drawFrame(1);
  }, [objects, fromObjects, isSimulating]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="field-canvas" />;
}
