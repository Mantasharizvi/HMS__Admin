import { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import ExportReportModal from '../../components/reports/ExportReportModal';
import api from '../../services/api';
import { reportColumns, reportTitleByTab } from '../../data/reportsData';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// tab -> backend endpoint under /api/reports
const endpointByTab = {
  opd: '/reports/opd',
  ipd: '/reports/ipd',
  pharmacy: '/reports/pharmacy',
  revenue: '/reports/revenue',
};

export default function ReportTableView({ tab, description }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const columns = reportColumns[tab];
  const title = reportTitleByTab[tab];

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    api
      .get(endpointByTab[tab])
      .then(({ data }) => {
        if (!cancelled) setRows(data.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load report data');
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const tableColumns = useMemo(
    () =>
      columns.map((col) =>
        col.formatCurrency ? { ...col, render: (row) => INR.format(row[col.key]) } : col
      ),
    [columns]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          <>
            <Button size="sm" variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
            <Button size="sm" icon={Download} onClick={() => setShowExportModal(true)} disabled={!rows?.length}>
              Export Report
            </Button>
          </>
        }
      />

      {error && <p className="text-sm text-danger-600">{error}</p>}
      {!error && !rows && <p className="text-sm text-ink-500">Loading…</p>}
      {!error && rows && <Table columns={tableColumns} data={rows} />}

      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={title}
        columns={columns}
        rows={rows || []}
      />
    </div>
  );
}
