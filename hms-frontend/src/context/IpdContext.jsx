import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { validateForm, rules, isValid } from '../utils/validators';
import { printInvoice } from '../utils/printInvoice';
import api from '../services/api';

const IpdContext = createContext(null);

const emptyAdmission = {
  name: '', admissionDate: '', ward: '', bedNumber: '', roomCharges: '',
  doctor: '', contact: '', insurance: '', reason: '',
};
const admissionSchema = {
  name: [rules.required('Patient name is required')],
  admissionDate: [rules.required('Admission date is required')],
  ward: [rules.required('Please select a ward')],
  bedNumber: [rules.required('Bed allocation number is required')],
  roomCharges: [rules.required('Room charges are required'), rules.numeric()],
  contact: [rules.required('Emergency contact is required'), rules.phone()],
};

const emptyDischarge = { admissionId: '', dischargeDate: '', condition: 'Stable', summaryNotes: '' };
const dischargeSchema = {
  admissionId: [rules.required('Please select an inpatient')],
  dischargeDate: [rules.required('Discharge date is required')],
};

const emptyTreatment = {
  patientId: '', name: '', dateTime: '', doctor: '', medicinesGiven: 'No', status: 'Ongoing',
  vitals: '', details: '', notes: '', followUp: '', medicineSuppliesCost: '', procedureFee: '',
};
const treatmentSchema = {
  patientId: [rules.required('Please select a patient')],
  name: [rules.required('Treatment title is required')],
  dateTime: [rules.required('Date and time is required')],
  doctor: [rules.required('Attending doctor is required')],
};

// `id` is the MongoDB _id (Mongoose virtual) - used for edit/delete/discharge.
// `admissionCode` (e.g. "IPD-401") is the human-readable display value.
export const treatmentColumns = [
  { key: 'treatmentCode', header: 'Treatment ID' },
  { key: 'patientId', header: 'Patient ID' },
  { key: 'name', header: 'Treatment' },
  { key: 'doctor', header: 'Doctor' },
  { key: 'dateTime', header: 'Date & Time' },
  { key: 'status', header: 'Status' },
];

// Map an Admission doc to the shape the UI expects (adds `bed` alias for `bed`,
// already matches; kept for clarity/extension).
const mapAdmission = (a) => ({ ...a, bed: a.bed });

export function IpdProvider({ children }) {
  const toast = useToast();

  const [wards, setWards] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionForm, setAdmissionForm] = useState(emptyAdmission);
  const [admissionErrors, setAdmissionErrors] = useState({});

  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeForm, setDischargeForm] = useState(emptyDischarge);
  const [dischargeErrors, setDischargeErrors] = useState({});

 const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState(emptyTreatment);
  const [treatmentErrors, setTreatmentErrors] = useState({});

  // ---------- Add Beds (Bed Allocation page) ----------
  const [showAddBedsModal, setShowAddBedsModal] = useState(false);
  const [addBedsForm, setAddBedsForm] = useState({ wardId: '', count: '1' });
  const [addBedsErrors, setAddBedsErrors] = useState({});



  // ---------- Initial data load ----------
  useEffect(() => {
    api.get('/ipd/wards').then((res) => setWards(res.data.data)).catch(() => toast.error('Could not load wards'));
    api.get('/ipd/admissions')
      .then((res) => setAdmissions(res.data.data.map(mapAdmission)))
      .catch(() => toast.error('Could not load admissions'));
    api.get('/ipd/treatments')
      .then((res) => setTreatmentRecords(res.data.data))
      .catch(() => toast.error('Could not load treatment records'));
    api.get('/users/doctors')
      .then((res) => setDoctors(res.data.data))
      .catch(() => toast.error('Could not load the registered doctors list'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Admission ----------
  const handleOpenAdmissionModal = () => {
    setAdmissionForm(emptyAdmission);
    setAdmissionErrors({});
    setShowAdmissionModal(true);
  };

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    const errors = validateForm(admissionForm, admissionSchema);
    setAdmissionErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    const bedNumber = admissionForm.bedNumber.trim();
    const isOccupied = admissions.some(
      (a) =>
        a.ward === admissionForm.ward &&
        String(a.bed).trim().toLowerCase() === bedNumber.toLowerCase() &&
        a.status !== 'Discharged'
    );
    if (isOccupied) {
      toast.error(`Bed "${bedNumber}" in ${admissionForm.ward} is already occupied. Choose a different bed.`);
      return;
    }

    try {
      const { data } = await api.post('/ipd/admissions', {
        patient: admissionForm.name,
        admissionDate: admissionForm.admissionDate,
        ward: admissionForm.ward,
        bed: admissionForm.bedNumber,
        roomCharges: Number(admissionForm.roomCharges) || 0,
        doctor: admissionForm.doctor,
        contact: admissionForm.contact,
        insurance: admissionForm.insurance,
        reason: admissionForm.reason,
      });
      setAdmissions((current) => [mapAdmission(data.data), ...current]);
      setShowAdmissionModal(false);
      toast.success(`Patient "${data.data.patient}" admitted successfully`);

      // Refresh ward occupancy since the backend just incremented it.
      api.get('/ipd/wards').then((res) => setWards(res.data.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to admit patient');
    }
  };

  // ---------- Discharge ----------
  const handleOpenDischargeModal = () => {
    setDischargeForm(emptyDischarge);
    setDischargeErrors({});
    setShowDischargeModal(true);
  };

  const handleFinalizeDischarge = async (e) => {
    e.preventDefault();
    const errors = validateForm(dischargeForm, dischargeSchema);
    setDischargeErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post(`/ipd/admissions/${dischargeForm.admissionId}/discharge`, {
        dischargeDate: dischargeForm.dischargeDate,
        condition: dischargeForm.condition,
        summaryNotes: dischargeForm.summaryNotes,
      });
      setAdmissions((current) =>
        current.map((a) => (a.id === dischargeForm.admissionId ? mapAdmission(data.data) : a))
      );
      setShowDischargeModal(false);
      toast.success('Inpatient discharged successfully');

      api.get('/ipd/wards').then((res) => setWards(res.data.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to finalize discharge');
    }
  };

  // ---------- Treatment records ----------
  const handleOpenTreatmentModal = () => {
    setTreatmentForm(emptyTreatment);
    setTreatmentErrors({});
    setShowTreatmentModal(true);
  };

  const handleAddTreatmentRecord = async (e) => {
    e.preventDefault();
    const errors = validateForm(treatmentForm, treatmentSchema);
    setTreatmentErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post('/ipd/treatments', {
        ...treatmentForm,
        medicineSuppliesCost: Number(treatmentForm.medicineSuppliesCost) || 0,
        procedureFee: Number(treatmentForm.procedureFee) || 0,
      });
      setTreatmentRecords((current) => [data.data, ...current]);
      setShowTreatmentModal(false);
      toast.success('Treatment record logged successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log treatment record');
    }
  };

  // ---------- Ward bed status ----------
 // ---------- Add Beds (Bed Allocation page) ----------
  const handleOpenAddBedsModal = (wardId = '') => {
    setAddBedsForm({ wardId, count: '1' });
    setAddBedsErrors({});
    setShowAddBedsModal(true);
  };

  const handleAddBeds = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!addBedsForm.wardId) errors.wardId = 'Please select a ward';
    const count = Number(addBedsForm.count);
    if (!addBedsForm.count || Number.isNaN(count) || count < 1) {
      errors.count = 'Enter a number of beds to add (1 or more)';
    } else if (count > 50) {
      errors.count = 'Add at most 50 beds at a time';
    }
    setAddBedsErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post(`/ipd/wards/${addBedsForm.wardId}/beds`, { count });
      setWards((current) => current.map((w) => (w.id === addBedsForm.wardId ? data.data : w)));
      setShowAddBedsModal(false);
      toast.success(`${count} bed${count > 1 ? 's' : ''} added to ${data.data.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add beds');
    }
  };

  // ---------- Ward bed status ----------
  const handleUpdateBedStatus = async (wardId, bedNumber, status) => {
    try {
      const { data } = await api.put(`/ipd/wards/${wardId}/beds/${bedNumber}`, { status });
      setWards((current) => current.map((w) => (w.id === wardId ? data.data : w)));
      toast.success(`Bed ${bedNumber} marked as ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bed status');
    }
  };

  // ---------- Billing ----------
  const handleGenerateIpdBill = async (admissionId) => {
    const admission = admissions.find((a) => a.id === admissionId);
    if (!admission) {
      toast.error('Please select an admitted patient first');
      return;
    }

    const patientTreatments = treatmentRecords.filter((t) => t.patientId === admission.admissionCode);
    const medicineSuppliesTotal = patientTreatments.reduce((sum, t) => sum + (Number(t.medicineSuppliesCost) || 0), 0);
    const procedureFeeTotal = patientTreatments.reduce((sum, t) => sum + (Number(t.procedureFee) || 0), 0);

    const lineItems = [
      { label: 'Room Charges', amount: Number(admission.roomCharges) || 0 },
      { label: 'Medicine & Supplies', amount: medicineSuppliesTotal },
      { label: 'Procedure Fee', amount: procedureFeeTotal },
    ];
    const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

    printInvoice({
      title: 'IPD Invoice',
      invoiceNo: `INV-IPD-${Date.now().toString().slice(-6)}`,
      patientName: `${admission.patient} (${admission.admissionCode})`,
      lineItems,
      total,
    });

    try {
      await api.post('/billing', { type: 'IPD', patient: admission.patient, lineItems, total });
    } catch (err) {
      toast.error('Bill printed, but could not be saved for reporting');
      return;
    }
    toast.success('IPD bill sent to printer');
  };

  const value = {
    wards, admissions, treatmentRecords, doctors,

    showAdmissionModal, setShowAdmissionModal,
    admissionForm, setAdmissionForm, admissionErrors,
    handleOpenAdmissionModal, handleAdmitPatient,

    showDischargeModal, setShowDischargeModal,
    dischargeForm, setDischargeForm, dischargeErrors,
    handleOpenDischargeModal, handleFinalizeDischarge,

  showTreatmentModal, setShowTreatmentModal,
    treatmentForm, setTreatmentForm, treatmentErrors,
    handleOpenTreatmentModal, handleAddTreatmentRecord,

    showAddBedsModal, setShowAddBedsModal,
    addBedsForm, setAddBedsForm, addBedsErrors,
    handleOpenAddBedsModal, handleAddBeds,

    handleUpdateBedStatus,
    handleGenerateIpdBill,
  };

  return <IpdContext.Provider value={value}>{children}</IpdContext.Provider>;
}

export function useIpd() {
  const ctx = useContext(IpdContext);
  if (!ctx) throw new Error('useIpd must be used within IpdProvider');
  return ctx;
}
