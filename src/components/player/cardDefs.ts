import type { RuleName, TurnAction } from '../../engine/types';

export const RULE_LABELS: Record<RuleName, string> = {
  'always-give': 'Always Give',
  'always-take': 'Always Take',
  alternate: 'Alternate',
  'tit-for-tat': 'Tit-for-Tat',
};

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
    ruleText:
      'Gives by default — but takes once, right after losing a life. That memory carries across rounds, so a round can open on a take.',
    tag: 'Base pattern',
    action: { type: 'play-rule', rule: 'tit-for-tat' },
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
    ruleText: "Skips this round's encounters entirely. The livelihood pool is untouched.",
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
