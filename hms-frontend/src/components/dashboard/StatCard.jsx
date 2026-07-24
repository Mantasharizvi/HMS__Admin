import * as Icons from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../common/Card';

/**
 * Single KPI card used across the dashboard stat grid.
 * `icon` is the lucide-react icon name as a string so mock data stays plain JSON.
 */
export default function StatCard({ label, value, change, trend, icon, accent }) {
  const Icon = Icons[icon] ?? Icons.Activity;
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-success-600' : 'text-danger-600';

  return (
    <Card accent={accent}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-ink-600 mb-1 truncate">{label}</p>
          <p className="font-display text-xl font-semibold text-ink-900 truncate">{value}</p>
          {change && (
            <p className={`flex items-center gap-1 text-xs mt-1.5 font-medium ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              {change}
              <span className="text-ink-400 font-normal">vs last period</span>
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
