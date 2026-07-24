import { FileBarChart2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import ExportReportModal from '../../components/reports/ExportReportModal';
import { usePharmacy, inventoryColumns } from '../../context/PharmacyContext';

export default function PharmacyReportsPage() {
  const { inventory, showReportModal, setShowReportModal } = usePharmacy();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Reports"
        description="Monthly pharmacy insights and downloadable reports."
      />

      <div className="rounded-lg border border-line bg-surface p-4 max-w-2xl">
        <div className="flex items-center gap-2 text-teal-700">
          <FileBarChart2 className="h-4 w-4" />
          <span className="text-sm font-semibold">Monthly pharmacy insights</span>
        </div>
        <p className="mt-3 text-sm text-ink-700">Sales trending upward, stock turnover improved, and urgent reorder alerts are active for low-volume medicines.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button icon={FileBarChart2} onClick={() => setShowReportModal(true)}>Generate Report</Button>
        </div>
      </div>

      <ExportReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Pharmacy Report"
        columns={inventoryColumns}
        rows={inventory}
      />
    </div>
  );
}
