import { useEffect, useState } from 'react';

const STORAGE_KEY = 'give-take:sound-enabled';

export function useSettings() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  return { soundEnabled, setSoundEnabled };
}
