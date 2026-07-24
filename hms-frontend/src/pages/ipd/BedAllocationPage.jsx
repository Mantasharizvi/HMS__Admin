import { BedDouble } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { useIpd } from '../../context/IpdContext';

export default function BedAllocationPage() {
  const {
    admissions, wards,
    showAddBedsModal, setShowAddBedsModal,
    addBedsForm, setAddBedsForm, addBedsErrors,
    handleOpenAddBedsModal, handleAddBeds,
  } = useIpd();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed Allocation"
        description="Current bed allocation for every admitted inpatient."
        action={
          <Button icon={BedDouble} onClick={() => handleOpenAddBedsModal()}>
            Add Beds
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {wards.map((w) => (
          <div key={w.id} className="rounded-lg border border-line bg-white p-4">
            <p className="text-sm font-semibold text-ink-900">{w.name}</p>
            <p className="text-xs text-ink-600 mt-1">{w.occupied} / {w.beds} beds occupied</p>
          </div>
        ))}
      </div>

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
        isOpen={showAddBedsModal}
        onClose={() => setShowAddBedsModal(false)}
        onSubmit={handleAddBeds}
        title="Add Beds"
        submitLabel="Add Beds"
      >
        <Select
          label="Ward"
          value={addBedsForm.wardId}
          onChange={(e) => setAddBedsForm({ ...addBedsForm, wardId: e.target.value })}
          options={wards.map((w) => ({ value: w.id, label: `${w.name} (${w.beds} beds currently)` }))}
          placeholder="Select a ward"
          error={addBedsErrors.wardId}
        />
        <Input
          label="Number of Beds to Add"
          type="number"
          min="1"
          max="50"
          placeholder="e.g. 5"
          value={addBedsForm.count}
          onChange={(e) => setAddBedsForm({ ...addBedsForm, count: e.target.value })}
          error={addBedsErrors.count}
          hint="New beds are auto-numbered after the ward's existing beds (e.g. ICU-13, ICU-14…) and start out Vacant."
        />
      </FormModal>
    </div>
  );
}