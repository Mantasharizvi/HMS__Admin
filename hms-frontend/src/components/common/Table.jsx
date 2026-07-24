import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import Loader from './Loader';

/**
 * columns: [{ key, header, render?(row) }]
 * data: array of row objects
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  page = 1,
  totalPages = 1,
  onPageChange,
  headerBgClass = 'bg-teal-700',
}) {
  return (
    <div className="w-full bg-white rounded-xl border border-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm text-left">
          <thead>
            <tr className={`${headerBgClass} border-b border-line`}>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium ${headerBgClass === 'bg-surface' ? 'text-ink-600' : 'text-white'} whitespace-normal`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <Loader label="Loading records" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-ink-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2" />
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i} className="border-b border-line last:border-0 hover:bg-surface/60">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-ink-900 align-top whitespace-normal break-words">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && data.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line">
          <span className="text-xs text-ink-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-line disabled:opacity-40 hover:bg-surface"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-line disabled:opacity-40 hover:bg-surface"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
