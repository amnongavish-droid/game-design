import type { CardDef } from './cardDefs';

const SIGILS: Record<string, JSX.Element> = {
  'always-give': (
    <svg viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="3.2" />
      <path d="M16 10 V3 M16 3 l-3 3 M16 3 l3 3" />
      <path d="M16 22 V29" />
      <path d="M22 16 h7 M22 16 l3 3 m0-6 l-3 3" />
      <path d="M10 16 H3" />
    </svg>
  ),
  'always-take': (
    <svg viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="3.2" />
      <path d="M16 3 V10 M13 7 l3 3 l3 -3" />
      <path d="M16 29 V22" />
      <path d="M29 16 h-7 M25 13 l-3 3 l3 3" />
      <path d="M3 16 H10" />
    </svg>
  ),
  alternate: (
    <svg viewBox="0 0 32 32">
      <path d="M8 12 a8 8 0 0 1 15 -3" />
      <path d="M23 9 l4 -1 l0 4" />
      <path d="M24 20 a8 8 0 0 1 -15 3" />
      <path d="M9 23 l-4 1 l0 -4" />
    </svg>
  ),
  'tit-for-tat': (
    <svg viewBox="0 0 32 32">
      <path d="M16 4 V28" strokeDasharray="2 3" />
      <path d="M6 12 h7 M13 12 l-3 -3 m3 3 l-3 3" />
      <path d="M26 20 h-7 M19 20 l3 -3 m-3 3 l3 3" />
    </svg>
  ),
  'tit-for-tat-delayed': (
    <svg viewBox="0 0 32 32">
      <path d="M16 4 V28" strokeDasharray="2 3" />
      <circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <path d="M6 20 h7 M13 20 l-3 -3 m3 3 l-3 3" />
      <path d="M26 20 h-7 M19 20 l3 -3 m-3 3 l3 3" />
    </svg>
  ),
  double: (
    <svg viewBox="0 0 32 32">
      <path d="M17 3 L9 17 h6 l-2 12 l10 -16 h-6 Z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 32 32">
      <rect x="11" y="9" width="4" height="14" rx="1" />
      <rect x="18" y="9" width="4" height="14" rx="1" />
    </svg>
  ),
  decline: (
    <svg viewBox="0 0 32 32" strokeDasharray="3 3">
      <circle cx="16" cy="16" r="9" />
    </svg>
  ),
};

interface Props {
  def: CardDef;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function Card({ def, selected, disabled, onClick }: Props) {
  const shapeClass = def.kind === 'modifier' ? 'card--modifier' : def.kind === 'ghost' ? 'card--ghost' : '';

  return (
    <button
      type="button"
      className={`card card--${def.accent} ${shapeClass} ${selected ? 'card--selected' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
    >
      <div className="card__sigil">{SIGILS[def.id]}</div>
      <p className="card__name">{def.name}</p>
      <p className="card__rule">{def.ruleText}</p>
      <span className="card__tag">{def.tag}</span>
    </button>
  );
}
