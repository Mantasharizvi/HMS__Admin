import PageHeader from '../../components/common/PageHeader';
import { usePharmacy } from '../../context/PharmacyContext';

export default function ExpiryAlertsPage() {
  const { alerts } = usePharmacy();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry Alerts"
        description="Medicines nearing or past their expiry date."
      />

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.medicine} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">{alert.medicine}</p>
                <p className="text-sm text-ink-600">Expires on {alert.expiry}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{alert.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
