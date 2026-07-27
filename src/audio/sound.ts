let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Short synthesized blip for selecting/pressing a card. */
export function playCardClick(): void {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(720, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, ac.currentTime + 0.08);
  gain.gain.setValueAtTime(0.32, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.09);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.1);
}

interface Soundtrack {
  stop: () => void;
}

let soundtrack: Soundtrack | null = null;

/** Soft generative ambient pad, played while a round's encounters are animating. */
export function startSimulationSoundtrack(): void {
  if (soundtrack) return;
  const ac = getCtx();

  const master = ac.createGain();
  master.gain.setValueAtTime(0, ac.currentTime);
  master.gain.linearRampToValueAtTime(0.09, ac.currentTime + 0.3);
  master.connect(ac.destination);

  const nodes: OscillatorNode[] = [];
  const freqs = [110, 165, 220];
  for (const f of freqs) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.15 + Math.random() * 0.1;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain).connect(osc.frequency);

    osc.connect(master);
    osc.start();
    lfo.start();
    nodes.push(osc, lfo);
  }

  soundtrack = {
    stop: () => {
      const stopTime = ac.currentTime;
      master.gain.cancelScheduledValues(stopTime);
      master.gain.setValueAtTime(master.gain.value, stopTime);
      master.gain.linearRampToValueAtTime(0, stopTime + 0.25);
      setTimeout(() => {
        nodes.forEach((n) => n.stop());
        master.disconnect();
      }, 300);
    },
  };
}

export function stopSimulationSoundtrack(): void {
  soundtrack?.stop();
  soundtrack = null;
}
