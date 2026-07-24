import { useState, useMemo } from 'react';
import { Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useIpd } from '../../context/IpdContext';

export default function IpdBillingPage() {
  const { admissions, treatmentRecords, handleGenerateIpdBill } = useIpd();
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');

  // Only currently admitted (not yet discharged) patients can be billed here.
  const admittedPatients = useMemo(
    () => admissions.filter((a) => a.status !== 'Discharged'),
    [admissions]
  );

  const admission = admissions.find((a) => a.id === selectedAdmissionId);

  const charges = useMemo(() => {
    if (!admission) return { room: 0, medicine: 0, procedure: 0, total: 0 };
    const patientTreatments = treatmentRecords.filter((t) => t.patientId === admission.admissionCode);
    const room = Number(admission.roomCharges) || 0;
    const medicine = patientTreatments.reduce((sum, t) => sum + (Number(t.medicineSuppliesCost) || 0), 0);
    const procedure = patientTreatments.reduce((sum, t) => sum + (Number(t.procedureFee) || 0), 0);
    return { room, medicine, procedure, total: room + medicine + procedure };
  }, [admission, treatmentRecords]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="IPD Billing"
        description="Generate the consolidated inpatient bill from admission and treatment records."
      />

      <div className="rounded-lg border border-line bg-surface p-4 space-y-3 max-w-md">
        <div className="mb-4">
          <Select
            label="Invoice For Patient"
            value={selectedAdmissionId}
            onChange={(e) => setSelectedAdmissionId(e.target.value)}
            options={[
              { value: '', label: 'Select admitted patient' },
              ...admittedPatients.map((a) => ({
                value: a.id,
                label: `${a.admissionCode} - ${a.patient}`,
              })),
            ]}
          />
        </div>

        {!admission && (
          <p className="text-sm text-ink-600">Select an admitted patient above to calculate their bill.</p>
        )}

        {admission && (
          <>
            <div className="flex items-center justify-between text-sm text-ink-700">
              <span>Room Charges</span>
              <span>₹{charges.room.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-700">
              <span>Medicine & Supplies</span>
              <span>₹{charges.medicine.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-700">
              <span>Procedure Fee</span>
              <span>₹{charges.procedure.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-line pt-3 flex items-center justify-between font-semibold text-ink-900">
              <span>Total</span>
              <span>₹{charges.total.toLocaleString('en-IN')}</span>
            </div>
          </>
        )}

        <Button
          icon={Receipt}
          fullWidth
          disabled={!admission}
          onClick={() => handleGenerateIpdBill(selectedAdmissionId)}
        >
          Generate IPD Bill
        </Button>
      </div>
    </div>
  );
}
