import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, History as HistoryIcon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useOpd } from '../../context/OpdContext';

export default function PatientHistoryPage() {
  const { patients, history = [], loadPatientRecords } = useOpd();
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // States for search and filters
  const [searchDate, setSearchDate] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Arriving from global search passes ?patient=<id or patientCode> —
  // preselect that patient once the patients list has loaded.
  const [searchParams, setSearchParams] = useSearchParams();
  const openPatientParam = searchParams.get('patient');
  useEffect(() => {
    if (!openPatientParam || patients.length === 0) return;
    const match = patients.find(
      (p) => String(p.id) === String(openPatientParam) || String(p.patientCode) === String(openPatientParam)
    );
    if (match) setSelectedPatientId(match.id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('patient');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPatientParam, patients]);

  useEffect(() => {
    loadPatientRecords(selectedPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  // Month & Year Dropdown Options (Expanded for 2026 and 2025)
  const filterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'current-month', label: 'Current Month' },
    
    // ---------- Year 2026 Months ----------
    { value: 'disabled-2026', label: '--- YEAR 2026 ---', disabled: true },
    { value: '2026-01', label: 'January 2026' },
    { value: '2026-02', label: 'February 2026' },
    { value: '2026-03', label: 'March 2026' },
    { value: '2026-04', label: 'April 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-09', label: 'September 2026' },
    { value: '2026-10', label: 'October 2026' },
    { value: '2026-11', label: 'November 2026' },
    { value: '2026-12', label: 'December 2026' },

    // ---------- Year 2025 Months ----------
    { value: 'disabled-2025', label: '--- YEAR 2025 ---', disabled: true },
    { value: '2025-01', label: 'January 2025' },
    { value: '2025-02', label: 'February 2025' },
    { value: '2025-03', label: 'March 2025' },
    { value: '2025-04', label: 'April 2025' },
    { value: '2025-05', label: 'May 2025' },
    { value: '2025-06', label: 'June 2025' },
    { value: '2025-07', label: 'July 2025' },
    { value: '2025-08', label: 'August 2025' },
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-10', label: 'October 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-12', label: 'December 2025' },
  ];

  // Dynamic Filtering Logic
  const filteredHistory = history.filter((item) => {
    const itemDate = item.date ? new Date(item.date) : new Date();

   
    if (searchDate && item.date) {
      const itemDateOnly =
        `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
      if (itemDateOnly !== searchDate) return false;
    }

    // 2. Expanded Month & Year Dropdown Filter
    if (selectedFilter !== 'all') {
      const itemYear = itemDate.getFullYear().toString();
      const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0'); 
      const itemYearMonth = `${itemYear}-${itemMonth}`;

      if (selectedFilter === 'current-month') {
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        if (itemYearMonth !== `${currentYear}-${currentMonth}`) return false;
      } else {
        if (itemYearMonth !== selectedFilter) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient History"
        description="Recent history and notes for the current patient."
      />

      {/* ---------- Patient Selector ---------- */}
      <div className="max-w-md">
        <Select
          label="Select Patient"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          options={[
            { value: '', label: 'Select registered patient' },
            ...patients.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.patientCode || p.id})`,
            })),
          ]}
        />
      </div>

      {/* ---------- Search and Filter UI ---------- */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl bg-white p-4 rounded-lg border border-line">
        <div className="flex-1">
          <Input
            label="Search By Date"
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Select
            label="Filter By Month / Year"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            options={filterOptions}
          />
        </div>
        
        {(searchDate || selectedFilter !== 'all') && (
          <div className="flex items-end pb-1">
            <button
              onClick={() => {
                setSearchDate('');
                setSelectedFilter('all');
              }}
              className="text-xs font-medium text-rose-600 hover:text-rose-800 underline transition-colors h-[42px]"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {!selectedPatientId && (
        <p className="text-sm text-ink-600">Select a patient above to view their history.</p>
      )}

      {/* ---------- History Records List ---------- */}
      <div className="rounded-lg border border-line bg-surface p-4 max-w-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2 text-teal-700">
            <HistoryIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">Recent History</span>
          </div>
          <span className="text-xs bg-teal-50 text-teal-700 font-medium px-2.5 py-0.5 rounded-full">
            {filteredHistory.length} Records Found
          </span>
        </div>

        <ul className="mt-4 space-y-3 text-sm text-ink-700">
          {filteredHistory.map((item, index) => {
            const noteText = item.note || item;
            const recordDate = item.date ? new Date(item.date) : new Date();
            const displayDate = recordDate.toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            });

            return (
              <li key={index} className="flex items-start gap-3 p-2.5 hover:bg-white rounded-md transition-colors border border-transparent hover:border-line">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <span className="font-medium text-ink-900">{noteText}</span>
                    
                    <span className="text-xs text-ink-600 font-medium whitespace-nowrap bg-teal-50/50 px-2 py-1 rounded border border-teal-100">
                      {displayDate}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}

          {filteredHistory.length === 0 && (
            <div className="text-center py-8 text-ink-500 italic">
              No matching history records found for this period.
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}