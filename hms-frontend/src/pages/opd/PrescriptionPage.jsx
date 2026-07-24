import { useState, useEffect } from 'react';
import { Pill } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Select from '../../components/common/Select';
import { useOpd } from '../../context/OpdContext';

export default function PrescriptionPage() {
  const { patients, prescriptions, loadPatientRecords } = useOpd();
  const [selectedPatientId, setSelectedPatientId] = useState('');

  useEffect(() => {
    loadPatientRecords(selectedPatientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescription"
        description="Medicines prescribed to a registered patient, pulled from the database."
      />

      <div className="max-w-md">
        <Select
          label="Select Patient"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          options={[
            { value: '', label: 'Select registered patient' },
            ...patients.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.patientCode || p.id})`,
            })),
          ]}
        />
      </div>

      {!selectedPatientId && (
        <p className="text-sm text-ink-600">Select a patient above to view their latest prescription.</p>
      )}

      {selectedPatientId && prescriptions.length === 0 && (
        <p className="text-sm text-ink-600">No prescription found for this patient yet.</p>
      )}

      <div className="space-y-3">
        {prescriptions.map((item, idx) => (
          <div key={`${item.medicine}-${idx}`} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Pill className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-ink-900">{item.medicine}</p>
                  <p className="text-sm text-ink-600">Dosage: {item.dosage}</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{item.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
