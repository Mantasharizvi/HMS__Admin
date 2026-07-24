import { CalendarClock, PackageX } from 'lucide-react';
import Card from '../common/Card';

export default function QuickWidgets({ upcomingAppointments = [], expiringMedicines = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card title="Upcoming Appointments">
        <ul className="space-y-3">
          {upcomingAppointments.map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <CalendarClock className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900 truncate">{a.patient}</p>
                <p className="text-xs text-ink-600 truncate">{a.doctor}</p>
              </div>
              <span className="text-xs font-medium text-ink-600 shrink-0">{a.time}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Expiring Medicines">
        <ul className="space-y-3">
          {expiringMedicines.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center shrink-0">
                <PackageX className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900 truncate">{m.name}</p>
                <p className="text-xs text-ink-600 truncate">Batch {m.batch}</p>
              </div>
              <span className="text-xs font-medium text-danger-600 shrink-0">
                {new Date(m.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
