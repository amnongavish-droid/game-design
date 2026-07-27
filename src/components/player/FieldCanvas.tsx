import { useEffect, useRef } from 'react';
import type { DisplayObject } from '../../state/useGame';
import { FIELD_POSITIONS } from './fieldLayout';

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

interface Props {
  objects: DisplayObject[];
}

export function FieldCanvas({ objects }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

    for (const obj of objects) {
      if (!obj.alive) continue;
      const pos = FIELD_POSITIONS[obj.id];
      if (!pos) continue;
      const tier = tierFor(obj.lives);
      drawDrifter(ctx, pos.x * width, pos.y * height, pos.rotation, COLORS[obj.color][tier]);
    }

    ctx.restore();
  }, [objects]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="field-canvas" />;
}
