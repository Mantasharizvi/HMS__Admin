import { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { exportReport } from '../../utils/exportReport';

const formatOptions = [
  { value: 'pdf', label: 'PDF Document', hint: 'Portable format for viewing and printing' },
  { value: 'excel', label: 'Excel Spreadsheet', hint: 'Format for data analysis and further editing' },
  { value: 'csv', label: 'CSV File', hint: 'Comma-separated values for data import' },
];

/**
 * Export modal for the Reports & Analytics module.
 * `title`   - human readable report name, e.g. "OPD Report"
 * `columns` - [{ key, header, formatCurrency? }] — same shape used by the on-screen Table
 * `rows`    - the currently visible report rows
 */
export default function ExportReportModal({ isOpen, onClose, title, columns, rows }) {
  const [format, setFormat] = useState('pdf');
  const [status, setStatus] = useState('idle'); // idle | exporting | done | error

  const handleExport = async () => {
    setStatus('exporting');
    try {
      // Run on next tick so the "exporting" spinner actually paints before the
      // (synchronous, CPU-bound) PDF/Excel generation blocks the main thread.
      await new Promise((resolve) => setTimeout(resolve, 50));
      exportReport(format, title, columns, rows);
      setStatus('done');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 900);
    } catch (err) {
      console.error('Export failed:', err);
      setStatus('error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export ${title}`} size="md">
      <div className="px-6 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-3">Select Format</label>
          <div className="space-y-2">
            {formatOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 border border-line rounded-lg cursor-pointer hover:bg-surface"
              >
                <input
                  type="radio"
                  name="format"
                  value={opt.value}
                  checked={format === opt.value}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-ink-900">{opt.label}</p>
                  <p className="text-xs text-ink-600">{opt.hint}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-600">
          {rows.length} record{rows.length === 1 ? '' : 's'} will be included in the export.
        </p>

        {status === 'error' && (
          <p className="text-xs text-danger-600">
            Something went wrong generating the file. Please try again.
          </p>
        )}
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-line bg-surface rounded-b-xl">
        <Button
          onClick={handleExport}
          fullWidth
          disabled={status === 'exporting'}
          icon={status === 'done' ? CheckCircle2 : status === 'exporting' ? undefined : Download}
        >
          {status === 'exporting' && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          {status === 'exporting' ? 'Generating…' : status === 'done' ? 'Downloaded' : `Export ${format.toUpperCase()}`}
        </Button>
        <Button variant="secondary" onClick={onClose} fullWidth disabled={status === 'exporting'}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
