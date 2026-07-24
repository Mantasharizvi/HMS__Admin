import { Search, Download } from 'lucide-react';
import Select from '../common/Select';
import Button from '../common/Button';

// Static filter option lists for the dashboard toolbar (not hospital data).
const departments = ['All Departments', 'General', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'ENT', 'Not recommended'];
const dateRanges = ['Today', 'Last 7 days', 'Last 30 days', 'This year'];

export default function DashboardToolbar({
  search, onSearchChange,
  department, onDepartmentChange,
  range, onRangeChange,
  onExport,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1 min-w-0 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patients or doctors…"
          className="w-full rounded-lg border border-line bg-white pl-9 pr-3 py-2.5 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="w-full sm:w-48">
        <Select
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          options={departments.map((d) => ({ value: d, label: d }))}
          placeholder="All Departments"
          hideBlankOption
        />
      </div>

      <div className="w-full sm:w-44">
        <Select
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
          options={dateRanges.map((r) => ({ value: r, label: r }))}
          placeholder="Last 7 days"
          hideBlankOption
        />
      </div>

      <Button variant="secondary" icon={Download} className="sm:ml-auto shrink-0" onClick={onExport}>
        Export
      </Button>
    </div>
  );
}
