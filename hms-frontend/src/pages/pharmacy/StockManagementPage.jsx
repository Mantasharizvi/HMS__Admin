import { Pencil, Check, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { usePharmacy } from '../../context/PharmacyContext';

export default function StockManagementPage() {
  const {
    inventory,
    editingStockId, stockValue, setStockValue,
    handleStartEditStock, handleCancelEditStock, handleSaveStock,
  } = usePharmacy();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        description="Current stock health across all medicines, connected to the database."
      />

      <div className="space-y-3">
        {inventory.map((item) => (
          <div key={item.id} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">{item.name}</p>
                {editingStockId === item.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      value={stockValue}
                      onChange={(e) => setStockValue(e.target.value)}
                      className="w-24 rounded-md border border-line px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-ink-600">{item.unit}</span>
                  </div>
                ) : (
                  <p className="text-sm text-ink-600">Current stock: {item.stock} {item.unit}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  {item.stock > 50 ? 'Healthy' : 'Reorder'}
                </span>

                {editingStockId === item.id ? (
                  <>
                    <button
                      onClick={() => handleSaveStock(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white hover:bg-teal-700"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEditStock}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-600 hover:bg-surface"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleStartEditStock(item)}
                    className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-surface"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Adjust Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {inventory.length === 0 && (
          <p className="text-sm text-ink-600">No medicines in inventory yet.</p>
        )}
      </div>
    </div>
  );
}
