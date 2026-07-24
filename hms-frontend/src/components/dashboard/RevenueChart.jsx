import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatCompactINR = (v) => `₹${(v / 1000).toFixed(0)}k`;

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${formatCompactINR(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, stacked: false },
    y: {
      grid: { color: '#E4E9ED' },
      beginAtZero: true,
      ticks: { callback: formatCompactINR },
    },
  },
};

/**
 * `labels` - array of x-axis labels (e.g. months)
 * `datasets` - array of { label, data, color }
 */
export default function RevenueChart({ labels = [], datasets = [] }) {
  if (!labels.length || !datasets.length) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-ink-500">
        No revenue data yet.
      </div>
    );
  }

  const data = {
    labels,
    datasets: datasets.map((d) => ({
      label: d.label,
      data: d.data,
      backgroundColor: d.color,
      borderRadius: 4,
      maxBarThickness: 18,
    })),
  };

  return (
    <div className="h-72">
      <Bar data={data} options={options} />
    </div>
  );
}
