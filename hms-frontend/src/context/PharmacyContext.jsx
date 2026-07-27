import { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from './ToastContext';
import { validateForm, rules, isValid } from '../utils/validators';
import api from '../services/api';

const PharmacyContext = createContext(null);

// `id` is the MongoDB _id (Mongoose virtual) - used for edit/delete.
// `medicineCode`/`purchaseCode`/`saleCode` (e.g. "MED-101") are the display codes.
export const inventoryColumns = [
  { key: 'medicineCode', header: 'Medicine ID' },
  { key: 'name', header: 'Medicine' },
  { key: 'category', header: 'Category' },
  { key: 'stock', header: 'Stock' },
  { key: 'unit', header: 'Unit' },
  { key: 'expiry', header: 'Expiry' },
];

const emptyMedicine = {
  name: '', category: '', batch: '', expiry: '', purchasePrice: '', sellingPrice: '', stock: '', supplier: '',
};
const medicineSchema = {
  name: [rules.required('Medicine name is required')],
  category: [rules.required('Category is required')],
  expiry: [rules.required('Expiry date is required')],
  stock: [rules.required('Initial stock is required'), rules.numeric(), rules.positive()],
};

const emptyPurchase = { supplier: '', medicine: '', qty: '', cost: '', category: '', unit: '', expiry: '' };
const purchaseSchema = {
  supplier: [rules.required('Supplier is required')],
  medicine: [rules.required('Please select a medicine')],
  qty: [rules.required('Quantity is required'), rules.numeric(), rules.positive()],
  cost: [rules.required('Cost is required'), rules.numeric(), rules.positive()],
};

const emptySale = { patient: '', medicine: '', qty: '', amount: '' };
const saleSchema = {
  patient: [rules.required('Patient name is required')],
  medicine: [rules.required('Please select a medicine')],
  qty: [rules.required('Quantity is required'), rules.numeric(), rules.positive()],
  amount: [rules.required('Amount is required'), rules.numeric(), rules.positive()],
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export function PharmacyProvider({ children }) {
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [purchaseEntries, setPurchaseEntries] = useState([]);
  const [sales, setSales] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [medicineErrors, setMedicineErrors] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase);
  const [purchaseErrors, setPurchaseErrors] = useState({});

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState(emptySale);
  const [saleErrors, setSaleErrors] = useState({});

  const [editingStockId, setEditingStockId] = useState(null);
  const [stockValue, setStockValue] = useState('');

  // ---------- Excel-imported purchase data (dynamic columns/rows) ----------
  const [importedPurchases, setImportedPurchases] = useState([]); // rows for the Table component: [{ id, ...dynamicCols }]
  const [importedColumns, setImportedColumns] = useState([]); // [{ key, header }] derived from the uploaded file's header row
  const [isImporting, setIsImporting] = useState(false);

  // ---------- Initial data load ----------
  useEffect(() => {
    api.get('/pharmacy/inventory')
      .then((res) => setInventory(res.data.data))
      .catch(() => toast.error('Could not load inventory'));

    api.get('/pharmacy/purchases')
      .then((res) => setPurchaseEntries(res.data.data.map((p) => ({ ...p, cost: formatINR(p.cost) }))))
      .catch(() => toast.error('Could not load purchase entries'));

    api.get('/pharmacy/sales')
      .then((res) => setSales(res.data.data.map((s) => ({ ...s, amount: formatINR(s.amount) }))))
      .catch(() => toast.error('Could not load sales'));

    api.get('/pharmacy/alerts')
      .then((res) => setAlerts(res.data.data))
      .catch(() => toast.error('Could not load expiry alerts'));

    api.get('/pharmacy/purchases/import')
      .then((res) => applyImportedRows(res.data.data))
      .catch(() => toast.error('Could not load imported purchase data'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Turns backend rows ({ _id/id, data: {...} }) into Table-ready rows + dynamic columns.
  const applyImportedRows = (rows) => {
    const tableRows = rows.map((r) => ({ id: r._id || r.id, createdAt: r.createdAt, ...r.data }));
    setImportedPurchases(tableRows);

    // Build column list from the union of keys across all rows, preserving
    // first-seen order, so the table matches whatever headers were in the file.
    const seen = new Set();
    const columns = [];
    tableRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key === 'id' || key === 'createdAt' || seen.has(key)) return;
        seen.add(key);
        columns.push({ key, header: key });
      });
    });
    setImportedColumns(columns);
  };

  const handleOpenMedicineModal = () => {
    setMedicineForm(emptyMedicine);
    setMedicineErrors({});
    setShowMedicineModal(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    const errors = validateForm(medicineForm, medicineSchema);
    setMedicineErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post('/pharmacy/inventory', {
        name: medicineForm.name,
        category: medicineForm.category,
        batch: medicineForm.batch,
        expiry: medicineForm.expiry,
        purchasePrice: Number(medicineForm.purchasePrice) || 0,
        sellingPrice: Number(medicineForm.sellingPrice) || 0,
        stock: Number(medicineForm.stock),
        unit: 'Boxes',
        supplier: medicineForm.supplier,
      });
      setInventory((current) => [data.data, ...current]);
      setShowMedicineModal(false);
      toast.success(`"${data.data.name}" added to inventory`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  // ---------- Purchase entries ----------
  const handleOpenPurchaseModal = () => {
    setPurchaseForm(emptyPurchase);
    setPurchaseErrors({});
    setShowPurchaseModal(true);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    const errors = validateForm(purchaseForm, purchaseSchema);
    setPurchaseErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post('/pharmacy/purchases', {
        supplier: purchaseForm.supplier,
        medicine: purchaseForm.medicine,
        qty: Number(purchaseForm.qty),
        cost: Number(purchaseForm.cost),
        category: purchaseForm.category,
        unit: purchaseForm.unit,
        expiry: purchaseForm.expiry,
      });
      setPurchaseEntries((current) => [{ ...data.data, cost: formatINR(data.data.cost) }, ...current]);
      setShowPurchaseModal(false);
      toast.success(`Purchase entry "${data.data.purchaseCode}" saved`);

      // Stock was bumped server-side - refresh inventory to reflect it.
      api.get('/pharmacy/inventory').then((res) => setInventory(res.data.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save purchase entry');
    }
  };

  // ---------- Sales / billing ----------
  const handleOpenSaleModal = () => {
    setSaleForm(emptySale);
    setSaleErrors({});
    setShowSaleModal(true);
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    const errors = validateForm(saleForm, saleSchema);
    setSaleErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const { data } = await api.post('/pharmacy/sales', {
        patient: saleForm.patient,
        medicine: saleForm.medicine,
        qty: Number(saleForm.qty),
        amount: Number(saleForm.amount),
      });
      setSales((current) => [{ ...data.data, amount: formatINR(data.data.amount) }, ...current]);
      setShowSaleModal(false);
      toast.success(`Sale "${data.data.saleCode}" billed successfully`);

      // Stock was decremented server-side - refresh inventory to reflect it.
      api.get('/pharmacy/inventory').then((res) => setInventory(res.data.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save sale');
    }
  };

  // ---------- Stock adjustment ----------
  const handleStartEditStock = (item) => {
    setEditingStockId(item.id);
    setStockValue(String(item.stock));
  };

  const handleCancelEditStock = () => {
    setEditingStockId(null);
    setStockValue('');
  };

  const handleSaveStock = async (itemId) => {
    const nextStock = Number(stockValue);
    if (Number.isNaN(nextStock) || nextStock < 0) {
      toast.error('Enter a valid stock quantity');
      return;
    }
    try {
      const { data } = await api.put(`/pharmacy/inventory/${itemId}`, { stock: nextStock });
      setInventory((current) => current.map((i) => (i.id === itemId ? data.data : i)));
      toast.success('Stock updated');
      setEditingStockId(null);
      setStockValue('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  // ---------- Excel import (Purchase Entry "Export Data" / upload button) ----------
  const handleImportExcelFile = async (file) => {
    if (!file) return;

    const allowedExt = /\.(xlsx|xls|csv)$/i;
    if (!allowedExt.test(file.name)) {
      toast.error('Please choose a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      // defval keeps blank cells as '' instead of dropping the key entirely,
      // so every row ends up with the same set of columns.
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows.length) {
        toast.error('No data found in that file');
        return;
      }

      const { data } = await api.post('/pharmacy/purchases/import', { rows });
      applyImportedRows(data.data);
      toast.success(`Imported ${data.count} row(s) from "${file.name}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to read or import that Excel file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearImportedPurchases = async () => {
    try {
      await api.delete('/pharmacy/purchases/import');
      setImportedPurchases([]);
      setImportedColumns([]);
      toast.success('Imported purchase data cleared');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear imported data');
    }
  };

  const value = {
    inventory, purchaseEntries, sales, alerts,
    showMedicineModal, setShowMedicineModal,
    medicineForm, setMedicineForm, medicineErrors,
    showReportModal, setShowReportModal,
    handleOpenMedicineModal, handleSaveMedicine,

    showPurchaseModal, setShowPurchaseModal,
    purchaseForm, setPurchaseForm, purchaseErrors,
    handleOpenPurchaseModal, handleSavePurchase,

    showSaleModal, setShowSaleModal,
    saleForm, setSaleForm, saleErrors,
    handleOpenSaleModal, handleSaveSale,

    editingStockId, stockValue, setStockValue,
    handleStartEditStock, handleCancelEditStock, handleSaveStock,

    importedPurchases, importedColumns, isImporting,
    handleImportExcelFile, handleClearImportedPurchases,
  };

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error('usePharmacy must be used within PharmacyProvider');
  return ctx;
}