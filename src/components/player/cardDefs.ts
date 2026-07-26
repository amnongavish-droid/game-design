import type { TurnAction } from '../../engine/types';

export type CardKind = 'base' | 'modifier' | 'action' | 'ghost';
export type CardAccent = 'give' | 'take' | 'alternate' | 'tft' | 'double' | 'pause' | 'ghost';

export interface CardDef {
  id: string;
  kind: CardKind;
  accent: CardAccent;
  name: string;
  ruleText: string;
  tag: string;
  action: TurnAction;
}

export const CARD_DEFS: CardDef[] = [
  {
    id: 'always-give',
    kind: 'base',
    accent: 'give',
    name: 'Always Give',
    ruleText: 'Gives in every encounter, no matter what happened before.',
    tag: 'Base pattern',
    action: { type: 'play-rule', rule: 'always-give' },
  },
  {
    id: 'always-take',
    kind: 'base',
    accent: 'take',
    name: 'Always Take',
    ruleText: 'Takes in every encounter, no matter what happened before.',
    tag: 'Base pattern',
    action: { type: 'play-rule', rule: 'always-take' },
  },
  {
    id: 'alternate',
    kind: 'base',
    accent: 'alternate',
    name: 'Alternate',
    ruleText: 'Flips between give and take each time, regardless of outcome.',
    tag: 'Base pattern',
    action: { type: 'play-rule', rule: 'alternate' },
  },
  {
    id: 'tit-for-tat',
    kind: 'base',
    accent: 'tft',
    name: 'Tit-for-Tat',
    ruleText: 'Gives by default — but takes once, right after losing a life.',
    tag: 'Base pattern',
    action: { type: 'play-rule', rule: 'tit-for-tat' },
  },
  {
    id: 'tit-for-tat-delayed',
    kind: 'base',
    accent: 'tft',
    name: 'Tit-for-Tat, Delayed',
    ruleText: 'Gives by default — takes once, only after losing two in a row.',
    tag: 'Base pattern',
    action: { type: 'play-rule', rule: 'tit-for-tat-delayed' },
  },
  {
    id: 'double',
    kind: 'modifier',
    accent: 'double',
    name: 'Double',
    ruleText: "Doubles the stakes of your pattern's results. Stacks to 4x if both sides are doubled.",
    tag: 'Modifier',
    action: { type: 'toggle-double' },
  },
  {
    id: 'pause',
    kind: 'action',
    accent: 'pause',
    name: 'Pause',
    ruleText: "Skip this round's encounters entirely. The central pool still drains.",
    tag: 'Action',
    action: { type: 'pause' },
  },
  {
    id: 'decline',
    kind: 'ghost',
    accent: 'ghost',
    name: 'Decline',
    ruleText: 'Play no card. Your current rule carries over unchanged.',
    tag: 'No card',
    action: { type: 'decline' },
  },
];
