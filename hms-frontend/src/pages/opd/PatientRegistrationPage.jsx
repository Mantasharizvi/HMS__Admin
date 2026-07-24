import { UserPlus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { useOpd } from '../../context/OpdContext';

export default function PatientRegistrationPage() {
  const {
    patients,
    doctors,
    departments,
    showPatientModal, setShowPatientModal,
    patientForm, setPatientForm, patientErrors,
    handleOpenPatientModal, handleRegisterPatient,
  } = useOpd();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Registration"
        description="Register walk-in patients and view today's OPD patient list."
        action={<Button icon={UserPlus} onClick={handleOpenPatientModal}>Register Patient</Button>}
      />

      <Table
        columns={[
          { key: 'patientCode', header: 'Patient ID' },
          { key: 'name', header: 'Patient' },
          { key: 'age', header: 'Age' },
          { key: 'doctor', header: 'Doctor' },
          { key: 'status', header: 'Status' },
          { key: 'visit', header: 'Visit Time' },
        ]}
        data={patients}
      />

      <FormModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSubmit={handleRegisterPatient}
        title="Patient Registration Form"
        submitLabel="Register Patient"
      >
        <Input
          label="Patient Name"
          placeholder="Enter patient name"
          value={patientForm.name}
          onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
          error={patientErrors.name}
        />
        <Input
          label="Mobile Number"
          placeholder="Enter phone number"
          value={patientForm.mobile}
          onChange={(e) => setPatientForm({ ...patientForm, mobile: e.target.value })}
          error={patientErrors.mobile}
        />
        <Input
          label="Age"
          type="number"
          placeholder="Enter age"
          value={patientForm.age}
          onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
          error={patientErrors.age}
        />
        <Select
          label="Gender"
          value={patientForm.gender}
          onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
        />
        <Select
          label="Department"
          value={patientForm.department}
          onChange={(e) => setPatientForm({ ...patientForm, department: e.target.value })}
          error={patientErrors.department}
          options={[
            { value: '', label: 'Select registered department' },
            ...departments.map((dept) => ({ value: dept, label: dept })),
          ]}
        />
        <Select
          label="Attending Doctor"
          value={patientForm.doctor}
          onChange={(e) => setPatientForm({ ...patientForm, doctor: e.target.value })}
          error={patientErrors.doctor}
          options={[
            { value: '', label: 'Select registered doctor' },
            ...doctors.map((d) => ({
              value: d.name,
              label: d.department ? `${d.name} - ${d.department}` : d.name,
            })),
          ]}
        />
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-ink-900 mb-1.5">Chief Complaint</label>
          <textarea
            rows="3"
            className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Describe symptoms or reason for visit"
            value={patientForm.complaint}
            onChange={(e) => setPatientForm({ ...patientForm, complaint: e.target.value })}
          />
        </div>
      </FormModal>
    </div>
  );
}
