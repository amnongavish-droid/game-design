import { useEffect, useRef } from 'react';
import type { DisplayObject } from '../../state/useGame';
import { FIELD_POSITIONS } from './fieldLayout';

const COLORS = {
  green: { strong: '#15803d', mid: '#4ade80', faded: '#bbf7d0' },
  blue: { strong: '#1d4ed8', mid: '#60a5fa', faded: '#bfdbfe' },
};

function tierFor(lives: number): 'strong' | 'mid' | 'faded' {
  if (lives > 7) return 'strong';
  if (lives >= 4) return 'mid';
  return 'faded';
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
    ctx.clearRect(0, 0, width, height);

    for (const obj of objects) {
      if (!obj.alive) continue;
      const pos = FIELD_POSITIONS[obj.id];
      if (!pos) continue;
      const tier = tierFor(obj.lives);
      ctx.fillStyle = COLORS[obj.color][tier];
      ctx.beginPath();
      ctx.arc(pos.x * width, pos.y * height, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [objects]);

  return <canvas ref={canvasRef} width={900} height={520} className="field-canvas" />;
}
