// Round-trip JSON export/import for user patterns.

import { useRef, useState } from 'react';
import type { UserPattern } from '../../lib/db';
import { bulkImport, isValidUserPattern, isValidPattern } from '../../lib/db';
import { logError } from '../../lib/errors';

interface Props {
  userPatterns: UserPattern[];
  onImported: () => void;
}

function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ExportImport({ userPatterns, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const exportAll = () => {
    if (userPatterns.length === 0) {
      setMsg('Nothing to export yet.');
      setTimeout(() => setMsg(null), 1800);
      return;
    }
    const blob = new Blob([JSON.stringify(userPatterns, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beatforge-userpatterns-${todayStamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsg(`Exported ${userPatterns.length} pattern${userPatterns.length === 1 ? '' : 's'}.`);
    setTimeout(() => setMsg(null), 2000);
  };

  const importFile = async (file: File) => {
    // Split the error surface so parse/read errors don't look like
    // database errors — previously a single catch swallowed everything.
    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch (err) {
      logError('Import: failed to read/parse JSON file', err);
      setMsg(`Import failed — file isn't valid JSON.`);
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    if (!Array.isArray(parsed)) {
      setMsg('Import failed — file must contain a JSON array.');
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    const now = Date.now();
    const valid: UserPattern[] = [];
    let skipped = 0;
    for (const raw of parsed) {
      if (isValidUserPattern(raw)) {
        valid.push(raw);
      } else if (isValidPattern(raw)) {
        valid.push({ ...raw, user: true, createdAt: now, updatedAt: now });
      } else {
        skipped += 1;
      }
    }
    if (valid.length === 0) {
      setMsg(`Import: no valid patterns (${skipped} skipped).`);
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    try {
      await bulkImport(valid);
    } catch (err) {
      logError('Import: database write failed', err);
      setMsg('Import failed — couldn\'t write to local storage.');
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    onImported();
    setMsg(`Imported ${valid.length}${skipped ? ` · skipped ${skipped} invalid` : ''}.`);
    setTimeout(() => setMsg(null), 2800);
  };

  return (
    <div className="bf-studio-io">
      <div className="bf-studio-io-row">
        <button className="bf-chip ghost" onClick={exportAll} type="button">
          ⬇ Export JSON
        </button>
        <button
          className="bf-chip ghost"
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          ⬆ Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {msg && <div className="bf-studio-io-msg">{msg}</div>}
    </div>
  );
}
