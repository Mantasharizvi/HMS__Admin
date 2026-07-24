import { Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { usePharmacy } from '../../context/PharmacyContext';

export default function SalesBillingPage() {
  const {
    sales, inventory,
    showSaleModal, setShowSaleModal,
    saleForm, setSaleForm, saleErrors,
    handleOpenSaleModal, handleSaveSale,
  } = usePharmacy();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Billing"
        description="Medicine sales billed to patients."
        action={<Button icon={Receipt} onClick={handleOpenSaleModal}>New Sale / Bill</Button>}
      />

      <Table
        columns={[
          { key: 'saleCode', header: 'Sales ID' },
          { key: 'patient', header: 'Patient' },
          { key: 'medicine', header: 'Medicine' },
          { key: 'qty', header: 'Qty' },
          { key: 'amount', header: 'Amount' },
        ]}
        data={sales}
      />

      <FormModal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onSubmit={handleSaveSale}
        title="New Sale / Bill"
        submitLabel="Save Sale"
      >
        <Input
          label="Patient Name"
          placeholder="Enter patient name"
          value={saleForm.patient}
          onChange={(e) => setSaleForm({ ...saleForm, patient: e.target.value })}
          error={saleErrors.patient}
        />
        <Select
  label="Medicine"
  value={saleForm.medicine}
  onChange={(e) => {
    const medicine = e.target.value;
    const item = inventory.find((m) => m.name === medicine);
    const price = item?.sellingPrice || 0;
    setSaleForm({ ...saleForm, medicine, amount: price * (Number(saleForm.qty) || 0) });
  }}
  error={saleErrors.medicine}
  options={[
    { value: '', label: 'Select medicine' },
    ...inventory.map((m) => ({ value: m.name, label: `${m.name} (${m.stock} in stock)` })),
  ]}
/>
        <Input
  label="Quantity"
  type="number"
  placeholder="0"
  value={saleForm.qty}
  onChange={(e) => {
    const qty = e.target.value;
    const item = inventory.find((m) => m.name === saleForm.medicine);
    const price = item?.sellingPrice || 0;
    setSaleForm({ ...saleForm, qty, amount: price * (Number(qty) || 0) });
  }}
  error={saleErrors.qty}
/>
       <Input
  label="Amount"
  type="number"
  placeholder="₹0.00"
  value={saleForm.amount}
  readOnly
  disabled
  error={saleErrors.amount}
/>
      </FormModal>
    </div>
  );
}
