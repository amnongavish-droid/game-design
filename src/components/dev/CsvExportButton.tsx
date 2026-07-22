import { downloadCsv, logToCsv } from '../../engine/csv';
import type { RoundLogEntry } from '../../engine/types';

interface Props {
  log: RoundLogEntry[];
}

export function CsvExportButton({ log }: Props) {
  return (
    <button
      disabled={log.length === 0}
      onClick={() => downloadCsv(`game-log-${Date.now()}.csv`, logToCsv(log))}
    >
      Export log as CSV ({log.length} rounds)
    </button>
  );
}
