import { useEffect, useMemo, useState } from 'react';
import Table from '../common/Table';
import StatusBadge from '../common/StatusBadge';

const PAGE_SIZE = 5;

const statusLabel = { success: 'Stable', warning: 'Observation', danger: 'Critical' };

const columns = [
  { key: 'name', header: 'Patient' },
  { key: 'doctor', header: 'Doctor' },
  { key: 'department', header: 'Department' },
  { key: 'ward', header: 'Ward / Bed' },
  {
    key: 'date',
    header: 'Date',
    render: (row) => new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  },
  {
    key: 'status',
    header: 'Condition',
    render: (row) => <StatusBadge status={row.status}>{statusLabel[row.status]}</StatusBadge>,
  },
];

export default function RecentPatientsTable({ data }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pageData = useMemo(
    () => data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [data, page]
  );

  // Reset to first page whenever the filtered dataset shrinks below the current page.
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <Table
      columns={columns}
      data={pageData}
      emptyMessage="No patients match your filters"
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  );
}
