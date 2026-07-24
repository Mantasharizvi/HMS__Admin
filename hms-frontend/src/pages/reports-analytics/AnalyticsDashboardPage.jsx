import { TrendingUp, PieChart } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import RevenueTrendChart from '../../components/reports/RevenueTrendChart';
import ServiceDistributionChart from '../../components/reports/ServiceDistributionChart';

export default function AnalyticsDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Revenue trend and service distribution at a glance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-ink-900">Revenue Trend</h4>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <RevenueTrendChart />
        </div>

        <div className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-ink-900">Service Distribution</h4>
            <PieChart className="w-4 h-4 text-teal-600" />
          </div>
          <ServiceDistributionChart />
        </div>
      </div>
    </div>
  );
}
