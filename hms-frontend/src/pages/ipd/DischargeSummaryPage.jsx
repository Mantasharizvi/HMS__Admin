import { FileCheck2, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import FormModal from '../../components/common/FormModal';
import { useIpd } from '../../context/IpdContext';

export default function DischargeSummaryPage() {
  const {
    admissions,
    showDischargeModal, setShowDischargeModal,
    dischargeForm, setDischargeForm, dischargeErrors,
    handleOpenDischargeModal, handleFinalizeDischarge,
  } = useIpd();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discharge Summary"
        description="Review discharge criteria and finalize inpatient discharge."
      />

      <div className="rounded-lg border border-line bg-surface p-4 space-y-3 max-w-2xl">
        <div className="flex items-center gap-2 text-teal-700">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-semibold">Recommended discharge criteria</span>
        </div>
        <p className="text-sm text-ink-700">Patient stable, oral intake adequate, vitals normalized and follow-up appointment scheduled for next week.</p>
        <Button icon={FileCheck2} onClick={handleOpenDischargeModal}>Finalize Summary</Button>
      </div>

      <FormModal
        isOpen={showDischargeModal}
        onClose={() => setShowDischargeModal(false)}
        onSubmit={handleFinalizeDischarge}
        title="Finalize Patient Discharge Summary"
        submitLabel="Approve & Discharge Inpatient"
      >
        <Select
          label="Select Active Inpatient"
          value={dischargeForm.admissionId}
          onChange={(e) => setDischargeForm({ ...dischargeForm, admissionId: e.target.value })}
          options={admissions
            .filter((a) => a.status !== 'Discharged')
            .map((adm) => ({ value: adm.id, label: `${adm.admissionCode} - ${adm.patient} (${adm.bed})` }))}
          error={dischargeErrors.admissionId}
        />
        <Input
          label="Discharge Date"
          type="date"
          value={dischargeForm.dischargeDate}
          onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeDate: e.target.value })}
          error={dischargeErrors.dischargeDate}
        />
        <Select
          label="Patient Status on Discharge"
          value={dischargeForm.condition}
          onChange={(e) => setDischargeForm({ ...dischargeForm, condition: e.target.value })}
          options={[
            { value: 'Stable', label: 'Cured / Stable' },
            { value: 'Relieved', label: 'Relieved' },
            { value: 'LAMA', label: 'Left Against Medical Advice (LAMA)' },
            { value: 'Referral', label: 'Transferred / Referred' },
          ]}
        />
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-ink-900 mb-1.5">Discharge Summary & Instructions</label>
          <textarea
            rows="4"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            value={dischargeForm.summaryNotes}
            onChange={(e) => setDischargeForm({ ...dischargeForm, summaryNotes: e.target.value })}
          />
        </div>
      </FormModal>
    </div>
  );
}
