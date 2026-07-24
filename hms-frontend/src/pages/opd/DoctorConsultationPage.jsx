import { useState } from 'react';
import { ClipboardList, Stethoscope } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select'; // Select component import kiya
import { useOpd } from '../../context/OpdContext';
import { useToast } from '../../context/ToastContext';

export default function DoctorConsultationPage() {
  const { consultation, setConsultation, patients, handleSaveConsultation } = useOpd(); // patients list ko context se nikala
  const toast = useToast();

  // ---------- Dynamic Prescription Local States ----------
  const [currentMedicine, setCurrentMedicine] = useState('');
  const [currentDetail, setCurrentDetail] = useState('');
  const [dynamicPrescriptions, setDynamicPrescriptions] = useState([
    { medicine: 'Paracetamol 500mg', detail: '1-0-1 - 3 days' },
    { medicine: 'Vitamin D3', detail: '1-0-0 - 30 days' },
  ]);

  // Patients ki list ko dropdown options [{ value, label }] ke format mein transform karna
  const patientOptions = (patients || []).map(p => ({
    value: p.id,
    label: `${p.patientCode} - ${p.name}`
  }));

  const handleAddPrescriptionTag = () => {
    if (!currentMedicine.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }
    
    const newPrescription = {
      medicine: currentMedicine.trim(),
      detail: currentDetail.trim() || 'As directed',
    };

    setDynamicPrescriptions([...dynamicPrescriptions, newPrescription]);
    
    // Inputs refresh / clear karne ke liye
    setCurrentMedicine('');
    setCurrentDetail('');
  };

  const handleRemovePrescriptionTag = (indexToRemove) => {
    setDynamicPrescriptions(dynamicPrescriptions.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Consultation"
        description="Record observations, prescriptions and consultation charges for the current patient."
      />

      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center gap-2 text-teal-700">
          <Stethoscope className="h-4 w-4" />
          <span className="text-sm font-semibold">Current Consultation</span>
        </div>
        <p className="mt-2 text-sm text-ink-700">Patient complaint: recurring fever and fatigue. Observed mild dehydration and fatigue. Recommend CBC and urine routine.</p>
      </div>

      <div className="grid gap-3 max-w-2xl">
        {/* Patient ID input field ko badalkar dropdown (Select) bana diya hai */}
        <Select
          label="Select Patient ID"
          value={consultation.patientid}
          onChange={(e) => setConsultation({ ...consultation, patientid: e.target.value })}
          options={patientOptions}
        />
        
        <Input
          label="Observation Notes"
          placeholder="Add notes here"
          value={consultation.notes}
          onChange={(e) => setConsultation({ ...consultation, notes: e.target.value })}
        />

        {/* ---------- Added Prescriptions Pills Panel ---------- */}
        {dynamicPrescriptions.length > 0 && (
          <div className="rounded-lg border border-line bg-surface p-3 mt-1">
            <label className="block text-xs font-semibold text-ink-600 mb-2">Added Prescriptions:</label>
            <div className="flex flex-wrap gap-2">
              {dynamicPrescriptions.map((item, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 border border-teal-100"
                >
                  <span>{item.medicine} ({item.detail})</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrescriptionTag(index)}
                    className="rounded-full p-0.5 hover:bg-teal-100 text-teal-600 hover:text-teal-900 font-bold transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ---------- Dual Inputs Layout with Single Add Button ---------- */}
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
          <div className="flex-1 w-full">
            <Input
              label="Prescribed Medicine"
              placeholder="e.g. Paracetamol 500mg"
              value={currentMedicine}
              onChange={(e) => setCurrentMedicine(e.target.value)}
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              label="Prescription Detail"
              placeholder="e.g. 1-0-1 - 3 days"
              value={currentDetail}
              onChange={(e) => setCurrentDetail(e.target.value)}
            />
          </div>
          <Button 
            type="button" 
            variant="secondary" 
            className="h-[42px] shrink-0 sm:mb-0.5 w-full sm:w-auto" 
            onClick={handleAddPrescriptionTag}
          >
            + Add
          </Button>
        </div>

        <Input
          label="Next Review Date"
          type="date"
          value={consultation.reviewDate}
          onChange={(e) => setConsultation({ ...consultation, reviewDate: e.target.value })}
        />

        {/* Lab Charges aur Medicine Charges ko remove karke sirf Consultation Fee rakha hai */}
        <div>
          <Input
            label="Consultation Fee"
            type="number"
            placeholder="₹0.00"
            value={consultation.consultationFee}
            onChange={(e) => setConsultation({ ...consultation, consultationFee: e.target.value })}
          />
        </div>

        <Button icon={ClipboardList} onClick={() => handleSaveConsultation(dynamicPrescriptions)}>
          Save Consultation
        </Button>
      </div>
    </div>
  );
}