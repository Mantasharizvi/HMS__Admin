import { ClipboardList, Eye, Edit2, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ExportReportModal from '../../components/reports/ExportReportModal';
import { useOpd, appointmentColumns } from '../../context/OpdContext';

export default function AppointmentManagementPage() {
  const {
    patients,
    doctors,
    departments,
    appointments,
    isAppointmentModalOpen, setIsAppointmentModalOpen,
    appointmentForm, setAppointmentForm, appointmentErrors, editingAppointmentId,
    viewAppointment, setViewAppointment,
    deleteAppointmentId, setDeleteAppointmentId,
    showExportModal, setShowExportModal,
    handleOpenNewAppointment, handleOpenEditAppointment,
    handleSaveAppointment, handleConfirmDelete,
  } = useOpd();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment Management"
        description="Create, edit, and track OPD appointments."
        action={
          <>
            <Button size="sm" variant="secondary" icon={ClipboardList} onClick={() => setShowExportModal(true)}>
              Export
            </Button>
            <Button size="sm" icon={ClipboardList} onClick={handleOpenNewAppointment}>
              Add New Appointment
            </Button>
          </>
        }
      />

      <Table
        columns={[
          { key: 'appointmentCode', header: 'Appointment ID' },
          { key: 'patient', header: 'Patient Name' },
          { key: 'doctor', header: 'Doctor' },
          { key: 'department', header: 'Department' },
          { key: 'date', header: 'Date' },
          { key: 'time', header: 'Time Slot' },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'Confirmed' ? 'bg-teal-50 text-teal-700' : row.status === 'Completed' ? 'bg-surface text-ink-700' : 'bg-amber-50 text-amber-700'}`}>
                {row.status}
              </span>
            ),
          },
          {
            key: 'payment',
            header: 'Payment Status',
            render: (row) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.payment === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {row.payment}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" icon={Eye} onClick={() => setViewAppointment(row)}>View</Button>
                <Button size="sm" variant="secondary" icon={Edit2} onClick={() => handleOpenEditAppointment(row)}>Edit</Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteAppointmentId(row.id)}>Delete</Button>
              </div>
            ),
          },
        ]}
        data={appointments}
      />

      <FormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSubmit={handleSaveAppointment}
        title={editingAppointmentId ? 'Edit Appointment' : 'Add New Appointment'}
        submitLabel={editingAppointmentId ? 'Save Changes' : 'Save Appointment'}
      >
        <Select
          label="Patient Name"
          value={appointmentForm.patient}
          onChange={(e) => {
            const chosen = patients.find((p) => p.name === e.target.value);
            setAppointmentForm({
              ...appointmentForm,
              patient: e.target.value,
              department: chosen?.department || appointmentForm.department,
            });
          }}
          error={appointmentErrors.patient}
          options={[
            { value: '', label: 'Select registered patient' },
            ...patients.map((p) => ({
              value: p.name,
              label: `${p.name} (${p.patientCode || p.id})`,
            })),
          ]}
        />
        <Select
          label="Doctor"
          value={appointmentForm.doctor}
          onChange={(e) => {
            const chosenDoctor = doctors.find((d) => d.name === e.target.value);
            setAppointmentForm({
              ...appointmentForm,
              doctor: e.target.value,
              department: chosenDoctor?.department || appointmentForm.department,
            });
          }}
          error={appointmentErrors.doctor}
          options={[
            { value: '', label: 'Select registered doctor' },
            ...doctors.map((d) => ({
              value: d.name,
              label: d.department ? `${d.name} - ${d.department}` : d.name,
            })),
          ]}
        />
        <Select
          label="Department"
          value={appointmentForm.department}
          onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })}
          options={[
            { value: '', label: 'Select registered department' },
            ...departments.map((dept) => ({ value: dept, label: dept })),
          ]}
        />
        <Input
          label="Choose Date"
          type="date"
          value={appointmentForm.date}
          onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
          error={appointmentErrors.date}
        />
        <Input
          label="Choose Time Slot"
          type="time"
          value={appointmentForm.time}
          onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
          error={appointmentErrors.time}
        />
        <Select
          label="Consultation Type"
          value={appointmentForm.type}
          onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })}
          options={[{ value: 'offline', label: 'Offline' }, { value: 'online', label: 'Online' }]}
        />
       <Select
  label="Appointment Status"
  value={appointmentForm.status}
  onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}
  options={[{ value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'completed', label: 'Completed' }]}
/>
<Select
  label="Payment Status"
  value={appointmentForm.payment}
  onChange={(e) => setAppointmentForm({ ...appointmentForm, payment: e.target.value })}
  options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'paid', label: 'Paid' }]}
/>
        <Input
          label="Reason for Visit"
          placeholder="Enter reason for visit"
          className="lg:col-span-2"
          value={appointmentForm.reason}
          onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
        />
      </FormModal>

      <Modal isOpen={!!viewAppointment} onClose={() => setViewAppointment(null)} title="Appointment Details" size="md">
        {viewAppointment && (
          <div className="px-6 py-4 space-y-3 text-sm">
            {[
              ['Appointment ID', viewAppointment.appointmentCode],
              ['Patient', viewAppointment.patient],
              ['Doctor', viewAppointment.doctor],
              ['Department', viewAppointment.department],
              ['Date', viewAppointment.date],
              ['Time', viewAppointment.time],
              ['Status', viewAppointment.status],
              ['Payment', viewAppointment.payment],
              ['Type', viewAppointment.type],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                <span className="text-ink-600">{label}</span>
                <span className="font-medium text-ink-900">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteAppointmentId}
        onClose={() => setDeleteAppointmentId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete appointment?"
        message="This will permanently remove the appointment from the schedule."
      />

      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Appointment Management"
        columns={appointmentColumns}
        rows={appointments}
      />
    </div>
  );
}
