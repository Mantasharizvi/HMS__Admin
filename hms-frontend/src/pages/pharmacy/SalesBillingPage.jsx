import { useState } from 'react';
import { Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchableSelect from '../../components/common/SearchableSelect';
import Table from '../../components/common/Table';
import FormModal from '../../components/common/FormModal';
import { usePharmacy } from '../../context/PharmacyContext';
import { useToast } from '../../context/ToastContext';

export default function SalesBillingPage() {
  const {
    sales, inventory,
    showSaleModal, setShowSaleModal,
    saleForm, setSaleForm, saleErrors,
    handleOpenSaleModal, handleSaveSale,
  } = usePharmacy();
  const toast = useToast();

  // ---------- Multiple medicines per bill (cart) ----------
  const [cartMedicine, setCartMedicine] = useState('');
  const [cartQty, setCartQty] = useState('');
  const [cartItems, setCartItems] = useState([]);

  const medicineOptions = inventory.map((m) => ({
    value: m.name,
    label: `${m.name} (${m.stock} in stock)`,
  }));

  const resetCart = () => {
    setCartItems([]);
    setCartMedicine('');
    setCartQty('');
  };

  const handleOpenModal = () => {
    resetCart();
    handleOpenSaleModal();
  };

  const handleCloseModal = () => {
    setShowSaleModal(false);
    resetCart();
  };

  const handleAddCartItem = () => {
    if (!cartMedicine) {
      toast.error('Please select a medicine');
      return;
    }
    if (!cartQty || Number(cartQty) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    const item = inventory.find((m) => m.name === cartMedicine);
    const price = item?.sellingPrice || 0;
    const amount = price * Number(cartQty);

    setCartItems([...cartItems, { medicine: cartMedicine, qty: Number(cartQty), amount }]);
    setCartMedicine('');
    setCartQty('');
  };

  const handleRemoveCartItem = (indexToRemove) => {
    setCartItems(cartItems.filter((_, index) => index !== indexToRemove));
  };

  const billTotal = cartItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmitBill = (e) => {
    handleSaveSale(e, cartItems, resetCart);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Billing"
        description="Medicine sales billed to patients."
        action={<Button icon={Receipt} onClick={handleOpenModal}>New Sale / Bill</Button>}
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
        onClose={handleCloseModal}
        onSubmit={handleSubmitBill}
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

        {/* ---------- Added Medicines Panel ---------- */}
        {cartItems.length > 0 && (
          <div className="rounded-lg border border-line bg-surface p-3">
            <label className="block text-xs font-semibold text-ink-600 mb-2">Added Medicines:</label>
            <div className="space-y-2">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md bg-white border border-line px-3 py-2 text-sm"
                >
                  <span className="text-ink-900">{item.medicine} × {item.qty}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-ink-900">₹{item.amount.toLocaleString('en-IN')}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCartItem(index)}
                      className="rounded-full p-0.5 hover:bg-teal-100 text-teal-600 hover:text-teal-900 font-bold transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-line flex justify-between text-sm font-semibold text-ink-900">
              <span>Total</span>
              <span>₹{billTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* ---------- Medicine + Quantity + Add button ---------- */}
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
          <div className="flex-1 w-full">
            <SearchableSelect
              label="Medicine"
              placeholder="Search medicine…"
              value={cartMedicine}
              onChange={setCartMedicine}
              options={medicineOptions}
            />
          </div>
          <div className="w-full sm:w-32">
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              value={cartQty}
              onChange={(e) => setCartQty(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-[42px] shrink-0 sm:mb-0.5 w-full sm:w-auto"
            onClick={handleAddCartItem}
          >
            + Add
          </Button>
        </div>

        <Input
          label="Bill Amount"
          type="number"
          placeholder="₹0.00"
          value={billTotal}
          readOnly
          disabled
        />
      </FormModal>
    </div>
  );
}