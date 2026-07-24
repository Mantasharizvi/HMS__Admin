import { PackagePlus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { usePharmacy } from '../../context/PharmacyContext';

export default function PurchaseEntryPage() {
  const {
    purchaseEntries, inventory,
    showPurchaseModal, setShowPurchaseModal,
    purchaseForm, setPurchaseForm, purchaseErrors,
    handleOpenPurchaseModal, handleSavePurchase,
  } = usePharmacy();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Entry"
        description="Recent medicine purchase entries from suppliers."
        action={<Button icon={PackagePlus} onClick={handleOpenPurchaseModal}>Add Purchase Entry</Button>}
      />

      <Table
        columns={[
          { key: 'purchaseCode', header: 'Purchase ID' },
          { key: 'supplier', header: 'Supplier' },
          { key: 'medicine', header: 'Medicine' },
          { key: 'qty', header: 'Qty' },
          { key: 'cost', header: 'Cost' },
        ]}
        data={purchaseEntries}
      />

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
        <Select
  label="Medicine"
  value={purchaseForm.medicine}
  onChange={(e) => {
    const medicine = e.target.value;
    const item = inventory.find((m) => m.name === medicine);
    const qty = item?.stock ?? '';
    const price = item?.purchasePrice || 0;
    setPurchaseForm({ ...purchaseForm, medicine, qty, cost: price * (Number(qty) || 0) });
  }}
  error={purchaseErrors.medicine}
  options={[
    { value: '', label: 'Select medicine' },
    ...inventory.map((m) => ({ value: m.name, label: m.name })),
  ]}
/>
      <Input
  label="Quantity"
  type="number"
  placeholder="0"
  value={purchaseForm.qty}
  onChange={(e) => {
    const qty = e.target.value;
    const item = inventory.find((m) => m.name === purchaseForm.medicine);
    const price = item?.purchasePrice || 0;
    setPurchaseForm({ ...purchaseForm, qty, cost: price * (Number(qty) || 0) });
  }}
  error={purchaseErrors.qty}
/>
  <Input
  label="Cost"
  type="number"
  placeholder="₹0.00"
  value={purchaseForm.cost}
  readOnly
  disabled
  error={purchaseErrors.cost}
/>
      </FormModal>
    </div>
  );
}
