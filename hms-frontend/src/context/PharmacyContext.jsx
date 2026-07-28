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
  { key: 'purchasePrice', header: 'Purchase Price', render: (row) => formatINR(row.purchasePrice) },
  { key: 'sellingPrice', header: 'Sale Price', render: (row) => formatINR(row.sellingPrice) },
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

const emptyPurchase = { supplier: '', medicine: '', qty: '', cost: '', category: '', unit: '', expiry: '', batchNumber: '' };
const purchaseSchema = {
  supplier: [rules.required('Supplier is required')],
  medicine: [rules.required('Please select a medicine')],
  qty: [rules.required('Quantity is required'), rules.numeric(), rules.positive()],
  cost: [rules.required('Cost is required'), rules.numeric(), rules.positive()],
};

// Minimal validation for the quick-add medicine mini-form on Purchase Entry
// - just enough to satisfy the Medicine model's required fields.
const quickAddMedicineSchema = {
  name: [rules.required('Medicine name is required')],
  category: [rules.required('Category is required')],
  expiry: [rules.required('Expiry date is required')],
};

const emptySale = { patient: '' };
const saleSchema = {
  patient: [rules.required('Patient name is required')],
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Maps common Excel header variations to this app's canonical field names,
// so an uploaded "Purchase ID" / "purchase_id" / "PurchaseCode" column all
// land in the same `purchaseCode` field instead of creating duplicate columns.
const CANONICAL_KEY_MAP = {
  purchaseid: 'purchaseCode', purchasecode: 'purchaseCode', purchaseno: 'purchaseCode', purchasenumber: 'purchaseCode',
  supplier: 'supplier', suppliername: 'supplier', vendor: 'supplier', vendorname: 'supplier',
  medicine: 'medicine', medicinename: 'medicine', drug: 'medicine', drugname: 'medicine', product: 'medicine', productname: 'medicine', item: 'medicine', itemname: 'medicine',
  qty: 'qty', quantity: 'qty',
  cost: 'cost', amount: 'cost', totalcost: 'cost', totalamount: 'cost', price: 'cost',
  category: 'category',
  unit: 'unit', units: 'unit',
  expiry: 'expiry', expirydate: 'expiry', exp: 'expiry', expdate: 'expiry',
  batchnumber: 'batchNumber', batchno: 'batchNumber', batch: 'batchNumber',
};

const normalizeHeaderKey = (key) => key.toString().trim().toLowerCase().replace(/[\s_\-.]/g, '');

// Renames each row's keys to canonical field names where recognized (e.g.
// "Purchase ID" -> purchaseCode). Genuinely new columns (e.g. "Batch No")
// keep their original header text so they still show up as extra columns.
const remapExcelRow = (row) => {
  const result = {};
  Object.entries(row).forEach(([key, val]) => {
    const canonical = CANONICAL_KEY_MAP[normalizeHeaderKey(key)];
    const targetKey = canonical || key;
    // Don't let a later, less-specific synonym overwrite an already-filled canonical value
    if (result[targetKey] === undefined || result[targetKey] === '') {
      result[targetKey] = val;
    }
  });
  return result;
};

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

  // ---------- Quick-add medicine (from the Purchase Entry dropdown) ----------
  // Lets staff create a brand-new Medicine record without leaving the
  // Purchase Entry form, while still going through the real Medicine model
  // (so it gets a proper _id, duplicate-name check, etc.) instead of
  // reintroducing free-text medicine names into purchases.
  const emptyQuickAddMedicine = { name: '', category: '', expiry: '' };
  const [showQuickAddMedicineModal, setShowQuickAddMedicineModal] = useState(false);
  const [quickAddMedicineForm, setQuickAddMedicineForm] = useState(emptyQuickAddMedicine);
  const [quickAddMedicineErrors, setQuickAddMedicineErrors] = useState({});

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
      // purchaseForm.medicine now holds the selected Medicine's _id (see
      // PurchaseEntryPage's SearchableSelect) - the backend resolves the
      // display name from that id itself, so it isn't sent here.
      const { data } = await api.post('/pharmacy/purchases', {
        supplier: purchaseForm.supplier,
        medicineId: purchaseForm.medicine,
        qty: Number(purchaseForm.qty),
        cost: Number(purchaseForm.cost),
        category: purchaseForm.category,
        unit: purchaseForm.unit,
        expiry: purchaseForm.expiry,
        batchNumber: purchaseForm.batchNumber,
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

  // ---------- Quick-add medicine ----------
  const handleOpenQuickAddMedicine = () => {
    setQuickAddMedicineForm(emptyQuickAddMedicine);
    setQuickAddMedicineErrors({});
    setShowQuickAddMedicineModal(true);
  };

  // `onCreated(newMedicineId)` lets the caller (Purchase Entry page)
  // auto-select the medicine it just created, instead of making the user
  // re-open the dropdown and find it themselves.
  const handleQuickAddMedicine = async (e, onCreated) => {
    e.preventDefault();
    const errors = validateForm(quickAddMedicineForm, quickAddMedicineSchema);
    setQuickAddMedicineErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      // Starts at 0 stock on purpose - the purchase entry being saved right
      // after this is what actually brings stock in (via /pharmacy/purchases).
      const { data } = await api.post('/pharmacy/inventory', {
        name: quickAddMedicineForm.name,
        category: quickAddMedicineForm.category,
        expiry: quickAddMedicineForm.expiry,
        stock: 0,
        unit: 'Boxes',
      });
      setInventory((current) => [data.data, ...current]);
      setShowQuickAddMedicineModal(false);
      toast.success(`"${data.data.name}" added to inventory`);
      onCreated?.(data.data.id || data.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add medicine');
    }
  };

  // ---------- Sales / billing ----------
  const handleOpenSaleModal = () => {
    setSaleForm(emptySale);
    setSaleErrors({});
    setShowSaleModal(true);
  };

// `items` = [{ medicine, qty, amount }, ...] - one bill can now carry several
  // medicines. The backend's Sale record only holds one medicine per row, so
  // each cart item is posted as its own sale (all sharing the same patient
  // name) instead of changing the backend schema.
  const handleSaveSale = async (e, items, onSaved) => {
    e.preventDefault();
    const errors = validateForm(saleForm, saleSchema);
    setSaleErrors(errors);
    if (!isValid(errors)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (!items || items.length === 0) {
      toast.error('Please add at least one medicine to the bill');
      return;
    }
try {
      // One billCode per "Save Sale" click - shared by every item in this bill
      // so the Sales Billing table can later group them back into one row.
      const billCode = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const savedSales = [];
      for (const item of items) {
        const { data } = await api.post('/pharmacy/sales', {
          patient: saleForm.patient,
          medicineId: item.medicineId,
          qty: Number(item.qty),
          amount: Number(item.amount),
          billCode,
        });
        savedSales.push({ ...data.data, amount: formatINR(data.data.amount) });
      }
      setSales((current) => [...savedSales, ...current]);
      setShowSaleModal(false);
      toast.success(`${savedSales.length} medicine(s) billed successfully`);
      onSaved?.();

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
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rawRows.length) {
        toast.error('No data found in that file');
        return;
      }

      // Normalize headers (e.g. "Purchase ID" -> purchaseCode) so imported
      // rows line up with the manual-entry table instead of creating duplicate columns.
      const rows = rawRows.map(remapExcelRow);

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

    showQuickAddMedicineModal, setShowQuickAddMedicineModal,
    quickAddMedicineForm, setQuickAddMedicineForm, quickAddMedicineErrors,
    handleOpenQuickAddMedicine, handleQuickAddMedicine,

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