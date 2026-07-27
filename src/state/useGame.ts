import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { checkSustainability as runSustainabilityCheck, createInitialState, takeTurn } from '../engine/gameReducer';
import { createRng, type Rng } from '../engine/rng';
import type { Color, GameObject, GameState, RoundResult, TurnAction } from '../engine/types';
import { playCardClick, startSimulationSoundtrack, stopSimulationSoundtrack } from '../audio/sound';

const SIMULATION_DURATION_MS = 5000;

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

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export function useGame(soundEnabled: boolean) {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [history, setHistory] = useState<GameState[]>([]);
  const [pendingAction, setPendingAction] = useState<TurnAction | null>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const rngRef = useRef<Rng>(createRng(newSeed()));

  const startGame = useCallback(() => setStarted(true), []);

  const resetGame = useCallback(() => {
    rngRef.current = createRng(newSeed());
    setState(createInitialState());
    setHistory([]);
    setPendingAction(null);
    setPlayback(null);
  }, []);

  const selectAction = useCallback(
    (action: TurnAction) => {
      setPendingAction(action);
      if (soundEnabled) playCardClick();
    },
    [soundEnabled]
  );

  const clearSelection = useCallback(() => setPendingAction(null), []);

  const confirmMove = useCallback(() => {
    if (!pendingAction) return;
    const action = pendingAction;
    setState((prev) => {
      setHistory((h) => [...h, prev]);
      const next = takeTurn(prev, action, rngRef.current);
      const result = next.lastResult;
      if (result && !result.paused && result.passObjectStates.length > 0) {
        setPlayback({ preRoundObjects: prev.objects, result, passIndex: -1 });
      } else {
        setPlayback(null);
      }
      return next;
    });
    setPendingAction(null);
  }, [pendingAction]);

  // Manually requested once one color has been wiped out: plays a fixed batch of rounds (no
  // card changes, since there's no one left to change the eliminated color's rule) and declares
  // the survivor the winner if it comes through intact.
  const checkSustainability = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'in-progress') return prev;
      setHistory((h) => [...h, prev]);
      const result = runSustainabilityCheck(prev, rngRef.current);
      setPlayback(null);
      return result;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setState(h[h.length - 1]);
      setPlayback(null);
      setPendingAction(null);
      return h.slice(0, -1);
    });
  }, []);

  // Animate the current round's encounters over SIMULATION_DURATION_MS.
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

  // Ambient soundtrack while a round's encounters are animating.
  useEffect(() => {
    if (isSimulating && soundEnabled) {
      startSimulationSoundtrack();
    } else {
      stopSimulationSoundtrack();
    }
  }, [isSimulating, soundEnabled]);

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

  return {
    state,
    displayObjects,
    displayPool,
    isSimulating,
    progress,
    pendingAction,
    selectAction,
    confirmMove,
    clearSelection,
    checkSustainability,
    undo,
    canUndo: history.length > 0,
    started,
    startGame,
    resetGame,
  };
}

export type UseGame = ReturnType<typeof useGame>;
