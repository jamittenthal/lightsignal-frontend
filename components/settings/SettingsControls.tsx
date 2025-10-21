import { useState } from "react";

interface MaskedInputProps {
  label: string;
  placeholder?: string;
  onSaveAndTest?: (value: string) => Promise<void>;
}

export function MaskedInput({ label, placeholder = "********", onSaveAndTest }: MaskedInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSaveAndTest() {
    if (!value.trim() || !onSaveAndTest) return;
    
    setLoading(true);
    try {
      await onSaveAndTest(value);
      setValue(""); // Clear after successful save
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSaveAndTest}
          disabled={loading || !value.trim()}
          className="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "..." : "Save & Test"}
        </button>
      </div>
    </div>
  );
}

interface ImportExportControlsProps {
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export function ImportExportControls({ onExport, onImport }: ImportExportControlsProps) {
  const [importing, setImporting] = useState(false);

  async function handleImport(file: File | null) {
    if (!file) return;
    
    setImporting(true);
    try {
      await onImport(file);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Export / Import Settings</h3>
      
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
        >
          📥 Export JSON
        </button>
        
        <label className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50 text-sm inline-flex items-center">
          {importing ? "Importing..." : "📤 Import JSON"}
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0] ?? null)}
            disabled={importing}
          />
        </label>
      </div>
      
      <div className="text-xs text-gray-500">
        Export saves current settings as JSON. Import overwrites current preview (not saved until confirmed).
      </div>
    </div>
  );
}