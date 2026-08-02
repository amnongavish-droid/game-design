import type { Decision, GameObject } from './types';

export function decide(obj: GameObject): Decision {
  switch (obj.basePattern) {
    case 'always-give':
      return 'give';
    case 'always-take':
      return 'take';
    case 'alternate':
      return obj.lastDecision === 'give' ? 'take' : 'give';
    case 'tit-for-tat':
      return obj.lossStreak >= 1 ? 'take' : 'give';
  }
}

/** Mutates obj's history fields after an encounter has been resolved. */
export function updateHistory(obj: GameObject, decision: Decision, lifeDelta: number): void {
  const wasRetaliation = obj.basePattern === 'tit-for-tat' && obj.lossStreak >= 1;

  obj.lastDecision = decision;

  if (wasRetaliation) {
    obj.lossStreak = lifeDelta < 0 ? 1 : 0;
  } else if (lifeDelta < 0) {
    obj.lossStreak += 1;
  } else {
    obj.lossStreak = 0;
  }
}
