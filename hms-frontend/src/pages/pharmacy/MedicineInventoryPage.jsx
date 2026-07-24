import { PackagePlus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { usePharmacy, inventoryColumns } from '../../context/PharmacyContext';

export default function MedicineInventoryPage() {
  const {
    inventory,
    showMedicineModal, setShowMedicineModal,
    medicineForm, setMedicineForm, medicineErrors,
    handleOpenMedicineModal, handleSaveMedicine,
  } = usePharmacy();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Inventory"
        description="Track medicine stock levels and add new medicines."
        action={<Button icon={PackagePlus} onClick={handleOpenMedicineModal}>Add Medicine</Button>}
      />

      <Table columns={inventoryColumns} data={inventory} />

      {/* Popup: Add Medicine Form */}
      <FormModal
        isOpen={showMedicineModal}
        onClose={() => setShowMedicineModal(false)}
        onSubmit={handleSaveMedicine}
        title="Add Medicine Form"
        submitLabel="Save Medicine"
      >
        <Input
          label="Medicine Name"
          placeholder="Enter medicine name"
          value={medicineForm.name}
          onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
          error={medicineErrors.name}
        />
        <Select
          label="Category"
          value={medicineForm.category}
          onChange={(e) => setMedicineForm({ ...medicineForm, category: e.target.value })}
          options={[{ value: 'Analgesic', label: 'Analgesic' }, { value: 'Antibiotic', label: 'Antibiotic' }, { value: 'Supplement', label: 'Supplement' }]}
          error={medicineErrors.category}
        />
        <Input
          label="Batch Number"
          placeholder="Enter batch number"
          value={medicineForm.batch}
          onChange={(e) => setMedicineForm({ ...medicineForm, batch: e.target.value })}
        />
        <Input
          label="Expiry Date"
          type="date"
          value={medicineForm.expiry}
          onChange={(e) => setMedicineForm({ ...medicineForm, expiry: e.target.value })}
          error={medicineErrors.expiry}
        />
        <Input
          label="Purchase Price"
          type="number"
          placeholder="₹0.00"
          value={medicineForm.purchasePrice}
          onChange={(e) => setMedicineForm({ ...medicineForm, purchasePrice: e.target.value })}
        />
        <Input
          label="Selling Price"
          type="number"
          placeholder="₹0.00"
          value={medicineForm.sellingPrice}
          onChange={(e) => setMedicineForm({ ...medicineForm, sellingPrice: e.target.value })}
        />
        <Input
          label="Initial Stock"
          type="number"
          placeholder="0"
          value={medicineForm.stock}
          onChange={(e) => setMedicineForm({ ...medicineForm, stock: e.target.value })}
          error={medicineErrors.stock}
        />
        <Select
          label="Supplier"
          value={medicineForm.supplier}
          onChange={(e) => setMedicineForm({ ...medicineForm, supplier: e.target.value })}
          options={[{ value: 'medisupply', label: 'MediSupply Co.' }, { value: 'lifecare', label: 'LifeCare Pharma' }]}
        />
      </FormModal>
    </div>
  );
}
