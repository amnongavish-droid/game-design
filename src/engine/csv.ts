import type { RoundLogEntry } from './types';

const HEADERS: (keyof RoundLogEntry)[] = [
  'round',
  'paused',
  'cardPlayer',
  'cardPlayed',
  'greenPattern',
  'greenDouble',
  'bluePattern',
  'blueDouble',
  'poolBefore',
  'poolAfter',
  'greenAlive',
  'blueAlive',
  'greenLivesTotal',
  'blueLivesTotal',
  'deathsThisRound',
  'giveGiveCount',
  'takeGiveCount',
  'takeTakeCount',
  'steadyRoundsCount',
  'status',
];

export function logToCsv(log: RoundLogEntry[]): string {
  const rows = log.map((entry) => HEADERS.map((key) => String(entry[key])).join(','));
  return [HEADERS.join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
