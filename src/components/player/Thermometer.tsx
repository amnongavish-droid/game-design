const SCALE_MAX = 2000; // 2x the starting pool — high enough to keep the danger zone near zero readable
const TICK_STEP = 500;

const STOPS: { ratio: number; color: [number, number, number] }[] = [
  { ratio: 0, color: [179, 69, 47] }, // garnet
  { ratio: 0.35, color: [242, 135, 43] }, // ember
  { ratio: 0.55, color: [234, 179, 8] }, // amber
  { ratio: 0.75, color: [79, 179, 169] }, // teal
  { ratio: 1, color: [34, 197, 94] }, // green
];

function colorForRatio(ratio: number): string {
  const r = Math.min(Math.max(ratio, 0), 1);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (r >= a.ratio && r <= b.ratio) {
      const t = (r - a.ratio) / (b.ratio - a.ratio);
      const mix = a.color.map((c, idx) => Math.round(c + (b.color[idx] - c) * t));
      return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
    }
  }
  return `rgb(${STOPS[STOPS.length - 1].color.join(', ')})`;
}

interface Props {
  pool: number;
}

export function Thermometer({ pool }: Props) {
  const clamped = Math.min(Math.max(pool, 0), SCALE_MAX);
  const fillRatio = clamped / SCALE_MAX;
  const bulbColor = colorForRatio(fillRatio);

  const ticks: number[] = [];
  for (let v = 0; v <= SCALE_MAX; v += TICK_STEP) ticks.push(v);

  return (
    <div className="thermometer">
      <p className="thermometer__title">Livelihood</p>
      <div className="thermometer__row">
        <div className="thermometer__bulb" style={{ background: bulbColor }} />
        <div className="thermometer__scale">
          <div className="thermometer__track">
            <div className="thermometer__mask" style={{ width: `${(1 - fillRatio) * 100}%` }} />
          </div>
          {ticks.map((v) => (
            <div key={v} className="thermometer__tick" style={{ left: `${(v / SCALE_MAX) * 100}%` }}>
              <span className="thermometer__tick-line" />
              <span className="thermometer__tick-label">{v}</span>
            </div>
          ))}
        </div>
        <p className="thermometer__reading">{pool}</p>
      </div>
    </div>
  );
}
