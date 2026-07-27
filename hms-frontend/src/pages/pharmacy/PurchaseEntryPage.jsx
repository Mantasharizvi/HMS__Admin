import { useRef } from 'react';
import { PackagePlus, UploadCloud, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { usePharmacy } from '../../context/PharmacyContext';

export default function PurchaseEntryPage() {
  const {
    purchaseEntries,
    showPurchaseModal, setShowPurchaseModal,
    purchaseForm, setPurchaseForm, purchaseErrors,
    handleOpenPurchaseModal, handleSavePurchase,
    importedPurchases, importedColumns, isImporting,
    handleImportExcelFile, handleClearImportedPurchases,
  } = usePharmacy();

  const fileInputRef = useRef(null);

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleImportExcelFile(file);
    e.target.value = ''; // allow re-selecting the same file again later
  };

  // ---------- Merge manual entries + Excel-imported rows into one table ----------
  // Batch-number columns can arrive under several raw header spellings from
  // older Excel imports (e.g. "Batch No", "Batch"). This checks all known
  // variations so they all land in the same single displayed column.
  const BATCH_SYNONYMS = new Set(['batchnumber', 'batchno', 'batch']);
  const normalizeKey = (k) => k.toString().trim().toLowerCase().replace(/[\s_\-.]/g, '');

  const baseColumns = [
    { key: 'source', header: 'Source', render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.source === 'Excel Import' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'}`}>
        {row.source}
      </span>
    ) },
    { key: 'purchaseCode', header: 'Purchase ID', render: (row) => row.purchaseCode || '—' },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier || '—' },
    { key: 'medicine', header: 'Medicine', render: (row) => row.medicine || '—' },
    { key: 'qty', header: 'Qty', render: (row) => row.qty ?? '—' },
    { key: 'cost', header: 'Cost', render: (row) => row.cost ?? '—' },
    { key: 'category', header: 'Category', render: (row) => row.category || '—' },
    { key: 'unit', header: 'Unit', render: (row) => row.unit || '—' },
    { key: 'expiry', header: 'Expiry Date', render: (row) => row.expiry || '—' },
    { key: 'batchNumber', header: 'Batch No', render: (row) => {
        if (row.batchNumber) return row.batchNumber;
        const match = Object.entries(row).find(([k]) => BATCH_SYNONYMS.has(normalizeKey(k)));
        return (match && match[1]) || '—';
      },
    },
  ];
  const baseKeys = new Set(baseColumns.map((c) => c.key));

  // Any extra columns that came from the uploaded Excel headers (e.g. "Invoice No")
  // that don't match one of the base columns above get appended too. Batch-number
  // variations are excluded here since they're already merged into the column above.
  const extraColumns = importedColumns
    .filter((c) => !baseKeys.has(c.key) && !BATCH_SYNONYMS.has(normalizeKey(c.key)))
    .map((c) => ({ ...c, render: (row) => (row[c.key] === '' || row[c.key] == null ? '—' : row[c.key]) }));

  const combinedColumns = [...baseColumns, ...extraColumns];

  const combinedData = [
    ...purchaseEntries.map((p) => ({ ...p, source: 'Manual' })),
    ...importedPurchases.map((r) => ({ ...r, source: 'Excel Import' })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Entry"
        description="Recent medicine purchase entries from suppliers — added manually or imported from Excel."
        action={
          <div className="flex gap-2">
            {/* Hidden file input - the visible button just triggers this */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button icon={UploadCloud} variant="secondary" onClick={handleBrowseClick} disabled={isImporting}>
              {isImporting ? 'Importing…' : 'Export Data'}
            </Button>
            <Button icon={PackagePlus} onClick={handleOpenPurchaseModal}>Add Purchase Entry</Button>
          </div>
        }
      />

      {importedPurchases.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearImportedPurchases}
            className="flex items-center gap-1 text-xs text-red-600 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear imported Excel data
          </button>
        </div>
      )}

      <Table columns={combinedColumns} data={combinedData} />

      <FormModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSubmit={handleSavePurchase}
        title="Add Purchase Entry"
        submitLabel="Save Purchase Entry"
      >
        <Input
          label="Supplier"
          placeholder="Enter supplier name"
          value={purchaseForm.supplier}
          onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
          error={purchaseErrors.supplier}
        />
        <Input
  label="Medicine"
  placeholder="Enter medicine name"
  value={purchaseForm.medicine}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, medicine: e.target.value })}
  error={purchaseErrors.medicine}
/>
      <Input
  label="Category"
  placeholder="e.g. Antibiotics"
  value={purchaseForm.category}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })}
/>
      <Input
  label="Unit"
  placeholder="e.g. Boxes, Strips"
  value={purchaseForm.unit}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, unit: e.target.value })}
/>
      <Input
  label="Expiry Date"
  type="date"
  value={purchaseForm.expiry}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, expiry: e.target.value })}
/>
      <Input
  label="Batch Number"
  placeholder="Enter batch number"
  value={purchaseForm.batchNumber}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, batchNumber: e.target.value })}
/>
      <Input
  label="Quantity"
  type="number"
  placeholder="0"
  value={purchaseForm.qty}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })}
  error={purchaseErrors.qty}
/>
  <Input
  label="Cost"
  type="number"
  placeholder="₹0.00"
  value={purchaseForm.cost}
  onChange={(e) => setPurchaseForm({ ...purchaseForm, cost: e.target.value })}
  error={purchaseErrors.cost}
/>
      </FormModal>
    </div>
  );
}
