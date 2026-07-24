import { useMemo } from 'react';
import { ClipboardPlus, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { useIpd } from '../../context/IpdContext';

export default function AdmissionFormPage() {
  const {
    admissions,
    doctors,
    showAdmissionModal, setShowAdmissionModal,
    admissionForm, setAdmissionForm, admissionErrors,
    handleOpenAdmissionModal, handleAdmitPatient,
  } = useIpd();

  // Live check: is the typed bed number already occupied in this ward?
  const bedNumber = admissionForm.bedNumber.trim();
  const occupyingAdmission = useMemo(() => {
    if (!bedNumber || !admissionForm.ward) return null;
    return admissions.find(
      (a) =>
        a.ward === admissionForm.ward &&
        String(a.bed).trim().toLowerCase() === bedNumber.toLowerCase() &&
        a.status !== 'Discharged'
    );
  }, [admissions, admissionForm.ward, bedNumber]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admission Form"
        description="Admit new inpatients and view current admissions."
        action={<Button icon={ClipboardPlus} onClick={handleOpenAdmissionModal}>Admit Patient</Button>}
      />

      <Table
        columns={[
          { key: 'admissionCode', header: 'Admission ID' },
          { key: 'patient', header: 'Patient' },
          { key: 'ward', header: 'Ward' },
          { key: 'bed', header: 'Bed No.' },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'Admitted' || row.status === 'Monitoring' || row.status === 'Recovery' ? 'bg-teal-50 text-teal-700' : 'bg-ink-100 text-ink-700'}`}>
                {row.status}
              </span>
            ),
          },
        ]}
        data={admissions}
      />

      <FormModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
        onSubmit={handleAdmitPatient}
        title="Admission Form"
        submitLabel="Admit Patient"
      >
        <Input
          label="Patient Name"
          placeholder="Enter inpatient name"
          value={admissionForm.name}
          onChange={(e) => setAdmissionForm({ ...admissionForm, name: e.target.value })}
          error={admissionErrors.name}
        />
        <Input
          label="Admission Date"
          type="date"
          value={admissionForm.admissionDate}
          onChange={(e) => setAdmissionForm({ ...admissionForm, admissionDate: e.target.value })}
          error={admissionErrors.admissionDate}
        />
        <Select
          label="Ward Preference"
          value={admissionForm.ward}
          onChange={(e) => setAdmissionForm({ ...admissionForm, ward: e.target.value })}
          options={[{ value: 'ICU', label: 'ICU' }, { value: 'Ward A', label: 'Ward A' }, { value: 'Ward B', label: 'Ward B' }]}
          error={admissionErrors.ward}
        />
       <div>
          {occupyingAdmission && (
            <div className="mb-1.5 flex items-start gap-1.5 rounded-md bg-danger-50 px-2.5 py-1.5 text-xs font-medium text-danger-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Bed "{admissionForm.bedNumber}" in {admissionForm.ward} is already occupied by{' '}
                {occupyingAdmission.patient} ({occupyingAdmission.admissionCode}). Choose a different bed.
              </span>
            </div>
          )}
          <Input
            label="Bed Allocation Number"
            placeholder="e.g. ICU-05, A-21"
            value={admissionForm.bedNumber}
            onChange={(e) => setAdmissionForm({ ...admissionForm, bedNumber: e.target.value })}
            error={admissionErrors.bedNumber || (occupyingAdmission ? 'This bed is already occupied' : '')}
          />
        </div>
        <Input
          label="Room Charges"
          placeholder="e.g. 5000"
          value={admissionForm.roomCharges}
          onChange={(e) => setAdmissionForm({ ...admissionForm, roomCharges: e.target.value })}
          error={admissionErrors.roomCharges}
        />
        <Select
          label="Attending Doctor"
          value={admissionForm.doctor}
          onChange={(e) => setAdmissionForm({ ...admissionForm, doctor: e.target.value })}
          options={[
            { value: '', label: 'Select registered doctor' },
            ...doctors.map((d) => ({
              value: d.name,
              label: d.department ? `${d.name} - ${d.department}` : d.name,
            })),
          ]}
        />
        <Input
          label="Emergency Contact"
          placeholder="Contact number"
          value={admissionForm.contact}
          onChange={(e) => setAdmissionForm({ ...admissionForm, contact: e.target.value })}
          error={admissionErrors.contact}
        />
        <Input
          label="Insurance ID"
          placeholder="Policy number"
          value={admissionForm.insurance}
          onChange={(e) => setAdmissionForm({ ...admissionForm, insurance: e.target.value })}
        />
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-ink-900 mb-1.5">Admission Reason</label>
          <textarea
            rows="3"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Briefly describe condition and requirement"
            value={admissionForm.reason}
            onChange={(e) => setAdmissionForm({ ...admissionForm, reason: e.target.value })}
          />
        </div>
      </FormModal>
    </div>
  );
}
