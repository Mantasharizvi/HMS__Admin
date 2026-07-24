import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import api from '../../services/api';

ChartJS.register(ArcElement, Tooltip);

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function ServiceDistributionChart() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/dashboard/service-distribution')
      .then(({ data }) => {
        if (!cancelled) setItems(data.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load service distribution data');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="h-44 flex items-center justify-center text-sm text-ink-500">{error}</div>;
  }
  if (!items) {
    return <div className="h-44 flex items-center justify-center text-sm text-ink-500">Loading…</div>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);

  const data = {
    labels: items.map((item) => item.label),
    datasets: [
      {
        data: items.map((item) => item.value),
        backgroundColor: items.map((item) => item.color),
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${INR.format(ctx.parsed)}`,
        },
      },
    },
  };

  return (
    <div>
      <div className="relative h-44">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-lg font-semibold text-ink-900">{INR.format(total)}</span>
          <span className="text-xs text-ink-600">Total Revenue</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <li key={item.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink-600">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
              <span className="font-medium text-ink-900">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
