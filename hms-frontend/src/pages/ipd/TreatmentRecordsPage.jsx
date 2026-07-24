import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { useIpd, treatmentColumns } from '../../context/IpdContext';

export default function TreatmentRecordsPage() {
  const {
  treatmentRecords, admissions, doctors,   // ← add doctors here
  showTreatmentModal, setShowTreatmentModal,
  treatmentForm, setTreatmentForm, treatmentErrors,
  handleOpenTreatmentModal, handleAddTreatmentRecord,
} = useIpd();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treatment Records"
        description="Log and review treatment history for inpatients."
        action={<Button icon={Plus} onClick={handleOpenTreatmentModal}>Add Treatment Record</Button>}
      />

      <Table columns={treatmentColumns} data={treatmentRecords} />

      <FormModal
        isOpen={showTreatmentModal}
        onClose={() => setShowTreatmentModal(false)}
        onSubmit={handleAddTreatmentRecord}
        title="Add New Treatment Record"
        submitLabel="Log Treatment"
      >
        <Select
          label="Patient ID"
          value={treatmentForm.patientId}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, patientId: e.target.value })}
          options={admissions.filter((a) => a.status !== 'Discharged').map((adm) => ({ value: adm.admissionCode, label: `${adm.admissionCode} - ${adm.patient}` }))}
          error={treatmentErrors.patientId}
        />
        <Input
          label="Treatment Title"
          placeholder="e.g. IV Antibiotics / Vitals Check"
          value={treatmentForm.name}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })}
          error={treatmentErrors.name}
        />
        <Input
          label="Date & Time"
          type="datetime-local"
          value={treatmentForm.dateTime}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, dateTime: e.target.value })}
          error={treatmentErrors.dateTime}
        />
 
<Select
  label="Attending Doctor"
  value={treatmentForm.doctor}
  onChange={(e) => setTreatmentForm({ ...treatmentForm, doctor: e.target.value })}
  options={[
    { value: '', label: 'Select registered doctor' },
    ...doctors.map((d) => ({
      value: d.name,
      label: d.department ? `${d.name} - ${d.department}` : d.name,
    })),
  ]}
  error={treatmentErrors.doctor}
/>
        <Select
          label="Medicines Given"
          value={treatmentForm.medicinesGiven}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, medicinesGiven: e.target.value })}
          options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
        />
        <Select
          label="Status"
          value={treatmentForm.status}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, status: e.target.value })}
          options={[{ value: 'Ongoing', label: 'Ongoing' }, { value: 'Completed', label: 'Completed' }]}
        />
        <div className="lg:col-span-2">
          <Input
            label="Vitals Profile"
            placeholder="e.g. BP 120/80, Pulse 72, Temp 98.4°F, SpO2 98%"
            value={treatmentForm.vitals}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, vitals: e.target.value })}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-ink-900 mb-1.5">Procedure Details</label>
          <textarea
            rows="2"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Describe clinical actions executed..."
            value={treatmentForm.details}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, details: e.target.value })}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-ink-900 mb-1.5">Doctor/Nurse Notes</label>
          <textarea
            rows="2"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Observations or comments..."
            value={treatmentForm.notes}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-ink-900 mb-1.5">Follow-up Plan</label>
          <textarea
            rows="2"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Next milestones or scheduled controls..."
            value={treatmentForm.followUp}
            onChange={(e) => setTreatmentForm({ ...treatmentForm, followUp: e.target.value })}
          />
        </div>
        <Input
          label="Medicine & Supplies Cost"
          placeholder="e.g. 4000"
          value={treatmentForm.medicineSuppliesCost}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, medicineSuppliesCost: e.target.value })}
          error={treatmentErrors.medicineSuppliesCost}
        />
        <Input
          label="Procedure Fee"
          placeholder="e.g. 6000"
          value={treatmentForm.procedureFee}
          onChange={(e) => setTreatmentForm({ ...treatmentForm, procedureFee: e.target.value })}
          error={treatmentErrors.procedureFee}
        />
      </FormModal>
    </div>
  );
}
