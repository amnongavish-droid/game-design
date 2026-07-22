import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createInitialState, takeTurn } from '../engine/gameReducer';
import { createRng, type Rng } from '../engine/rng';
import type { Color, GameObject, GameState, RoundResult, TurnAction } from '../engine/types';

const SIMULATION_DURATION_MS = 15000;

export interface DisplayObject {
  id: number;
  color: Color;
  lives: number;
  alive: boolean;
}

interface Playback {
  preRoundObjects: GameObject[];
  result: RoundResult;
  passIndex: number; // -1 = pre-round (nothing played back yet)
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const rngRef = useRef<Rng>(createRng(Math.floor(Math.random() * 2 ** 31)));
  const [playback, setPlayback] = useState<Playback | null>(null);

  const dispatch = useCallback((action: TurnAction) => {
    setState((prev) => {
      const next = takeTurn(prev, action, rngRef.current);
      const result = next.lastResult;
      if (result && !result.paused && result.passObjectStates.length > 0) {
        setPlayback({ preRoundObjects: prev.objects, result, passIndex: -1 });
      } else {
        setPlayback(null);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!playback) return;
    const totalPasses = playback.result.passObjectStates.length;
    if (playback.passIndex >= totalPasses - 1) return;
    const stepMs = SIMULATION_DURATION_MS / totalPasses;
    const timer = setTimeout(() => {
      setPlayback((p) => (p ? { ...p, passIndex: p.passIndex + 1 } : p));
    }, stepMs);
    return () => clearTimeout(timer);
  }, [playback]);

  const totalPasses = playback?.result.passObjectStates.length ?? 0;
  const isSimulating = playback !== null && playback.passIndex < totalPasses - 1;

  const displayObjects: DisplayObject[] = useMemo(() => {
    if (!playback) {
      return state.objects.map((o) => ({ id: o.id, color: o.color, lives: o.lives, alive: o.alive }));
    }
    const base = playback.preRoundObjects;
    if (playback.passIndex < 0) {
      return base.map((o) => ({ id: o.id, color: o.color, lives: o.lives, alive: o.alive }));
    }
    const snap = playback.result.passObjectStates[playback.passIndex];
    return base.map((o, i) => ({ id: o.id, color: o.color, lives: snap[i].lives, alive: snap[i].alive }));
  }, [state.objects, playback]);

  const displayPool: number = useMemo(() => {
    if (!playback) return state.pool;
    if (playback.passIndex < 0) return playback.result.logEntry.poolBefore;
    // subRounds snapshots are taken before the round's flat decrement is applied, so once we've
    // reached the final pass, show the true post-decrement pool rather than the pre-decrement snapshot.
    if (playback.passIndex >= totalPasses - 1) return state.pool;
    return playback.result.subRounds[playback.passIndex].poolValue;
  }, [state.pool, playback, totalPasses]);

  const progress = playback ? { pass: playback.passIndex + 1, totalPasses } : null;

  return { state, dispatch, displayObjects, displayPool, isSimulating, progress };
}

export type UseGame = ReturnType<typeof useGame>;
