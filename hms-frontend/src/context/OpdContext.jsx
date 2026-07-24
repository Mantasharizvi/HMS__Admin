import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { validateForm, rules, isValid } from '../utils/validators';
import { printInvoice } from '../utils/printInvoice';
import api from '../services/api';

const OpdContext = createContext(null);

const emptyPatient = { name: '', mobile: '', age: '', gender: '', department: '', doctor: '', complaint: '' };
const patientSchema = {
  name: [rules.required('Patient name is required')],
  mobile: [rules.required('Mobile number is required'), rules.phone()],
  age: [rules.required('Age is required'), rules.numeric(), rules.positive()],
};

const emptyAppointment = { patient: '', doctor: '', department: '', date: '', time: '', reason: '', type: 'offline', status: 'pending' };
const appointmentSchema = {
  patient: [rules.required('Please select a patient')],
  doctor: [rules.required('Please select a doctor')],
  date: [rules.required('Date is required')],
  time: [rules.required('Time slot is required')],
};

const emptyConsultation = {
  patientid: '', notes: '', reviewDate: '', medicine: '', consultationFee: '', labCharges: '', medicineCharges: '',
};

// `id` on every record below is the MongoDB _id (added automatically by
// Mongoose as a virtual). It's what edit/delete/view actions key off of.
// Human-readable display codes (e.g. "OPD-101") live in patientCode/appointmentCode.
export const appointmentColumns = [
  { key: 'appointmentCode', header: 'Appointment ID' },
  { key: 'patient', header: 'Patient Name' },
  { key: 'doctor', header: 'Doctor' },
  { key: 'department', header: 'Department' },
  { key: 'date', header: 'Date' },
  { key: 'time', header: 'Time Slot' },
  { key: 'status', header: 'Status' },
  { key: 'payment', header: 'Payment Status' },
];

// Map a Patient document from the API to the shape the UI expects
// (adds a `visit` alias for the backend's `visitTime` field).
const mapPatient = (p) => ({ ...p, visit: p.visitTime });

export function OpdProvider({ children }) {
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [patientErrors, setPatientErrors] = useState({});

  const [appointments, setAppointments] = useState([]);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
  const [appointmentErrors, setAppointmentErrors] = useState({});
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  const [viewAppointment, setViewAppointment] = useState(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const [prescriptions, setPrescriptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [consultation, setConsultation] = useState(emptyConsultation);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [consultations, setConsultations] = useState([]);

  // ---------- Initial data load ----------
  useEffect(() => {
    api.get('/opd/patients')
      .then((res) => setPatients(res.data.data.map(mapPatient)))
      .catch(() => toast.error('Could not load patients from the server'));

    api.get('/opd/appointments')
      .then((res) => setAppointments(res.data.data))
      .catch(() => toast.error('Could not load appointments from the server'));

    // Registered doctors, for the Appointment / Consultation doctor dropdowns
   // Registered doctors, for the Appointment / Consultation doctor dropdowns.
    // Uses the dedicated /users/doctors endpoint (open to Admin/Receptionist/
    // Doctor/Nurse) instead of the general /users list, which is Admin-only.
    api.get('/users/doctors')
      .then((res) => setDoctors(res.data.data))
      .catch(() => toast.error('Could not load the registered doctors list'));

    // Registered departments (from Hospital Settings), for the Patient
    // Registration department dropdown. Uses the read-only /settings/departments
    // endpoint, open to every authenticated role — not the Admin-only
    // /settings/hospital endpoint.
    api.get('/settings/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => toast.error('Could not load the registered departments list'));

    // All consultation records, so the Billing/Invoice page can list only
    // patients who have an actual Doctor Consultation on file.
    api.get('/opd/consultations')
      .then((res) => setConsultations(res.data.data))
      .catch(() => toast.error('Could not load consultation records'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull the selected patient's history + latest consultation whenever the
  // doctor picks a patient in Doctor Consultation / Billing.
  useEffect(() => {
    if (!consultation.patientid) return;

    api.get(`/opd/patients/${consultation.patientid}`)
      .then((res) => setHistory(res.data.data.history || []))
      .catch((err) => {
        console.error('Failed to load patient history:', err);
        toast.error(err.response?.data?.message || 'Could not load patient history');
      });

    api.get('/opd/consultations', { params: { patient: consultation.patientid } })
      .then((res) => {
        const latest = res.data.data[0];
        setPrescriptions(latest?.prescriptions || []);
      })
      .catch((err) => {
        console.error('Failed to load prescriptions:', err);
        toast.error(err.response?.data?.message || 'Could not load prescriptions');
      });
  }, [consultation.patientid]);

  // Standalone loader used by the Prescription and Patient History pages,
  // so they can show a chosen patient's real DB records without requiring
  // the doctor to first go through the Consultation screen.
  const loadPatientRecords = useCallback(async (patientId) => {
    if (!patientId) {
      setHistory([]);
      setPrescriptions([]);
      return;
    }
    try {
      const [patientRes, consultRes] = await Promise.all([
        api.get(`/opd/patients/${patientId}`),
        api.get('/opd/consultations', { params: { patient: patientId } }),
      ]);
      setHistory(patientRes.data.data.history || []);
      setPrescriptions(consultRes.data.data[0]?.prescriptions || []);
    } catch (err) {
      console.error('Failed to load patient records:', err);
      toast.error(err.response?.data?.message || 'Could not load records for that patient');
    }
  }, [toast]);

  // ---------- Patient registration ----------
  const handleOpenPatientModal = () => {
    setPatientForm(emptyPatient);
    setPatientErrors({});
    setShowPatientModal(true);
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    const errors = validateForm(patientForm, patientSchema);
    setPatientErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post('/opd/patients', {
        ...patientForm,
        gender: patientForm.gender
          ? patientForm.gender.charAt(0).toUpperCase() + patientForm.gender.slice(1)
          : '',
      });
      setPatients((current) => [mapPatient(data.data), ...current]);
      setShowPatientModal(false);
      toast.success(`Patient "${data.data.name}" registered successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register patient');
    }
  };

  // ---------- Appointment management ----------
  const handleOpenNewAppointment = () => {
    setEditingAppointmentId(null);
    setAppointmentForm(emptyAppointment);
    setAppointmentErrors({});
    setIsAppointmentModalOpen(true);
  };

  const handleOpenEditAppointment = (row) => {
    setEditingAppointmentId(row.id);
    setAppointmentForm({
      patient: row.patient, doctor: row.doctor, department: row.department,
      date: row.date, time: row.time, reason: row.reason || '',
      type: row.type?.toLowerCase() || 'offline', status: row.status?.toLowerCase() || 'pending',
    });
    setAppointmentErrors({});
    setIsAppointmentModalOpen(true);
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    const errors = validateForm(appointmentForm, appointmentSchema);
    setAppointmentErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    const statusLabel = appointmentForm.status === 'confirmed' ? 'Confirmed' : 'Pending';
    const typeLabel = appointmentForm.type === 'online' ? 'Online' : 'Offline';
    const payload = { ...appointmentForm, status: statusLabel, type: typeLabel };

    try {
      if (editingAppointmentId) {
        const { data } = await api.put(`/opd/appointments/${editingAppointmentId}`, payload);
        setAppointments((current) =>
          current.map((a) => (a.id === editingAppointmentId ? data.data : a))
        );
        toast.success('Appointment updated successfully');
      } else {
        const { data } = await api.post('/opd/appointments', { ...payload, payment: 'Unpaid' });
        setAppointments((current) => [data.data, ...current]);
        toast.success('Appointment created successfully');
      }
      setIsAppointmentModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save appointment');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/opd/appointments/${deleteAppointmentId}`);
      setAppointments((current) => current.filter((a) => a.id !== deleteAppointmentId));
      toast.success('Appointment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete appointment');
    } finally {
      setDeleteAppointmentId(null);
    }
  };

  // ---------- Consultation ----------
  const handleSaveConsultation = useCallback(async (prescriptionList) => {
    if (!consultation.patientid) {
      toast.error('Please select a patient first');
      return;
    }
    try {
      const { data } = await api.post('/opd/consultations', {
        patient: consultation.patientid,
        notes: consultation.notes,
        reviewDate: consultation.reviewDate,
        consultationFee: Number(consultation.consultationFee) || 500,
        prescriptions: prescriptionList.map((p) => ({
          medicine: p.medicine,
          dosage: p.detail?.split(' - ')[0] || '',
          duration: p.detail?.split(' - ')[1] || p.detail || '',
        })),
      });
      setPrescriptions(data.data.prescriptions);
      setConsultations((current) => [data.data, ...current]);

      // Consultation save also logs an entry to the patient's history on
      // the backend — pull it so Patient History reflects it right away.
      try {
        const patientRes = await api.get(`/opd/patients/${consultation.patientid}`);
        setHistory(patientRes.data.data.history || []);
      } catch (err) {
        console.error('Failed to refresh patient history:', err);
      }

      toast.success('Consultation saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save consultation');
    }
  }, [consultation, toast]);

  // ---------- Billing ----------
  const handleGenerateInvoice = async () => {
    const selected = patients.find((p) => p.id === consultation.patientid);
    const lineItems = [
      { label: 'Consultation Fee', amount: Number(consultation.consultationFee) || 500 },
      { label: 'Lab Charges', amount: Number(consultation.labCharges) || 300 },
      { label: 'Medicine Charges', amount: Number(consultation.medicineCharges) || 420 },
    ];
    const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

    printInvoice({
      title: 'OPD Invoice',
      invoiceNo: `INV-OPD-${Date.now().toString().slice(-6)}`,
      patientName: selected?.name || 'Walk-in Patient',
      lineItems,
      total,
    });

    try {
      await api.post('/billing', { type: 'OPD', patient: selected?.name || 'Walk-in Patient', lineItems, total });
    } catch (err) {
      // Non-fatal: the invoice already printed; just flag that it won't
      // appear on the revenue dashboard.
      toast.error('Invoice printed, but could not be saved for reporting');
      return;
    }
    toast.success('Invoice sent to printer');
  };

  const value = {
    patients, setPatients,
    showPatientModal, setShowPatientModal,
    patientForm, setPatientForm,
    patientErrors,
    handleOpenPatientModal, handleRegisterPatient,

    appointments,
    isAppointmentModalOpen, setIsAppointmentModalOpen,
    appointmentForm, setAppointmentForm,
    appointmentErrors, editingAppointmentId,
    viewAppointment, setViewAppointment,
    deleteAppointmentId, setDeleteAppointmentId,
    showExportModal, setShowExportModal,
    handleOpenNewAppointment, handleOpenEditAppointment,
    handleSaveAppointment, handleConfirmDelete,

    prescriptions,
    history,
    consultation, setConsultation,
    handleSaveConsultation,
    loadPatientRecords,

    doctors,
    departments,
    consultations,

    handleGenerateInvoice,
  };

  return <OpdContext.Provider value={value}>{children}</OpdContext.Provider>;
}

export function useOpd() {
  const ctx = useContext(OpdContext);
  if (!ctx) throw new Error('useOpd must be used within OpdProvider');
  return ctx;
}
