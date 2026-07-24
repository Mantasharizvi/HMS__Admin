import { AlertTriangle, Info, CheckCircle2, XCircle, Bell } from 'lucide-react';
import Card from '../common/Card';

const iconByType = {
  warning: { icon: AlertTriangle, color: '#B87A17', bg: '#FCF3E3' },
  danger: { icon: XCircle, color: '#C7423C', bg: '#FBEAE9' },
  success: { icon: CheckCircle2, color: '#218A5D', bg: '#E8F7F0' },
  info: { icon: Info, color: '#14899E', bg: '#F0F9FA' },
};

export default function NotificationsPanel({ items = [] }) {
  return (
    <Card
      title="Notifications"
      action={
        <span className="flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
          <Bell className="w-3 h-3" /> {items.length} new
        </span>
      }
    >
      <ul className="space-y-3 -mx-1 max-h-56 overflow-y-auto pr-1">
        {items.map((n) => {
          const { icon: Icon, color, bg } = iconByType[n.type] ?? iconByType.info;
          return (
            <li key={n.id} className="flex gap-3 px-1 py-1.5 rounded-lg hover:bg-surface/60 transition-colors">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: bg, color }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                <p className="text-xs text-ink-600 line-clamp-1">{n.message}</p>
                <p className="text-[11px] text-ink-400 mt-0.5">{n.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
