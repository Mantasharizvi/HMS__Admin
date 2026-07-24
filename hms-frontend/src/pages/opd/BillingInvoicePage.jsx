import { Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useOpd } from '../../context/OpdContext';
import { printInvoice } from '../../utils/printInvoice'; // Agar printInvoice useOpd mein nahi hai toh yahan se import hoga

export default function BillingInvoicePage() {
  // Context se consultation, setConsultation, patients aur consultations list nikala
  const { consultation, setConsultation, patients, consultations } = useOpd();

  // Total ab sirf consultationFee ke upar hi based hai
  const total = (Number(consultation.consultationFee) || 500); 

  // Sirf un patients ko dropdown mein dikhana hai jinki Doctor Consultation
  // record ho chuki hai (consultations list mein unka patient id maujood ho).
  const consultedPatientIds = new Set(
    (consultations || []).map((c) => (typeof c.patient === 'object' ? c.patient?.id || c.patient?._id : c.patient))
  );
  const consultedPatients = (patients || []).filter((p) => consultedPatientIds.has(p.id));

  // Patients ki list ko dropdown options [{ value, label }] ke format mein convert karna
  const patientOptions = [
    { value: '', label: 'Select consulted patient' },
    ...consultedPatients.map(p => ({
      value: p.id,
      label: `${p.name} (${p.patientCode || p.id})`
    })),
  ];

  // Selected Patient ka Name nikalne ke liye helper function
  const getSelectedPatientName = () => {
    const foundPatient = (patients || []).find(p => p.id === consultation.patientid);
    return foundPatient ? foundPatient.name : 'Walk-in Patient';
  };

  // PDF Generate aur Print karne ka dynamic function
  const handlePrintPDFInvoice = () => {
    printInvoice({
      title: 'OPD Invoice',
      invoiceNo: `INV-OPD-${Date.now().toString().slice(-6)}`,
      patientId: (patients || []).find(p => p.id === consultation.patientid)?.patientCode || consultation.patientid,
      patientName: getSelectedPatientName(), // Sahi Patient Name pass kiya
      lineItems: [
        { label: 'Consultation Fee', amount: total }, // Sirf Consultation Fee add kiya
      ],
      total: total, // Total sirf consultation fee par based hai
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing and Invoice"
        description="Generate the OPD invoice for the current consultation."
      />

      <div className="rounded-lg border border-line bg-surface p-4 space-y-3 max-w-md">
        
        {/* Patient ID Dropdown */}
        <div className="mb-4">
          <Select
            label="Invoice For Patient"
            value={consultation.patientid}
            onChange={(e) => setConsultation({ ...consultation, patientid: e.target.value })}
            options={patientOptions}
          />
          {consultedPatients.length === 0 && (
            <p className="mt-1.5 text-xs text-ink-500">
              No patients have a Doctor Consultation on record yet.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-ink-700">
          <span>Consultation Fee</span>
          <span>₹{total}</span>
        </div>

        <div className="border-t border-line pt-3 flex items-center justify-between font-semibold text-ink-900">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        
        {/* Updated click handler to print dynamic and filtered invoice */}
        <Button icon={Receipt} fullWidth onClick={handlePrintPDFInvoice}>
          Generate Invoice
        </Button>
      </div>
    </div>
  );
}