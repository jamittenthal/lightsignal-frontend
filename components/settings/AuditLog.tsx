interface AuditEntry {
  at: string;
  action: string;
  provider: string;
  result: string;
}

interface AuditLogProps {
  entries: AuditEntry[];
  maxEntries?: number;
}

export function AuditLog({ entries, maxEntries = 20 }: AuditLogProps) {
  const displayEntries = entries.slice(0, maxEntries);

  function formatTimestamp(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function getResultColor(result: string) {
    switch (result.toLowerCase()) {
      case 'ok':
      case 'success':
        return 'text-emerald-600';
      case 'error':
      case 'failed':
        return 'text-rose-600';
      default:
        return 'text-gray-600';
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Audit Log (Last {maxEntries} Actions)</h4>
      
      {displayEntries.length === 0 ? (
        <div className="text-sm text-gray-500">No audit entries available.</div>
      ) : (
        <div className="space-y-1">
          {displayEntries.map((entry, i) => (
            <div key={i} className="text-xs text-gray-600 flex items-center justify-between py-1">
              <div className="flex-1">
                <span className="font-mono">{formatTimestamp(entry.at)}</span>
                <span className="mx-2">—</span>
                <span className="font-medium">{entry.action}</span>
                <span className="mx-1">on</span>
                <span className="font-medium">{entry.provider}</span>
              </div>
              <div className={`font-medium ${getResultColor(entry.result)}`}>
                {entry.result}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {entries.length > maxEntries && (
        <div className="text-xs text-gray-400">
          Showing {maxEntries} of {entries.length} entries
        </div>
      )}
    </div>
  );
}